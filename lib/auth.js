#!/usr/bin/env node

/*jslint node: true */
"use strict";

// --- imports
var BPromise = require('bluebird');
BPromise.longStackTraces();
var request = require('request');
var pmConfig = null;
var logger;
var MANUAL_REFRESH_TIMER = 3600;
var REFRESH_TOKEN = null;
var ACCESS_TOKEN = null;
var TOKEN_TYPE = null;
var PM_UAA = null;
var isInProgress = false;
var COUNTER = (function() {
    var id = 0;
    return function(flag) {
        switch (flag) {
            case 1:
                ++id;
                break;
            case -1:
                --id;
                break;
            default:
                {

                }
        }
        logger.trace({
            COUNTER: id
        }, "Auth counter changed");
        return id;
    };
})();

module.exports = function() {
    if (PM_UAA === null) {
        PM_UAA = {
            init: init,
            authorize: authorizeWithUAA,
            authtoken: authtoken
        };
    }
    return PM_UAA;
};



function init(options) {
    options.logger.debug('initializing Auth...');
    logger = options.logger;
    pmConfig = options.config;
}

function sendUAATokenReq(callback) {
    var formData = null;
    if (REFRESH_TOKEN) {
        formData = {
            "grant_type": "refresh_token",
            "refresh_token": REFRESH_TOKEN,
            "scope": ""
        };
    } else {
        formData = {
            "grant_type": "password",
            "scope": "",
            "username": pmConfig.requireConfig('PM_USERNAME'),
            "password": pmConfig.requireConfig('PM_PASSWORD')
        };
    }

    var reqOptions = {
        url: pmConfig.requireConfig('PM_UAA_URL'),
        method: 'POST',
        headers: {
            "Authorization": "Basic " + (new Buffer("pm:").toString('base64')),
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: formData
    };

    request(reqOptions, callback);
}

function _refreshToken(timeInSeconds) {
    logger.trace({
        time_to_refresh: timeInSeconds
    }, 'will refresh token');
    setTimeout(function functionName() {
        logger.trace('Trying to fetch new access token now.');
        isInProgress = true;

        function callback(error, response, body) {
            isInProgress = false;
            if (!error && response.statusCode == 200) {
                logger.debug("Fetched a new access token.");
                var info = JSON.parse(body);
                logger.trace({
                    response: info
                }, "Token details.");
                _setTokens(info);
                _refreshToken(MANUAL_REFRESH_TIMER);
            } else {
                logger.error("Referesh token didn't wotked, trying a direct call...");
                REFRESH_TOKEN = null;
                ACCESS_TOKEN = null;
                authorizeWithUAA();
            }
        }
        sendUAATokenReq(callback);

    }, timeInSeconds * 1000);
}

function _setTokens(jsonResponse) {
    ACCESS_TOKEN = null;
    REFRESH_TOKEN = null;

    if (jsonResponse.hasOwnProperty('access_token')) {
        ACCESS_TOKEN = jsonResponse.access_token;
    }

    if (jsonResponse.hasOwnProperty('refresh_token')) {
        REFRESH_TOKEN = jsonResponse.refresh_token;
    }

    if (jsonResponse.hasOwnProperty('token_type')) {
        TOKEN_TYPE = jsonResponse.token_type;
    }
    logger.trace({
        UAA_TOKEN: authtoken()
    }, "New token received from UAA.");
}

//TODO: use refresh tokens --> https://auth0.com/learn/refresh-tokens/
function authorizeWithUAA() {
    return new BPromise(function(resolve, reject) {

        if (isInProgress /*|| COUNTER > 6*/ ) {
            COUNTER(1);
            // isInProgress = false;
            logger.error("Waiting for the older response yet. `Patience is a virtue`");
            reject("Waiting for the older response yet. `Patience is a virtue`");
            return;
        }
        isInProgress = true;
        logger.trace({
            COUNTER: COUNTER(0)
        }, "Waiting before authorizing with UAA: " + isInProgress);
        setTimeout(function() {
            COUNTER(1);

            function callback(error, response, body) {
                isInProgress = false;

                if (!error && response.statusCode == 200) {
                    logger.debug("Authorized with UAA.");

                    COUNTER(-1); //waiting for atleast 3 seconds for any subsiquent request.
                    var info = JSON.parse(body);
                    _setTokens(info);
                    logger.trace({
                        response: info
                    }, "TODO: INFO: use refresh_token!!!!!");
                    var expires = MANUAL_REFRESH_TIMER;
                    if (info.hasOwnProperty('expires_in')) {
                        expires = info.expires_in - 100;
                    }
                    // _refreshToken(expires); //info.expires_in
                    _refreshToken(MANUAL_REFRESH_TIMER);
                    resolve(authtoken());
                } else {
                    COUNTER(1);
                    logger.error("Unauthorized with UAA!");
                    reject(error || response || body);
                }
            }
            // request(reqOptions, callback);
            sendUAATokenReq(callback);
        }, COUNTER(0) * 1000);
    });
}

function authtoken() {
    if (null === TOKEN_TYPE || null === ACCESS_TOKEN) {
        logger.warn("Please execute authorize first!");
        return null;
    }
    // logger.debug("called.....");
    return TOKEN_TYPE + " " + ACCESS_TOKEN;
}
