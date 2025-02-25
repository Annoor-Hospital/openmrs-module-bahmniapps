'use strict';

angular.module('bahmni.common.displaycontrol.pacs')
    .directive('pacs', ['pacsOrderService', 'orderTypeService', 'pacsStudyService', 'radiologyNoteService', 'encounterService', 'visitService', 'ngDialog', 'spinner', '$rootScope', 'messagingService', '$translate', '$window', '$q',
        function (pacsOrderService, orderTypeService, pacsStudyService, radiologyNoteService, encounterService, visitService, ngDialog, spinner, $rootScope, messagingService, $translate, $window, $q) {
            var controller = function ($scope) {
                $scope.print = $rootScope.isBeingPrinted || false;
                $scope.orderTypeUuid = orderTypeService.getOrderTypeUuid($scope.orderType);

                var getPacsOrders = function () {
                    var params = {
                        patientUuid: $scope.patient.uuid,
                        visitUuid: $scope.visitUuid
                    };
                    return pacsOrderService.getOrdersByPatient(params);
                };
                var getPacsStudies = function () {
                    var params = {
                        patientid: $scope.patient.identifier, // .replace(/[a-zA-Z]+/g, ""),
                        date: null
                    };
                    return pacsStudyService.getStudies(params);
                };
                var getRadiologyNotes = function () {
                    var params = {
                        patientuuid: $scope.patient.uuid
                    };
                    return radiologyNoteService.getRadiologyNotes(params);
                };
                var getOrders = function () {
                    var promises = [getPacsOrders(), getPacsStudies(), getRadiologyNotes()];
                    return $q.all(promises).then(function (data) {
                        var pacsOrders = Bahmni.Common.Orders.CombinedPacsOrderList(data[0], data[1], data[2]);
                        if ($scope.visitUuid) {
                            // When showing orders for a visit, don't show pending orders
                            pacsOrders = pacsOrders.filter(function (order) {
                                order.orderUuid;
                            });
                        }
                        if ($scope.config.limit && $scope.config.limit > 0) {
                            pacsOrders = pacsOrders.slice(0, $scope.config.limit);
                        }
                        pacsOrders.forEach(function (order) {
                            if ("studyUid" in order) order.imageUrl = getImageUrl(order);
                        });
                        $scope.pacsOrders = pacsOrders;
                    });
                };

                var init = function () {
                    return getOrders().then(function () {
                        if (_.isEmpty($scope.pacsOrders)) {
                            $scope.noOrdersMessage = $scope.orderType;
                            $scope.$emit("no-data-present-event");
                        }
                    });
                };

                var getImageUrl = function (pacsOrder) {
                    var pacsImageTemplate = $scope.config.pacsImageUrl || "";
                    return pacsImageTemplate.replace('{{studyUID}}', pacsOrder.studyUid);
                };

                $scope.deleteConfirm = function (order) {
                    $scope.targetOrder = order;
                    ngDialog.openConfirm({template: '/bahmni/common/displaycontrols/pacs/views/deleteConfirmation.html', scope: $scope});
                };

                $scope.closeDialogue = function () {
                    ngDialog.close();
                    delete $scope.targetOrder;
                };

                $scope.deleteOrder = function () {
                    // Basic task is to retrieve the encounter to which this order belongs, delete the order, and re-save the encounter.
                    // The trouble is that a bahmni order (which is what we have access to here) doesn't have the encounter uuid data in it. This is frustrating.
                    // encounterService.findByEncounterUuid($scope.observation.encounterUuid)

                    // encounter needs orders, providers,
                    var promise = encounterService.findByOrderUuid($scope.targetOrder.orderUuid);
                    spinner.forPromise(promise).then(function (data) {
                        var encounter = data.data;
                        // find this particular order and mark it for deletion
                        // need encounter.orders[i].uuid = $scope.targetOrder.orderUuid
                        var i = encounter.orders.findIndex(function (order) {
                            return order.uuid == $scope.targetOrder.orderUuid;
                        });
                        encounter.orders = [Bahmni.Clinical.Order.discontinue(encounter.orders[i])];
                        encounter.observations = [];
                        return encounterService.create(encounter);
                    }).then(function (data) {
                        $rootScope.hasVisitedConsultation = false;
                        var i = $scope.pacsOrders.indexOf($scope.targetOrder);
                        $scope.pacsOrders.splice(i, 1);
                        ngDialog.close();
                        messagingService.showMessage('info', $translate.instant("CLINICAL_TEMPLATE_REMOVED_SUCCESS_KEY", {label: "Order"}));
                    });
                };

                $scope.getUrl = function (orderNumber, studyUid) {
                    var pacsImageTemplate = $scope.config.pacsImageUrl || "";
                    return pacsImageTemplate
                        .replace('{{patientID}}', $scope.patient.identifier)
                        .replace('{{studyUID}}', studyUid)
                        .replace('{{orderNumber}}', orderNumber);
                };

                $scope.getLabel = function (pacsOrder) {
                    return pacsOrder.concept.shortName || pacsOrder.concept.name;
                };

                $scope.openImage = function (pacsOrder) {
                    alert("test");
                    var url = pacsOrder.pacsImageUrl;
                    $window.open(url, "XrayViewer");
                };

                $scope.initialization = init();
            };

            var link = function ($scope, element) {
                spinner.forPromise($scope.initialization, element);
            };

            return {
                restrict: 'E',
                controller: controller,
                link: link,
                templateUrl: "../common/displaycontrols/pacs/views/pacs.html",
                scope: {
                    patient: "=",
                    section: "=",
                    orderType: "=",
                    orderUuid: "=",
                    config: "=",
                    visitUuid: "="
                }
            };
        }
    ]);
