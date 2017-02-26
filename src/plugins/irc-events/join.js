"use strict";

var Chan = require("../../models/chan");
var Msg = require("../../models/msg");
var User = require("../../models/user");

module.exports = function(irc, network) {
	var client = this;
	irc.on("join", function(data) {
        
		var chan = network.getChannel(data.channel);
		if (typeof chan === "undefined") {
			chan = new Chan({
				name: data.channel
			});
			network.channels.push(chan);
			client.emit("join", {
				network: network.id,
				chan: chan
			});
		}

        if (irc.user.nick === data.nick) {
            irc.who(data.channel, data.channel);
        }
        
        chan.users.push(new User(data));
		chan.sortUsers(irc);
		client.emit("users", {
			chan: chan.id
		});

		var msg = new Msg({
			time: data.time,
			from: data.nick,
			hostmask: data.ident + "@" + data.hostname,
			type: Msg.Type.JOIN,
			self: data.nick === irc.user.nick
		});
		chan.pushMessage(client, msg);
	});
};
