(function () {
    var moves = 0,
        user = ONLINE.getId(Attributes.get('nick')),
        cursor;
    
    function moveCursor(id, position, cursorType) {
        var cursor = document.getElementById('cursor-' + id),
            cursorImage;

        if (!user) {
            user = ONLINE.users[ONLINE.getId(Attributes.get('nick'))];
        }
        
        if (!cursor) {
            cursorImage = new Image();
            cursor = document.createElement('div');
            cursor.id = 'cursor-' + id;
            cursor.setAttribute('data-nick', ONLINE.users[id].nick);
            cursor.className = 'cursor';

            if (ONLINE.users[id].nick === user.nick) {
                cursor.className += ' myCursor';
                if (cursorType && cursorType !== 'default.png') {
                    document.getElementById('messages').style.cursor = 'none';
                } else {
                    document.getElementById('messages').style.cursor = 'default';
                    cursor.style.display = 'none';
                }
            }

            document.getElementById('cursor-container').appendChild(cursor);
            ONLINE.users[id].cursor = cursor;

            cursorImage.onload = function () {
                cursor.style.width = cursorImage.width + 'px';
                cursor.style.height = cursorImage.height + 'px';
                cursor.appendChild(cursorImage);
            };

            cursorImage.src = 'cursors/' + (cursorType || 'default.png');
        } else {
            cursor.style.left = (position.x * window.innerWidth) + 'px';
            cursor.style.top = (position.y * window.innerHeight) + 'px';
        }
    }
    
    function changeCursor(id, newCursor) {
        var cuser = ONLINE.users[id],
            cursorImage;
        
        if (user.nick == cuser.nick) {
            Attributes.set('cursor', newCursor);
            if (newCursor === 'default.png') {
                document.getElementById('messages').style.cursor = 'default';
                user.cursor.style.display = 'none';
            } else {
                document.getElementById('messages').style.cursor = 'none';
                user.cursor.style.display = 'block';
            }
        }
        
        if (cuser && cuser.cursor) {
            cursorImage = cuser.cursor.getElementsByTagName('img')[0];
            cursorImage.onload = function () {
                cuser.cursor.style.width = cursorImage.width + 'px';
                cuser.cursor.style.height = cursorImage.height + 'px';
            };

            cursorImage.src = 'cursors/' + newCursor;
        }
    }
    
    socket.on('changeCursor', function (id, type) {
        if (Attributes.get('toggle-cursors')) {
            changeCursor(id, type);
        }
    });
    
    socket.on('updateCursor', function (cursorData) {
        if (Attributes.get('toggle-cursors') && ONLINE.users[cursorData.id].nick !== Attributes.get('nick')) {
            moveCursor(cursorData.id, cursorData.position, cursorData.cursor);
        }
    });

    socket.on('removeCursor', function(id) {
        if (ONLINE.users[id].cursor) {
            if (ONLINE.getId(Attributes.get('nick')) == id) {
                document.getElementById('messages').style.cursor = 'default';
            };
            ONLINE.users[id].cursor.parentNode.removeChild(ONLINE.users[id].cursor);
        }
    });
    
    document.addEventListener('mousemove', function (e) {
        var target = e.target;
        var x = e.clientX / window.innerWidth;
        var y = e.clientY / window.innerHeight;
        
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