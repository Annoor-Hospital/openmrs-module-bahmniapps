'use strict';

Bahmni.Common.Orders.PendingOrder = function () {
    this.isFullfilledOrder = false;

    var create = function () {
        this.patientid = '';
        this.patientName = '';
        this.accessionNumber = '';
        this.label = '';
        this.provider = '';
        this.orderDate = '';
        this.orderNumber = '';
        this.orderuid = '';
    };

    this.hasStudyuid = function () {
        return false;
    }

    this.hasObsNote = function () {
        return false;
    }

    create.apply(this, []);
};
