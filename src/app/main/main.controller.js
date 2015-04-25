'use strict';

angular.module('deployrUi')
    .config(function($mdIconProvider) {
        // Configure URLs for icons specified by [set:]id.
        $mdIconProvider
            .defaultIconSet('my/app/icons.svg') // Register a default set of SVG icons
            //.iconSet('social', 'my/app/social.svg') // Register a named icon set of SVGs
            //.icon('android', 'my/app/android.svg') // Register a specific icon (by name)
            //.icon('work:chair', 'my/app/chair.svg'); // Register icon in a specific set
    })
    .controller('MainCtrl', function($scope) {
        $scope.awesomeThings = [{
            'title': 'AngularJS',
            'url': 'https://angularjs.org/',
            'description': 'HTML enhanced for web apps!',
            'logo': 'angular.png'
        }, {
            'title': 'BrowserSync',
            'url': 'http://browsersync.io/',
            'description': 'Time-saving synchronised browser testing.',
            'logo': 'browsersync.png'
        }, {
            'title': 'GulpJS',
            'url': 'http://gulpjs.com/',
            'description': 'The streaming build system.',
            'logo': 'gulp.png'
        }, {
            'title': 'Jasmine',
            'url': 'http://jasmine.github.io/',
            'description': 'Behavior-Driven JavaScript.',
            'logo': 'jasmine.png'
        }, {
            'title': 'Karma',
            'url': 'http://karma-runner.github.io/',
            'description': 'Spectacular Test Runner for JavaScript.',
            'logo': 'karma.png'
        }, {
            'title': 'Protractor',
            'url': 'https://github.com/angular/protractor',
            'description': 'End to end test framework for AngularJS applications built on top of WebDriverJS.',
            'logo': 'protractor.png'
        }, {
            'title': 'Angular Material Design',
            'url': 'https://material.angularjs.org/#/',
            'description': 'The Angular reference implementation of the Google\'s Material Design specification.',
            'logo': 'angular-material.png'
        }, {
            'title': 'Less',
            'url': 'http://lesscss.org/',
            'description': 'Less extends the CSS language, adding features that allow variables, mixins, functions and many other techniques.',
            'logo': 'less.png'
        }];
        angular.forEach($scope.awesomeThings, function(awesomeThing) {
            awesomeThing.rank = Math.random();
        });
    })
    .filter('startFrom', function() {
        return function(input, start) {
            start = +start;
            return input.slice(start);
        }
    });
