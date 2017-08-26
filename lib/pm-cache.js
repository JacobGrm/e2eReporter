#!/usr/bin/env node

/*jslint node: true */
"use strict";

var BPromise = require('bluebird');
BPromise.longStackTraces();

var pm = require('../lib/pm.js');
var Logging     = require('./bunyanLogger.js');
var logger      = Logging.logger();

module.exports = {
    // update : bulkUpdate,
    updateSingleDoc: updateSingleDoc,
    get: getDocument
};


function updateSingleDoc(jsonData) {
    return new BPromise(function(resolve, reject) {
      logger.trace({doc_rcvd:jsonData}, 'uploading document to cache.');
        pm.db().insert(jsonData, jsonData._id, function(err, body) {
            if (err) {
                logger.error('Error in updating pm cache: \n', err);
                reject(err);
            } else if (body.length < 1) {
              logger.error('Error in updating pm cache: \nLooks like an invalid document sent!!');
              reject(err || 'Error in updating pm cache: \nLooks like an invalid document sent!!');
            }
            else {
                logger.trace({
                    put_response: body
                }, 'pm cache updated successfully.');
                resolve(body);
            }
        });
    });
}

function getDocument(docID) {
    return new BPromise(function(resolve, reject) {
        pm.db().get(docID, {
            revs_info: true
        }, function(err, body) {
            if (err) {
              if (err.hasOwnProperty('message')) {
                resolve({
                    isPresent: false,
                    error: err.message
                });
              } else {
                resolve({
                    isPresent: false,
                    error: "Unable to find document!"
                });
              }

            } else {
                resolve({
                    isPresent: true,
                    doc: body
                });
            }
        });
    });
}
