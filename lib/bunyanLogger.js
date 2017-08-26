#!/usr/bin/env node
/*jslint node: true */
"use strict";
// --- imports
var bunyan      = require('bunyan');
module.exports = {
      logger : getLogger
};

function getLogger()
{
  return bunyan.createLogger({name: "CMD-GEN", src:true, level:'TRACE'});
}
