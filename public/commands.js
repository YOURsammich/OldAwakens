var COMMANDS = {
    color : {
        params : ['color'],
        handler : function (params) {
            if (params.color === 'none') {
                Attributes.remove('color');
            } else {
                Attributes.set('color', params.color.replace(/#/g,''));
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
                Attributes.set('bgcolor', params.color.replace(/#/g,''));
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
                Attributes.set('glow', params.color.replace(/#/g,''));
                menuControl.updateValues();
            }
        }
    },
    style : {
        params : ['style'],
        handler : function (params) {
            if (params.style === 'none') {
                Attributes.remove('style');
            } else {
                Attributes.set('style', params.style, true);
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
                Attributes.set('flair', params.flair);
            }
        }
    },
    font : {
        params : ['font'],
        handler : function (params) {
            if (params.color === 'none') {
                Attributes.remove('font');
            } else {
                Attributes.set('font', params.font);
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
                nick : Attributes.get('nick'),
                flair : Attributes.get('flair')
            });
        }
    },
    r : {
        params : ['message'],
        handler: function (params) {
            var lastPm = Attributes.get('lastpm');
            if (lastPm) {
                handleInput('/pm ' + lastPm + '|' + params.message);
            }
        }
    },
    mute : {
        handler : function () {
            Attributes.set('mute', 'true', true);
        }
    },
    unmute : {
        handler : function () {
            Attributes.remove('mute', '');
        }
    },
    clear : {
        handler : function () {
            var messages = document.getElementsByClassName('message'),
                parent = document.getElementById('messages');
            while (messages.length) {
                parent.removeChild(messages[0]);
            }
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
                themecolors : [params.inputColor, params.buttonColor, params.scrollBarColor]
            });
        }
    },
    background : {
        params : ['background'],
        handler : function (params) {
            socket.emit('channelStatus', {
                background : params.background
            });
        }
    },
    unlock : {
        handler : function () {
            socket.emit('channelStatus', {
                lock : false
            });
        }
    },
    lockdown : {
        handler : function () {
            socket.emit('channelStatus', {
                lock : true
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
    },
    banlist : {}
};
COMMANDS.colour = COMMANDS.color;
COMMANDS.cls = COMMANDS.clear;