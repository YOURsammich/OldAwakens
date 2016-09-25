var COMMANDS = {
    
    color : {
        params : ['color'],
        handler : function (params) {
            if (params.color === 'none') {
                Attributes.remove('color');
            } else {
                Attributes.set('color', params.color.replace(/#/g,''), true);
                menuControl.updateValues();
            }
        }
    },
    bgcolor : {
        params : ['color'],
        handler : function (params) {
            if (params.color === 'none') {
                Attributes.remove('bgcolor');
            } else {
                Attributes.set('bgcolor', params.color.replace(/#/g,''), true);
                menuControl.updateValues();
            }
        }
    },
    glow : {
        params : ['color'],
        handler : function (params) {
            if (params.color === 'none') {
                Attributes.remove('glow');
            } else {
                Attributes.set('glow', params.color.replace(/#/g,''), true);
                menuControl.updateValues();
            }
        }
    },
    flair : {
        params : ['flair'],
        handler : function (params) {
            if (params.color === 'none') {
                Attributes.remove('flair');
            } else {
                Attributes.set('flair', params.flair, true);
            }
        }
    },
    get : {
        params : ['attribute'],
        handler : function (params) {
            var value = Attributes.get(params.attribute);
            if (value) {
                showMessage({
                    message : params.attribute + ' is is currently set to: ' + value,
                    messageType : 'info'
                });
            } else {
                showMessage({
                    message : params.attribute + ' isn\'t set',
                    messageType : 'info'
                });
            }
        }
    },
    whoami : {
        handler : function () {
            sendCommand('whois', {
                nick : Attributes.get('nick') 
            });
        }
    },
    register : {
        handler : createRegisterPanel  
    },
    //server side commands
    nick : {
        params : ['nick']
    },
    login : {
        params : ['nick', 'password']
    },
    topic : {
        params : ['topic']
    },
    note : {
        params : ['note']
    },
    background : {
        params : ['background']
    },
    me : {
        params : ['message']
    },
    whois : {
        params : ['nick']
    },
    change_password : {
        params : ['oldpassword', 'newpassword']
    },
    ban : {
        params : ['nick|reason']
    },
    unban : {
        params : ['nick']  
    },
    lockdown : {},
    whitelist : {
        params : ['nick']
    },
    unwhitelist : {
        params : ['nick']
    }
    
};
