'use strict';

angular.module('bahmni.common.patientSearch')
    .service('criteriaSearchService', ['$http', function ($http) {

    var search_url = "/openmrs/module/patientsearch/search.form";

    this.search = function(params) {
      return $http.get(search_url, {params: params});
    }
}]);