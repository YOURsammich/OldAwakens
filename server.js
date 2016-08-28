var request = require('request');
var _ = require('underscore');
var $ = require('jquery-deferred');
var express = require('express');
var fs = require('fs');

var channels = {};

var COMMANDS = {
    
    nick : {
        params : ['nick'],
        handler : function (user, params) {
            if (params.nick.length < 50) {
                user.nick = params.nick;
            }
        }
    }
    
};

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
            role : 3
        };
        
        
        
        socket.on('message', function (message) {
            
            socket.emit('message', {
                message : message,
                messageType : 'chat',
                nick : user.nick
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
            
            console.log(commandName, params)
            
            if (typeof commandName == 'string' && COMMANDS[commandName]) {
                if (!params || typeof params == 'object') {
                    handleCommand(COMMANDS[commandName], params);
                }       
                
            } else {
                
            }
            
        });
        
        function attemptJoin() {
            
            console.log(user.remote_addr);
            user.nick = Math.random().toString();
            channel.online.push(user);
            
        }
        
        function findIndex(att, value) {
            var i;
            for (i = 0; i < channel.online[att].length; i++) {
                if (channel.online[att] === value) {
                    return i;
                }
            }
            return -1;
        }
        
        socket.on('requestJoin', attemptJoin);
        
        socket.on('disconnect', function () {
            var index = findIndex('nick', user.nick);
            if (index !== -1) {
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