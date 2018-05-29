'use strict';

angular.module('bahmni.common.patientSearch')
.directive('criteriaSearch', ['$window', '$filter', 'configurationService', 'providerService', 'diagnosisService', 'messagingService', function ($window, $filter, configurationService, providerService, diagnosisService, messagingService) {
    var controller = function ($scope) {

        var all_criteria = {
          'name': 'Name',
          'age': 'Age',
          'gender': 'Gender',
          'id': 'ID',
          'address': 'Address',
          'visit_date': 'Visit Date',
          'provider': 'Provider',
          'diag': 'Diagnosis'
        }
        $scope.conditions = [];
        $scope.id_types = {}
        $scope.providers = {}

        var init = function (){
          addEmtpyCondition();
          $scope.all_criteria = all_criteria;

          providerService.list().then(function (response){
            var providers = {};
              for( var i = 0; i < response.data.results.length; i++) {
                var provider = response.data.results[i];
                if (provider.display == "") continue;
                providers[provider.uuid] = provider.display;
              }
              $scope.providers = providers;
          });

          configurationService.getConfigurations(['identifierTypesConfig']).then(function (response) {
              var id_types = {};
              for( var i = 0; i < response.identifierTypesConfig.length; i++) {
                var id_conf = response.identifierTypesConfig[i];
                id_types[id_conf.uuid] = id_conf.name;
              }
              $scope.id_types = id_types;
          });
        }

        var addEmtpyCondition = function (){
          $scope.conditions.push({});
        }

        $scope.update_row = function (row) {
          if(!row.condition_type && row !== $scope.conditions[$scope.conditions.length-1]) {
            const i = $scope.conditions.indexOf(row);
            if(i>=0) $scope.conditions.splice(i, 1);
          }else{
            if (row.condition_type == 'name') {
              row.name_type = 'firstname';
            }
            if (row.condition_type == 'id') {
              row.id_type = 'any';
            }
            if (row.condition_type == 'diag') {
              row.diag = {};
            }
            if(row === $scope.conditions[$scope.conditions.length-1]) addEmtpyCondition();
          }
        }

        $scope.getDiagnosis = function (params) {
          var res = diagnosisService.getAllFor(params.term).then(mapConcept);
          return res;
        }

        var mapConcept = function (result) {
            return _.map(result.data, function (concept) {
                if (concept.conceptName === concept.matchedName) {
                    return {
                        value: concept.matchedName,
                        concept: {
                            name: concept.conceptName,
                            uuid: concept.conceptUuid
                        },
                        lookup: {
                            name: concept.conceptName,
                            uuid: concept.conceptUuid
                        }
                    };
                }
                return {
                    value: concept.matchedName + "=>" + concept.conceptName,
                    concept: {
                        name: concept.conceptName,
                        uuid: concept.conceptUuid
                    },
                    lookup: {
                        name: concept.matchedName,
                        uuid: concept.conceptUuid
                    }
                };
            });
        };

        $scope.assignUuid = function (data) {
          // when a diagnosis is selected, save the uuid along with the name
          var diag_row = $scope.conditions.find(row => row.condition_type == 'diag');
          if(diag_row) {
            diag_row.diag_concept = {'uuid': data.concept.uuid, 'name': data.concept.name};
          } else {
            diag_row.diag_concept = {};
          }
        }

        $scope.submitCriteria = function () {
          var params = {};
          var fail = false;
          $scope.conditions.forEach(function(row) {
            if(row.condition_type == 'name') {
              if(!row.name || row.name.length < 3) {
                fail = true;
                messagingService.showMessage("error", "Name too short (must be 3 characters or more)");
              }
              params.name = row.name;
              if(row.name_type != "any") params.name_type = row.name_type;
            }
            if(row.condition_type == 'age') {
              var age_from = parseInt(row.age_from);
              var age_to = parseInt(row.age_from);
              if(age_from === "" || age_from < 0 || age_from > 180) {
                fail = true;
                messagingService.showMessage("error", "From age out of range");
              }
              if(age_to === "" || age_to < 0 || age_to > 180) {
                fail = true;
                messagingService.showMessage("error", "To age out of range");
              }
              params.age_from = age_from;
              params.age_to = age_to;
            }
            if(row.condition_type == 'gender') {
              if(!row.gender) {
                fail = true;
                messagingService.showMessage("error", "No gender selected");
              }
              params.gender = row.gender;
            }
            if(row.condition_type == 'id') {
              if(!row.id) {
                fail = true;
                messagingService.showMessage("error", "Need identifier");
              }
              params.id = row.id;
              if(row.id_type != "any") params.id_type_uuid = row.id_type;
            }
            if(row.condition_type == 'address') {
              if(!row.address || row.address.length < 3) {
                fail = true;
                messagingService.showMessage("error", "Address too short (must be 3 characters or more)");
              }
              params.address = row.address;
            }
            if(row.condition_type == 'visit_date') {
              if(!row.visit_date_to) {
                fail = true;
                messagingService.showMessage("error", "Visit date 'to' missing");
              }
              if(!row.visit_date_from) {
                fail = true;
                messagingService.showMessage("error", "Visit date 'from' missing");
              }
              params.visit_date_from = $filter('date')(row.visit_date_from, "ddMMyyyy");
              params.visit_date_to = $filter('date')(row.visit_date_to, "ddMMyyyy");
            }
            if(row.condition_type == 'provider') {
              if(!row.provider) {
                fail = true;
                messagingService.showMessage("error", "No provider selected");
              }
              params.provider_uuid = row.provider;
            }
            if(row.condition_type == 'diag') {
              if(!row.diag_name || row.diag_name != row.diag_concept.name) {
                fail = true;
                messagingService.showMessage("error", "Diagnosis not valid");
              }
              if(row.diag_concept) params.diag_or_obs_uuid = row.diag_concept.uuid;
            }
          });
          if(!fail) {
            $scope.submit(params);
          }
        }

        init();
    };

    return {
        restrict: 'E',
        controller: controller,
        scope: {
            submit: "=",
        },
        templateUrl: "../common/patient-search/views/criteriaSearch.html"
    };
}]).filter('unused_criteria', function(){
    // Filter condition types to not include those used in other rows.
    return function(all_criteria, used_conditions, condition_type) {
      var output = [];
      for (var k in all_criteria) {
        if(k == condition_type || !used_conditions.find(row => row.condition_type == k)) output[k] = all_criteria[k];
      }
      return output;
    }
});
