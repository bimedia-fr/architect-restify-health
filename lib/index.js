/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
"use strict";

var accesslog = require('access-log');

module.exports = function setup(options, imports, register) {

    var rest = imports.rest;
    var logger = imports.log;

    if (options.accesslog) {
        var log = logger.getLogger('rest');
        rest.use(function (req, res, next) {
            accesslog(req, res, options.accesslog.fmt, log.info.bind(log));
            next();
        });
    }

    var prefix = options.mount || '/api/health';

    function getUrl(req) {
        return [
            req.headers['x-forwarded-protocol'] || 'http',
            '://',
            req.headers['x-forwarded-for'] || req.headers.host,
            req.url].join('');
    }

    if (prefix) {
        rest.get(prefix, function (req, res, next) {
            var result = {
                _links: {
                    self: { href: getUrl(req) },
                    item: [
                        { href: getUrl(req) + '/runtime', "title": "runtime" },
                        { href: getUrl(req) + '/routes', "title": "routes" }
                    ]
                }
            };
            res.send(200, result);
            res.end();
        });

        rest.get(prefix + '/routes', function (req, res, next) {
            var routes = Object.keys(rest.router.mounts).map(function (key) {
                return rest.router.mounts[key];
            });
            res.send(200, routes);
            res.end();
        });

        rest.get(prefix + '/runtime', function (req, res, next) {
            var result = {
                memory : process.memoryUsage(),
                pid : process.pid,
                gid : process.getgid(),
                uid : process.getuid(),
                uptime : process.uptime(),
                argv : process.argv
            };

            res.send(200, result);
            res.end();
        });

        rest.get(prefix + '/env', function (req, res, next) {
            res.send(200, process.env);
            res.end();
        });
    }

    register();
};

module.exports.consumes = ['rest', 'log'];
