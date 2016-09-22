var dao = require('./dao');
var request = require('request');
var _ = require('underscore');
var $ = require('jquery-deferred');
var express = require('express');
var fs = require('fs');

var channels = {};
var tokens = {};

process.on('uncaughtException', function (err) {
    // handle the error safely
    console.log(err);
});

function findIndex(channel, att, value) {
    var i;
    for (i = 0; i < channel.length; i++) {
        if (channel[i][att] === value) {
            return i;
        }
    }
    return -1;
}

function createChannel(io, channelName) {
    
    console.log('Starting channel', channelName);
    
    var room = io.of(channelName);
    
    var channel = {
        online : [],
        status : 'public',
        blockProxy : false
    };
    
    function updateUserData(user, newData) {
        
        if (newData.nick) {
            user.nick = newData.nick;
            roomEmit('nick', user.id, user.nick);
        }
        
        if (newData.token) {
            tokens[user.nick] = newData.token;
        }
        
        if (newData.role) {
            user.role = newData.role;
        }
        
        if (newData.remote_addr) {//if true save current ip to database
            dao.setUserinfo(user.nick, 'remote_addr', user.remote_addr).fail(function (err) {
                console.log(err);
            });
            delete newData.remote_addr;
        }
        
        user.socket.emit('update', newData);
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
    
    room.on('connection', function (socket) {
        
        var user = {
            remote_addr : socket.request.connection.remoteAddress,
            socket : socket,
            role : 4,
            id : dao.makeId()
        };
        
        var COMMANDS = {

            nick : {
                params : ['nick'],
                handler : function (user, params) {
                    if (params.nick.length < 50 && /^[\x21-\x7E]*$/i.test(params.nick)) {
                        dao.find(params.nick).then(function () {
                            showMessage(user.socket, 'This nick is registered, if this is your nick use /login', 'error');
                        }).fail(function () {
                            updateUserData(user, {
                                nick : params.nick,
                                role : 4
                            });
                        });
                    } else {
                        showMessage(user.socket, 'Invalid nick', 'error');
                    }
                }
            },
            login : {
                params : ['nick', 'password'],
                handler : function (user, params) {
                    var userRole;
                    dao.login(params.nick, params.password).then(function (correctPassword, dbuser) {
                        if (correctPassword) {
                            if (params.nick !== user.nick) {
                                var index = findIndex(channel.online, 'nick', dbuser.nick);
                                if (index !== -1) {
                                    channel.online[index].socket.disconnect();
                                }
                                
                                dao.find(params.nick).then(function (dbuser) {
                                    dao.getChannelinfo(channelName).then(function (channelRoles, channelData) {//check for channel roles
                                        if (dbuser.role === 0) {// check if god role
                                            userRole = 0;
                                        } else if (channelRoles) {
                                            if (channelRoles[dbuser.nick] && channelRoles[dbuser.nick] !== 0) {
                                                userRole = channelRoles[dbuser.nick];
                                            } else {
                                                userRole = 4;
                                            }
                                        } else {
                                            userRole = 4;
                                        }

                                        updateUserData(user, {
                                            nick : dbuser.nick,
                                            token : dao.makeId(),
                                            remote_addr : true,
                                            role : userRole
                                        });
                                    });
                                });
                            } else {
                                showMessage(user.socket, 'You\'re already logged in');
                            }
                        } else {
                            showMessage(user.socket, 'Incorrect password', 'error');
                        }
                    }).fail(function () {
                        showMessage(user.socket, 'That account doesn\'t exist', 'error');
                    });
                }
            },
            register : {
                params : ['nick', 'password'],
                handler : function (user, params) {
                    if (params.password && /^[\x21-\x7E]*$/i.test(params.nick)) {
                        if (params.password.length > 3) {
                            dao.register(params.nick, params.password, user.remote_addr).then(function () {
                                showMessage(user.socket, 'account registered', 'info');
                                updateUserData(user, {
                                    nick : params.nick
                                });
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
            },
            topic : {
                params : ['topic'],
                handler : function (user, params) {
                    if (params.topic.length < 500) {
                        dao.setChannelinfo(channelName, 'topic', params.topic).then(function () {
                            roomEmit('channeldata', {
                                data : {
                                    topic : params.topic
                                }
                            });
                        }).fail(function (err) {
                            console.log(err);
                        });
                    }
                }
            },
            note : {
                params : ['note'],
                handler : function (user, params) {
                    if (params.note.length < 1500) {
                        dao.setChannelinfo(channelName, 'note', params.note).then(function () {
                            roomEmit('channeldata', {
                                data : {
                                    note : params.note
                                }
                            });
                        }).fail(function (err) {
                            console.log(err);
                        });
                    }
                }
            },
            background : {
                params : ['background'],
                handler : function (user, params) {
                    if (params.background.length < 1500) {
                        dao.setChannelinfo(channelName, 'background', params.background).then(function () {
                            roomEmit('channeldata', {
                                data : {
                                    background : params.background
                                }
                            });
                        }).fail(function (err) {
                            console.log(err);
                        });
                    }
                }
            },
            me : {
                params : ['message'],
                handler : function (user, params) {
                    if (params.message.length < 1000) {
                        roomEmit('message', {
                            message : user.nick + ' ' + params.message,
                            messageType : 'action'
                        });
                    }
                }
            }, 
            whois : {
                params : ['nick'],
                handler : function (user, params) {
                    dao.find(params.nick).then(function (dbuser) {
                        showMessage(user.socket, `Nick: ${dbuser.nick}\n Role: ${dbuser.role}\n IP: ${dbuser.remote_addr}\n Registered: Yes`, 'info');
                    }).fail(function () {
                        var index = findIndex(channel.online, 'nick', params.nick),
                            userData = channel.online[index];
                        if (index !== -1) {
                            showMessage(user.socket, `Nick: ${userData.nick}\n Role: ${userData.role}\n IP: ${userData.remote_addr}\n Registered: No`, 'info');   
                        } else {
                            showMessage(user.socket, params.nick + ' doesn\'t exist', 'info');
                        }
                    });
                }
            },
            change_password : {
                params : ['oldpassword', 'newpassword'],
                handler : function (user, params) {
                    if (params.oldpassword && params.newpassword && params.newpassword.length > 3) {
                        dao.login(user.nick, params.oldpassword).then(function (correctPassword, dbuser) {
                            dao.encrypt(params.newpassword).then(function (hash) {
                                dao.setUserinfo(dbuser.nick, 'password', hash).than(function () {
                                    showMessage(user.socket, 'Password has been changed', 'info');
                                });
                            });
                        }).fail(function () {
                            showMessage(user.socket, 'Wrong password, if you\'ve forgot your password contact an admin', 'error'); 
                        });
                    }
                }
            },
            ban : {
                params : ['nick', 'reason'],
                handler : function (user, params) {
                    var index = findIndex(channel.online, 'nick', params.nick),
                        message = params.reason ? 'You\'ve been banned: ' + params.reason : 'You\'ve been banned';
                    
                    if (index !== -1) {
                        showMessage(channel.online[index].socket, message, 'error');
                        channel.online[index].socket.disconnect();
                    }
                    
                    dao.ban(channelName, params.nick, user.nick, params.reason).then(function () {
                        showMessage(user.socket, params.nick + ' is now banned', 'info');
                    }).fail(function () {
                        showMessage(user.socket, params.nick + ' is already banned', 'error');
                    });
                }
            },
            lockdown : {
                handler : function (user) {
                    channel.status = 'locked';
                    showMessage(user.socket, 'Channel is now locked');
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
            }
            
        });
        
        function attemptJoin(requestedData) {
                        
            function join(requestedData) {
                var i,
                    onlineUsers = [];
                
                for (i = 0; i < channel.online.length; i++) {
                    onlineUsers.push({
                        nick : channel.online[i].nick,
                        id : channel.online[i].id
                    });
                }
                                
                channel.online.push(user);
                
                socket.join('chat');
                
                dao.getChannelinfo(channelName).then(function (roles, channelData) {
                    socket.emit('channeldata', {
                        users : onlineUsers,
                        data : channelData
                    });
                    
                    dao.find(requestedData.nick).then(function (dbuser) {
                        if (requestedData.token === tokens[dbuser.nick]) {
                            user.nick = dbuser.nick;
                        } else {
                            user.nick = dao.getNick();
                        }
                        socket.emit('update', {
                            nick : user.nick 
                        });
                        roomEmit('joined', user.id, user.nick);
                    }).fail(function () {
                        if (requestedData.nick && /^[\x21-\x7E]*$/i.test(requestedData.nick)) {
                            user.nick = requestedData.nick;
                        } else {
                            user.nick = dao.getNick();
                        }
                        socket.emit('update', {
                            nick : user.nick 
                        });
                        roomEmit('joined', user.id, user.nick);
                    });
                });
            }
            
            dao.banlist(channelName).then(function (banlist) {
                var IPindex = banlist.indexOf(user.remote_addr),
                    nickIndex = banlist.indexOf(requestedData.nick);
                
                if (IPindex === -1 && nickIndex === -1) {
                    if (channel.status === 'locked') {
                        console.log(requestedData);
                        dao.login(requestedData.nick, requestedData.password).then(function (correctPassword) {
                            if (correctPassword) {
                                join(requestedData);
                            } else {
                                showMessage(socket, 'Wrong password')
                                socket.emit('locked');
                            }
                        }).fail(function () {
                            showMessage(socket, 'Is not an account')
                            socket.emit('locked');
                        });
                    } else {
                        join(requestedData); 
                    } 
                } else {
                    showMessage(socket, 'banned', 'error');
                }
            });
        }
        
        socket.on('requestJoin', attemptJoin);
                
        socket.on('disconnect', function () {
            var index = findIndex(channel.online, 'nick', user.nick);
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