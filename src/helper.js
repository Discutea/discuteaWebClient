"use strict";

const pkg = require("../package.json");
var _ = require("lodash");
var path = require("path");
var os = require("os");
var fs = require("fs");
var net = require("net");
var bcrypt = require("bcrypt-nodejs");

var Helper = {
    config: null,
    expandHome: expandHome,
    setHome: setHome,

    password: {
        hash: passwordHash,
        compare: passwordCompare,
        requiresUpdate: passwordRequiresUpdate,
    },
};

module.exports = Helper;

Helper.config = require(path.resolve(path.join(
    __dirname,
    "..",
    "defaults",
    "config.js"
)));

function setHome(homePath) {
    this.HOME = expandHome(homePath || "~/.lounge");
    this.CONFIG_PATH = path.join(this.HOME, "config.js");

    // Reload config from new home location
    if (fs.existsSync(this.CONFIG_PATH)) {
        this.config = _.extend(this.config);
    }

    // TODO: Remove in future release
    if (this.config.debug === true) {
        log.warn("debug option is now an object, see defaults file for more information.");
        this.config.debug = {ircFramework: true};
    }
}

function expandHome(shortenedPath) {
    var home;

    if (os.homedir) {
        home = os.homedir();
    }

    if (!home) {
        home = process.env.HOME || "";
    }

    home = home.replace("$", "$$$$");

    return path.resolve(shortenedPath.replace(/^~($|\/|\\)/, home + "$1"));
}

function passwordRequiresUpdate(password) {
    return bcrypt.getRounds(password) !== 11;
}

function passwordHash(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(11));
}

function passwordCompare(password, expected) {
    return bcrypt.compareSync(password, expected);
}
