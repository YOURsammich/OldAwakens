var dao = require('./dao');
var request = require('request');
var throttle = require('./throttle');
var _ = require('underscore');
var $ = require('jquery-deferred');
var express = require('express');
var fs = require('fs');
var minify = require('express-minify');
var url = require("url");

var channels = {};
var tokens = {};
var privateconvo = {};

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
        messageCount : 0,
        commandRoles : {}
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
        
        if (newData.cursor) {
            try {
                newData.cursor = JSON.parse(newData.cursor).name;
                user.cursor = newData.cursor;
                roomEmit('changeCursor', user.id, user.cursor);
            } catch (err) {
                //
            }
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
    
    function updateChannelInfo(nick, att, value) {
        var formatSettings = {
            value : value,
            updatedBy : nick,
            date : new Date().getTime()
        };

        dao.setChannelAtt(channelName, att, formatSettings).then(function () {
            roomEmit('channelDetails', {
                [att] : formatSettings
            });
        })
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
                                dao.getChannelinfo(channelName).then(function (channelData) {//check for channel roles
                                    if (dbuser.role === 0) {// check if god role
                                        userRole = 0;
                                    } else if (channelData.roles && channelData.roles[dbuser.nick]) {
                                        if (channelData.roles[dbuser.nick] !== 0) {
                                            userRole = channelData.roles[dbuser.nick];
                                        } else {
                                            userRole = 4;
                                        }
                                    } else {
                                        userRole = 4;
                                    }
                                    
                                    if (dbuser.hat) {
                                        user.hat = JSON.parse(dbuser.hat).current;
                                    }
                                    
                                    dao.getUsersStyleProfile(dbuser.nick).then(function (profiles) {
                                        user.socket.emit('channeldata', {
                                            styles : profiles
                                        });
                                    });
                                    
                                    updateUserData(user, {
                                        nick : dbuser.nick,
                                        token : dao.makeId(),
                                        remote_addr : true,
                                        role : userRole,
                                        flair : dbuser.flair,
                                        cursor : dbuser.cursor
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
                if (params.nick.length < 50 && /^[\x21-\x7E]*$/i.test(params.nick)) {
                    if (params.password.length > 4) {
                        dao.findip(user.remote_addr).then(function (accounts) {
                            if (accounts.length < 5) {
                                dao.register(params.nick, params.password, user.remote_addr).then(function () {
                                    showMessage(user.socket, 'account registered', 'info');
                                    updateUserData(user, {
                                        nick : params.nick
                                    });
                                }).fail(function (err) {
                                    showMessage(user.socket, params.nick + ' is already registered', 'error');
                                });
                            } else {
                                showMessage(user.socket, 'Serveral accounts already registered with this IP');
                            }
                        });
                    } else {
                        showMessage(user.socket, 'Please choose a password that is at least 5 characters long', 'error');
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
                            message = 'Nick: ' + userData.nick + '\nRole: ' + userData.role + '\nIP: ' + (user.role <= 1 || user.nick === userData.nick ? userData.remote_addr : 'Private');
                        } else {
                            message = 'Nick: ' + dbuser.nick + '\nRole: ' + (channelRoles[dbuser.nick] || dbuser.role) + '\nIP: ' + (user.role === 0 ? dbuser.remote_addr : 'Private');
                        }
                        message += '\nRegistered: Yes';
                        showMessage(user.socket, message, 'info');
                    }).fail(function () {
                        if (userData) {
                            message = 'Nick: ' + userData.nick + '\nRole: ' + userData.role + '\nIP: ' + (user.role <= 1 || user.nick === userData.nick ? userData.remote_addr : 'Private');
                        } else {
                            message = params.nick + ' doesn\'t exist';
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
            params : ['nick', 'reason'],
            handler : function (user, params) {
                var index = findIndex(channel.online, 'nick', params.nick),
                    message = params.reason ? 'You\'ve been banned: ' + params.reason : 'You\'ve been banned';
                
                dao.find(params.nick).then(function (dbuser) {
                    dao.ban(channelName, dbuser.remote_addr, dbuser.nick, user.nick, params.reason).then(function () {
                        roomEmit('message', {
                            message : user.nick + ' banned ' + params.nick + (params.reason ? ': ' + params.reason : ''),
                            messageType : 'general'
                        });
                        showMessage(user.socket, params.nick + ' is now IP and nick banned', 'info');
                    }).fail(function () {
                        showMessage(user.socket, params.nick + ' is already banned', 'error');
                    });
                }).fail(function () {
                    if (index !== -1) {
                        dao.ban(channelName, channel.online[index].remote_addr, null, user.nick, params.reason).then(function () {
                            showMessage(user.socket, params.nick + ' is now IP banned', 'info');
                        }).fail(function () {
                            showMessage(user.socket, params.nick + ' is already banned', 'error');
                        });
                        showMessage(channel.online[index].socket, message, 'error');
                        channel.online[index].socket.disconnect();
                    } else {
                        dao.ban(channelName, null, params.nick, user.nick, params.reason).then(function () {
                            showMessage(user.socket, params.nick + ' is now nick banned', 'info');
                        }).fail(function () {
                            showMessage(user.socket, params.nick + ' is already banned', 'error');
                        });
                    }
                });
            }
        },
        bannick : {
            role : 1,
            params : ['nick', 'reason'],
            handler : function (user, params) {
                var index = findIndex(channel.online, 'nick', params.nick),
                    message = params.reason ? 'You\'ve been banned: ' + params.reason : 'You\'ve been banned';
                
                if (index !== -1) {
                    showMessage(channel.online[index].socket, message, 'error');
                    channel.online[index].socket.disconnect();
                }
                
                dao.ban(channelName, null, params.nick, user.nick, params.reason).then(function () {
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
            params : ['ip', 'reason'],
            handler : function (user, params) {
                var index = findIndex(channel.online, 'remote_addr', params.ip),
                    message = params.reason ? 'You\'ve been banned: ' + params.reason : 'You\'ve been banned';
                
                if (index !== -1) {
                    showMessage(channel.online[index].socket, message, 'error');
                    channel.online[index].socket.disconnect();
                }
                
                dao.ban(channelName, params.ip, null, user.nick, params.reason).then(function () {
                    showMessage(user.socket, params.ip + ' is now a banned IP address', 'info');
                }).fail(function () {
                    showMessage(user.socket, params.ip + ' is already banned', 'error');
                });
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
                        if (whitelist.indexOf(params.nick) === -1) {
                            whitelist.push(params.nick);
                            dao.setChannelinfo(channelName, {
                                whitelist : whitelist
                            }).then(function () {
                                showMessage(user.socket, params.nick + ' is now whitelisted', 'info');
                            });
                        } else {
                            showMessage(user.socket, params.nick + ' is already whitelisted', 'error');
                        }
                    });
                }).fail(function () {
                    showMessage(user.socket, user.nick + ' is not registered', 'error');
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
                        dao.setChannelinfo(channelName, {
                            whitelist : whitelist
                        }).then(function () {
                            showMessage(user.socket, params.nick + ' has been unwhitelisted', 'info');
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
                
                if (role > 1 && role < 5) {
                    dao.find(params.nick).then(function (dbuser) {
                        dao.setChannelRole(channelName, dbuser.nick, role).then(function () {
                            var index = findIndex(channel.online, 'nick', dbuser.nick);
                            if (index !== -1) {
                                channel.online[index].role = parseInt(role, 10);
                                showMessage(channel.online[index].socket, 'role is now set to ' + role, 'info');
                            }
                            showMessage(user.socket, dbuser.nick + ' now has role ' + role, 'info');
                        });
                    }).fail(function () {
                        showMessage(user.socket, 'That user isn\'t registered', 'error');
                    });   
                } else {
                    showMessage(user.socket, 'Invalid role', 'error');
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
                dao.banlist(channelName).then(function (banlist) {
                    user.socket.emit('banlist', banlist);
                });
            }
        },
        give_hat : {
            role : 0,
            params : ['nick', 'hat'],
            handler : function (user, parmas) {        
                dao.find(parmas.nick).then(function (dbuser) {
                    var allHats = dao.getHats(),
                        hatIndex = allHats.lowercase.indexOf(parmas.hat.toLowerCase()),
                        hatName,
                        usersHats,
                        userIndex;
                    
                    if (dbuser.hat) {
                        try {
                            usersHats = JSON.parse(dbuser.hat);
                        } catch (err) {
                            usersHats = {
                                available : [''],
                                current : ''
                            };
                        }
                    } else {
                        usersHats = {
                            available : [''],
                            current : ''
                        };
                    }
                    
                    if (hatIndex !== -1) {
                        hatName = allHats.lowercase[hatIndex];
                        if (usersHats.available.indexOf(hatName) === -1) {
                            usersHats.available.push(hatName);
                            dao.setUserinfo(dbuser.nick, 'hat', usersHats).then(function () {
                                userIndex = findIndex(channel.online, 'nick', dbuser.nick);
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
        remove_hat : {
            params : ['nick', 'hat'],
            handler : function (user, params) {
                var usersHats,
                    userHatIndex,
                    hatIndex,
                    hatName,
                    allHats,
                    userIndex;
                
                
                dao.find(params.nick).then(function (dbuser) {
                    if (dbuser.hat) {
                        usersHats = JSON.parse(dbuser.hat);
                        hatName = params.hat.toLowerCase();
                        hatIndex = usersHats.available.indexOf(hatName);
                        
                        if (hatIndex !== -1) {
                            usersHats.available.splice(hatIndex, 1);
                            
                            if (usersHats.current.slice(0, -4).toLowerCase() === hatName) {
                                usersHats.current = 'none';
                                user.hat = 'none';
                            }
                            
                            dao.setUserinfo(params.nick, 'hat', usersHats).then(function () {
                                userIndex = findIndex(channel.online, 'nick', dbuser.nick);
                                
                                if (userIndex !== -1) {
                                    showMessage(channel.online[userIndex].socket, 'You no longer have access to hat: ' + hatName, 'info');
                                }
                                showMessage(user.socket, hatName + ' hat removed', 'info'); 
                            });
                        } else {
                            showMessage(user.socket, dbuser.nick + ' doesn\'t have hat: ' + hatName, 'info');
                        }
                    } else {
                        showMessage(user.socket, 'User doesn\'t have any hats', 'error'); 
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
                    allHats,
                    hatName;
                    
                dao.find(user.nick).then(function (dbuser) {
                    if (dbuser.hat) {
                        allHats = dao.getHats();
                        usersHats = JSON.parse(dbuser.hat);
                        hatIndex = allHats.lowercase.indexOf(params.hat.toLowerCase());
                        
                        if (hatIndex !== -1) {
                            userHatIndex = usersHats.available.indexOf(allHats.lowercase[hatIndex]);
                            
                            if (userHatIndex !== -1) {
                                hatName = allHats.name[hatIndex];
                            }
                        } else if (params.hat.toLowerCase() === 'none') {
                            hatName = 'none';
                        }
                        
                        if (hatName) {
                            usersHats.current = hatName;                            
                            dao.setUserinfo(dbuser.nick, 'hat', usersHats).then(function () {
                                user.hat = usersHats.current;
                                showMessage(user.socket, 'You are now wearing hat: ' + usersHats.current, 'info');
                            });
                        } else {
                            showMessage(user.socket, 'You don\'t have access to that hat', 'error');
                        }
                    } else {
                        showMessage(user.socket, 'You don\'t have any hats', 'error'); 
                    }
                }).fail(function () {
                    showMessage(user.socket, 'Must be registered to own a hat', 'error'); 
                });
            }
        },
        hatlist : {
            params : ['nick'] ,
            handler : function (user, params) {
                var usersHats;
                
                dao.find(params.nick).then(function (dbuser) {
                    if (dbuser.hat) {
                        usersHats = JSON.parse(dbuser.hat);
                        if (usersHats.available.length) {
                            showMessage(user.socket, dbuser.nick + ' has hats: ' + usersHats.available.join(', '), 'info');
                        } else {
                            showMessage(user.socket, params.nick + ' doesn\'t have any hats', 'info');
                        }
                    } else {
                        showMessage(user.socket, params.nick + ' doesn\'t have any hats', 'info');
                    }
                }).fail(function () {
                    showMessage(user.socket, params.nick + ' isn\'t registered', 'error');
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
        },
        away : {
            handler : function (user) {
                showMessage(user.socket, 'status set to away', 'info');
                roomEmit('idleStatus', user.id, 'away');
            }
        },
        snooze : {
            handler : function (user) {
                showMessage(user.socket, 'status set to unavailable', 'info');
                roomEmit('idleStatus', user.id, 'unavailable');
            }
        },
        cursors : {
            handler : function (user) {
                var allCursors = dao.getCursors().lowercase;
                var b = allCursors.pop();
                showMessage(user.socket, 'Cursors available: ' + allCursors.join(", ") + 'and ' + b + '.');
            }
        },
        cursor : {
            params : ['cursor'],
            handler : function (user, params) {
                var cursorIndex,
                    allCursors;
                    
                dao.find(user.nick).then(function (dbuser) {
                    var allCursors = dao.getCursors();
                    var cursorIndex = allCursors.lowercase.indexOf(params.cursor.toLowerCase());
                    if (cursorIndex !== -1) {
                        dao.setUserinfo(dbuser.nick, 'cursor', allCursors.name[cursorIndex]).then(function () {
                            user.cursor = allCursors.name[cursorIndex];
                            roomEmit('changeCursor', user.id, user.cursor);
                            showMessage(user.socket, 'You are now using cursor: ' + allCursors.lowercase[cursorIndex], 'info');
                        });
                    } else {
                        showMessage(user.socket, 'That cursor doesn\'t exist.', 'error');
                    }
                }).fail(function () {
                    var allCursors = dao.getCursors();
                    var cursorIndex = allCursors.lowercase.indexOf(params.cursor.toLowerCase());
                    if (cursorIndex !== -1) {
                        user.cursor = allCursors.name[cursorIndex];
                        roomEmit('changeCursor', user.id, user.cursor);
                        showMessage(user.socket, 'You are now using cursor: ' + allCursors.lowercase[cursorIndex], 'info');
                    } else {
                        showMessage(user.socket, 'That cursor doesn\'t exist.', 'error');
                    }
                });
            }
        },
        flair : {
            params : ['flair'],
            handler : function (user, params) {
                if (params.flair.length < 900) {
                    dao.setUserinfo(user.nick, 'flair', params.flair);
                }
            }
        },
        part : {
            params : ['part'],
            handler : function (user, params) {
                if (params.part.length < 200) {
                    user.part = params.part;
                    dao.setUserinfo(user.nick, 'part', user.part);
                    user.socket.emit('update', {
                        part : user.part
                    });
                } else {
                    showMessage(user.socket, 'Part must be under 200 characters', 'error');
                }
            }
        },
        claimchannel : {
            handler : function (user, params) {
                dao.getChannelAtt(channelName, 'owner').then(function (owner) {
                    showMessage(user.socket, 'This channel has already been claimed by: ' + owner, 'error');
                }).fail(function () {
                    dao.find(user.nick).then(function (dbuser) {
                        dao.checkChannelOwnerShip(dbuser.nick).then(function (userOwnedChannel) {
                            showMessage(user.socket, 'You may only own one channel at a time, first give up ownership of ' + userOwnedChannel + ' with /giveupchannel', 'info');
                        }).fail(function () {
                            dao.setChannelAtt(channelName, 'owner', dbuser.nick).then(function () {
                                showMessage(user.socket, 'You\'ve claimed "' + channelName + '", its yours :)', 'info');
                                updateUserData(user, {role : 1});
                                roomEmit('channelDetails', {
                                    owner : dbuser.nick
                                });
                            });
                        });
                    }).fail(function () {
                        showMessage(user.socket, 'You must have an account to claim a channel, register with /register', 'info');
                    });
                });
            }
        },
        giveupchannel : {
            handler : function (user) {
                dao.checkChannelOwnerShip(user.nick).then(function (userOwnedChannel) {
                    dao.deleteChannelAtt(userOwnedChannel, 'owner').then(function () {
                        showMessage(user.socket, 'You\'ve given up ownership of: ' + userOwnedChannel, 'info'); 
                    });
                }).fail(function () {
                    showMessage(user.socket, 'You don\'t own a channel', 'error'); 
                });
            }
        },
        lockcommand : {
            role : 1,
            params : ['command', 'role'],
            handler : function (user, params) {
                var role = parseInt(params.role, 10),
                    notThese = ['lockcommand', 'access'];
                if (COMMANDS[params.command] && notThese.indexOf(params.command == -1)) {
                    if (role > 0 && role < 5) {
                        channel.commandRoles[params.command] = role;
                        COMMANDS[params.command].channelRole = role;
                        showMessage(user.socket, params.command + ' set role: ' + role);
                        roomEmit('channeldata', {
                            commandRoles : channel.commandRoles
                        });
                    } else {
                        showMessage(user.socket, 'Invalid role', 'error');
                    }
                } else {
                    showMessage(user.socket, params.command + ' isn\'t a command', 'info');
                }
            }
        },
        topic : {
            role : 3,
            params : ['topic'],
            handler : function (user, params) {
                if (params.topic.length < 500) {
                    updateChannelInfo(user.nick, 'topic', params.topic);   
                } else {
                    showMessage(user.socket, 'Topic may not be over 500 characters', 'info');
                }
            }
        },
        note : {
            role : 1,
            params : ['note'],
            handler : function (user, params) {
                if (params.note.length < 2000) {
                    updateChannelInfo(user.nick, 'note', params.note);   
                } else {
                    showMessage(user.socket, 'Note may not be over 2000 characters', 'info');
                }
            }
        },
        background : {
            role : 2,
            params : ['background'],
            handler : function (user, params) {
                updateChannelInfo(user.nick, 'background', params.background);
            } 
        },
        theme : {
            role : 1,
            params : ['themecolors'],
            handler : function (user, params) {
                updateChannelInfo(user.nick, 'themecolors', params.themecolors);
            } 
        },
        msg : {
            params : ['msg'],
            handler : function (user, params) {
                if (params.msg.length < 200) {
                    updateChannelInfo(user.nick, 'msg', params.msg);
                } else {
                    showMessage(user.socket, 'Msg may not be over 200 characters', 'info');
                }
            }
        },
        unlock : {
            role : 1,
            handler : function (user) {
                updateChannelInfo(user.nick, 'lock', false);
            }
        },
        lock : {
            role : 1,
            handler : function (user) {
                updateChannelInfo(user.nick, 'lock', true);
            }
        },
        proxy : {
            role : 1,
            handler : function (user) {
                updateChannelInfo(user.nick, 'proxy', true);
            }
        },
        unblockproxy : {
            role : 1,
            handler : function (user) {
                updateChannelInfo(user.nick, 'proxy', false);
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
        
        socket.on('saveProfile', function (profile) {
            var valid = true;
            dao.find(user.nick).then(function (dbuser) {
                dao.getUsersStyleProfile(dbuser.nick).then(function (allProfiles) {
                    if (allProfiles.length < 6) {
                        profile = [
                            profile.num, profile.flair,
                            profile.cursor, profile.part,
                            profile.font, profile.color,
                            profile.bgcolor, profile.glow,
                            profile.style, profile.hat,
                        ];
                        if (profile.length == 10 && profile[0] >= 0 && profile[0] <= 5) {
                            for (var i = 0; i < profile.length; i++) {
                                if (typeof profile[i] !== 'string') {
                                    valid = false;
                                }
                            }
                            if (valid) {
                                dao.saveStyleProfile(dbuser.nick, profile).then(function () {
                                    showMessage(socket, 'Profile saved', 'info');
                                });   
                            } else {
                                showMessage(socket, 'Invalid styles', 'error');
                            } 
                        } else {
                            showMessage(socket, 'invalid number', 'error');
                        }
                    } else {
                        showMessage(socket, 'You are limited to 5 profiles', 'error');
                    }
                });  
            }).fail(function () {
                showMessage(socket, 'Register to save profiles so you can have it next time you join', 'info');
            });
        });
        
        socket.on('deleteProfile', function (num) {
            dao.find(user.nick).then(function (dbuser) {
                dao.deleteStyleProfile(dbuser.nick, num).then(function () {
                    showMessage(socket, 'Style profile deleted', 'info'); 
                });
            });
        });
        
        socket.on('uploadCursor', function (base64) {
            dao.find(user.nick).then(function () {
                if (!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/.test(base64)) {
                    if (base64.length < 6000) {
                        user.cursor = base64;
                        dao.setUserinfo('cursor', base64);
                        roomEmit('changeCursor', user.id, user.cursor);
                    } else {
                        showMessage(socket, 'Image is too big', 'error');
                    }
                } else {
                    showMessage(socket, 'That is\'t base64', 'error');
                }
            }).fail(function () {
                showMessage(socket, 'Must be registered to upload a cursor', 'error'); 
            });
        });
        
        socket.on('updateCursor', function (cursorData) {
            if (findIndex(channel.online, 'id', user.id) !== -1 && typeof cursorData === 'object') {
                if (!isNaN(parseInt(cursorData.y)) && !isNaN(parseInt(cursorData.x))) {
                    roomEmit('updateCursor', {
                        id : user.id,
                        position : cursorData,
                        cursor : user.cursor
                    });
                }
            }
        });
        
        socket.on('removeCursor', function () {
            if (findIndex(channel.online, 'id', user.id) !== -1) {
                roomEmit('removeCursor', user.id);
            }
        });
        
        socket.on('message', function (message, flair) {
            throttle.on(user.remote_addr + '-message').then(function () {
                if (findIndex(channel.online, 'id', user.id) !== -1) {
                    if (typeof message === 'string' && (typeof flair === 'string' || !flair)) {
                        if (message.length < 10000 && ((flair && flair.length < 500) || !flair)) {
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
            }).fail(function (spammer) {
                if (spammer) {
                    dao.ban(channelName, user.remote_addr, null, 'Throttle', 'Message spamming');
                    showMessage(user.socket, 'You have been banned for spamming.', 'error');
                    socket.disconnect();
                } else {
                    showMessage(user.socket, 'You are spamming, stop or you will be temporarily banned.', 'error');
                    throttle.warn(user.remote_addr + '-message');
                }
            });
        });
        
        socket.on('message-image', function (message, flair) {
            var acceptedFiletypes = ["image/png", "image/jpg", "image/jpeg", "image/gif", "image/webp"];
            throttle.on(user.remote_addr + '-message').then(function (notSpam) {
                if (findIndex(channel.online, 'id', user.id) !== -1) {
                    if (message && typeof message.type === 'string' && acceptedFiletypes.indexOf(message.type) !== -1 && typeof message.img === 'string' && (typeof flair === 'string' || !flair)) {
                        if (message.img.length < 7000001) {
                            if ((flair && flair.length < 500) || !flair) {
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
            }).fail(function (spammer) {
                if (spammer) {
                    dao.ban(channelName, user.remote_addr, null,'Throttle', 'Message spamming');
                    showMessage(user.socket, 'You have been banned for spamming.', 'error');
                    socket.disconnect();
                } else {
                    showMessage(user.socket, 'You are spamming, stop or you will be temporarily banned.', 'error');
                    throttle.warn(user.remote_addr + '-message');
                }
            });
        });
        
        socket.on('typing', function (typing) {
            if (typeof typing === 'boolean') {
                roomEmit('typing', user.id, typing);
            }
        });
        
        socket.on('idleStatus', function (status) {
            if (status == 'away' || status == 'unavailable') {
                roomEmit('idleStatus', user.id, status);
            }
        });
        
        socket.on('activeChannels', function () {
            var channelInfo = [],
                channelKeys = Object.keys(channels),
                i;
            
            for (i = 0; i < channelKeys.length; i++) {
                if (channels[channelKeys[i]].online.length) {
                    channelInfo.push({
                        name : channelKeys[i],
                        online : channels[channelKeys[i]].online.length
                    });
                }
            }
            
            socket.emit('activeChannels', channelInfo);
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
            
            if (command.role === undefined) {
                command.role = 4    
            }
            
            if (command.channelRole >= user.role || (command.role >= user.role && command.channelRole === undefined)) {
                if (command.params) {
                    for (i = 0; i < command.params.length; i++) {
                        if (typeof params[command.params[i]] !== 'string' && typeof params[command.params[i]] !== 'undefined') {
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
            throttle.on(user.remote_addr + '-command').then(function () {
                if (findIndex(channel.online, 'id', user.id) !== -1) {
                    if (typeof commandName === 'string' && COMMANDS[commandName]) {
                        if (!params || typeof params === 'object') {
                            handleCommand(COMMANDS[commandName], params);
                        }
                    }   
                }
            }).fail(function (spammer) {
                if (spammer) {
                    dao.ban(channelName, user.remote_addr, null, 'Throttle', 'Command spamming');
                    showMessage(user.socket, 'You have been banned for spamming.', 'error');
                    socket.disconnect();
                } else {
                    showMessage(user.socket, 'You are spamming, stop or you will be temporarily banned.', 'error');
                    throttle.warn(user.remote_addr); 
                }
            });
        });
                     
        function joinChannel(userData, dbuser, channelData) {
            var i,
                onlineUsers = [],
                roleNames = ['God', 'Channel Owner', 'Admin', 'Mod', 'Basic'],
                channelCursors = dao.getCursors().name,
                channelHats = dao.getHats().name,
                commandRoles = channel.commandRoles;
            
            if (!userData) userData = {};
            
            function join(channelData, user) {
                user.token = dao.makeId();
                tokens[user.nick] = user.token;
                
                for (i = 0; i < channel.online.length; i++) {
                    onlineUsers.push({
                        nick : channel.online[i].nick,
                        id : channel.online[i].id,
                        afk : channel.online[i].afk
                    });
                }

                channel.online.push(user);
                
                socket.join('chat');
                
                socket.emit('channelDetails', channelData);
                
                socket.emit('channeldata', {
                    users : onlineUsers,
                    hats : channelHats,
                    cursors : channelCursors,
                    commandRoles : commandRoles
                });
                
                roomEmit('joined', user.id, user.nick);
                
                socket.emit('update', {
                    nick : user.nick,
                    role : roleNames[user.role],
                    token : user.token,
                    hats : user.hat,
                    cursor : user.cursor,
                    part : user.part
                });
                
                if (dbuser) {
                    dao.getUsersStyleProfile(dbuser.nick).then(function (profiles) {
                        socket.emit('channeldata', {
                            styles : profiles
                        });
                    });
                }
                
                console.log('USER JOIN', user.nick, user.role, user.remote_addr);
            }
            
            var index = findIndex(channel.online, 'nick', userData.nick);
            
            if (index === -1) {
                if (dbuser) {
                    user.nick = dbuser.nick;
                    
                    if (dbuser.role === 0) {
                        user.role = 0;
                    } else if (channelData.owner === dbuser.nick) {
                        user.role = 1;
                    } else if (channelData.roles && channelData.roles[dbuser.nick]) {
                        user.role = channelData.roles[dbuser.nick];
                    } else {
                        user.role = 4;
                    }
                    
                    if (dbuser.hat) {
                        try { 
                            user.hat = JSON.parse(dbuser.hat).current;
                        } catch (err) {
                            user.hat = '';
                        }
                    }
                    
                    if (dbuser.cursor) {
                        user.cursor = dbuser.cursor;
                    }
                    
                    if (dbuser.part) {
                        user.part = dbuser.part;
                    }
                } else {
                    user.nick = userData.nick || dao.getNick();
                    user.role = 4;
                }
            } else {
                user.nick = dao.getNick();
                user.role = 4;
            }
            
            join(channelData, user);
        }
        
        function checkChannelStatus (joinData, dbuser) {
            var apiLink = 'http://check.getipintel.net/check.php?ip=' + user.remote_addr + '&contact=theorignalsandwich@gmail.com&flags=m';
            
            dao.getChannelinfo(channelName).then(function (channelData) {
                function attemptJoin () {
                    if (channelData.lock && channelData.lock.value) {
                        if (dbuser && dbuser.nick) {
                            joinChannel(joinData, dbuser, channelData);
                        } else {
                            socket.emit('locked');
                        }
                    } else {
                        joinChannel(joinData, dbuser, channelData);
                    }
                }

                if (channelData.proxy && channelData.proxy.value) {
                    request(apiLink, function (error, response, body) {
                        if (!error) {
                            if (parseInt(body)) {
                                showMessage(user.socket, 'Sorry but this channel has proxies blocked for now.', 'error');
                            } else {
                                attemptJoin();
                            }
                        }
                    });
                } else {
                    attemptJoin();
                }
            });
        }
        
        function checkUserStatus (joinData) {
            if (joinData.nick) {
                if (joinData.nick && joinData.nick.length > 0 && joinData.nick.length < 50 && /^[\x21-\x7E]*$/i.test(joinData.nick)) {
                    dao.find(joinData.nick).then(function (dbuser) {//find if user exist
                        if (joinData.token && joinData.token === tokens[joinData.nick]) {//tokens match? good to go
                            checkChannelStatus(joinData, dbuser);
                        } else if (joinData.password) {//tokens don't match try logging in with password
                            dao.login(joinData.nick, joinData.password).then(function (correctPassword) {
                                if (correctPassword) {
                                    checkChannelStatus(joinData, dbuser);
                                } else {
                                    checkChannelStatus();
                                }
                            }).fail(checkChannelStatus);
                        } else {
                            delete joinData.nick;
                            checkChannelStatus(joinData);
                        }
                    }).fail(checkChannelStatus.bind(null, joinData));
                } else {
                    delete joinData.nick;
                    checkChannelStatus(joinData);
                }
            } else {
                checkChannelStatus();
            }
        }
        
        function bgCheckUser (joinData) {
            var totalIPs = 0,
                i;
            
            for (i = 0; i < channel.online.length; i++) {
                if (channel.online[i].remote_addr == user.remote_addr) {
                    ++totalIPs;
                }
            }
            
            dao.checkBan(channelName, joinData.nick, user.remote_addr).then(function () {
                throttle.on(user.remote_addr + '-join', 3).then(function (notSpam) {
                    if (totalIPs < 4) {
                        if (findIndex(channel.online, 'id', user.id) === -1) {
                            checkUserStatus(joinData);
                        } else {
                            showMessage(socket, 'Only one socket connection allowed', 'error');
                            socket.disconnect();
                        }
                    } else {
                        showMessage(socket, 'Too many connections with this IP', 'error');
                        socket.disconnect();
                    }
                }).fail(function (spammer) {
                    if (spammer) {
                        dao.ban(channelName, user.remote_addr, null, 'Throttle', 'Join spamming');
                        showMessage(socket, 'You have been banned for spamming.', 'error');
                        socket.disconnect();
                    } else {
                        showMessage(socket, 'You are spamming, stop or you will be temporarily banned.', 'error');
                        throttle.warn(user.remote_addr + '-join');
                    }
                });
            }).fail(function (banned) {
                showMessage(socket, 'You are banned' + (banned.reason ? ': ' + banned.reason : ''), 'error');
                socket.disconnect();
            });
        }
        
        socket.on('requestJoin', function (requestedData) {
            var joinData = {},
                requestedDataKeys,
                k,
                accept = ['nick', 'token', 'password', 'part'];
            
            if (typeof requestedData === 'object') {//makes sure requestedData is valid, all items are strings
                requestedDataKeys = Object.keys(requestedData);
                for (k = 0; k < requestedDataKeys.length; k++) {
                    if (accept.indexOf(requestedDataKeys[k]) !== -1 && typeof requestedData[requestedDataKeys[k]] === 'string') {
                        joinData[requestedDataKeys[k]] = requestedData[requestedDataKeys[k]]
                    }
                }
            }
            
            bgCheckUser(joinData);
        });
        
        socket.on('disconnect', function () {
            var index = findIndex(channel.online, 'nick', user.nick);
            if (index !== -1) {
                roomEmit('left', user.id, user.part);
                channel.online.splice(index, 1);
            }
        });
        
    });
    
    return channel;
}

function intoapp(app, http) {
    var channelRegex = /^\/(\w*\/?)$/;
    var io = require('socket.io')(http);
    //app.use(minify());
    app.use(express.static(__dirname + '/public'));
    app.get("/img/*", function (req, res) {
        if (req.query.url) {
            var uri = url.parse(req.query.url);
            if (uri.protocol) {
                request.get(uri.href).on('error', function(err) {
                    console.log(err);
                    res.send("Error: Cannot load");
                    return;
                }).pipe(res);
            } else {
                res.send("Error: Invalid URL"); 
            }
        } else {
            res.send("Error: No URL");
        }
    });

    app.get(channelRegex, function (req, res) {
        if (!channels[req.url]) {
            channels[req.url] = createChannel(io, req.url);
        }
        
        if (req.url === '/welcome/') {
            var index = fs.readFileSync('public/welcome/welcome.html').toString();
            res.send(index); 
        } else {
            var index = fs.readFileSync('index.html').toString();
            res.send(index);   
        }
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