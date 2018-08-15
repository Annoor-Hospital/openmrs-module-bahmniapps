'use strict';

angular.module('bahmni.common.dashboard')
    .directive('dashboard', ['dashboardService', function (dashboardService) {
        var controller = function ($scope, $filter) {
            // ??
            // var init = function () {
            //     $scope.dashboard = Bahmni.Common.Dashboard.create($scope.config || {});
            // };
            // var unbindWatch = $scope.$watch('config', init);
            // $scope.$on("$stateChangeStart", unbindWatch);
            // $scope.sectionGroups = createSectionGroups($scope.dashboard);
            $scope.sectionGroups = createSectionGroups($scope.config.sections);
        };

        var createSectionGroups(sectionConfigs){
            var sectionGroups = [];
            var currentGroup = null;
            // iterate key-value pairs in json config of dashboard
            var prev_type = null;
            var default_type = function(prev_type){
                if(prev_type == "Half-Left") return "Half-Right";
                return "Half-Left";
            }
            var needNewGroup = function(group, displayType){
                if(group == null) return true;
                if(group.type == "full" && displayType != "Full-Page") return true;
                if(group.type == "half" && (displayType != "Half-Left" && displayType != "Half-Right")) return true;
                return false;
            }
            Object.keys(sectionConfigs).forEach(function(key) {
                displayType = sectionConfigs[key].displayType || default_type(prev_type);
                if(needNewGroup(currentGroup, displayType)){
                    sectionGroups.push(currentGroup);
                    currentGroup = {left: [],right: [],full: []};
                    if(displayType == "Full-Page") currentGroup.type = "full";
                    if(displayType == "Half-Left" || displayType == "Half-Right") currentGroup.type = "half";
                }
                if(displayType == "Half-Left") currentGroup.left.push(sectionConfigs[key]);
                if(displayType == "Half-Right") currentGroup.right.push(sectionConfigs[key]);
                if(displayType == "Full-Page") currentGroup.full.push(sectionConfigs[key]);
                prev_type = displayType;
            }
            if(currentGroup !== null) sectionGroups.push(currentGroup);
            return sectionGroups;
        }

        return {
            restrict: 'E',
            controller: controller,
            templateUrl: "../common/dashboard/views/dashboard.html",
            scope: {
                config: "=",
                patient: "=",
                visit: "?=",
                //diseaseTemplates: "=",
                //sectionGroups: "=",
                //visitHistory: "=",
                //activeVisitUuid: "=",
                //visitSummary: "=",
                //enrollment: "="
            }
        };
    }]);
