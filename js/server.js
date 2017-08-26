#!/usr/bin/env node

/*jslint node: true */
"use strict";


var express = require("express");
//var app = express();
var router = express.Router();
var path = __dirname + '/';
var port = process.env.PORT;
var worker = require('./worker.js');
var pm = require('../lib/pm.js');
var uri = null;

module.exports = {
    start: start
};


function start() {

    console.log("Server.js start() called... ");

    var app = express();

    app.use(function(error, req, res, next) {

        console.log("Calling use method....");

        res.header("X-powered-by", 'PM-Sync-Processor');
        res.header("Server", 'PM');
        if (error instanceof SyntaxError) {
            console.log("Got an invalid json in body: " + req.body);
            res.json({
                "error": "unable to parse request: " + error
            });
        } else {
            next();
        }
    });

    app.get('/report/:docId', getDocument);


    //router.use(function (req, res, next) {
    //    console.log("Calling /" + req.method);sole.log("Calling /" + req.method);
    //    console.log("Calling /" + req.method);t();
    //});

    router.get("/", function (req, res) {

        console.log("Calling now " + req.method);
        console.log("Path for Get: " + path);

        res.sendFile(path + "index.html");
        //res.sendStatus(200);
    });

    router.get("/about", function (req, res) {

        console.log("Calling about...");
        res.sendFile(path + "about.html");
    });

//router.get("/contact",function(req,res){
//    res.sendFile(path + "contact.html");
//});

    app.use("/", router);

    //app.use("*", function (req, res) {
    //    res.sendFile(path + "404.html");
    //});

    var server = app.listen(port, function () {

        var host = server.address().address;
        var port = server.address().port;
        uri = 'http://' + host + ':' + port;
        console.log('Server listening at ', uri);

        worker.init()
            .then(function() {
                console.log('worker initialized.');
            })
            .catch(function(err) {

                console.error("Error in app.listen: "+err);
                //logger.error(err);
            });
    });


    function getDocument(req, res) {

        //console.log("getDocument called....");
        //console.log("getDocument called param req....",req);
        console.log("getDocument called param req.params....",req.params);
        console.log("getDocument called param req.param.docId....",req.params.docId);

        console.log("Look at the worker: ",worker);

        var docID = req.params.docId;

        //logger.debug({docID:docID,
        //    TS: new Date().getTime()
        //}, "get document call rcvd.");
        // logger.trace("Event details: " + JSON.stringify(req.body));
        worker.getDocument(docID)
            .then(function(processed) {
                console.log("server get document success.");
                res.status(200);
                res.json(processed);
                console.log("server get document processed:",processed);
                console.log("server get document json:",processed.doc.e2eReport);

                //res.sendFile(processed.doc.e2eReport);

            })
            .catch(function(err) {
                console.log(err);
                res.status(400);
                res.json(err);
            });
    }

}