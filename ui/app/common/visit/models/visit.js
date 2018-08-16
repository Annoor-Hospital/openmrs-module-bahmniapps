'use strict';

Bahmni.Common.Visit = function (obj) {
    var Visit = {
        "uuid": null,
        "patientUuid": null,
        "consultations": null,
        "location": null,
        "visitType": null,
        "startDate": null,
        "endDate": null,
    }

    if(obj){
        _.keys(obj).filter(k => Patient.hasOwnProperty(k)).forEach(function(k){
            Visit[k] = obj[k];
        });
    }

    Patient.prototype = {
        
    }

    return Visit;
};
