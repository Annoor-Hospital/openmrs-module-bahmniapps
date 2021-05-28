'use strict';

Bahmni.PatientMapper = function (patientConfig, $rootScope, $translate) {
    this.patientConfig = patientConfig;

    this.map = function (openmrsPatient) {
        var patient = this.mapBasic(openmrsPatient);
        this.mapAttributes(patient, openmrsPatient.person.attributes);
        return patient;
    };

    this.mapBasic = function (openmrsPatient) {
        var patient = {};
        patient.uuid = openmrsPatient.uuid;
        patient.givenName = openmrsPatient.person.preferredName.givenName;
        patient.middleName = openmrsPatient.person.preferredName.middleName;
        patient.familyName = openmrsPatient.person.preferredName.familyName;
        patient.name = [patient.givenName, patient.middleName, patient.familyName].filter(x=>x!==null).join(' ');
        patient.age = openmrsPatient.person.age;
        patient.ageText = calculateAge(Bahmni.Common.Util.DateUtil.parseServerDateToDate(openmrsPatient.person.birthdate));
        patient.gender = openmrsPatient.person.gender;
        patient.genderText = mapGenderText(patient.gender);
        patient.address = mapAddress(openmrsPatient.person.preferredAddress);
        patient.birthdateEstimated = openmrsPatient.person.birthdateEstimated;
        patient.birthtime = Bahmni.Common.Util.DateUtil.parseServerDateToDate(openmrsPatient.person.birthtime);
        patient.bloodGroupText = getPatientBloodGroupText(openmrsPatient);
        patient.localName = getPatientLocalName(openmrsPatient);

        if (openmrsPatient.identifiers) {
            var primaryIdentifier = openmrsPatient.identifiers[0].primaryIdentifier;
            patient.identifier = primaryIdentifier ? primaryIdentifier : openmrsPatient.identifiers[0].identifier;
            patient.extraIdentifiers = [];
            for (var i = 0; i < openmrsPatient.identifiers.length; i++) {
                if (openmrsPatient.identifiers[i].identifier != patient.identifier) {
                    patient.extraIdentifiers.push({
                        "type": openmrsPatient.identifiers[i].identifierType.display,
                        "value": openmrsPatient.identifiers[i].identifier
                    });
                }
            }
        }

        if (openmrsPatient.person.birthdate) {
            patient.birthdate = parseDate(openmrsPatient.person.birthdate);
        }

        if (openmrsPatient.person.personDateCreated) {
            patient.registrationDate = parseDate(openmrsPatient.person.personDateCreated);
        }

        patient.image = Bahmni.Common.Constants.patientImageUrlByPatientUuid + openmrsPatient.uuid;
        return patient;
    };

    this.getPatientConfigByUuid = function (patientConfig, attributeUuid) {
        if (this.patientConfig.personAttributeTypes) {
            return patientConfig.personAttributeTypes.filter(function (item) {
                return item.uuid === attributeUuid;
            })[0];
        }
        return {};
    };

    this.mapAttributes = function (patient, attributes) {
        var self = this;
        if (this.patientConfig) {
            attributes.forEach(function (attribute) {
                var x = self.getPatientConfigByUuid(patientConfig, attribute.attributeType.uuid);
                patient[x.name] = {label: x.description, value: attribute.value, isDateField: checkIfDateField(x) };
            });
        }
    };

    var calculateAge = function (birthDate) {
        var DateUtil = Bahmni.Common.Util.DateUtil;
        var age = DateUtil.diffInYearsMonthsDays(birthDate, DateUtil.now());
        var ageInString = "";
        if (age.years) {
            ageInString += age.years + " <span> " + $translate.instant("CLINICAL_YEARS_TRANSLATION_KEY") + " </span>";
        }
        if (age.months) {
            ageInString += age.months + "<span>  " + $translate.instant("CLINICAL_MONTHS_TRANSLATION_KEY") + " </span>";
        }
        if (age.days) {
            ageInString += age.days + "<span>  " + $translate.instant("CLINICAL_DAYS_TRANSLATION_KEY") + " </span>";
        }
        return ageInString;
    };

    var mapAddress = function (preferredAddress) {
        return preferredAddress ? {
            "address1": preferredAddress.address1,
            "address2": preferredAddress.address2,
            "address3": preferredAddress.address3,
            "cityVillage": preferredAddress.cityVillage,
            "countyDistrict": preferredAddress.countyDistrict === null ? '' : preferredAddress.countyDistrict,
            "country": preferredAddress.country === null ? '' : preferredAddress.country,
            "stateProvince": preferredAddress.stateProvince
        } : {};
    };

    var parseDate = function (dateStr) {
        if (dateStr) {
            return Bahmni.Common.Util.DateUtil.parse(dateStr.substr(0, 10));
        }
        return dateStr;
    };

    var mapGenderText = function (genderChar) {
        if (genderChar == null) {
            return null;
        }
        return "<span>" + $rootScope.genderMap[angular.uppercase(genderChar)] + "</span>";
    };

    var getPatientBloodGroupText = function (openmrsPatient) {
        if (openmrsPatient.person.bloodGroup) {
            return "<span>" + openmrsPatient.person.bloodGroup + "</span>";
        }
        if (openmrsPatient.person.attributes && openmrsPatient.person.attributes.length > 0) {
            var bloodGroup;
            _.forEach(openmrsPatient.person.attributes, function (attribute) {
                if (attribute.attributeType.display == "bloodGroup") {
                    bloodGroup = attribute.display;
                }
            });
            if (bloodGroup) {
                return "<span>" + bloodGroup + "</span>";
            }
        }
    };

    var getPatientLocalName = function (openmrsPatient) {
        if (openmrsPatient.person.localName) {
            return openmrsPatient.person.localName;
        }
        if (openmrsPatient.person.attributes && openmrsPatient.person.attributes.length > 0) {
            var n1, n2, n3, n4;
            _.forEach(openmrsPatient.person.attributes, function (attribute) {
                if (attribute.attributeType.display == "givenNameLocal") {
                    n1 = attribute.value;
                }
                if (attribute.attributeType.display == "middleNameLocal") {
                    n2 = attribute.value;
                }
                if (attribute.attributeType.display == "grandfatherNameLocal") {
                    n3 = attribute.value;
                }
                if (attribute.attributeType.display == "familyNameLocal") {
                    n4 = attribute.value;
                }
            });
            var localName = [n1, n2, n3, n4].filter(function (n) { return n != undefined; }).join(' ');
            if (localName) {
                return localName;
            }
        }
    };

    var checkIfDateField = function (x) {
        return x.format === Bahmni.Common.Constants.patientAttributeDateFieldFormat;
    };
};
