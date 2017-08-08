'use strict';

angular.module('bahmni.radiology')
    .directive('radiologyReviewOrders', ['ngDialog', 'messagingService', 'radiologyObsService', 'pacsService', 'pacsOrderService', 'encounterService', 'visitService', 'patientService', 'spinner', '$q', '$timeout', '$rootScope', '$http', '$window',
        function (ngDialog, messagingService, radiologyObsService, pacsService, pacsOrderService, encounterService, visitService, patientService, spinner, $q, $timeout, $rootScope, $http, $window) {
            var controller = function ($scope) {
                var getActiveVisit = function (patientUuid, currentVisitLocation) {
                    return visitService.search({patient: patientUuid, v: 'custom:(uuid,visitType,startDatetime,stopDatetime,location,encounters:(uuid))', includeInactive: true})
                        .then(function (data) {
                            if (data.data && data.data.results) {
                                var activeVisits = data.data.results.filter(function (visit) {
                                    return visit.stopDatetime == null && visit.location.uuid == currentVisitLocation;
                                });
                                if (activeVisits.length > 0) { return activeVisits[0].uuid; }
                                return null;
                            } else {
                                return null;
                            }
                        });
                };

                var getRadiologyOrders = function (date) {
                    var params = {
                        date: date
                    };
                    return pacsOrderService.getOrdersByDate(params);
                };

                var getPacsStudies = function (date) {
                    var params = {
                        date: date
                    };
                    return pacsService.getStudies(params);
                };

                var getRadiologyObs = function (date) {
                    var params = {
                        obsdate: date
                    };
                    return radiologyObsService.getObs(params);
                };

                var compareOrderLists = function (l1, l2) {
                    if (l1.length != l2.length) return false;
                    for (var i = 0; i < l1.length; i++) {
                        if (l1[i].studyuid != l2[i].studyuid) return false;
                        else if (l1[i].orderuid != l2[i].orderuid) return false;
                    }
                    return true;
                };

                var getOrders = function () {
                    var date = $scope.targetDate;
                    if (!date) date = new Date();
                    var p1 = getRadiologyOrders(date);
                    var p2 = getPacsStudies(date);
                    var p3 = getRadiologyObs(date);
                    return $q.all([p1, p2, p3]).then(function (data) {
                        var orders = data[0];
                        var studies = data[1];
                        var obs = data[2];
                        radiologyObsService.addObsToOrders(obs, studies);
                        var orderList = Bahmni.Common.Orders.CombinedOrderList(orders, studies);
                        orderList.forEach(function (order) {
                            if ("studyuid" in order) order.imageUrl = getImageUrl(order);
                        });
                        // only modify scope variable on changes
                        if (!compareOrderLists($scope.bahmniOrders, orderList)) {
                            $scope.bahmniOrders = orderList;
                        }
                    });
                };

                var getImageUrl = function (bahmniOrder) {
                    var pacsImageTemplate = $scope.pacsImageUrl || "";
                    return pacsImageTemplate.replace('{{studyUID}}', bahmniOrder.studyuid);
                };

                $scope.$watch('targetDate', function (newDate, oldDate) {
                    if (newDate != oldDate) $scope.updateOrders();
                });

                $scope.updateOrders = function () {
                    $timeout.cancel($scope.timeoutPromise);
                    getOrders();
                    if ($scope.refreshTimeout) {
                        $scope.timeoutPromise = $timeout($scope.updateOrders, $scope.refreshTimeout);
                    } else {
                        console.error("No refresh timeout!");
                    }
                };

                var getPatientUuid = function (patientid) {
                    return $http.get(Bahmni.Common.Constants.sqlUrl, {
                        method: "GET",
                        params: {
                            q: "radiology.sqlsearch.patientuuid",
                            patientid: encodeURIComponent(patientid)
                        },
                        withCredentials: true
                    });
                };

                var errorNotRegistered = function () {
                    messagingService.showMessage('error', "Patient is not registered");
                };

                var patientDashboardUrl = function (uuid) {
                    return "/bahmni/clinical/index.html#/default/patient/" + uuid + "/dashboard";
                };

                $scope.openPatientWindow = function (patientid, target) {
                    spinner.forPromise(getPatientUuid(patientid).then(function (data) {
                        if (data.data && data.data.length > 0 && data.data[0].uuid && data.data[0].uuid.match(/[a-z0-9\-]+/)) {
                            $window.open(patientDashboardUrl(data.data[0].uuid), target);
                        } else {
                            errorNotRegistered();
                        }
                    }));
                };

                $scope.openObsDialog = function (bahmniOrder) {
                    var openDialog = function (bahmniOrder) {
                        bahmniOrder.dashboardUrl = bahmniOrder.patientUuid ? patientDashboardUrl(bahmniOrder.patientUuid) : null;
                        var text = bahmniOrder.obsNote;
                        ngDialog.open({
                            template: 'views/editNote.html',
                            scope: $scope,
                            data: {
                                bahmniOrder: bahmniOrder,
                                textarea: text
                            },
                            className: 'ngdialog-theme-default ng-dialog-radiology-note',
                            closeByDocument: false,
                            disableBodyScroll: false
                        });
                    };

                    if (!bahmniOrder.patientUuid && bahmniOrder.patientid) {
                        getPatientUuid(bahmniOrder.patientid).then(function (data) {
                            bahmniOrder.patientUuid = data.data.length > 0 ? data.data[0].uuid : null;
                            openDialog(bahmniOrder);
                        });
                    } else {
                        openDialog(bahmniOrder);
                    }
                };

                $scope.closeConfirmObsDialog = function (bahmniOrder, text) {
                    if (text == bahmniOrder.obsNote || confirm("Discard unsaved note changes?")) {
                        ngDialog.close();
                    }
                };

                $scope.closeObsDialog = function () {
                    ngDialog.close();
                };

                $scope.saveObsDialog = function (bahmniOrder, text) {
                    if (bahmniOrder.obsNote != text) {
                        bahmniOrder.obsNote = text;
                        if (text.length > 0) {
                            saveObs(bahmniOrder);
                        } else {
                            delObs(bahmniOrder);
                        }
                    } else {
                        messagingService.showMessage('info', "Already Saved");
                    }
                };

                var saveObs = function (bahmniOrder) {
                    var context = {
                        locationUuid: $rootScope.visitLocationUuid,
                        obsGroupConceptId: $rootScope.concepts["External Radiology Observation"],
                        obsNoteConceptId: $rootScope.concepts["Radiology Notes"],
                        obsExtConceptId: $rootScope.concepts["External Radiology Uuid"]
                    };
                    radiologyObsService.saveObsFromOrder(bahmniOrder, context).then(function (data) {
                        messagingService.showMessage("info", "Radiology Observation Saved.");
                    }, function (reason) {
                        console.error(reason);
                        messagingService.showMessage("error", "Radiology Observation Save Failed.");
                    });
                };

                var delObs = function (bahmniOrder) {
                    var promise = $q.all([radiologyObsService.delObsFromOrder(bahmniOrder)]); // wrap to support spinner
                    spinner.forPromise(promise).then(function (Obs) {
                        messagingService.showMessage("info", "Radiology Observation Deleted.");
                    }, function (reason) {
                        console.error(reason);
                        messagingService.showMessage("error", "Radiology Observation Delete Failed.");
                    });
                };

                var init = function () {
                    // some defaults just in case
                    if (angular.isUndefined($scope.refreshButton)) { $scope.refreshButton = true; }
                    if (angular.isUndefined($scope.refreshTimeout)) { $scope.refreshTimeout = 5000; }
                    if (angular.isUndefined($scope.pacsImageUrl)) { $scope.pacsImageUrl = "Not Found"; }
                    $scope.refreshButton = ($scope.refreshButton == true) || ($scope.refreshButton == 'true');
                    $scope.bahmniOrders = [];
                    $scope.updateOrders();
                };
                init();
            };

            return {
                restrict: 'E',
                controller: controller,
                scope: {
                    refreshButton: "=",
                    refreshTimeout: "=",
                    pacsImageUrl: "=",
                    targetDate: "="
                },
                templateUrl: "views/radiologyReviewOrders.html"
            };
        }
    ]);
