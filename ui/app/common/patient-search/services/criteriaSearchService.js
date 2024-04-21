'use strict';

angular.module('bahmni.common.patientSearch')
    .service('criteriaSearchService', ['$http', function ($http) {
        var searchUrl = "/openmrs/module/patientsearch/search.form";
        this.search = function (params) {
            return $http.get(searchUrl, {params: params});
        };
    }]);
