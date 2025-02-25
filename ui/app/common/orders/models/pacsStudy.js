'use strict';

// Model not really necessary, just something like a type defenition
Bahmni.Common.Orders.PacsStudy = function () {
    var create = function () {
        this.patientid = '';
        this.patientName = '';
        this.patientBirthDate = null;
        this.accessionNumber = '';
        this.label = '';
        this.provider = '';
        this.orderDate = '';
        this.studyUid = '';
        this.seriesCount = '';
        this.orderNumber = '';
        this.obs = [];
    };

    create.apply(this, []);
};
