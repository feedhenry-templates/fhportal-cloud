/*--------------------
	HUB OF ALL CLOUD CALLS
--------------------*/

////////////////////////////////
// IMPORTS
////////////////////////////////
var $fh = require('fh-mbaas-api');

var Authenticator = require('./authentication.js');
var UsersLib = require('./users.js');
var AppsLib = require('./apps.js');
////////////////////////////////
// AUTH CLOUD CALLS
////////////////////////////////
exports.auth_validateDomain = function(params, cb) {
    Authenticator.validateDomain(params, function(err, data) {
        return cb(err, data);
    });
};

exports.auth_doLogin = function(params, cb) {
    Authenticator.doLogin(params, function(err, data) {
        return cb(err, data);
    });
};

exports.auth_getUserData = function(params, cb) {
    Authenticator.getUserData(params, function(err, data) {
        return cb(err, data);
    });
};

////////////////////////////////
// USER CLOUD CALLS
////////////////////////////////
exports.user_requestUsers = function(params, cb) {
    UsersLib.getUsers(params, function(err, data) {
        return cb(err, data);
    });
}

////////////////////////////////
// APP CLOUD CALLS
////////////////////////////////
exports.app_requestApps = function(params, cb) {
    AppsLib.getApps(params, function(err, data) {
        return cb(err, data);
    });
}

exports.app_gitPull = function(params, cb) {
    AppsLib.gitPull(params, function(err, data) {
        return cb(err, data);
    });
}

exports.app_build = function(params, cb) {
    AppsLib.build(params, function(err, data) {
        return cb(err, data);
    });
}

exports.app_stage = function(params, cb) {
    AppsLib.stage(params, function(err, data) {
        return cb(err, data);
    });
}

exports.app_deploy = function(params, cb) {
    AppsLib.deploy(params, function(err, data) {
        return cb(err, data);
    });
}

exports.app_ping = function(params, cb) {
    AppsLib.pingApp(params, function(err, data) {
        return cb(err, data);
    });
}

exports.app_readCacheKey = function(params, cb) {
    AppsLib.readCacheKey(params, function(err, data) {
        return cb(err, data);
    });
}

exports.app_shortay = function(params, cb) {
    AppsLib.getShortened(params, function(err, data) {
        return cb(err, data);
    });
}


////////////////////////////////
// UTILITY CLOUD CALLS
////////////////////////////////
exports.heartbeat = function(params, cb) {
    return cb(null, {
        success: 'heartbeat'
    });
}