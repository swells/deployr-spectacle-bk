'use strict';

angular.module('deployrUi')
    .config(function($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/');
        $stateProvider
            .state('content', {
                url: '/',
                //templateUrl: 'compenents/content/content.html',
                templateUrl: 'app/components/content/content.html',
                /*
                templateProvider: function($templateCache) {
                    console.log('...templete....')
                    console.log($templateCache.get('app/components/content/content.html'));
                    return $templateCache.get('app/components/content/content.html');
                },
                */
                //controller: ContentCtrl,
                data: {
                    requireLogin: true
                }
            })
            .state('login', {
                url: '/login',
                templateUrl: 'app/components/login/login.html',
                data: {
                    requireLogin: false
                }
            });          
    }) // config
    .controller('MainCtrl', function($scope) {

    })
    .filter('startFrom', function() {
        return function(input, start) {
            start = +start;
            return input.slice(start);
        }
    })
    .run(function($rootScope, $state) {
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams) {
            var requireLogin = toState.data.requireLogin;   
            if ($rootScope.auth && requireLogin && typeof $rootScope.currentUser === 'undefined') {
                event.preventDefault();
                $state.go('login');
            }
        });
    });