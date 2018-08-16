'use strict';

Bahmni.Common.Patient = function (obj) {
    var Patient = {
        "uuid": null,
        "identifier": null,
        "extraIdentifiers": null,
        "givenName": null,
        "familyName": null,
        "name": null,
        "localName": null,
        "gender": null,
        "birthtime": null,
        "birthdateEstimated": null,
        "address": null,
        "bloodGroup": null,
        "registrationDate": null,
        "image": null,
        "attributes": null,
    }

    if(obj){
        _.keys(obj).filter(k => Patient.hasOwnProperty(k)).forEach(function(k){
            Patient[k] = obj[k];
        });
    }

    Patient.prototype = {
        getAge: function(upUntilTime) {
            DateUtil = Bahmni.Common.Util.DateUtil;
            if(!upUntilTime) upUntilTime = DateUtil.now();
            return DateUtil.diffInYearsMonthsDays(this.birthtime, upUntilTime);
        },
    }

    return Patient;
};
