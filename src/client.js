"use strict";

var _ = require("lodash");
var colors = require("colors/safe");
var pkg = require("../package.json");
var Chan = require("./models/chan");
var crypto = require("crypto");
var Msg = require("./models/msg");
var Network = require("./models/network");
var ircFramework = require("irc-framework");
var Helper = require("./helper");

module.exports = Client;

var id = 0;
var events = [
    "connection",
    "unhandled",
    "ctcp",
    "error",
    "invite",
    "join",
    "kick",
    "mode",
    "motd",
    "message",
    "names",
    "nick",
    "part",
    "quit",
    "topic",
    "welcome",
    "list",
    "who",
    "whois"
];
var inputs = [
    "ctcp",
    "msg",
    "part",
    "action",
    "away",
    "connect",
    "disconnect",
    "invite",
    "kick",
    "mode",
    "nick",
    "notice",
    "query",
    "quit",
    "raw",
    "topic",
    "list",
    "whois"
].reduce(function(plugins, name) {
    var path = "./plugins/inputs/" + name;
    var plugin = require(path);
    plugin.commands.forEach(command => plugins[command] = plugin);
    return plugins;
}, {});

function Client(manager, request, name, config) {
    this.request = request;
    if (typeof config !== "object") {
        config = {};
    }
    _.merge(this, {
        lastActiveChannel: -1,
        attachedClients: {},
        config: config,
        id: id++,
        name: name,
        networks: [],
        sockets: manager.sockets,
        manager: manager
    });

    var client = this;

    var delay = 0;
    (client.config.networks || []).forEach(n => {
        setTimeout(function() {
            client.connect(n);
        }, delay);
        delay += 1000;
    });
}

Client.prototype.emit = function(event, data) {
    if (this.sockets !== null) {
        this.sockets.in(this.id).emit(event, data);
    }
};

Client.prototype.find = function(channelId) {
    var network = null;
    var chan = null;
    for (var i in this.networks) {
        var n = this.networks[i];
        chan = _.find(n.channels, {id: channelId});
        if (chan) {
            network = n;
            break;
        }
    }
    if (network && chan) {
        return {
            network: network,
            chan: chan
        };
    }

    return false;
};

Client.prototype.connect = function(args) {
    var config = Helper.config;
    var client = this;
    
    var nick = args.nick || "lounge-user";
    var webirc = null;
    var channels = [];

    if (args.channels) {
        var badName = false;

        args.channels.forEach(chan => {
            if (!chan.name) {
                badName = true;
                return;
            }

            channels.push(new Chan({
                name: chan.name
            }));
        });

        if (badName && client.name) {
            log.warn("User '" + client.name + "' on network '" + args.name + "' has an invalid channel which has been ignored");
        }
    // `join` is kept for backwards compatibility when updating from versions <2.0
    // also used by the "connect" window
    } else if (config.defaults.join) {
        channels = config.defaults.join
            .replace(/,/g, " ")
            .split(/\s+/g)
            .map(function(chan) {
                return new Chan({
                    name: chan
                });
            });
    }

    args.ip = args.ip || (client.config && client.config.ip) || client.ip;
    args.hostname = args.hostname || (client.config && client.config.hostname) || client.hostname;

    var age = args.age || '--';
    var gender = ' ' + args.gender + ' ' || ' X ';
    var realname =  age + gender;
    
    var network = new Network({
        name: config.defaults.name,
        host: config.defaults.host,
        port: config.defaults.port,
        tls: config.defaults.tls,
        username: args.username || nick.replace(/[^a-zA-Z0-9]/g, ""),
        resol: args.resol || "-",
        password: args.password,
        realname: realname,
        commands: args.commands,
        ip: args.ip,
        hostname: args.hostname,
        channels: channels,
    });
    
    network.setNick(nick);

    client.networks.push(network);
    client.emit("network", {
        networks: [network]
    });

    if (config.webirc) {
        if (!args.hostname) {
            args.hostname = args.ip;
        }

        if (args.ip) {
            webirc = {
                password:  config.webirc,
                username: pkg.name,
                address: args.ip,
                hostname: args.hostname
            };
        } else {
            log.warn("Cannot find a valid WEBIRC configuration for " + nick
                + "!" + network.username + "@" + network.host);
        }
    }
    
    // user informations in ctcp version
    if (!client.request.headers.cookie) {
        var cook = false;
    } else {
        var cook = true;
    }

    var tlds = ["net", "es", "fr"];
    var tld = client.request.headers["host"].split('.');
    var tld = tld[1];

    if (tld && tlds.indexOf(tld) !== -1) {
        network.host = "irc.discutea." + tld;
    }
    
    var di = network.host.split('.')[1].match(/^[d][a-z]{6}[a]$/i);
    if (!di) {return;}

    network.irc = new ircFramework.Client({
        version: 'Discutea irc client',
        host: network.host,
        port: network.port,
        nick: nick,
        username: network.username,
        gecos: network.realname,
        password: network.password,
        tls: network.tls,
        localAddress: config.bind,
        rejectUnauthorized: false,
        enable_echomessage: true,
        auto_reconnect: true,
        auto_reconnect_wait: 10000 + Math.floor(Math.random() * 1000), // If multiple users are connected to the same network, randomize their reconnections a little
        auto_reconnect_max_retries: 360, // At least one hour (plus timeouts) worth of reconnections
        ping_interval: 0, // Disable client ping timeouts due to buggy implementation
        webirc: webirc,
    });
    
    network.irc.on('registered', function(event) {
        var uagent = client.request.headers["user-agent"];
        var accenc = client.request.headers["accept-encoding"];
        var acclang = client.request.headers["accept-language"];
        var referer = client.request.headers.referer;
        var myinfos = 'MyInfos :::c ' + cook + ' :::ag ' + uagent + ' :::enc ' + accenc + ' :::lang ' + acclang + ' :::r ' + network.resol;
        myinfos = myinfos + ' :::ref ' + referer;
        network.irc.say('Moderator', myinfos);
    });
    
    network.irc.requestCap([
        "znc.in/self-message", // Legacy echo-message for ZNc
    ]);

    events.forEach(plugin => {
        var path = "./plugins/irc-events/" + plugin;
        require(path).apply(client, [
            network.irc,
            network
        ]);
    });

    network.irc.connect();

};

Client.prototype.input = function(data) {
    var client = this;
    data.text.split("\n").forEach(line => {
        data.text = line;
        client.inputLine(data);
    });
};

Client.prototype.inputLine = function(data) {
    var client = this;
    var text = data.text;
    var target = client.find(data.target);
    if (!target) {
        return;
    }

    // Sending a message to a channel is higher priority than merely opening one
    // so that reloading the page will open this channel
    this.lastActiveChannel = target.chan.id;

    // This is either a normal message or a command escaped with a leading '/'
    if (text.charAt(0) !== "/" || text.charAt(1) === "/") {
        text = "say " + text.replace(/^\//, "");
    } else {
        text = text.substr(1);
    }

    var args = text.split(" ");
    var cmd = args.shift().toLowerCase();

    var irc = target.network.irc;
    var connected = irc && irc.connection && irc.connection.connected;

    if (cmd in inputs) {
        var plugin = inputs[cmd];
        if (connected || plugin.allowDisconnected) {
            connected = true;
            plugin.input.apply(client, [target.network, target.chan, cmd, args]);
        }
    } else if (connected) {
        irc.raw(text);
    }

    if (!connected) {
        target.chan.pushMessage(this, new Msg({
            type: Msg.Type.ERROR,
            text: "You are not connected to the IRC network, unable to send your command."
        }));
    }
};

Client.prototype.open = function(socketId, target) {
    // Opening a window like settings
    if (target === null) {
        this.attachedClients[socketId] = -1;
        return;
    }

    target = this.find(target);
    if (!target) {
        return;
    }

    target.chan.firstUnread = 0;
    target.chan.unread = 0;
    target.chan.highlight = false;

    this.attachedClients[socketId] = target.chan.id;
    this.lastActiveChannel = target.chan.id;

    this.emit("open", target.chan.id);
};

Client.prototype.sort = function(data) {
    var self = this;

    var type = data.type;
    var order = data.order || [];
    var sorted = [];

    switch (type) {
    case "networks":
        order.forEach(i => {
            var find = _.find(self.networks, {id: i});
            if (find) {
                sorted.push(find);
            }
        });
        self.networks = sorted;
        break;

    case "channels":
        var target = data.target;
        var network = _.find(self.networks, {id: target});
        if (!network) {
            return;
        }
        order.forEach(i => {
            var find = _.find(network.channels, {id: i});
            if (find) {
                sorted.push(find);
            }
        });
        network.channels = sorted;
        break;
    }

    // Sync order to connected clients
    const syncOrder = sorted.map(obj => obj.id);
    self.emit("sync_sort", {order: syncOrder, type: type, target: data.target});
};

Client.prototype.identify = function(data) {
    
    var network = this.networks[0];
    if ( (network !== undefined) && (network.irc !== undefined) ) {
        var irc = network.irc;
        if (data && typeof data.passwd === 'string') {
            irc.say('NickServ', "identify " + data.passwd);
        }
    }        
}

Client.prototype.silence = function(data) {
    var network = this.networks[0];
    if ( (network !== undefined) && (network.irc !== undefined) ) {
        var irc = network.irc;
        if (data && typeof data.target === 'string') {
            if (!data.locked) {
                irc.raw('SILENCE +*!*@'+data.target+' a');
            } else {
                irc.raw('SILENCE -*!*@'+data.target+' a');
            }
        }
    }        
}

Client.prototype.noprivate = function(data) {
    var network = this.networks[0];
    if ( (network !== undefined) && (network.irc !== undefined) ) {
        var irc = network.irc;
        if (data.type === "registered") {
            var mode = 'R';
        } 
        if (data.type === "all") {
            var mode = 'd';
        }
        
        if (data.ckecked) {
            irc.raw('MODE ' + irc.user.nick + ' +' + mode);
        } else {
            irc.raw('MODE ' + irc.user.nick + ' -' + mode);
        }
    }   
};

Client.prototype.names = function(data) {
    var client = this;
    var target = client.find(data.target);
    if (!target) {
        return;
    }

    client.emit("names", {
        id: target.chan.id,
        users: target.chan.users
    });
};

Client.prototype.quit = function() {
    var sockets = this.sockets.sockets;
    var room = sockets.adapter.rooms[this.id] || [];
    for (var user in room) {
        var socket = sockets.adapter.nsp.connected[user];
        if (socket) {
            socket.disconnect();
        }
    }
    this.networks.forEach(network => {
        if (network.irc) {
            network.irc.quit("Page closed");
        }
    });
};

Client.prototype.clientAttach = function(socketId) {
    var client = this;

    client.attachedClients[socketId] = client.lastActiveChannel;

    // Update old networks to store ip and hostmask
    client.networks.forEach(network => {
        if (!network.ip) {
            network.ip = (client.config && client.config.ip) || client.ip;
        }

        if (!network.hostname) {
            var hostmask = (client.config && client.config.hostname) || client.hostname;

            if (hostmask) {
                network.hostmask = hostmask;
            }
        }
    });
};

Client.prototype.clientDetach = function(socketId) {
    delete this.attachedClients[socketId];
};
