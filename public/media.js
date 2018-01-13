var audioPlayer = {
    chat : new Audio('audio/Bing.mp3'),
    name : new Audio('audio/Bwoop.wav'),
    play : function (alertSound) {
        if (alertSound) {
            this.name.play();
        } else {
            this.chat.play();
        }
    }
}

function buildAdvancedVideoOverlay(url) {
    var videoOverlay = document.getElementById('a-video-overlay'),
        mainContain,
        videoList,
        container,
        header;
    
    if (!videoOverlay) {
        videoOverlay = document.createElement('div');
        videoOverlay.id = 'a-video-overlay';
        videoOverlay.style.left = ((window.innerWidth / 2) - 264) + 'px';
        videoOverlay.style.top = ((window.innerHeight / 2) - 161) + 'px';
        
        mainContain = document.createElement('div');
        mainContain.id = 'mainContain';
        
        header = document.createElement('div');
        header.id = 'videoHeader';
        mainContain.appendChild(header);
        
        container = document.createElement('div');
        container.style.cssText = "height: calc(100% - 15px);width: 100%;";
        container.innerHTML = url;
        mainContain.appendChild(container);
        
        videoOverlay.append(mainContain);
        
        videoList = document.createElement('div');
        videoList.style.cssText = "width: 50px; background-color: grey;";
        videoOverlay.appendChild(videoList);
        
        $$$.draggable(videoOverlay);
        
        document.body.appendChild(videoOverlay);
    } else {
        
    }
}

function buildVideoOverlay(url) {
    var videoOverlay = document.getElementsByClassName('video-overlay'),
        header,
        cancel,
        container;

    if (videoOverlay.length === 0) {
        videoOverlay = document.createElement('div');
        videoOverlay.id = 'video-overlay';
        videoOverlay.style.left = ((window.innerWidth / 2) - 264) + 'px';
        videoOverlay.style.top = ((window.innerHeight / 2) - 161) + 'px';
        header = document.createElement('div');
        header.style.cssText = 'cursor:move;user-select:none;background-color:#444;';
        videoOverlay.appendChild(header);
        cancel = document.createElement('a');
        cancel.textContent = '[close]';
        cancel.style["text-decoration"] = "underline";
        cancel.style.color = "lightblue";
        cancel.style.cursor = "pointer";
        cancel.addEventListener('click', function () {
            document.body.removeChild(videoOverlay);
        });
        header.appendChild(cancel);
        container = document.createElement('div');
        container.className = 'container';
        container.style.cssText = 'width:100%;height:calc(100% - 34px);background-color:#111;';
        container.innerHTML = url;
        videoOverlay.appendChild(container);
        document.body.appendChild(videoOverlay);
        $$$.draggable(videoOverlay);
    } else {
        videoOverlay[0].getElementsByClassName('container')[0].innerHTML = url;
    }
}

function embed(type, input, advan) {
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
        url = '<iframe width="100%" height="100%" src="//www.liveleak.com/ll_embed?f=' + input + '" frameborder="0" allowfullscreen></iframe>';
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
    case 'swf':
        url = '<object width="100%" height="100%" data="' + input + '" type="application/x-shockwave-flash">\n<param name="movie" value="' + input + '" />\n</object>'
        break;
    }
    
    if (advan) {
        buildAdvancedVideoOverlay(url);
    } else {
        buildVideoOverlay(url);   
    }
}

function soundCloud(url) {
    function reqListener() {
        buildVideoOverlay(JSON.parse(this.responseText).html);
    }

    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", reqListener);
    oReq.open("GET", "//soundcloud.com/oembed?format=json&url=" + url + "&iframe=true");
    oReq.send();
}
