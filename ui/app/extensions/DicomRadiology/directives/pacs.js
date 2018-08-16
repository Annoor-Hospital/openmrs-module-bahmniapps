'use strict';

angular.module('bahmni.DicomRadiology.pacs')
    .directive('pacs', ['pacsOrderService', 'orderTypeService', 'pacsService', 'radiologyObsService', 'encounterService', 'visitService', 'ngDialog', 'spinner', '$rootScope', 'messagingService', '$translate', '$window', '$q',
        function (pacsOrderService, orderTypeService, pacsService, radiologyObsService, encounterService, visitService, ngDialog, spinner, $rootScope, messagingService, $translate, $window, $q) {
            var controller = function ($scope) {
                $scope.print = $rootScope.isBeingPrinted || false;
                console.log($scope);

                var getOpenMRSOrders = function () {
                    var params = {
                        patientUuid: $scope.patient.uuid,
                        visitUuid: $scope.visit.uuid,
                        encounterUuid: $scope.encounter.uuid
                    };
                    return pacsOrderService.getOrdersByPatient(params);
                };
                var getPacsStudies = function () {
                    var params = {
                        patientid: $scope.patient.identifier, //.replace(/[a-zA-Z]+/g, ""),
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
                        var orderList = Bahmni.DicomRadiology.CombinedOrderList(orders, studies);
                        if($scope.visit.uuid)
                            orderList = orderList.filter(order => order.orderUuid);
                        if($scope.contextConfig.limit && $scope.contextConfig.limit > 0)
                            orderList = orderList.slice(0,$scope.contextConfig.limit);
                        orderList.forEach(function (order) {
                            if ("studyUid" in order) order.imageUrl = getImageUrl(order);
                        });
                        $scope.bahmniOrders = orderList;
                    });
                };

                var init = function () {
                    return getOrders().then(function () {
                        if (_.isEmpty($scope.bahmniOrders)) {
                            $scope.noOrdersMessage = $scope.config.orderType;
                            $scope.$emit("no-data-present-event");
                        }
                    });
                };

                var getImageUrl = function (bahmniOrder) {
                    var pacsImageTemplate = $scope.contextConfig.pacsImageUrl || "";
                    return pacsImageTemplate.replace('{{studyUID}}', bahmniOrder.studyUid);
                };


                $scope.deleteConfirm = function (order) {
                    $scope.targetOrder = order;
                    ngDialog.openConfirm({template: '/bahmni/modules/DicomRadiology/displayControls/pacs/views/deleteConfirmation.html', scope: $scope});
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

                $scope.initialization = init();
            };

            var link = function ($scope, element) {
                spinner.forPromise($scope.initialization, element);
            };

            return {
                restrict: 'E',
                controller: controller,
                link: link,
                templateUrl: "/bahmni/extensions/DicomRadiology/views/pacs.html",
                scope: {
                    config: "=",
                    contextConfig: "=",
                    patient: "=",
                    visit:   "=?"
                }
            };
        }
    ]);