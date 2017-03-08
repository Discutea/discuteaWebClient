"use strict";

var program = require("commander");
var colors = require("colors/safe");
var server = require("../server");
var Helper = require("../helper");

program
    .command("start")
    .option("-H, --host <ip>", "host")
    .option("-P, --port <port>", "port")
    .option("-B, --bind <ip>", "bind")
    .description("Start the server")
    .action(function(options) {

        Helper.config.host = options.host || Helper.config.host;
        Helper.config.port = options.port || Helper.config.port;
        Helper.config.bind = options.bind || Helper.config.bind;

        server();
    });
