"use strict";

var _ = require("lodash");
var pkg = require("../package.json");
var Client = require("./client");
var ClientManager = require("./clientManager");
var express = require("express");
var fs = require("fs");
var io = require("socket.io");
var dns = require("dns");
var Helper = require("./helper");
var colors = require("colors/safe");
var url = require('url');
var manager = null;
var acceptLanguage = require('accept-language');

module.exports = function() {
    manager = new ClientManager();
    
    if (!fs.existsSync("client/js/bundle.js")) {
        log.error(`The client application was not built. Run ${colors.bold("NODE_ENV=production npm run build")} to resolve this.`);
        process.exit();
    }

    var app = express()
        .use(allRequests)
        .use(index)
        .use(express.static("client"));
    
    var config = Helper.config;
    var server = null;

    if (!config.https.enable) {
        server = require("http");
        server = server.createServer(app).listen(config.port, config.host);
        server.timeout = 15000;
    } else {
        server = require("spdy");
        const keyPath = Helper.expandHome(config.https.key);
        const certPath = Helper.expandHome(config.https.certificate);
        if (!config.https.key.length || !fs.existsSync(keyPath)) {
            log.error("Path to SSL key is invalid. Stopping server...");
            process.exit();
        }
        if (!config.https.certificate.length || !fs.existsSync(certPath)) {
            log.error("Path to SSL certificate is invalid. Stopping server...");
            process.exit();
        }
        server = server.createServer({
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath)
        }, app).listen(config.port, config.host);
        server.timeout = 15000;
    }

    var sockets = io(server, {
        serveClient: false,
        transports: config.transports
    });

    sockets.on("connect", function(socket) {
        auth.call(socket);
    });

    manager.sockets = sockets;

    const protocol = config.https.enable ? "https" : "http";
    const host = config.host || "*";

    log.info("The Client is now running");
};

function getClientIp(req) {
    var ip;
    
    if (req.headers["x-forwarded-for"]) {
        ip = req.headers["x-forwarded-for"];
    } else {
        ip = req.connection.remoteAddress;
    }

    return ip.replace(/^::ffff:/, "");
}

function allRequests(req, res, next) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    return next();
}

function getParsedAcceptLangs(hdr) {
  var pairs = hdr.split(',');
  var pair = pairs[0].split(';');
  var result = pair[0].split('-')[0];
  result = result.toLowerCase();
 
  return result;
}

function index(req, res, next) {

    if (!req.headers['accept-language']) {
        var locale = 'en';
    } else {
        var locale = getParsedAcceptLangs(req.headers['accept-language']);
        if (!locale) {
            locale = 'en';
        }
    }
    
    if (fs.existsSync('client/translations/messages_' + locale + '.js')) {
        var trans = require('../client/translations/messages_' + locale);
    } else {
        var trans = require('../client/translations/messages_en');
    }

    trans = {trans: trans.web};

    if (req.url.split("?")[0] !== "/") {
        return next();
    }

    var queryData = url.parse(req.url, true).query;

    return fs.readFile("client/index.html", "utf-8", function(err, file) {
        if (err) {
            throw err;
        }

        var data = _.merge(
            pkg,
            Helper.config,
            queryData,
            trans
        );

        var template = _.template(file);
        res.setHeader("Content-Security-Policy", "default-src *; connect-src 'self' ws: wss:; style-src * 'unsafe-inline'; script-src 'self'; child-src 'self'; object-src 'none'; form-action 'none'; referrer no-referrer;");
        res.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-inline' 'unsafe-eval' pagead2.googlesyndication.com cdn.datatables.net; object-src 'self' pagead2.googlesyndication.com cdn.datatables.net;");
        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
        res.end(template(data));
    });
}

function init(socket, client) {
    if (!client) {
        socket.emit("auth", {success: true});
        socket.on("auth", auth);
    } else {
        client.ip = getClientIp(socket.request);

        socket.on(
            "input",
            function(data) {
                client.input(data);
            }
        );
        
        socket.on(
            "conn",
            function(data) {
                // prevent people from overriding webirc settings
                data.ip = null;
                data.hostname = null;
                client.connect(data);
            }
        );
        socket.on(
            "open",
            function(data) {
                client.open(socket.id, data);
            }
        );
        socket.on(
            "sort",
            function(data) {
                client.sort(data);
            }
        );
        socket.on(
            "names",
            function(data) {
                client.names(data);
            }
        );
        socket.on(
            "noprivate",
            function(data) {
                client.noprivate(data);
            }
        );
        socket.on(
            "send_identify",
            function(data) {
                client.identify(data);
            }
        );
        socket.on(
            "silence",
            function(data) {
                client.silence(data);
            }
        );
        socket.join(client.id);
        socket.emit("init", {
            active: client.lastActiveChannel,
            networks: client.networks,
            token: client.config.token || null
        });
    }
}

function reverseDnsLookup(socket, client) {
    client.ip = getClientIp(socket.request);

    dns.reverse(client.ip, function(err, host) {
        if (!err && host.length) {
            client.hostname = host[0];
        } else {
            client.hostname = client.ip;
        }

        init(socket, client);
    });
}

function auth(data) {
    var socket = this;
    var client;

    client = new Client(manager, socket.request);
    manager.clients.push(client);
    socket.on("disconnect", function() {
        manager.clients = _.without(manager.clients, client);
        client.quit();
    });
    if (Helper.config.webirc) {
        reverseDnsLookup(socket, client);
    } else {
        init(socket, client);
    }
}
