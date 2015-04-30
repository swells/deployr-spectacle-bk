(function() {
    'use strict';

    angular.module('deployrUi.core', [])
        .service('$deployr', DeployRService);

    function DeployRService($window, $rootScope, $state, $q) {
        var deployr = $window.deployr,
            conf = {},
            request = deployr;

        $rootScope.rscript = {};
        $rootScope.rcode = {};

        function responseToModel(name, res) {
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

            $rootScope.$apply();
        }


        function responseToModelCode(name, res) {
            var outputs = Object.keys($rootScope.rcode[name].outputs);
            var used = [];

            // map artifacts to UI output delarations
            if (res.get('artifacts')) {
                res.get('artifacts').forEach(function(artifact) {
                    if (outputs.indexOf(artifact.filename) != -1) {
                        $rootScope.rcode[name].outputs[artifact.filename] = artifact.url;
                        used.push(artifact.filename);
                    }
                });
            }

            // map routputs to UI output delarations
            outputs.forEach(function(output) {
                var obj = res.workspace(output);
                if (obj) {
                    $rootScope.rcode[name].outputs[obj.name] = obj.value;
                    used.push(obj.name);
                }
            });

            // map results/unnamed-plot to any remaing UI output delarations
            if (res.get('results')) {
                res.get('results').forEach(function(result) {
                    for (var o in $rootScope.rcode[name].outputs) {
                        if (used.indexOf(o) === -1) { // miss
                            $rootScope.rcode[name].outputs[o] = result.url;
                            used.push(o);
                        }
                    }
                });
            }

            $rootScope.$apply();
        }

        function executeScript(rscript) {
            request = request.io('/r/repository/script/execute');
            request.data(rscript.data);

            // DeployR encoded rinputs           
            for (var input in rscript.inputs) {
                try {
                    request[rscript.rtypes[input]](input, rscript.inputs[input]);
                } catch (err) {}
            }

            request
                .routputs(Object.keys(rscript.outputs))
                .on('deployr-io:401', function() {
                    $state.go('login');
                })
                .error(function(err) {
                    console.log(err);
                })
                .end(function(res) {
                    responseToModel(rscript.id, res);
                });
        }



        function executeCode(rcode) {
            request = request.code(rcode.block, rcode.pid)
                .data({
                    enableConsoleEvents: true
                })

            // DeployR encoded rinputs           
            for (var input in rcode.inputs) {
                try {
                    request[rcode.rtypes[input]](input, rcode.inputs[input]);
                } catch (err) {}
            }

            request
                .routputs(Object.keys(rcode.outputs))
                .on('deployr-io:401', function() {
                    $state.go('login');
                })
                .error(function(err) {
                    console.log(err);
                })
                .end(function(res) {                    
                    responseToModelCode(rcode.id, res);
                    return {
                        project: res.get('project').project
                    };
                })
                .io('/r/project/close')
                .end();
        }


        return {

            validEndpoint: function() {
                return ((conf.cors && conf.endpoint) || !conf.cors);
            },

            configure: function(endpoint, cors, auth) {
                conf = {
                    host: endpoint,
                    cors: cors
                };

                deployr.configure(conf);
                $rootScope.authenticating = true;
                $rootScope.auth = auth;
                if (auth && typeof $rootScope.currentUser === 'undefined') {
                    request = request.io('/r/user/about')
                        .on('deployr-io:401', function() {
                            $state.go('login');
                        })
                        .end(this.es);
                }
            },

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

                var esInputs = {};
                (opts.es || []).split(',').forEach(function(input) {
                    esInputs[input] = '';
                });

                $rootScope.rscript[name] = {
                    id: name,
                    watches: [], // inputs collection to observe
                    onload: opts.onload || false,
                    inputs: rinputs,
                    outputs: routputs,
                    es: esInputs,
                    rtypes: rtypes,
                    data: {
                        author: opts.author,
                        directory: opts.directory || 'root',
                        filename: opts.name,
                        enableConsoleEvents: true
                    }
                };


                $rootScope.$watch('rscript.' + name + '.inputs', function(newVal, oldVal) {
                    for (var o in newVal) {
                        if (newVal[o] !== oldVal[o] && $rootScope.rscript[name].watches.indexOf(o) != -1) {
                            //console.log('input "' + o + '" changed execute script "' + name + '"');
                            executeScript($rootScope.rscript[name]);
                        }
                    }

                    if ($rootScope.rscript[name].onload) {
                        $rootScope.rscript[name].onload = false;
                        executeScript($rootScope.rscript[name]);
                    }

                }, true);
            },

            registarCode: function(opts) {
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

                var esInputs = {};
                (opts.es || []).split(',').forEach(function(input) {
                    esInputs[input] = '';
                });

                var routputs = {};
                (opts.outputs || []).split(',').forEach(function(output) {
                    routputs[output] = '';
                });

                $rootScope.rcode[name] = {
                    id: name,
                    watches: [], // inputs collection to observe
                    onload: opts.onload || false,
                    inputs: rinputs,
                    es: esInputs,
                    outputs: routputs,
                    rtypes: rtypes,
                    block: opts.block
                };

                $rootScope.$watch('rcode.' + name + '.inputs', function(newVal, oldVal) {
                    for (var o in newVal) {
                        if (newVal[o] !== oldVal[o] && $rootScope.rcode[name].watches.indexOf(o) != -1) {
                            //console.log('input "' + o + '" changed execute script "' + name + '"');
                            executeCode($rootScope.rcode[name]);
                        }
                    }

                    if ($rootScope.rcode[name].onload) {
                        $rootScope.rcode[name].onload = false;
                        executeCode($rootScope.rcode[name]);
                    }

                }, true);
            },

            exe: function(ctx) {
                $rootScope.authenticating = false;
                if (ctx.block) {
                    executeCode(ctx)
                } else {
                    executeScript(ctx);
                }
            },

            es: function() {
                $rootScope.$apply(function() {
                    console.log('FALSE.....')
                     $rootScope.authenticating = false;
                });


                function printf(d) {
                    console.log('-----------')
                    console.log(d);
                    console.log('-----------')
                }

                var es = deployr.es()
                    // -- connection choices for event types --
                    //.session() // default
                    //.all()
                    //.project(id) 
                    //.job(id)
                    //.management() 
                    // -- end connection choices for event types --
                    .on('es:error', function(data) {
                        console.log('===================');
                        console.log('es:error');
                        console.log('===================');
                        printf(data);
                    })
                    .on('es:connecting', function(data) {
                        console.log('===================');
                        console.log('es:connecting');
                        console.log('===================');
                        printf(data);
                    })
                    .on('es:disconnect', function(data) {
                        console.log('===================');
                        console.log('es:disconnect');
                        console.log('===================');
                        printf(data);
                    })
                    .on('es:streamConnect', function(data) {
                        console.log('===================');
                        console.log('es:streamConnect');
                        console.log('===================');
                        printf(data);
                    })
                    .on('es:streamDisconnect', function(data) {
                        console.log('===================');
                        console.log('es:streamDisconnect');
                        console.log('===================');
                        printf(data);
                    })
                    /*.on('es:executionConsole', function(data) {
                        console.log('===================');
                        console.log('es:executionConsole');
                        console.log('===================');
                        printf(data);
                    })*/
                    .on('es:executionRevo', function(data) {
                        console.log('===================');
                        console.log('es:executionRevo');
                        console.log('===================');
                        printf(data);

                        var obj = data.deployr.response.event.object;
                        if (obj) {
                            for (var script in $rootScope.rscript) {
                                $rootScope.rscript[script].es[obj.name] = obj.value;
                            }
                            for (var block in $rootScope.rcode) {
                                $rootScope.rcode[block].es[obj.name] = obj.value;
                            }
                            $rootScope.$apply();
                        }
                    })
                    .on('es:executionError', function(data) {
                        console.log('===================');
                        console.log('es:executionError');
                        console.log('===================');
                        printf(data);
                    })
                    .on('es:jobLifecycle', function(data) {
                        console.log('===================');
                        console.log('es:jobLifecycle');
                        console.log('===================');
                        printf(data);
                    })
                    .on('es:gridHeartbeat', function(data) {
                        console.log('===================');
                        console.log('es:gridHeartbeat');
                        console.log('===================');
                        printf(data);
                    })
                    .on('es:gridActivity', function(data) {
                        console.log('===================');
                        console.log('es:gridActivity');
                        console.log('===================');
                        printf(data);
                    })
                    .on('es:gridWarning', function(data) {
                        console.log('===================');
                        console.log('es:gridWarning');
                        console.log('===================');
                        printf(data);
                    })
                    .on('es:securityLogin', function(data) {
                        console.log('===================');
                        console.log('es:securityLogin');
                        console.log('===================');
                        printf(data);
                    })
                    .on('es:securityLogout', function(data) {
                        console.log('===================');
                        console.log('es:securityLogout');
                        console.log('===================');
                        printf(data);
                    })
                    .open().flush();
            },

            logout: function() {
                 deployr.io('/r/user/logout').end();
            },

            login: function(username, password) {
                request = deployr.io('/r/user/login')
                    .data({
                        username: username,
                        password: password
                    });
                return request.promise();
            }
        };
    }
})();
