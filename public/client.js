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
    notifierAtt : ['flair', 'color', 'glow', 'bgcolor', 'font', 'filters'],
    altAtt : {colour : 'color', bg : 'background'},
    saveLocal : ['flair', 'nick', 'color', 'glow', 'font', 'filters'],
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
        
        if (this.saveLocal[attribute]) {
            if (typeof newValue === 'object') {
                localStorage.setItem('chat-' + attribute, JSON.stringify(newValue));
            } else {
                localStorage.setItem('chat-' + attribute, newValue);
            }   
        }
    },
    get : function (attribute) {
        var value = '';

        if (this.altAtt[attribute]) {
            attribute = this.altAtt[attribute];
        }

        if (this.storedAttributes[attribute] === undefined && attribute.substr(0, 6) === 'toggle') {
            value = true;
        } else if (this.storedAttributes[attribute] === undefined) {
            value = false;
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
        timeDIV.textContent = (Attributes.get('toggle-12h') ? time.format('shortTime') : time.format('HH:MM')) + ' ';

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
        
        if (nick) {
            if (hat && hat !== 'none') {
                hatSpan = document.createElement('div');
                hatSpan.className = 'hat';
                hatSpan.style.backgroundImage = "url('/hats/" + hat + "')";
                hatSpan.style.backgroundPosition = "center";
                hatSpan.style.backgroundRepeat = "no-repeat";
                hatSpan.style.backgroundSize = "30px 29px";
                container.appendChild(hatSpan);
            }

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
        } else if (messageType === 'chat-image') {
            messageDIV.innerHTML = parser.parseImage(message.img, message.type);
        } else {

            if (this.alertMessage(message, messageType, nick)) {
                timeDIV.style.color = 'yellow';
                if (!Attributes.get('mute')) {
                    audioPlayer.name.play();
                }
                if (window.blurred) {
                    document.getElementById("icon").href = "images/awakenslogo2.png";
                }
            } else if (!Attributes.get('mute')) {
                audioPlayer.chat.play();
            }

            while (message.split(/\n/).length > 15) {
                var index = message.lastIndexOf('\n');
                message = message.slice(0, index) + message.slice(index + 1);
            }
            parser.getAllFonts(message);
            
            messageDIV.innerHTML = ' ' + parser.parse(message, messageType === 'chat' && Attributes.get('toggle-filters'));
        }
        
        if (count) {
            container.classList += ' msg-' + count;
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

        return messageType === 'chat' && nick !== myNick && (message.indexOf(myNick) !== -1 || quoteAlert);
    },
    appendMessageTo : function (message, el) {
        if (el === undefined) {
            el = document.getElementById('messages');
        }
        
        /*li = document.createElement('li');
        li.appendChild(message);*/

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
        if (scrollDelta - el.scrollTop < 600) {
            scrollTo(el, scrollDelta, 200);
        }
    }
}

function showMessage(messageData, panel, img) {
    var blockUsers = Attributes.get('blocked') || [],
        userID = ONLINE.getId(messageData.nick);
    
    if (blockUsers.indexOf(messageData.nick) === -1) {
        var messageHTML = messageBuilder.createMessage(messageData.message, messageData.messageType, messageData.nick, messageData.flair, messageData.count, messageData.hat);
        
        if (messageData.messageType && messageData.messageType === 'personal' && messageData.nick !== Attributes.get('nick')) {
            Attributes.set('lastpm', messageData.nick);
        }
        messageBuilder.appendMessageTo(messageHTML, panel);
    }
}

function handlePrivateMessage(messageData) {
    var panel = document.getElementById('PmPanel-' + messageData.landOn),
        pmUser = ONLINE.users[messageData.landOn];

    if (panel && panel.getElementsByClassName('messages')[0]) {
        showMessage(messageData, panel.getElementsByClassName('messages')[0]);
    } else if (pmUser) {
        if (!pmUser.pm) {
            pmUser.pm = [];
        }
        pmUser.pm.push(messageData);
        
        menuControl.contextMenu.placeMenu(messageData.landOn, {
            ['unread PM(s) - ' +  pmUser.pm.length] : {
                callback : function (nick) {
                    createPmPanel(ONLINE.getId(nick));
                }  
            }
        }, true);
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

                    if (COMMANDS[commandName].params.length <= Object.keys(formatedParams).length || COMMANDS[commandName].paramsOptional) {
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

            return decorativeModifiers + text;
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

function channelTheme(channelData) {
    if (channelData.note && channelData.note.value) {
        showMessage({
            message : channelData.note.value,
            messageType : 'note'
        });
        Attributes.set('note', channelData.note);
    }

    if (channelData.topic && channelData.topic.value) {
        document.title = channelData.topic.value;
        showMessage({
            message : 'Topic: ' + channelData.topic.value,
            messageType : 'general'
        });
        Attributes.set('topic', channelData.topic);
    }

    if (channelData.background && channelData.background.value) {
        if (Attributes.get('toggle-background')) {
            document.getElementById('messages').style.background = channelData.background.value;
        }
        Attributes.set('background', channelData.background);
    }

    if (channelData.themecolors && channelData.themecolors.value) {
        document.getElementById('input-bar').style.backgroundColor = channelData.themecolors.value[0];
        document.getElementsByClassName('toggle-menu')[0].style.backgroundColor = channelData.themecolors.value[1];
        if (navigator.userAgent.toLowerCase().indexOf('chrome') !== -1) {
            document.styleSheets[0].deleteRule(4);
            document.styleSheets[0].insertRule("::-webkit-scrollbar-thumb { border-radius: 5px; background: " + channelData.themecolors.value[2], 4);
        }
    }
    
    if (channelData.lock && (typeof Attributes.get('lock') != 'object' || Attributes.get('lock').value != channelData.lock.value)) {
        var message;
        if (channelData.lock.value) {
            message = ' locked this channel';
        } else {
            message = ' unlocked this channel';
        }
        showMessage({
            message : channelData.lock.updatedBy + message,
            messageType : 'general'
        });
        
        Attributes.set('lock', channelData.lock);
    }
    
    if (channelData.proxy && (typeof Attributes.get('proxy') != 'object' || Attributes.get('proxy').value != channelData.proxy.value)) {
        var message;
        if (channelData.proxy.value) {
            message = ' blocked proxies';
        } else {
            message = ' unblocked proxies';
        }
        showMessage({
            message : channelData.proxy.updatedBy + message,
            messageType : 'general'
        });
        
        Attributes.set('proxy', channelData.proxy);
    }
}

function createPanel(title, html, func) {
    var panel = document.getElementsByClassName(title + 'Panel'),
        overlay,
        header,
        cancel,
        userName,
        password,
        confirmPassword,
        submitButton;

    if (panel.length === 0) {
        overlay = document.createElement('div');
        overlay.className = 'overlay';
        panel = document.createElement('div');
        panel.className = title + 'Panel panel';
        cancel = document.createElement('span');
        cancel.textContent = 'x';
        cancel.id = 'cancel';
        header = document.createElement('header');
        header.textContent = title;
        submitButton = document.createElement('button');
        submitButton.textContent = 'submit';

        panel.appendChild(cancel);
        panel.appendChild(header);

        html.forEach(function (ele) {
            panel.appendChild(ele);
        })

        panel.appendChild(document.createElement('br'));
        panel.appendChild(submitButton);

        cancel.addEventListener('click', function () {
            document.body.removeChild(overlay);
        });

        submitButton.addEventListener('click', func);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
    }
}

function createPmPanel(id) {
    var validUser = ONLINE.users[id],
        panel = document.getElementById('PmPanel-' + id);

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
        panel = makePanel();
        $$$.draggable(panel, 'messageContent');
        document.body.appendChild(panel);
    }
}

var AutoComplete = {
    isBarOpen: false,
    selected: 0,
    word: null,

    tabPressed: function tabPressed() {
        if (this.isBarOpen) {
            this.bar.childNodes[this.selected].style.color = "";
            if(++this.selected > this.bar.childNodes.length - 1) this.selected = 0;
            this.bar.childNodes[this.selected].style.color = "#DDD";
        } else {
            var word = this.word = document.getElementById('ac').value.replace(/[\.,-\/#!$%\^&\*;:{}=\_`~()]/g, ' ').trim().split(' ').reverse()[0],
                valids = Object.keys(ONLINE.users).filter(function (element) {
                return ONLINE.users[element].nick.toLowerCase().indexOf(word.toLowerCase()) === 0;
            });
            if (valids.length === 0) return;
            if (valids.length === 1) {
                var input = document.getElementById('ac');
                input.value = (input.value.split(' ').reverse().join(' ')).replace(this.word, ONLINE.users[valids[0]].nick).split(' ').reverse().join(' ');
                return;
            }
            var keys = Object.keys(ONLINE.users),
                bar  = document.createElement('div');
            bar.style.cssText = 'width:100%;position:relative;margin-bottom:5px;';
            this.bar = bar;
            this.selected = 0;
            for (var i = 0; i < keys.length; i++) {
                if (ONLINE.users[keys[i]].nick.indexOf(this.word) === 0) {
                    let span = document.createElement('span');
                    span.textContent = ONLINE.users[keys[i]].nick + " ";
                    this.bar.appendChild(span);
                }
            }
            this.bar.childNodes[0].style.color = "#DDD";
            document.getElementById('input-bar').prepend(this.bar);
            this.isBarOpen = true;
        }
    },
    otherKeys: function() {
        if (this.isBarOpen) {
            this.bar.parentNode.removeChild(this.bar);
            this.isBarOpen = false;
        }
    },
    enterPressed: function enterPressed() {
        if (this.isBarOpen) {
            var input = document.getElementById('ac');
            input.value = (input.value.split(' ').reverse().join(' ')).replace(this.word, this.bar.childNodes[this.selected].textContent.replace(/ /, '')).split(' ').reverse().join(' ');
            this.bar.parentNode.removeChild(this.bar);
            this.isBarOpen = false;
            return true;
        }
    }
};

(function () {
    var history = [],
        historyIndex = 0,
        typing = false;

    $$$.query('#input-bar textarea').addEventListener('keydown', function (e) {
        var keyCode = e.which,
            inputValue = this.value;
        
        if (AutoComplete.isBarOpen) e.preventDefault();
        switch (keyCode) {
        case 13:
            if (!AutoComplete.enterPressed() && !e.shiftKey) {
                e.preventDefault();
                if (inputValue) {
                    historyIndex = 0;
                    this.value = '';
                    history.push(inputValue);
                    clientSubmit.handleInput(inputValue);
                }
            }
            break;
        case 32:
            if (AutoComplete.isBarOpen) {
                AutoComplete.enterPressed();
                this.value = this.value + " ";
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
        case 9:
            e.preventDefault();
            AutoComplete.tabPressed();
            break;
        default:
            AutoComplete.otherKeys();
            historyIndex = 0;
        }

        if (historyIndex !== 0) {
            this.value = history[history.length - historyIndex];
        }
        
        if (!typing) {
            socket.emit('typing', true);
        }
        
        typing = true;
    });

    $$$.query('#input-bar textarea').addEventListener('keyup', function (e) {
        this.style.height = '0px';

        var newHeight = Math.min(Math.floor(this.scrollHeight / 18) * 18, screen.height / 3),
            messageDiv = document.getElementById('messages');

        this.style.height = newHeight + 'px';
        this.parentNode.style.top = -(newHeight - 18) + 'px';
        
        messageDiv.style.top = -(newHeight - 18) + 'px';
        
        if (this.value.length === 0) {
            typing = false;
            socket.emit('typing', false);
        }
    });
    
    $$$.query('#main-container').addEventListener('drop', function (e) {
        var acceptedFiletypes = ["image/png", "image/jpg", "image/jpeg", "image/gif", "image/webp"],
            file = e.dataTransfer.files[0],
            type,
            reader;
            
        if (file) {
            e.preventDefault();
            e.stopPropagation();
            if (file.size < 7000001) {
                type = file.type;
                if (acceptedFiletypes.indexOf(type) > -1) {
                    reader = new FileReader();
                    reader.onloadend = function () {
                        socket.emit("message-image", {
                            "type" : type,
                            "img" : reader.result 
                        }, Attributes.get("flair"));
                    }
                    reader.readAsBinaryString(file);
                } else {
                    showMessage({
                        "message" : "Not an image.",
                        "messageType" : "error"
                    });
                }
            } else {
                showMessage({
                    "message" : "Image too large.",
                    "messageType" : "error"
                });
            }
        }
    });
    
    $$$.query('#main-container').addEventListener('paste', function (e) {
        var acceptedFiletypes = ["image/png", "image/jpg", "image/jpeg", "image/gif", "image/webp"],
            file,
            items,
            reader;
		if (e.clipboardData) {
			items = e.clipboardData.items;
			if (!items) return;
			
            if (items[0].type.indexOf("image") !== -1) {
                e.preventDefault();
                file = items[0].getAsFile();
                if (file.size < 7000001) {
                    if (acceptedFiletypes.indexOf(file.type) > -1) {
                        reader = new FileReader();
                        reader.onloadend = function () {
                            socket.emit("message-image", {
                                "type" : file.type,
                                "img" : reader.result 
                            }, Attributes.get("flair"));
                        }
                        reader.readAsBinaryString(file);
                    } else {
                        showMessage({
                            "message" : "Not an acceptable image.",
                            "messageType" : "error"
                        });
                    }
                } else {
                    showMessage({
                        "message" : "Image too large.",
                        "messageType" : "error"
                    });
                }
            }
		}
    }, false);
    
    window.onblur = function() {
        window.blurred = true;
    };
    window.onfocus = function() {
        window.blurred = false;
        document.getElementById("icon").href = "images/awakenslogo.png";
    };
    emojione.imageType = 'svg';
    emojione.sprites = true;
    emojione.imagePathSVGSprites = 'images/emojione.sprites.svg';
})();

socket.on('message', showMessage);

socket.on('chat-image', showMessage, true);

socket.on('pmMessage', handlePrivateMessage);

socket.on('joined', menuControl.addUser);

socket.on('nick', menuControl.changeNick);

socket.on('typing', menuControl.typing);

socket.on('afk', menuControl.afk);

socket.on('left', menuControl.removeUser);

socket.on('captcha', function (captcha) {
    var messageHTML = messageBuilder.createMessage(captcha, 'captcha');
    messageBuilder.appendMessageTo(messageHTML);
});

socket.on('channeldata', function (channel) {
    var i;

    if (channel.users) {
        document.getElementsByClassName('userList')[0].innerHTML = '';
        ONLINE.users = {};
        for (i = 0; i < channel.users.length; i++) {
            menuControl.addUser(channel.users[i].id, channel.users[i].nick, channel.users[i].afk, true);
        }
    }
    
    if (channel.data) {
        channelTheme(channel.data);
    }
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
    var nickInput = document.createElement('input'),
        passwordInput = document.createElement('input');

    nickInput.placeholder = 'Username';
    passwordInput.placeholder = 'PassWord';
    passwordInput.type = 'password';

    createPanel('Login', [nickInput, passwordInput], function () {
        socket.emit('requestJoin', {
            nick : nickInput.value,
            password : passwordInput.value,
            token : Attributes.get('token')
        });
    });
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

socket.on('activeChannels', function (channels) {
    var channelPanel = document.getElementsByClassName('channelPanel')[0],
        activeChannels =channelPanel.getElementsByClassName('activeChannel'),
        div,
        i; 
    
    while (activeChannels.length) {
        channelPanel.removeChild(activeChannels[0]);
    }
    
    channels.sort(function (a, b) {
        return  b.online - a.online;
    });
    
    for (i = 0; i < channels.length; i++) {
        div = document.createElement('div');
        div.className = 'activeChannel';
        div.textContent = channels[i].name;
        channelPanel.appendChild(div);   
    }
});
socket.emit('activeChannels');

menuControl.initMissedMessages(socket)