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
        this.studyuid = '';
        this.obsNote = '';
        this.obsEncounter = null;
    };

    this.combineWithPendingOrder = function (pendingOrder) {
        this.label = pendingOrder.label;
        this.provider = pendingOrder.provider;
        this.orderuid = pendingOrder.orderuid;
        return this;
    };

    this.addObsEncounter = function(obsEncounter) {
        this.obsEncounter = obsEncounter;
        this.obsNote = obsEncounter.obsNote;
        this.studyuid = obsEncounter.obsExt;
    }

    this.hasStudyuid = function () {
        return this.studyuid && this.studyuid.length > 0;
    }

    this.hasObsNote = function () {
        return this.obsNote && this.obsNote.length > 0;
    }

    create.apply(this, []);
};
