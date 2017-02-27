"use strict";

var Msg = require("../../models/msg");

module.exports = function(irc, network) {
	var client = this;
	irc.on("wholist", function(data) {
console.log(data);
	});
};
