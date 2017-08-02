'use strict';

Bahmni.Common.Orders.CombinedOrderList = function (orders, studies) {
    var orderSort = function (o1, o2) {
        if (o2.orderNumber == null) return 1;
        if (o1.orderNumber == null) return -1;
        return o1.orderNumber.localeCompare(o2.orderNumber);
    };

    var genCompare = function (a, b) {
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
    };

    var eqCallback = function (order, study) {
        if (order.orderNumber != null) {
            return [study.combineWithPendingOrder(order)];
        } else {
            return [order, study];
        }
    };

    // combine the 2 orderable arrays l1,l2 according to compare function
    // On equality, add to the array the list return value of equality callback.
    // this code needs re-designing with a visually clearer method (like a nested for loop)
    var arrayCombine = function (l1, l2, compare, equality) {
        l1.sort(compare);
        l2.sort(compare);
        var j = 0;
        var res = [];
        for (var i = 0; i < l1.length; i++) {
            while (j < l2.length && compare(l1[i], l2[j]) > 0) {
                res.push(l2[j]); j++;
            }
            if (j < l2.length && compare(l1[i], l2[j]) == 0) {
                equality(l1[i], l2[j]).forEach(function (item) { res.push(item); });
                j++;
            } else {
                res.push(l1[i]);
            }
        }
        while (j < l2.length) {
            res.push(l2[j]); j++;
        }
        return res;
    };

    var orderList = arrayCombine(orders, studies, orderSort, eqCallback);
    orderList.sort(function (o1, o2) {
        return genCompare(o2.orderDate, o1.orderDate);
    });
    return orderList;
};
