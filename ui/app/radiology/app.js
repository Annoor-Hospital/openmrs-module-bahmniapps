'use strict';

angular.module('radiology', ['ui.router', 'bahmni.common.config', 'bahmni.radiology', 'bahmni.common.patient',
    'authentication', 'bahmni.common.appFramework', 'ngDialog', 'httpErrorInterceptor', 'bahmni.common.domain', 'bahmni.common.i18n',
    'bahmni.common.uiHelper', 'ngSanitize', 'bahmni.common.patientSearch', 'bahmni.common.util', 'bahmni.common.routeErrorHandler', 'pascalprecht.translate', 'ngCookies', 'bahmni.common.offline']);
angular.module('radiology').config(['$stateProvider', '$httpProvider', '$urlRouterProvider', '$bahmniTranslateProvider', '$compileProvider',
    function ($stateProvider, $httpProvider, $urlRouterProvider, $bahmniTranslateProvider, $compileProvider) {
        $urlRouterProvider.otherwise('/review');
        var queueBackLink = {label: "", state: "review", accessKey: "r", id: "review-link", icon: "fa-list"};
        var homeBackLink = {label: "", url: "../home/", accessKey: "h", icon: "fa-home"};

        // @if DEBUG='production'
        $compileProvider.debugInfoEnabled(false);
        // @endif

        // @if DEBUG='development'
        $compileProvider.debugInfoEnabled(true);
        // @endif
        $stateProvider
        .state('review', {
            url: '/review',
            data: {
                backLinks: [homeBackLink]
            },
            views: {
                'header': {
                    templateUrl: '../common/ui-helper/header.html'
                },
                'content': {
                    templateUrl: 'views/radiologyReview.html',
                    controller: 'ReviewController'
                }
            },
            resolve: {
                initialization: 'initialization'
            }
        })
        .state('error', {
            url: '/error',
            views: {
                'content': {
                    templateUrl: '../common/ui-helper/error.html'
                }
            }
        });

        $httpProvider.defaults.headers.common['Disable-WWW-Authenticate'] = true;
        $bahmniTranslateProvider.init({app: 'radiology', shouldMerge: true});
    }]).run(['backlinkService', function (backlinkService) {
        FastClick.attach(document.body);

        

        backlinkService.addBackUrl();
    }]);
