var io = require('socket.io');
var users = [];
module.exports.etuanChat = EtuanChat;
module.exports.upUsers = upUsers;
module.exports.otherUsers = findOthers;
function EtuanChat(app, server) {
    io = io(server);
    messageHandle(io);
}
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
            }
            result.push(other);
        }
    return result;
}