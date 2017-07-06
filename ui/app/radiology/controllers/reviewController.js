'use strict';

angular.module('radiology')
    .controller('ReviewController', ['$scope', '$stateParams', 'spinner', '$rootScope', '$http', '$q', '$timeout', 'sessionService', '$translate', 'messagingService',
        function ($scope, $stateParams, spinner, $rootScope, $http, $q, $timeout, sessionService, $translate, messagingService) {
            $scope.targetDate = new Date();
            var init = function () {
                var deferrables = $q.defer();
                var promises = [];
                // promises.push(getVisitTypes());
                $q.all(promises).then(function () {
                    deferrables.resolve();
                });
                return deferrables.promise;
            };
            spinner.forPromise(init());
        }
    ]);
