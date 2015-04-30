'use strict';

angular.module('deployrUi')
    .controller('LoginCtrl', ['$rootScope', '$scope', '$deployr', '$state',
        function($rootScope, $scope, $deployr, $state) {
            if (!$deployr.validEndpoint()) {                
                //$state.go('content');
                //return;
            }

            $scope.user = {
                username: '',
                password: ''
            };
            $scope.progress = false;

            $scope.login = function(username, password) {
                $scope.progress = true;
                $deployr.login($scope.user.username, $scope.user.password)
                    .then(function(res) {
                        $rootScope.currentUser = res.get('user');
                        $deployr.es();
                        $state.go('content');
                    }, function(err) {
                        $scope.$apply(function(){ $scope.error = err; });
                    })
                    .ensure(function() {
                    	$rootScope.authenticating = false;
                        $scope.progress = false;
                    });
            };
        }
    ]);
