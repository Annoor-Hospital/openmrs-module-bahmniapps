/*
var showOrHideGuardianSection = function (patient) {
    var returnValues = {
        show: [],
        hide: []
    };
    if (patient["age"].years < 18) {
        returnValues.show.push("guardian");
    } else {
        returnValues.hide.push("guardian");
    }
    return returnValues;
};

Bahmni.Registration.AttributesConditions.rules = {
    'age': function (patient) {
        return showOrHideGuardianSection(patient);
    },

    'birthdate': function (patient) {
        return showOrHideGuardianSection(patient);
    },
    'isGuardianRequired': function (patient) {
        var returnValues = {
            show: [],
            hide: []
        };
        if (patient["isGuardianRequired"]) {
            returnValues.show.push("guardian");
        } else {
            returnValues.hide.push("guardian");
        }
        return returnValues;
    }
};
*/
