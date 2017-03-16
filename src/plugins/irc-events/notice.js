"use strict";

module.exports = function(irc, network) {
    var client = this;

    irc.on("notice", function(data) {
      if (typeof data.hostname !== 'string') {
        return;
      }
      
      if ( data.hostname === 'services.discutea.com' || data.hostname.match(/^irc\./) ) {
        return;
      }

      if (data.nick === 'Moderator') {
        var msg = data.message.split(' ');
        if (msg[0] === "Important:") {
           data.message = data.message.replace("Important: ", "");
           client.emit("important_message", removeStyle(data.message));
        }
        return;
      }

      if (data.target && typeof data.target === "string") {
        data.message = removeStyle(data.message);
        client.emit("reception_of_notice", data);
      }
    });
    
    irc.on("wallops", function(data) {
        client.emit("important_message", removeStyle(data.message));
    });
    
    function removeStyle(txt) {
        txt = txt.replace(/\x03[0-9]{1,2}(,[0-9]{1,2}){0,1}/gi, "")
                 .replace(/(\x1F|\x1D|\x02)/gi, "")
                 .replace(/[\x00-\x1F]/g, '');
                 
        return txt;
    }
};
