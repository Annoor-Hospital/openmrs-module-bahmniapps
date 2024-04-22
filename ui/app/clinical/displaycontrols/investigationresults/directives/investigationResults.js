'use strict';

angular.module('bahmni.clinical')
    .directive('investigationResults', ['labOrderResultService', 'spinner', function (labOrderResultService, spinner) {
        var controller = function ($scope) {
            var defaultParams = {
                showTable: true,
                showChart: true,
                numberOfVisits: 1
            };
            $scope.params = angular.extend(defaultParams, $scope.params);

            var params = {
                patientUuid: $scope.params.patientUuid,
                numberOfVisits: $scope.params.numberOfVisits,
                visitUuids: $scope.params.visitUuids,
                numberOfAccessions: $scope.params.numberOfAccessions, // MAF added number of accessions to params
                initialAccessionCount: $scope.params.initialAccessionCount,
                latestAccessionCount: $scope.params.latestAccessionCount
            };
            $scope.initialization = labOrderResultService.getAllForPatient(params)
                .then(function (results) {
                    $scope.investigationResults = results;
                });
        };

        var link = function ($scope, element) {
            spinner.forPromise($scope.initialization, element);
        };

        return {
            restrict: 'E',
            controller: controller,
            link: link,
            templateUrl: "displaycontrols/investigationresults/views/investigationResults.html",
            scope: {
                params: "="
            }
        };
    }]);
