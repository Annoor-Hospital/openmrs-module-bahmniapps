'use strict';

angular.module('bahmni.common.displaycontrol.pacs')
    .directive('pacs', ['pacsOrderService', 'orderTypeService', 'pacsService', 'radiologyObsService', 'encounterService', 'visitService', 'ngDialog', 'spinner', '$rootScope', 'messagingService', '$translate', '$window', '$q',
        function (pacsOrderService, orderTypeService, pacsService, radiologyObsService, encounterService, visitService, ngDialog, spinner, $rootScope, messagingService, $translate, $window, $q) {
            var controller = function ($scope) {
                $scope.print = $rootScope.isBeingPrinted || false;
                $scope.orderTypeUuid = orderTypeService.getOrderTypeUuid($scope.orderType);

                var includeAllObs = true;
                var getOpenMRSOrders = function () {
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
                    return pacsService.getStudies(params);
                };
                var getRadiologyObs = function () {
                    var params = {
                        patientuuid: $scope.patient.uuid
                    };
                    return radiologyObsService.getObs(params);
                };
                var getOrders = function () {
                    var p1 = getOpenMRSOrders();
                    var p2 = getPacsStudies();
                    var p3 = getRadiologyObs();
                    return $q.all([p1, p2, p3]).then(function (data) {
                        var orders = data[0];
                        var studies = data[1];
                        var obs = data[2];
                        radiologyObsService.addObsToOrders(obs, studies);
                        var orderList = Bahmni.Common.Orders.CombinedOrderList(orders, studies);
                        if ($scope.visitUuid) {
                            orderList = orderList.filter(function (order) {
                                order.orderUuid;
                            });
                        }
                        if ($scope.config.limit && $scope.config.limit > 0) { orderList = orderList.slice(0, $scope.config.limit); }
                        orderList.forEach(function (order) {
                            if ("studyUid" in order) order.imageUrl = getImageUrl(order);
                        });
                        $scope.bahmniOrders = orderList;
                    });
                };

                var init = function () {
                    return getOrders().then(function () {
                        if (_.isEmpty($scope.bahmniOrders)) {
                            $scope.noOrdersMessage = $scope.orderType;
                            $scope.$emit("no-data-present-event");
                        }
                    });
                };

                var getImageUrl = function (bahmniOrder) {
                    var pacsImageTemplate = $scope.config.pacsImageUrl || "";
                    return pacsImageTemplate.replace('{{studyUID}}', bahmniOrder.studyUid);
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
                        var i = $scope.bahmniOrders.indexOf($scope.targetOrder);
                        $scope.bahmniOrders.splice(i, 1);
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

                $scope.getLabel = function (bahmniOrder) {
                    return bahmniOrder.concept.shortName || bahmniOrder.concept.name;
                };

                $scope.openImage = function (bahmniOrder) {
                    alert("test");
                    var url = bahmniOrder.pacsImageUrl;
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
