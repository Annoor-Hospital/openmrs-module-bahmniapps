'use strict';

Bahmni.Common.Orders.PendingOrder = function () {
    this.isFullfilledOrder = false;

    var create = function () {
        this.patientid = '';
        this.patientName = '';
        this.patientBirthDate = null;
        this.accessionNumber = '';
        this.label = '';
        this.provider = '';
        this.orderDate = '';
        this.orderNumber = '';
        this.orderuid = '';
        this.fulfillerComment = '';
        this.isOrderExpired = false;
    };

    create.apply(this, []);
};
