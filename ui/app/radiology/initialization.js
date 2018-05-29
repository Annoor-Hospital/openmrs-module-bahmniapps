'use strict';

var whitelist = function (src, whitelist) {
    var dst = {};
    whitelist.forEach(function (name) {
        if (src['name']) dst['name'] = src['name'];
    });
    return dst;
};

var assignIf = function (val, def) {
    return (val !== null) ? val : def;
};

angular.module('bahmni.radiology').factory('initialization',
    ['$rootScope', '$q', '$window', '$http', '$location', 'configurationService', 'visitService', 'configurations', 'authenticator', 'appService', 'sessionService', 'locationService', 'spinner',
        function ($rootScope, $q, $window, $http, $location, configurationService, visitService, configurations, authenticator, appService, sessionService, locationService, spinner) {
            var initializationPromise = $q.defer();
            var url = purl(decodeURIComponent($window.location));
            $rootScope.appConfig = whitelist(url.param(), []);

            var getConfigs = function () {
                var defaultVisitType = "OPD";
                var configNames = ['encounterConfig', 'loginLocationToVisitTypeMapping'];
                var configtask = configurations.load(configNames).then(function () {
                    $rootScope.encounterConfig = angular.extend(new EncounterConfig(), configurations.encounterConfig());
                    $rootScope.refreshTimeout = assignIf(appService.getAppDescriptor().getConfigValue("refreshTimeout"), 5000);
                    $rootScope.refreshButton = assignIf(appService.getAppDescriptor().getConfigValue("refreshButton"), true);
                    $rootScope.pacsImageUrl = assignIf(appService.getAppDescriptor().getConfigValue("pacsImageUrl"), "Not Found");
                    var loginLocationUuid = sessionService.getLoginLocationUuid();

                    var concepts = ['External Radiology Observation', 'Radiology Notes', 'External Radiology Uuid'];
                    var promises = [];
                    $rootScope.concepts = {};
                    concepts.forEach( function (concept) {
                        promises.push($http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                            method: "GET",
                            params: {v: 'custom:(uuid,name,answers)', name: concept},
                            withCredentials: true
                        }).then( function (data) {
                            if(data.data && data.data.results && data.data.results.length > 0) {
                                $rootScope.concepts[concept] = data.data.results[0].uuid;
                            }
                        }));
                    });
                    var visittask = visitService.getVisitType().then( function (data) {
                        return data.data.results;
                    });
                    var logintask = locationService.getVisitLocation(loginLocationUuid).then(function (response) {
                         return response.data ? response.data.uuid : null;
                    });
                    var encounterroletask = $http.get('/openmrs/ws/rest/v1/encounterrole', {
                        method: "GET",
                            withCredentials: true
                    }).then( function (data) {
                        var roles = data.data.results;
                        $rootScope.encounterRoleUuid = roles.filter( function (item) {
                            return item.display == "Unknown";
                        })[0].uuid;
                    });

                    promises.push(encounterroletask);
                    promises.push(
                        $q.all([visittask, logintask]).then( function (data) {
                            $rootScope.visitTypeUuid = data[0].filter(function (type) {
                                return type.display == "OPD";
                            })[0].uuid;
                            $rootScope.visitLocationUuid = data[1];
                        })
                    );
                    return promises;
                });
                return configtask;
            };

            var initApp = function () {
                return appService.initApp('radiology', {'app': true, 'extension': true});
            };

            $rootScope.$on("$stateChangeError", function () {
                $location.path("/error");
            });

            authenticator.authenticateUser().then(initApp).then(function () {
                initializationPromise.resolve();
            });

            return spinner.forPromise(initializationPromise.promise).then(getConfigs);
        }]
);
