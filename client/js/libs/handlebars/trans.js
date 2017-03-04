module.exports = function(key, locale) {
    if ((typeof key !== 'string') || (typeof locale !== 'string')) {
        return;
    }
    
    if (locale.length > 2) {
        locale = locale.substring(0,1);
    }
    
    locale = locale.toLowerCase();

    if ( (locale !== 'en') || (locale !== 'fr') ) {
        locale = 'en';
    }

    var translations = require('../../../translations/messages_' + locale + '.js');

    if (translations[key]) {
        return translations[key]
    }

    return key;
};
