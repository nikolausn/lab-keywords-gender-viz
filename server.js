//author: nnp2

//http and rest nodejs library
var express = require('express');
var app = express();
//reading file system / file
var fs = require("fs");
//url parser to
var url = require('url');
//serialize querystring parameter
var querystring = require('querystring');
//var http = require('http');
var request = require("request");
//Library to make sync request call
var thenRequest = require('then-request');
//Library to call async request
var async = require('async');
//array, collection and text library
var _ = require('underscore');
//Logger
var log = require('winston');
//log.log = console.log.bind(console); // don't forget to bind to console!
//Promise
var Q = require('q');

//Setting log
log.level = "debug";

//Serve static file
app.use("/resources", express.static('public'));



//Run the server
var server = app.listen(8080, function() {
	var host = server.address().address;
	var port = server.address().port;
	server.maxConnections = 100;

	log.debug("Keywords Gender viz listening at http://%s:%s", host, port)
});