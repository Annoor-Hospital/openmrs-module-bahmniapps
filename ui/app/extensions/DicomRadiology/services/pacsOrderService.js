'use strict';

angular.module('bahmni.DicomRadiology')
    .factory('pacsOrderService', ['$http', '$filter', function ($http, $filter) {
        var getOrdersByDate = function (data) {
            var params = {};
            params.date = $filter('date')(data.date, 'yyyy-MM-dd');
            params.q = 'radiology.sqlSearch.ordersByDate';
            params.v = 'full';
            return getOrders(params);
        };

        var getOrdersByPatient = function (data) {
            var params = {};
            params.patientUuid = data.patientUuid;
            params.v = 'full';
            if (data.visitUuid) {
                params.q = 'radiology.sqlSearch.ordersByPatientVisit';
                params.visitUuid = data.visitUuid;
            } else {
                params.q = 'radiology.sqlSearch.ordersByPatient';
            }
            return getOrders(params);
        };

        var getOrders = function (params) {
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
            var po = new Bahmni.DicomRadiology.PendingOrder();
            po.patientid = order.patientid;
            po.patientName = order.patientName;
            po.patientBirthDate = moment(order.patientBirthDate, 'YYYY-MM-DD').toDate();
            po.visitUuid = order.visitUuid;
            po.visitStartDate = new Date(order.visitStartDate * 1000);
            po.label = order.conceptShortName || order.conceptName;
            po.provider = order.provider;
            po.orderDate = new Date(order.orderDate * 1000);
            po.orderNumber = order.orderNumber;
            po.orderUuid = order.orderUuid;
            po.fulfillerComment = order.commentToFulfiller;
            po.isOrderExpired = order.isExpired;
            return po;
        };

        return {
            getOrdersByPatient: getOrdersByPatient,
            getOrdersByDate: getOrdersByDate
        };
    }]);
