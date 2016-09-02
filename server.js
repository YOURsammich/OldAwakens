var request = require('request');
var _ = require('underscore');
var $ = require('jquery-deferred');
var express = require('express');
var fs = require('fs');

var channels = {};

process.on('uncaughtException', function (err) {
    // handle the error safely
    console.log(err);
});

function createChannel(io, channelName) {
    
    console.log('Starting channel', channelName);
    
    var room = io.of(channelName);
        
    var channel = {
        online : [],
        status : 'public'
    };
        
    room.on('connection', function (socket) {
        
        var user = {
            remote_addr : socket.request.connection.remoteAddress,
            socket : socket,
            role : 3,
            id : Math.random().toString()
        };
        
        var COMMANDS = {

            nick : {
                params : ['nick'],
                handler : function (user, params) {
                    if (params.nick.length < 50) {
                        user.nick = params.nick;
                        
                        roomEmit('nick', user.id, user.nick);
                    }
                }
            }

        };
        
        socket.on('message', function (message, flair) {
            
            roomEmit('message', {
                message : message,
                messageType : 'chat',
                nick : user.nick,
                flair : flair
            });
            
        });
        
        function handleCommand(command, params) {
            var valid = true,
                i;
            
            if (command.params) {
                
                for (i = 0; i < command.params.length; i++) {
                    if (typeof command.params[i] !== 'string') {
                        valid = false;
                    }
                }
                
                if (valid) {
                    command.handler(user, params);
                }
                
            } else {
                command.handler(user);
            }
            
            
        }
        
        socket.on('command', function (commandName, params) {
            
            console.log(commandName, params);
            
            if (typeof commandName === 'string' && COMMANDS[commandName]) {
                if (!params || typeof params === 'object') {
                    handleCommand(COMMANDS[commandName], params);
                }       
                
            } else {
                
            }
            
        });
        
        function attemptJoin(requestedData) {
            
            function join () {
                var i,
                    onlineUsers = [];
                
                for (i = 0; i < channel.online.length; i++) {
                    onlineUsers.push({
                        nick : channel.online[i].nick,
                        id : channel.online[i].id
                    });
                }
                
                if (user.nick === undefined) {
                    user.nick = Math.random().toString();
                }
                
                channel.online.push(user);
                
                socket.join('chat');
                
                socket.emit('channeldata', {
                    users : onlineUsers
                });
                
                roomEmit('joined', user.id, user.nick);
                
            }
            
            console.log(user.remote_addr);
            
            if (requestedData && requestedData.nick && findIndex('nick', requestedData.nick) === -1) {
                if(!/^[\x21-\x7E]*$/i.test(data.nick)){
                    showMessage(socket, 'Nick contained invalid characters.', 'error');
                    join();
                } else {
                    user.nick = requestedData.nick;
                    join();
                }
            } else {
                join();
            }

        }
        
        function findIndex(att, value) {
            var i;
            for (i = 0; i < channel.online.length; i++) {
                if (channel.online[i][att] === value) {
                    return i;
                }
            }
            return -1;
        }
        
        function showMessage(socket, message, style) {
            socket.emit('message', message);
        }
        
        function roomEmit() {
            room.in('chat').emit.apply(room, arguments);
        }
        
        socket.on('requestJoin', attemptJoin);
        
        socket.on('disconnect', function () {
            var index = findIndex('nick', user.nick);
            if (index !== -1) {
                roomEmit('left', user.id);
                channel.online.splice(index, 1);
            }
        });
        
    });
        
    return true;
}

function intoapp(app, http) {
    var channelRegex = /^\/(\w*\/?)$/;
    var io = require('socket.io')(http);
    app.use(express.static(__dirname + '/public'));
    app.get(channelRegex, function (req, res) {
        if (!channels[req.url]) {
            channels[req.url] = createChannel(io, req.url);
        }
        var index = fs.readFileSync('index.html').toString();
        res.send(index);
    });
}

(function () {
    var app = express();
    var http = require('http').Server(app);
    http.listen(80, function () {
       console.log('listening on *:80');
       intoapp(app, http);
    });
})();