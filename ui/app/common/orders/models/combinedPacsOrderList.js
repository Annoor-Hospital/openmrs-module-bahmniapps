'use strict';

Bahmni.Common.Orders.CombinedPacsOrderList = function (pacsOrders, pacsStudies, radiologyNotes) {
    pacsOrders = pacsOrders || [];
    pacsStudies = pacsStudies || [];
    radiologyNotes = radiologyNotes || [];
    var compare = function (obj1, obj2) {
        return obj1 === obj2 ? 0 : obj1 > obj2 ? 1 : -1;
    };

    var combinedOrderSort = function (o1, o2) {
        var d1 = o1.studyDate || o1.orderDate;
        var d2 = o2.studyDate || o2.orderDate;
        if (d2 == null) return 1;
        if (d1 == null) return -1;
        return -compare(d1, d2);
    };

    var combinePacsOrderStudy = function (pacsOrder, pacsStudy) {
        // shared fields: patientid,patientName,patientBirthDate,label,provider,orderDate,orderNumber
        var combined = {};
        angular.extend(combined, pacsOrder);
        angular.extend(combined, pacsStudy); // overwrite all shared fields
        // I will take provider and orderNumber from pacsOrder
        var x = ['provider', 'orderNumber', 'patientName'];
        for (var i = 0; i < x.length; i++) {
            if (x[i] in pacsOrder) combined[x[i]] = pacsOrder[x[i]];
        }
        return combined;
    };

    var addRadiologyNotes = function (pacsStudy, radiologyNotes) {
        if (pacsStudy.studyUid != null && pacsStudy.studyUid !== '') {
            pacsStudy.obs = radiologyNotes.filter(function (noteObs) {
                return pacsStudy.studyUid === noteObs.obsExt;
            });
        }
    };

    // console.log("Found " + pacsStudies.length + " pacs studies");
    // console.log("Found " + pacsOrders.length + " pacs orders");
    // console.log("Found " + radiologyNotes.length + " radiology notes");

    // match each pacsStudies with any matching pacsOrders, allowing many studies to one order
    var matchedOrderNumbers = [];
    for (var i = 0; i < pacsStudies.length; i++) {
        // add radiology notes
        addRadiologyNotes(pacsStudies[i], radiologyNotes);
        // find the first pacsOrder matching this pacsStudy
        var order = pacsOrders.find(function (elem) {
            return elem.orderNumber === pacsStudies[i].orderNumber;
        });
        if (order) {
            pacsStudies[i] = combinePacsOrderStudy(order, pacsStudies[i]);
            matchedOrderNumbers.push(order.orderNumber);
        }
    }

    // var numNotes = pacsStudies.map(function (study) {
    //     return study.obs.length;
    // }).reduce(function (a, b) { return a + b; }, 0);
    // console.log(numNotes + " notes matched to pacs studies");

    // Add any active orders that were unmatched
    var unmatchedOrders = pacsOrders.filter(function (order) {
        if (order.isOrderExpired) return false;
        return !matchedOrderNumbers.find(function (matchedOrderNumber) {
            return order.orderNumber === matchedOrderNumber;
        });
    });

    // console.log(unmatchedOrders.length + " pending orders");

    Array.prototype.push.apply(pacsStudies, unmatchedOrders);
    pacsStudies.sort(combinedOrderSort);
    return pacsStudies;
};
