// Generic Utils Module with lots of useful snippets that
// are used elsewhere.
var $fh = require('fh-mbaas-api');
var request = require('request');
var Q = require("q");

(function() {

    var Utils = {};

    module.exports = Utils;

    // Convienience 'getSession' method
    Utils.getSession = function(dataObj) {
        var sessionId = dataObj.sessionID;
        var deferred = Q.defer();
        // get the user from `$fh.session`
        $fh.session.get(sessionId, function(err, session) {
            // if `session` is false, there's either no user, or it's expired
            console.log("Received session", session);
            if (typeof session !== 'undefined' && session) {
                dataObj['session'] = JSON.parse(session);
                deferred.resolve(dataObj);
            } else {
                deferred.reject("Your session has expired. Please login again");
            }
        });
        return deferred.promise;
    };

    // Create a cookie for requests to the FeedHenry apis
    // 
    // Takes the `user` object returned from `getSession` and creates a cookie
    Utils.generateCookie = function(loginData) {
        console.log("Generating Request Cookie:", loginData);
        var jar = request.jar();
        var fh_cookie = request.cookie("feedhenry=" + loginData.login);
        var csrf_cookie = request.cookie("scrf=" + loginData.csrftoken);
        jar.add(csrf_cookie);
        jar.add(fh_cookie);
        console.log("Created CookieJar ", jar);
        return jar;
    };

    // Sanitise strings from Form Inputs etc
    Utils.sanitise = function(string) {
        // remove leading and trailing whitespace
        string = string.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        // remove all double spaces
        string = string.replace(/\s{2,}/g, ' ');
        return string;
    };


})();