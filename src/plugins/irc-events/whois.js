"use strict";

var Chan = require("../../models/chan");
var Msg = require("../../models/msg");

module.exports = function(irc, network, msg) {
	var client = this;
	irc.on("whois", function(data) {
        var obj = {
            sex: undefined,
            age: undefined,
            loc: undefined
        }


        if (typeof data.real_name === 'string') {
            var real = data.real_name.split(' ');
            if (real.length >= 2) {
                if (parseInt(real[0]) !== 'NaN') {
                    obj.age = parseInt(real[0]);
                }
                
                var sex = real[1].toUpperCase();
                if ( ["F", "W"].indexOf(sex) >= 0 ) {
                    obj.sex = 'female';
                } else if ( ["M", "H"].indexOf(sex) >= 0 ) {
                    obj.sex = 'male';
                }
            }
            
            obj.loc = real.slice(2, real.length).join(' ');
        }
            
        Object.assign(data, obj);
          
		var chan = network.getChannel(data.nick);
		if (typeof chan === "undefined") {
			chan = new Chan({
				type: Chan.Type.QUERY,
				name: data.nick
			});
			network.channels.push(chan);
			client.emit("join", {
				shouldOpen: true,
				network: network.id,
				chan: chan,
                data: data
			});
		} else {
			client.emit("discuteawhois", {
				shouldOpen: true,
				network: network.id,
				chan: chan,
                data: data
			});
        }
	});
};
