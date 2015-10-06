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
module.exports.upUsers = upUsers;
module.exports.otherUsers = findOthers;
function EtuanChat(app, server) {
    var IM = new EtuanIM(app.models.ChatUser, app.models.ChatRoom, app.models.chatGroup);
    io = io(server);
    io.of('/chat').on('connection', function (socket) {
        socket.on('sign_up', function (user, cb) {
            IM.rooms(user.appid, function (err, roomlist) {
                var online = IM.onlineUsers(user.appid);
                socket.emit('init', online, roomlist, []);
            });
            IM.addUser(socket, socket.id, user.appid, user.nickName, function (err, oldUser) {
                if (err) {
                    cb({status:400, msg: "加入聊天系统失败"});
                } else if (oldUser){

                    io.sockets.emit('user_out', oldUser);
                    cb({status:200, msg: "加入聊天系统成功"});
                } else {
                    cb({status:200, msg: "加入聊天系统成功"});
                }
            });
        });

        socket.on('private_chat', function (msg, cb) {
            msg.createAt = new Date();
            if (msg.to === 'ALL') {
                socket.broadcast.emit('private_chat', msg);
                cb ({status: 200, msg: "消息发送成功"});
            } else {
                IM.saveMsg(msg, function (err, tosocket, msg) {
                    if (err) {
                        cb({status: 500, msg: "系统错误"});
                    } else if (tosocket !== 'NOTLINK') {
                        tosocket.socket.emit('private_chat', msg);
                        cb({status: 200, msg: "消息发送成功"});
                    } else {
                        cb({status: 200, msg: "消息发送成功"});
                    }
                });
            }
        });

        socket.on('disconnect', function () {
            var user = IM.deleteUser(socket.id);
            io.sockets.emit('user_out', user);
        });
    });
}
/**
 * 内存中用户信息数据结构users
 * [{
 *  id:"用户ID"
 *  socketId: "用户链接时的socket，唯一"，
 *  appid："用户应用ID",
 *  nickName:"用户应用昵称",
 *  created："建立链接时间"，
 *  socket:"用户socket链接对象"
 * }]
 * @param userModel 用户信息数据库对象
 * @param roomModel 聊天信息数据库对象
 * @constructor
 */
function EtuanIM (userModel, roomModel, groupModel) {
    this.users = [];
    this.userModel = userModel;
    this.roomModel = roomModel;
    this.groupModel = groupModel;
}
/**
 * 注册用户信息到Users中对应的链接，并检查数据库是否注册该用户信息，
 * 没有则添加，有则更新信息。
 * @param socket
 * @param socketId
 * @param appid
 * @param nickName
 * @param cb 参数 err,delUser
 */
EtuanIM.prototype.addUser = function (socket, socketId, appid, nickName, cb) {
    var user = {
        socket: socket,
        socketId: socketId,
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
            user.id = data.id || id;
            var duser = that.distoryUser(appid);
            that.users.push(user);
            cb(null, duser);
        }, function (err) {
            cb(err);
        });
};
/**
 * 从users数组中删除一个socketId不为传入的socketId的用户链接,
 * 保证users中appid为传入的appid的链接唯一
 * 如果不存在时返回 1 ，存在时删除，成功返回 1，失败返回 0
 * @param socketId 第一次链接时的cookieId
 * @param appid 用户的应用id
 * @returns user 返回删除的用户
 */
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

EtuanIM.prototype.getNickName = function (appid, cb) {
    for (var i = 0; i < this.users.length; i++) {
        if (this.users[i].appid === appid) {
            index = i;
            cb(null, this.users[i].nickName);
            return;
        }
    }
    promise(this.userModel, 'findOne', {where:{appid: appid}}, {})
        .then(function (instance) {
            cb(null, instance.nickName)
        }, function (err) {
            cb(err);
        });
};
/**
 * 保存消息到数据库
 * @param msg 消息对象 {to: "APPID", from: "APPID", msgType:"0 OR 1", msgContent:"MSG"}
 * @param cb 处理后回调函数，参数err,tosocket
 */
EtuanIM.prototype.saveMsg = function (msg, cb) {
    var tosocket;
    var that = this;
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
                        created: msg.createAt,
                        msgType: msg.msgType,
                        msgContent: msg.msgContent
                    }
                }
            })
            .then(function (data) {
                cb(null, tosocket,msg);
            }, function (err) {
                cb(err);
            });
    } else {
        var index = that.findUserByAppid(msg.from);
        var formNickName = that.users[index].nickName;
        this.getNickName(msg.to, function (err, nickName) {
            if (err) {
                cb (err);
            } else {
                promise(that.roomModel,
                    'create',
                    {},
                    {
                        msg: [{
                            created: msg.createAt,
                            msgType: msg.msgType,
                            msgContent: msg.msgContent
                        }],
                        _chatGroups: [{
                            appid: msg.to,
                            nickName: nickName,
                            OT: new Date(),
                            id: 0
                        },{
                            appid: msg.from,
                            nickName: formNickName,
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
        });
    }
};
/**
 * 退出appid为传入的socketId的链接
 * @param socketId
 * @returns user 退出的用户信息
 */
EtuanIM.prototype.deleteUser = function (socketId) {
    var user = 0;

    return user;
};
/**
 * 获取在线用户信息，
 * @param socketId
 * @returns [array] [{socketId: "SOCKETID", appid:"APPID", nickName: "NICKNAME", created: "CREATETIME"}]
 */
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
    promise(this.roomModel, 'find', {where:{'_chatGroups.appid': appid, type: 0}}, {})
        .then(function (instance) {
            var rooms = [];

            for (var i = 0; i < instance.length; i++) {
                for (var k = 0; k < instance[i]._chatGroups.length; k++) {
                    if (instance[i]._chatGroups[k].appid !== appid) {
                        rooms.push({roomId: instance[i].id, to: instance[i]._chatGroups[k].appid});
                    }
                }
            }
            cb(null, rooms);
        }, function (err) {
            cb(err);
        });
};
function messageHandle (io) {
    io.of('/chat').on('connection', function (socket) {
        var cookie = socket.request.headers.cookie.substr(3,socket.request.headers.cookie.length);
        addUsers(cookie, socket);
        socket.emit('init', 200, findOthers(), findOthers());
        socket.emit('cookieId', cookie);
        socket.on('private', function (config) {
            var index = findUser(config.to);
            var from = findUser(config.from);
            var fuser = {
                nickName: users[from].nickName,
                appId: users[from].appId,
                cookieId: users[from].cookieId
            };
            users[index].socket.emit('private', {from: fuser, msg: config.msg});
        });
        //socket.broadcast.emit('broadcast', 'sm');
        socket.on('broadcast', function (data) {

        })
      });
}
function findUser (cookieId) {
    var index = -1;
    for (var tag = 0; tag < users.length; tag++) {
        if (users[tag].cookieId === cookieId)
          index = tag;
    }
    return index;
}
function addUsers (cookieId, socket) {
    users.push(
        {
            nickName: null,
            appId: null,
            createAt: new Date(),
            id: null,
            socket: socket,
            cookieId: cookieId
        });
}
function upUsers (user) {
    var index = findUser(user.cookieId);
    if (index === -1) {
        return false;
    } else {
        users[index].nickName = user.nickName;
        users[index].appId = user.appId;
        users[index].id = user.id;
        distoryUser(user.id, user.cookieId);
        users[index].socket.broadcast.emit('broadcast', 200, findOthers(), findOthers());
        return true;
    }
}
//根据用户ID删除一个链接
function distoryUser (id, cookieId) {
    for (var i = 0; i < users.length; i++) {
        if (users[i].id === id && users[i].cookieId !== cookieId) {
            users.splice(i,1);
        }
    }
}
function findOthers (cookieId) {
    var result = [];
    for (var tag = 0; tag < users.length; tag++)
        if (users[tag].cookieId !== cookieId && users[tag].id) {
            other = {
                nickName: users[tag].nickName,
                appId: users[tag].appId,
                cookieId: users[tag].cookieId
            };
            result.push(other);
        }
    return result;
}