var socket = io.connect(window.location.pathname);

//channel img
//channel url
//online users
//tags

function addChannels (channels) {
    var keys = Object.keys(channels),
        table = document.getElementsByTagName('tbody')[0],
        pan,
        channelName,
        channelinfo,
        channelTags,
        settings,
        buttonJoin,
        i;
    
    while (table.getElementsByTagName('td').length) {
        table.getElementsByTagName('td')[0].parentNode.removeChild(table.getElementsByTagName('td')[0]);
    }
    
    for (i = 0; i < keys.length; i++) {
        tr = document.createElement('tr');
        tr.className = 'pan';
        
        channelName = document.createElement('td');
        channelName.textContent = channels[keys[i]].name;
        
        channelonline = document.createElement('td');
        channelonline.textContent = channels[keys[i]].online;
        
        channelTags = document.createElement('td');
        channelTags.textContent = 'none';
        
        settings = document.createElement('td');
        buttonJoin = document.createElement('button');
        buttonJoin.textContent = 'Join Channel'
        settings.appendChild(buttonJoin);
        
        tr.appendChild(channelName);
        tr.appendChild(channelonline);
        tr.appendChild(channelTags);
        //tr.appendChild(settings);
        
        table.appendChild(tr);
    }
}

socket.on('activeChannels', addChannels);

socket.on('connect', function () {
    socket.emit('activeChannels');
});


document.getElementById('joinAchannel').addEventListener('click', function () {
    document.getElementById('welcomePage').style.display = 'none';
});