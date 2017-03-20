// vendor libraries
import "jquery-ui/ui/widgets/sortable";
import $ from "jquery";
import io from "socket.io-client";
import Mousetrap from "mousetrap";
import URI from "urijs";

// our libraries
import "jquery-textcomplete";
import emojiMap from "emoji-name-map";
import "./libs/jquery/inputhistory";
import "./libs/jquery/stickyscroll";
import "./libs/jquery/tabcomplete";
import helpers_parse from "./libs/handlebars/parse";
import helpers_roundBadgeNumber from "./libs/handlebars/roundBadgeNumber";
import slideoutMenu from "./libs/slideout";
import "./libs/bootstrap";
import templates from "../views";

$(function() {
    var path = window.location.pathname + "socket.io/";
    var socket = io({
        path: path,
        autoConnect: false,
        reconnection: false
    });

    if ( (navigator !== undefined) && (navigator.language !== undefined) ) {
        var locale = {locale: navigator.language};
    } else {
        var locale = {locale: "en"}; 
    }
    
    var commands = [
        "/away",
        "/back",
        "/close",
        "/connect",
        "/deop",
        "/devoice",
        "/disconnect",
        "/invite",
        "/join",
        "/kick",
        "/leave",
        "/me",
        "/list",
        "/mode",
        "/msg",
        "/nick",
        "/notice",
        "/op",
        "/part",
        "/query",
        "/quit",
        "/raw",
        "/say",
        "/send",
        "/server",
        "/slap",
        "/topic",
        "/voice",
        "/whois"
    ];

    var sidebar = $("#sidebar, #footer");
    var chat = $("#chat");

    var ignoreSortSync = false;

    var pop;
    try {
        pop = new Audio();
        pop.src = "audio/pop.ogg";
    } catch (e) {
        pop = {
            play: $.noop
        };
    }
    
    $("#play").on("click", function() {
        pop.play();
    });


    var favicon = $("#favicon");

    var emojies = Object.keys(emojiMap.emoji);

    // Autocompletion Strategies

    var emojiStrategy = {
        id: "emoji",
        match: /\B:([-+\w]*)$/,
        search: function(term, callback) {
            callback($.map(emojies, function(e) {
                return e.indexOf(term) === 0 ? e : null;
            }));
        },
        template: function(value) {
            return emojiMap.get(value) + " :" + value + ":";
        },
        replace: function(value) {
            return emojiMap.get(value);
        },
        index: 1
    };

    var nicksStrategy = {
        id: "nicks",
        match: /\B(@([a-zA-Z_[\]\\^{}|`@][a-zA-Z0-9_[\]\\^{}|`-]*)?)$/,
        search: function(term, callback) {
            term = term.slice(1);
            if (term[0] === "@") {
                console.log(term);
                callback(completeNicks(term.slice(1)).map(function(val) {
                    return "@" + val;
                }));
            } else {
                callback(completeNicks(term));
            }
        },
        template: function(value) {
            if (value[0] === "@") {
                return value;
            }
            return "@" + value;
        },
        replace: function(value) {
            return value;
        },
        index: 1
    };

    var chanStrategy = {
        id: "chans",
        match: /\B((#|\+|&|![A-Z0-9]{5})([^\x00\x0A\x0D\x20\x2C\x3A]+(:[^\x00\x0A\x0D\x20\x2C\x3A]*)?)?)$/,
        search: function(term, callback, match) {
            callback(completeChans(match[0]));
        },
        template: function(value) {
            return value;
        },
        replace: function(value) {
            return value;
        },
        index: 1
    };

    var commandStrategy = {
        id: "commands",
        match: /^\/(\w*)$/,
        search: function(term, callback) {
            callback(completeCommands("/" + term));
        },
        template: function(value) {
            return value;
        },
        replace: function(value) {
            return value;
        },
        index: 1
    };

    function setLocalStorageItem(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (e) {
            // Do nothing. If we end up here, web storage quota exceeded, or user is
            // in Safari's private browsing where localStorage's setItem is not
            // available. See http://stackoverflow.com/q/14555347/1935861.
        }
    }

    [
        "connect_error",
        "connect_failed",
        "disconnect",
        "error",
    ].forEach(function(e) {
        socket.on(e, function(data) {
            $("#loading-page-message").text("Connection failed: " + data);
            $("#connection-error").addClass("shown").one("click", function() {
                window.onbeforeunload = null;
                window.location.reload();
            });

            // Disables sending a message by pressing Enter. `off` is necessary to
            // cancel `inputhistory`, which overrides hitting Enter. `on` is then
            // necessary to avoid creating new lines when hitting Enter without Shift.
            // This is fairly hacky but this solution is not permanent.
            $("#input").off("keydown").on("keydown", function(event) {
                if (event.which === 13 && !event.shiftKey) {
                    event.preventDefault();
                }
            });
            // Hides the "Send Message" button
            $("#submit").remove();

            console.error(data);
        });
    });

    socket.on("connecting", function() {
        $("#loading-page-message").text("Connecting…");
    });

    socket.on("connect", function() {
        $("#loading-page-message").text("Finalizing connection…");
    });

    socket.on("init", function(data) {
        $("#loading-page-message").text("Rendering…");

        if (data.networks.length === 0) {
            $("#footer").find(".connect").trigger("click");
        } else {
            renderNetworks(data);
        }

        $("body").removeClass("signed-out");
        $("#loading").remove();

        var id = data.active;
        var target = sidebar.find("[data-id='" + id + "']").trigger("click");
        if (target.length === 0) {
            var first = sidebar.find(".chan")
                .eq(0)
                .trigger("click");
            if (first.length === 0) {
                $("#footer").find(".connect").trigger("click");
            }
        }
    });

    socket.on("open", function(id) {
        // Another client opened the channel, clear the unread counter
        sidebar.find(".chan[data-id='" + id + "'] .badge")
            .removeClass("highlight")
            .empty();
    });
    
    socket.on("discuteawhois", function(data) {
        renderSidebarInfos(data);
        renderMinors(data.chan.id, data.data.age);
    });

    socket.on("join", function(data) {
        var id = data.network;
        var network = sidebar.find("#network-" + id);
        network.append(
            templates.chan({
                channels: [data.chan]
            })
        );

        chat.append(
            templates.chat({
              channels: [data.chan]
            })
        );
        
        renderChannel(data.chan, data.data);
        // Queries do not automatically focus, unless the user did a whois
        
        if (data.chan.type === "query" && !data.shouldOpen) {
            return;
        }

        sidebar.find(".chan")
            .sort(function(a, b) {
                return $(a).data("id") - $(b).data("id");
            })
            .last()
            .click();
        
        if (data.chan.type === "query") {
            renderSidebarInfos(data);
            renderMinors(data.chan.id, data.data.age);
        }
    });
    
    function buildChatMessage(data) {   
        var type = data.msg.type;
        var target = "#chan-" + data.chan;
        if (type === "error") {
            target = "#chan-" + chat.find(".active").data("id");
        }

        var chan = chat.find(target);
        var template = "msg";
        
        if ([
            "invite",
            "join",
            "mode",
            "kick",
            "nick",
            "part",
            "quit",
            "topic",
            "topic_set_by",
            "action",
            "ctcp",
            "channel_list"
        ].indexOf(type) !== -1) {
            template = "msg_action";
        } else if (type === "unhandled") {
            template = "msg_unhandled";
        }

        var msg = $(templates[template](data.msg));
        var text = msg.find(".text");

        if (template === "msg_action") {
            Object.assign(data.msg, locale);
            text.html(templates.actions[type](data.msg));
        }

        if ((type === "message" || type === "action") && chan.hasClass("channel")) {
            var nicks = chan.find(".users").data("nicks");
            if (nicks) {
                var find = nicks.indexOf(data.msg.from);
                if (find !== -1 && typeof move === "function") {
                    move(nicks, find, 0);
                }
            }
        }
        
        return msg;
    }

    function buildChannelMessages(channel, messages) {
        return messages.reduce(function(docFragment, message) {
            docFragment.append(buildChatMessage({
                chan: channel,
                msg: message
            }));
            return docFragment;
        }, $(document.createDocumentFragment()));
    }

    function renderChannel(data) {
        renderChannelMessages(data);
        if ( ((data.type) && (data.type === 'channel')) ) {
            renderChannelUsers(data);
        }
        if ( ((data.type) && (data.type === 'query')) ) {
            renderChannelQuery(data);
        }
    }

    function renderChannelMessages(data) {
        var documentFragment = buildChannelMessages(data.id, data.messages);
        var channel = chat.find("#chan-" + data.id + " .messages").append(documentFragment);

        if (data.firstUnread > 0) {
            var first = channel.find("#msg-" + data.firstUnread);

            // TODO: If the message is far off in the history, we still need to append the marker into DOM
            if (!first.length) {
                channel.prepend(templates.unread_marker());
            } else {
                first.before(templates.unread_marker());
            }
        } else {
            channel.append(templates.unread_marker());
        }
    }

    function renderChannelQuery(data) {
        var nick = {
            avatar: 'https://cdn.discutea.com/avatars/default-m.jpg'
        };
        
        Object.assign(data, nick);
        var users = chat.find("#chan-" + data.id).find(".sidebar");
        Object.assign(data, locale);
        users.html(templates.query(data));
        users.show();        
    }
    
    
    function renderMinors(chanId, age) {
        if (!chanId) {
            return;
        }

        if (!age || age < 18) {
            var container = chat.find("#chan-" + chanId).find(".messages");
            container.append(templates.msg_minor({age: age, locale:locale}));
        }
    }
    
    function renderSidebarInfos(data) {
        var infos = chat
                   .find("#chan-" + data.chan.id)
                   .find(".sidebar");
           
        if (data.data.sex) {
            infos.find("#dname").addClass(data.data.sex);
        }

        var locked = {
              locked: isIgnored(data.data.host)
            };
            
        Object.assign(data.data, locked);
        Object.assign(data.data, locale);
        
        infos.find(".whois")
             .html(templates.query_infos(data.data)); 

        renderSidebarAvatar(infos, data.data);
    };
    
    function renderSidebarAvatar(infos, data) {        
        if (typeof data.account === 'string') {            
            $.getJSON( "https://discutea.fr/api/anope/avatars/"+data.account+"/by/irc/account", function( data ) {
                $.each( data, function( key, val ) {
                    if (key == 'avatar')
                    {
                        infos.find("img")
                             .attr('src', 'https://cdn.discutea.com' + val);
                    }
                });
            });
        } else if (data.sex === 'female') {
            infos.find("img")
                 .attr('src', 'https://cdn.discutea.com/avatars/default-f.jpg');
        }
    };
    
    function renderChannelUsers(data) {
        var users = chat.find("#chan-" + data.id).find(".users");

        var nicks = users.data("nicks") || [];
        var i, oldSortOrder = {};

        for (i in nicks) {
            oldSortOrder[nicks[i]] = i;
        }

        nicks = [];

        for (i in data.users) {
            nicks.push(data.users[i].name);
        }

        nicks = nicks.sort(function(a, b) {
            return (oldSortOrder[a] || Number.MAX_VALUE) - (oldSortOrder[b] || Number.MAX_VALUE);
        });

        users.html(templates.user(data)).data("nicks", nicks);
    }

    function renderNetworks(data) {
        sidebar.find(".empty").hide();
        sidebar.find(".networks").append(
            templates.network({
                networks: data.networks
            })
        );

        var channels = $.map(data.networks, function(n) {
            return n.channels;
        });
        chat.append(
            templates.chat({
                channels: channels
            })
        );
        channels.forEach(renderChannel);
        sortable();

        if (sidebar.find(".highlight").length) {
            toggleNotificationMarkers(true);
        }
    }

    socket.on("msg", function(data) {
        var msg = buildChatMessage(data);
        var target = "#chan-" + data.chan;
        var container = chat.find(target + " .messages");

        // Fix #10 https://github.com/Discutea/discuteaWebClient/issues/10
        var msgs = container.find(".msg");
        if (msgs.length > 500) {
            msgs.first().remove();
        }
        
        // Add message to the container
        container
            .append(msg)
            .trigger("msg", [
                target,
                data
            ]);
        
        if (data.msg.self) {
            container
                .find(".unread-marker")
                .appendTo(container);
        }
        
    });

    socket.on("network", function(data) {
        renderNetworks(data);

        sidebar.find(".chan")
            .last()
            .trigger("click");

        $("#connect")
            .find(".btn")
            .prop("disabled", false)
            .end();
    });

    socket.on("network_changed", function(data) {
        sidebar.find("#network-" + data.network).data("options", data.serverOptions);
        
        // get input noprivate after connection and emit for changed modes on irc.
        $.each( $("#settings .noprivate"), function() {
            var name = $(this).attr("name");
            var checked = $(this).is(':checked');
            if (name === "noprivateregistered") {
                socket.emit("noprivate", {
                    ckecked: checked,
                    type: "registered"
                });
            }
            if (name === "commonchans") {
                socket.emit("noprivate", {
                    ckecked: checked,
                    type: "commonchans"
                });
            }
            if (name === "noprivate") {
                socket.emit("noprivate", {
                    ckecked: checked,
                    type: "all"
                });
            }
        });
    });

    socket.on("nick", function(data) {
        var id = data.network;
        var nick = data.nick;
        var network = sidebar.find("#network-" + id).data("nick", nick);
        if (network.find(".active").length) {
            setNick(nick);
        }
    });

    socket.on("part", function(data) {
        var chanMenuItem = sidebar.find(".chan[data-id='" + data.chan + "']");

        // When parting from the active channel/query, jump to the network's lobby
        if (chanMenuItem.hasClass("active")) {
            var channels = chanMenuItem.parent(".network").find(".channel");
            var chanscount = channels.length;
            if (chanMenuItem.hasClass("channel")) {
                chanscount--;
            }
            
            var changed = false;
            
            if (chanscount) {
                channels.each(function() {
                    if ($(this).data('title') !== chanMenuItem.data('title')) {
                        $(this).click();
                        changed = true;
                        return;
                    }
                });
            } 
            
            if (!changed) {
                chanMenuItem.parent(".network").find(".lobby").click();
            }
        }
        
        chanMenuItem.remove();
        $("#chan-" + data.chan).remove();
    });
    
    socket.on("quit", function(data) {
        var id = data.network;
        sidebar.find("#network-" + id)
            .remove()
            .end();
        var chan = sidebar.find(".chan")
            .eq(0)
            .trigger("click");
        if (chan.length === 0) {
            sidebar.find(".empty").show();
        }
    });

    socket.on("toggle", function(data) {
        var toggle = $("#toggle-" + data.id);
        toggle.parent().after(templates.toggle({toggle: data}));
        switch (data.type) {
        case "link":
            if (options.links) {
                toggle.click();
            }
            break;

        case "image":
            if (options.thumbnails) {
                toggle.click();
            }
            break;
        }
    });

    socket.on("topic", function(data) {
        var topic = $("#chan-" + data.chan).find(".header .topic");
        topic.html(helpers_parse(data.topic));
        // .attr() is safe escape-wise but consider the capabilities of the attribute
        topic.attr("title", data.topic);
    });
    
    socket.on("users", function(data) {
        var chan = chat.find("#chan-" + data.chan);

        if (chan.hasClass("active")) {

            if (typeof data.action === 'string' && data.user) {
              if (!data.user.mode) {
                var ulist = chan.find(".names");
                var sh = chan.find(".search");
                
                if (!sh.length) {return;}
                
                var c = parseInt(sh.attr("placeholder").split(' ')[0]);
               
                if (data.action === 'remove') {
                  if (typeof data.user.name === 'string') {
                    ulist.find("[data-name="+data.user.name+"]").remove();
                  } else {
                    ulist.find("[data-name="+data.user.nick+"]").remove();
                  }
                  c = c - 1;
                } else if (data.action === 'insert') {
                  data.user.name = data.user.nick;
                  var html = templates.user_sample(data.user);

                  var added = false;
                  ulist.find('.normal').each(function(){
                    if ($(this).text().toLowerCase() > data.user.nick.toLowerCase()) {
                      $(this).before( html );
                      added = true;
                      return false;
                    }
                  });

                  if(!added) { ulist.append(html); }
                  c = c + 1;
                }

                var txtcount = '' + c + ' users';
                sh.attr("placeholder", txtcount);
                return;
              }
            }
        
            socket.emit("names", {
                target: data.chan
            });
        } else {
            chan.data("needsNamesRefresh", true);
        }
        
    });

    socket.on("names", renderChannelUsers);

    var options = $.extend({
        coloredNicks: true,
        desktopNotifications: true,
        join: false,
        links: true,
        mode: true,
        motd: true,
        bold: false,
        italic: false,
        underline: false,
        wcolor: '',
        nick: true,
        notification: true,
        notifyAllMessages: false,
        part: false,
        quit: false,
        thumbnails: true,
    }, JSON.parse(window.localStorage.getItem("settings")));

    var windows = $("#windows");

    (function SettingsScope() {
        var settings = $("#settings");

        for (var i in options) {
            if (options[i]) {
                settings.find("input[name=" + i + "]").prop("checked", true);
                if (i === 'wcolor') { // Color select
                  var wcolors = settings.find("#wcolor").find("option");
                  wcolors.each(function() {
                    if ( $(this).val() === options[i] ) {
                      $(this).attr('selected','selected');
                      return;
                    }
                  });                
               }
            }
        }

        settings.on("change", "input, select, textarea", function() {
            var self = $(this);
            var name = self.attr("name");

            if (self.attr("type") === "checkbox") {
                options[name] = self.prop("checked");
            } else {
                options[name] = self.val();
            }

            setLocalStorageItem("settings", JSON.stringify(options));
            if ([
                "join",
                "mode",
                "motd",
                "nick",
                "part",
                "quit",
                "notifyAllMessages",
            ].indexOf(name) !== -1) {
                chat.toggleClass("hide-" + name, !self.prop("checked"));
            } else if (name === "coloredNicks") {
                chat.toggleClass("colored-nicks", self.prop("checked"));
            } else if (name === "noprivateregistered") {
                socket.emit("noprivate", {
                    ckecked: this.checked,
                    type: "registered"
                });
            } else if (name === "noprivate") {
                socket.emit("noprivate", {
                    ckecked: this.checked,
                    type: "all"
                });
            } else if (name === "commonchans") {
                socket.emit("noprivate", {
                    ckecked: this.checked,
                    type: "commonchans"
                });
            }
        }).find("input")
            .trigger("change");

        $("#desktopNotifications").on("change", function() {
            if ($(this).prop("checked") && Notification.permission !== "granted") {
                Notification.requestPermission(updateDesktopNotificationStatus);
            }
        });

        // Updates the checkbox and warning in settings when the Settings page is
        // opened or when the checkbox state is changed.
        // When notifications are not supported, this is never called (because
        // checkbox state can not be changed).
        var updateDesktopNotificationStatus = function() {
            if (Notification.permission === "denied") {
                desktopNotificationsCheckbox.attr("disabled", true);
                desktopNotificationsCheckbox.attr("checked", false);
                warningBlocked.show();
            } else {
                if (Notification.permission === "default" && desktopNotificationsCheckbox.prop("checked")) {
                    desktopNotificationsCheckbox.attr("checked", false);
                }
                desktopNotificationsCheckbox.attr("disabled", false);
                warningBlocked.hide();
            }
        };

        // If browser does not support notifications, override existing settings and
        // display proper message in settings.
        var desktopNotificationsCheckbox = $("#desktopNotifications");
        var warningUnsupported = $("#warnUnsupportedDesktopNotifications");
        var warningBlocked = $("#warnBlockedDesktopNotifications");
        warningBlocked.hide();
        if (("Notification" in window)) {
            warningUnsupported.hide();
            windows.on("show", "#settings", updateDesktopNotificationStatus);
        } else {
            options.desktopNotifications = false;
            desktopNotificationsCheckbox.attr("disabled", true);
            desktopNotificationsCheckbox.attr("checked", false);
        }
    }());

    var viewport = $("#viewport");
    var sidebarSlide = slideoutMenu(viewport[0], sidebar[0]);
    var contextMenuContainer = $("#context-menu-container");
    var contextMenu = $("#context-menu");

    $("#main").on("click", function(e) {
        if ($(e.target).is(".lt")) {
            sidebarSlide.toggle(!sidebarSlide.isOpen());
        } else if (sidebarSlide.isOpen()) {
            sidebarSlide.toggle(false);
        }
    });

    viewport.on("click", ".rt", function(e) {
        var self = $(this);
        viewport.toggleClass(self.attr("class"));
        e.stopPropagation();
    });
    
    viewport.on("click", ".ri", function(e) {
        var self = $(this);
        viewport.toggleClass(self.attr("class"));
        e.stopPropagation();
    });
    
    function positionContextMenu(that, e) {
        var offset;
        var menuWidth = contextMenu.outerWidth();
        var menuHeight = contextMenu.outerHeight();

        if (that.hasClass("menu")) {
            offset = that.offset();
            offset.left -= menuWidth - that.outerWidth();
            offset.top += that.outerHeight();
            return offset;
        }

        offset = {left: e.pageX, top: e.pageY};

        if ((window.innerWidth - offset.left) < menuWidth) {
            offset.left = window.innerWidth - menuWidth;
        }

        if ((window.innerHeight - offset.top) < menuHeight) {
            offset.top = window.innerHeight - menuHeight;
        }

        return offset;
    }

    function showContextMenu(that, e) {
        var target = $(e.currentTarget);
        var output = "";

        if (target.hasClass("user")) {
            output = templates.contextmenu_item(
                {
                class: "user",
                text: target.text(),
                data: target.data("name")
                }
            );
        } else if (target.hasClass("chan")) {
            output = templates.contextmenu_item({
                class: "chan",
                text: target.data("title"),
                data: target.data("target")
            });
            output += templates.contextmenu_divider();
            output += templates.contextmenu_item({
                class: "close",
                text: target.hasClass("lobby") ? "Disconnect" : target.hasClass("channel") ? "Leave" : "Close",
                data: target.data("target"),
                locale: locale.locale
            });
        }

            output += templates.contextmenu_divider();
            output += templates.contextmenu_item({
                class: "list",
                text: "contextmenu_item_list",
                data: target.data("target"),
                locale: locale.locale
            });
            
            output += templates.contextmenu_divider();
            output += templates.contextmenu_item({
                class: "ignore",
                text: "contextmenu_item_ignore",
                data: target.data("target"),
                locale: locale.locale
            });
            
        contextMenuContainer.show();
        contextMenu
            .html(output)
            .css(positionContextMenu($(that), e));

        return false;
    }

    viewport.on("contextmenu", ".user, .network .chan", function(e) {
        return showContextMenu(this, e);
    });

    viewport.on("click", "#chat .menu", function(e) {
        e.currentTarget = $(e.currentTarget).closest(".chan")[0];
        return showContextMenu(this, e);
    });

    contextMenuContainer.on("click contextmenu", function() {
        contextMenuContainer.hide();
        return false;
    });

    function resetInputHeight(input) {
        input.style.height = input.style.minHeight;
    }

    var input = $("#input")
        .history()
        .on("input keyup", function() {
            var style = window.getComputedStyle(this);

            // Start by resetting height before computing as scrollHeight does not
            // decrease when deleting characters
            resetInputHeight(this);

            this.style.height = Math.min(
                Math.round(window.innerHeight - 100), // prevent overflow
                this.scrollHeight
                + Math.round(parseFloat(style.borderTopWidth) || 0)
                + Math.round(parseFloat(style.borderBottomWidth) || 0)
            ) + "px";

            $("#chat .chan.active .chat").trigger("msg.sticky"); // fix growing
        })
        .tab(completeNicks, {hint: false})
        .textcomplete([emojiStrategy, nicksStrategy, chanStrategy, commandStrategy], {
            dropdownClassName: "textcomplete-menu",
            placement: "top"
        }).on({
            "textComplete:show": function() {
                $(this).data("autocompleting", true);
            },
            "textComplete:hide": function() {
                $(this).data("autocompleting", false);
            }
        });

    var focus = $.noop;
    if (!("ontouchstart" in window || navigator.maxTouchPoints > 0)) {
        focus = function() {
            if (chat.find(".active").hasClass("chan")) {
                input.focus();
            }
        };

        $(window).on("focus", focus);

        chat.on("click", ".chat", function() {
            setTimeout(function() {
                var text = "";
                if (window.getSelection) {
                    text = window.getSelection().toString();
                } else if (document.selection && document.selection.type !== "Control") {
                    text = document.selection.createRange().text;
                }
                if (!text) {
                    focus();
                }
            }, 2);
        });
    }

    // Triggering click event opens the virtual keyboard on mobile
    // This can only be called from another interactive event (e.g. button click)
    var forceFocus = function() {
        input.trigger("click").focus();
    };

    $("#form").on("submit", function(e) {
        e.preventDefault();
        forceFocus();

        var text = input.val();

        if (text.length === 0) {
            return;
        }
        

        
        var char0 = text.charAt(0);
        if (( char0 !== ":") && (char0 !== "!") && (char0 !== "/")) {
            if (options.bold) {
                text = "\x02" + text + "\x02";
            }
            if (options.italic) {
                text = "\x1D" + text + "\x1D";
            }
            if (options.underline) {
                text = "\x1F" + text + "\x1F";
            }
            if (options.wcolor) {
                text = "\x03" + options.wcolor + text + "\x03";
            }
        }

        input.val("");
        resetInputHeight(input.get(0));

        socket.emit("input", {
            target: chat.data("id"),
            text: text
        });
    });

    function findCurrentNetworkChan(name) {
        name = name.toLowerCase();

        return $(".network .chan.active")
            .parent(".network")
            .find(".chan")
            .filter(function() {
                return $(this).data("title").toLowerCase() === name;
            })
            .first();
    }

    $("button#set-nick").on("click", function() {
        toggleNickEditor(true);

        // Selects existing nick in the editable text field
        var element = document.querySelector("#nick-value");
        element.focus();
        var range = document.createRange();
        range.selectNodeContents(element);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    });

    $("button#cancel-nick").on("click", cancelNick);
    $("button#submit-nick").on("click", submitNick);

    function toggleNickEditor(toggle) {
        $("#nick").toggleClass("editable", toggle);
        $("#nick-value").attr("contenteditable", toggle);
    }

    function submitNick() {
        var newNick = $("#nick-value").text().trim();

        if (newNick.length === 0) {
            cancelNick();
            return;
        }

        toggleNickEditor(false);

        socket.emit("input", {
            target: chat.data("id"),
            text: "/nick " + newNick
        });
    }

    function cancelNick() {
        setNick(sidebar.find(".chan.active").closest(".network").data("nick"));
    }

    $("#nick-value").keypress(function(e) {
        switch (e.keyCode ? e.keyCode : e.which) {
        case 13: // Enter
            // Ensures a new line is not added when pressing Enter
            e.preventDefault();
            break;
        }
    }).keyup(function(e) {
        switch (e.keyCode ? e.keyCode : e.which) {
        case 13: // Enter
            submitNick();
            break;
        case 27: // Escape
            cancelNick();
            break;
        }
    });

    chat.on("click", ".inline-channel", function() {
        var name = $(this).data("chan");
        var chan = findCurrentNetworkChan(name);

        if (chan.length) {
            chan.click();
        } else {
            socket.emit("input", {
                target: chat.data("id"),
                text: "/join " + name
            });
        }
    });

 $('#ignoreModal').on("change", '.isIgnored', function() {
    if (this.checked) {
        var host = $(this).data("target");

        removeIgnore(host) ;
        
        socket.emit("silence", {
            target: host,
            locked: true
        });
    }
});

function removeIgnore(host) {
    var ignoreds = $('#ignoreModal').find('.ignoreds');
    
    chat.find('.silence').each(function() {
      if ($( this ).data('target') === host) {
        $(this).removeClass('locked').text(' Bloquer');
      }
    }); 
    
    var i = 0;
    ignoreds.find('tr').each(function() {
      if ($( this ).data('targhost') === host) {
        $( this ).remove();
      } else {
        i++;
      }
    });
    
    if (i <= 1) {
        ignoreds.find('.empty').show();
    }
}

function isIgnored(host) {
    var ignoreds = $('#ignoreModal').find('.ignoreds').find('tr');
    var matched = false;
    
    ignoreds.each(function() {
      if ($( this ).data('targhost') === host) {
        var silences = chat.find('.silence');
        matched = true;
        return true;
      }
    });
    
    return matched;
}

   chat.on("click", ".silence", function(e) {
        e.preventDefault();
        var host = $(this).data("target");
        var nick = $(this).data("nick");
        var locked = $(this).hasClass('locked');
        
        socket.emit("silence", {
            target: host,
            locked: locked
        });

        var ignoreds = $('#ignoreModal').find('.ignoreds');
           
        if (!locked) {
          ignoreds.append(templates.ignore_list({host: host, nick: nick, locale:locale})); 
          $(this).addClass('locked').text(' Débloquer');
          ignoreds.find('.empty').hide();
        } else {
            removeIgnore(host);
        }
    });
    
    chat.on("click", ".user", function() {
        var name = $(this).data("name");
        var chan = findCurrentNetworkChan(name);

        if (chan.length) {
            chan.click();
        }

        socket.emit("input", {
            target: chat.data("id"),
            text: "/whois " + name
        });
    });
    
    sidebar.on("click", ".chan, button", function() {
        var self = $(this);
        var target = self.data("target");
        if (!target || target === "#myModal") {
            return;
        }
        
        chat.data(
            "id",
            self.data("id")
        );
        socket.emit(
            "open",
            self.data("id")
        );

        sidebar.find(".active").removeClass("active");
        self.addClass("active")
            .find(".badge")
            .removeClass("highlight")
            .empty();

        if (sidebar.find(".highlight").length === 0) {
            toggleNotificationMarkers(false);
        }

        sidebarSlide.toggle(false);

        var lastActive = $("#windows > .active");

        lastActive
            .removeClass("active")
            .find(".chat")
            .unsticky();

        var lastActiveChan = lastActive
            .find(".chan.active")
            .removeClass("active");

        lastActiveChan
            .find(".unread-marker")
            .appendTo(lastActiveChan.find(".messages"));

        var chan = $(target)
            .addClass("active")
            .trigger("show");

        var title = "Discutea IRC client";
        if (chan.data("title")) {
            title = chan.data("title") + " — " + title;
        }
        document.title = title;

        var placeholder = "";
        if (chan.data("type") === "channel" || chan.data("type") === "query") {
            if (locale && typeof locale.locale === 'string' && locale.locale === 'fr') {
                if (chan.data("type") === "query") {
                    placeholder = `Écrire à ${chan.data("title")}`;
                } else {
                    placeholder = `Écrire sur ${chan.data("title")}`;
                }
            } else if (locale && typeof locale.locale === 'string' && locale === 'es') {
                placeholder = `Escribir a ${chan.data("title")}`;
            } else {
                placeholder = `Write to ${chan.data("title")}`;
            }
        }
        input.attr("placeholder", placeholder);

        if (self.hasClass("chan")) {
            $("#chat-container").addClass("active");
            setNick(self.closest(".network").data("nick"));
        }

        var chanChat = chan.find(".chat");
        if (chanChat.length > 0) {
            chanChat.sticky();
        }

        if (chan.data("needsNamesRefresh") === true) {
            chan.data("needsNamesRefresh", false);
            socket.emit("names", {target: self.data("id")});
        }

        focus();
    });

    sidebar.on("click", ".close", function() {
        var cmd = "/close";
        var chan = $(this).closest(".chan");
        if (chan.hasClass("lobby")) {
            cmd = "/quit";
            var server = chan.find(".name").html();
            if (!confirm("Disconnect from " + server + "?")) {
                return false;
          
          }
        }
        socket.emit("input", {
            target: chan.data("id"),
            text: cmd
        });
        chan.css({
            transition: "none",
            opacity: 0.4
        });
        return false;
    });
    
    contextMenu.on("click", ".context-menu-item", function() {
        switch ($(this).data("action")) {
        case "ignore":
            $('#ignoreModal').modal('show'); 
            break;
        case "close":
            $(".networks .chan[data-target='" + $(this).data("data") + "'] .close").click();
            break;
        case "chan":
            $(".networks .chan[data-target='" + $(this).data("data") + "']").click();
            break;
        case "user":
            $(".channel.active .users .user[data-name='" + $(this).data("data") + "']").click();
            break;
        case "list":
            socket.emit("input", {
                target: chat.data("id"),
                text: '/list'
            });
            break;
        }
    });
    
    chat.on("input", ".search", function() {
        var value = $(this).val().toLowerCase();
        var names = $(this).closest(".users").find(".names");
        names.find(".user").each(function() {
            var btn = $(this);
            var name = btn.text().toLowerCase().replace(/[+%@~]/, "");
            if (name.indexOf(value) > -1) {
                btn.show();
            } else {
                btn.hide();
            }
        });
    });

    chat.on("msg", ".messages", function(e, target, msg) {
        var unread = msg.unread;
        msg = msg.msg;

        if (msg.self) {
            return;
        }

        var button = sidebar.find(".chan[data-target='" + target + "']");
        if (msg.highlight || (options.notifyAllMessages && msg.type === "message")) {
            if (!document.hasFocus() || !$(target).hasClass("active")) {
                if (options.notification) {
                    try {
                        pop.play();
                    } catch (exception) {
                        // On mobile, sounds can not be played without user interaction.
                    }
                }
                toggleNotificationMarkers(true);

                if (options.desktopNotifications && Notification.permission === "granted") {
                    var title;
                    var body;

                    if (msg.type === "invite") {
                        title = "New channel invite:";
                        body = msg.from + " invited you to " + msg.channel;
                    } else {
                        title = msg.from;
                        if (!button.hasClass("query")) {
                            title += " (" + button.data("title").trim() + ")";
                        }
                        if (msg.type === "message") {
                            title += " says:";
                        }
                        body = msg.text.replace(/\x03(?:[0-9]{1,2}(?:,[0-9]{1,2})?)?|[\x00-\x1F]|\x7F/g, "").trim();
                    }

                    try {
                        var notify = new Notification(title, {
                            body: body,
                            icon: "img/logo-64.png",
                            tag: target
                        });
                        notify.addEventListener("click", function() {
                            window.focus();
                            button.click();
                            this.close();
                        });
                    } catch (exception) {
                        // `new Notification(...)` is not supported and should be silenced.
                    }

                }
            }
        }

        if (button.hasClass("active")) {
            return;
        }

        if (!unread) {
            return;
        }

        var badge = button.find(".badge").html(helpers_roundBadgeNumber(unread));

        if (msg.highlight) {
            badge.addClass("highlight");
        }
    });

    chat.on("click", ".toggle-button", function() {
        var self = $(this);
        var localChat = self.closest(".chat");
        var bottom = localChat.isScrollBottom();
        var content = self.parent().next(".toggle-content");
        if (bottom && !content.hasClass("show")) {
            var img = content.find("img");
            if (img.length !== 0 && !img.width()) {
                img.on("load", function() {
                    localChat.scrollBottom();
                });
            }
        }
        content.toggleClass("show");
        if (bottom) {
            localChat.scrollBottom();
        }
    });

    /* discutea username */
    function getusn() {
    
        if (window.localStorage.getItem("usn")) {
            return window.localStorage.getItem("usn");
        }
    
        var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",
            randomstring = '',
            i,
            rnum;
        for (i = 0; i < 9; i++) {
            rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum, rnum + 1);
        }
    
        return randomstring;
    }

    var usn = getusn();
    window.localStorage.setItem('usn', usn);
    $(".dusname").val( usn );

    function getreso() {
        return window.screen.availWidth + 'x' + window.screen.height + 'x' + window.screen.colorDepth;
    }
    var isTouchDevice = 'ontouchstart' in document.documentElement;
    
    $(".dresol").val( isTouchDevice + " " +getreso() );
    
    /* End of discutea username */


    var forms = $("#connect");
    
    /* Form memorisation */
    if ( window.localStorage.getItem("nickname") ) {
        $("input[name='nick']", forms).val( window.localStorage.getItem("nickname") );
    }
    if ( window.localStorage.getItem("age") ) {
        $("input[name='age']", forms).val( window.localStorage.getItem("age") );
    }
    if ( window.localStorage.getItem("sexe") ) {
        var sex = window.localStorage.getItem("sexe");
        $("input[name='gender'][value='" + sex + "']", forms).attr('checked', 'checked');
    }
        
    $("input[name='nick']", forms).blur(function(){
        setLocalStorageItem("nickname", $(this).val());
    }); 
    $("input[name='age']", forms).blur(function(){
        setLocalStorageItem("age", $(this).val());
    });
    $("input[name='gender']", forms).change(function(){
        setLocalStorageItem("sexe", $(this).val());
    });
    /* END OF Form memorisation */
    
    forms.on("submit", "form", function(e) {
        e.preventDefault();
        var event = "auth";
        var form = $(this);
        form.find(".btn")
            .attr("disabled", true)
            .end();
        if (form.closest(".window").attr("id") === "connect") {
            event = "conn";
        } 
        
        var values = {};
        $.each(form.serializeArray(), function(i, obj) {
            if (obj.value !== "") {
                values[obj.name] = obj.value;
            }
        });
        if (values.user) {
            setLocalStorageItem("user", values.user);
        }
        socket.emit(
            event, values
        );
    });

    forms.on("input", ".nick", function() {
        var nick = $(this).val();
    });

    Mousetrap.bind([
        "escape"
    ], function() {
        contextMenuContainer.hide();
    });

    function completeNicks(word) {
        var users = chat.find(".active").find(".users");
        var words = users.data("nicks");

        return $.grep(
            words,
            function(w) {
                return !w.toLowerCase().indexOf(word.toLowerCase());
            }
        );
    }

    function completeCommands(word) {
        var words = commands.slice();

        return $.grep(
            words,
            function(w) {
                return !w.toLowerCase().indexOf(word.toLowerCase());
            }
        );
    }

    function completeChans(word) {
        var words = [];

        sidebar.find(".chan")
            .each(function() {
                var self = $(this);
                if (!self.hasClass("lobby")) {
                    words.push(self.data("title"));
                }
            });

        return $.grep(
            words,
            function(w) {
                return !w.toLowerCase().indexOf(word.toLowerCase());
            }
        );
    }

    function sortable() {
        sidebar.find(".networks").sortable({
            axis: "y",
            containment: "parent",
            cursor: "move",
            distance: 12,
            items: ".network",
            handle: ".lobby",
            placeholder: "network-placeholder",
            forcePlaceholderSize: true,
            tolerance: "pointer", // Use the pointer to figure out where the network is in the list

            update: function() {
                var order = [];
                sidebar.find(".network").each(function() {
                    var id = $(this).data("id");
                    order.push(id);
                });
                socket.emit(
                    "sort", {
                        type: "networks",
                        order: order
                    }
                );

                ignoreSortSync = true;
            }
        });
        sidebar.find(".network").sortable({
            axis: "y",
            containment: "parent",
            cursor: "move",
            distance: 12,
            items: ".chan:not(.lobby)",
            placeholder: "chan-placeholder",
            forcePlaceholderSize: true,
            tolerance: "pointer", // Use the pointer to figure out where the channel is in the list

            update: function(e, ui) {
                var order = [];
                var network = ui.item.parent();
                network.find(".chan").each(function() {
                    var id = $(this).data("id");
                    order.push(id);
                });
                socket.emit(
                    "sort", {
                        type: "channels",
                        target: network.data("id"),
                        order: order
                    }
                );

                ignoreSortSync = true;
            }
        });
    }

    socket.on("i_registered", function() {
        $("#chat-container").find('#loader-wrapper').remove();
    });
    
    socket.on("sync_sort", function(data) {
        // Syncs the order of channels or networks when they are reordered
        if (ignoreSortSync) {
            ignoreSortSync = false;
            return; // Ignore syncing because we 'caused' it
        }

        var type = data.type;
        var order = data.order;

        if (type === "networks") {
            var container = $(".networks");

            $.each(order, function(index, value) {
                var position = $(container.children()[index]);

                if (position.data("id") === value) { // Network in correct place
                    return true; // No point in continuing
                }

                var network = container.find("#network-" + value);

                $(network).insertBefore(position);
            });
        } else if (type === "channels") {
            var network = $("#network-" + data.target);

            $.each(order, function(index, value) {
                if (index === 0) { // Shouldn't attempt to move lobby
                    return true; // same as `continue` -> skip to next item
                }

                var position = $(network.children()[index]); // Target channel at position

                if (position.data("id") === value) { // Channel in correct place
                    return true; // No point in continuing
                }

                var channel = network.find(".chan[data-id=" + value + "]"); // Channel at position

                $(channel).insertBefore(position);
            });
        }
    });

    function setNick(nick) {
        // Closes the nick editor when canceling, changing channel, or when a nick
        // is set in a different tab / browser / device.
        toggleNickEditor(false);

        $("#nick-value").text(nick);
    }

    function move(array, old_index, new_index) {
        if (new_index >= array.length) {
            var k = new_index - array.length;
            while ((k--) + 1) {
                this.push(undefined);
            }
        }
        array.splice(new_index, 0, array.splice(old_index, 1)[0]);
        return array;
    }

    function toggleNotificationMarkers(newState) {
        // Toggles the favicon to red when there are unread notifications
        if (favicon.data("toggled") !== newState) {
            var old = favicon.attr("href");
            favicon.attr("href", favicon.data("other"));
            favicon.data("other", old);
            favicon.data("toggled", newState);
        }

        // Toggles a dot on the menu icon when there are unread notifications
        $("#viewport .lt").toggleClass("notified", newState);
    }

    function $_GET(param) {
      var vars = {};
      window.location.href.replace( location.hash, '' ).replace( 
        /[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
        function( m, key, value ) { // callback
          vars[key] = value !== undefined ? value : '';
        }
      );

      if ( param ) {
        return vars[param] ? vars[param] : null;    
      }
      return vars;
    }

    document.addEventListener(
        "visibilitychange",
        function() {
            if (sidebar.find(".highlight").length === 0) {
                toggleNotificationMarkers(false);
            }
        }
    );

    // Only start opening socket.io connection after all events have been registered
    socket.open();
    
    if ($_GET('channel')) {
        $("input[name='channel']", forms).val( $_GET('channel') );
    }
    
    /* autoconnect */
    if ($_GET('nick') && $_GET('age') && $_GET('gender')) {
        $("input[name='nick']", forms).val( $_GET('nick') );
        $("input[name='age']", forms).val( $_GET('age') );
        $("input[name='gender'][value='" + $_GET('gender') + "']", forms).attr('checked', 'checked');
        forms.find(".btn").click();
    }

    socket.on("reception_of_notice", function(data) {
      var n = noty({
        text: '<strong>Notice de ' + data.nick + '</strong><br />' + data.message,
      });        
    });
    socket.on("important_message", function(msg) {
      var n = noty({
        layout: 'center',
        type: 'error',
        text: '<strong>Admin Discutea</strong><br />' + msg,
      });        
    });
    
    socket.on("nick_is_registered", function() {
        $('#nickservModal').modal('show');         
    });
    socket.on("nick_is_identified", function() {
        $('#nickservModal').modal('hide'); 
    });

    $("#nickserv").on("submit", function(e) {
        e.preventDefault();
        var pass = $("#passnickserv").val();
        socket.emit("send_identify", {passwd: pass});
    });
    
    $(".setting-link").on("click", function() {
      var title = $(this).attr("aria-label");
      $("#myModal .modal-title").text(title);
    });
    
  $.noty.defaults = {
    layout: 'topRight',
    theme: 'relax',
    type: 'information',
  text: '', // [string|html] can be HTML or STRING

  dismissQueue: true, // [boolean] If you want to use queue feature set this true
  force: false, // [boolean] adds notification to the beginning of queue when set to true
  maxVisible: 5, // [integer] you can set max visible notification count for dismissQueue true option,
  template: '<div class="noty_message"><span class="noty_text"></span><div class="noty_close"></div></div>',
  timeout: false, // [integer|boolean] delay for closing event in milliseconds. Set false for sticky notifications
  progressBar: false, // [boolean] - displays a progress bar
  animation: {
    open: {height: 'toggle'}, // or Animate.css class names like: 'animated bounceInLeft'
    close: {height: 'toggle'}, // or Animate.css class names like: 'animated bounceOutLeft'
    easing: 'swing',
    speed: 500 // opening & closing animation speed
  },
  closeWith: ['click'], // ['click', 'button', 'hover', 'backdrop'] // backdrop click will close all notifications

  modal: false, // [boolean] if true adds an overlay
  killer: false, // [boolean] if true closes all notifications and shows itself

  callback: {
    onShow: function() {},
    afterShow: function() {},
    onClose: function() {},
    afterClose: function() {},
    onCloseClick: function() {},
  },

  buttons: false // [boolean|array] an array of buttons, for creating confirmation dialogs.
};

    $('#input').textcomplete([{
        match: /(^|\b)(\w{2,})$/,
        search: function(term, callback) {
          callback(completeNicks(term));
        },
        replace: function (word) {
          return word + ' ';
        }
    }]); 
});
