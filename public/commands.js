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
            messageBuilder.showMessage({
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
            console.log(attData);
            if (attData) {
                
                if (attData.value !== undefined) {
                    formatTime = new Date();
                    formatTime.setTime(attData.date);
                    messageBuilder.showMessage({
                        message : params.attribute + ' was set to "' + attData.value + '" by "' + attData.updatedBy + '" ' + timeSince(formatTime.getTime()) + ' ago',
                        messageType : 'info'
                    });
                } else {
                    messageBuilder.showMessage({
                        message : params.attribute + ': ' + attData,
                        messageType : 'info'
                    });
                }
                
            } else {
                messageBuilder.showMessage({
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
                        messageBuilder.showMessage({
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
            messageBuilder.showMessage({
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
            Attributes.set('toggle-mute', true);
        }
    },
    unmute : {
        handler : function () {
            Attributes.set('toggle-mute', false);
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
                attr = params.attr,
                attValue = Attributes.get('toggle-' + attr);
            
            if (validAtts.indexOf(attr) !== -1) {
                
                if (attr === 'cursors') {
                    socket.emit('removeCursor');
                    COMMANDS.clearcursors.handler();
                } else if (attr === 'background') {
                    if (attValue) {
                        document.getElementById('messages-background').style.background = Attributes.get('background').value;
                    } else {
                        document.getElementById('messages-background').style.background = 'black';
                    }      
                } else if (attr === 'msg') {
                    if (attValue) {
                        document.getElementById('center-text').style.display = 'table-cell';
                    } else {
                        document.getElementById('center-text').style.display = 'none';
                    }     
                }
                
                Attributes.set('toggle-' + attr, !attValue);
            } else {
                messageBuilder.showMessage({
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
    block : {
        params : ['nick'],
        handler : function (params) {
            var blockedUsers = Attributes.get('block');
            if (!blockedUsers) {
                blockedUsers = [];
            } else {
                blockedUsers = blockedUsers.split(',');
            }
            
            blockedUsers.push(params.nick);
            Attributes.set('block', blockedUsers.join(','));
            messageBuilder.showMessage({
                message : params.nick + ' is now blocked',
                messageType : 'info'
            });
        }
    },
    unblock : {
        params : ['nick'],
        handler : function (params) {
            var blockedUsers = Attributes.get('block'),
                index;
            
            if (!blockedUsers) {
                blockedUsers = [];
            } else {
                blockedUsers = blockedUsers.split(',');
            }
            
            index = blockedUsers.indexOf(params.nick);
            if (index !== -1) {
                blockedUsers.splice(index, 1);
                Attributes.set('block', blockedUsers.join(','));
                messageBuilder.showMessage({
                    message : params.nick + ' is now unblocked',
                    messageType : 'info'
                });
            } else {
                messageBuilder.showMessage({
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
        role : 2,
        params : ['nick|reason']
    },
    ban : {
        role : 1,
        params : ['nick|reason']
    },
    bannick : {
        role : 1,
        params : ['nick|reason']  
    },
    banip : {
        role : 1,
        params : ['ip|reason']  
    },
    unban : {
        role : 1,
        params : ['nick']  
    },
    whitelist : {
        role : 1,
        params : ['nick']
    },
    unwhitelist : {
        role : 1,
        params : ['nick']
    },
    delete : {
        role : 0,
        params : ['nick']
    },
    global : {
        role : 0,
        params : ['message']
    },
    find : {
        role : 0,
        params : ['ip']
    },
    refresh : {
        role : 0
    },
    access : {
        role : 1,
        params : ['nick', 'role']
    },
    pm : {
        params : ['nick|message']
    },
    banlist : {},
    give_hat : {
        role : 0,
        params : ['nick', 'hat']
    },
    remove_hat : {
        role : 0,
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
    away : {},
    snooze : {},
    cursors : {},
    hats : {},
    part : {
        params : ['part']
    },
    claimchannel : {},
    giveupchannel : {},
    lockcommand : {
        role : 1,
        params : ['command', 'role']
    },
    topic : {
        role : 3,
        params : ['topic']
    },
    note : {
        role : 1,
        params : ['note']
    },
    theme : {
        role : 1,
        params : ['inputColor', 'buttonColor', 'scrollBarColor']
    },
    background : {
        role : 2,
        params : ['background']
    },
    msg : {
        role : 4,
        params : ['msg']
    },
    unlock : {
        role : 1
    },
    lockdown : {
        role : 1
    },
    blockproxy : {
        role : 1
    },
    unblockproxy : {
        role : 1
    }
};
COMMANDS.colour = COMMANDS.color;
COMMANDS.cls = COMMANDS.clear;
COMMANDS.bg = COMMANDS.background;
COMMANDS.snz = COMMANDS.snooze;

(function(){
    var keys = Object.keys(COMMANDS),
        i,
        newSet = {};
    
    for (i = 0; i < keys.length; i++) {
        if (COMMANDS[keys[i]].role) {
            newSet[keys[i]] = COMMANDS[keys[i]].role
        }
    }
    
    menuControl.commandUI(newSet);
    
    parser.addFont(Attributes.get('font'));
    parser.changeInput('font', Attributes.get('font'));
    parser.changeInput('color', Attributes.get('color'));
    if(!Attributes.get('font')) {
        clientSubmit.command.send('font', {font:'Droid Sans'});
    }
    
})();