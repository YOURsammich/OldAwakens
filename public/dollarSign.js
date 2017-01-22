window.$$$ = {
    query : function (identifier) {
        return document.querySelector(identifier);
    },
    draggable : function (el, stopOn) {
        var container = document.getElementById('messages'),
            clickX = 0,
            clickY = 0;
        
        el.style.position = 'absolute';
        
        if (!el.style.left) {
            el.style.left = el.offsetLeft + 'px';
            el.style.top = el.offsetTop + 'px';   
        }
        
        function drag(event) {
            var movementX = (event.clientX - clickX) - parseInt(el.style.left, 10),
                movementY = (event.clientY - clickY) - parseInt(el.style.top, 10),
                newLeft = parseInt(el.style.left, 10) + movementX,
                newTop = parseInt(el.style.top, 10) + movementY;
                
            if (newLeft + el.offsetWidth < container.offsetWidth && newLeft >= container.offsetLeft) {
                el.style.left = newLeft + 'px';
            }
            if (newTop + el.offsetHeight < container.offsetHeight && newTop >= container.offsetTop) {
                el.style.top = newTop + 'px';
            }
        }
        
        function remove() {
            el.removeEventListener('mousemove', drag);
            container.removeEventListener('mousemove', drag);
            document.body.classList.remove('noselect');
        }
        
        el.addEventListener('mousedown', function (e) {
            var target = e.target || e.srcElement;
            if (!target.classList.contains('resizable-handle') && target.className !== stopOn) {
                clickX = e.clientX - parseInt(el.style.left, 10);
                clickY = e.clientY - parseInt(el.style.top, 10);
                el.addEventListener('mousemove', drag);
                container.addEventListener('mousemove', drag);
                document.body.classList.add('noselect');
            }
        });
        
        el.addEventListener('mouseup', remove);
        container.addEventListener('mouseup', remove);
    }
};