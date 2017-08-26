/*jslint node: true */
'use strict';

var Logging     = require('./bunyanLogger.js');
var logger      = Logging.logger();
var inspect     = require('eyespect').inspector();

module.exports  = {
  triage    : handler
};


function handler(err) {
  if (err === null || err === "undefined" || err === undefined) {
    return;
  }
  var messageDetails;
  if (logger.level() < 21) {
    inspect(err, 'inspecting error');
    logger.error(err);
  }
  switch(err.statusCode) {
    case 401:
    {
      messageDetails    = err.body ? err.body : "";
      logger.error({statusCode : "401", details: messageDetails},"User unauthorized!");
    }
    break;

    case 404:
    {
      messageDetails    = err.body ? err.body : "";
      var url = err.request.uri.href ? err.request.uri.href : null;
      if (null === url) {
          logger.error({statusCode : "404", details : messageDetails}, "Not found!");
      }
      else {
        logger.error({statusCode : "404",url:url, details : messageDetails});
        logger.error("Not found!" + "\nIs your endpoint valid?");
      }

    }
    break;

    default:
      handleNonStatusCodeError(err);
  }

}

function handleNonStatusCodeError(err)
{
  var cause;

  switch (err.code) {
    case "ECONNRESET":
    case "ENOTFOUND":
    {
      logger.error('Check your internet connection.\n', (err.message || 'Could not reach host.'));
      break;
    }
    case "ENOENT":
    {
      cause      = err.path ? err.path : "";
      logger.error("File not found: "+cause);
      break;
    }

    default:
    {

    }
      // inspect(err, 'inspecting error');
  }
}

function createError(msg, code)
{
  var err = new Error(msg);
  err.msg = msg;
  err.code = code;
  // console.log(err);
  return err;
}
