'use strict';

Bahmni.Common.Orders.FullfilledOrder = function () {
    var create = function () {
        this.label = '';
        this.provider = '';
        this.orderDate = '';
        this.studyuid = '';
        this.orderuid = '';
    };

    this.mapStudy = function (study) {
        if ("Value" in study["00321060"]) {
            this.label = study["00321060"].Value[0];
        } else {
            this.label = "X-Ray";
        }
        this.provider = "Unknown";
        if ("Value" in study["00080020"] && "Value" in study["00080030"]) {
            var dpart = study["00080020"].Value[0]; // yyyyMMdd
            var tpart = study["00080030"].Value[0]; // hhmmss.SSS
            this.orderDate = new Date(dpart.substring(0, 4),
                                                       dpart.substring(4, 6),
                                                       dpart.substring(6, 8),
                                                       tpart.substring(0, 2),
                                                       tpart.substring(2, 4),
                                                       tpart.substring(4, 6),
                                                       tpart.substring(7, 10));
        }
        this.studyuid = study["0020000D"].Value[0];
        if ("Value" in study["00402016"]) {
            this.orderuid = study["00402016"].Value[0];
        }
        return this;
    };

    this.combineWithOrder = function (pendingOrder) {
        this.label = pendingOrder.label;
        this.provider = pendingOrder.provider;
        this.orderuid = pendingOrder.orderuid;
        return this;
    };

    this.addObsNote = function (note) {
        // add an observation note
    };

    create.apply(this, []);
};