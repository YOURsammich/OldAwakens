var menuControl = {
    addUser : function (id, nick, noShow) {
        var li = document.createElement('li');
        
        li.textContent = nick;
        
        document.getElementById('user-list').appendChild(li);
        
        ONLINE.users[id] = {
            nick : nick,
            li : li
        };
        
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
    }
};

$$$.query('.toggle-menu').addEventListener('click', function () {
    
    var menuContainer = document.getElementsByClassName('menu-container')[0];
    
    if (menuContainer.style.width === '300px') {
        menuContainer.style.width = '0px';
    } else {
        menuContainer.style.width = '300px';
    }
        
});