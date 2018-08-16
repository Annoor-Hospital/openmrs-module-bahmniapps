'use strict';

angular.module('bahmni.common.dashboard')
    .directive('dashboardSection', ['dashboardSectionService', function (dashboardSectionService) {
        var bahmniSections = [
            "patientObservationChart" // example
        ];
        var link = function(scope, element, attributes){
            if(attributes.section) {
                var type = attributes.section.type;
                // is the section valid?
                if(dashboardSectionService.hasSection(type) || bahmniSections.indexOf(type) > -1 ){
                    var directiveName = camel2kebab(type);
                    var replacement = $compile('<' + directiveName + '></' + directiveName + '>')
                    
                    var contextConfig = null;
                    if(attributes["context"]) {
                        var tryConfig = attributes["context"] + "Config";
                        if(attributes.section[tryConfig]) contextConfig = tryConfig;
                    }
                    if(contextConfig === null && attributes.section["config"]) contextConfig = "config";
                    if(contextConfig === null && attributes.section["dashboardConfig"]) contextConfig = "dashboardConfig";

                    if (attributes["config"])  replacement.attr("config", attributes["section"]);
                    if (contextConfig)         replacement.attr("contextConfig", attributes.section[contextConfig]);
                    if (attributes["patient"]) replacement.attr("patient", attributes["patient"]);
                    if (attributes["visit"])   replacement.attr("visit", attributes["visit"]);

                    // for(var a in attributes.$attr) {
                    //   if(a.toLowerCase() != 'type')
                    //     replacement.attr(a, attributes[a]);
                    // }
                    element.replaceWith(replacement);
                }
            }
        };
        var camel2kebab = function(name){
            var match = /^[a-z][a-zA-Z0-9]*/;
            if(!match.test(name)) throw name + " is not camel case!";
            return name.replace(/[A-Z]/g, '-$1').toLowerCase();
        };
        return {
            restrict: 'E',
            replace: true,
            link: link
        };
    }]);
