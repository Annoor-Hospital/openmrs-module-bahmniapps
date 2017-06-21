'use strict';

angular.module('bahmni.common.orders')
    .factory('pacsService', ['$http', function ($http) {
        var getStudies = function (data) {
            var params = {
                patientid: data.patientid
            };
            return $http.get(Bahmni.Common.Constants.pacsUrl, {
                params: params,
                withCredentials: false
            });
        };

        return {
            getStudies: getStudies
        };
    }]);
