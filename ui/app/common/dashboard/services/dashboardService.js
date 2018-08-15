'use strict';
angular.module('bahmni.common.dashboard')
    .factory('dashboardService', [function () {
        // key: value is camelToKebab: camel-to-kebab
        var dashboardSections = {};
        var registerSection = function(name){
            dashboardSections[name] = name;
        };
        var hasSection = function(name){
            if(!dashboardSections.hasOwnProperty(name)) return null;
            return dashboardSections[name];
        };

        return {
            registerSection: registerSection,
            hasSection: hasSection
        }
    }]