"use strict";

var LocalStorage = require('node-localstorage').LocalStorage,
storage = new LocalStorage('./scratch');

var Username = {
	setUsername: setUsername,
};

module.exports = Username;

function setUsername() {
    var uuid = storage.getItem('username');
    
    if (uuid) {
        return uuid;
    }
    
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",
        randomstring = '',
        i,
        rnum;
    for (i = 0; i < 9; i++) {
        rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
    }
    
    storage.setItem('username', randomstring);
    
    return randomstring;
}
