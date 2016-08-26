var socket = io.connect(window.location.pathname);


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
    
    container.className = 'message';
    
    if (messageType !== undefined) {
        container.className += ' ' + messageType;
    }
    
    timeDIV.className = 'time';
    timeDIV.textContent = time.format('shortTime');
    container.appendChild(timeDIV);
    
    if (nick) {
        nickDIV.className = 'nick';
        nickDIV.textContent = nick + ': ';
        container.appendChild(nickDIV);
    }
    
    messageDIV.className = 'messageContent';
    messageDIV.innerHTML = parser.parse(message);
    container.appendChild(messageDIV);
    
    return container;
}

function handleCommand(commandData) {
    console.log(commandData);
}

function sendMessage(message) {
    console.log(message);
    
    appendMessageTo(buildMessage(message, 'chat', 'sammich'));
    
}

function handleInput(value) {
    var command = /^\/(\w+) ?([\s\S]*)/.exec(value);
    
    if (command) {
        handleCommand(command);
    } else {
        sendMessage(value);
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


socket.on('connect', function () {
    socket.emit('requestJoin');
});