#!/usr/bin/env node

/*jslint node: true */
"use strict";

// --- imports
var BPromise = require('bluebird');
BPromise.longStackTraces();

var Logging     = require('./bunyanLogger.js');
var logger      = Logging.logger();

var _NAME = 'pmq';
var CHNAGES_SEQUENCE = [];
var QUEUE = {};
var CONCURENCY = 4;
var isStarted = false;
var processing = false;
var CB = null; //Callbacks to be called - bluebird rpomise should be returend by the CB.
var CB_STOP = null; // CB called when queue stops the processing.
module.exports = {
        init:       init,
        add:        add,
        queue:      getQueue,
        sequence:   getSequence,
        requests:   getRequests,
        start:      start,
        stop:       stop,
        name:       getName
};

function init(cb, config) {
    isStarted = false;
    processing = false;
    _NAME = config.name || "pmq";
    CB = cb;
    CONCURENCY = config.concurrency || 4;
    logger.trace({concurrency:CONCURENCY, name : _NAME}, CB);
}

function getName() {
  return _NAME;
}

function add(id, request) {
    logger.trace({id: id}, "adding to queue.");
    logger.trace({reqs: request}, "request adding to queue.");
    CHNAGES_SEQUENCE.push(id);
    if (QUEUE.hasOwnProperty(id)) {
        QUEUE[id].push(request);
    } else {
        QUEUE[id] = [request];
    }
    runTheQueue();
}

function getQueue() {
    return QUEUE;
}

function getSequence() {
    return CHNAGES_SEQUENCE;
}

function getRequests(num) {
    if (num < 1) {
        return [];
    }
    var toReturn = [];
    var arrDocs = getFirstChanges(num);
    for (var i = 0; i < arrDocs.length; i++) {
        var id = arrDocs[i];
        var reqs = QUEUE[id];
        logger.debug({id: id}, 'fetched.');
        logger.debug({req : reqs}, 'fetched.');
        logger.trace({q_id:id, q_req:reqs},_NAME+' adding to return.');
        toReturn.push(reqs.shift()); //[0]
        if (reqs.length === 0) {
          delete QUEUE[id];
        }
    }
    return toReturn;
}

function getFirstChanges(num) {
    var arrDocs = null;
    if(CHNAGES_SEQUENCE.length < 1) {
        logger.debug('Empty Queue.');
        return [];
    }
    if (num === 1) {
        arrDocs = [CHNAGES_SEQUENCE.shift()];//[CHNAGES_SEQUENCE[0]];

        logger.trace({seq_to_return: arrDocs},_NAME+' 1. Sequence of ids to return.');
    } else if (num < CHNAGES_SEQUENCE.length) {
        // arrDocs = CHNAGES_SEQUENCE.slice(0, num);
        arrDocs = CHNAGES_SEQUENCE.splice(0, num);
        logger.trace({seq_to_return: arrDocs},_NAME+' 2. Sequence of ids to return.');
    } else {
        // arrDocs = CHNAGES_SEQUENCE;
        arrDocs = CHNAGES_SEQUENCE.splice(0, CHNAGES_SEQUENCE.length);
        logger.trace({seq_to_return: arrDocs},_NAME+' 3. Sequence of ids to return.');
    }

    return arrDocs;
}

function start() {
    if (isStarted) {
        return;
    }
    logger.debug(_NAME+' Starting the queue.');
    isStarted = true;
    runTheQueue();
}

function stop(cb) {
  CB_STOP = cb;
  logger.debug(_NAME+' Stopping the queue.');
  isStarted = false;
}

function runTheQueue() {
    if (!isStarted) {
      if (CB_STOP !== null) {
        CB_STOP(_NAME+" Processing finished.");
        CB_STOP = null;
      }
      return;
    }
    if (processing) {
      logger.debug(_NAME+' Already in the middle of processing...');
        return;
    }
    var docs = getRequests(CONCURENCY);
    if (docs.length < 1) {
        processing = false;
        return;
    }
    BPromise.map(docs, CB, {
            concurrency: CONCURENCY
        })
        .then(function() {
            logger.debug(_NAME+" Processed "+ CONCURENCY + " documents. Trying next "+ CONCURENCY);
            processing = false;
            runTheQueue();
        })
        .catch(function(err) {
            console.error(err);
        });
}
/*
//  remove me FIXME:
(function() {
    init(callback, 2);
    // Adding some data
    addSomeData(1, 3);
    // addSomeData(2, 5);
    // addSomeData(1, 8);


    // logger.info('\n\n################\n\n');
    // var lastX = 4;
    // logger.info('Last ' + lastX + ' requests: ', getRequests(lastX));
    //
    // logger.info('\n\n################\n\n');
    // logger.info('queue: ', getQueue());
    // logger.info('sequence: ', getSequence());

    start();
    addDeamonPublisher();
    setTimeout(function () {
      stop(function (data) {
        logger.error(_NAME+' Stop replied for processing callback as: ', data);
      });
    }, 2000);


})();

var refreshIntervalId;
var maxTimes = 5;
var count =0;
function addDeamonPublisher() {
  refreshIntervalId = setInterval(function () {
    ++count;
    cancelMeIfYouCan();
    logger.trace(_NAME+' about to add more data. Times: '+count);
    addSomeData(2, 5);
  }, randomNumber(1, 4) * 1000);
}

function cancelMeIfYouCan() {
  if (count >= maxTimes) {
    logger.error(_NAME+' stopping publisher.');
    clearInterval(refreshIntervalId);
  }
}
function callback(document) {
  return new BPromise(function (resolve, reject) {
    setTimeout(function(){
        logger.info({doc:document}, _NAME+" callback executed");
        resolve(true);
    },randomNumber(1, 2) * 1000);
  });
}

function addSomeData(min, max) {
    var len = randomNumber(min, max);
    logger.debug(_NAME+' adding to queue len: ' + len+'\n');
    for (var i = 1; i <= len; i++) {
        var cmd = "cmd_" + i;
        add(cmd, {
            doc: "doc_conflicts_" + i
        });
    }

    logger.trace(_NAME+' queue: ', getQueue());
    logger.trace(_NAME+' sequence: ', getSequence());
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * max) + min;
}*/
