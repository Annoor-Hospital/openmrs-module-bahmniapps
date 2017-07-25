'use strict';

angular.module('bahmni.common.orders')
    .factory('radiologyObsService', ['$http', '$filter', '$q', function ($http, $filter, $q) {

        // get a set of obervations by date by patient uuid
        var getObsEncounter = function (data) {
            var params = {};
            if (data.obsdate) {
                params.q = 'radiology.sqlSearch.obsByDate';
                params.obs_date = $filter('date')(data.obsdate, 'yyyy-MM-dd');
            } else if(data.patientuuid) {
                params.q = 'radiology.sqlSearch.obsByPatient';
                params.patient_uuid = data.patientuuid
            }
            params.v = 'default';
            return $http.get(Bahmni.Common.Constants.sqlUrl, {
                params: params,
                withCredentials: true
            }).then(function (response) {
                return response.data.map(function (item) {
                    return {
                        encounterUuid: item.encounter_uuid,
                        obsGroupUuid: item.obs_group_uuid,
                        obsNoteUuid: item.obs_note_uuid,
                        obsNote: item.obs_note_value,
                        obsExtUuid: item.obs_ext_uuid,
                        obsExtDate: item.obs_ext_date,
                        obsExt: item.obs_ext_value,
                        encounterProviderUuid: item.encounter_provider_uuid
                    };
                });
            });
        };

        // set observation encounter on appropriate orders
        var addObsEncounterToOrders = function (encounters, orders) {
            for (var i = 0; i < encounters.length; i++) {
                var order = orders.find(function (item) {
                    return item.studyuid == encounters[i].obsExt;
                });
                // only fullfilled orders can have studyuid
                order.addObsEncounter(encounters[i]);
            }
        };

        var buildObsEncounter = function (bahmniOrder, context) {
            var obsEncounter = {
                obs: [{
                    concept: context.obsGroupConceptId,
                    groupMembers: [{
                        concept: context.obsNoteConceptId,
                        value: bahmniOrder.obsNote
                    }, {
                        concept: context.obsExtConceptId,
                        value: bahmniOrder.studyuid,
                        obsDatetime: bahmniOrder.orderDate.toISOString()
                    }]
                }]
            };

            if (bahmniOrder.obsEncounter && bahmniOrder.obsEncounter.encounterUuid) {
                // edit/delete encounter
                obsEncounter.uuid = bahmniOrder.obsEncounter.encounterUuid;
                obsEncounter.obs[0].uuid = bahmniOrder.obsEncounter.obsGroupUuid;
                obsEncounter.obs[0].groupMembers[0].uuid = bahmniOrder.obsEncounter.obsNoteUuid;
                obsEncounter.obs[0].groupMembers[1].uuid = bahmniOrder.obsEncounter.obsExtUuid;
            } else {
                // create encounter
                obsEncounter.patient = bahmniOrder.patientUuid;
                obsEncounter.encounterType = context.encounterTypeUuid;
                obsEncounter.location = context.encounterLocationUuid;
                obsEncounter.encounterProviders = [{
                    provider: context.encounterProviderUuid,
                    encounterRole: context.encounterRoleUuid
                }];
                obsEncounter.visit = context.visitUuid;
            }
            return obsEncounter;
        };

        /*context = {
            encounterTypeUuid
            encounterLocationUuid
            encounterProviderUuid
            encounterRoleUuid
            visitUuid
            obsGroupConceptId
            obsNoteConceptId
            obsExtConceptId
        };*/
        var saveObsFromOrder = function (bahmniOrder, context) {
            var obsEncounter = buildObsEncounter(bahmniOrder, context);
            var url = '/openmrs/ws/rest/v1/encounter';
            var url  = obsEncounter.uuid ? url + '/' + obsEncounter.uuid : url;

            return $http.post(url, obsEncounter, {
                withCredentials: true,
                headers: {"Accept": "application/json", "Content-Type": "application/json"}
            }).then(function (data){
                // add the new uuids to the existing order
                return getObsEncounter({patientuuid: bahmniOrder.patientUuid}).then( function (obs) {
                    addObsEncounterToOrders(obs, [bahmniOrder]);
                    return bahmniOrder;
                });
            }, function (reason) {
                return Promise.reject(reason);
            });
        }

        var delObsFromOrder = function (bahmniOrder) {
            if (!(bahmniOrder.obsEncounter && bahmniOrder.obsEncounter.encounterUuid)) {
                return Promise.reject('Observation note not found');
            }
            var urlObs = [bahmniOrder.obsEncounter.obsNoteUuid, bahmniOrder.obsEncounter.obsExtUuid].map(function (uuid) {
                return '/openmrs/ws/rest/v1/obs/' + uuid;
            });
            var urlObsGroup = '/openmrs/ws/rest/v1/obs/' + bahmniOrder.obsEncounter.obsGroupUuid;
            var urlEncounter = '/openmrs/ws/rest/v1/encounter/' + bahmniOrder.obsEncounter.encounterUuid;
            // var urlEncounterProvider = urlEncounter + '/encounterProvider/' + bahmniOrder.obsEncounter.encounterProviderUuid;
            var config = {params: {purge: false}, withCredentials: true};
            var po1 = $http.delete(urlObs[0], config);
            var po2 = $http.delete(urlObs[1], config);
            return $q.all([po1,po2]).then(function (data) {
                return $http.delete(urlObsGroup, config).then(function (data){
                    return $http.delete(urlEncounter).then(function (data) {
                        // remove uuids from order
                        bahmniOrder.obsEncounter = '';
                    });
                }, function (reason) { Promise.reject(reason) });
            }, function (reason) { Promise.reject(reason) });
        }

        return {
            getObsEncounter: getObsEncounter,
            addObsEncounterToOrders: addObsEncounterToOrders,
            saveObsFromOrder: saveObsFromOrder,
            delObsFromOrder: delObsFromOrder
        };
    }]);
