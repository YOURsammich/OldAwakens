var CURSORS = {};

//var position = null, x, y;
var moves = 0;
document.addEventListener('mousemove', function (e) {
    var x = (e.clientX / window.innerWidth)*100;
    var y = (e.clientY / window.innerHeight)*100;
    if (moves == 0 && !Attributes.get("toggle-cursors")) {
        socket.emit("cursor", {"x": x, "y": y});
    }
    moves = (moves+1)%10;
});

function newCursor(id, name, x, y) {
    var x = x || 0;
    var y = y || 0;
    var src = src || "/cursors/default.png";
    var img = document.createElement("div");
    img.classList.add("cursor");
    var image = document.createElement("img");
    image.src = src;
    img.appendChild(image);
    img.style.left = x+"%";
    img.style.top = y+"%";
    img.id = name;
    
    CURSORS[id] = {
        "x": x,
        "y": y,
        "element": img
    };
    
    $$$.query('.main-container').appendChild(img);
}

function moveCursor(id, x, y){
    var This = CURSORS[id];
    This.element.style.left = x+"%";
    This.element.style.top = y+"%";
    This.x = x;
    This.y = y;
};