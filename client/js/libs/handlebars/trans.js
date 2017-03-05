module.exports = function(key, locale) {
    var accepteds = ["en", "fr"];
    
    if ((typeof key !== 'string') || (typeof locale !== 'string')) {
        return;
    }
    
    if (locale.length > 2) {
        locale = locale.substring(0,1);
    }

    locale = locale.toLowerCase();

    if (accepteds.indexOf(locale) === -1) {
        locale = 'en';
    }

    var translations = require('../../../translations/messages_' + locale + '.js');

    if (translations[key]) {
        return translations[key]
    }

    return key;
};
