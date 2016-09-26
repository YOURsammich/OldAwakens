var socket = io.connect(window.location.pathname);

var ONLINE = {
    users : {},
    getId : function (nick) {
        var keys = Object.keys(this.users),
            i;
        for (i = 0; i < keys.length; i++) {
            if (nick === this.users[keys[i]].nick) {
                return keys[i];
            }
        }
    }
};

var Attributes = {
    set : function (attribute, value, notify) {
        if (notify && this.get(attribute) !== value && attribute !== 'token') {
            showMessage({
                message : attribute + ' is now set to ' + value,
                messageType : 'info'
            });
        }
        this.storedAttributes[attribute] = value;
        localStorage.setItem('chat-' + attribute, value);
    },
    get : function (attribute) {
        return this.storedAttributes[attribute] || '';
    },
    remove : function (attribute) {
        delete this.storedAttributes[attribute];
        localStorage.removeItem('chat-' + attribute);
    },
    storedAttributes : (function () {
        var allKeys = Object.keys(localStorage),
            allAtt = {},
            key,
            i;
        
        for (i = 0; allKeys.length > i; i++) {
            key = allKeys[i];
            if (key !== '__proto__' && key.substr(0, 4) === 'chat') {
                allAtt[key.substr(5)] = localStorage[key];
            }
        }
        
        return allAtt;
    }())
};

function scrollToBottom(el) {
    el.scrollTop = el.scrollHeight;
}

function appendMessageTo(message, el) {
    if (el === undefined) {
        el = document.getElementById('messages');
    }
    
    el.appendChild(message);
    scrollToBottom(el);
}

function buildMessage(message, messageType, nick, flair) {
    var container = document.createElement('div'),
        time = new Date(),
        timeDIV = document.createElement('div'),
        nickDIV = document.createElement('div'),
        messageDIV = document.createElement('div');
    
    if (messageType === undefined) {
        container.className = 'message';
    } else {
        container.className = 'message ' + messageType;
    }
    
    timeDIV.className = 'time';
    timeDIV.textContent = time.format('shortTime');
    container.appendChild(timeDIV);
    
    if (nick) {
        nickDIV.className = 'nick';
        
        if (flair && parser.removeHTML(parser.parse(flair)) === nick) {
            nickDIV.innerHTML = parser.parse(flair.replace(/\r?\n|\r/g, '')) + ':';
        } else {
            nickDIV.textContent = nick + ':';
        }

        container.appendChild(nickDIV);
    }
    
    messageDIV.className = 'messageContent';
    
    if (messageType === 'info') {
        messageDIV.innerHTML = parser.escape(message);
    } else if (messageType === 'captcha') {
        messageDIV.innerHTML = '<pre>' + parser.escape(message) + '</pre>';
    } else {
        while (message.split(/\n/).length > 15) {
            var index = message.lastIndexOf('\n');
            message = message.slice(0, index) + message.slice(index + 1);
        }
        messageDIV.innerHTML = parser.parse(message);
    }
    
    container.appendChild(messageDIV);
    
    return container;
}

function showMessage(messageData) {
    var messageHTML = buildMessage(messageData.message, messageData.messageType, messageData.nick, messageData.flair);
    appendMessageTo(messageHTML);
}

function sendCommand(commandName, params) {
    if (COMMANDS[commandName].handler) {
        COMMANDS[commandName].handler(params);
    } else {
        socket.emit('command', commandName, params);
    }
}

function formatParams(commandParams, givenParams) {
    var formatedParams = {},
        splitCommand,
        i;
    
    if (commandParams[0].indexOf('|') !== -1) {
        splitCommand = commandParams[0].split('|');
        
        for (i = 0; i < splitCommand.length; i++) {
            if (givenParams.split('|')[i]) {
                formatedParams[splitCommand[i]] = givenParams.split('|')[i];
            }
        }
    } else if (commandParams.length > 1) {
        splitCommand = givenParams.split(' ');
        
        for (i = 0; i < splitCommand.length; i++) {
            if (splitCommand[i]) {
                formatedParams[commandParams[i]] = splitCommand[i];   
            }
        }
    } else {
        if (givenParams) {
            formatedParams[commandParams[0]] = givenParams;
        }
    }
    
    return formatedParams;
}

function handleCommand(commandData) {
    var commandName = commandData[1],
        params = commandData[2],
        formatedParams;
    
    if (COMMANDS[commandName]) {
        if (COMMANDS[commandName].params) {
            
            formatedParams = formatParams(COMMANDS[commandName].params, params);
            
            if (COMMANDS[commandName].params.length <= Object.keys(formatedParams).length) {
                sendCommand(commandName, formatedParams);
            } else {
                showMessage({
                    message : 'Invalid: /' + commandName + ' <' + COMMANDS[commandName].params.join('> <') + '>',
                    messageType : 'error'
                });
            }
        } else {
            sendCommand(commandName);
        }
    } else {
        showMessage({
            message : 'That isn\'t a command',
            messageType : 'error'
        });
    }
}

function decorateText(text) {
    var decorativeModifiers = '',
        color = Attributes.get('color'),
        bgcolor = Attributes.get('bgcolor'),
        glow = Attributes.get('glow');
    
    if (glow) {
        decorativeModifiers = '###' + glow;
    }
    
    if (bgcolor) {
        decorativeModifiers += '##' + bgcolor;
    }
    
    if (color) {
        decorativeModifiers += '#' + color;
    }
    
    return decorativeModifiers + text;
}

function sendMessage(message) {
    socket.emit('message', decorateText(message), Attributes.get('flair'));
}

function handleInput(value) {
    var command = /^\/(\w+) ?([\s\S]*)/.exec(value);
    
    if (command) {
        handleCommand(command);
    } else {
        sendMessage(value);
    }
}

function channelTheme(channelData) {
    if (channelData.note) {
        showMessage({
            message : channelData.note,
            messageType : 'note'
        });
        Attributes.set('note', channelData.note);
    }
    
    if (channelData.topic) {
        document.title = channelData.topic;
        showMessage({
            message : channelData.topic,
            messageType : 'general'
        });
        Attributes.set('topic', channelData.topic);
    }
    
    if (channelData.background) {
        document.getElementById('messages').style.background = channelData.background;
        Attributes.set('background', channelData.background);
    }

    if (channelData.themecolors) {
        document.getElementById('input-bar').style.backgroundColor = channelData.themecolors[0];
        document.getElementsByClassName('toggle-menu')[0].style.backgroundColor = channelData.themecolors[1];
        if (navigator.userAgent.toLowerCase().indexOf('chrome') !== -1) {
            var length = document.styleSheets[0].rules.length;
            document.styleSheets[0].insertRule(".scrollbar_default::-webkit-scrollbar-thumb { border-radius: 5px; background: " + channelData.themecolors[2], length);
        }
    }
}

function createRegisterPanel() {
    var registerPanel = document.getElementsByClassName('registerPanel'),
        overlay,
        header,
        cancel,
        userName,
        password,
        confirmPassword,
        submitButton;
    
    if (registerPanel.length === 0) {
        overlay = document.createElement('div');
        overlay.className = 'overlay';
        registerPanel = document.createElement('div');
        registerPanel.className = 'registerPanel';
        cancel = document.createElement('span');
        cancel.textContent = 'x';
        cancel.id = 'cancel';
        header = document.createElement('header');
        header.textContent = 'Register';
        userName = document.createElement('input');
        userName.value = Attributes.get('nick');
        password = document.createElement('input');
        password.placeholder = 'Password';
        confirmPassword = document.createElement('input');
        confirmPassword.placeholder = 'Confirm password';
        submitButton = document.createElement('button');
        submitButton.textContent = 'submit';
        
        registerPanel.appendChild(cancel);
        registerPanel.appendChild(header);
        registerPanel.appendChild(userName);
        registerPanel.appendChild(password);
        registerPanel.appendChild(confirmPassword);
        registerPanel.appendChild(document.createElement('br'));
        registerPanel.appendChild(submitButton);
        
        cancel.addEventListener('click', function () {
            document.body.removeChild(overlay);
        });
        
        submitButton.addEventListener('click', function () {
            if (password.value === confirmPassword.value) {
                if (password.value.length > 4) {
                    socket.emit('register', userName.value, password.value);
                }
            }
        });
        
        overlay.appendChild(registerPanel);
        document.body.appendChild(overlay);
        userName.focus();
    }
}

$$$.query('#input-bar textarea').addEventListener('keydown', function (e) {
    var keyCode = e.which,
        inputValue = this.value;
    
    if (keyCode === 13) {
        if (!e.shiftKey) {
            e.preventDefault();
            if (inputValue) {
                this.value = '';
                handleInput(inputValue);
            }
        }
    }
});

$$$.query('#input-bar textarea').addEventListener('keyup', function (e) {
    this.style.height = '0px';
    
    var newHeight = Math.min(Math.max(this.scrollHeight, 30), screen.height / 3),
        messageDiv = document.getElementById('messages');
    
    this.style.height = newHeight + 'px';
    messageDiv.style.top = -(newHeight - 30) + 'px';
});

socket.on('message', showMessage);

socket.on('joined', menuControl.addUser);

socket.on('nick', menuControl.changeNick);

socket.on('left', menuControl.removeUser);

socket.on('captcha', function (captcha) {
    var messageHTML = buildMessage(captcha, 'captcha');
    appendMessageTo(messageHTML);
});

socket.on('channeldata', function (channel) {
    var i,
        channelData;
    
    if (channel.users) {
        for (i = 0; i < channel.users.length; i++) {
            menuControl.addUser(channel.users[i].id, channel.users[i].nick, true);
        }
    }

    channelTheme(channel.data);
});

socket.on('update', function (allAtt) {
    var keys = Object.keys(allAtt),
        i;
    
    for (i = 0; i < keys.length; i++) {
        Attributes.set(keys[i], allAtt[keys[i]], true);
    }
});

socket.on('locked', function () {
    var loginPanel = document.getElementsByClassName('loginPanel'),
        header,
        nickInput,
        passwordInput,
        submitButton;
    
    if (loginPanel.length === 0) {
        loginPanel = document.createElement('div');
        loginPanel.className = 'loginPanel';
        header = document.createElement('header');
        header.textContent = 'Channel is locked';
        submitButton = document.createElement('button');
        submitButton.textContent = 'login';
        nickInput = document.createElement('input');
        nickInput.placeholder = 'Username';
        passwordInput = document.createElement('input');
        passwordInput.placeholder = 'Password';
        passwordInput.type = 'password';

        loginPanel.appendChild(header);
        loginPanel.appendChild(nickInput);
        loginPanel.appendChild(passwordInput);
        loginPanel.appendChild(document.createElement('br'));
        loginPanel.appendChild(submitButton);
        
        submitButton.addEventListener('click', function () {
            socket.emit('requestJoin', {
                nick : nickInput.value,
                password : passwordInput.value,
                token : Attributes.get('token')
            });
        });
        
        document.body.appendChild(loginPanel);
    }
});

socket.on('disconnect', function () {
    showMessage({
        message : 'disconnected',
        messageType : 'error'
    });
});

socket.on('refresh', function () {
    location.reload();
});

socket.on('connect', function () {
    if (window.top !== window.self) {
        window.top.location = window.self.location;
    } else {
        socket.emit('requestJoin', Attributes.storedAttributes);
        menuControl.updateValues();
    }
});