'use strict';

angular.module('bahmni.common.orders')
    .factory('orderService', ['$http', function ($http) {
        var getOrders = function (data) {
            var params = {
                concept: data.conceptNames,
                includeObs: data.includeObs,
                patientUuid: data.patientUuid,
                numberOfVisits: data.numberOfVisits
            };

            if (data.obsIgnoreList) {
                params.obsIgnoreList = data.obsIgnoreList;
            }
            if (data.orderTypeUuid) {
                params.orderTypeUuid = data.orderTypeUuid;
            }
            if (data.orderUuid) {
                params.orderUuid = data.orderUuid;
            }
            if (data.visitUuid) {
                params.visitUuid = data.visitUuid;
            }
            if (data.locationUuids && data.locationUuids.length > 0) {
                params.numberOfVisits = 0;
                params.locationUuids = data.locationUuids;
            }
            return $http.get(Bahmni.Common.Constants.bahmniOrderUrl, {
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

        // bahmni order is order retrieved by orderService via bahmniOrderUrl
        var mapToPendingOrder = function (order) {
            var po = new Bahmni.Common.Orders.PendingOrder();
            po.label = order.concept.shortName || order.concept.name;
            po.provider = order.provider;
            po.orderDate = new Date(order.orderDate * 1000);
            po.orderNumber = order.orderNumber;
            po.orderuid = order.orderUuid;
            return po;
        };

        return {
            getOrders: getOrders
        };
    }]);
