'use strict';

angular.module('bahmni.common.orders')
    .factory('radiologyObsService', ['$http', '$filter', '$q', function ($http, $filter, $q) {
        // get a set of obervations by date by patient uuid
        var getObs = function (data) {
            var params = {};
            if (data.obsdate) {
                params.q = 'radiology.sqlSearch.obsByDate';
                params.obs_date = $filter('date')(data.obsdate, 'yyyy-MM-dd');
            } else if (data.patientuuid) {
                params.q = 'radiology.sqlSearch.obsByPatient';
                params.patient_uuid = data.patientuuid;
            }
            params.v = 'default';
            return $http.get(Bahmni.Common.Constants.sqlUrl, {
                params: params,
                withCredentials: true
            }).then(function (response) {
                return response.data.map(function (item) {
                    return {
                        obsGroupUuid: item.obs_group_uuid,
                        obsNoteUuid: item.obs_note_uuid,
                        obsNote: item.obs_note_value,
                        obsExtUuid: item.obs_ext_uuid,
                        obsExt: item.obs_ext_value,
                        obsExtDate: moment(item.obs_ext_date, 'YYYY-MM-DD').toDate(),
                        obsNoteDatetime: new Date(item.obs_note_date),
                        obsProvider: item.obs_provider,
                        obsProviderUuid: item.obs_provider_uuid
                    };
                });
            });
        };

        // set observation on appropriate orders
        var addObsToOrders = function (obs, orders) {
            orders.forEach(function (order) {
                var orderObs = obs.filter(function (o) {
                    return order.studyUid == o.obsExt;
                });
                if (orderObs && orderObs.length > 0) {
                    order.addObs(orderObs);
                }
            });
        };

        var buildObs = function (bahmniOrder, context, text) {
            var obs = {
                concept: context.obsGroupConceptId,
                groupMembers: [{
                    concept: context.obsNoteConceptId,
                    value: text
                }, {
                    concept: context.obsExtConceptId,
                    value: bahmniOrder.studyUid,
                    obsDatetime: bahmniOrder.orderDate.toISOString()
                }]
            };

            var currentdate = new Date();

            if (bahmniOrder.obs && bahmniOrder.obs.obsGroupUuid) {
                // edit/delete obs
                obs.uuid = bahmniOrder.obs.obsGroupUuid;
                obs.groupMembers[0].uuid = bahmniOrder.obs.obsNoteUuid;
                obs.groupMembers[1].uuid = bahmniOrder.obs.obsExtUuid;
            } else {
                // create obs
                obs.person = bahmniOrder.patientUuid;
                obs.location = context.locationUuid;
                obs.obsDatetime = currentdate.toISOString();
                obs.groupMembers[0].person = bahmniOrder.patientUuid;
                obs.groupMembers[0].obsDatetime = currentdate.toISOString();
                obs.groupMembers[1].person = bahmniOrder.patientUuid;
            }
            return obs;
        };

        /* context = {
            locationUuid
            obsGroupConceptId
            obsNoteConceptId
            obsExtConceptId
        }; */
        var saveObsFromOrder = function (bahmniOrder, context, text) {
            var obs = buildObs(bahmniOrder, context, text);
            var url = '/openmrs/ws/rest/v1/obs';
            url = obs.uuid ? url + '/' + obs.uuid : url;

            return $http.post(url, obs, {
                withCredentials: true,
                headers: {"Accept": "application/json", "Content-Type": "application/json"}
            }).then(function (data) {
                // refresh observations of the order (since returned data doesn't contain all info needed)
                return getObs({patientuuid: bahmniOrder.patientUuid}).then(function (obs) {
                    addObsToOrders(obs, [bahmniOrder]);
                    return bahmniOrder;
                });
            }, function (reason) {
                return Promise.reject(reason);
            });
        };

        var delObsFromOrder = function (bahmniOrder) {
            if (!bahmniOrder.obs || !bahmniOrder.obs.obsGroupUuid) {
                return Promise.reject('Observation note not found');
            }
            var urlObs = [bahmniOrder.obs.obsNoteUuid, bahmniOrder.obs.obsExtUuid].map(function (uuid) {
                return '/openmrs/ws/rest/v1/obs/' + uuid;
            });
            var urlObsGroup = '/openmrs/ws/rest/v1/obs/' + bahmniOrder.obs.obsGroupUuid;
            var config = {params: {purge: false}, withCredentials: true};
            var po1 = $http.delete(urlObs[0], config);
            var po2 = $http.delete(urlObs[1], config);
            return $q.all([po1, po2]).then(function (data) {
                return $http.delete(urlObsGroup, config).then(function (data) {
                    // remove obs from order
                    bahmniOrder.obs = '';
                    bahmniOrder.obsNote = '';
                }, function (reason) { Promise.reject(reason); });
            }, function (reason) { Promise.reject(reason); });
        };

        return {
            getObs: getObs,
            addObsToOrders: addObsToOrders,
            saveObsFromOrder: saveObsFromOrder,
            delObsFromOrder: delObsFromOrder
        };
    }]);
