#!/usr/bin/env node

/*jslint node: true */
"use strict";

// --- imports
var pm = require('./lib/pm.js');
var server = require('./js/server.js');
//var logger = null;

// main
(function() {
    pm.init()
        .then(function(res) {
            //logger = res.LOGGER;
            console.log("initialized, starting server...");
            server.start();
            console.log("service is up and running.");
        })
        .then(function(resp) {
            console.log('Service up and running.');
        })
        .catch(function(error) {
            console.error("Error while initializing!!! shutting down now :-( \n", error);
            process.exitCode = 1;
            throw new Error(error);
        });
})();
