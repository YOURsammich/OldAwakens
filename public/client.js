/*
    coin
    /anon
    youtube replace thing
*/


/*

userList
direct messages
user info
    hats
    cursors
    text/style
        font
        color
        glow
        backgroundColor
        text mods
activeChannels
channelPanel
    theme
        background
        topic
        note
    settings
        proxy
        private
    

*/

var socket;

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
    showMsg : ['flair', 'color', 'glow', 'bgcolor', 'font', 'style'],
    notify : ['part', 'nick', 'role'],
    altAtt : {colour : 'color', bg : 'background'},
    nosaveLocal : ['channel-filters', 'background', 'msg', 'note', 'topic'],
    default : {
        cursors : true,
        mute : false,
        background : true,
        msg : true,
        images : true,
        filters : true,
        '12h' : true
    },
    set : function (attribute, newValue, noNotify) {
        var oldValue = this.storedAttributes[attribute];
        this.storedAttributes[attribute] = newValue;
        
        if (noNotify === undefined) {
            if (this.showMsg.indexOf(attribute) !== -1 && oldValue !== newValue && this.get('nick')) {
                messageBuilder.showMessage({
                    nick : this.get('nick'),
                    flair : this.get('flair'),
                    message : clientSubmit.message.decorateText('Now your messages look like this'),
                    messageType : 'chat'
                });
            }

            if ((this.notify.indexOf(attribute) !== -1 || attribute.substr(0, 6) == 'toggle') && oldValue !== newValue && newValue !== undefined) {
                messageBuilder.showMessage({
                    message : attribute + ' is now set to ' + newValue,
                    messageType : 'info'
                });
            }
        }

        if (this.nosaveLocal.indexOf(attribute) === -1 && attribute !== undefined) {
            if (typeof newValue === 'object') {
                localStorage.setItem('chat-' + attribute, JSON.stringify(newValue));
            } else {
                localStorage.setItem('chat-' + attribute, newValue);
            }
        }
        
        if (attribute == 'font' || attribute == 'color') {
            parser.changeInput(attribute, newValue);
        }
        
        if (attribute.substr(0, 6) == 'toggle') {
            if (attribute === 'toggle-cursors') {
                socket.emit('removeCursor');
                COMMANDS.clearcursors.handler();
            } else if (attribute === 'toggle-background') {
                if (newValue) {
                    document.getElementById('messages-background').style.background = Attributes.get('background').value;
                } else {
                    document.getElementById('messages-background').style.background = 'black';
                }      
            } else if (attribute === 'toggle-msg') {
                if (newValue) {
                    document.getElementById('center-text').style.display = 'table-cell';
                } else {
                    document.getElementById('center-text').style.display = 'none';
                }     
            }
            menuControl.toggles();
        }
    },
    get : function (attribute) {
        var value = '';
        
        if (this.altAtt[attribute]) {
            attribute = this.altAtt[attribute];
        }
        
        if (attribute.substr(0, 6) == 'toggle' && this.storedAttributes[attribute] === undefined) {
            value = this.default[attribute.substr(7)]
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

var messageBuilder = {//message, messageType, nick, flair, count, hat
    storedMessages : {
        main : []
    },
    alertMessage : function (message, nick) {
        var myNick = Attributes.get('nick'),
            quote = message.match(/>>\d+/g),
            quoteAlert = false,
            quotedMessage,
            i;
        
        if (quote) {
            for (i = 0; i < quote.length; i++) {
                quotedMessage = messageBuilder.storedMessages.main[quote[i].replace('>>', '')];
                if (quotedMessage) {
                    quoteAlert = quotedMessage.nick === myNick
                }
            }
        }
        
        return nick !== myNick && (message.indexOf(myNick) !== -1 || quoteAlert);
    },
    messageHTML : function () {
        var container = document.createElement('div'),
            time = new Date(),
            timeDIV = document.createElement('div'),
            nickDIV = document.createElement('div'),
            messageDIV = document.createElement('div'),
            hatDIV = document.createElement('div');
        
        container.className = 'message';
                
        timeDIV.className = 'time';
        container.appendChild(timeDIV);
        
        hatDIV.className = 'hat';
        container.appendChild(hatDIV);
        
        nickDIV.className = 'nick';
        container.appendChild(nickDIV);
        
        messageDIV.className = 'messageContent';
        container.appendChild(messageDIV);
        
        return {
            container : container,
            time : timeDIV,
            nick : nickDIV,
            hat : hatDIV,
            message : messageDIV
        };
    },
    filloutHTML : function (messageHTML, messageData, alertMessage) {
        var time = new Date();
        
        if (messageData.messageType) {
            messageHTML.container.className += ' ' + messageData.messageType;
        }
        
        if (messageData.count) {
            messageHTML.container.className += ' msg-' + messageData.count;
            messageBuilder.storedMessages.main[messageData.count] = {
                el : messageHTML.container,
                nick : messageData.nick
            };
        }
        
        if (messageHTML.time) {
            messageHTML.time.textContent = (Attributes.get('toggle-12h') ? time.format('shortTime') : time.format('HH:MM')) + ' ';
        }
        
        if (messageData.count) {
            messageHTML.time.addEventListener('click', function () {
                var input = document.querySelector('#input-bar textarea');
                input.value = input.value + (input.value ? ' ' : '')  + '>>' + messageData.count + ' ';
                input.focus();
            });
        }

        if (messageData.nick) {
            if (messageData.hat && messageData.hat !== 'none') {
                messageHTML.hat.style.backgroundImage = "url('/hats/" + messageData.hat + "')";
            }
            
            messageHTML.nick.innerHTML = parser.flair(messageData.flair, messageData.nick) + ':';
        }
        
        if (messageData.messageType === 'info') {
            messageHTML.message.innerHTML = parser.escape(messageData.message);
        } else if (messageData.messageType === 'chat-image') {
            messageHTML.message.innerHTML = parser.parseImage(messageData.message.img, messageData.message.type);
        } else {
            if (alertMessage) {
                messageHTML.time.style.color = 'yellow'; 
                if (window.blurred) {
                    document.getElementById("icon").href = "images/awakenslogo2.png";
                }
            }
            parser.getAllFonts(messageData.message);
            //messageHTML.message.innerHTML = parser.convert(parser.escape(messageData.message));
            messageHTML.message.innerHTML = parser.parse(messageData.message, messageData.messageType == 'chat' && (Attributes.get('channel-filters') && Attributes.get('channel-filters').value) && Attributes.get('toggle-filters'));
        }
        
        return messageHTML.container;
    },
    appendMessageTo : function (message, el) {
        if (el === undefined) {
            el = document.getElementById('messages');
        }
        
        el.appendChild(message);
        if ((el.scrollTop+el.offsetHeight) > message.offsetTop-Math.min(message.offsetHeight, 20)) {
            this.scrollToBottom(el);
        }
    },
    scrollToBottom : function(element) {
        if (typeof element == "string") {
            element = document.getElementById(element);
        }

        var SCROLL = 0;
    
        function easeInOutQuad(t, b, c, d) {
    	    t /= d/2;
        	if (t < 1) return c/2*t*t + b;
        	t--;
    	    return -c/2 * (t*(t-2) - 1) + b;
        }
    
        function scroll(start, end, lengthMs, cb) {
        	var time = 0;
            SCROLL = setInterval(function() {
    			var value = easeInOutQuad(time, start, end, lengthMs);
        		if (time == lengthMs || value == end) {
    	    		clearInterval(SCROLL);
                }
                cb(value, time);
                time++;
            }, 1);
        }
        
        if (window.blurred) {
            element.scrollTop = element.scrollHeight-element.offsetHeight;
        } else {
            var scrollStart = element.scrollTop;
            var scrollEnd = element.scrollHeight-element.offsetHeight;
            scroll(scrollStart, scrollEnd, 100, function(value, time) {
                element.scrollTop = value;
            });
        }
    },
    showMessage : function (messageData, panel) {
        var blockUsers = Attributes.get('block') || [],
            userID = ONLINE.getId(messageData.nick),
            messageHTML = messageBuilder.messageHTML(),
            alertMessage,
            messageReady;
        
        if (blockUsers.indexOf(messageData.nick) === -1) {
            if (messageData.messageType == 'chat') {
                alertMessage = messageBuilder.alertMessage(messageData.message, messageData.nick)
            }

            messageReady = messageBuilder.filloutHTML(messageHTML, messageData, alertMessage);
            
            if (userID) {//reset idle time
                ONLINE.users[userID].resetStatus();
            }

            if (messageData.messageType === 'personal' && messageData.nick !== Attributes.get('nick')) {//add user to quick reply if quick PM
                Attributes.set('lastpm', messageData.nick);
            }
            
            if (!Attributes.get('toggle-mute')) {
                audioPlayer.play(alertMessage);
            }
            
            messageBuilder.appendMessageTo(messageReady, panel);
        }
    }
};

var privateMessages = {
    storedconvo : {},
    toggleHTML : function (msgdata) {
        var panel = document.getElementById('PmPanel-' + msgdata.landOn),
            container = document.createElement('div'),
            nick = document.createElement('div'),
            numsg = document.createElement('span'),
            lastmsg = document.createElement('span');
        
        container.id = 'pmtoggle-' + msgdata.landOn;
        container.className = 'pmtoggle';
        nick.innerHTML = parser.flair(privateMessages.storedconvo[msgdata.landOn].toflair, privateMessages.storedconvo[msgdata.landOn].nick);
        nick.className = 'pnick nick';
        numsg.classList = 'misnum';
        
        if (privateMessages.storedconvo[msgdata.landOn].unread) {
            numsg.textContent = 'unread: ' + privateMessages.storedconvo[msgdata.landOn].unread;
        }
        
        if (msgdata.message.length < 50) {
            lastmsg.innerHTML = parser.parse(msgdata.message);
        } else {
            lastmsg.innerHTML = parser.parse(msgdata.message.substr(0, 50));    
        }
        
        lastmsg.className = 'pmsg message';
        
        container.addEventListener('click', function () {
            if (panel) {
                panel.style.display = 'block';
            } else {
                createPmPanel(msgdata.landOn);
            }
            container.parentNode.removeChild(container);
        });
        
        nick.appendChild(numsg);
        container.appendChild(nick);
        container.appendChild(lastmsg);
        
        return container;
    },
    mini : function (landOn) {
        var panel = document.getElementById('PmPanel-' + landOn),
            pmtoggle = document.getElementById('pmtoggle-' + landOn),
            messageData;
        
        if (privateMessages.storedconvo[landOn]) {
            messageData = privateMessages.storedconvo[landOn].messages[privateMessages.storedconvo[landOn].messages.length - 1];
            if (pmtoggle) {
                pmtoggle.getElementsByClassName('pmsg')[0].innerHTML = parser.parse(messageData.message);
                if (this.storedconvo[messageData.landOn].unread) {
                    pmtoggle.getElementsByClassName('misnum')[0].textContent = 'unread: ' + this.storedconvo[messageData.landOn].unread;
                } else {
                    pmtoggle.getElementsByClassName('misnum')[0].textContent = '';
                }
            } else {
                pmtoggle = this.toggleHTML(messageData);
                document.getElementById('directMessages').appendChild(pmtoggle);
            }
        }
    },
    handlePM : function (messageData) {
        var panel = document.getElementById('PmPanel-' + messageData.landOn),
            menuPanel = document.getElementById('menu-container');
        
        if (!privateMessages.storedconvo[messageData.landOn]) {
            privateMessages.storedconvo[messageData.landOn] = {
                messages : [],
                unread : 0,
                id : messageData.landOn,
                nick : ONLINE.users[messageData.landOn].nick,
                toflair : messageData.flair
            };
        } else if (privateMessages.storedconvo[messageData.landOn].id == ONLINE.getId(messageData.nick)) {
            privateMessages.storedconvo[messageData.landOn].toflair = messageData.flair;
        }
        
        privateMessages.storedconvo[messageData.landOn].messages.push(messageData);
        privateMessages.storedconvo[messageData.landOn].unread++;
        
        if (panel) {
            messageBuilder.showMessage(messageData, panel.getElementsByClassName('messages')[0]);
            messageBuilder.scrollToBottom(panel.getElementsByClassName('messages')[0]);
        }
        
        if (!panel || panel.style.display == 'none') {
            if (document.getElementById('directMessages').style.display != 'block') {
                document.getElementById('chatTab').className = 'highlightTab';   
            }
            privateMessages.mini(messageData.landOn);
        }
        

        if (menuPanel.style.display == 'none') {
            document.getElementsByClassName('toggle-menu')[0].style.backgroundColor = 'orange';
            audioPlayer.play(true);
        }        
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
                formatedParams[splitCommand[0]] = givenParams.substring(0, givenParams.indexOf('|'));
                formatedParams[splitCommand[1]] = givenParams.substring(givenParams.indexOf('|') + 1);
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

            if (COMMANDS.shortCuts[commandName]) {
                commandName = COMMANDS.shortCuts[commandName];
            }
            
            if (COMMANDS[commandName]) {
                if (COMMANDS[commandName].params) {

                    formatedParams = this.formatParams(COMMANDS[commandName].params, params);
                    
                    if (COMMANDS[commandName].params.length <= Object.keys(formatedParams).length || COMMANDS[commandName].paramsOptional) {
                        this.send(commandName, formatedParams);
                    } else {
                        messageBuilder.showMessage({
                            message : 'Invalid: /' + commandName + ' <' + COMMANDS[commandName].params.join('> <') + '>',
                            messageType : 'error'
                        });
                    }
                } else {
                    this.send(commandName);
                }
            } else {
                messageBuilder.showMessage({
                    message : 'That isn\'t a command',
                    messageType : 'error'
                });
            }
        }
    },
    message : {
        decorateText : function (text, styles) {
            var decorativeModifiers = '';
            
            if (!styles) {
                styles = Attributes.storedAttributes;
            }

            if (styles.font) {
                decorativeModifiers += '$' + styles.font + '|';
            }

            if (styles.glow) {
                decorativeModifiers += '###' + styles.glow;
            }

            if (styles.bgcolor) {
                decorativeModifiers += '##' + styles.bgcolor;
            }

            if (styles.color) {
                decorativeModifiers += '#' + styles.color;
            }

            if (styles.style) {
                decorativeModifiers += styles.style;
            }
            
            if (styles.greg && styles.color) {
                text = parser.mix([styles.color, styles.greg], text);
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
};

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
        
        minimize.addEventListener('click', function () {
            panelContainer.style.display = 'none';
            privateMessages.storedconvo[id].unread = 0;
            privateMessages.mini(id);
        });
        
        cancel.addEventListener('click', function () {
            document.body.removeChild(panelContainer);
        });

        input.addEventListener('keydown', function (e) {
            if (e.which === 13 && this.value) {
                clientSubmit.message.sendPrivate(this.value, id);
                this.value = '';
            }
        });
 
        if (privateMessages.storedconvo[id]) {
            for (i = 0; i < privateMessages.storedconvo[id].messages.length; i++) {
                messageBuilder.showMessage(privateMessages.storedconvo[id].messages[i], messages);
            }
        }
        
        socket.on('pmMessage', function (messageData) {
            if (Attributes.get('nick') != messageData.nick) {
                nickName.innerHTML = parser.flair(messageData.flair, messageData.nick);
            }
        });
        
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
                    var span = document.createElement('span');
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

function showChannelDetails(channelData) {
    if (channelData.note && channelData.note.value) {
        messageBuilder.showMessage({
            message : channelData.note.value,
            messageType : 'note'
        });
        Attributes.set('note', channelData.note);
    }

    if (channelData.topic && channelData.topic.value) {
        document.title = channelData.topic.value;
        messageBuilder.showMessage({
            message : 'Topic: ' + channelData.topic.value,
            messageType : 'general'
        });
        Attributes.set('topic', channelData.topic);
    }

    if (channelData.background && channelData.background.value) {
        if (Attributes.get('toggle-background')) {
            document.getElementById('messages-background').style.background = channelData.background.value;
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
    
    if (channelData.msg && channelData.msg.value) {
        if (!Attributes.get('toggle-msg')) {
            document.getElementById('center-text').style.display = 'none';
        }
        document.getElementById('center-text').innerHTML = parser.parse(channelData.msg.value, true, true);
        Attributes.set('msg', channelData.msg);
    }
    
    if (channelData.lock && (!Attributes.get('lock') || Attributes.get('lock').value !== channelData.lock.value)) {
        var message;
        if (channelData.lock.value) {
            message = ' locked this channel';
        } else {
            message = ' unlocked this channel';
        }
        messageBuilder.showMessage({
            message : channelData.lock.updatedBy + message,
            messageType : 'general'
        });
        
        Attributes.set('lock', channelData.lock);
    }
    
    if (channelData.proxy && (!Attributes.get('proxy') || Attributes.get('proxy').value !== channelData.proxy.value)) {
        var message;
        if (channelData.proxy.value) {
            message = ' blocked proxies';
        } else {
            message = ' unblocked proxies';
        }
        messageBuilder.showMessage({
            message : channelData.proxy.updatedBy + message,
            messageType : 'general'
        });
        
        Attributes.set('proxy', channelData.proxy);
    }
    
    menuControl.wordfilter(channelData.wordfilter);
    menuControl.channelfont(channelData.font);
    menuControl.ownerUI(channelData.owner);
    menuControl.roleUI(channelData.roles);
}

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
        messageDiv.scrollTop = messageDiv.scrollHeight;
        
        if (this.value.length === 0) {
            typing = false;
            socket.emit('typing', false);
        }
    });
    
    $$$.query('main').addEventListener('drop', function (e) {
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
                    messageBuilder.showMessage({
                        "message" : "Not an image.",
                        "messageType" : "error"
                    });
                }
            } else {
                messageBuilder.showMessage({
                    "message" : "Image too large.",
                    "messageType" : "error"
                });
            }
        }
    });
    
    $$$.query('main').addEventListener('paste', function (e) {
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
                        messageBuilder.showMessage({
                            "message" : "Not an acceptable image.",
                            "messageType" : "error"
                        });
                    }
                } else {
                    messageBuilder.showMessage({
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

(function connectToChannel() {
    var subDomain = window.location.host.split('.'),
        sub = window.location.pathname;
    
    if (subDomain.length == 3) {
        socket = io.connect('/' + subDomain[0] + sub);
    } else {
        socket = io.connect(sub);
    }
    
    socket.on('message', messageBuilder.showMessage);

    socket.on('chat-image', messageBuilder.showMessage, true);

    socket.on('pmMessage', privateMessages.handlePM);

    socket.on('channelDetails', showChannelDetails)

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
        table.innerHTML = '<tr><th>IP</th><th>nick</th><th>Banned by</th><th>Reason</th></tr>';

        for (var q = 0; q < banlist.length; q++) {
            var tr = document.createElement('tr');
            var keys = Object.keys(banlist[q]);

            for(var i = 2; i < 6; i++){
                var key = keys[i];
                var td = document.createElement('td');
                td.className = 'banlistentry';
                td.textContent = banlist[q][keys[i]] || ' ';
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }

        insideHolder.appendChild(table);
        $$$.draggable(border, 'banlistentry');

        document.body.appendChild(border);
    });

    socket.on('update', function (allAtt) {
        var keys = Object.keys(allAtt),
            i;

        for (i = 0; i < keys.length; i++) {
            if (allAtt[keys[i]]) {
                Attributes.set(keys[i], allAtt[keys[i]]);
            }
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

    socket.on('disconnect', function (reason) {
        var userIDs = Object.keys(ONLINE.users);
        for (var i = 0; i < userIDs.length; i++) {
            var userID = userIDs[i];
            var user = ONLINE.users[userID];
            if (user.cursor && user.cursor.parentNode) {
                user.cursor.parentNode.removeChild(user.cursor);
            }
        };
        
        console.error(reason);
        
        messageBuilder.showMessage({
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
        }
    });

    menuControl.initMissedMessages(socket);
    menuControl.initMenuUI(socket);   
})();