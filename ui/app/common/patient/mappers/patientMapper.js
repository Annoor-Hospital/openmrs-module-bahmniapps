'use strict';

Bahmni.PatientMapper = function (patientConfig) {
    this.patientConfig = patientConfig;

    this.map = function (openmrsPatient) {
        var DateUtil = Bahmni.Common.Util.DateUtil;
        var patient = Bahmni.Common.Patient({
            "uuid": openmrsPatient.uuid,
            "givenName" : openmrsPatient.person.preferredName.givenName,
            "familyName" : openmrsPatient.person.preferredName.familyName,
            "name" : patient.givenName + ' ' + patient.familyName,
            "localName": getLocalName(openmrsPatient),
            "gender" : openmrsPatient.person.gender,
            "birthtime" : getBirthTime(openmrsPatient),
            "birthdateEstimated" : openmrsPatient.person.birthdateEstimated,
            "address" : mapAddress(openmrsPatient.person.preferredAddress),
            "bloodGroup" : getBloodGroup(openmrsPatient),
            "patientImage" : Bahmni.Common.Constants.patientImageUrlByPatientUuid + openmrsPatient.uuid,
            "registrationDate" : getDateCreated(openmrsPatient),
            "birthdate" : getBirthDate(openmrsPatient),
            "attributes" : getAttributes(openmrsPatient),
        });
        if (openmrsPatient.identifiers) {
            var identifier = openmrsPatient.identifiers[0].identifier;
            identifier = identifier ? identifier : openmrsPatient.identifiers[0].identifier;
            var extraIdentifiers = [];
            for (var i = 0; i < openmrsPatient.identifiers.length; i++) {
                if (openmrsPatient.identifiers[i].identifier != identifier) {
                    extraIdentifiers.push({
                        "type": openmrsPatient.identifiers[i].identifierType.display,
                        "value": openmrsPatient.identifiers[i].identifier
                    });
                }
            }
            patient["identifier"] = primaryIdentifier;
            patient["extraIdentifiers"]  = extraIdentifiers;
        }
        
        return patient;
    };

    var getDateCreated = function(openmrsPatient) {
        if(openmrsPatient.person.personDateCreated) {
            return = DateUtil.parseServerDateToDate(openmrsPatient.person.personDateCreated);
        } else {
            return null;
        }
    };

    var getBirthDate = function(openmrsPatient) {
        if(openmrsPatient.person.birthdate) {
            return DateUtil.parseServerDateToDate(openmrsPatient.person.birthdate);
        } else {
            return null;
        }
    };

    var getBirthTime = function(openmrsPatient) {
        if(openmrsPatient.person.birthtime) {
            return DateUtil.parseServerDateToDate(openmrsPatient.person.birthtime)
        } else {
            return null;
        }
    };

    var getAttributes = function(openmrsPatient) {
        if (this.patientConfig && this.patientConfig.personAttributeTypes){
            var getAttrTypeByUuid = function(uuid){
                return _.find(patientConfig.personAttributeTypes, attrType => attrType.uuid = uuid);
            };
            var checkIfDateField = function (attrType) {
                return attrType.format === Bahmni.Common.Constants.patientAttributeDateFieldFormat;
            };
            var attributes = {};
            openmrsPatient.person.attributes.forEach(function(attr){
                attrType = getAttrTypeByUuid(attr.attributeType.uuid);
                attributes[attrType.name] = {
                    label: attrType.description,
                    value: attrType.value,
                    isDateField: checkIfDateField(attrType),
                }
            });
            return attributes;
        }
        return null;
    };

    var getLocalName = function (openmrsPatient) {
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
        return null;
    };

    var getPatientBloodGroup = function (openmrsPatient) {
        if (openmrsPatient.person.bloodGroup) {
            return openmrsPatient.person.bloodGroup;
        }
        if (openmrsPatient.person.attributes && openmrsPatient.person.attributes.length > 0) {
            var bloodGroup;
            _.forEach(openmrsPatient.person.attributes, function (attribute) {
                if (attribute.attributeType.display == "bloodGroup") {
                    bloodGroup = attribute.display;
                }
            });
            if (bloodGroup) {
                return bloodGroup;
            }
        }
        return null;
    };

    var mapAddress = function (preferredAddress) {
        var addressKeys = [
            "address1","address2","address3","cityVillage","countyDistrict","country","stateProvince",
        ];
        var address = [];
        if(preferredAddress){
            _.keys(preferredAddress).filter(k => _.contains(addressKeys, k)).forEach(function(k){
                if(preferredAddress[k] === null) address[k] = '';
            })
        }
        return address;
    };
};
