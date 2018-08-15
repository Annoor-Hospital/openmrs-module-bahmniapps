'use strict';

angular.module('bahmni.common.dashboard')
    .directive('dashboardSection', ['dashboardSectionService', function (dashboardSectionService) {
        var bahmniSections = [
            "patientObservationChart" // example
        ];
        var link = function(scope, element, attributes){
            var type = attributes.section.type;
            if(dashboardSectionService.hasSection(type) || bahmniSections.indexOf(type) > -1 ){
                var directiveName = camel2kebab(type);
                // load the associated directive in place of this directive
                var replacement = $compile('<' + directiveName + '></' + directiveName + '>')
                for(var a in attributes.$attr) {
                  if(a.toLowerCase() != 'type')
                    replacement.attr(a, attributes[a]);
                }
                element.replaceWith(replacement);
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
