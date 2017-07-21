'use strict';

Bahmni.Common.Orders.PendingOrder = function () {
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
        this.radiologyEncounterUuid = '';
    };

    // bahmni order is order retrieved by orderService via bahmniOrderUrl
    this.mapBahmniOrder = function (order) {
        this.label = order.concept.shortName || order.concept.name;
        this.provider = order.provider;
        this.orderDate = new Date(order.orderDate * 1000);
        this.orderNumber = order.orderNumber;
        this.orderuid = order.orderUuid;
        return this;
    };

    // radiology order is object retrieved by radiologyOrderService via custom sql statement
    this.mapRadiologyOrder = function (order) {
        this.patientid = order.patientid;
        this.patientName = order.patientName;
        this.label = order.conceptShortName || order.conceptName;
        this.provider = order.provider;
        this.orderDate = new Date(order.orderDate * 1000);
        this.orderNumber = order.orderNumber;
        this.orderuid = order.orderUuid;
        return this;
    };

    // how to do an extend?
    this.hasStudyuid = function () {
        return false;
    }

    this.hasObsNote = function () {
        return false;
    }

    create.apply(this, []);
};
