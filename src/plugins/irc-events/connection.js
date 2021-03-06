"use strict";

var Msg = require("../../models/msg");
var Chan = require("../../models/chan");
var Helper = require("../../helper");

module.exports = function(irc, network) {
    var client = this;
    var identHandler = this.manager.identHandler;

    network.channels[0].pushMessage(client, new Msg({
        text: "Network created, connecting to " + network.host + ":" + network.port + "..."
    }), true);

    irc.on("registered", function() {
        if (network.irc.network.cap.enabled.length > 0) {
            network.channels[0].pushMessage(client, new Msg({
                text: "Enabled capabilities: " + network.irc.network.cap.enabled.join(", ")
            }), true);
        }

        var delay = 1000;
        var commands = network.commands;
        if (Array.isArray(commands)) {
            commands.forEach(cmd => {
                setTimeout(function() {
                    client.input({
                        target: network.channels[0].id,
                        text: cmd
                    });
                }, delay);
                delay += 1000;
            });
        }

        network.channels.forEach(chan => {
            if (chan.type !== Chan.Type.CHANNEL) {
                return;
            }

            setTimeout(function() {
                network.irc.join(chan.name);
            }, delay);
            delay += 1000;
        });
    });

    irc.on("socket connected", function() {
        network.prefixLookup = {};
        irc.network.options.PREFIX.forEach(function(mode) {
            network.prefixLookup[mode.mode] = mode.symbol;
        });

        network.channels[0].pushMessage(client, new Msg({
            text: "Connected to the network."
        }), true);
    });

    irc.on("close", function() {
        network.channels[0].pushMessage(client, new Msg({
            text: "Disconnected from the network, and will not reconnect. Use /connect to reconnect again."
        }), true);
    });

    if (identHandler) {
        let identSocketId;

        irc.on("raw socket connected", function(socket) {
            identSocketId = identHandler.addSocket(socket, client.name);
        });

        irc.on("socket close", function() {
            identHandler.removeSocket(identSocketId);
        });
    }

    if (Helper.config.debug.ircFramework) {
        irc.on("debug", function(message) {
            log.debug("[" + client.name + " (#" + client.id + ") on " + network.name + " (#" + network.id + ")]", message);
        });
    }

    if (Helper.config.debug.raw) {
        irc.on("raw", function(message) {
            network.channels[0].pushMessage(client, new Msg({
                from: message.from_server ? "«" : "»",
                self: !message.from_server,
                type: "raw",
                text: message.line
            }), true);
        });
    }

    irc.on("socket error", function(err) {
        network.channels[0].pushMessage(client, new Msg({
            type: Msg.Type.ERROR,
            text: "Socket error: " + err
        }), true);
    });

    irc.on("reconnecting", function(data) {
        network.channels[0].pushMessage(client, new Msg({
            text: "Disconnected from the network. Reconnecting in " + Math.round(data.wait / 1000) + " seconds… (Attempt " + data.attempt + " of " + data.max_retries + ")"
        }), true);
    });

    irc.on("ping timeout", function() {
        network.channels[0].pushMessage(client, new Msg({
            text: "Ping timeout, disconnecting…"
        }), true);
    });

    irc.on("server options", function(data) {
        if (network.serverOptions.PREFIX === data.options.PREFIX) {
            return;
        }

        network.prefixLookup = {};

        data.options.PREFIX.forEach(mode => {
            network.prefixLookup[mode.mode] = mode.symbol;
        });

        network.serverOptions.PREFIX = data.options.PREFIX;


        client.emit("network_changed");
    });
};
