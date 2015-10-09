var io = require('socket.io');
var Q = require('q');
function promise (model, method,query, data) {
    var deferred = Q.defer();
    function callback (err, data) {
        if(!err){
            deferred.resolve(data);//成功返回的数据
        }else{
            deferred.reject(err);//失败返回的错误信息
        }
    }
    switch (method) {
        case 'create':
            model.create(data, callback);
            break;
        case 'find':
            model.find(query, callback);
            break;
        case 'findOne':
            model.findOne(query, callback);
            break;
        case 'updateAll':
            model.updateAll(query, data, callback);
    }
    return deferred.promise;//必须返回这个
}
module.exports.etuanChat = EtuanChat;
function EtuanChat(app, server) {
    var IM = new EtuanIM(app.models.ChatUser, app.models.ChatRoom);
    io = io(server);
    io.of('/chat').on('connection', function (socket) {
        socket.on('sign_up', function (user, cb) {
            IM.addUser(socket,
                socket.id,
                user.appid,
                user.nickName,
                function (err, oldUser, newUser) {
                if (err) {
                    cb({status:400, msg: "加入聊天系统失败"});
                } else if (oldUser){
                    socket.broadcast.emit('user_out', oldUser);
                    socket.broadcast.emit('user_in', newUser);
                    cb({status:200, msg: "加入聊天系统成功", user: newUser});
                } else {
                    socket.broadcast.emit('user_in', newUser);
                    cb({status:200, msg: "加入聊天系统成功", user: newUser});
                }
            });
            IM.rooms(user.appid, function (err, roomlist) {
                var online = IM.onlineUsers(user.appid);
                IM.findUser(function (users) {
                    IM.findUnreadMsg(user.appid, function (err, unreads) {
                        socket.emit('init', online, roomlist, unreads,  users);
                    });
                });
            });
        });

        socket.on('private_chat', function (msg, cb) {
            msg.created = new Date();
            if (msg.to === 'ALL') {
                socket.broadcast.emit('private_chat', msg);
                cb ({status: 200, msg: "消息发送成功"});
            } else {
                IM.saveMsg(msg, function (err, tosocket, msg) {
                    if (err) {
                        cb({status: 500, msg: "系统错误"});
                    } else if (tosocket !== 'NOTLINK') {
                        tosocket.socket.emit('private_chat', msg);
                        cb({status: 200, msg: msg});
                    } else {
                        cb({status: 200, msg: msg});
                    }
                });
            }
        });

        socket.on('unread', function (user, cb) {
            IM.findUnreadMsg(user.appid, function (err, msgs) {
                if (!err) {
                    cb({status:200, msg:msgs});
                } else {
                    cb({status:400, msg: '系统错误'});
                }
            });
        });

        socket.on('setRead', function (users) {
            IM.setMsgRead(users.from, users.roomId, function (err, data) {

            });
        });

        socket.on('history', function (room, cb) {
            IM.getHistoryMsg(room.roomId, function (err, msgs) {
                if (err) {
                    cb({status: 400, msg: '系统错误'});
                } else {
                    cb({status: 200, msgs: msgs});
                }
            });
        });

        socket.on('disconnect', function () {
            var user = IM.deleteUser(socket.id);
            io.sockets.emit('user_out', user);
        });
    });
}

function EtuanIM (userModel, roomModel) {
    this.users = [];
    this.userModel = userModel;
    this.roomModel = roomModel;
}

EtuanIM.prototype.findUser = function (cb) {
    promise(this.userModel, 'find', {}, {})
        .then(function (data) {
            cb(data);
        });
};
EtuanIM.prototype.addUser = function (socket, socketId, appid, nickName, cb) {
    var user = {
        socket: socket,
        socketId: socketId,
        appid: appid,
        nickName: nickName
    };
    var newUser = {
        appid: appid,
        nickName: nickName
    };
    var that = this;
    var id = null;
    promise(that.userModel, 'findOne', {where:{appid: appid}})
        .then(function (instance) {

           if (!instance) {
               return promise(that.userModel, 'create', {}, {appid: appid, nickName:nickName, created: new Date()});
           }
           else{
               id = instance.id;
               return promise(that.userModel, 'updateAll', {id: id}, {nickName: nickName});
           }
        })
        .then(function(data) {
            if (data.id) {
                newUser.isNew = 1;
            }
            user.id = data.id || id;
            newUser.id = data.id || id;
            var duser = that.distoryUser(appid);
            that.users.push(user);

            cb(null, duser, newUser);
        }, function (err) {
            cb(err);
        });
};

EtuanIM.prototype.distoryUser = function (appid) {
    var user;
    var index = this.findUserByAppid(appid);

    if (index > -1) {
        user = {
            appid: this.users[index].appid,
            nickName: this.users[index].nickName
        };
        this.users.splice(index,1)
    } else {
        user = null;
    }
    return user;
};
EtuanIM.prototype.findUserByAppid = function (appid) {
    var index = -1;
    for (var i = 0; i < this.users.length; i++) {
        if (this.users[i].appid === appid) {
            index = i;
            return index;
        }
    }
    return index;
};


EtuanIM.prototype.saveMsg = function (msg, cb) {
    var tosocket;
    var that = this;
    var index;
    index = that.findUserByAppid(msg.to);
    tosocket = index > -1 ? that.users[index]: 'NOTLINK';
    if (msg.roomId) {
        promise(that.roomModel,
            'updateAll',
            {
                id: msg.roomId
            },
            {
                '$push':{
                    msg:{
                        created: msg.created,
                        msgType: msg.msgType,
                        msgContent: msg.msgContent,
                        from: msg.from,
                        to: msg.to
                    }
                }
            })
            .then(function (data) {
                cb(null, tosocket,msg);
            }, function (err) {
                cb(err);
            });
    } else {
        promise(that.roomModel,
            'create',
            {},
            {
                msg: [{
                    created: msg.created,
                    msgType: msg.msgType,
                    msgContent: msg.msgContent,
                    from: msg.from,
                    to: msg.to
                }],
                _chatGroups: [{
                    appid: msg.to,
                    OT: new Date(),
                    id: 0
                },{
                    appid: msg.from,
                    OT: new Date(),
                    id: 1
                }]
            })
            .then(function (instance) {
                msg.roomId = instance.id;
                msg.newRoom = 1;
                cb(null, tosocket,msg);
            }, function (err) {
                cb(err);
            });
    }
};

EtuanIM.prototype.deleteUser = function (socketId) {
    var user = 0;

    return user;
};

EtuanIM.prototype.onlineUsers = function (appid) {
    var online=[];
    for (var i = 0; i < this.users.length; i++) {
        if (this.users[i].appid !== appid) {
            user = {
                appid: this.users[i].appid,
                nickName: this.users[i].nickName,
                id: this.users[i].id
            };
            online.push(user);
        }
    }
    return online;
};

EtuanIM.prototype.rooms = function (appid, cb) {
    promise(this.roomModel, 'find',
        {
            where:{
                '_chatGroups.appid': appid,
                type: 0
            }
        },
        {}
    )
        .then(function (instance) {
            var rooms = [];
            for (var i = 0; i < instance.length; i++) {
                for (var k = 0; k < instance[i]._chatGroups.length; k++) {
                    if (instance[i]._chatGroups[k].appid !== appid) {
                        rooms.push({
                            roomId: instance[i].id,
                            to: instance[i]._chatGroups[k].appid
                        });
                    }
                }
            }
            cb(null, rooms);
        }, function (err) {
            cb(err);
        });
};
EtuanIM.prototype.findUnreadMsg = function (appid, cb) {
    var that = this;
    var msgs = [];
    promise(that.roomModel,
        'find',
        {
            where: {
                '_chatGroups.appid': appid
            },
            fields: {
                _chatGroups: true,
                id: true
            }
        },
        {}
    )
        .then(function (instance) {
            var fns = [];
            for (var i = 0; i < instance.length; i++)
            for (var k = 0; k < instance[i]._chatGroups.length; k++)
            if (instance[i]._chatGroups[k].appid === appid) {
                fns.push(that.findOwerOT(instance[i].id, instance[i]._chatGroups[k].OT));
            }
            Q.all(fns)
                .spread(function () {
                    for (var key in arguments) {
                        if (arguments[key].msg) {
                            msgs.push(arguments[key]);
                        }
                    }
                    return msgs;
                })
                .done(function (msgs) {
                    cb(null, msgs);
                }, function (err) {
                    cb(err);
                });
        });

};

EtuanIM.prototype.findOwerOT = function (id, ot) {
    var deferred = Q.defer();
    var msgs = [];
    promise(this.roomModel,
        'findOne',
        {
            where: {
                id: id,
                'msg.created': {
                    gt: ot
                }
            },
            fields: {
                msg: true,
                id: true
            }
        },
        {}
    )
        .then(function (data) {
            if (data) {
                for (var i = 0; i < data.msg.length; i++) {
                    if (data.msg[i].created > ot) {
                        msgs.push(data.msg[i]);
                    }
                }
                data.msg = msgs;
            } else {
                data = {};
            }
            deferred.resolve(data);
        }, function (err) {
            deferred.reject(err);
        });
    return deferred.promise;
};
EtuanIM.prototype.setMsgRead = function (from, roomId, cb) {
    promise(this.roomModel, 'findOne', {where: {id: roomId}}, {})
        .then(function (instance) {
            for (var k = 0; k < instance._chatGroups.length; k++)
                if (instance._chatGroups[k].appid === from) {
                    instance._chatGroups[k].OT = new Date();
                }
            instance.save({}, function (err, data) {
                cb(err, data);
            });
        }, function (err) {
            cb(err);
        });
};
EtuanIM.prototype.getHistoryMsg = function (roomId, cb) {
    promise(this.roomModel,
        'findOne',
        {
            where:{
                id: roomId
            },
            fields: {
                id: true,
                msg: true
            }
        },{})
        .then(function (data) {
            cb(null, data);
        }, function (err) {
            cb(err);
        });
};