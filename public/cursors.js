function moveCursor(id, position, cursorType) {
    var cursor = document.getElementById('cursor-' + id),
        cursorImage = new Image();
    
    if (!cursor) {
        cursor = document.createElement('div');
        cursor.id = 'cursor-' + id;
        cursor.setAttribute('data-nick', ONLINE.users[id].nick);
        cursor.className = 'cursor';
        cursorImage.src = '/cursors/' + (cursorType || 'default.png');
        cursor.appendChild(cursorImage);
        document.getElementById('cursor-container').appendChild(cursor);
        ONLINE.users[id].cursor = cursor;
    }
    
    cursor.style.left = (position.x * window.innerWidth) + 'px';
    cursor.style.top = (position.y * window.innerHeight) + 'px';
}

function changeCursor(id, newCursor) {
    var user = ONLINE[id];
    
    if (user && user.cursor) {
        user.cursor.getElementsByTagName('img')[0].src = '/cursors/' + newCursor;
    }
}

(function () {
    var moves = 0;
    document.addEventListener('mousemove', function (e) {
        var x = e.clientX / window.innerWidth
        var y = e.clientY / window.innerHeight
        if (moves == 0 && Attributes.get('toggle-cursors')) {
            socket.emit('updateCursor', {
                x : x,
                y : y
            });
        }
        moves = (moves+1)%10;
    });
})();

socket.on('updateCursor', function (cursorData) {
    if (Attributes.get('toggle-cursors') && ONLINE.users[cursorData.id].nick !== Attributes.get('nick')) {
        moveCursor(cursorData.id, cursorData.position, cursorData.cursorType);
    }
});

socket.on('removeCursor', function(id) {
    if (ONLINE.users[id].cursor) {
        ONLINE.users[id].cursor.parentNode.removeChild(ONLINE.users[id].cursor);
    }
});