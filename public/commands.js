var COMMANDS = {
    help : {
        handler : function () {
        var container = document.createElement('div'),
            cancel,
            holder,
            iframe;
            

            container.style.cssText = 'left:' + window.innerWidth/2 + 'px;top:' + window.innerHeight/2 + 'px;margin-left:-150px;margin-top:-80px;width:500px;height:200px;padding:20px;position:fixed;z-index:99;background-color:#222;cursor:crosshair;';

            cancel = document.createElement('div');
            cancel.style.cssText = 'position:absolute;top:0px;right:10px;color:white;cursor:pointer;'
            cancel.textContent = 'x';
            cancel.addEventListener('click', function () {
                document.getElementById('messages').removeChild(container);
            });

            holder = document.createElement('div');
            holder.style.width = '100%';
            holder.style.height = '100%';

            iframe = document.createElement('iframe');
            iframe.height = '100%';
            iframe.width = '100%';
            iframe.src = window.location.origin + '/help/';

            container.appendChild(cancel);
            container.appendChild(holder);
            holder.appendChild(iframe);
            $$$.draggable(container);
            document.getElementById('messages').appendChild(container);
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
            } else {
                Attributes.set('color', params.color.replace(/#/g,''));
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
                        socket.emit('register', userName.value, password.value);
                    }
                }
            });
        }  
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
            Attributes.set('mute', 'true', true);
        }
    },
    unmute : {
        handler : function () {
            Attributes.set('mute', 'false', true);
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
    toggle : {
        params : ['attr'],
        handler : function (params) {
            var validAtts = ['background', 'images', '12h', 'filters'],
                attValue = Attributes.get('toggle-' + params.attr);
            
            if (validAtts.indexOf(params.attr) !== -1) {
                Attributes.set('toggle-' + params.attr, !attValue, true);
                
                if (params.attr === 'background') {
                    if (!attValue) {
                        document.getElementById('messages').style.background = Attributes.get('background');
                    } else {
                        document.getElementById('messages').style.background = 'black';
                    }   
                }
            } else {
                showMessage({
                    message : 'Not a toggleable attribute'
                });
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
    hat : {
        params : ['hat']
    },
    afk : {
        params : ['message']
    }
};
COMMANDS.colour = COMMANDS.color;
COMMANDS.cls = COMMANDS.clear;
COMMANDS.bg = COMMANDS.background;