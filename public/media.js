var draggable = function(el) {
    var container = document.getElementById('messages');
    var clickX = 0;
    var clickY = 0;
    el.style.left = el.offsetLeft + 'px';
    el.style.top = el.offsetTop + 'px';
    
    function drag(event){
        var movementX = (event.clientX-(clickX)) - parseInt(el.style.left, 10);
        var movementY = (event.clientY-(clickY)) - parseInt(el.style.top, 10);
        var left = parseInt(el.style.left, 10) + (movementX);
        var top = parseInt(el.style.top, 10) + (movementY);
        if(((left + el.offsetWidth) < container.offsetWidth) && left >= container.offsetLeft){
            el.style.left = left + 'px';
        }
        if(((top + el.offsetHeight) < container.offsetHeight) && top >= container.offsetTop){
            el.style.top = top + 'px';
        }
    }
    
    function remove(){
        el.removeEventListener('mousemove',drag);
        container.removeEventListener('mousemove',drag);
        document.body.classList.remove('noselect');
    }
    
    el.addEventListener('mousedown', function(e){
        var target = e.target || e.srcElement;
        if(!target.classList.contains('resizable-handle')){
            clickX = e.clientX - parseInt(el.style.left, 10);
            clickY = e.clientY - parseInt(el.style.top, 10);
            el.addEventListener('mousemove',drag);
            container.addEventListener('mousemove',drag);
            document.body.classList.add('noselect');            
        }
    });
            
    el.addEventListener('mouseup', remove);
    container.addEventListener('mouseup', remove);
};

function embed(type,input){
    var url;
    switch (type) {
        case 'youtube':
            url = '<iframe width="100%" height="100%" src="//www.youtube.com/embed/' + input + '" frameborder="0" allowfullscreen></iframe>';
            break;
        case 'html5':
            url = '<video width="100%" height="100%" src="' + input + '" controls></video>';
            break;
        case 'audio':
            url = '<audio style="width:100%;height:100%" src="' + input + '" controls></video>';
            break;
        case 'liveleak':
            url = '<iframe width="100%" height="100%" src="http://www.liveleak.com/ll_embed?f=' + input + '" frameborder="0" allowfullscreen></iframe>';
            break;
        case 'vimeo':
            url = '<iframe src="//player.vimeo.com/video/' + input + '" width="100%" height="100%" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
            break;
        case 'ustream':
            url = '<iframe src="//www.ustream.tv/embed/' + input + '?v=3&amp;wmode=direct" width="100%" height="100%" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
            break;
        case 'embed':
            url = '<iframe width="100%" height="100%" src="' + input + '" frameborder="0" allowfullscreen></iframe>';
            break;
        case 'soundcloud':
            url = input;
            break;
    }
    var videoOverlay = document.getElementsByClassName('video-overlay');
    if(videoOverlay.length === 0){
        videoOverlay = document.createElement('div');
        videoOverlay.className = 'video-overlay';
        videoOverlay.style.left = ((window.innerWidth/2)-264) + 'px';
        videoOverlay.style.top = ((window.innerHeight/2)-161) + 'px';
        var header = document.createElement('div');
        header.style.cssText = 'cursor:move;user-select:none;background-color:#444;';
        videoOverlay.appendChild(header);
        var cancel = document.createElement('a');
        cancel.textContent = '[close]';
        cancel.style["text-decoration"] = "underline";
        cancel.style.color = "lightblue";
        cancel.style.cursor = "pointer";
        cancel.addEventListener('click',function(){
            document.body.removeChild(videoOverlay);
        });
        header.appendChild(cancel);
        var container = document.createElement('div');
        container.className = 'container';
        container.style.cssText = 'width:100%;height:calc(100% - 34px);background-color:#111;';
        container.innerHTML = url;
        videoOverlay.appendChild(container);
        document.body.appendChild(videoOverlay);
        draggable(videoOverlay);
    } else {
        videoOverlay = videoOverlay[0];
        videoOverlay.getElementsByClassName('container')[0].innerHTML = url;
    }
}

function Soundcloud(url) {
    function reqListener() {
        embed("soundcloud", JSON.parse(this.responseText).html);
    }
    
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", reqListener);
    oReq.open("GET", "http://soundcloud.com/oembed?format=json&url="+url+"&iframe=true");
    oReq.send();
}