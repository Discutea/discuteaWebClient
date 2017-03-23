"use strict";

exports.commands = ["quit"];
exports.allowDisconnected = true;

exports.input = function(network, chan, cmd, args) {
    var client = this;
    var irc = network.irc;
    var quitMessage = args[0] ? args.join(" ") : "";

    client.emit("quit", {
        network: network.id
    });

    if (irc) {
        irc.quit(quitMessage);
    }

    return true;
};
