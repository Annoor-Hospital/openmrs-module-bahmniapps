'use strict';

angular.module('bahmni.common.orders')
    .factory('radiologyOrderService', ['$http', '$filter', function ($http, $filter) {
        var getOrders = function (data) {
            var params = {};
            params.date = $filter('date')(data.date, 'yyyy-MM-dd');
            params.q = 'radiology.sqlSearch.activeOrdersByDate';
            params.v = 'full';
            return $http.get(Bahmni.Common.Constants.sqlUrl, {
                params: params,
                withCredentials: true
            }).then(function (response) {
                var orders = [];
                for (var i = 0; i < response.data.length; i++) {
                    orders.push(mapToPendingOrder(response.data[i]));
                }
                return orders;
            });
        };

        // radiology order is object retrieved by radiologyOrderService via custom sql statement
        var mapToPendingOrder = function (order) {
            var po = new Bahmni.Common.Orders.PendingOrder();
            po.patientid = order.patientid;
            po.patientName = order.patientName;
            po.label = order.conceptShortName || order.conceptName;
            po.provider = order.provider;
            po.orderDate = new Date(order.orderDate * 1000);
            po.orderNumber = order.orderNumber;
            po.orderuid = order.orderUuid;
            po.fulfillerComment = order.commentToFulfiller;
            return po;
        };

        return {
            getOrders: getOrders
        };
    }]);
