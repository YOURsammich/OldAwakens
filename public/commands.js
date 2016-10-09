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
    code : {
        params : ['code'],
        handler : function (params) {
            socket.emit('requestJoin', {
                captcha : params.code,
                nick : Attributes.get('nick'),
                token : Attributes.get('token')
            });
        }  
    },
    echo : {
        params : ['message'],
        handler : function (params) {
            showMessage({
                message : decorateText(params.message),
                nick : Attributes.get('nick')
            });
        }
    },
    captchaon : {
        handler : function () {
            socket.emit('channelStatus', {
                captcha : true
            });
        }
    },
    captchaoff : {
        handler : function () {
            socket.emit('channelStatus', {
                captcha : false
            });
        }
    },
    topic : {
        params : ['topic'],
        handler : function (params) {
            socket.emit('channelStatus', {
                topic : params.topic
            });
        }
    },
    note : {
        params : ['note'],
        handler : function (params) {
            socket.emit('channelStatus', {
                note : params.note
            });
        }
    },
    theme : {
        params : ['inputColor', 'buttonColor', 'scrollBarColor'],
        handler : function (params) {
            socket.emit('channelStatus', {
                topic : [params.inputColor, params.buttonColor, params.scrollBarColor]
            });
        }
    },
    //server side commands
    nick : {
        params : ['nick']
    },
    login : {
        params : ['nick', 'password']
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
    kick : {
        params : ['nick|reason']
    },
    ban : {
        params : ['nick|reason']
    },
    unban : {
        params : ['nick']  
    },
    unlock : {},
    lockdown : {},
    whitelist : {
        params : ['nick']
    },
    unwhitelist : {
        params : ['nick']
    },
    delete : {
        params : ['nick']
    },
    global : {
        params : ['message']
    },
    find : {
        params : ['ip']
    },
    refresh : {},
    access : {
        params : ['nick', 'role']
    },
    pm : {
        params : ['nick|message']
    }
};
