'use strict';

Bahmni.Common.Orders.FulfilledOrder = function () {
    this.isFullfilledOrder = true;

    var create = function () {
        this.patientid = '';
        this.patientName = '';
        this.accessionNumber = '';
        this.label = '';
        this.provider = '';
        this.orderDate = '';
        this.studyuid = '';
        this.orderNumber = '';
        this.orderuid = '';
        this.obsNote = '';
        this.obsEncounter = null;
        this.fulfillerComment = '';
        this.seriesCount = '';
        this.isExpired = false;
    };

    this.combineWithPendingOrder = function (pendingOrder) {
        this.patientName = pendingOrder.patientName;
        this.label = pendingOrder.label;
        this.provider = pendingOrder.provider;
        this.orderuid = pendingOrder.orderuid;
        this.fulfillerComment = pendingOrder.fulfillerComment;
        return this;
    };

    this.addObs = function (obs) {
        this.obs = obs; // needed for uuids
        this.obsNote = obs.obsNote;
    };

    create.apply(this, []);
};
