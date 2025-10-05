'use strict';

angular.module('bahmni.common.orders')
    .factory('radiologyNoteService', ['$http', '$filter', '$q', function ($http, $filter, $q) {
        // get a set of obervations by date by patient uuid
        var getRadiologyNotes = function (data) {
            var params = {};
            if (data.date) {
                params.q = 'radiology.sqlSearch.obsByDate';
                params.obs_date = $filter('date')(data.date, 'yyyy-MM-dd');
            } else if (data.patientuuid) {
                params.q = 'radiology.sqlSearch.obsByPatient';
                params.patient_uuid = data.patientuuid;
            } else {
                throw new Error("need to set either obsdate or patientuuid");
            }
            params.v = 'default';
            return $http.get(Bahmni.Common.Constants.sqlUrl, {
                params: params,
                withCredentials: true
            }).then(function (response) {
                return response.data.map(function (obs) {
                    return mapToRadiologyNote(obs);
                });
            });
        };

        var mapToRadiologyNote = function (obs) {
            var note = new Bahmni.Common.Orders.RadiologyNote();
            note.obsGroupUuid = obs.obs_group_uuid;
            note.obsNoteUuid = obs.obs_note_uuid;
            note.obsNote = obs.obs_note_value;
            note.obsExtUuid = obs.obs_ext_uuid;
            note.obsExt = obs.obs_ext_value;
            note.obsExtDate = moment(obs.obs_ext_date, 'YYYY-MM-DD').toDate();
            note.obsNoteDatetime = new Date(obs.obs_note_date);
            note.obsProvider = obs.obs_provider;
            note.obsProviderUuid = obs.obs_provider_uuid;
            return note;
        };

        // context = {locationUuid, obsGroupConceptId, obsNoteConceptId, obsExtConceptId}
        var buildObs = function (context, text) {
            var obs = {
                concept: context.obsGroupConceptId,
                groupMembers: [{
                    concept: context.obsNoteConceptId,
                    value: text
                }, {
                    concept: context.obsExtConceptId,
                    value: context.studyUid,
                    obsDatetime: context.studyDate
                }]
            };

            if (context.obsGroupUuid) {
                // edit
                obs.uuid = context.obsGroupUuid;
                obs.groupMembers[0].uuid = context.obsNoteUuid;
                obs.groupMembers[1].uuid = context.obsExtUuid;
            } else {
                // create
                var currentdate = new Date();
                obs.person = context.patientUuid;
                obs.location = context.locationUuid;
                obs.obsDatetime = currentdate.toISOString();
                obs.groupMembers[0].person = context.patientUuid;
                obs.groupMembers[0].obsDatetime = currentdate.toISOString();
                obs.groupMembers[1].person = context.patientUuid;
            }
            return obs;
        };

        var saveRadiologyNote = function (context, text) {
            var obs = buildObs(context, text);
            var url = '/openmrs/ws/rest/v1/obs';
            url = obs.uuid ? url + '/' + obs.uuid : url;

            return $http.post(url, obs, {
                withCredentials: true,
                headers: {"Accept": "application/json", "Content-Type": "application/json"}
            });
        };

        // // stale code!
        // var delObsFromOrder = function (pacsStudy, ) {
        //     if (!pacsStudy.obs || !pacsStudy.obs.obsGroupUuid) {
        //         return Promise.reject('Observation note not found');
        //     }
        //     var urlObs = [pacsStudy.obs.obsNoteUuid, pacsStudy.obs.obsExtUuid].map(function (uuid) {
        //         return '/openmrs/ws/rest/v1/obs/' + uuid;
        //     });
        //     var urlObsGroup = '/openmrs/ws/rest/v1/obs/' + pacsStudy.obs.obsGroupUuid;
        //     var config = {params: {purge: false}, withCredentials: true};
        //     var po1 = $http.delete(urlObs[0], config);
        //     var po2 = $http.delete(urlObs[1], config);
        //     return $q.all([po1, po2]).then(function (data) {
        //         return $http.delete(urlObsGroup, config).then(function (data) {
        //             // remove obs from order
        //             pacsStudy.obs = '';
        //             pacsStudy.obsNote = '';
        //         }, function (reason) { Promise.reject(reason); });
        //     }, function (reason) { Promise.reject(reason); });
        // };

        return {
            getRadiologyNotes: getRadiologyNotes,
            saveRadiologyNote: saveRadiologyNote
            // delObsFromOrder: delObsFromOrder
        };
    }]);
