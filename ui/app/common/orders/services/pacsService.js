'use strict';

angular.module('bahmni.common.orders')
    .factory('pacsService', ['$http', function ($http) {
        var getStudies = function (data) {
            var params = {
                patientid: data.patientid,
                todayOnly: data.todayOnly
            };
            return $http.get(Bahmni.Common.Constants.pacsUrl, {
                params: params,
                withCredentials: false
            }).then( function (response) {
                var studies = [];
                for (var i = 0; i < response.data.length; i++) {
                    var fo = new Bahmni.Common.Orders.FullfilledOrder();
                    fo.mapStudy(response.data[i]);
                    studies.push(fo);
                }
                return studies;
            });
        };

        return {
            getStudies: getStudies
        };
    }]);
