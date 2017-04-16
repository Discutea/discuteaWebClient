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
    "whois",
    "notice"
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
        config: config,
        id: id++,
        name: name,
        networks: null,
        sockets: manager.sockets,
        manager: manager
    });
}

Client.prototype.emit = function(event, data) {
    if (this.sockets !== null) {
        this.sockets.in(this.id).emit(event, data);
    }
};

Client.prototype.find = function(channelId) {
    var chan = _.find(this.networks.channels, {id: channelId});

    if (this.networks && chan) {
        return {
            network: this.networks,
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

    args.ip = args.ip || (client.config && client.config.ip) || client.ip;
    args.hostname = args.hostname || (client.config && client.config.hostname) || client.hostname;

    var age = args.age || '--';
    var gender = ' ' + args.gender + ' ' || ' X ';
    var realname =  age + gender;
    
    if (!args.channel) {
        var chanjoin = '#Accueil';
    } else {
      if (args.channel.charAt(0) === '#') {
        var chanjoin = args.channel;
      } else {
        var chanjoin = '#' + args.channel;
      }
    }

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
        chanjoin: chanjoin,
    });
    
    network.setNick(nick);

    client.networks = network;
    client.emit("network", network);

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
    var tld = 'chat.discutea.com'.split('.');
    var tld = tld[2];

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
        client.emit("i_registered");
        setTimeout(function() { network.irc.join(chanjoin); }, 1300);
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
    target = this.find(target);
    if (!target) {
        return;
    }

    target.chan.firstUnread = 0;
    target.chan.unread = 0;
    target.chan.highlight = false;

    this.lastActiveChannel = target.chan.id;

    this.emit("open", target.chan.id);
};

Client.prototype.identify = function(data) {
    
    var network = this.networks;
    if ( (network) && (network.irc !== undefined) ) {
        var irc = network.irc;
        if (data && typeof data.passwd === 'string') {
            irc.say('NickServ', "identify " + data.passwd);
        }
    }        
}

Client.prototype.silence = function(data) {
    var network = this.networks;
    if ( (network) && (network.irc !== undefined) ) {
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
    var network = this.networks;
    if ( (network) && (network.irc !== undefined) ) {
        var irc = network.irc;
        if (data.type === "registered") {
            var mode = 'R';
        } 
        if (data.type === "commonchans") {
            var mode = 'c';
        } 
        if (data.type === "all") {
            var mode = 'D';
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

    if (this.networks && this.networks.irc) {
        this.networks.irc.quit("Page closed");
    }
};
