// Register the components of the module to make them available to a kind of global injection pool
'use strict';
var Bahmni = Bahmni || {};
Bahmni.DicomRadiology = Bahmni.DicomRadiology || {};

angular.module('bahmni.DicomRadiology', ['bahmni.common.dashboard']).run(function(dashboardService){
    dashboardService.registerSection("pacs");
});
