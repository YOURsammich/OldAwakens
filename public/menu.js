var menuControl = {
    addUser : function (id, nick, noShow) {
        var nickContain = document.createElement('div'),
            nickText = document.createElement('div'),
            extraInfo = document.createElement('div');
        
        nickContain.className = 'nickContain';
        extraInfo.className = 'informer';
        nickText.className = 'nickText';
        nickText.textContent = nick;
        
        nickContain.addEventListener('click', function (e) {
            var target = e.target;
            if (target.className === 'nickText') {
                menuControl.contextMenu.placeMenu(e.clientX, e.clientY, id);
            }
        });
        
        nickContain.appendChild(nickText);
        nickContain.appendChild(extraInfo);
        
        document.getElementsByClassName('userList')[0].appendChild(nickContain);
        
        ONLINE.users[id] = {
            nick : nick,
            li : nickContain
        };
        
        if (document.getElementsByClassName('loginPanel').length !== 0 && nick === Attributes.get('nick')) {
            document.body.removeChild(document.getElementsByClassName('loginPanel')[0]);
        }
        
        menuControl.updateCount();
        
        if (noShow === undefined) {
            showMessage({
                message : nick + ' has joined',
                messageType : 'general'
            });
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
        
        showMessage({
            message : user.nick + ' has left',
            messageType : 'general'
        });
    },
    changeNick : function (id, newNick) {
        var User = ONLINE.users[id];
        
        showMessage({
            message : User.nick + ' is now known as ' + newNick,
            messageType : 'general'
        });
        
        User.li.textContent = newNick;
        User.nick = newNick;
        
    },
    updateCount : function () {
        var length = Object.keys(ONLINE.users).length;
        $$$.query('.toggle-menu span').textContent = length;
        document.getElementById('userList').textContent = length;
    },
    updateValues : function () {
        var allBars = document.getElementsByClassName('bar'),
            className,
            i;
        
        for (i = 0; i < allBars.length; i++) {
            className = allBars[i].classList[1];

            allBars[i].getElementsByClassName('label')[0].style.backgroundColor = Attributes.get(className);
            allBars[i].getElementsByClassName('label')[0].style.borderBottom = 'solid 2px #' + Attributes.get(className);
            allBars[i].getElementsByTagName('input')[0].value = Attributes.get(className);
        }
        
    },
    contextMenu : {
        options : {
            PM : {
                callback : function (nick) {
                    createPmPanel(ONLINE.getId(nick));
                }  
            },
            whois : {
                callback : function (nick) {
                    handleInput('/whois ' + nick);
                }
            },
            divider : '---',
            kick : {
                callback : function (nick) {
                    handleInput('/kick ' + nick);
                }
            }
        },
        placeMenu : function (X, Y, id) {
            var menu = document.getElementById('context-menu'),
                options = this.options,
                validUser = ONLINE.users[id];
            
            function makeMenu () {
                var menuContainer = document.createElement('div'),
                    header;
                
                menuContainer.id = 'context-menu';
                menuContainer.style.left = X + 'px';
                menuContainer.style.top = (Y - menuContainer.offsetHeight) + 'px';
                
                header = document.createElement('header');
                header.textContent = validUser.nick;
                
                menuContainer.appendChild(header);
                
                var keys = Object.keys(options);
                for(var i = 0; i < keys.length; i++){
                    var li = document.createElement('li');
                    var att = keys[i];
                    if (att !== 'divider') {
                        li.textContent = att;
                        li.onclick = function(e){
                            document.body.removeChild(menuContainer);
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
                if (menu) {
                    document.body.removeChild(menu);
                }
                menu = makeMenu();
                menu.addEventListener('mouseleave', function () {
                    document.body.removeChild(menu);
                });
                document.body.appendChild(menu);
            }
        }
    }
};

(function () {
    var allBars = document.getElementsByClassName('bar'),
        i;
    
    for (i = 0; i < allBars.length; i++) {
        allBars[i].addEventListener('mousemove', function () {
            this.getElementsByTagName('input')[0].focus();
            this.getElementsByClassName('label')[0].style.height = '0px';
            this.getElementsByClassName('label')[0].style.top = '0px';
        });
        
        allBars[i].addEventListener('mouseleave', function () {
            $$$.query('#input-bar textarea').focus();
            this.getElementsByClassName('label')[0].style.height = '100%';
            this.getElementsByClassName('label')[0].style.top = '-20px';
        });
        
        allBars[i].getElementsByTagName('input')[0].addEventListener('keydown', function (e) {
            if (e.which === 13) {
                sendCommand(this.parentNode.classList[1], {
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
        
        if (target.nodeName === 'BUTTON') {
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

        var menuContainer = document.getElementsByClassName('menu-container')[0];

        if (menuContainer.style.width === '300px') {
            menuContainer.style.width = '0px';
            setTimeout(function () {
                menuContainer.style.display = 'none'; 
            }, 1000);
        } else {
            menuContainer.style.display = 'block'; 
            setTimeout(function () {
                menuContainer.style.width = '300px';
            }, 10);
        }

    }); 
})();