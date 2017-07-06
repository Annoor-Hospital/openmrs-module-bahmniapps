'use strict';

Bahmni.Common.Orders.CombinedOrderList = function (orders,studies) {
    var orderSort = function (o1, o2) {
        if (o2.orderNumber == null) return 1;
        if (o1.orderNumber == null) return -1;
        return o1.orderNumber.localeCompare(o2.orderNumber);
    };
    var genCompare = function (o1,o2){
        if(o1>o2) return 1;
        if(o2<o1) return -1;
        return 0;
    }
    var eqCallback = function (order, study) {
        if (order.orderNumber != null) {
            return [study.combineWithOrder(order)];
        }else{
            return [order, study];
        }
    }
    // combine the 2 orderable arrays l1,l2 according to compare function
    // On equality, add to the array the list return value of equality callback.
    var arrayCombine = function (l1, l2, compare, equality) {
        l1.sort(compare);
        l2.sort(compare);
        var j = 0;
        var res = [];
        for (var i = 0; i < l1.length; i++) {
            while (j < l2.length && compare(l1,l2) > 0) { res.push(l2[j]); j++; }
            if (compare(l1,l2) == 0) {
                equality(l1,l2).forEach( function(item) { res.push(item); });
            } else {
                res.push(l1[i]);
            }
        }
        return res;
    }
    var orderList = arrayCombine(orders, studies, orderSort, eqCallback);
    orderList.sort( function (o1,o2) {
        return genCompare(o1.orderDate, o2.orderDate);
    });
    return orderList;
}