var dao = require('./dao');
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
    
    var tokens = {};
    
    var channel = {
        online : [],
        status : 'public'
    };
        
    room.on('connection', function (socket) {
        
        var user = {
            remote_addr : socket.request.connection.remoteAddress,
            socket : socket,
            role : 3,
            id : dao.makeId()
        };
        
        var COMMANDS = {

            nick : {
                params : ['nick'],
                handler : function (user, params) {
                    if (params.nick.length < 50) {
                        dao.find(params.nick).then(function () {
                            showMessage(user.socket, 'This nick is registered, if this is your nick use /login', 'error');
                        }).fail(function () {
                            user.nick = params.nick;
                            roomEmit('nick', user.id, user.nick);
                        });
                    }
                }
            },
            login : {
                params : ['nick', 'password'],
                handler : function (user, params) {
                    var channelRoles = {};
                    
                    if (user.nick !== params.nick) {
                        dao.login(params.nick, params.password).then(function (correctPassword, dbuser) {
                            if (correctPassword) {
                                
                                var index = findIndex('nick', dbuser.nick);
                                if (index !== -1) {
                                    channel.online[index].socket.disconnect();
                                }
                                
                                dao.getChannelinfo(channelName).then(function (channelData) {
                                     
                                    if (dbuser.role === 0) {//if god assign god role
                                        user.role = 0;
                                    } else if (channelData && channelData.roles) {//check for channel roles
                                        try {
                                            channelRoles = parseInt(channelData.roles, 10);
                                            if (channelRoles[dbuser.nick] && channelRoles[dbuser.nick] !== 0) {
                                                user.role = channelRoles[dbuser.nick];
                                            } else {
                                                user.role = 4;
                                            }
                                        } catch (err) {
                                            user.role = 4;
                                            showMessage(user.socket, 'Something went wrong, tell the sammich.', 'error');
                                        }
                                    } else {
                                        user.role = 4;
                                    }
                                    
                                });
                                
                                user.nick = dbuser.nick;
                                
                                tokens[user.nick] = dao.makeId();
                                
                                roomEmit('nick', user.id, user.nick);
                                
                                dao.setUserinfo(dbuser.nick, 'remote_addr', user.remote_addr).fail(function (err) {
                                    console.log(err);
                                });
                                
                                socket.emit('update', {
                                    nick : dbuser.nick,
                                    role : user.role,
                                    token : tokens[dbuser.nick]
                                });
                            } else {
                                showMessage(user.socket, 'Incorrect password', 'error');
                            }
                        }).fail(function () {
                            showMessage(user.socket, 'That account doesn\'t exist', 'error');
                        });
                    } else {
                        showMessage(user.socket, 'You\'re already logged in');
                    }
                }
            },
            register : {
                params : ['nick', 'password'],
                handler : function (user, params) {
                    if (params.nick.length > 1 && /^[\x21-\x7E]*$/i.test(params.nick)) {
                        if (params.password.length > 3) {
                            dao.register(params.nick, params.password, user.remote_addr).then(function () {
                                user.nick = params.nick;
                                roomEmit('nick', user.id, user.nick);

                                showMessage(user.socket, 'account registered', 'info');
                            }).fail(function () {
                                showMessage(user.socket, params.nick + ' is already registered', 'error');
                            }); 
                        } else {
                            showMessage(user.socket, 'Choose a more secure password', 'error');
                        }
                    } else {
                        showMessage(user.socket, 'Invalid nick', 'error');
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
            
            function join() {
                var i,
                    onlineUsers = [];
                
                for (i = 0; i < channel.online.length; i++) {
                    onlineUsers.push({
                        nick : channel.online[i].nick,
                        id : channel.online[i].id
                    });
                }
                
                if (user.nick === undefined) {
                    user.nick = dao.getNick();
                }
                
                channel.online.push(user);
                
                socket.join('chat');
                
                dao.getChannelinfo(channelName).then(function (channelData) {
                    socket.emit('channeldata', {
                        users : onlineUsers,
                        channeldata : channelData.data
                    });
                });
                
                roomEmit('joined', user.id, user.nick);
            }
            
            if (requestedData && requestedData.nick && findIndex('nick', requestedData.nick) === -1) {
                if (/^[\x21-\x7E]*$/i.test(requestedData.nick)) {
                    dao.find(requestedData.nick).then(function (dbuser) {
                        if (requestedData.token && requestedData.token === tokens[dbuser.nick]) {
                            user.nick = dbuser.nick;
                            tokens[dbuser.nick] = dao.makeId();
                            
                            socket.emit('update', {
                                token : tokens[dbuser.nick]
                            });
                            
                            join();
                        } else {
                            join();
                        }
                    }).fail(function () {
                        join();
                    });
                } else {
                    showMessage(socket, 'Nick contained invalid characters.', 'error');
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
            socket.emit('message', {
                message : message,
                messageType : style
            });
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