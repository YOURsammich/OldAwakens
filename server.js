var dao        = require('./dao'),
    request    = require('request'),
    _          = require('underscore'),
    $          = require('jquery-deferred'),
    express    = require('express'),
    fs         = require('fs'),
    captchaGen = require('ascii-captcha');

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
        blockProxy : false,
        captcha : {}
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
                    var index = findIndex(channel.online, 'nick', params.nick),
                        userData;
                    
                    if (index !== -1) {
                        userData = channel.online[index];
                        showMessage(user.socket, `Nick: ${userData.nick}\n Role: ${userData.role}\n IP: ${userData.remote_addr}\n Registered: No`, 'info');
                    } else {
                        dao.find(params.nick).then(function (dbuser) {
                            showMessage(user.socket, `Nick: ${dbuser.nick}\n Role: ${dbuser.role}\n IP: ${dbuser.remote_addr}\n Registered: Yes`, 'info');
                        }).fail(function () {
                            showMessage(user.socket, params.nick + ' doesn\'t exist', 'info');
                        });
                    }
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
            kick : {
                role : 2,
                params : ['nick', 'reason'],
                handler : function (user, params) {
                    var index = findIndex(channel.online, 'nick', params.nick),
                        message = params.reason ? 'You\'ve been kicked: ' + params.reason : 'You\'ve been kicked';
                    
                    if (index !== -1) {
                        showMessage(channel.online[index].socket, message, 'error');
                        channel.online[index].socket.disconnect();
                    } else {
                        showMessage(user.socket, params.nick + ' is not online');
                    }
                }
            },
            ban : {
                role : 1,
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
            banip : {
                role : 1,
                params : ['nick', 'reason'],
                handler : function (user, params) {
                    var index = findIndex(channel.online, 'nick', params.nick),
                        message = params.reason ? 'You\'ve been banned: ' + params.reason : 'You\'ve been banned';
                    
                    if (index !== -1) {
                        dao.ban(channelName, channel.online[index].remote_addr, user.nick, params.reason).then(function () {         
                            showMessage(channel.online[index].socket, message, 'error');
                            channel.online[index].socket.disconnect();
                            showMessage(user.socket, params.nick + ' is now IP banned', 'info');
                        }).fail(function () {
                            showMessage(user.socket, params.nick + ' is already banned', 'error');
                        });
                    }
                }
            },
            unban : {
                role : 1,
                params : ['nick'],
                handler : function (user, params) {
                    dao.unban(channelName, params.nick).then(function () {
                        showMessage(user.socket, params.nick + ' is unbanned');
                    }).fail(function () {
                        showMessage(user.socket, params.nick + ' isn\'t banned', 'error');
                    });
                }
            },
            lockdown : {
                role : 1,
                handler : function (user) {
                    channel.status = 'locked';
                    showMessage(user.socket, 'Channel is now locked');
                }
            },
            unlock : {
                role : 1,
                handler : function (user) {
                    channel.status = 'public';
                    showMessage(user.socket, 'Channel is now unlocked');
                }
            },
            whitelist : {
                role : 1,
                params : ['nick'],
                handler : function (user, params) {
                    dao.find(params.nick).then(function (dbuser) {
                        dao.getChannelAtt(channelName, 'whitelist').then(function (whitelist) {
                             if (whitelist.indexOf(user.nick) === -1) {
                                 whitelist.push(params.nick);
                                 dao.setChannelinfo(channelName, 'whitelist', whitelist).then(function () {
                                     showMessage(user.socket, params.nick + ' is now whitelisted');
                                 });
                             } else {
                                 showMessage(user.socket, params.nick + ' is already whitelisted', 'error');
                             }
                        });
                    }).fail(function () {
                        showMessage(user.nick, user.nick + ' is not registered', 'error'); 
                    });
                }
            },
            unwhitelist : {
                role : 1,
                params : ['nick'],
                handler : function (user) {
                    dao.getChannelAtt(channelName, 'whitelist').then(function (whitelist) {
                        var index = whitelist.indexOf(params.nick);
                        if (index !== -1) {
                            whitelist.splice(index, 1);
                            dao.setChannelinfo(channelName, 'whitelist', whitelist).then(function () {
                                showMessage(user.socket, params.nick + ' has been unwhitelisted');
                            });
                        } else {
                            showMessage(user.socket, params.nick + ' isn\'t whitelisted', 'error');
                        }
                    });
                }
            },
            captcha : {
                role : 1,
                params : ['toggle'],
                handler : function(user, params) {
                    if (channel.status == "public") {
                        if (params.toggle == "true") {
                            dao.setChannelinfo(channelName, 'captcha', 'true').then(function(){
                                showMessage(user.socket, "Join captcha enabled");
                            });
                        } else {
                            dao.setChannelinfo(channelName, 'captcha', 'false').then(function(){
                                showMessage(user.socket, "Join captcha disabled");
                            });
                        }
                    } else {
                        showMessage(user.socket, "Cannot put captcha on locked channel!", "error");
                    }
                }
            },
            code : {
                params : ["code"],
                handler : function(user, params) {
                    dao.getChannelAtt(channelName, 'captcha').then(function(captcha){
                        if (captcha.length > 0 && captcha === "true") {
                            if (channel.captcha[user.id].toLowerCase() == params.code.toLowerCase()) {
                                if (user.role) {
                                    joinChannel(user.nick, user.role);
                                } else if (user.nick) {
                                    joinChannel(user.nick);
                                } else {
                                    joinChannel();
                                }
                            } else {
                                showMessage(user.socket, "Captcha incorrect.", "error");
                            }
                        } else {
                            showMessage(user.socket, "Captcha not enabled.", "error");
                        }
                    })
                }
            }
        };
        
        socket.on('message', function (message, flair) {
            if (typeof message === 'string' && typeof flair === 'string') {
                if (message.length < 10000 && flair.length < 500) {
                    roomEmit('message', {
                        message : message,
                        messageType : 'chat',
                        nick : user.nick,
                        flair : flair
                    });      
                }
            }
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
            if (typeof commandName === 'string' && COMMANDS[commandName]) {
                if (!params || typeof params === 'object') {
                    handleCommand(COMMANDS[commandName], params);
                }
            }
        });
        
        socket.on('register', function (nick, password) {
            if (typeof nick === 'string' && typeof password === 'string') {
                if (nick.length < 50 && /^[\x21-\x7E]*$/i.test(nick)) {
                    dao.findip(user.remote_addr).then(function (accounts) {
                        if (accounts.length < 5) {
                            dao.register(nick, password, user.remote_addr).then(function () {
                                showMessage(user.socket, nick + ' is now regiserted');
                                updateUserData(user, {
                                    nick : nick
                                });
                            }).fail(function () {
                                showMessage(user.socket, 'This nick is already registered');
                            });
                         } else {
                             showMessage(user.socket, 'Serveral accounts already registered with this IP');
                         }
                    });
                } else {
                    showMessage(user.socket, 'Invalid nick');
                }
            }
        });
        
        function joinChannel(nick, role) {
            dao.getChannelinfo(channelName).then(function (roles, channelData) {
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
                
                user.nick = nick || dao.getNick();
                user.role = role || 4;
                
                socket.emit('channeldata', {
                    users : onlineUsers,
                    data : channelData
                });
                
                socket.emit('update', {
                    nick : user.nick,
                    role : user.role
                });
                
                roomEmit('joined', user.id, user.nick);
            });
        }
        
        function joinLockedChannel(nick, token, password) {
            
            function isWhitelisted(nick, role) {
                dao.getChannelAtt(channelName, 'whitelist').then(function (whitelist) {
                    if(whitelist.indexOf(nick) !== -1) {
                        joinChannel(nick, role);
                    } else {
                        showMessage(socket, 'That account isn\'t whitelisted', 'error');
                    }
                });
            }
            
            dao.find(nick).then(function(dbuser) {
                if (tokens[nick] === token) {
                    isWhitelisted(dbuser.nick, dbuser.role);
                } else {
                    dao.login(nick, password).then(function (correctPassword, dbuser) {
                        if (correctPassword) {
                            isWhitelisted(dbuser.nick, dbuser.role);
                        } else {
                            showMessage(socket, 'Inncorect password', 'error');
                        }
                    });
                }
            }).fail(function() {
                showMessage(socket, 'That account doesn\'t exist', 'error');
                socket.emit('locked');
            });
        }
        
        function joinCaptchaChannel(nick, role, token) {
            if (captcha[user.id] == token) {
                joinChannel(nick, role);
            } else {
                showMessage(socket, 'Incorrect captcha code!', 'error');
            }
        }
        
        function attemptJoin(nick, token) {
            dao.banlist(channelName).then(function (banlist) {
                var IPindex = banlist.indexOf(user.remote_addr),
                    nickIndex = banlist.indexOf(nick);
                
                if (IPindex === -1 && nickIndex === -1) {
                    if (typeof nick === 'string' && /^[\x21-\x7E]*$/i.test(nick)) {
                        dao.getChannelAtt(channelName, 'captcha').then(function(captcha){
                            if (captcha.length > 0 && captcha === "true") {
                                dao.find(nick).then(function (dbuser) {
                                    if (tokens[nick] && tokens[nick] === token) {
                                        user.nick = dbuser.nick;
                                        user.role = dbuser.role;
                                    }
                                });
                                showMessage(socket, "Please solve a captcha with /code CAPTCHA before continuing.");
                                var code = captchaGen.generateRandomText(8);
                                channel.captcha[user.id] = code;
                                socket.emit("captcha", captchaGen.word2Transformedstr(code));
                            } else {
                                dao.find(nick).then(function (dbuser) {
                                    if (tokens[nick] && tokens[nick] === token) {
                                        joinChannel(dbuser.nick, dbuser.role);
                                    } else {
                                        joinChannel();
                                    }
                                }).fail(function() {
                                    joinChannel(nick);
                                });
                            }
                        });
                    } else {
                        joinChannel();
                    }
                } else {
                    showMessage(socket, 'banned', 'error');
                }   
            });
        }
                        
        socket.on('requestJoin', function (requestedData) {
            if (findIndex(channel.online, 'id', user.id) === -1) {
                if (channel.status === 'public') {
                    attemptJoin(requestedData.nick, requestedData.token);
                } else {
                    if (typeof requestedData.nick === 'string' && typeof requestedData.password === 'string') {
                        joinLockedChannel(requestedData.nick, requestedData.token, requestedData.password);
                    } else {
                        socket.emit('locked');
                    }
                }
            } else {
                showMessage(socket, 'Only one socket connection allowed', 'error');
            }
        });
        
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