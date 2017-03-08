"use strict";

var _ = require("lodash");
var Chan = require("../../models/chan");

module.exports = function(irc, network) {
    var client = this;
    
    irc.on("wholist", function(data) {
        var chan = network.getChannel(data.target);
        if (typeof chan !== "undefined") {
            data.users.forEach(function(user) {
                var u = _.find(chan.users, {name: user.nick});
                if (u) {
                    u.gecos = user.real_name;
                }
            });
            
            client.emit("users", {
                chan: chan.id
            });
        }
    });
};
