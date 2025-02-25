'use strict';

angular.module('bahmni.radiology')
    .directive('radiologyReviewOrders', ['ngDialog', 'messagingService', 'radiologyNoteService', 'pacsStudyService', 'pacsOrderService', 'encounterService', 'visitService', 'patientService', 'spinner', '$q', '$timeout', '$rootScope', '$http', '$window',
        function (ngDialog, messagingService, radiologyNoteService, pacsStudyService, pacsOrderService, encounterService, visitService, patientService, spinner, $q, $timeout, $rootScope, $http, $window) {
            var controller = function ($scope) {
                var getPacsOrders = function (date) {
                    var params = {date: date};
                    return pacsOrderService.getOrdersByDate(params);
                };
                var getPacsStudies = function (date) {
                    var params = {date: date};
                    return pacsStudyService.getStudies(params);
                };
                var getRadiologyNotes = function (date) {
                    var params = {date: date};
                    return radiologyNoteService.getRadiologyNotes(params);
                };
                var getOrders = function () {
                    var date = $scope.targetDate;
                    if (!date) date = new Date();
                    // TODO What if order was on a date prior to date of x-ray? not possible to match in js
                    var promises = [getPacsOrders(date), getPacsStudies(date), getRadiologyNotes(date)];
                    return $q.all(promises).then(function (data) {
                        var pacsOrders = Bahmni.Common.Orders.CombinedPacsOrderList(data[0], data[1], data[2]);
                        pacsOrders.forEach(function (order) {
                            if ("studyUid" in order) order.imageUrl = getImageUrl(order);
                        });
                        // pending orders not interesting to radiologist
                        pacsOrders = pacsOrders.filter(function (order) {
                            return order.studyUid != null;
                        });
                        // only modify scope variable on changes
                        if (!pacsOrdersChanged($scope.pacsOrders, pacsOrders)) {
                            $scope.pacsOrders = pacsOrders;
                        }
                    });
                };
                var getImageUrl = function (pacsOrder) {
                    var pacsImageTemplate = $scope.pacsImageUrl || "";
                    return pacsImageTemplate.replace('{{studyUID}}', pacsOrder.studyUid);
                };
                var pacsOrdersChanged = function (previous, updated) {
                    if (previous.length !== updated.length) return false;
                    for (var i = 0; i < previous.length; i++) {
                        if (previous[i].studyUid !== updated[i].studyUid) return false;
                        if (previous[i].orderUuid !== updated[i].orderUuid) return false;
                    }
                    return true;
                };
                $scope.updateOrders = function () {
                    $timeout.cancel($scope.timeoutPromise);
                    getOrders();
                    // restrict auto-refresh functionality to those with edit note privileges, to avoid overworking pacs
                    if ($scope.refreshTimeout && $scope.canEditNote) {
                        $scope.timeoutPromise = $timeout($scope.updateOrders, $scope.refreshTimeout);
                    }
                };
                $scope.$watch('targetDate', function (newDate, oldDate) {
                    // If date changed, update orders
                    if (newDate !== oldDate) $scope.updateOrders();
                });
                // set observation on appropriate orders
                var addObsToOrders = function (obs, orders) {
                    orders.forEach(function (order) {
                        var orderObs = obs.filter(function (o) {
                            return order.studyUid == o.obsExt;
                        });
                        if (orderObs && orderObs.length > 0) {
                            order.addObs(orderObs);
                        }
                    });
                };
                // set observation on appropriate orders
                // refresh observations of the order (since returned data doesn't contain all info needed)
                // addObsToOrders(obs, [pacsOrder]);
                var addObsToOrders = function (obs, orders) {
                    orders.forEach(function (order) {
                        var orderObs = obs.filter(function (o) {
                            return order.studyUid == o.obsExt;
                        });
                        if (orderObs && orderObs.length > 0) {
                            order.addObs(orderObs);
                        }
                    });
                };
                $scope.getAgeYears = function (patientDOB) {
                    return moment().diff(patientDOB, 'years');
                };
                var init = function () {
                    // some defaults just in case
                    if (angular.isUndefined($scope.refreshButton)) { $scope.refreshButton = true; }
                    if (angular.isUndefined($scope.refreshTimeout)) { $scope.refreshTimeout = 5000; }
                    if (angular.isUndefined($scope.pacsImageUrl)) { $scope.pacsImageUrl = "Not Found"; }
                    $scope.refreshButton = ($scope.refreshButton == true) || ($scope.refreshButton == 'true');
                    $scope.pacsOrders = [];
                    $scope.updateOrders();
                };
                init();

                // TODO some time try to move the following into its own controller or directive (big job)
                $scope.dialog = {};
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
                var patientDashboardUrl = function (uuid) {
                    return "/bahmni/clinical/index.html#/default/patient/" + uuid + "/dashboard";
                };
                var prepareDialogData = function (pacsOrder) {
                    pacsOrder.dashboardUrl = pacsOrder.patientUuid ? patientDashboardUrl(pacsOrder.patientUuid) : null;
                    var editableObs = pacsOrder.obs.filter(function (obs) {
                        var radiologySession = 240;
                        var diffMin = Bahmni.Common.Util.DateUtil.diffInMinutes(obs.obsNoteDatetime, new Date());
                        return diffMin <= radiologySession && obs.obsProviderUuid === $rootScope.currentProvider.uuid;
                    });
                    var editObs = editableObs.length > 0 && editableObs[0];

                    var textareaText = "";
                    if (editObs) {
                        textareaText = editObs.obsNote;
                    }
                    var originalText = textareaText;

                    return {
                        pacsOrder: pacsOrder,
                        editObs: editObs,
                        textarea: textareaText,
                        originalText: originalText
                    };
                };
                $scope.openObsDialog = function (pacsOrder) {
                    var openDialog = function (pacsOrder) {
                        ngDialog.open({
                            template: 'views/radiologyNoteEdit.html',
                            scope: $scope,
                            data: prepareDialogData(pacsOrder),
                            className: 'ngdialog-theme-default ng-dialog-radiology-note',
                            closeByDocument: false,
                            disableBodyScroll: false
                        });
                    };
                    if (!pacsOrder.patientUuid && pacsOrder.patientid) {
                        getPatientUuid(pacsOrder.patientid).then(function (data) {
                            pacsOrder.patientUuid = data.data.length > 0 ? data.data[0].uuid : null;
                            openDialog(pacsOrder);
                        });
                    } else {
                        openDialog(pacsOrder);
                    }
                };
                $scope.dialogGetNotes = function (ngDialogData) {
                    if (ngDialogData.editObs) {
                        return ngDialogData.pacsOrder.obs.filter(function (radiologyNote) {
                            return radiologyNote.obsNoteUuid !== ngDialogData.editObs.obsNoteUuid;
                        });
                    } else {
                        return ngDialogData.pacsOrder.obs;
                    }
                };
                $scope.dialogClose = function () {
                    ngDialog.close();
                };
                $scope.dialogCloseConfirm = function (ngDialogData) {
                    if (ngDialogData.textarea === ngDialogData.originalText || confirm("Discard unsaved note?")) {
                        ngDialog.close();
                    }
                };
                $scope.dialogSave = function (dialogData) {
                    if ($scope.canEditNote) {
                        if (dialogData.textarea.length > 0) {
                            // editObs=null for new note
                            saveNote(dialogData.editObs, dialogData.pacsOrder, dialogData.textarea).then(function (data) {
                                radiologyNoteService.getRadiologyNotes({patientuuid: dialogData.pacsOrder.patientUuid}).then(function (updatedPatientNotes) {
                                    var pacsOrder = Bahmni.Common.Orders.CombinedPacsOrderList(null, [dialogData.pacsOrder], updatedPatientNotes)[0];
                                    angular.extend(dialogData, prepareDialogData(pacsOrder));
                                    messagingService.showMessage("info", "Radiology Note Saved.");
                                });
                            }, function (reason) {
                                console.error(reason);
                                messagingService.showMessage("error", "Radiology Note Save Failed.");
                            });
                        } else {
                            messagingService.showMessage('error', "Empty note");
                        }
                    } else {
                        messagingService.showMessage('error', "Edit note privilege lacking");
                    }
                };
                var saveNote = function (editObs, pacsOrder, text) {
                    var context = {
                        locationUuid: $rootScope.visitLocationUuid,
                        obsGroupConceptId: $rootScope.concepts["External Radiology Observation"],
                        obsNoteConceptId: $rootScope.concepts["Radiology Notes"],
                        obsExtConceptId: $rootScope.concepts["External Radiology Uuid"],
                        studyUid: pacsOrder.studyUid,
                        patientUuid: pacsOrder.patientUuid,
                        orderDate: pacsOrder.orderDate.toISOString()
                    };
                    if (editObs) {
                        // these uuid's cause the save to update previous note
                        context = angular.extend(context, {
                            obsGroupUuid: editObs.obsGroupUuid,
                            obsNoteUuid: editObs.obsNoteUuid,
                            obsExtUuid: editObs.obsExtUuid
                        });
                    }
                    return radiologyNoteService.saveRadiologyNote(context, text);
                };
            };
            return {
                restrict: 'E',
                controller: controller,
                scope: {
                    refreshButton: "=",
                    refreshTimeout: "=",
                    pacsImageUrl: "=",
                    targetDate: "=",
                    canEditNote: "="
                },
                templateUrl: "views/radiologyReviewOrders.html"
            };
        }
    ]);
