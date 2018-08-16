'use strict';

/*
getVisit here is entirely unused (other than with a params option).
Todo:
- visit contains no encounter data, just a list of uuids. Map to the visit model.
- hook up edit, delete, start visit, end visit
 */

var visit_query = "                          \
custom:(                                     \
    uuid,                                    \
    voided,                                  \
    startDatetime,                           \
    stopDatetime,                            \
    location,                                \
    visitType:(                              \
        uuid,                                \
        name,                                \
        retired                              \
    ),                                       \
    patient:(                                \
        uuid,                                \
        name,                                \
        voided                               \
    ),                                       \
    encounters:(                             \
        uuid,                                \
        voided,                              \
        encounterType:(uuid,name,retired),   \
    )                                        \
)                                            \
".replace(/[\t\n ]/g, "");

angular.module('bahmni.common.domain')
    .service('visitService', ['$http', function ($http) {
        this.getVisit = function (uuid) {
            var parameters = visit_query;
            return $http.get(Bahmni.Common.Constants.visitUrl + '/' + uuid, {
                params: {v:parameters},
                withCredentials: true
            }).then(function(accept){

            }, function(reject){
                throw "Request failed: " + reject.status + " : " + reject.statusText;
                //console.log(reject.data);
                //return null;
            });
        };
    }]);
