var menuControl = {
    roleNames : ['super', 'channelOwner', 'admin', 'mod', 'baisc'],
    arrangeList : function (orderType) {
        var sortUsers = ONLINE.users,
            sKeys = Object.keys(sortUsers),
            i,
            children = [],
            roleHolder,
            header;
        
        document.getElementById('listedUsers').innerHTML = '';
        
        if (Attributes.get('menu-order') == 'roles') {
            for (i = 0; i < sKeys.length; i++) {
                children.push(sortUsers[sKeys[i]]); 
            };
            
            children.sort(function (a, b) {
                return a.role - b.role;
            });
            
            for (i = 0; i < children.length; i++) {
                roleHolder = document.getElementById(children[i].role + '-role');
 
                if (!roleHolder) {
                    header = document.createElement('header');
                    header.className = 'roleOrg';
                    header.textContent = menuControl.roleNames[children[i].role];
                    roleHolder = document.createElement('div');
                    roleHolder.className = 'roleHolder';
                    roleHolder.id = children[i].role + '-role';
                    roleHolder.appendChild(header);
                    document.getElementById('listedUsers').appendChild(roleHolder);
                }
                
                roleHolder.appendChild(children[i].li);
            }
        } else {
            for (i = 0; i < sKeys.length; i++) {
                document.getElementById('listedUsers').appendChild(sortUsers[sKeys[i]].li);
            }
        }
    },
    addUser : function (id, nick, role, afk, noShow) {
        var nickContain = document.createElement('div'),
            nickText = document.createElement('div'),
            extraInfo = document.createElement('div'),
            roleHolder = document.getElementById(role + '-role'),
            header;
    
        
        if (false) {
            header = document.createElement('header');
            header.className = 'roleOrg';
            header.textContent = menuControl.roleNames[role];
            roleHolder = document.createElement('div');
            roleHolder.className = 'roleHolder';
            roleHolder.id = role + '-role';
            roleHolder.appendChild(header);
            document.getElementById('listedUsers').appendChild(roleHolder);
            menuControl.arrangeList();
        }
        
        nickContain.id = id;
        nickContain.className = 'nickContain';
        extraInfo.className = 'informer';
        nickText.className = 'nickText';
        nickText.textContent = nick;
        
        nickContain.addEventListener('click', function (e) {
            var target = e.target;
            if (target.classList.contains('nickText')) {
                menuControl.contextMenu.placeMenu(id);
            }
        });
        
        nickContain.appendChild(nickText);
        nickContain.appendChild(extraInfo);

        ONLINE.users[id] = {
            nick : nick,
            role : role,
            li : nickContain,
            resetStatus : function (idleStatus) {
                var status = this;
                if (status.idleStatus) {
                    clearTimeout(status.idleStatus);
                }
                
                if (idleStatus == 'unavailable') {
                    nickContain.children[0].classList.add('unavailable');
                } else if (idleStatus == 'away') {
                    nickContain.children[0].classList.add('away');
                    status.idleStatus = setTimeout(function () {
                        status.resetStatus('unavailable');
                    }, 3600000);
                } else {
                    nickContain.children[0].classList.remove('away', 'unavailable');
                    status.idleStatus = setTimeout(function () {
                        status.resetStatus('away');
                    }, 90000);
                }
            }
        };
        
        menuControl.arrangeList();
        ONLINE.users[id].resetStatus();
        menuControl.updateCount();
        
        if (afk) {
            menuControl.afk(id, afk);
        }
        
        if (noShow === undefined) {
            messageBuilder.showMessage({
                message : nick + ' has joined',
                messageType : 'general'
            });
        }
        
        if (document.getElementsByClassName('LoginPanel').length !== 0 && nick === Attributes.get('nick')) {
            document.body.removeChild(document.getElementsByClassName('LoginPanel')[0].parentNode);
        }
    },
    idleStatus : function (id, status) {
        var user = ONLINE.users[id];
        if (user) {
            user.resetStatus(status);
        }
    },
    removeUser : function (id, part) {
        var user = ONLINE.users[id],
            pmPanel = document.getElementById('PmPanel-' + id);
        
        if (pmPanel) {
            messageBuilder.showMessage({
                message : user.nick + ' disconnected',
                messageType : 'error'
            }, pmPanel.getElementsByClassName('messages')[0]);
        }
        
        if (user.cursor && user.cursor.parentNode) {
            user.cursor.parentNode.removeChild(user.cursor);
        } else if (user.cursor) {
            console.error(user.cursor, 'cursor but no parentNode?');
        }
        
        user.li.parentNode.removeChild(user.li);
        delete ONLINE.users[id];
        menuControl.updateCount();
        menuControl.arrangeList();
        
        messageBuilder.showMessage({
            message : user.nick + ' has left' + (part ? ': ' + part : ''),
            messageType : 'general'
        });
    },
    changeRole : function (id, newRole) {
        ONLINE.users[id].role = newRole;
        if (Attributes.get('menu-order') == 'roles') {
           menuControl.arrangeList(); 
        }
    },
    changeNick : function (id, newNick) {
        var User = ONLINE.users[id],
            nickContain = User.li.getElementsByClassName('nickText')[0];
        
        messageBuilder.showMessage({
            message : User.nick + ' is now known as ' + newNick,
            messageType : 'general'
        });
        
        nickContain.textContent = newNick;
        User.nick = newNick;
        if (User.cursor) {
            User.cursor.setAttribute('data-nick', newNick);
        }
    },
    afk : function (id, message) {
        var user = ONLINE.users[id];
        if (user) {
            user.li.getElementsByClassName('informer')[0].innerHTML = emojione.toImage(parser.escape(message.replace(/\n/g, ' '), true));
            user.resetStatus('away');
        }
    },
    updateCount : function () {
        var length = Object.keys(ONLINE.users).length;
        $$$.query('.toggle-menu span').textContent = length;
        $$$.query('#countUsers').textContent = length + ' online';
    },
    contextMenu : {
        defaultOptions : {
            PM : {
                callback : function (nick) {
                    createPmPanel(ONLINE.getId(nick));
                }
            },
            whois : {
                callback : function (nick) {
                    clientSubmit.handleInput('/whois ' + nick);
                }
            },
            divider : '---',
            kick : {
                callback : function (nick) {
                    clientSubmit.handleInput('/kick ' + nick);
                }
            },
            ban : {
                callback : function (nick) {
                    clientSubmit.handleInput('/ban ' + nick);
                }
            },
            banip : {
                callback : function (nick) {
                    clientSubmit.handleInput('/banip ' + nick);
                }
            },
            find : {
                callback : function (nick) {
                    clientSubmit.handleInput('/find ' + nick);
                }
            }
        },
        placeMenu : function (id, options, stayOpen) {
            var options = options || this.defaultOptions,
                validUser = ONLINE.users[id],
                menu,
                userLi;
            
            function makeMenu() {
                var menuContainer = document.createElement('div'),
                    i;
                
                if (!stayOpen) {
                    menuContainer.id = 'tempMenu';
                }
                
                menuContainer.className = 'menuOptions';
                
                var keys = Object.keys(options);
                for (i = 0; i < keys.length; i++) {
                    var li = document.createElement('li'),
                        att = keys[i];
                    if (att !== 'divider') {
                        li.textContent = att;
                        li.onclick = function (e) {
                            userLi.removeChild(menuContainer);
                            options[this.textContent].callback(validUser.nick);
                        };
                    } else {
                        li.style.borderBottom = '1px solid black';
                        li.style.height = '0px';
                        li.style.padding = '0px';
                    }
                    menuContainer.appendChild(li);
                }
                
                return menuContainer;
            }
            
            if (validUser) {
                userLi = ONLINE.users[id].li;
                menu = userLi.getElementsByClassName('menuOptions');
                
                if (menu.length) {
                    userLi.removeChild(menu[0]);
                }
                menu = makeMenu();
                
                userLi.appendChild(menu);
            }
        }
    },
    HatUI : function (hats) {
        var hatNames = hats,
            i,
            hatPanel = document.getElementById('displayHats');
        
        hatPanel.innerHTML = '';
        
        for (i = 0; i < hatNames.length; i++) {
            var hatImg = new Image();
            hatImg.src = '/hats/' + hatNames[i];
            
            hatPanel.appendChild(hatImg);
            
            hatImg.onclick = function () {
                var split = this.src.split('/'),
                    splitUp = split[split.length - 1];

                clientSubmit.handleInput('/hat ' + splitUp.substr(0, splitUp.length - 4));
            };
        }
    },
    cursorUI : function (cursors) {
        var cursorNames = cursors,
            i,
            cursorPanel = document.getElementById('displayCursors');
            
        for (i = 0; i < cursorNames.length; i++) {
            var cursorImg = new Image();
            cursorImg.src = '/cursors/' + cursorNames[i];
            
            cursorPanel.appendChild(cursorImg);
            
            cursorImg.onclick = function () {
                var split = this.src.split('/'),
                    splitUp = split[split.length - 1];

                clientSubmit.handleInput('/cursor ' + splitUp.substr(0, splitUp.length - 4));
            }
        }
    },
    commandUI : function (commands) {
        var keys = Object.keys(commands),
            i,
            element,
            roles = ['ChannelOwner', 'Admin', 'Mod', 'Basic'],
            currentE;
        
        for (i = 0; i < keys.length; i++) {
            currentE = document.getElementById("command-" + keys[i]);
            element = document.createElement('li');
            
            if (currentE) {
                currentE.parentNode.removeChild(currentE);
            }
            
            element.id = "command-" + keys[i];
            element.textContent = keys[i];
            
            document.getElementById('cmd' + roles[commands[keys[i]] - 1]).getElementsByTagName('ul')[0].appendChild(element);
        }
    },
    style : {
        storedProfiles : [],
        UI : function (styleData) {
            var textStyle = document.getElementById('textStyle').children,
                sKeys,
                s,
                keys,
                r,
                att,
                i,
                currentProfile = Attributes.get('sProfile') || 0;
            
            if (styleData) {
                sKeys = Object.keys(styleData);
                if (this.storedProfiles[currentProfile]) {
                    for (s = 0; s < sKeys.length; s++) {
                        this.storedProfiles[currentProfile][sKeys[s]] = styleData[sKeys[s]];
                    }   
                } else {
                    this.storedProfiles[currentProfile] = styleData;
                }
            }
            
            profile = document.createElement('div');
            flair = document.createElement('div');
            hat = document.createElement('div');
            message = document.createElement('div');
            
            hat.className = 'hat';
            flair.className = 'nick';
            profile.className = 'message';

            profile.appendChild(hat);
            profile.appendChild(flair);
            profile.appendChild(message);
            
            if (this.storedProfiles[currentProfile]) {
                delete this.storedProfiles[currentProfile].nick;
                keys = Object.keys(this.storedProfiles[currentProfile]);
                for (r = 0; r < keys.length; r++) {
                    if (this.storedProfiles[currentProfile][keys[r]]) {
                        Attributes.set(keys[r], this.storedProfiles[currentProfile][keys[r]], true);
                    } else {
                        Attributes.remove(keys[r]);
                    }
                }
            }
            
            messageBuilder.filloutHTML({
                hat : hat,
                nick : flair,
                message : message,
                container : profile
            }, {
                hat : false,
                nick : Attributes.get('nick'),
                flair : Attributes.get('flair'),
                message : clientSubmit.message.decorateText('Example Text', this.storedProfiles[currentProfile])
            });
            
            for (i = 0; i < textStyle.length; i++) {
                att = textStyle[i].id.substr(5);
                if (att == 'font') {
                    textStyle[i].getElementsByTagName('input')[0].value = Attributes.get(att) || '';
                } else {
                    textStyle[i].lastChild.style.backgroundColor = Attributes.get(att) ? '#' + Attributes.get(att) : '#FFFFFF';
                }
            }
            
            document.getElementById('styleFlairView').innerHTML = '';
            document.getElementById('styleFlairView').appendChild(profile);
            document.getElementById('stylecolor').value = Attributes.get('color') || '#000000';
        }
    },
    ownerUI : function (owned) {
        if (owned) {
            document.getElementById('unowned').style.display = 'none';
            document.getElementById('owned').style.display = 'block';
        }
    },
    roleUI : function (channelRoles) {
        if (channelRoles) {
            var keys = Object.keys(channelRoles),
                i,
                element,
                roles = ['Admin', 'Mod'];

            for (i = 0; i < keys.length; i++) {
                element = document.createElement('li');
                element.textContent = keys[i];
                document.getElementById('role' + roles[channelRoles[keys[i]] - 2]).getElementsByTagName('ul')[0].appendChild(element);
            }   
        }
    },
    channelfont : function (font) {
        if (font && font.value) {
            parser.addFont(font.value);
            document.body.style.fontFamily = font.value;
            document.getElementById('chnlfont').value = font.value;
            if (!Attributes.get('font')) {
                parser.changeInput('font', font.value);
            }
        }
    },
    wordfilter : function (filter) {
        if (filter && filter.value != undefined) {
            Attributes.set('channel-filters', filter);
            document.getElementById('tglfilter').checked = filter.value;
        }
    },
    videomode : {
        player : null,
        videoplaylist : [],
        updateList : function (videolist) {
            var playlist = document.getElementById('playlist'),
                li,
                i;

            menuControl.videomode.videoplaylist = videolist;
            
            playlist.innerHTML = '';
            for (i = 0; i < videolist.length; i++) {
                li = document.createElement('li');
                li.textContent = videolist[i].title;
                playlist.appendChild(li);
            }
        },
        playNextVideo : function (videoID, startAt) {
            function timeSince(date) {
                var seconds = Math.floor((new Date() - date) / 1000);
                return Math.floor(seconds);
            };
            
            if (videoID != menuControl.videomode.videoplaylist[0].id) {
                menuControl.videomode.videoplaylist.shift();
                menuControl.videomode.updateList(menuControl.videomode.videoplaylist);
            }

            embed('youtube', menuControl.videomode.videoplaylist[0].id, true);
            menuControl.videomode.player = new YT.Player('iiframe', {
                events: {
                    'onReady': function (a) {
                        a.target.seekTo(timeSince(startAt));
                        a.target.playVideo();
                    },
                    'onStateChange': function (a) {
                        if (a.data === 0 && menuControl.videomode.videoplaylist.length === 1) {
                            menuControl.videomode.videoplaylist.shift();
                            menuControl.videomode.updateList(menuControl.videomode.videoplaylist);
                        }
                    }
                }
            });
        }
    },
    channels : function (active) {
        var keys = Object.keys(active),
            table = document.getElementById('activeChannels').getElementsByTagName('tbody')[0],
            pan,
            channelName,
            channelinfo,
            channelTags,
            i;
        
        while (table.getElementsByTagName('td').length) {
            table.getElementsByTagName('td')[0].parentNode.removeChild(table.getElementsByTagName('td')[0]);
        }
        
        for (i = 0; i < keys.length; i++) {
            tr = document.createElement('tr');
            tr.className = 'pan';
            
            channelName = document.createElement('td');
            channelName.textContent = active[keys[i]].name;
            
            channelonline = document.createElement('td');
            channelonline.textContent = active[keys[i]].online;
            
            channelTags = document.createElement('td');
            channelTags.textContent = 'none';
            
            tr.appendChild(channelName);
            tr.appendChild(channelonline);
            tr.appendChild(channelTags);
            
            table.appendChild(tr);
        }
    },
    toggles : function () {
        var toggleList = document.getElementById('toggles').getElementsByTagName('li'),
            selectedButton,
            att,
            i;
        
        for (i = 0; i < toggleList.length; i++) {
            att = toggleList[i].id.split('-')[1];
            selectedButton = toggleList[i].getElementsByClassName('selectedButton')[0];
            if (selectedButton) {
                selectedButton.className = ''
            }
            if (Attributes.get('toggle-' + att)) {
                toggleList[i].children[1].className = 'selectedButton';
            } else {
                toggleList[i].children[2].className = 'selectedButton'
            }
        }
        
    },
    initMissedMessages : function (socket) {
        var unread = 0;
        
        socket.on('message', function () {
            if (window.blurred && ++unread) {
                document.title = '(' + unread + ') ' + (Attributes.get('topic').value || 'Awakens - The chat that never sleeps');
            }
        });

        window.addEventListener('focus', function () {
            unread = 0;
            window.blurred = false;
            document.title = (Attributes.get('topic') && Attributes.get('topic').value) || 'Awakens - The chat that never sleeps';
        });
        
        window.addEventListener('blur', function () {
            window.blurred = true;
        });
    },
    initMenuUI : function (socket) {
        socket.on('channeldata', function (channel) {
            var i;

            if (channel.users) {
                document.getElementById('listedUsers').innerHTML = '';
                ONLINE.users = {};
                for (i = 0; i < channel.users.length; i++) {            
                    menuControl.addUser(channel.users[i].id, channel.users[i].nick, channel.users[i].role, channel.users[i].afk, true);
                }
            }

            if (channel.hats) {
                menuControl.HatUI(channel.hats); 
            }

            if (channel.cursors) {
                menuControl.cursorUI(channel.cursors);
            }

            if (channel.commandRoles) {
                menuControl.commandUI(channel.commandRoles);
            }
            
            if (channel.videomode) {
                menuControl.videomode.updateList(channel.videomode);
            }
            
            if (channel.styles) {
                menuControl.style.storedProfiles = channel.styles;
                menuControl.style.UI();
            } else if (!menuControl.style.storedProfiles.length) {
                menuControl.style.UI({
                    flair : Attributes.get('flair') || '',
                    cursor : Attributes.get('cursor') || '',
                    part : Attributes.get('part') || '',
                    font : Attributes.get('font') || '',
                    color : Attributes.get('color') || '',
                    bgcolor : Attributes.get('bgcolor') || '',
                    glow : Attributes.get('glow') || '',
                    style : Attributes.get('style') || '',
                    hat : Attributes.get('hats') || ''
                });
            }
            
            menuControl.toggles();
        });
        
        socket.on('update', function (data)  {
            if (data.nick) {
                menuControl.style.UI({
                    flair : Attributes.get('flair') || '',
                    cursor : Attributes.get('cursor') || '',
                    part : Attributes.get('part') || '',
                    font : Attributes.get('font') || '',
                    color : Attributes.get('color') || '',
                    bgcolor : Attributes.get('bgcolor') || '',
                    glow : Attributes.get('glow') || '',
                    style : Attributes.get('style') || '',
                    hat : Attributes.get('hats') || ''
                });
            }

            if (data['channel-video'] !== undefined) {
                document.getElementById('tglvideo').checked = data['channel-video'];
                document.getElementById('playlist').innerHTML = '';
            }
        });
        
        socket.on('idleStatus', menuControl.idleStatus);
        
        socket.on('joined', menuControl.addUser);

        socket.on('nick', menuControl.changeNick);
        
        socket.on('changeRole', menuControl.changeRole);

        socket.on('typing', menuControl.typing);

        socket.on('afk', menuControl.afk);

        socket.on('left', menuControl.removeUser);
        
        socket.on('activeChannels', menuControl.channels);
        socket.emit('activeChannels');
        
        socket.on('playVideo', menuControl.videomode.playNextVideo);
    },
    typing : function (id, typing) {
        var user = ONLINE.users[id];
        if (user) {
            if (typing) {
                user.li.children[0].classList.add('typing');
            } else {
                user.li.children[0].classList.remove('typing');
            }
        }
    }
};

function showFlairMakerPanel() {
    var StylingNick = Attributes.get('nick'),
        container = document.createElement('div'),
        flairViewContainer = document.createElement('div'),
        flairView = document.createElement('div'),
        flairEditContain = document.createElement('div'),
        flairEditInput = document.createElement('input'),
        flairLabel = document.createElement('div'),
        cancel = document.createElement('span'),
        
        fontPickerLabel = document.createElement('div'),
        fontPickerContainer = document.createElement('div'),
        fontInput = document.createElement('input'),
        loadFont = document.createElement('button'),
        fontMsg = document.createElement('span'),
        useableFonts = document.createElement('a'),
        
        
        colorPickerLabel = document.createElement('div'),
        colorPickerContainer = document.createElement('div'),
        colorstyleholder = document.createElement('div'),
        
        bgcolorPickerLabel = document.createElement('div'),
        bgcolorPickerContainer = document.createElement('div'),
        bgcolorstyleholder = document.createElement('div'),
        
        styleLabel = document.createElement('div'),
        styleContainer = document.createElement('div'),
        
        startContainer,
        endContainer,

        styleButtons = {
            B : {
                name : 'font-weight',
                value : 'bold'
            },
            I : {
                name : 'transform',
                value : 'skewX(-15deg)'
            }
        },
        styleButtonKeys = Object.keys(styleButtons),
        
        rl = {
            color : {
                add : true,
                value : '#'
            },
            'background-color' : {
                add : true,
                value : '##'
            },
            'font-weight' : {
                value : '/*'
            },
            'transform' : {
                value : '/%'
            }
        },
        
        currentStyling = [],
        colors = ['#1abc9c', '#f1c40f', '#2ecc71', '#e67e22', '#3498db', '#e74c3c', '#9b59b6', '#ecf0f1', '#34495e', '#95a5a6'];
    
    function indexOfStyleEl(el) {
        var children = flairView.children;
        for (var i = 0; i < children.length; i++) {
            if (children[i] == el) {
                return i;
            }
        }
    }
    
    function breakIntoSpans(el) {
        var index = 0,
            newBufflo = document.createElement('div'),
            currentStyle = {},
            keys;
        
        function breakUpText(text) {
            var i = 0,
                s = 0,
                span;
            for (i = 0; i < text.nodeValue.length; i++) {
                span = document.createElement('span');
                if (currentStyling[index]) {
                    keys = Object.keys(currentStyle);
                    for (s = 0; s < keys.length; s++) {
                        if (keys[s] == 'font-family') {
                            flairView.style.fontFamily = currentStyle[keys[s]];
                            fontInput.value = currentStyle[keys[s]].replace(/"/g, '');
                        } else {
                            span.style.cssText += keys[s] + ': ' + currentStyle[keys[s]] + ';';
                        }
                    }
                }
                span.textContent = text.nodeValue[i];
                newBufflo.appendChild(span);
            }
            index += text.nodeValue.length;
        }
        
        function breakUpSpan(chl) {
            var children = chl.childNodes,
                styles = [],
                i,
                s;
            
            for (i = 0; i < children.length; i++) {
                if (children[i].nodeName == '#text') {
                    breakUpText(children[i]);
                } else {
                    for (s = 0; s < children[i].style.length; s++) {
                        if (!currentStyling[index]) {
                            currentStyling[index] = {};
                        }
                        currentStyling[index][children[i].style[s]] = children[i].style[children[i].style[s]];
                        currentStyle[children[i].style[s]] = children[i].style[children[i].style[s]];
                    }
                    breakUpSpan(children[i]);
                }
            }
        }
        
        breakUpSpan(el);
        flairView.innerHTML = newBufflo.innerHTML;
        getFlair();
    }
    
    function getFlair() {
        var pipes = {};
        flairEditInput.value = '';
        
        function rgbToHex(r, g, b) {
            return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
        
        for (var i = 0; i < StylingNick.length; i++) {
            var rgb,
                keys;
            if (currentStyling[i]) {
                keys = Object.keys(currentStyling[i]);
                for (var s = 0; s < keys.length; s++) {
                    if (currentStyling[i] && currentStyling[i][keys[s]]) {
                        if (keys[s] == 'font-family') {
                            flairEditInput.value += '$' + currentStyling[i][keys[s]] + '|';
                            flairView.style.fontFamily = currentStyling[i][keys[s]];
                            parser.addFont(currentStyling[i][keys[s]]);
                        } else {
                            if (rl[keys[s]]) {
                                flairEditInput.value += rl[keys[s]].value;
                                if (typeof currentStyling[i][keys[s]] == 'object') {
                                    pipes[currentStyling[i][keys[s]][1]] = true
                                }
                                if (rl[keys[s]].add) {
                                    rgb = currentStyling[i][keys[s]].match(/rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/);
                                    if (rgb) {
                                        flairEditInput.value += rgbToHex(parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3]));
                                    } else {
                                        flairEditInput.value += currentStyling[i][keys[s]];
                                    }   
                                }   
                            }                                                   
                        }
                    }
                }
            }
            flairEditInput.value += StylingNick[i];
            
            if (pipes[i]) {
                flairEditInput.value += '|';
            }
        }

        Attributes.set('flair', flairEditInput.value, true);
    }
    
    function styleize(start, end, value, type) {
        var startIndex = indexOfStyleEl(start),
            endIndex = indexOfStyleEl(end),
            needToMove;
        
        if (!currentStyling[startIndex]) {
            currentStyling[startIndex] = {};
        }
        
        for (var index = startIndex; index <= endIndex; index++) {
            if (!currentStyling[index]) {
                currentStyling[index] = {};
            }
 
            if (currentStyling[index][type]) {
                needToMove = {
                    type : type,
                    value : currentStyling[index][type]
                }
                delete currentStyling[index][type];
            }
            
            flairView.children[index].style[type] = value;
        }

        if (!rl[type].add) {
            currentStyling[startIndex][type] = [value, endIndex];
        } else {
            currentStyling[startIndex][type] = value;
        }
        
        if (needToMove && currentStyling[++endIndex] && !currentStyling[endIndex][needToMove.type]) {
            currentStyling[endIndex][needToMove.type] = needToMove.value;
        }

        getFlair();
    }
    
    container.id = 'flairPanel';
    
    flairViewContainer.id = 'flairView';
    flairViewContainer.className = 'nick';
    flairView.innerHTML = parser.flair(Attributes.get('flair'), Attributes.get('nick'));
    flairViewContainer.appendChild(flairView);
    breakIntoSpans(flairView);
    flairLabel.textContent = 'Flair View';
    flairLabel.className = 'flairpanellabel';
    cancel.textContent = 'X';
    cancel.id = 'closeFlairPanel';
    flairLabel.appendChild(cancel);
    container.appendChild(flairLabel);
    container.appendChild(flairViewContainer);
    
    cancel.addEventListener('click', function () {
        document.body.removeChild(container);
    });
    
    flairView.addEventListener('mouseup', function (e) {
        var range = window.getSelection().getRangeAt(0);
        startContainer = range.startContainer.parentNode;
        endContainer = range.endContainer.parentNode;
        console.log(startContainer, endContainer);
    });
    
    flairEditInput.id = 'flairEditInput';
    flairEditContain.id = 'flairEditContain';
    flairEditContain.appendChild(flairEditInput);
    container.appendChild(flairEditContain);
    
    //font picker
    fontPickerLabel.textContent = 'Font';
    fontPickerLabel.className = 'flairpanellabel';
    fontPickerContainer.id = 'flairFont';
    fontPickerContainer.className = 'colorHoldContainer';
    fontInput.placeholder = 'Font name here';
    fontMsg.textContent = 'case-sensitive';
    fontMsg.id = 'fontMsg';
    useableFonts.textContent = 'Fonts here';
    useableFonts.target = '_blank';
    useableFonts.href = 'https://fonts.google.com/';
    loadFont.textContent = 'Load';
    fontPickerContainer.appendChild(fontPickerLabel);
    fontPickerContainer.appendChild(fontInput);
    fontPickerContainer.appendChild(loadFont);
    fontPickerContainer.appendChild(document.createElement('br'));
    fontPickerContainer.appendChild(fontMsg);
    fontPickerContainer.appendChild(useableFonts);
    container.appendChild(fontPickerContainer);
    
    loadFont.addEventListener('click', function () {
        if (!currentStyling[0]) {
            currentStyling[0] = {};
        }
        currentStyling[0]['font-family'] = parser.findFontName(fontInput.value);
        getFlair();
    });
    
    //color picker
    colorPickerLabel.textContent = 'Text Color';
    colorPickerLabel.className = 'flairpanellabel';
    colorPickerContainer.className = 'colorHoldContainer';
    colorPickerContainer.appendChild(colorPickerLabel);
    colorPickerContainer.appendChild(colorstyleholder);
    container.appendChild(colorPickerContainer);
    colorstyleholder.className = 'colorHolder';
    
    for (var i = 0; i < colors.length; i++) {
        var colorPick = document.createElement('span');
        colorPick.style.backgroundColor = colors[i];
        colorstyleholder.appendChild(colorPick);
        colorPick.addEventListener('click', function () {
            styleize(startContainer, endContainer, this.style.backgroundColor, 'color');
        });
    }
    
    //background picker
    bgcolorPickerLabel.textContent = 'Background Color';
    bgcolorPickerLabel.className = 'flairpanellabel';
    bgcolorPickerContainer.className = 'colorHoldContainer';
    bgcolorPickerContainer.appendChild(bgcolorPickerLabel);
    bgcolorPickerContainer.appendChild(bgcolorstyleholder);
    container.appendChild(bgcolorPickerContainer);
    bgcolorstyleholder.className = 'colorHolder';
    
    
    for (var i = 0; i < colors.length; i++) {
        var colorPick = document.createElement('span');
        colorPick.style.backgroundColor = colors[i];
        bgcolorstyleholder.appendChild(colorPick);
        colorPick.addEventListener('click', function () {
            styleize(startContainer, endContainer, this.style.backgroundColor, 'background-color');
        });
    }
    
    /*styleLabel.textContent = 'Styles';
    styleLabel.className = 'flairpanellabel';
    styleContainer.appendChild(styleLabel);
    container.appendChild(styleContainer);
    
    for (var i = 0; i < styleButtonKeys.length; i++) {
        var button = document.createElement('button');
        button.id = styleButtonKeys[i];
        button.textContent = styleButtonKeys[i];
        button.addEventListener('click', function () {
            styleize(startContainer, endContainer, styleButtons[this.id].value, styleButtons[this.id].name);
        });
        styleContainer.appendChild(button);
    }*/
    
    
    $$$.draggable(container, 'nick');
    
    if (document.getElementById('flairPanel')) {
        document.body.removeChild(document.getElementById('flairPanel'));
    }
    document.body.appendChild(container);
}


(function () {
    var buttons = document.createElement('cmdOptions'),
        ownerbtn = document.createElement('button'),
        adminbtn = document.createElement('button'),
        modbtn = document.createElement('button'),
        basicbtn = document.createElement('button');
    
    buttons.id = "cmdOptions";
    ownerbtn.textContent = 'Owner';
    adminbtn.textContent = 'Admin';
    modbtn.textContent = 'Mod';
    basicbtn.textContent = 'Basic';
    
    ownerbtn.className = 'customButton';
    adminbtn.className = 'customButton';
    modbtn.className = 'customButton';
    basicbtn.className = 'customButton';
    
    buttons.appendChild(ownerbtn);
    buttons.appendChild(adminbtn);
    buttons.appendChild(modbtn);
    buttons.appendChild(basicbtn);
    
    ownerbtn.addEventListener('click', function (e) {
        var cmdID = this.parentNode.parentNode.id;
        clientSubmit.handleInput('/lockcommand ' + cmdID.substr(8, cmdID.length) + ' ' + '1');
    });
    
    adminbtn.addEventListener('click', function (e) {
        var cmdID = this.parentNode.parentNode.id;
        clientSubmit.handleInput('/lockcommand ' + cmdID.substr(8, cmdID.length) + ' ' + '2');
    });
    
    modbtn.addEventListener('click', function (e) {
        var cmdID = this.parentNode.parentNode.id;
        clientSubmit.handleInput('/lockcommand ' + cmdID.substr(8, cmdID.length) + ' ' + '3');
    });
    
    basicbtn.addEventListener('click', function (e) {
        var cmdID = this.parentNode.parentNode.id;
        clientSubmit.handleInput('/lockcommand ' + cmdID.substr(8, cmdID.length) + ' ' + '4');
    });
    
    document.getElementById('manageCommands').addEventListener('click', function (e) {
        var target = e.target,
            currentMenu = document.getElementById('cmdOptions');
        
        if (currentMenu) {
            currentMenu.parentNode.removeChild(currentMenu);
        }
        
        if (target.nodeName == "LI") {
            target.appendChild(buttons);
        }
    });
    
    //sort userlist
    document.getElementById('sortUsers').addEventListener('click', function () {
        if (Attributes.get('menu-order') == 'roles') {
            Attributes.remove('menu-order');
        } else {
            Attributes.set('menu-order', 'roles');
        }
        menuControl.arrangeList();
    });
    
    //style profiles
    document.getElementById('stylePro').addEventListener('click', function (e) {
        var target = e.target,
            input;

        if (target.className == 'trash') {
            menuControl.style.UI({
                [target.parentNode.parentNode.id.slice(5)] : undefined
            });
            socket.emit('saveProfile', menuControl.style.storedProfiles[0]);
        } else if (target.parentNode.className == 'colorpicker') {
            target = target.parentNode;
        }
        
        if (target.className == 'colorpicker') {
            $$$.palette(target, function (color) {
                menuControl.style.UI({
                    [target.parentNode.id.slice(5)] : color
                });
            }, function () {
                socket.emit('saveProfile', menuControl.style.storedProfiles[0]);
            });
        } else if (target.nodeName == 'BUTTON') {
            input = target.parentNode.getElementsByTagName('input')[0];
            menuControl.style.UI({
                [target.parentNode.id.slice(5)] : input.value
            });
        }
    });
    
    //custom cursors
    document.getElementById('customCursor').getElementsByTagName('button')[0].addEventListener('click', function () {
        var uploadPanel = document.getElementById('uploadTextarea');
        if (uploadPanel.style.display == 'none') {
            uploadPanel.style.display = 'block';
            this.textContent = 'Click here to upload';
        } else {
            socket.emit('uploadCursor', uploadPanel.getElementsByTagName('textarea')[0].value);
        }
    });
    
    //channel fonts
    document.getElementById('chnlfont').addEventListener('keydown', function () {
        var btn = document.getElementById('loadfont');
        btn.style.display = 'block';
    });
    
    document.getElementById('loadfont').addEventListener('click', function () {
        clientSubmit.handleInput('/channelfont ' + document.getElementById('chnlfont').value);
        this.style.block = 'hidden';
    });
    
    //fitlers toggle
    document.getElementById('tglfilter').addEventListener('click', function () {
        if (this.checked) {
            clientSubmit.handleInput('/wordfilteron')
        } else {
            clientSubmit.handleInput('/wordfilteroff')
        }
    });
    
    //show flair maker button
    document.getElementById('showFlairMaker').addEventListener('click', showFlairMakerPanel);
    
    document.getElementById('showActiveChannels').addEventListener('click', function () {
        socket.emit('activeChannels');
        $$$.tabber('menu-panels', 'activeChannels');
    });
    
    //toggles UI
    document.getElementById('toggles').getElementsByTagName('ul')[0].addEventListener('click', function (e) {
        var target = e.target,
            parent = target.parentNode;

        if (target.nodeName == 'BUTTON') {
            if (target.id == 'setTrue') {
                Attributes.set('toggle-' + parent.id.split('-')[1], true);
            } else if (target.id == 'setFalse') {
                Attributes.set('toggle-' + parent.id.split('-')[1], false);
            }
        }
    });
    
    //video mode
    document.getElementById('tglvideo').addEventListener('click', function () {
        var videoModePanel;
        Attributes.set('channel-video', this.checked);
        if (this.checked) {
            clientSubmit.handleInput('/enablevideomode');
        } else {
            clientSubmit.handleInput('/disablevideomode');
            videoModePanel = document.getElementById('a-video-overlay');
            document.body.removeChild(videoModePanel);
        }
    });
    
    document.getElementById('videoModeControls').getElementsByTagName('button')[0].addEventListener('click', function (e) {
        var input = document.getElementById('videoModeControls').getElementsByTagName('input')[0];
        
        if (input.style.display == 'block') {
            clientSubmit.handleInput('/addvideo ' + input.value);
        } else {
            input.style.display = 'block';
            this.textContent = 'Click to submit';
        }
    });
    
})();

(function () {
    var i,
        closing = false,
        timeOut;
    
    $$$.query('.toggle-menu').addEventListener('click', function () {
        var menuContainer = document.getElementById('menu-container'),
            messages = document.getElementById('messages'),
            currentScroll = messages.scrollTop,
            contextMenu = document.getElementById('menuOptions');

        if (closing) {
            if (contextMenu) {
                document.body.removeChild(contextMenu); 
            }
            menuContainer.style.width = '0px';
            closing = false;
            messages.scrollTop = currentScroll;
            clearTimeout(timeOut);
            timeOut = setTimeout(function () {
                menuContainer.style.display = 'none';
            }, 500);
        } else {
            menuContainer.style.width = '0px';
            menuContainer.style.display = 'flex';
            closing = true;
            messages.scrollTop = currentScroll;
            clearTimeout(timeOut);
            timeOut = setTimeout(function () {
                menuContainer.style.width = '300px';
            }, 10);
        }
        
        this.style.backgroundColor = '';
    });
    
    document.body.addEventListener('mouseup', function (e) {
        var menu = document.getElementById('tempMenu'),
            target = e.target.parentNode;
        
        if (menu && menu !== target) {
            menu.parentNode.removeChild(menu);
        }
    });
})();