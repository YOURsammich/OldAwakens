var dao = require('./dao');
var request = require('request');
var throttle = require('./throttle');
var _ = require('underscore');
var $ = require('jquery-deferred');
var express = require('express');
var fs = require('fs');
var captchaGen = require('ascii-captcha');

var channels = {};
var tokens = {};

function handleException(err) {
    // handle the error safely and verbosely
    console.log(err.stack);
}
process.on('uncaughtException', handleException);

function findIndex(channel, att, value) {
    var i;
    for (i = 0; i < channel.length; i++) {
        if (channel[i][att] && value) {
            if (channel[i][att].toLowerCase() === value.toLowerCase()) {
                return i;
            }
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
        captcha : {},
        messageCount : 0
    };
    
    function updateUserData(user, newData) {
        var roles = ['God', 'Channel Owner', 'Admin', 'Mod', 'Basic'];
        
        if (newData.nick) {
            user.nick = newData.nick;
            roomEmit('nick', user.id, user.nick);
        }
        
        if (newData.token) {
            tokens[user.nick] = newData.token;
        }
        
        if (newData.role !== undefined) {
            user.role = newData.role;
            newData.role = roles[newData.role];
        }
        
        if (newData.remote_addr) {//if true save current ip to database
            dao.setUserinfo(user.nick, 'remote_addr', user.remote_addr).fail(handleException);
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
    
    var COMMANDS = {
        nick : {
            params : ['nick'],
            handler : function (user, params) {
                var index;
                if (params.nick.length > 0 && params.nick.length < 50 && /^[\x21-\x7E]*$/i.test(params.nick)) {
                    index = findIndex(channel.online, 'nick', params.nick);
                    if (index === -1) {
                        dao.find(params.nick).then(function () {
                            showMessage(user.socket, 'This nick is registered, if this is your nick use /login', 'error');
                        }).fail(function () {
                            updateUserData(user, {
                                nick : params.nick,
                                role : 4
                            });
                        });   
                    } else {
                        showMessage(user.socket, 'That nick is already being used', 'error');
                    }
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
                                    } else if (channelRoles[dbuser.nick]) {
                                        if (channelRoles[dbuser.nick] !== 0) {
                                            userRole = channelRoles[dbuser.nick];
                                        } else {
                                            userRole = 4;
                                        }
                                    } else {
                                        userRole = 4;
                                    }
                                    
                                    if (dbuser.hat) {
                                        user.hat = JSON.parse(dbuser.hat).current;
                                    }
                                    
                                    updateUserData(user, {
                                        nick : dbuser.nick,
                                        token : dao.makeId(),
                                        remote_addr : true,
                                        role : userRole,
                                        flair : dbuser.flair
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
                        }).fail(function (err) {
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
                    message,
                    userData;
                
                dao.getChannelinfo(channelName).then(function (channelRoles) {
                    if (index !== -1) {
                        userData = channel.online[index];
                    }

                    dao.find(params.nick).then(function (dbuser) {
                        if (userData) {
                            message = 'Nick: ' + userData.nick + '\nRole: ' + userData.role + '\nIP: ' + (user.role <= 1 ? userData.remote_addr : 'Private');
                        } else {
                            message = 'Nick: ' + dbuser.nick + '\nRole: ' + (channelRoles[dbuser.nick] || dbuser.role) + '\nIP: ' + (user.role <= 1 ? dbuser.remote_addr : 'Private');  
                        }
                        message += '\nRegistered: Yes';
                        showMessage(user.socket, message, 'info');   
                    }).fail(function () {
                        if (userData) {
                            message = 'Nick: ' + userData.nick + '\nRole: ' + userData.role + '\nIP: ' + (user.role <= 1 ? userData.remote_addr : 'Private');
                        } else {
                            message = params.nick + ' doesn\'t exist'
                        }
                        message += '\nRegistered: No';
                        showMessage(user.socket, message, 'info');   
                    });
                });
                
            }
        },
        change_password : {
            params : ['oldpassword', 'newpassword'],
            handler : function (user, params) {
                if (params.oldpassword && params.newpassword && params.newpassword.length > 3) {
                    dao.login(user.nick, params.oldpassword).then(function (correctPassword, dbuser) {
                        dao.encrypt(params.newpassword).then(function (hash) {
                            dao.setUserinfo(dbuser.nick, 'password', hash).then(function () {
                                showMessage(user.socket, 'Password has been changed', 'info');
                            });
                        });
                    }).fail(function () {
                        showMessage(user.socket, 'Wrong password, if you\'ve forgot your password contact an admin', 'error'); 
                    });
                } else {
                    showMessage(user.socket, 'Please pick a more secure password', 'error');
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
                    if (user.role <= channel.online[index].role) {
                            roomEmit('message', {
                            message : user.nick + ' kicked ' + params.nick + (params.reason ? ': ' + params.reason : ''),
                            messageType : 'general'
                        });
                        showMessage(channel.online[index].socket, message, 'error');
                        channel.online[index].socket.disconnect();
                    } else {
                        showMessage(user.socket, params.nick + ' is not kickable');
                    }
                } else {
                    showMessage(user.socket, params.nick + ' is not online');
                }
            }
        },
        ban : {
            role : 1,
            params : ['nick'],
            optionalParams : ['reason'],
            handler : function (user, params) {
                var index = findIndex(channel.online, 'nick', params.nick),
                    message = params.reason ? 'You\'ve been banned: ' + params.reason : 'You\'ve been banned';
                
                if (index !== -1) {
                    showMessage(channel.online[index].socket, message, 'error');
                    channel.online[index].socket.disconnect();
                }
                
                dao.ban(channelName, params.nick, user.nick, params.reason).then(function () {
                    roomEmit('message', {
                        message : user.nick + ' banned ' + params.nick + (params.reason ? ': ' + params.reason : ''),
                        messageType : 'general'
                    });
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
        whitelist : {
            role : 1,
            params : ['nick'],
            handler : function (user, params) {
                dao.find(params.nick).then(function (dbuser) {
                    dao.getChannelAtt(channelName, 'whitelist').then(function (whitelist) {
                        if (whitelist === undefined) {
                            whitelist = [];
                        }
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
            handler : function (user, params) {
                dao.getChannelAtt(channelName, 'whitelist').then(function (whitelist) {
                    if (whitelist === undefined) {
                        whitelist = [];
                    }
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
        delete : {
            role : 0,
            params : ['nick'],
            handler : function (user, params) {
                dao.unregister(params.nick).then(function () {
                    showMessage(user.socket, dbuser.nick + ' has been deleted.');
                }).fail(function () {
                    showMessage(user.socket, params.nick + ' isn\'t registered.','error');
                });
            }
        },
        global : {
            role : 0,
            params : ['message'],
            handler : function(user, params){
                if (params.message.length < 1000) {
                    io.emit('message',{
                        message : params.message,
                        messageType : 'general'
                    });
                } else {
                    showMessage(user.socket, 'message too long');
                }
            }
        },
        find : {
            role : 0,
            params : ['ip'],
            handler : function (user, params) {
                var IP = params.ip;
                
                function findAccounts (ip) {
                    dao.findip(ip).then(function (accounts) {
                        if (accounts && accounts.length) {
                            showMessage(user.socket, 'IP ' + ip + ' matched accounts: ' + accounts.join(', '), 'info');
                        } else {
                            showMessage(user.socket, 'No accounts matched this ip.', 'error');
                        }
                    });
                }

                if (IP.split('.').length !== 4) {//if paramter doesn't have 4 dots its a nick
                    var index = findIndex(channel.online, 'nick', IP);
                    if (index !== -1) {
                        findAccounts(channel.online[index].remote_addr);
                    } else {
                        dao.find(IP).then(function (dbuser) {
                            findAccounts(dbuser.remote_addr);
                        }).fail(function () {
                            showMessage(user.socket, 'No accounts matched this nick.', 'error');
                        });
                    }
                } else {
                    findAccounts(IP);
                }
            }
        },
        refresh : {
            role : 0,
            handler : function (user) {
                var i;
                
                roomEmit('refresh');
                for (i = 0; i < channel.online.length; i++) {
                    channel.online[i].socket.disconnect();
                }
                channel.online = [];
            }
        },
        access : {
            role : 1,
            params : ['nick', 'role'],
            handler : function (user, params) {
                var role = parseInt(params.role, 10);
                
                if (role > 0 && role < 5) {
                    dao.find(params.nick).then(function () {
                        dao.setChannelRole(channelName, params.nick, role).then(function () {
                            var index = findIndex(channel.online, 'nick', params.nick);
                            if (index !== -1) {
                                channel.online[index].role = parseInt(role, 10);
                                showMessage(user.socket, params.nick + ' now has role ' + role, 'info');
                                showMessage(channel.online[index].socket, 'role is now set to ' + role, 'info');
                            }
                        });
                    }).fail(function () {
                        showMessage(user.socket, 'That user isn\'t registered', 'error');
                    });   
                }
            }
        },
        pm : {
            params : ['nick', 'message'],
            handler : function (user, params) {
                var index = findIndex(channel.online, 'nick', params.nick),
                    PMuser;
                
                if (params.message && params.message.length < 10000) {
                    if (index !== -1) {
                        PMuser = channel.online[index];
                        PMuser.socket.emit('message', {
                            message : ' ' + params.message,
                            messageType : 'personal',
                            nick : user.nick
                        });

                        if (PMuser.id !== user.id) {
                            user.socket.emit('message', {
                                message : ' ' + params.message,
                                messageType : 'personal',
                                nick : user.nick
                            });   
                        }
                    } else {
                        showMessage(user.socket, 'That user isn\'t online', 'error');
                    }
                }
            }
        },
        banlist : {
            handler : function (user) {
                dao.banlist(channelName).then(function (banlist, banData) {
                    user.socket.emit('banlist', banData);
                });
            }
        },
        give_hat : {
            role : 0,
            params : ['nick', 'hat'],
            handler : function (user, parmas) {
                var allHats,
                    hatIndex,
                    hatName,
                    usersHats,
                    userIndex;
                    
                dao.find(parmas.nick).then(function (dbuser) {
                    allHats = dao.getHats();
                    hatIndex = allHats.lowercase.indexOf(parmas.hat.toLowerCase());
                    userIndex = findIndex(channel.online, 'nick', dbuser.nick);
                    
                    if (dbuser.hat) {
                        try {
                            usersHats = JSON.parse(dbuser.hat);
                        } catch (err) {
                            usersHats = {
                                available : ['none'],
                                current : ''
                            };
                        }
                    } else {
                        usersHats = {
                            available : ['none'],
                            current : ''
                        };
                    }
                    
                    if (hatIndex !== -1) {
                        hatName = allHats.lowercase[hatIndex];
                        if (usersHats.available.indexOf(hatName) === -1) {
                            usersHats.available.push(hatName);
                            dao.setUserinfo(dbuser.nick, 'hat', usersHats).then(function () {
                                if (userIndex !== -1) {
                                    showMessage(channel.online[userIndex].socket, 'You now have access to hat: ' + hatName, 'info');
                                }
                                showMessage(user.socket, user.nick + ' now has access to ' + hatName, 'info');
                            });
                        } else {
                            showMessage(user.socket, user.nick + ' already has access to ' + hatName, 'info');
                        }
                    } else {
                        showMessage(user.socket, 'That hat doesn\'t exist', 'error');
                    }
                }).fail(function () {
                    showMessage(user.socket, 'That user isn\'t registered', 'error');
                });
            }
        },
        hat : {
            params : ['hat'],
            handler : function (user, params) {
                var usersHats,
                    userHatIndex,
                    hatIndex,
                    allHats;
                    
                dao.find(user.nick).then(function (dbuser) {
                    if (dbuser.hat) {
                        allHats = dao.getHats();
                        usersHats = JSON.parse(dbuser.hat);
                        hatIndex = allHats.lowercase.indexOf(params.hat.toLowerCase());

                        if (hatIndex !== -1) {
                            userHatIndex = usersHats.available.indexOf(allHats.lowercase[hatIndex]);
                            if (userHatIndex !== -1) {
                                usersHats.current = allHats.name[hatIndex];
                                dao.setUserinfo(dbuser.nick, 'hat', usersHats).then(function () {
                                    user.hat = allHats.name[hatIndex];
                                    showMessage(user.socket, 'You are now wearing hat: ' + allHats.lowercase[hatIndex], 'info');
                                });
                            } else {
                                showMessage(user.socket, 'You don\'t have access to that hat', 'error');
                            }
                        } else {
                            showMessage(user.socket, 'That hat doesn\'t exist', 'error');
                        }
                    } else {
                        showMessage(user.socket, 'You don\'t have any hats', 'error'); 
                    }
                }).fail(function () {
                    showMessage(user.socket, 'Must be registered to own a hat', 'error'); 
                });
            }
        },
        afk : {
            params : ['message'],
            handler : function (user, params) {
                if (params.message.length < 200) {
                    if (params.message === 'none') {
                        delete user.afk;
                    } else {
                        user.afk = params.message;
                    }
                    roomEmit('afk', user.id, user.afk);
                }
            }
        }
    };
    
    room.on('connection', function (socket) {
        
        var user = {
            remote_addr : socket.conn.remoteAddress,
            socket : socket,
            role : 4,
            id : dao.makeId()
        };
        
        if (socket.request.headers['cf-connecting-ip']) {//if header is present replace clients ip with header
            user.remote_addr = socket.request.headers['cf-connecting-ip'];
        }
        
        socket.on("cursor", function(cursor){
            if (findIndex(channel.online, 'id', user.id) != -1) {
                cursor.y = cursor.y || 0;
                cursor.x = cursor.x || 0;
                
                roomEmit("cursor", {
                    "id": user.id,
                    "nick": user.nick,
                    "x": cursor.x,
                    "y": cursor.y
                });
            }
        });
        
        socket.on("removeCursor", function(){
            if (findIndex(channel.online, 'id', user.id) != -1) {
                roomEmit("removeCursor", user.id);
            }
        });
        
        socket.on('message', function (message, flair) {
            throttle.on(user.remote_addr + '-message').then(function (notSpam) {
                if (notSpam) {
                    if (findIndex(channel.online, 'id', user.id) != -1) {
                        if (typeof message === 'string' && (typeof flair === 'string' || !flair)) {
                            if (message.length < 10000 && (flair && flair.length < 500 || !flair)) {
                                roomEmit('message', {
                                    message : message,
                                    messageType : 'chat',
                                    nick : user.nick,
                                    flair : flair,
                                    hat : user.hat,
                                    count : ++channel.messageCount
                                });      
                            }
                        }   
                    }
                } else {
                    showMessage(user.socket,'You are spamming, stop or you will be temporarily banned.', 'error');
                    throttle.warn(user.remote_addr + '-message');
                }
            }).fail(function () {
                dao.ban(channelName,user.remote_addr,'Throttle', 'Message spamming');
                showMessage(user.socket, 'You have been banned for spamming.','error');
                socket.disconnect();
            });
        });
        
        socket.on("typing", function() {
            roomEmit("typing", user.id);
        });
        
        socket.on('message-image', function (message, flair) {
            var acceptedFiletypes = ["image/png", "image/jpg", "image/jpeg", "image/gif", "image/webp"];
            throttle.on(user.remote_addr + '-message').then(function (notSpam) {
                if (notSpam) {
                    if (findIndex(channel.online, 'id', user.id) != -1) {
                        if (message && typeof message.type === 'string' && acceptedFiletypes.indexOf(message.type) != -1 &&typeof message.img === 'string' && (typeof flair === 'string' || !flair)) {
                            if (message.img.length < 7000001) {
                                if (flair && flair.length < 500 || !flair) {
                                    roomEmit('message', {
                                        message : message,
                                        messageType : 'chat-image',
                                        nick : user.nick,
                                        flair : flair,
                                        hat : user.hat,
                                        count : ++channel.messageCount
                                    });      
                                }
                            }
                        }   
                    }
                } else {
                    showMessage(user.socket,'You are spamming, stop or you will be temporarily banned.', 'error');
                    throttle.warn(user.remote_addr + '-message');
                }
            }).fail(function () {
                dao.ban(channelName,user.remote_addr,'Throttle', 'Message spamming');
                showMessage(user.socket, 'You have been banned for spamming.','error');
                socket.disconnect();
            });
        });
        
        socket.on('privateMessage', function (message, flair, userID) {
            var index,
                sendUser;
            
            if (typeof message === 'string' && (!flair || typeof flair === 'string') && typeof userID === 'string') {
                if (message.length < 10000 && (!flair || flair.length < 500)) {
                    index = findIndex(channel.online, 'id', userID);
                    if (index !== -1) {
                        channel.online[index].socket.emit('pmMessage', {
                            message : message,
                            messageType : 'chat',
                            nick : user.nick,
                            flair : flair,
                            landOn : user.id
                        });
                        if (user.id !== userID) {
                            user.socket.emit('pmMessage', {
                                message : message,
                                messageType : 'chat',
                                nick : user.nick,
                                flair : flair,
                                landOn : userID
                            });
                        }
                    }
                }
            }
        });
        
        function handleCommand(command, params) {
            var valid = true,
                i;
            
            if (command.role === undefined || command.role >= user.role) {
                if (command.params) {
                    for (i = 0; i < command.params.length; i++) {
                        if (typeof params[command.params[i]] !== 'string' && (command.optionalParams && typeof params[command.optionalParams[i]] !== 'string')) {
                            valid = false;
                        }
                    }

                    if (valid) {
                        command.handler(user, params);
                    }
                } else {
                    command.handler(user);
                }   
            } else {
                showMessage(user.socket, 'Don\'t have access for this command', 'error');
            }
        }
        
        socket.on('command', function (commandName, params) {
            throttle.on(user.remote_addr + '-command').then(function (notSpam) {
                if (notSpam) {
                    if (typeof commandName === 'string' && COMMANDS[commandName]) {
                        if (!params || typeof params === 'object') {
                            handleCommand(COMMANDS[commandName], params);
                        }
                    }
                } else {
                    showMessage(user.socket, 'You are spamming, stop or you will be temporarily banned.','error');
                    throttle.warn(user.remote_addr);
                }
            }).fail(function () {
                dao.ban(channelName, user.remote_addr, 'Throttle', 'Command spamming');
                showMessage(user.socket,'You have been banned for spamming.', 'error');
                socket.disconnect();
            });
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
        
        socket.on('channelStatus', function (settings) {
            var validSettings = {
                captcha : {
                    type : 'boolean',
                    role : 1
                },
                lock : {
                    type : 'boolean',
                    role : 1
                },
                topic : {
                    type : 'string',
                    role : 3
                },
                note : {
                    type : 'string',
                    role : 1
                },
                background : {
                    type : 'string',
                    role : 2
                },
                themecolors : {
                    type : 'object',
                    role : 2
                }
            },
                keys = Object.keys(settings),
                valid = true,
                errorMessage;
            
            if (typeof settings === 'object') {
                for (var i = 0; i < keys.length; i++) {
                    if (validSettings[keys[i]]) {
                        if (typeof settings[keys[i]] === validSettings[keys[i]].type) {
                            if (user.role > validSettings[keys[i]].role) {
                                valid = false;
                                errorMessage = 'Don\'t have access for this command';
                            }
                        } else {
                            valid = false;
                            errorMessage = 'Invalid settings';
                        }
                    } else {
                        valid = false;
                        errorMessage = 'Invalid settings 2';
                    }
                }
                
                if (valid) {
                    dao.setChannelinfo(channelName, settings).then(function () {
                        roomEmit('channeldata', {
                            data : settings,
                            updatedBy : user.nick
                        });
                    }).fail(handleException);     
                } else {
                    showMessage(user.socket, errorMessage, 'error');
                }
            }
        });
        
        function joinChannel(requestedData, channelRoles, channelData, overRide) {
            var i,
                onlineUsers = [],
                roleNames = ['God', 'Admin', 'Mod', 'Basic'],
                userRole;
            
            function join(channelData, nick, role, hat) {
                
                if (typeof nick === 'string' && nick.length > 0 && nick.length < 50 && /^[\x21-\x7E]*$/i.test(nick)) {
                    user.nick = nick;
                    user.token = dao.makeId();
                    tokens[user.nick] = user.token;
                    
                    if (hat) {
                        user.hat = JSON.parse(hat).current;
                    }
                    
                    if (role !== undefined) {
                        user.role = role;
                    } else {
                        user.role = 4;
                    } 
                } else {
                    user.nick = dao.getNick();
                }
                
                console.log('USER JOIN', nick, user.role, user.remote_addr);
                
                for (i = 0; i < channel.online.length; i++) {
                    onlineUsers.push({
                        nick : channel.online[i].nick,
                        id : channel.online[i].id,
                        afk : channel.online[i].afk
                    });
                }

                channel.online.push(user);
                
                socket.join('chat');
                
                socket.emit('channeldata', {
                    users : onlineUsers,
                    data : channelData
                });
                
                socket.emit('update', {
                    nick : user.nick,
                    role : roleNames[user.role],
                    token : user.token
                });
                
                roomEmit('joined', user.id, user.nick);
            }
            
            if (typeof requestedData.nick === 'string') {
                
                var index = findIndex(channel.online, 'nick', requestedData.nick);
                
                if (index === -1) {
                    dao.find(requestedData.nick).then(function (dbuser) {
                        if (tokens[requestedData.nick] === requestedData.token || overRide) {
                            if (dbuser.role === 0) {
                                userRole = 0;
                            } else {
                                userRole = channelRoles[requestedData.nick];
                            }
                            join(channelData, dbuser.nick, userRole, dbuser.hat);
                        } else {
                            join(channelData);
                        }
                    }).fail(function () {
                        join(channelData, requestedData.nick);
                    });   
                } else {
                    join(channelData);
                }
            } else {
                join(channelData);
            }
        }
        
        function attemptLockedChannel(requestedData, channelRoles, channelData) {
            if (requestedData.nick) {
                if (requestedData.token && tokens[requestedData.nick] === requestedData.token) {
                    joinChannel(requestedData, channelRoles, channelData, true);
                } else if (requestedData.password) {
                    dao.login(requestedData.nick, requestedData.password).then(function (correctPassword, dbuser) {
                        if (correctPassword) {
                            joinChannel(requestedData, channelRoles, channelData, true);
                        } else {
                            showMessage(socket, 'Incorrect password', 'error');
                        }
                    }).fail(function () {
                        showMessage(socket, 'That account doesn\'t exist', 'error');
                    });
                } else {
                    socket.emit('locked');
                }
            } else {
                socket.emit('locked');
            }        
        }
        
        function attemptCaptcha(requestedData, channelRoles, channelData) {
            var code;
            if (channel.captcha[user.id]) {
                if (requestedData.captcha) {
                    if (channel.captcha[user.id].toUpperCase() === requestedData.captcha.toUpperCase()) {
                        delete channel.captcha[user.id];
                        joinChannel(requestedData, channelRoles, channelData);
                    } else {
                        showMessage(socket, 'Incorrect captcha code!', 'error');
                    }   
                }
            } else {
                code = captchaGen.generateRandomText(8);
                channel.captcha[user.id] = code;
                showMessage(socket, "Please solve a captcha with /code CAPTCHA before continuing.");
                socket.emit("captcha", captchaGen.word2Transformedstr(code));
            }
        }
        
        function attemptJoin(requestedData) {
            var IPIndex,
                nickIndex;
            
            if (findIndex(channel.online, 'id', user.id) === -1) {
                dao.banlist(channelName).then(function (banlist) {
                    if (banlist.indexOf(user.remote_addr) === -1 && banlist.indexOf(requestedData.nick) === -1) {
                        dao.getChannelinfo(channelName).then(function (channelRoles, channelData) {
                            if (channelData.lock) {
                                attemptLockedChannel(requestedData, channelRoles, channelData);
                            } else if (channelData.captcha) {
                                attemptCaptcha(requestedData, channelRoles, channelData);
                            } else {
                                joinChannel(requestedData, channelRoles, channelData);
                            }
                        });
                    } else {
                        showMessage(socket, 'You are banned', 'error');
                    }   
                });   
            } else {
                showMessage(socket, 'Only one socket connection allowed', 'error');
            }
        }
        
        socket.on('requestJoin', function (requestedData) {
            if (typeof requestedData !== 'object') {
                requestedData = {};
            }
            
            throttle.on(user.remote_addr + '-join', 3).then(function (notSpam) {
                if (notSpam) {
                    attemptJoin(requestedData);
                } else {
                    showMessage(socket, 'You are spamming, stop or you will be temporarily banned.', 'error');
                    throttle.warn(user.remote_addr + '-join');
                }
            }).fail(function () {
                dao.ban(channelName, user.remote_addr, 'Throttle', 'Join spamming');
                showMessage(socket, 'You have been banned for spamming.', 'error');
                socket.disconnect();
            });
        });
        
        socket.on('disconnect', function () {
            var index = findIndex(channel.online, 'nick', user.nick);
            if (index !== -1) {
                roomEmit('left', user.id);
                channel.online.splice(index, 1);
            }
            if (channel.captcha[user.id]) {
                delete channel.captcha[user.id];
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
    var port = (process.env.PORT || 80);
    http.listen(port, function () {
       console.log('listening on *:'+port);
       intoapp(app, http);
    });
})();