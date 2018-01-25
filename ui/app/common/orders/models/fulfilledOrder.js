'use strict';

Bahmni.Common.Orders.FulfilledOrder = function () {
    this.isFullfilledOrder = true;

    var create = function () {
        this.patientid = '';
        this.patientName = '';
        this.patientBirthDate = null;
        this.accessionNumber = '';
        this.label = '';
        this.provider = '';
        this.orderDate = '';
        this.studyUid = '';
        this.orderNumber = '';
        this.orderUuid = '';
        this.obsNote = '';
        this.obsEncounter = null;
        this.fulfillerComment = '';
        this.seriesCount = '';
        this.isExpired = false;
    };

    this.combineWithPendingOrder = function (pendingOrder) {
        this.patientName = pendingOrder.patientName;
        this.label = pendingOrder.label;
        this.visitUuid = pendingOrder.visitUuid;
        this.visitStartDate = pendingOrder.visitStartDate;
        this.patientBirthDate = pendingOrder.patientBirthDate;
        this.provider = pendingOrder.provider;
        this.orderUuid = pendingOrder.orderUuid;
        this.fulfillerComment = pendingOrder.fulfillerComment;
        return this;
    };

    this.addObs = function (obs) {
        this.obs = obs; // needed for uuids
        this.obsNote = obs.obsNote;
    };

    create.apply(this, []);
};
