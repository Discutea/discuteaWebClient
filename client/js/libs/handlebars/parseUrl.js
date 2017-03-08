module.exports = function(server) {
    if (typeof server !== 'string') {
        return;
    }

    var url = server.replace("irc.", "https://");
    
    return url;
};
