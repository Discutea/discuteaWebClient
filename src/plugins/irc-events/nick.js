"use strict";

var _ = require("lodash");
var Msg = require("../../models/msg");

module.exports = function(irc, network) {
    var client = this;
    irc.on("nick", function(data) {
        let msg;
        var self = false;
        if (data.nick === irc.user.nick) {
            network.setNick(data.new_nick);

            var lobby = network.channels[0];
            msg = new Msg({
                text: "You're now known as " + data.new_nick,
            });
            lobby.pushMessage(client, msg, true);
            self = true;
            client.emit("nick", {
                network: network.id,
                nick: data.new_nick
            });
        }

        var mode = "";
        
        network.channels.forEach(chan => {
            var user = _.find(chan.users, {name: data.nick});
            if (chan.type !== 'query' && typeof user !== "undefined") {
                user.name = data.new_nick;
                chan.sortUsers(irc);
                client.emit("users", {
                   chan: chan.id
                });
                mode = chan.getMode(data.new_nick);
            } else if (chan.name.toLowerCase() !== data.nick.toLowerCase()) {
                return;
            }

            msg = new Msg({
                time: data.time,
                from: data.nick,
                type: Msg.Type.NICK,
                mode: mode,
                new_nick: data.new_nick,
                self: self
            });
            
            chan.pushMessage(client, msg);
            
            if (chan.type === 'query') {
                chan.name = data.new_nick;
                client.emit("update_query", chan);
            }
        });
    });
};
