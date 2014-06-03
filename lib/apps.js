/*--------------------
	Manages Authentication Tasks
--------------------*/

////////////////////////////////
// IMPORTS
////////////////////////////////
var $fh = require('fh-mbaas-api');

var request = require('request');
var crypto = require('crypto');
var Utils = require('./utils');
var Q = require("q"); // THE PROMISED LAND!

(function() {
    var AppsLib = {
        // endpoints used by this module
        "_endpoints": {
            "list_apps": '/box/srv/1.1/ide/<DOMAIN>/app/list',
            "git_pull": '/box/srv/1.1/pub/app/<GUID>/refresh',
            "build": '/box/srv/1.1/wid/<DOMAIN>/<PLATFORM>/<GUID>/deliver',
            "deploy": '/box/srv/1.1/ide/<DOMAIN>/app/<ACTION>',
            "stage": '/box/srv/1.1/ide/<DOMAIN>/app/stage',
            "read_key": '/box/srv/1.1/dat/log/read',
            "ping_app": '/box/srv/1.1/ide/<DOMAIN>/app/ping',
            "shorten": '/box/api/shortenurl'
        },
        "_protocol": "http://"
    };

    /*
     * getUsers Function
     *
     * @param {String}		- sessionId
     * @param {function}	- callback function
     */
    AppsLib.getApps = function(params, callback) {
        var sessionID = params.sessionID;
        var username = params.username;
        var domain = params.domain;
        var dataObj = {
            sessionID: params.sessionID,
            domain: params.domain,
            csrftoken: params.csrftoken
        };

        // check if logged in
        // Hold on to your pants and behold deferred glory.
        Utils.getSession(dataObj)
            .then(function(dataObj) {
                var deferred = Q.defer(); // I could pass this as a function, but its a lot of duplication
                var domain = dataObj.domain;
                var session = dataObj.session;
                var jar = Utils.generateCookie(session);
                var url = AppsLib._protocol + session.root + AppsLib._endpoints.list_apps.replace("<DOMAIN>", domain);
                var payload = {
                    'csrftoken': session.csrftoken
                };

                request.post({
                        url: url,
                        json: payload,
                        jar: jar
                    },
                    function(e, r, json) {
                        if (e) {
                            deferred.reject(e);
                        } else {
                            deferred.resolve(json);
                        }
                    }
                );
                return deferred.promise;
            })
            .fail(function(error) {
                console.log("Failing with error:", error);
                callback(error, null); // failure
            })
            .done(function(dataObj) {
                console.log("Resolving with data:", dataObj);
                callback(null, dataObj);
            })
    };

    AppsLib.gitPull = function(params, callback) {
        var sessionID = params.sessionID;
        var domain = params.domain;
        var dataObj = {
            sessionID: params.sessionID,
            domain: params.domain,
            appGuid: params.appGuid,
            csrftoken: params.csrftoken
        };

        // check if logged in
        // Hold on to your pants and behold deferred glory.
        Utils.getSession(dataObj)
            .then(function(dataObj) {
                var deferred = Q.defer();
                var session = dataObj.session;
                var appGuid = dataObj.appGuid;
                var jar = Utils.generateCookie(session);
                var url = AppsLib._protocol + session.root + AppsLib._endpoints.git_pull.replace("<GUID>", appGuid);
                var payload = {
                    'csrftoken': session.csrftoken
                };

                request.post({
                        url: url,
                        json: payload,
                        jar: jar
                    },
                    function(e, r, json) {
                        if (e) {
                            deferred.reject(e);
                        } else {
                            deferred.resolve(json);
                        }
                    }
                );
                return deferred.promise;
            })
            .fail(function(error) {
                console.log("Failing with error:", error);
                callback(error, null); // failure
            })
            .done(function(dataObj) {
                console.log("Resolving with data:", dataObj);
                callback(null, dataObj);
            })
    };

    AppsLib.build = function(params, callback) {
        var sessionID = params.sessionID;
        var domain = params.domain;
        var dataObj = {
            sessionID: params.sessionID,
            domain: params.domain,
            appGuid: params.appGuid,
            appID: params.appID,
            csrftoken: params.csrftoken,
            buildParams: params.buildParams
        };

        Utils.getSession(dataObj)
            .then(function(dataObj) {
                var deferred = Q.defer();
                var session = dataObj.session;
                var appGuid = dataObj.appGuid;
                var appID = dataObj.appID;
                var domain = dataObj.domain;
                var buildParams = dataObj.buildParams;
                var jar = Utils.generateCookie(session);
                var url = AppsLib._protocol + session.root + AppsLib._endpoints.build.replace("<DOMAIN>", domain).replace("<PLATFORM>", buildParams.deviceType).replace("<GUID>", appID);

                var payload = buildParams;
                payload['csrftoken'] = session.csrftoken;

                request.post({
                        url: url,
                        json: payload,
                        jar: jar
                    },
                    function(e, r, json) {
                        if (e) {
                            deferred.reject(e);
                        } else {
                            if (json.status == "error") {
                                deferred.reject(json);
                            } else {
                                deferred.resolve(json);
                            }
                        }
                    }
                );
                return deferred.promise;
            })
            .fail(function(error) {
                console.log("Failing with error:", error);
                callback(error, null); // failure
            })
            .done(function(dataObj) {
                console.log("Resolving with data:", dataObj);
                callback(null, dataObj);
            })
    };

    AppsLib.deploy = function(params, callback) {
        console.log(params)
        var dataObj = {
            sessionID: params.sessionID,
            domain: params.domain,
            appGuid: params.appGuid,
            appID: params.appID,
            csrftoken: params.csrftoken,
            deployParams: params.deployParams
        };

        Utils.getSession(dataObj)
            .then(function(dataObj) {
                var deferred = Q.defer();
                var session = dataObj.session;
                var appGuid = dataObj.appGuid;
                var appID = dataObj.appID;
                var domain = dataObj.domain;
                var deployParams = dataObj.deployParams;
                var jar = Utils.generateCookie(session);
                var url = AppsLib._protocol + session.root + AppsLib._endpoints.deploy.replace("<DOMAIN>", domain).replace("<ACTION>", deployParams.action);


                var payload = {
                    "csrftoken": session.csrftoken,
                    "deploytarget": deployParams.target,
                    "guid": deployParams.guid
                };
                request.post({
                        url: url,
                        json: payload,
                        jar: jar
                    },
                    function(e, r, json) {
                        if (e) {
                            deferred.reject(e);
                        } else {
                            if (json.status == "error") {
                                deferred.reject(json);
                            } else {
                                deferred.resolve(json);
                            }
                        }
                    }
                );
                return deferred.promise;
            })
            .fail(function(error) {
                console.log("Failing with error:", error);
                callback(error, null); // failure
            })
            .done(function(dataObj) {
                console.log("Resolving with data:", dataObj);
                callback(null, dataObj);
            })
    };


    AppsLib.stage = function(params, callback) {
        var sessionID = params.sessionID;
        var domain = params.domain;
        var dataObj = {
            sessionID: params.sessionID,
            domain: params.domain,
            appGuid: params.appGuid,
            appID: params.appID,
            csrftoken: params.csrftoken,
            deployParams: params.deployParams
        };

        Utils.getSession(dataObj)
            .then(function(dataObj) {
                var deferred = Q.defer();
                var session = dataObj.session;
                var appGuid = dataObj.appGuid;
                var appID = dataObj.appID;
                var domain = dataObj.domain;
                var deployParams = dataObj.deployParams;
                var jar = Utils.generateCookie(session);
                var url = AppsLib._protocol + session.root + AppsLib._endpoints.stage.replace("<DOMAIN>", domain);

                var payload = {
                    "clean": false,
                    "csrftoken": session.csrftoken,
                    "guid": deployParams.guid,
                    "runtime": "node010",
                    "target_id": "default"
                };

                request.post({
                        url: url,
                        json: payload,
                        jar: jar
                    },
                    function(e, r, json) {
                        if (e) {
                            deferred.reject(e);
                        } else {
                            if (json.status == "error") {
                                deferred.reject(json);
                            } else {
                                deferred.resolve(json);
                            }
                        }
                    }
                );
                return deferred.promise;
            })
            .fail(function(error) {
                console.log("Failing with error:", error);
                callback(error, null); // failure
            })
            .done(function(dataObj) {
                console.log("Resolving with data:", dataObj);
                callback(null, dataObj);
            })
    };


    AppsLib.getShortened = function(params, callback) {
        var sessionID = params.sessionID;
        var domain = params.domain;
        var dataObj = {
            sessionID: params.sessionID,
            domain: params.domain,
            csrftoken: params.csrftoken,
            longUrl: params.longUrl
        };

        Utils.getSession(dataObj)
            .then(function(dataObj) {
                var deferred = Q.defer();
                var session = dataObj.session;
                var jar = Utils.generateCookie(session);
                var url = AppsLib._protocol + session.root + AppsLib._endpoints.shorten;

                var payload = {
                    "longUrl": dataObj['longUrl'],
                    'csrftoken': session.csrftoken
                };

                request.post({
                        url: url,
                        json: payload,
                        jar: jar
                    },
                    function(e, r, json) {
                        if (e) {
                            deferred.reject(e);
                        } else {
                            if (json.status == "error") {
                                deferred.reject(json);
                            } else {
                                deferred.resolve(json);
                            }
                        }
                    }
                );
                return deferred.promise;
            })
            .fail(function(error) {
                console.log("Failing with error:", error);
                callback(error, null); // failure
            })
            .done(function(dataObj) {
                console.log("Resolving with data:", dataObj);
                callback(null, dataObj);
            })
    };

    AppsLib.readCacheKey = function(params, callback) {
        var sessionID = params.sessionID;
        var dataObj = {
            sessionID: params.sessionID,
            cacheKey: params.cacheKey
        };

        // https://nguiapps.feedhenry.com/box/srv/1.1/dat/log/read?cacheKeys=[{%22cacheKey%22:%229d6c5325307d12c37166b88919a1695a%22,%22start%22:3}]&_=1391527972356
        Utils.getSession(dataObj)
            .then(function(dataObj) {
                var deferred = Q.defer();
                var session = dataObj.session;
                var appGuid = dataObj.appGuid;
                var jar = Utils.generateCookie(session);
                var url = AppsLib._protocol + session.root + AppsLib._endpoints.read_key;
                var payload = {
                    'cacheKeys': JSON.stringify([{
                        "cacheKey": dataObj.cacheKey,
                        "start": 0
                    }])
                };
                request.get({
                        url: url,
                        qs: payload,
                        jar: jar
                    },
                    function(e, r, body) {
                        if (e) {
                            deferred.reject(e);
                        } else {
                            deferred.resolve(body);
                        }
                    }
                );
                return deferred.promise;
            })
            .fail(function(error) {
                console.log("Failing with error:", error);
                callback(error, null); // failure
            })
            .done(function(dataObj) {
                console.log("Resolving with data:", dataObj);
                callback(null, dataObj);
            })
    };

    AppsLib.pingApp = function(params, callback) {
        var dataObj = {
            sessionID: params.sessionID,
            domain: params.domain,
            appGuid: params.appGuid,
            appID: params.appID,
            csrftoken: params.csrftoken,
            deployParams: params.deployParams
        };

        Utils.getSession(dataObj)
            .then(function(dataObj) {
                var deferred = Q.defer();
                var session = dataObj.session;
                var appGuid = dataObj.appGuid;
                var deployParams = dataObj.deployParams;
                var jar = Utils.generateCookie(session);
                var url = AppsLib._protocol + session.root + AppsLib._endpoints.ping_app.replace("<DOMAIN>", dataObj['domain']);

                var payload = {
                    "context": {},
                    "payload": {
                        "csrftoken": session.csrftoken,
                        "deploytarget": deployParams.target,
                        "guid": deployParams.guid
                    }
                }

                request.post({
                        url: url,
                        json: payload,
                        jar: jar
                    },
                    function(e, r, json) {
                        if (e) {
                            deferred.reject(e);
                        } else {
                            deferred.resolve(json);
                        }
                    }
                );
                return deferred.promise;
            })
            .fail(function(error) {
                console.log("Failing with error:", error);
                callback(error, null); // failure
            })
            .done(function(dataObj) {
                console.log("Resolving with data:", dataObj);
                callback(null, dataObj);
            })
    };

    module.exports = AppsLib;
})();