'use strict';

angular.module('bahmni.common.patientSearch')
.controller('PatientsListController', ['$scope', '$window', 'patientService', '$rootScope', 'appService', 'spinner',
    '$stateParams', '$bahmniCookieStore', 'offlineService', 'printer', 'configurationService', 'criteriaSearchService', 'messagingService',
    function ($scope, $window, patientService, $rootScope, appService, spinner, $stateParams, $bahmniCookieStore, offlineService, printer, configurationService, criteriaSearchService, messagingService) {
        var initialize = function () {
            var searchTypes = appService.getAppDescriptor().getExtensions("org.bahmni.patient.search", "config").map(mapExtensionToSearchType);
            $scope.search = new Bahmni.Common.PatientSearch.Search(_.without(searchTypes, undefined));
            $scope.search.markPatientEntry();
            $scope.$watch('search.searchType', function (currentSearchType) {
                _.isEmpty(currentSearchType) || fetchPatients(currentSearchType);
            });
            _.each($scope.search.searchTypes, function (searchType) {
                _.isEmpty(searchType) || ($scope.search.searchType != searchType && getPatientCount(searchType));
            });
            if ($rootScope.currentSearchType != null) {
                $scope.search.switchSearchType($rootScope.currentSearchType);
            }
            configurationService.getConfigurations(['identifierTypesConfig']).then(function (response) {
                $scope.primaryIdentifier = _.find(response.identifierTypesConfig, {primary: true}).name;
            });
        };

        $scope.searchPatients = function () {
            return spinner.forPromise(patientService.search($scope.search.searchParameter)).then(function (response) {
                $scope.search.updateSearchResults(response.data.pageOfResults);
                if ($scope.search.hasSingleActivePatient()) {
                    $scope.forwardPatient($scope.search.activePatients[0]);
                }
            });
        };

        // MAF search for patients by criteria
        $scope.criteria_search_submit = function (params) {
          return spinner.forPromise(criteriaSearchService.search(params)).then(function (response) {
              if(response.data && response.data.pageOfResults) {
                $scope.search.updateSearchResults(response.data.pageOfResults);
                if ($scope.search.hasSingleActivePatient()) {
                    $scope.forwardPatient($scope.search.activePatients[0]);
                }
              }else {
                if(response.data && response.data.error)
                  messagingService.showMessage("error", "Search failed: " + response.data.error);
                else
                  messagingService.showMessage("error", "Search failed");
              }
          });
        }

        $scope.filterPatientsAndSubmit = function () {
            if ($scope.search.searchResults.length == 1) {
                $scope.forwardPatient($scope.search.searchResults[0]);
            }
        };

        var getPatientCount = function (searchType) {
            if (searchType.handler) {
                var params = { q: searchType.handler, v: "full",
                    location_uuid: $bahmniCookieStore.get(Bahmni.Common.Constants.locationCookieName).uuid,
                    provider_uuid: $rootScope.currentProvider.uuid };
                if (searchType.additionalParams) {
                    params["additionalParams"] = searchType.additionalParams;
                }
                patientService.findPatients(params).then(function (response) {
                    searchType.patientCount = response.data.length;
                    if ($scope.search.isSelectedSearch(searchType)) {
                        $scope.search.updatePatientList(response.data);
                    }
                });
            }
        };

        $scope.getHeadings = function (patients) {
            if (patients && patients.length > 0) {
                var headings = _.chain(patients[0])
                    .keys()
                    .filter(function (heading) {
                        return _.indexOf(Bahmni.Common.PatientSearch.Constants.tabularViewIgnoreHeadingsList, heading) === -1;
                    })
                    .value();
                if($scope.search.searchType.headingOrder) {
                    var new_headings = $scope.search.searchType.headingOrder.filter(header => headings.includes(header));
                    var missed_headings = headings.filter(header => !new_headings.includes(header));
                    headings = new_headings.concat(missed_headings);
                }
                return headings;
            }
            return [];
        };

        $scope.isHeadingOfIdentifier = function (heading) {
            return _.includes(Bahmni.Common.PatientSearch.Constants.identifierHeading, heading);
        };

        $scope.isHeadingOfName = function (heading) {
            return _.includes(Bahmni.Common.PatientSearch.Constants.nameHeading, heading);
        };

        $scope.getPrintableHeadings = function (patients) {
            var headings = $scope.getHeadings(patients);
            var printableHeadings = headings.filter(function (heading) {
                return _.indexOf(Bahmni.Common.PatientSearch.Constants.printIgnoreHeadingsList, heading) === -1;
            });
            return printableHeadings;
        };

        $scope.printPage = function () {
            if ($scope.search.searchType.printHtmlLocation != null) {
                printer.printFromScope($scope.search.searchType.printHtmlLocation, $scope);
            }
        };

        var mapExtensionToSearchType = function (appExtn) {
            if (offlineService.isOfflineApp() && appExtn.offline == false) {
                return;
            }

            return {
                name: appExtn.label,
                display: appExtn.extensionParams.display,
                handler: appExtn.extensionParams.searchHandler,
                customSearch: appExtn.extensionParams.customSearch,
                forwardUrl: appExtn.extensionParams.forwardUrl,
                id: appExtn.id,
                params: appExtn.extensionParams.searchParams,
                refreshTime: appExtn.extensionParams.refreshTime || 0,
                view: appExtn.extensionParams.view || Bahmni.Common.PatientSearch.Constants.searchExtensionTileViewType,
                showPrint: appExtn.extensionParams.showPrint || false,
                printHtmlLocation: appExtn.extensionParams.printHtmlLocation || null,
                headingOrder: appExtn.extensionParams.headingOrder,
                additionalParams: appExtn.extensionParams.additionalParams,
                searchColumns: appExtn.extensionParams.searchColumns,
                translationKey: appExtn.extensionParams.translationKey
            };
        };

        var fetchPatients = function (currentSearchType) {
            $rootScope.currentSearchType = currentSearchType;
            if ($scope.search.isCurrentSearchLookUp()) {
                getPatientCount(currentSearchType);
            } else {
                if (offlineService.isOfflineApp()) {
                    var duration = appService.getAppDescriptor().getConfigValue('recentPatientsDuration');
                    patientService.getRecentPatients(duration).then(function (response) {
                        $scope.search.updatePatientList(response.data.pageOfResults);
                    });
                }
            }
        };

        // MAF: added a function to get forwarding URL, so that the link can behave like a link
        var hasPatientForwardUrl = function (patient) {
            return ($stateParams.forwardUrl != null || patient.forwardUrl != null);
        };

        $scope.forwardPatientUrl = function (patient) {
            var options = $.extend({}, $stateParams);
            $.extend(options, {
                patientUuid: patient.uuid,
                visitUuid: patient.activeVisitUuid || null,
                encounterUuid: $stateParams.encounterUuid || 'active',
                programUuid: patient.programUuid || null,
                enrollment: patient.enrollment || null,
                forwardUrl: patient.forwardUrl || null
            });

            if (options.forwardUrl !== null) {
                return appService.getAppDescriptor().formatUrl(options.forwardUrl, options, true);
            } else {
                return appService.getAppDescriptor().formatUrl($scope.search.searchType.forwardUrl, options, true);
            }
        };

        $scope.forwardPatientTarget = function (patient) {
            return hasPatientForwardUrl(patient) ? '_blank' : '_self';
        };

        $scope.forwardPatient = function (patient) {
            var url = $scope.forwardPatientUrl(patient);

            if (hasPatientForwardUrl(patient)) {
                $window.open(url, '_blank');
            } else {
                $window.location = url;
            }
        };

        initialize();
    }
]).filter('snakeToUpper', function() {
    return function (input) {
        return input.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }
});
