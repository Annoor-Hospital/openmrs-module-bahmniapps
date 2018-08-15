'use strict';

Bahmni.DicomRadiology.CombinedOrderList = function (orders, studies) {
    var compare = function (obj1, obj2) {
        return obj1 == obj2 ? 0 : obj1 > obj2 ? 1 : -1;
    };

    var orderSort = function (o1, o2) {
        if (o2.orderDate == null) return 1;
        if (o1.orderDate == null) return -1;
        return -compare(o1.orderDate, o2.orderDate);
    };

    // match studies and orders, allowing many studies to one order
    var matchedOrders = [];
    for (var i = 0; i < studies.length; i++) {
        var study = studies[i];
        var order = orders.find(function (elem) {
            return elem.orderNumber == study.orderNumber;
        });
        if (order) {
            study.combineWithPendingOrder(order);
            matchedOrders.push(order);
        }
    }

    // get unmatched orders, assuming unique orderNumber
    var unmatchedOrders = orders.filter(function (elem) {
        // get active orders which are unmatched to any matched order
        return !elem.isOrderExpired && !matchedOrders.find(function (elem2) {
            return elem.orderNumber == elem2.orderNumber;
        });
    });

    // extend studies with unmatched orders
    Array.prototype.push.apply(studies, unmatchedOrders);
    studies.sort(orderSort);
    return studies;
};
