var menuControl = {
    addUser : function (id, nick) {
        var li = document.createElement('li');
        
        li.textContent = nick;
        
        document.getElementById('user-list').appendChild(li);
        
        ONLINE.users[id] = {
            nick : nick,
            li : li
        };
    },
    removeUser : function (id) {
        var User = ONLINE.users[id];
        
        document.getElementById('user-list').removeChild(User.li);
        delete ONLINE.users[id];
        
    },
    changeNick : function (id, newNick) {
        var User = ONLINE.users[id];
        
        User.li.textContent = newNick;
        User.nick = newNick;
        
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