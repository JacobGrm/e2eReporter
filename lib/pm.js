#!/usr/bin/env node
/*jslint node: true */
"use strict";

// --- imports
var BPromise    = require('bluebird'); BPromise.longStackTraces();
var pmConfig    = require("./pm-config.js")();
var Logging     = require('./bunyanLogger.js');
var logger      = Logging.logger();
var pmNano      = require('./pm-nano.js');
var Queue = require('bluebird-queue');
// var Queue = require('./pmq.js');


var isInit      = false;

var PM    = {
  DB      : null,
  NANO    : null,
  LOGGER  : null,
  AUTH    : null,
  CONFIG  : null
};

var maxConcurrent = 2;
var queue = null;

module.exports = {
      init     : initialize,
      logger   : getLogger,
      db       : getDB,
      nano     : getNano,
      config   : getConfig,
      addTask   : addToQueue
};

/**
 * Initializes the pm process --> logger, config, pm-cache (utilizes nano).
 * @returns {*}
 */
function initialize() {
  return new BPromise(function (resolve, reject) {
    queue = new Queue({
          concurrency: maxConcurrent
        });
    queue.start().then(function(results){
      logger.trace('queue says: '+results);
    });

    PM.LOGGER = logger;
    PM.CONFIG = pmConfig;

    pmNano.getDatabase(pmConfig, logger)
    .then(function(pmNanoResp) {
        PM.DB   = pmNanoResp.pmDb;
        PM.NANO = pmNanoResp.nano;
        logger.debug("pm initialized :-)");
        logger.trace({DB : PM.DB});
        resolve(PM);
    })
    .catch(function(err) {
        logger.error(err);
        reject(err);
    });
  });
}

function getLogger() {
  return PM.LOGGER;
}

function getDB() {
  return PM.DB;
}

function getNano() {
  return PM.NANO;
}

function getConfig() {
  return PM.CONFIG;
}

function addToQueue(task) {
  queue.add(task);
}
