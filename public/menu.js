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
        
        document.getElementsByClassName('userList')[0].appendChild(nickContain);
        
        ONLINE.users[id] = {
            nick : nick,
            li : nickContain
        };
        
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
    removeUser : function (id) {
        var user = ONLINE.users[id],
            pmPanel = document.getElementById('PmPanel-' + id);
        
        if (pmPanel) {
            showMessage({
                message : user.nick + ' disconnected',
                messageType : 'error'
            }, pmPanel.getElementsByClassName('messages')[0]);
        } 
        
        document.getElementsByClassName('userList')[0].removeChild(user.li);
        delete ONLINE.users[id];
        
        menuControl.updateCount();
        
        if (user.cursor) {
            user.cursor.parentNode.removeChild(user.cursor);
        }
        
        showMessage({
            message : user.nick + ' has left',
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
            user.li.getElementsByClassName('informer')[0].textContent = message;
        }
    },
    updateCount : function () {
        var length = Object.keys(ONLINE.users).length;
        $$$.query('.toggle-menu span').textContent = length;
        document.getElementById('userList').textContent = length;
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
        var blurred = false,
            unread = 0;
        
        socket.on('message', function () {
            if (blurred && ++unread) {
                document.title = '(' + unread + ') ' + Attributes.get('topic').value;
            }
        });

        window.addEventListener('focus', function () {
            unread = 0;
            blurred = false;
            document.title = Attributes.get('topic').value;
        });
        
        window.addEventListener('blur', function () {
            blurred = true;
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
    var allBars = document.getElementsByClassName('bar'),
        i,
        closing = false,
        timeOut;
    
    for (i = 0; i < allBars.length; i++) {
        allBars[i].addEventListener('mousemove', function () {
            this.getElementsByTagName('input')[0].focus();
            this.getElementsByClassName('label')[0].style.height = '0%';
            this.getElementsByClassName('label')[0].style.top = '0px';
        });
        
        allBars[i].addEventListener('mouseleave', function () {
            $$$.query('#input-bar textarea').focus();
            this.getElementsByClassName('label')[0].style.height = '22px';
            this.getElementsByClassName('label')[0].style.top = '-22px';
        });
        
        allBars[i].getElementsByTagName('input')[0].addEventListener('keydown', function (e) {
            if (e.which === 13) {
                clientSubmit.command.send(this.parentNode.classList[1], {
                    color : this.value
                });
            }
        });
    }
    
    document.getElementById('menu-tabs').addEventListener('click', function (e) {
        var target = e.target,
            tabs = this.children,
            panel,
            i;
        
        if (target.nodeName === 'LI') {
            for (i = 0; i < tabs.length; i++) {
                panel = document.getElementsByClassName(tabs[i].id)[0];
                if (target.id === panel.className) {
                    panel.style.display = 'block';
                } else {
                    panel.style.display = 'none';
                }
            }
        }
    });
    
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
            messages.style.width = '100%';
            closing = false;
            messages.scrollTop = currentScroll;
            clearTimeout(timeOut);
            timeOut = setTimeout(function () {
                menuContainer.style.display = 'none';
            }, 1000);
        } else {
            menuContainer.style.display = 'block';
            closing = true;
            messages.scrollTop = currentScroll;
            clearTimeout(timeOut);
            timeOut = setTimeout(function () {
                menuContainer.style.width = '300px';
                messages.style.width = 'calc(100% - 300px)';
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