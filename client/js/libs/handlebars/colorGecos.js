module.exports = function(str) {
    if (typeof str === 'string') {
        var gender = str.split(' ')[1];

        if (/^[mMHh]$/.test(gender)) {
            return 'gender-male';
        } else if (/^[fF]$/.test(gender)) {
            return 'gender-female';
        } else if (/^[Cc]$/.test(gender)) {
            return 'gender-couple';
        }
        
    }
    
    return 'gender-undefined';
};