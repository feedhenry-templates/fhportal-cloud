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
    var Authenticator = {
        // endpoints used by this module
        "_endpoints": {
            "login": '/box/srv/1.1/act/sys/auth/login',
            "ping": '/box/srv/1.1/tst/echonode',
            "list_roles": '/box/srv/1.1/admin/role/list',
            "user_info": '/box/srv/1.1/admin/user/read'
        },
        "sessionTimeout": 18000,
        "_protocol": "http://"
    };


    /*
     * validateDomain Function
     *
     * @param {String}		- domain
     * @param {function}	- callback function
     */
    Authenticator.validateDomain = function(params, cb) {
        console.log("Received validateDomain Request");
        var self = this;
        var domain = params['domain'];
        var studioUrl = Authenticator._protocol + domain + Authenticator._endpoints.ping;
        // Make the request
        var res = {}
        request.get({
                url: studioUrl
            },
            function(e, r, body) {
                if (!e && r.statusCode == 200) {
                    console.log("Domain valid:", domain) // Studio is alive, so thats something..
                    res.error = null;
                    return cb(null, res); // SUCCESS
                } else {
                    console.error("Domain invalid:", domain);
                    res.error = "Domain not responding correctly";
                    return cb(null, res); // FAIL
                }
            }
        );
    };

    /*
     * doLogin Function
     *
     * @param {Object}		- login credentials dictionary
     * @param {function}	- callback function
     */
    Authenticator.doLogin = function(params, callback) {
        //ensure correct params are passed
        if (!params.u || !params.p || !params.domain) {
            return callback(null, {
                error: "You  need to supply a username, password and url to login"
            });
        }
        // We have no `sessionId`, but have the correct params; so `_tryLogin` - this returns correctly formatted response
        console.log("endpoints", Authenticator._endpoints);
        _proxyFetchCSRF(params, function(csrftoken) {
            params['csrftoken'] = csrftoken;
            _tryLogin(params, function(loginResponse) {
                return callback(null, loginResponse);
            })
        });
    };


    /*
     * getUserData Function
     *
     * @param {Object}      - some Data..
     * @param {function}    - callback function
     */
    Authenticator.getUserData = function(params, callback) {
        var sessionID = params.sessionID;
        var username = params.username;
        var domain = params.domain;
        var dataObj = {
            sessionID: params.sessionID,
            username: params.username,
            domain: params.domain
        };

        // check if logged in
        // Hold on to your pants and behold deferred glory.
        Utils.getSession(dataObj)
            .then(function(dataObj) {
                Q.all([
                    _getRoles(dataObj),
                    _getUserInfo(dataObj)
                ]).then(function(responses) {
                    callback(
                        null, {
                            "roleInfo": responses[0],
                            "userInfo": responses[1]
                        }
                    );
                }, function(error) {
                    callback(error, null); // failure
                });
            })
            .fail(function(error) {
                callback(error, null); // failure
            })
    };

    function _getRoles(dataObj) {
        var session = dataObj.session;
        var deferred = Q.defer();
        var jar = Utils.generateCookie(session);
        var url = Authenticator._protocol + session.root + Authenticator._endpoints.list_roles;
        request.get({
                url: url,
                jar: jar
            },
            function(e, r, body) {
                if (e) {
                    console.log("_getRoles Error", e, r, body);
                    deferred.reject(e);
                } else {
                    // Response is a string, so parse it
                    roles = JSON.parse(body);
                    deferred.resolve(roles);
                }
            }
        );
        return deferred.promise;
    };

    function _getUserInfo(dataObj) {
        var deferred = Q.defer();
        var session = dataObj.session;
        var userID = dataObj.username;
        var url = Authenticator._protocol + session.root + Authenticator._endpoints.user_info;
        var data = JSON.stringify({
            "username": userID
        })
        var jar = Utils.generateCookie(session);
        request.post({
                url: url,
                body: data,
                jar: jar
            },
            function(e, r, body) {
                try {
                    bodyResponse = JSON.parse(body);
                } catch (e) {
                    deferred.reject({
                        "reason": e
                    }); //error in parsing JSON
                }
                if (bodyResponse.status == "error") {
                    deferred.reject("Sorry, you require a 'Domain Administrator' account to use this app");
                    console.error(e, r);
                } else {
                    deferred.resolve(bodyResponse);
                }
            }
        );
        return deferred.promise;
    };

    /*
     * _tryLogin Function
     *
     * calls the `proxyLogin` and stores successful response in $fh.cache
     *
     * @param {Object}		- login credentials dictionary
     * @param {function}	- callback function
     */
    _tryLogin = function(params, callback) {
        _proxyLogin(params, function(loginResponse) {
            if (loginResponse.result === "ok") {
                loginResponse.root = params.domain;
                loginResponse.csrftoken = params.csrftoken;

                // user successfully logged in, so add session
                // get a hash of the user object, and use that as the session key
                var userHash = crypto.createHash("md5").update(JSON.stringify(loginResponse)).digest("hex");
                console.log("Creating Session: (Hash: %s) (Timeout: %s)", userHash, Authenticator.sessionTimeout);
                console.log("Login Response: ", loginResponse);
                console.log("This is $fh: ", $fh)
                $fh.session.set(
                    userHash,
                    JSON.stringify(loginResponse),
                    Authenticator.sessionTimeout,
                    function(err, res) {
                        console.log("Session Response Err(%s) Res(%s)", err, res);
                    }
                );

                // return the hash to the client
                var clientResponse = {
                    sessionId: userHash,
                    root: params.domain,
                    csrftoken: params.csrftoken
                };
                return callback(clientResponse);
            } else { // user not logged in, return error
                return callback({
                    error: "Failed to login, reason " + loginResponse.reason
                });
            }
        });
    };


    _proxyFetchCSRF = function(params, callback) {
        var csrfUrl = Authenticator._protocol + params.domain
        console.log("Attempting CSRF Fetch;", csrfUrl)
        request.head({
            url: csrfUrl
        }, function(err, res, body) {
            if (err) {
                return callback({
                    result: 'fail',
                    reason: 'Platform endpoint not responding'
                });
            } else {
                console.log("Response Headers", res.headers);
                csrftoken = res.headers['set-cookie'][0].split(";")[0].split("=")[1];
                return callback(csrftoken);
            }
        });
    };
    /*
     * _proxyLogin Function
     *
     * Attempts to login to the FH System
     *
     * @param {Object}		- login credentials dictionary
     * @param {function}	- callback function
     */
    _proxyLogin = function(params, callback) {
        var loginUrl = Authenticator._protocol + params.domain + Authenticator._endpoints.login
        console.log("Attempting login;", loginUrl)
        request.post({
            url: loginUrl,
            body: JSON.stringify(params)
        }, function(err, res, body) {
            if (!body) { // if `body` is undefined, we've no connection to studio
                return callback({
                    result: 'fail',
                    reason: 'Login endpoint not responding'
                });
            } else { //`body` is a JSON string, so we'll parse it here to get it as a JS Object
                var loginResponse = JSON.parse(body);
                return callback(loginResponse);
            }
        });
    };

    module.exports = Authenticator;
})();