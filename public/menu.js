var menuControl = {
    addUser : function (id, nick, noShow) {
        var li = document.createElement('li');
        
        li.textContent = nick;
        
        document.getElementById('user-list').appendChild(li);
        
        ONLINE.users[id] = {
            nick : nick,
            li : li
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
        var User = ONLINE.users[id];
        
        document.getElementById('user-list').removeChild(User.li);
        delete ONLINE.users[id];
        
        menuControl.updateCount();
        
        showMessage({
            message : User.nick + ' has left',
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
        $$$.query('.toggle-menu span').textContent = Object.keys(ONLINE.users).length;
    },
    updateValues : function () {
        var allBars = document.getElementsByClassName('bar'),
            className,
            i;
        
        for (i = 0; i < allBars.length; i++) {
            className = allBars[i].classList[1];

            allBars[i].getElementsByClassName('label')[0].style.backgroundColor = Attributes.get(className);
            allBars[i].getElementsByClassName('label')[0].style.borderBottom = 'solid 2px #' + Attributes.get(className);
            allBars[i].getElementsByTagName('input').value = Attributes.get(className);
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
    
    $$$.query('.toggle-menu').addEventListener('click', function () {

        var menuContainer = document.getElementsByClassName('menu-container')[0];

        if (menuContainer.style.width === '300px') {
            menuContainer.style.width = '0px';
        } else {
            menuContainer.style.width = '300px';
        }

    }); 
})();