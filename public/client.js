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
    set : function (attribute, value) {
        this.storedAttributes[attribute] = value;
        localStorage.setItem('chat-' + attribute, value);
    },
    get : function (attribute) {
        return this.storedAttributes[attribute] || '';
    },
    remove : function (attribute) {
        delete this.storedAttributes['chat-' + attribute];
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

function appendMessageTo(message, el) {
    
    if (el === undefined) {
        el = document.getElementById('messages');
    }
    
    el.appendChild(message);
    
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
            nickDIV.innerHTML = parser.parse(flair) + ':';
        } else {
            nickDIV.textContent = nick + ':';
        }

        container.appendChild(nickDIV);
    }
    
    messageDIV.className = 'messageContent';
    messageDIV.innerHTML = parser.parse(message);
    container.appendChild(messageDIV);
    
    return container;
}

function sendCommand(commandName, params) {
        
    if (COMMANDS[commandName].handler) {
        COMMANDS[commandName].handler(params);
    } else {
        socket.emit('command', commandName, params);
    }
    
}

function formatParams(commandParams, givenParams, paramsType) {
    var formatedParams = {},
        i;
    
    if (paramsType === 0) {
        formatedParams[commandParams[0]] = givenParams;
    }
    
    return formatedParams;
}

function handleCommand(commandData) {
    
    var commandName = commandData[1],
        params = commandData[2],
        formatedParams;
    
    if (COMMANDS[commandName]) {
        
        if (COMMANDS[commandName].params) {
            
            formatedParams = formatParams(COMMANDS[commandName].params, params, 0);
            
            sendCommand(commandName, formatedParams);
        } else {
            sendCommand(commandName);
        }
        
    }
    
}

function decorateText(text) {
    var decorativeModifiers = '',
        color = Attributes.get('color');
    
    if (color) {
        decorativeModifiers = '#' + color;
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

function showMessage(messageData) {
    var messageHTML = buildMessage(messageData.message, messageData.messageType, messageData.nick, messageData.flair);
    appendMessageTo(messageHTML);
    
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

socket.on('channeldata', function (channeldata) {
    var i;
    
    for (i = 0; i < channeldata.users.length; i++) {
        menuControl.addUser(channeldata.users[i].id, channeldata.users[i].nick, true);
    }

});

socket.on('connect', function () {
    socket.emit('requestJoin');
});