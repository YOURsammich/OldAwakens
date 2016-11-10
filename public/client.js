var socket = io.connect(window.location.pathname);

//idle/afk users should change positions on the userlist board after so long of inactivity

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
    notifierAtt : ['flair', 'color', 'glow', 'bgcolor', 'font'],
    set : function (attribute, newValue, notify) {
        var oldValue = this.storedAttributes[attribute];
        this.storedAttributes[attribute] = newValue;
        
        if (this.notifierAtt.includes(attribute) && oldValue !== newValue) {
            showMessage({
                nick : this.get('nick'),
                flair : this.get('flair'),
                message : clientSubmit.message.decorateText('Now your messages look like this'),
                messageType : 'chat'
            });
        } else if (notify && oldValue !== newValue && attribute !== 'token') {
            showMessage({
                message : attribute + ' is now set to ' + newValue,
                messageType : 'info'
            });
        }
        localStorage.setItem('chat-' + attribute, newValue);
    },
    get : function (attribute) {
        var value = '';
        
        if (this.storedAttributes[attribute] === undefined && attribute.substr(0, 6) === 'toggle') {
            value = true;
        } else {
            value = this.storedAttributes[attribute];
        }
        
        return value;
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
                try {
                    allAtt[key.substr(5)] = JSON.parse(localStorage[key]);
                } catch (err) {
                    allAtt[key.substr(5)] = localStorage[key];
                }
            }
        }
        
        return allAtt;
    }())
};

var messageBuilder = {
    createMessage : function (message, messageType, nick, flair, count, hat) {
        var container = document.createElement('div'),
            time = new Date(),
            timeDIV = document.createElement('div'),
            nickDIV = document.createElement('div'),
            messageDIV = document.createElement('div'),
            hatSpan,
            input;

        if (messageType === undefined) {
            container.className = 'message';
        } else {
            container.className = 'message ' + messageType;
        }

        timeDIV.className = 'time';
        timeDIV.textContent = time.format('shortTime') + ' ';

        if (count) {
            timeDIV.addEventListener('click', function () {
                input = document.querySelector('#input-bar textarea');
                if (input.value) {
                    input.value = input.value + ' >>' + count + ' ';
                } else {
                    input.value = '>>' + count + ' ';
                }
                input.focus();
            });
        }

        container.appendChild(timeDIV);
            if (hat && hat !== 'none') {
                hatSpan = document.createElement('div');
                hatSpan.className = 'hat';
                hatSpan.style.backgroundImage = "url('/hats/" + hat + "')";
                hatSpan.style.backgroundPosition = "center";
                hatSpan.style.backgroundRepeat = "no-repeat";
                hatSpan.style.backgroundSize = "30px 29px";
                container.appendChild(hatSpan);
            }
        if (nick) {
            nickDIV.className = 'nick';

            if (flair && parser.removeHTML(parser.parse(flair)) === nick) {
                parser.getAllFonts(flair);
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
            
            if (this.alertMessage(message, messageType, nick)) {
                timeDIV.style.color = 'yellow';
                if (!Attributes.get('mute')) {
                    audioPlayer.name.play();
                }
            } else if (!Attributes.get('mute')) {
                audioPlayer.chat.play();
            }

            if (count) {
                container.classList += ' msg-' + count;
            }

            while (message.split(/\n/).length > 15) {
                var index = message.lastIndexOf('\n');
                message = message.slice(0, index) + message.slice(index + 1);
            }
            parser.getAllFonts(message);
            messageDIV.innerHTML = ' ' + parser.parse(message, messageType === 'chat');
        }

        container.appendChild(messageDIV);

        return container;
    },
    alertMessage : function (message, messageType, nick) {
        var myNick = Attributes.get('nick'),
            quote = message.match(/>>\d+/g),
            quoteAlert = false,
            quotedMessage,
            quotedNick,
            i;
        
        if (quote) {
            for (i = 0; i < quote.length; i++) {
                quotedMessage = document.getElementsByClassName('msg-' + quote[i].replace('>>', ''));
                if (quotedMessage.length) {
                    quotedNick = quotedMessage[0].getElementsByClassName('nick')[0].textContent;
                    if (quotedNick.substr(0, quotedNick.length-1) === myNick) {
                        quoteAlert = true;
                    } 
                }
            }   
        }
        
        return messageType === 'chat' && nick !== myNick && (message.indexOf(myNick) !== -1 || quoteAlert)
    },
    appendMessageTo : function (message, el) {
        if (el === undefined) {
            el = document.getElementById('messages');
        }

        el.appendChild(message);
        this.scrollToBottom(el);
    },
    scrollToBottom : function (el) {

        function scrollTo(element, to, duration) {
            var start = element.scrollTop,
                change = to - start,
                increment = 20;

            var animateScroll = function (elapsedTime) {
                elapsedTime += increment;
                var position = easeInOut(elapsedTime, start, change, duration);
                element.scrollTop = position;
                if (elapsedTime < duration) {
                    setTimeout(function () {
                        animateScroll(elapsedTime);
                    }, increment);
                }
            };
            animateScroll(0);
        }

        function easeInOut(currentTime, start, change, duration) {
            currentTime /= duration / 2;
            if (currentTime < 1) {
                return change / 2 * currentTime * currentTime + start;
            }
            currentTime -= 1;
            return -change / 2 * (currentTime * (currentTime - 2) - 1) + start;
        }

        if (typeof el === 'string') {
            el = document.getElementById(el);
        }

        var scrollDelta = el.scrollHeight - el.clientHeight;
        if (scrollDelta - el.scrollTop < 300) {
            scrollTo(el, scrollDelta, 200);
        }
    }
}

function showMessage(messageData, panel) {
    var messageHTML = messageBuilder.createMessage(messageData.message, messageData.messageType, messageData.nick, messageData.flair, messageData.count, messageData.hat),
        blockUsers = Attributes.get('blocked') || [];
    
    if (messageData.messageType && messageData.messageType === 'personal' && messageData.nick !== Attributes.get('nick')) {
        Attributes.set('lastpm', messageData.nick);
    }
    
    if (blockUsers.indexOf(messageData.nick) === -1) {
        messageBuilder.appendMessageTo(messageHTML, panel);   
    }
}

function handlePrivateMessage(messageData) {
    var panel = document.getElementById('PmPanel-' + messageData.landOn),
        pmUser = ONLINE.users[messageData.landOn],
        informer;
    
    if (panel && panel.getElementsByClassName('messages')[0]) {
        showMessage(messageData, panel.getElementsByClassName('messages')[0]);
    } else if (pmUser) {
        informer = pmUser.li.getElementsByClassName('informer')[0];    
        if (!pmUser.listin) {
            informer.textContent = 'unread PM(s)';
            pmUser.listin = function () {
                createPmPanel(messageData.landOn);
            }
            informer.addEventListener('click', pmUser.listin);
        }
        if (!pmUser.pm) {
            pmUser.pm = [];
        }    
        pmUser.pm.push(messageData);
    }
}

var clientSubmit = {
    command : {
        send : function (commandName, params) {
            if (COMMANDS[commandName].handler) {
                COMMANDS[commandName].handler(params);
            } else {
                socket.emit('command', commandName, params);
            }
        },
        formatParams : function (commandParams, givenParams) {
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
        },
        handle : function (commandData) {
            var commandName = commandData[1].toLowerCase(),
                params = commandData[2],
                formatedParams;

            if (COMMANDS[commandName]) {
                if (COMMANDS[commandName].params) {

                    formatedParams = this.formatParams(COMMANDS[commandName].params, params);

                    if (COMMANDS[commandName].params.length <= Object.keys(formatedParams).length) {
                        this.send(commandName, formatedParams);
                    } else {
                        showMessage({
                            message : 'Invalid: /' + commandName + ' <' + COMMANDS[commandName].params.join('> <') + '>',
                            messageType : 'error'
                        });
                    }
                } else {
                    this.send(commandName);
                }
            } else {
                showMessage({
                    message : 'That isn\'t a command',
                    messageType : 'error'
                });
            }
        }
    },
    message : {
        decorateText : function (text) {
            var decorativeModifiers = '',
                font = Attributes.get('font'),
                color = Attributes.get('color'),
                bgcolor = Attributes.get('bgcolor'),
                glow = Attributes.get('glow'),
                style = Attributes.get('style');

            if (font) {
                decorativeModifiers += '$' + font + '|';
            }

            if (glow) {
                decorativeModifiers += '###' + glow;
            }

            if (bgcolor) {
                decorativeModifiers += '##' + bgcolor;
            }

            if (color) {
                decorativeModifiers += '#' + color;
            }

            if (style) {
                decorativeModifiers += style;
            }

            return decorativeModifiers + ' ' + text;
        },
        send : function (message) {
            socket.emit('message', this.decorateText(message), Attributes.get('flair'));
        },
        sendPrivate : function (message, userID) {
            socket.emit('privateMessage', this.decorateText(message), Attributes.get('flair'), userID);
        }
    },
    handleInput : function (value) {
        var command = /^\/(\w+) ?([\s\S]*)/.exec(value);

        if (command) {
            this.command.handle(command);
        } else {
            this.message.send(value);
        }
    }
}

function channelTheme(channelData, updatedBy) {
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
            message : 'Topic: ' + channelData.topic,
            messageType : 'general'
        });
        Attributes.set('topic', channelData.topic);
    }
    
    if (channelData.background) {
        if (Attributes.get('toggle-background')) {
            document.getElementById('messages').style.background = channelData.background;   
        }
        Attributes.set('background', channelData.background);
    }

    if (channelData.themecolors) {
        document.getElementById('input-bar').style.backgroundColor = channelData.themecolors[0];
        document.getElementsByClassName('toggle-menu')[0].style.backgroundColor = channelData.themecolors[1];
        if (navigator.userAgent.toLowerCase().indexOf('chrome') !== -1) {
            document.styleSheets[0].deleteRule(3);
            document.styleSheets[0].insertRule("::-webkit-scrollbar-thumb { border-radius: 5px; background: " + channelData.themecolors[2], 3);
        }
    }
    
    if (channelData.lock !== undefined && updatedBy) {
        var message;
        if (channelData.lock) {
            message = ' locked this channel';
        } else {
            message = ' unlocked this channel';
        }
        showMessage({
            message : updatedBy + message,
            messageType : 'general'
        });
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

function createPmPanel(id) {
    var validUser = ONLINE.users[id],
        panel = document.getElementById('PmPanel-' + id),
        informer;
    
    function makePanel() {
        var panelContainer = document.createElement('div'),
            header,
            nickName,
            controls,
            minimize,
            cancel,
            messages,
            inputBar,
            input,
            i;
        
        panelContainer.id = 'PmPanel-' + id;
        panelContainer.className = 'pmPanel';
        header = document.createElement('header');
        nickName = document.createElement('span');
        nickName.textContent = validUser.nick;
        controls = document.createElement('span');
        controls.classList = 'pm-controls';
        cancel = document.createElement('span');
        cancel.textContent = 'x';
        minimize = document.createElement('span');
        minimize.textContent = '-';
        minimize.style.margin = '5px';
        messages = document.createElement('div');
        messages.className = 'messages';
        inputBar = document.createElement('div');
        inputBar.className = 'input-bar';
        input = document.createElement('input');
        input.placeholder = 'Type anything then press enter';
        
        cancel.addEventListener('click', function () {
            document.body.removeChild(panelContainer);
        });
        
        input.addEventListener('keydown', function (e) {
            if (e.which === 13 && this.value) {
                clientSubmit.message.sendPrivate(this.value, id);
                this.value = '';
            }
        });
        
        if (ONLINE.users[id].pm) {
            for (i = 0; i < ONLINE.users[id].pm.length; i++) {
                showMessage(ONLINE.users[id].pm[i], messages);
            }
            ONLINE.users[id].pm = [];
        }
        
        controls.appendChild(minimize);
        controls.appendChild(cancel);
        header.appendChild(nickName);
        header.appendChild(controls);
        panelContainer.appendChild(header);
        panelContainer.appendChild(messages);
        inputBar.appendChild(input);
        panelContainer.appendChild(inputBar);
        
        return panelContainer;
    }
    
    if (validUser && !panel) {
        if (validUser.listin) {
            informer = validUser.li.getElementsByClassName('informer')[0];
            informer.textContent = '';
            informer.removeEventListener('click', validUser.listin);
            delete validUser.listin;
        }
        panel = makePanel();
        $$$.draggable(panel);
        document.body.appendChild(panel);
    }
    
}

(function () {
    var history = [],
        historyIndex = 0;
    
    $$$.query('#input-bar textarea').addEventListener('keydown', function (e) {
        var keyCode = e.which,
            inputValue = this.value;
        
        switch (keyCode) {
        case 13:
            if (!e.shiftKey) {
                e.preventDefault();
                if (inputValue) {
                    historyIndex = 0;
                    this.value = '';
                    history.push(inputValue);
                    clientSubmit.handleInput(inputValue);
                }
            }
            break;
        case 38:
            if (e.shiftKey && historyIndex < history.length) {
                historyIndex++;
            }
            break;
        case 40:
            if (e.shiftKey && historyIndex > 1) {
                historyIndex--;
            }
            break;
        default:
            historyIndex = 0;
        }
        
        if (historyIndex !== 0) {
            this.value = history[history.length - historyIndex];
        }
    });

    $$$.query('#input-bar textarea').addEventListener('keyup', function (e) {
        this.style.height = '0px';

        var newHeight = Math.min(Math.floor(this.scrollHeight / 18) * 18, screen.height / 3),
            messageDiv = document.getElementById('messages');
        
        this.style.height = newHeight + 'px';
        messageDiv.style.top = -(newHeight - 18) + 'px';
    });
})();

socket.on('message', showMessage);

socket.on('pmMessage', handlePrivateMessage);

socket.on('joined', menuControl.addUser);

socket.on('nick', menuControl.changeNick);

socket.on('left', menuControl.removeUser);

socket.on('captcha', function (captcha) {
    var messageHTML = messageBuilder.createMessage(captcha, 'captcha');
    appendMessageTo(messageHTML);
});

socket.on('channeldata', function (channel) {
    var i,
        channelData;
    
    if (channel.users) {
        document.getElementsByClassName('userList')[0].innerHTML = '';
        for (i = 0; i < channel.users.length; i++) {
            menuControl.addUser(channel.users[i].id, channel.users[i].nick, true);
        }
    }

    channelTheme(channel.data, channel.updatedBy);
});

socket.on('banlist', function (banlist) {
    var border = document.createElement('div'),
        insideHolder = document.createElement('div'),
        cancel,
        table;
    
    border.className = 'banlist';
    
    border.appendChild(insideHolder);
    
    cancel = document.createElement('span');
    cancel.style.cssText = 'position:absolute;top:0px;right:4px;cursor:pointer;';
    cancel.textContent = 'x';
    
    cancel.onclick = function(){
        document.body.removeChild(border);
    }
    
    border.appendChild(cancel);
    
    table = document.createElement('table');   
    table.innerHTML = '<tr><th>Nick</th><th>Banned by</th><th>Reason</th></tr>';
    
    banlist.map(function(user){
        var tr = document.createElement('tr');
        var keys = Object.keys(user);
        for(var i = 0; i < 3; i++){
            var key = keys[i];
            var td = document.createElement('td');
            td.textContent = user[key] || ' ';
            tr.appendChild(td);
        }
        table.appendChild(tr);
    });
    
    insideHolder.appendChild(table);
    $$$.draggable(border);
    
    document.body.appendChild(border);
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

menuControl.initMissedMessages(socket);