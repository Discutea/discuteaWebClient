"use strict";

var Msg = require("../../models/msg");

module.exports = function(irc, network) {
    var client = this;
    irc.on("registered", function(data) {
        network.setNick(data.nick);

        var lobby = network.channels[0];
        var msg = new Msg({
            text: "You're now known as " + data.nick
        });
        lobby.pushMessage(client, msg);
        client.emit("nick", data.nick);
    });
};
