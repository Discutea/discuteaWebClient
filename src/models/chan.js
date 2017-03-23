"use strict";

var _ = require("lodash");
var Helper = require("../helper");

module.exports = Chan;

Chan.Type = {
    CHANNEL: "channel",
    LOBBY: "lobby",
    QUERY: "query",
    SPECIAL: "special",
};

var id = 0;

function Chan(attr) {
    _.defaults(this, attr, {
        id: id++,
        messages: [],
        name: "",
        topic: "",
        type: Chan.Type.CHANNEL,
        firstUnread: 0,
        unread: 0,
        highlight: false,
        online: true,
        users: []
    });
}

Chan.prototype.pushMessage = function(client, msg, increasesUnread) {
    var obj = {
        chan: this.id,
        msg: msg
    };

    if (increasesUnread || msg.highlight) {
        obj.unread = ++this.unread;
    }

    client.emit("msg", obj);
};

Chan.prototype.sortUsers = function(irc) {
    var userModeSortPriority = {};
    irc.network.options.PREFIX.forEach((prefix, index) => {
        userModeSortPriority[prefix.symbol] = index;
    });

    userModeSortPriority[""] = 99; // No mode is lowest

    this.users = this.users.sort(function(a, b) {
        if (a.mode === b.mode) {
            return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
        }

        return userModeSortPriority[a.mode] - userModeSortPriority[b.mode];
    });
};

Chan.prototype.getMode = function(name) {
    var user = _.find(this.users, {name: name});
    if (user) {
        return user.mode;
    }

    return "";
};

Chan.prototype.getGecos = function(name) {
    var user = _.find(this.users, {name: name});
    if (user) {
        return user.gecos;
    }

    return "";
};

Chan.prototype.toJSON = function() {
    var clone = _.clone(this);
    clone.messages = clone.messages.slice(-100);
    return clone;
};
