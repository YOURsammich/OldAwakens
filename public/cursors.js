function moveCursor(id, position, cursorType) {
    var cursor = document.getElementById('cursor-' + id),
        cursorImage;
    
    if (!cursor) {
        cursorImage = new Image();
        cursor = document.createElement('div');
        cursor.id = 'cursor-' + id;
        cursor.setAttribute('data-nick', ONLINE.users[id].nick);
        cursor.className = 'cursor';
        
        if (ONLINE.users[id].nick == Attributes.get('nick')) {
            document.body.style.cursor = 'none';
            cursor.className += ' myCursor';
        }
        
        document.getElementById('cursor-container').appendChild(cursor);
        ONLINE.users[id].cursor = cursor;
        
        cursorImage.onload = function () {
            cursor.style.width = cursorImage.width + 'px';
            cursor.style.height = cursorImage.height + 'px';
            cursor.appendChild(cursorImage);
        }
        
        cursorImage.src = 'cursors/' + (cursorType || 'default.png');
    } else {
        cursor.style.left = (position.x * window.innerWidth) + 'px';
        cursor.style.top = (position.y * window.innerHeight) + 'px';
    }
}

function changeCursor(id, newCursor) {
    var user = ONLINE.users[id],
        cursorImage;
    
    if (ONLINE.getId(Attributes.get('nick')) == id) {
        Attributes.set('cursor', newCursor);
    }
    
    if (user && user.cursor) {
        cursorImage = user.cursor.getElementsByTagName('img')[0];
        cursorImage.onload = function () {
            user.cursor.style.width = cursorImage.width + 'px';
            user.cursor.style.height = cursorImage.height + 'px';
        }
        
        cursorImage.src = 'cursors/' + newCursor;
    }
}

(function () {
    var moves = 0,
        user,
        cursor;
    document.addEventListener('mousemove', function (e) {
        var target = e.target;
        var x = e.clientX / window.innerWidth
        var y = e.clientY / window.innerHeight
        
        if (!user) {
            user = ONLINE.users[ONLINE.getId(Attributes.get('nick'))];
        } else if (user.cursor) {
            if (target.nodeName == 'IMG') {
                user.cursor.style.display = 'none';
            } else {
                user.cursor.style.display = 'block';
            }
        }
        
        if (moves == 0 && Attributes.get('toggle-cursors')) {
            socket.emit('updateCursor', {
                x : x,
                y : y
            });
        }
        moves = (moves + 1) % 5;
        
        if (ONLINE.getId(Attributes.get('nick')) && Attributes.get('toggle-cursors')) {
            moveCursor(ONLINE.getId(Attributes.get('nick')), {x : x, y: y}, Attributes.get('cursor'));   
        }
    });
})();

socket.on('updateCursor', function (cursorData) {
    if (Attributes.get('toggle-cursors') && ONLINE.users[cursorData.id].nick !== Attributes.get('nick')) {
        moveCursor(cursorData.id, cursorData.position, cursorData.cursor);
    }
});

socket.on('changeCursor', function (id, type) {
    if (Attributes.get('toggle-cursors')) {
        changeCursor(id, type);
    }
});

socket.on('removeCursor', function(id) {
    if (ONLINE.users[id].cursor) {
        if (ONLINE.getId(Attributes.get('nick')) == id) {
            document.body.style.cursor = 'default';
        };
        ONLINE.users[id].cursor.parentNode.removeChild(ONLINE.users[id].cursor);
    }
});