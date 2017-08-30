'use strict';

angular.module('radiology')
    .controller('ReviewController', ['$scope', '$stateParams', 'spinner', '$rootScope', '$http', '$q', '$timeout', 'sessionService', 'appService', '$translate', 'messagingService',
        function ($scope, $stateParams, spinner, $rootScope, $http, $q, $timeout, sessionService, appService, $translate, messagingService) {
            $scope.targetDate = new Date();
            var init = function () {
                var deferrables = $q.defer();
                var promises = [];
                // promises.push(getVisitTypes());
                $q.all(promises).then(function () {
                    $scope.extensions = appService.getAppDescriptor().getExtensions("bahmni.radiology") || [];
                    if($scope.extensions.find(function(ext) {
                        return ext.id="bahmni.radiology.editNotePrivilege";
                    })) {
                        $scope.canEditNote = true;
                    }
                    deferrables.resolve();
                });
                return deferrables.promise;
            };
            spinner.forPromise(init());
        }
    ]);
