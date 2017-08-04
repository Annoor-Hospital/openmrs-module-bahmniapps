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
    };

    this.combineWithPendingOrder = function (pendingOrder) {
        this.patientName = pendingOrder.patientName;
        this.label = pendingOrder.label;
        this.provider = pendingOrder.provider;
        this.orderuid = pendingOrder.orderuid;
        this.fulfillerComment = pendingOrder.fulfillerComment;
        return this;
    };

    this.addObsEncounter = function (obsEncounter) {
        this.obsEncounter = obsEncounter;
        this.obsNote = obsEncounter.obsNote;
        this.studyuid = obsEncounter.obsExt;
    };

    create.apply(this, []);
};
