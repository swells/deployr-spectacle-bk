'use strict';

angular.module('deployrUi')
    .controller('ContentCtrl', ['$rootScope', '$scope', '$deployr', 
        function($rootScope, $scope, $deployr) {
                
        $scope.logout = function() {
            $deployr.logout();
        };
    }]);
