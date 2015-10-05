var io = require('socket.io');

module.exports.etuanChat = EtuanChat;
module.exports.upUsers = upUsers;
module.exports.otherUsers = findOthers;
function EtuanChat(app, server) {
    var IM = new EtuanIM(app.models.ChatUser, app.models.Room);
    io = io(server);
    io.of('/chat').on('connection', function (socket) {
        IM.addUser(socket.id, socket) === 1
            ? socket.emit('init', {status:200, user: IM.onlineUsers(socket.id)})
            : socket.emit('init', {status:400, msg: "链接失败"});

        socket.on('sign_up', function (user, cb) {
            IM.upUser(socket.id, user.appid, user.nickName, function (err, oldUser) {
                if (err) {
                    cb({status:400, msg: "加入聊天系统失败"});
                } else if (oldUser){
                    io.sockets.emit('user_out', oldUser);
                    cb({status:200, msg: "加入聊天系统成功"});
                } else {
                    cb({status:400, msg: "加入聊天系统成功"});
                }
            });
        });

        socket.on('private', function (msg, cb) {
            IM.sendMsg(msg, function (err, toSocket) {
                if (err) {
                    cb({status:400, msg: "消息发送失败"});
                } else {
                    toSocket.emit('private', msg);
                    cb({status:200, msg: "消息发送成功"});
                }
            });
        });

        socket.on('disconnect', function () {
            var usr = IM.deleteUser(socket.id);
            io.sockets.emit('user_out', oldUser);
        });
    });
}
/**
 * 内存中用户信息数据结构users
 * [{
 *  socketId: "用户链接时的socket，唯一"，
 *  appid："用户应用ID",
 *  nickName:"用户应用昵称",
 *  created："建立链接时间"，
 *  socket:"用户socket链接对象"
 * }]
 * @param users
 * @param userModel 用户信息数据库对象
 * @param roomModel 聊天信息数据库对象
 * @constructor
 */
function EtuanIM (userModel, roomModel) {
    this.users = [];
    this.userModel = userModel;
    this.roomModel = roomModel;
}
/**
 * 添加一个用户链接到users数组
 * @param socketId 第一次链接时的socketId
 * @param socket 链接时socket对象
 * @returns {number} 状态，成果 1，失败 0
 */
EtuanIM.prototype.addUser = function (socketId, socket) {
    var status = 0;

    return status;
};
/**
 * 注册用户信息到Users中对应的链接，并检查数据库是否注册该用户信息，
 * 没有则添加，有则更新信息。
 * @param socketId
 * @param appid
 * @param nickName
 * @param cb 参数 err,delUser
 */
EtuanIM.prototype.upUser = function (socketId, appid, nickName, cb) {

};
/**
 * 从users数组中删除一个socketId不为传入的socketId的用户链接,
 * 保证users中appid为传入的appid的链接唯一
 * 如果不存在时返回 1 ，存在时删除，成功返回 1，失败返回 0
 * @param socketId 第一次链接时的cookieId
 * @param appid 用户的应用id
 * @returns user 返回删除的用户
 */
EtuanIM.prototype.distoryUser = function (appid, socketId) {
    var user = {};

    return user;
};
/**
 * 查找用户，根据socketId、从users数组中查找用户在数组中位置
 * @param socketId
 * @returns {number} 在数组中位置
 */
EtuanIM.prototype.findUser = function (socketId) {
    var index = -1;

    return index;
};
/**
 * 保存消息到数据库
 * @param msg 消息对象 {to: "APPID", from: "APPID", msgType:"0 OR 1", msgContent:"MSG"}
 * @param cb 处理后回调函数，参数err,tosocket
 */
EtuanIM.prototype.sendMsg = function (msg, cb) {

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
EtuanIM.prototype.onlineUsers = function (socketId) {
    var online=[];
    return online;
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