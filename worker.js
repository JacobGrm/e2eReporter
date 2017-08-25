#!/usr/bin/env node

/*jslint node: true */
"use strict";

// --- imports
var BPromise = require('bluebird');
BPromise.longStackTraces();
var pmq         = require("../lib/pmq.js");
var pm = require('../lib/pm.js');
var cache = require('../lib/pm-cache.js');

var logger = null;

module.exports = {
    init: init,
    getReport : fetchReport
};

function init() {
    return new BPromise(function(resolve, reject) {

        console.log("call to worker init...");
        //logger = pm.logger();
        //pmConfig = pm.config();
        pmq.init(fetchReport, {
            concurrency : 1,
            name : 'worker_queue'
        });
        pmq.start();
        resolve(true);
    });
}


function fetchReport(request) {
    return new BPromise(function (resolve, reject) {
        console.log("trying to update document: "+request.docID);
        // get the doc by docID
        cache.get(request.docID)
            .then(function (result) {
                console.log({doc_to_be_updated : result}, 'doc from cache.');
                if (result.isPresent) {
                    var document = result.doc;
                    //var updatedDoc = _updateChangesToDoc(document, request.change);
                    //logger.trace({updatedDoc : updatedDoc}, 'updated document.');
                    return cache.get(document);
                }
                else {
                    console.log("Document not found.");
                    //logger.error('Document not found.');
                    // reject({
                    //   SUCCESS : 0,
                    //   error : result.error
                    // });
                    throw({
                        SUCCESS : 0,
                        error : result.error
                    });
                }
            })
            .then(function (updateResult) {
                //logger.trace({result: updateResult}, 'Doc updated');
                resolve(updateResult);
            })
            .catch(function (err) {
                //logger.error("OOOOO-->",err);
                reject(err);
            });
    });
}


//function fetchReport(request) {
//
//    console.log("worker's fetchReport called...");
//}
