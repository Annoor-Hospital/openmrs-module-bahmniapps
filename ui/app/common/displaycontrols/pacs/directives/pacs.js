'use strict';

angular.module('bahmni.common.displaycontrol.pacs')
    .directive('pacs', ['orderService', 'orderTypeService', 'pacsService', 'spinner', '$rootScope', 'messagingService', '$window', '$q',
        function (orderService, orderTypeService, pacsService, spinner, $rootScope, messagingService, $window, $q) {
            var controller = function ($scope) {
                $scope.print = $rootScope.isBeingPrinted || false;
                $scope.orderTypeUuid = orderTypeService.getOrderTypeUuid($scope.orderType);

                var includeAllObs = true;
                var getOpenMRSOrders = function () {
                    var params = {
                        patientUuid: $scope.patient.uuid,
                        orderTypeUuid: $scope.orderTypeUuid,
                        conceptNames: $scope.config.conceptNames,
                        includeObs: includeAllObs,
                        numberOfVisits: $scope.config.numberOfVisits,
                        obsIgnoreList: $scope.config.obsIgnoreList,
                        visitUuid: $scope.visitUuid,
                        orderUuid: $scope.orderUuid
                    };
                    return orderService.getOrders(params);
                };
                var getPacsStudies = function () {
                    var params = {
                        patientid: $scope.patient.identifier.replace(/[a-zA-Z]+/g, "")
                    };
                    return pacsService.getStudies(params);
                };
                var getOrders = function () {
                    var p1 = getOpenMRSOrders();
                    var p2 = getPacsStudies();
                    return $q.all([p1, p2]).then(function (data) {
                        var orders = data[0].data;
                        var studies = data[1].data;

                        // combine orders with studies
                        for (var i = 0; i < orders.length; i++) {
                            var order = orders[i];
                            order.label = order.concept.shortName || order.concept.name;
                            for (var j = 0; j < studies.length; j++) {
                                var study = studies[j];
                                if ("Value" in study["00402016"]
                                && "Value" in study["0020000D"]
                                && study["00402016"].Value[0] == order.orderNumber) {
                                    // create imageURL link
                                    order.pacsImageUrl = $scope.getUrl(order.orderNumber, study["0020000D"].Value[0]);
                                    delete studies[j];
                                }
                            }
                        }

                        // get studies with no order
                        for (var i = 0; i < studies.length; i++) {
                            var study = studies[i];
                            study.label = "X-Ray";
                            if ("Value" in study["00321060"]) study.label = study["00321060"].Value[0];
                            study.provider = "Unknown";
                            if ("Value" in study["00080020"] && "Value" in study["00080030"]) {
                                var dpart = study["00080020"].Value[0]; // yyyyMMdd
                                var tpart = study["00080030"].Value[0]; // hhmmss.SSS
                                study.orderDate = new Date(dpart.substring(0, 4), // year
                                                           dpart.substring(4, 6), // month
                                                           dpart.substring(6, 8), // day
                                                           tpart.substring(0, 2), // hours
                                                           tpart.substring(2, 4), // minutes
                                                           tpart.substring(4, 6), // seconds
                                                           tpart.substring(7, 10) // seconds
                                                           );
                            }
                            study.pacsImageUrl = $scope.getUrl(0, study["0020000D"].Value[0]);
                            orders.push(study);
                        }

                        if ($scope.print) {
                            var trimOrders = [];
                            for (var i = 0; i < orders.length; i++) {
                                if ($scope.hasPacsImage(orders[i])) {
                                    trimOrders.push(orders[i]);
                                }
                            }
                            orders = trimOrders;
                        }

                        $scope.bahmniOrders = orders;
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

                $scope.hasPacsImage = function (bahmniOrder) {
                    return ("pacsImageUrl" in bahmniOrder);
                };

                $scope.deleteOrder = function (bahmniOrder) {
                    console.log("Would like to delete this order. Functionallity exists but I can't figure out how to use it.");
                };

                $scope.getUrl = function (orderNumber, studyUID) {
                    var pacsImageTemplate = $scope.config.pacsImageUrl || "";
                    return pacsImageTemplate
                        .replace('{{patientID}}', $scope.patient.identifier)
                        .replace('{{studyUID}}', studyUID)
                        .replace('{{orderNumber}}', orderNumber);
                };

                $scope.getLabel = function (bahmniOrder) {
                    return bahmniOrder.concept.shortName || bahmniOrder.concept.name;
                };

                $scope.openImage = function (bahmniOrder) {
                    alert("test");
                    var url = bahmniOrder.pacsImageUrl;
                    $window.open(url, "XrayViewer");
                    /*
                    spinner.forAjaxPromise($.ajax({type: 'HEAD', url: url, async: false}).then(
                        function () {
                            $window.open(url, "_blank");
                        }, function () {
                        messagingService.showMessage("info", "No image available yet for order");
                    }));
                    */
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
