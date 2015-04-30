'use strict';

var app = angular.module('deployrUi.directives', ['deployrUi']);

function diServerDirective($deployr) {
    return {
        restrict: 'EA',
        scope: {
            endpoint: '@',
            cors: '@'
        },
        link: function($scope, element, attrs) {
            $deployr.configure(attrs.endpoint, attrs.cors, attrs.auth)
        }
    };
}

function diRScriptDirective($deployr) {
    return {
        restrict: 'E',
        scope: {
            name: '@',
            author: '@',
            directory: '@',
            inputs: '@',
            outputs: '@',
            es: '@',
            onload: '@'
        },
        compile: function() {
            return {
                pre: function(scope, element, attrs) {
                    $deployr.registarScript({
                        name: attrs.name,
                        author: attrs.author,
                        directory: attrs.directory,
                        inputs: attrs.inputs,
                        outputs: attrs.outputs,
                        es: attrs.es,
                        onload: attrs.onload
                    });
                }
            }
        }
    };
}

function diRCodeDirective($deployr) {
    return {
        restrict: 'E',
        scope: {
            name: '@',
            author: '@',
            directory: '@',
            inputs: '@',
            outputs: '@',
            es: '@',
            onload: '@'
        },
        compile: function() {
            return {
                pre: function(scope, element, attrs) {
                    var block = element.html();

                    var htmlEncode = function(html) {
                        return html.replace(/&amp;/g, '&')
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, '\'')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt/g, '>;');
                    };

                    element.empty();
                    $deployr.registarCode({
                        name: attrs.name,
                        inputs: attrs.inputs,
                        outputs: attrs.outputs,
                        es: attrs.es,
                        onload: attrs.onload,
                        block: htmlEncode(block)
                    });
                }
            }
        }
    };
}

//  <di-input rscript="myScript" rinput="a" rclass="numeric" label="input a" />
function diInputDirective($deployr, $compile, $rootScope) {
    return {
        restrict: 'E',
        scope: {
            label: '@',
            placeholder: '@',
            rtype: '@',
            rinput: '@',
            rscript: '@'
        },
        link: function(scope, element, attrs) {
            var rscript = attrs.rscript,
                rinput = attrs.rinput,
                linkFn = $compile('<md-input-container>' +
                    '<label>' + attrs.label + '</label>' +
                    '<input ng-model="rscript.' + rscript + '.inputs.' + rinput + '" placeholder="">' +
                    '</md-input-container>');

            if (attrs.watch === 'true') {
                $rootScope.rscript[rscript].watches.push(rinput);
            }

            //$rootScope.rscript[rscript].inputs[rinput] = value;
            $rootScope.rscript[rscript].rtypes[rinput] = attrs.rtype;

            element.append(linkFn($rootScope));
        }
    };
}

// <md-slider flex min="0" max="255" ng-model="color.red" aria-label="red" id="red-slider" class>
function diSliderDirective($deployr, $compile, $rootScope, $timeout) {
    return {
        restrict: 'E',
        scope: {
            value: '@',
            max: '@',
            min: '@',
            rtype: '@',
            rinput: '@',
            rscript: '@'
        },
        link: function(scope, element, attrs) {
            var rctx = attrs.rscript || attrs.rcode,
                rinput = attrs.rinput,
                min = attrs.min || 0,
                max = attrs.max || 100,
                value = attrs.value || 0,
                step = attrs.step || 1,
                debounce,
                linkFn,
                ctx = attrs.rscript ? 'rscript' : 'rcode';

            $rootScope[ctx][rctx].inputs[rinput] = value;
            $rootScope[ctx][rctx].rtypes[rinput] = attrs.rtype;

            linkFn = $compile('<md-slider flex min="' + min + '" max="' + max + '"' +
                'ng-model="' + ctx + '.' + rctx + '.inputs.' + rinput + '"' +
                'id="red-slider" aria-label="red" md-discrete class step="' + step + '">' +
                '</md-slider>');

            element.append(linkFn($rootScope));

            if (attrs.watch === 'true') {
                //$rootScope.$watch('rscript.' + rctx + '.inputs.' + rinput, function(n, o) {

                $rootScope.$watch(ctx + '.' + rctx + '.inputs.' + rinput, function(n, o) {
                    if (n !== o) {
                        $timeout.cancel(debounce);
                        debounce = $timeout(function() {
                            $deployr.exe($rootScope[ctx][rctx]);
                        }, attrs.debounce || 500);
                    }
                }, true);
            }
        }
    };
}

function diCheckboxDirective($deployr, $compile, $rootScope) {
    return {
        restrict: 'E',
        transclude: false,
        scope: {
            value: '@',
            rtype: '@',
            rinput: '@',
            rscript: '@'
        },

        link: function(scope, element, attrs) {
            var rscript = attrs.rscript,
                rinput = attrs.rinput,
                value = attrs.value === 'true' ? true : false,
                el = angular.element(element);

            if (attrs.watch === 'true') {
                $rootScope.rscript[rscript].watches.push(rinput);
            }

            $rootScope.rscript[rscript].inputs[rinput] = value;
            $rootScope.rscript[rscript].rtypes[rinput] = attrs.rtype;

            var html = '<md-checkbox ng-model="rscript.' + rscript + '.inputs.' + rinput + '">' +
                element.html() +
                '</md-checkbox>';

            el.empty();
            el.append($compile(html)($rootScope));
        }
    };
}

function diSelectDirective($deployr, $compile, $rootScope) {
    return {
        restrict: 'E',
        scope: {
            placeholder: '@',
            label: '@',
            selected: '@',
            watch: '@',
            rtype: '@',
            rinput: '@',
            rscript: '@'
        },
        link: function(scope, element, attrs) {
            var rscript = attrs.rscript,
                rinput = attrs.rinput,
                selected = attrs.selected,
                placeholder = attrs.placeholder || '',
                label = attrs.label ? '<p style="margin-bottom:5px;">' + attrs.label + '</p>' : '',
                el = angular.element(element);

            if (selected) {
                switch (attrs.rtype) {
                    case 'numeric':
                        selected = parseFloat(selected);
                        break;

                    case 'integer':
                        selected = parseInt(selected);
                        break;

                    case 'logical':
                        selected = selected === 'true' ? true : false;
                        break;

                    default:
                        // character
                        break;
                }
            }

            if (attrs.watch === 'true') {
                $rootScope.rscript[rscript].watches.push(rinput);
            }

            $rootScope.rscript[rscript].inputs[rinput] = selected;
            $rootScope.rscript[rscript].rtypes[rinput] = attrs.rtype;

            var html = label + '<md-select' + (attrs.label ? ' style="margin-top:0px;"' : '') + ' placeholder="' + placeholder + '" ' +
                'ng-model="rscript.' + rscript + '.inputs.' + rinput + '">' +
                element.html().replace(/di-/gi, 'md-') +
                '</md-select>';

            el.empty();
            el.append($compile(html)($rootScope));
        }
    };
}

// <img ng-href="rscript.myscript.outputs.x" height="300px"/>
function diPlotDirective($deployr, $compile, $rootScope) {
    return {
        restrict: 'E',
        scope: {
            height: '@',
            width: '@',
            routput: '@',
            rscript: '@'
        },
        link: function(scope, element, attrs) {
            var rscript = attrs.rscript,
                routput = attrs.routput,
                height = attrs.height,
                width = attrs.width,
                el = angular.element(element),
                html = '<img ng-src="{{rscript.' + rscript + '.outputs.' + routput + '}}" height="' + height + '"/>';

            el.empty();
            el.append($compile(html)($rootScope));
        }
    };
}


// $mdToast.show($mdToast.simple().content('Hello!'));
function diToastDirective($deployr, $compile, $rootScope, $mdToast) {
    return {
        restrict: 'E',
        scope: {
            es: '@',
            routput: '@',
            rscript: '@',
            hideDelay: '@'
        },
        link: function(scope, element, attrs) {
            var rctx = attrs.rscript || attrs.rcode,
                ctx = attrs.rscript ? 'rscript' : 'rcode';

            if (attrs.es) {
                $rootScope.$watch(ctx + '.' + rctx + '.es.' + attrs.es, function(n, o) {
                    if (n !== o) {
                        $mdToast.show($mdToast.simple().content(n));
                    }
                }, true);
            }
            if (attrs.routput) {
                $rootScope.$watch(ctx + '.' + rctx + '.es.' + attrs.routput, function(n, o) {
                    if (n !== o) {
                        //$mdToast.show($mdToast.simple().content(n).hideDelay(0))//attrs.hideDelay || 3000));
                        $mdToast.show(
                           $mdToast.simple()
                             .content(n)
                             .hideDelay(attrs.hideDelay || 3000)
                        );
                    }
                }, true);
            }            
        }
    };
}

function diTableDirective($deployr) {

    return {
        restrict: 'E',
        scope: {
            headers: '=',
            content: '=',
            sortable: '=',
            filters: '=',
            customClass: '=customClass',
            thumbs: '=',
            count: '='
        },
        controller: function($scope, $filter) {
            var orderBy = $filter('orderBy');
            $scope.tablePage = 0;
            $scope.nbOfPages = function() {
                    return Math.ceil($scope.content.length / $scope.count);
                },
                $scope.handleSort = function(field) {
                    if ($scope.sortable.indexOf(field) > -1) {
                        return true;
                    } else {
                        return false;
                    }
                };
            $scope.order = function(predicate, reverse) {
                $scope.content = orderBy($scope.content, predicate, reverse);
                $scope.predicate = predicate;
            };
            $scope.order($scope.sortable[0], false);
            $scope.getNumber = function(num) {
                return new Array(num);
            };
            $scope.goToPage = function(page) {
                $scope.tablePage = page;
            };
        },
        template: angular.element(document.querySelector('#di-table-template')).html()
    };
}

function diColresizeDirective($timeout) {

    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            scope.$evalAsync(function() {
                $timeout(function() {
                    /*$(element).colResizable({
                        liveDrag: true,
                        fixed: true

                    });*/
                }, 100);
            });
        }
    };
}

app.directive('diServer', diServerDirective)
    .directive('diRscript', diRScriptDirective)
    .directive('diRcode', diRCodeDirective)
    .directive('diInput', diInputDirective)
    .directive('diSlider', diSliderDirective)
    .directive('diCheckbox', diCheckboxDirective)
    .directive('diSelect', diSelectDirective)
    .directive('diPlot', diPlotDirective)
    .directive('diToast', diToastDirective)
    .directive('diTable', diTableDirective)
    .directive('diColresize', diColresizeDirective);
