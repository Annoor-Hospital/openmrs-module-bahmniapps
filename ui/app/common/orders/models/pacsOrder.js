'use strict';

// Model not really necessary, just something like a type defenition
Bahmni.Common.Orders.PacsOrder = function () {
    var create = function () {
        this.patientid = '';
        this.patientName = '';
        this.patientBirthDate = null;
        this.visitUuid = '';
        this.visitStartDate = '';
        this.label = '';
        this.provider = '';
        this.orderDate = '';
        this.orderNumber = '';
        this.orderUuid = '';
        this.fulfillerComment = '';
        this.isOrderExpired = '';
    };
    create.apply(this, []);
};
