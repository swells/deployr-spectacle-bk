(function() {
    'use strict';

    angular.module('deployrUi.core', [])
        .service('$deployr', DeployRService);

    function DeployRService($window, $rootScope) {
        var deployr = $window.deployr,
            conf = {},
            request;

        $rootScope.rscript = {};
        $rootScope.rcode = {};

        function responseToModel(name, res) {
            //console.log(res);
            var outputs = Object.keys($rootScope.rscript[name].outputs);
            var used = [];

            // map artifacts to UI output delarations
            if (res.get('artifacts')) {
                res.get('artifacts').forEach(function(artifact) {
                    if (outputs.indexOf(artifact.filename) != -1) {
                        $rootScope.rscript[name].outputs[artifact.filename] = artifact.url;
                        used.push(artifact.filename);
                    }
                });
            }

            // map routputs to UI output delarations
            outputs.forEach(function(output) {
                var obj = res.workspace(output);
                if (obj) {
                    $rootScope.rscript[name].outputs[obj.name] = obj.value;
                    used.push(obj.name);
                }
            });

            // map results/unnamed-plot to any remaing UI output delarations
            if (res.get('results')) {
                res.get('results').forEach(function(result) {
                    for (var o in $rootScope.rscript[name].outputs) {
                        if (used.indexOf(o) === -1) { // miss
                            $rootScope.rscript[name].outputs[o] = result.url;
                            used.push(o);
                        }
                    }
                });
            }

            //console.log($rootScope.rscript[name].outputs);
            $rootScope.$apply();
        }

        function executeScript(rscript) {
            request = (request || deployr).io('/r/repository/script/execute');
            request.data(rscript.data);

            // DeployR encoded rinputs           
            for (var input in rscript.inputs) {
                var rtype = rscript.rtypes[input];
                console.log(input + ' --> ' + rtype + ' = ' + rscript.inputs[input]);
                try {
                    request[rtype](input, rscript.inputs[input]);
                } catch (err) {}
            }

            request
                .routputs(Object.keys(rscript.outputs))
                .error(function(err) {
                    console.log(err);
                })
                .end(function(res) {
                    responseToModel(rscript.id, res);
                });
        }


        return {

            configure: function(endpoint, cors) {
                conf = {
                    host: endpoint,
                    cors: cors
                };
                deployr.configure(conf);
            },

            //registarScript: function(rscript, inputs, outputs, onload) {
            registarScript: function(opts) {
                var name = opts.name;

                name = name.slice(0, -2); // strip .R 

                var rinputs = {},
                    rtypes = {};
                (opts.inputs || []).split(',').forEach(function(input) {
                    rinputs[input] = '';
                    rtypes[input] = {
                        name: input,
                        type: null
                    };
                });

                var routputs = {};
                (opts.outputs || []).split(',').forEach(function(output) {
                    routputs[output] = '';
                });

                $rootScope.rscript[name] = {
                    id: name,
                    watches: [], // inputs collection to observe
                    onload: opts.onload || false,
                    inputs: rinputs,
                    outputs: routputs,
                    rtypes: rtypes,
                    data: {
                        author: opts.author,
                        directory: opts.directory || 'root',
                        filename: opts.name
                    }
                };

                console.log($rootScope.rscript);

                $rootScope.$watch('rscript.' + name + '.inputs', function(newVal, oldVal) {

                    for (var o in newVal) {
                        if (newVal[o] !== oldVal[o] && $rootScope.rscript[name].watches.indexOf(o) != -1) {
                            console.log('input "' + o + '" changed execute script "' + name + '"');
                            executeScript($rootScope.rscript[name]);
                        }
                    }

                    if ($rootScope.rscript[name].onload) {
                        $rootScope.rscript[name].onload = false;
                        //console.log('view onload execute script "' + name + '"');
                        executeScript($rootScope.rscript[name]);
                    }

                }, true);

            },

            registarCode: function(name, block, inputs, outputs, onload) {
                $rootScope.rcode[name] = {
                    code: block,
                    inputs: inputs,
                    outputs: outputs,
                    onload: onload || false
                };

                console.log($rootScope.rcode);
            },

            exe: function(rscript) {
                executeScript(rscript);
            }
        };
    }
})();
