var THROTTLES = {};
var $ = require('jquery-deferred');
module.exports = {
    on : function(id, max, resetTime) {
        var done = $.Deferred();
        var t = THROTTLES[id] = THROTTLES[id] || {
            count : 0
        };
        
        if (!max)  max = 10;
        if (!resetTime)  resetTime = 5000;
        
        if (t.count === 0) {
            setTimeout(function() {
                if(THROTTLES[id].warn === undefined){
                    delete THROTTLES[id];
                } else {
                    THROTTLES[id].count = 0;
                }
            }, resetTime);
        }
         
        if (++t.count > max) {
            if(THROTTLES[id].warn >= 3){
                done.reject();
            } else {
                done.resolve(false).promise();
            }
        } else {
            done.resolve(true).promise();
        }
        return done.promise();
    }, warn : function(id){
        THROTTLES[id].warn = ++THROTTLES[id].warn || 1;
        setTimeout(function() {
            --THROTTLES[id].warn;
            if(THROTTLES[id].warn === 0){
                delete THROTTLES[id].warn;
            }
        }, 1800000);   
    }
};