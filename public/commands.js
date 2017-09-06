var COMMANDS = {
    help : {
        handler : function () {
            embed('embed', '/help/')
        }  
    },
    commands :  {
            handler : function () {
            var keys = Object.keys(COMMANDS);
            var ava = [];
            keys.forEach(function(key){
                if(Attributes.get('role') <= COMMANDS[key].role || COMMANDS[key].role === undefined){
                    ava.push(key);
                }
            });
            showMessage({
                message : 'Available Commands: /' + ava.join(', /'),
                messageType : 'info'
            });
        }
    },
    color : {
        params : ['color'],
        handler : function (params) {
            if (params.color === 'none') {
                Attributes.remove('color');
                parser.changeInput('color', 'white');
            } else {
                Attributes.set('color', params.color.replace(/#/g,''));
                parser.changeInput('color', params.color);
            }
            menuControl.updateValues();
        }
    },
    bgcolor : {
        params : ['color'],
        handler : function (params) {
            if (params.color === 'none') {
                Attributes.remove('bgcolor');
            } else {
                Attributes.set('bgcolor', params.color.replace(/#/g,''));
            }
            menuControl.updateValues();
        }
    },
    glow : {
        params : ['color'],
        handler : function (params) {
            if (params.color === 'none') {
                Attributes.remove('glow');
            } else {
                Attributes.set('glow', params.color.replace(/#/g,''));
            }
            menuControl.updateValues();
        }
    },
    style : {
        params : ['style'],
        handler : function (params) {
            if (params.style === 'none') {
                Attributes.remove('style');
            } else {
                Attributes.set('style', params.style, true);
            }
        }
    },
    flair : {
        params : ['flair'],
        handler : function (params) {
            if (params.flair === 'none') {
                Attributes.remove('flair');
            } else {
                Attributes.set('flair', params.flair);
                socket.emit('command', 'flair', {//save flair on server
                    flair : params.flair
                });
            }
        }
    },
    font : {
        params : ['font'],
        handler : function (params) {
            if (params.font === 'none') {
                Attributes.remove('font');
                parser.changeInput('font', 'Droid Sans');
            } else {
                Attributes.set('font', params.font);
                parser.changeInput('font', params.font);
            }
        }
    },
    get : {
        params : ['attribute'],
        handler : function (params) {
            var attData = Attributes.get(params.attribute),
                formatTime;
            
            function timeSince(date) {
                var seconds = Math.floor((new Date() - date) / 1000);

                var interval = Math.floor(seconds / 31536000);

                if (interval > 1) {
                    return interval + " years";
                }
                interval = Math.floor(seconds / 2592000);
                if (interval > 1) {
                    return interval + " months";
                }
                interval = Math.floor(seconds / 86400);
                if (interval > 1) {
                    return interval + " days";
                }
                interval = Math.floor(seconds / 3600);
                if (interval > 1) {
                    return interval + " hours";
                }
                interval = Math.floor(seconds / 60);
                if (interval > 1) {
                    return interval + " minutes";
                }
                return Math.floor(seconds) + " seconds";
            };
            
            if (attData) {
                
                if (attData.value !== undefined) {
                    formatTime = new Date();
                    formatTime.setTime(attData.date);
                    showMessage({
                        message : params.attribute + ' was set to "' + attData.value + '" by "' + attData.updatedBy + '" ' + timeSince(formatTime.getTime()) + ' ago',
                        messageType : 'info'
                    });
                } else {
                    showMessage({
                        message : params.attribute + ': ' + attData,
                        messageType : 'info'
                    });
                }
                
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
            clientSubmit.handleInput('/whois ' + Attributes.get('nick'));
        }
    },
    register : {
        handler : function () {
        var userName = document.createElement('input'),
            password = document.createElement('input'),
            confirmPassword = document.createElement('input');
            
            userName.value = Attributes.get('nick');
            password.placeholder = 'Password';
            confirmPassword.placeholder = 'Confirm password';
            
            createPanel('register', [userName, password, confirmPassword], function () {
                if (password.value === confirmPassword.value) {
                    if (password.value.length > 4) {
                        socket.emit('command', 'register', {
                            nick : userName.value,
                            password : password.value
                        });
                    } else {
                        showMessage({
                            message : 'Please choose a password that is at least 5 characters long',
                            messageType : 'info'
                        });
                    }
                }
            });
        }  
    },
    echo : {
        params : ['message'],
        handler : function (params) {
            showMessage({
                message : clientSubmit.message.decorateText(params.message),
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
                clientSubmit.handleInput('/pm ' + lastPm + '|' + params.message);
            }
        }
    },
    mute : {
        handler : function () {
            Attributes.set('mute', true, true);
        }
    },
    unmute : {
        handler : function () {
            Attributes.set('mute', false, true);
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
    clearcursors : {
        handler : function () {
            var parent = document.getElementById('cursor-container');
            while (parent.firstChild) {
                parent.removeChild(parent.firstChild);
            }
        }
    },
    toggle : {
        params : ['attr'],
        handler : function (params) {
            var validAtts = ['background', 'images', '12h', 'filters', 'cursors', 'msg'],
                attValue = Attributes.get('toggle-' + params.attr);
            
            if (validAtts.indexOf(params.attr) !== -1) {
                Attributes.set('toggle-' + params.attr, !attValue, true);
            } else {
                showMessage({
                    message : 'Not a toggleable attribute'
                });
            }
        }
    },
    safe : {
        handler : function () {
            Attributes.set('mute', true);
            Attributes.set('toggle-images', false);
            Attributes.set('toggle-background', false);
            Attributes.set('toggle-msg', false);
        }
    },
    unsafe : {
        handler : function () {
            Attributes.set('mute', false);
            Attributes.set('toggle-images', true);
            Attributes.set('toggle-background', true);
            Attributes.set('toggle-msg', true);
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
    msg : {
        params : ['msg'],
        handler : function (params) {
            if (params.msg == 'none') {
                params.msg = ' ';
            }
            socket.emit('channelStatus', {
                msg : params.msg
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
    blockproxy : {
        handler : function () {
            socket.emit('channelStatus', {
                proxy : true
            });
        }
    },
    unblockproxy : {
        handler : function () {
            socket.emit('channelStatus', {
                proxy : false
            });
        }
    },
    block : {
        params : ['nick'],
        handler : function (params) {
            var blockedUsers = Attributes.get('blocked');
            if (!blockedUsers) {
                blockedUsers = [];
            } else {
                blockedUsers = blockedUsers.split(',');
            }
            
            blockedUsers.push(params.nick);
            Attributes.set('blocked', blockedUsers.join(','));
            showMessage({
                message : params.nick + ' is now blocked',
                messageType : 'info'
            });
        }
    },
    unblock : {
        params : ['nick'],
        handler : function (params) {
            var blockedUsers = Attributes.get('blocked'),
                index;
            
            if (!blockedUsers) {
                blockedUsers = [];
            } else {
                blockedUsers = blockedUsers.split(',');
            }
            
            index = blockedUsers.indexOf(params.nick);
            if (index !== -1) {
                blockedUsers.splice(index, 1);
                Attributes.set('blocked', blockedUsers.join(','));
                showMessage({
                    message : params.nick + ' is now unblocked',
                    messageType : 'info'
                });
            } else {
                showMessage({
                    message : params.nick + ' isn\'t now unblocked',
                    messageType : 'info'
                });
            }
        }
    },
    login : {
        params : ['nick', 'password'],
        paramsOptional : true,
        handler : function (params) {
            var nickInput,
                passwordInput;
            
            if (params.nick && params.password) {
                socket.emit('command', 'login', {
                    nick : params.nick,
                    password : params.password
                });
            } else {
                nickInput = document.createElement('input');
                passwordInput = document.createElement('input');
                nickInput.placeholder = 'Username';
                nickInput.value = params.nick || ''
                passwordInput.placeholder = 'Password';
                passwordInput.value = params.password || '';
                passwordInput.type = 'password';

                createPanel('Login', [nickInput, passwordInput], function () {
                    socket.emit('command', 'login', {
                        nick : nickInput.value,
                        password : passwordInput.value
                    });
                    document.body.removeChild(document.getElementsByClassName('LoginPanel')[0].parentNode);
                });
            }
        }
    },
    logout : {
        handler : function () {
            clientSubmit.handleInput('/nick ' + 'Ron' + Math.random());
        }  
    },
    emojis : {
        handler : function () {
            embed('embed', 'https://emojicopy.com/');
        }
    },
    myhats : {
        handler : function () {
            clientSubmit.handleInput('/hatlist ' + Attributes.get('nick'));
        }
    },
    vpm : {
        params : ['nick'],
        handler : function (params) {
            createPmPanel(ONLINE.getId(params.nick));
        }  
    },
    //server side commands
    nick : {
        params : ['nick']
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
    banip : {
        params : ['ip|reason']  
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
    banlist : {},
    give_hat : {
        params : ['nick', 'hat']
    },
    remove_hat : {
        params : ['nick', 'hat']  
    },
    hat : {
        params : ['hat']
    },
    hatlist : {
        params : ['nick']  
    },
    cursor : {
        params : ['cursor']
    },
    afk : {
        params : ['message']
    },
    cursors : {},
    hats : {},
    part : {
        params : ['part']
    }
};
COMMANDS.colour = COMMANDS.color;
COMMANDS.cls = COMMANDS.clear;
COMMANDS.bg = COMMANDS.background;

(function(){
    parser.addFont(Attributes.get('font'));
    parser.changeInput('font', Attributes.get('font'));
    parser.changeInput('color', Attributes.get('color'));
    if(!Attributes.get('font')) {
        clientSubmit.command.send('font', {font:'Droid Sans'});
    }
})();