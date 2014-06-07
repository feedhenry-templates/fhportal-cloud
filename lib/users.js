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
    var UsersLib = {
        // endpoints used by this module
        "_endpoints": {
            "list_users": '/box/srv/1.1/admin/user/list'
        }
    };

    /*
     * getUsers Function
     *
     * @param {String}		- sessionId
     * @param {function}	- callback function
     */
    UsersLib.getUsers = function(params, callback) {
        var sessionID = params.sessionID;
        var username = params.username;
        var domain = params.domain;
        var dataObj = {
            sessionID: params.sessionID,
            domain: params.domain
        };

        // check if logged in
        // Hold on to your pants and behold deferred glory.
        Utils.getSession(dataObj)
            .then(_getUserList)
            .fail(function(error) {
                console.error("Failing with error:", error);
                callback(error, null); // failure
            })
            .done(function(dataObj) {
                console.info("Resolving with data:", dataObj);
                callback(null, dataObj);
            })
    };

    /*###########################
    ## INTERNAL FUNCTIONALITY
    ############################*/
    function _getUserList(dataObj) {
        var deferred = Q.defer();
        var session = dataObj.session;
        var jar = Utils.generateCookie(session);
        var url = "https://" + session.root + UsersLib._endpoints.list_users;
        request.post({
                url: url,
                body: "{}",
                jar: jar
            },
            function(e, r, body) {
                if (e) {
                    deferred.reject(e);
                } else {
                    // Response is a string, so parse it
                    users = JSON.parse(body);
                    deferred.resolve(users);
                }
            }
        );
        return deferred.promise;
    };
    module.exports = UsersLib;
})();