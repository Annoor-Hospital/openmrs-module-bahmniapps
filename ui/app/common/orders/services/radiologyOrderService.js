'use strict';

angular.module('bahmni.common.orders')
    .factory('radiologyOrderService', ['$http', '$filter', function ($http, $filter) {
        var getOrders = function (data) {
            var params = {};
            if (data.asofdate) {
                params.as_of_date = $filter('date')(data.asofdate, 'yyyy-MM-dd');
                params.q = 'radiology.sqlSearch.activeOrdersByDate';
            } else {
                params.q = 'radiology.sqlSearch.activeOrders';
            }
            params.v = 'full';
            return $http.get(Bahmni.Common.Constants.sqlUrl, {
                params: params,
                withCredentials: true
            }).then(function (response) {
                var orders = [];
                for (var i = 0; i < response.data.length; i++) {
                    var fo = new Bahmni.Common.Orders.PendingOrder();
                    fo.mapRadiologyOrder(response.data[i]);
                    orders.push(fo);
                }
                return orders;
            });
        };

        return {
            getOrders: getOrders
        };
    }]);
