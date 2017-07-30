var _ = require('underscore');
var $ = require('jquery-deferred');
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var fs = require('fs');

try {
    var file = fs.readFileSync('./conf/settings.json');
    settings = JSON.parse(file.toString());
    handleDisconnect(settings);
} catch (e) {
    throw new Error('Invalid settings: /conf/settings.json invalid or does not exist');
}

var db;
function handleDisconnect(db_config) {
    db = mysql.createConnection(db_config);
    //check for error on connect
    db.connect(function (err) {
        if (err) {
            console.log(err);
        }
    });

    db.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

function ucwords(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function findIndex(channel, att, value) {
    var i;
    for (i = 0; i < channel.length; i++) {
        if (channel[i][att] === value) {
            return i;
        }
    }
    return -1;
}

module.exports = {
    encrypt : function(password){
        var defer = $.Deferred();
        bcrypt.genSalt(10, function(err, salt){
            bcrypt.hash(password, salt, null, function(err, hash){
                defer.resolve(hash).promise();
            });
        });
        return defer;
    },
    register : function (nick, password, ip) {
        var defer = $.Deferred();
        var sql = "INSERT INTO `awakens`.`users`(`nick`,`password`,`remote_addr`,`role`) VALUES(?,?,?,?)";
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(password, salt, null, function (err, hash) {
                db.query(sql, [nick, hash, ip, 4], function (err, rows, fields) {
                    if (err) {
                        defer.reject(err);
                    } else {
                        defer.resolve().promise();
                    }
                });
            });
        });
        return defer;
    },
    unregister : function(nick){
        var defer = $.Deferred();
        var sql = "DELETE FROM `awakens`.`users` WHERE `nick` = ?";
        db.query(sql, nick, function(err, rows, fields){
            if (err) {
                defer.reject();
            }  else {
                defer.resolve().promise();
            }
        });
        return defer;
    },
    login : function (nick, password) {
        var defer = $.Deferred();
        var sql = "SELECT * FROM `users` WHERE `nick` = ?";
        db.query(sql, nick, function (err, rows, fields) {
            if (rows && rows.length) {
                bcrypt.compare(password, rows[0].password, function (err, res) {//check if password is correct
                    defer.resolve(res, rows[0]).promise();
                });
            } else {//not an account
                defer.reject();
            }
        });
        return defer;
    },
    find : function (nick) {
        var defer = $.Deferred();
        var sql = "SELECT * FROM `users` WHERE `nick` = ?";
        db.query(sql, nick, function (err, rows, fields) {
            if (rows && rows.length) {
                defer.resolve(rows[0]).promise();
            } else {
                defer.reject();
            }
        });
        return defer;
    },
    findip : function(ip) {
        var defer = $.Deferred();
        var sql = "SELECT * FROM `users` WHERE `remote_addr` = ?";
        db.query(sql, ip, function (err, rows, fields) {
            var nicks = [];
            if (rows) {
                rows.forEach(function (i) {
                    nicks.push(i.nick);
                });
            }
            defer.resolve(nicks).promise();
        });
        return defer;
    },
    getChannelinfo : function (channelName) {
        var defer = $.Deferred();
        var sql = "SELECT * FROM `channel_info` WHERE `channelName` = ?";
        db.query(sql, channelName, function (err, rows, fields) {
            if (rows && rows.length) {
                try {
                    defer.resolve(JSON.parse(rows[0].roles), JSON.parse(rows[0].data)).promise();
                } catch (err) {
                    defer.reject(err);
                }
            } else {
                db.query("INSERT INTO `awakens`.`channel_info` (`channelName`, `roles`, `data`) VALUES (?, '{}', '{}');", channelName, function (err, rows, fields) {
                    defer.resolve({}, {}).promise();
                });
            }
        });
        return defer;
    },
    getChannelAtt : function (channelName, att) {
        var defer = $.Deferred();
        this.getChannelinfo(channelName).then(function (roles, channelData) {
            defer.resolve(channelData[att]).promise();
        });
        return defer;
    },
    setChannelinfo : function (channelName, newValues){
        var defer = $.Deferred(),
            sql = "UPDATE `awakens`.`channel_info` SET `data` = ? WHERE `channel_info`.`channelName` = ?",
            keys = Object.keys(newValues),
            i;
        
        this.getChannelinfo(channelName).then(function (roles, channelData) {
            
            for (i = 0; i < keys.length; i++) {
                channelData[keys[i]] = newValues[keys[i]];
            }
            
            db.query(sql, [JSON.stringify(channelData), channelName], function(err, rows, fields){
                if (err) {
                    defer.reject(err);
                } else {
                    defer.resolve().promise();   
                }
            });
        }).fail(function () {
            channelData = {};
            channelData[att] = value;
            db.query("INSERT INTO `awakens`.`channel_info` (`channelName`, `roles`, `data`) VALUES (?, '{}', ?);", [channelName, JSON.stringify(channelData)]);
            defer.resolve().promise();   
        });
        return defer;
    },
    setChannelRole : function (channelName, nick, role) {
        var defer = $.Deferred();
        var sql = "UPDATE `awakens`.`channel_info` SET `roles` = ? WHERE `channel_info`.`channelName` = ?";
        this.getChannelinfo(channelName).then(function (roles) {
            if (role === 4) {
                delete roles[nick];
            } else {
                roles[nick] = role;
            }
            db.query(sql, [JSON.stringify(roles), channelName], function (err, rows, fields) {
                defer.resolve().promise();
            });
        });
        return defer;
    },
    setUserinfo : function (nick, att, value) {
        var defer = $.Deferred();
        var sql = "UPDATE `awakens`.`users` SET ?? = ? WHERE `nick` = ?";
        
        if (typeof value !== 'string') {
            value = JSON.stringify(value);
        }
        
        db.query(sql, [att, value, nick], function (err, rows, fields) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve().promise();
            }
        });
        return defer;
    },
    banlist : function(channelName) {
        var defer = $.Deferred();
        var sql = "SELECT * FROM `channel_banned` WHERE `channelName` = ?;"
        db.query(sql, channelName, function (err, rows, fields) {
            if (!err) {
                defer.resolve(rows).promise();
            }
        });
        return defer;
    },
    isBanned : function (channelName, nick, ip) {
        var defer = $.Deferred();
        var sql = "SELECT * FROM `awakens`.`channel_banned` WHERE `channelName` = ? AND `nick` = ? OR `remote_addr` = ?";
        
        db.query(sql, [channelName, nick, ip], function (err, rows, fields) {
            if (!err) {
                defer.resolve(rows.length ? rows[0] : false).promise();
            }
        });
        
        return defer;
    },
    ban : function(channelName, ip, nick, bannedBy, reason){
        var defer = $.Deferred();
        var sql = "INSERT INTO `awakens`.`channel_banned`(`channelName`, `remote_addr`, `nick`, `bannedBy`, `reason`) VALUES(?, ?, ?, ?, ?)";
        
        this.isBanned(channelName, nick, ip).then(function (banned) {
            if (banned) {
                defer.reject();
            } else {
                db.query(sql, [channelName, ip, nick, bannedBy, reason], function (err, rows, fields) {
                    if (err) {
                        console.log(err);
                    }
                    defer.resolve().promise();
                });
            }
        });
        
        return defer;
    },
    unban : function(channelName, nick) {
        var defer = $.Deferred();
        var sql = "DELETE FROM `awakens`.`channel_banned` WHERE `channelName` = ? AND `nick` = ? OR `remote_addr` = ?";
        
        this.isBanned(channelName, nick, nick).then(function (banned) {
            if (banned) {
                db.query(sql, [channelName, nick, nick], function (err, rows, fields) {
                    if (!err) {
                        defer.resolve().promise();
                    } else {
                        defer.reject();
                    }
                });
            } else {
                defer.reject();
            }
        });
        
        return defer;
    },
    getNick : function () {
        var nouns = ["alien", "apparition", "bat", "blood", "bogeyman", "boogeyman", "boo", "bone", "cadaver", "casket", "cauldron", "cemetery", "cobweb", "coffin", "corpse", "crypt", "darkness", "dead", "demon", "devil", "death", "eyeball", "fangs", "fear", "gastly", "gengar", "ghost", "ghoul", "goblin", "grave", "gravestone", "grim", "grimreaper", "gruesome", "haunter", "headstone", "hobgoblin", "hocuspocus", "howl", "jack-o-lantern", "mausoleum", "midnight", "monster", "moon", "mummy", "night", "nightmare", "ogre", "phantasm", "phantom", "poltergeist", "pumpkin", "scarecrow", "scream", "shadow", "skeleton", "skull", "specter", "spider", "spine", "spirit", "spook", "tarantula", "tomb", "tombstone", "troll", "vampire", "werewolf", "witch", "washer", "witchcraft", "wraith", "zombie"];
        var adjectives = ["bloodcurdling", "chilling", "creepy", "dark", "devilish", "dreadful", "eerie", "evil", "frightening", "frightful", "fucking", "ghastly", "ghostly", "ghoulish", "gory", "grisly", "hair-raising", "haunted", "horrible", "macabre", "morbid", "mysterious", "otherworldly", "repulsive", "revolting", "scary", "shadowy", "shocking", "spine-chilling", "spooky", "spoopy", "startling", "supernatural", "terrible", "unearthly", "unnerving", "wicked"];
        return ucwords(_.sample(adjectives)) + ucwords(_.sample(nouns));
    },
    makeId : function () {
        var text = "";
        var possible = "!@#$%^&*()-_=+abcdefghijklmnopqrstuvwxyz0123456789";

        for (var i=0; i < 15; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    },
    getHats : function(){
        var list = fs.readdirSync('public/hats');
        var name = [];
        var lowercase = [];
        list.forEach(function(i){
            name.push(i);
            lowercase.push(i.toLowerCase().substr(0,i.length-4));
        });
        return {
            name : name,
            lowercase : lowercase
        }
    },
    getCursors : function(){
        var list = fs.readdirSync('public/cursors');
        var name = [];
        var lowercase = [];
        list.forEach(function(i){
            name.push(i);
            lowercase.push(i.toLowerCase().substr(0,i.length-4));
        });
        return {
            name : name,
            lowercase : lowercase
        }
    }
}