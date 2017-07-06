'use strict';

angular.module('bahmni.common.orders')
    .factory('pacsService', ['$http', '$filter', function ($http, $filter) {
        var getStudies = function (data) {
            var params = {};
            if (data.patientid) params.patientid = data.patientid;
            if (data.asofdate) params.asofdate = $filter('date')(data.asofdate, 'yyyyMMdd');
            return $http.get(Bahmni.Common.Constants.pacsUrl, {
                params: params,
                withCredentials: false
            }).then(function (response) {
                var studies = [];
                for (var i = 0; i < response.data.length; i++) {
                    var fo = new Bahmni.Common.Orders.FulfilledOrder();
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
