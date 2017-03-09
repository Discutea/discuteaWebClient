"use strict";

global.log = require("../log.js");

var program = require("commander");
var colors = require("colors/safe");
var fs = require("fs");
var fsextra = require("fs-extra");
var path = require("path");
var Helper = require("../helper");

program.option("");
program.option("    --home <path>" , "home path");

var argv = program.parseOptions(process.argv);

require("./start");
require("./config");

program.parse(argv.args);

if (!program.args.length) {
    program.parse(process.argv.concat("start"));
}
