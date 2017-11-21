var menuControl = {
    addUser : function (id, nick, afk, noShow) {
        var nickContain = document.createElement('div'),
            nickText = document.createElement('div'),
            extraInfo = document.createElement('div');
        
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
        
        document.getElementById('userList').appendChild(nickContain);
        
        ONLINE.users[id] = {
            nick : nick,
            li : nickContain,
            resetStatus : function () {
                var status = this;
                if (status.idleStatus) {
                    clearTimeout(status.idleStatus);
                }
                
                status.idleStatus = setTimeout(function () {
                    socket.emit('idleStatus', true);
                    status.idleStatus = setTimeout(function () {
                        socket.emit('idleStatus', false);
                    }, 90000);
                }, 3600000);
            }
        };
        
        ONLINE.users[id].resetStatus();
        menuControl.updateCount();
        
        if (afk) {
            menuControl.afk(id, afk);
        }
        
        if (noShow === undefined) {
            showMessage({
                message : nick + ' has joined',
                messageType : 'general'
            });
        }
        
        if (document.getElementsByClassName('LoginPanel').length !== 0 && nick === Attributes.get('nick')) {
            document.body.removeChild(document.getElementsByClassName('LoginPanel')[0].parentNode);
        }
    },
    removeUser : function (id, part) {
        var user = ONLINE.users[id],
            pmPanel = document.getElementById('PmPanel-' + id);
        
        if (pmPanel) {
            showMessage({
                message : user.nick + ' disconnected',
                messageType : 'error'
            }, pmPanel.getElementsByClassName('messages')[0]);
        }
        
        if (user.cursor) {
            user.cursor.parentNode.removeChild(user.cursor);
        }
        
        document.getElementById('userList').removeChild(user.li);
        delete ONLINE.users[id];
        
        menuControl.updateCount();

        showMessage({
            message : user.nick + ' has left' + (part ? ': ' + part : ''),
            messageType : 'general'
        });
    },
    changeNick : function (id, newNick) {
        var User = ONLINE.users[id],
            nickContain = User.li.getElementsByClassName('nickText')[0];
        
        showMessage({
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
        }
    },
    idleStatus : function (id, status) {
        var user = ONLINE.users[id];
        if (user) {
            user.li.children[0].classList.remove('away', 'unavailable');
            if (status) {
                user.li.children[0].classList.add('away');
            } else {
                user.li.children[0].classList.add('unavailable');
            }
        }
    },
    updateCount : function () {
        var length = Object.keys(ONLINE.users).length;
        $$$.query('.toggle-menu span').textContent = length;
        //$$$.query('#userList').textContent = 'User list (' + length + ')';
    },
    updateValues : function () {
        var allBars = document.getElementsByClassName('bar'),
            i,
            color;
        
        for (i = 0; i < allBars.length; i++) {
            color = Attributes.get(allBars[i].classList[1]);
            if (color) {
                allBars[i].getElementsByTagName('input')[0].value = color;
                allBars[i].getElementsByClassName('label')[0].style.backgroundColor = color;
                allBars[i].getElementsByClassName('label')[0].classList.remove('transparent');
            } else {
                allBars[i].getElementsByTagName('input')[0].value = '';
                allBars[i].getElementsByClassName('label')[0].style.backgroundColor = '';
                allBars[i].getElementsByClassName('label')[0].classList.add('transparent');
            }
        }
        
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
            
            function makeMenu () {
                var menuContainer = document.createElement('div');
                
                if (!stayOpen) {
                    menuContainer.id = 'tempMenu';
                }
                
                menuContainer.className = 'menuOptions';
                
                var keys = Object.keys(options);
                for(var i = 0; i < keys.length; i++){
                    var li = document.createElement('li');
                    var att = keys[i];
                    if (att !== 'divider') {
                        li.textContent = att;
                        li.onclick = function(e){
                            userLi.removeChild(menuContainer);
                            options[this.textContent].callback(validUser.nick);
                        }
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
            document.title = Attributes.get('topic').value || 'Awakens - The chat that never sleeps';
        });
        
        window.addEventListener('blur', function () {
            window.blurred = true;
        });
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
    });
    
    document.body.addEventListener('mouseup', function (e) {
        var menu = document.getElementById('tempMenu'),
            target = e.target.parentNode;
        
        if (menu && menu !== target) {
            menu.parentNode.removeChild(menu);
        }
    });
})();