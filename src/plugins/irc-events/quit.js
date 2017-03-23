"use strict";

var _ = require("lodash");
var Msg = require("../../models/msg");

module.exports = function(irc, network) {
    var client = this;
    irc.on("quit", function(data) {
        network.channels.forEach(chan => {
            var from = data.nick;
            var mode = "";
            var user = _.find(chan.users, {name: from});
            if (chan.type !== 'query' && typeof user !== "undefined") {
              chan.users = _.without(chan.users, user);
              client.emit("users", {
                chan: chan.id,
                action: 'remove',
                user: user
              });
              mode = user.mode || "";
            } else if (chan.name.toLowerCase() !== from.toLowerCase()) {
                return;
            }
            
            var msg = new Msg({
                time: data.time,
                type: Msg.Type.QUIT,
                mode: mode,
                text: data.message || "",
                hostmask: data.ident + "@" + data.hostname,
                from: from
            });

            if (chan.type === 'query') {
                if (chan.online) {
                    chan.online = false;
                } else {
                    return;
                }
            }
            
            chan.pushMessage(client, msg);
        });
    });
};
