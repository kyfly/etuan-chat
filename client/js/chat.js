function EtuanIM (appid, nickName) {
    this.appid = appid;
    this.nickName = nickName;
    var str = 'http://' + window.location.host + '/chat';
    this.socket = io(str);
    this.Base = new Base(this);
    this.Chat = new Chat(this);
    this.listen();
    this.authorized = false;
    this.shields = [];
}
EtuanIM.prototype.listen = function () {
    var that = this;
    var socket = this.socket;
    /**
     * 用户进入系统后初始化
     */
    socket.on('init', function (onlines, rooms, unreads ,users) {
        that.rooms = rooms;
        that.onlines = onlines;
        that.users = users;
        that.__fire__('init', unreads);
        that.__fire__('onlineusers', that.onlines);
    });
    /**
     * 新用户加入
     */
    socket.on('user_in', function (user) {
        if (!that.authorized)
            return;
        that.listenUsers('add',user);
    });
    /**
     * 私聊信息监听
     */
    socket.on('private_chat', function (msg) {
        if (!that.authorized)
            return;
        if (that.isShield(msg.from)) {
            return;
        }
        if (msg.newRoom === 1) {
            that.__setRoom__(msg);
        }
        that.__fire__('new_msg_in', msg);
    });
    /**
     * 用户退出，用户退出有自动退出和被迫退出
     */
    socket.on('user_out', function (user) {
        if (!that.authorized)
            return;
        if (user.appid === that.appid) {
            that.__fire__('waring', {status:403, msg:'你的账号在其他地方上线，你被迫下线'});
        } else {
            that.listenUsers('del', user);
        }
    });
};
EtuanIM.prototype.isShield = function (appid) {
    for (var i = 0; i < this.shields.length; i++ ) {
        if (this.shields[i].appid === appid) {
            return true;
        }
    }
    return false;
};
/**
 * 在线用户管理
 * @param act
 * @param user
 */
EtuanIM.prototype.listenUsers = function (act, user) {
    if (!this.authorized)
        return;
    if (act === 'add') {
        this.onlines.push(user);
        if (user.isNew === 1) {
            this.users.push(user);
        }
        this.__fire__('new_user_in', user);
    } else {
        this.deleteUser(user);
        this.__fire__('have_user_out', user);
    }
    this.__fire__('onlineusers', this.onlines);
};

EtuanIM.prototype.deleteUser = function (user) {
    for (var i = 0; i < this.onlines.length; i++ ) {
        if (this.onlines[i].appid === user.appid && this.onlines[i].nickName === user.nickName ) {
            this.onlines.splice(i, 1);
            return 1;
        }
    }
    return 0;
};
EtuanIM.prototype.__findRoom__ = function (toAppid) {
    var roomId = null;
    for (var i = 0; i < this.rooms.length; i++ ) {
        if (this.rooms[i].to === toAppid) {
            return this.rooms[i].roomId;
        }
    }
    return roomId;
};
EtuanIM.prototype.__setRoom__ = function (msg) {
    this.rooms.push({to: msg.from, roomId: msg.roomId});
};

//触发事件
EtuanIM.prototype.__fire__ = function (eventName, message) {
    var bowerType = this.__bowerType__();
    var event;
    if (bowerType === 'IE') {
        event = document.createEventObject();
        event.message = message;
        document.fireEvent(eventName, event);
    } else {
        event = document.createEvent('HTMLEvents');
        event.initEvent(eventName, true, true);
        event.message = message;
        document.dispatchEvent(event);
    }
};
//判断浏览器类型
EtuanIM.prototype.__bowerType__ = function () {
    if (document.all) {
        return 'IE';
    } else {
        return '!IE';
    }
};
function Base (IM) {
    this.IM = IM;
}
Base.prototype.login = function (args) {
    var IM = this.IM;
    IM.appid = args.appid;
    IM.nickName = args.nickName,
    IM.socket.emit(
        'sign_up',{
            appid: args.appid,
            nickName: args.nickName
        }, function (res){
            IM.authorized = true;
            args.success(res);
        });
};
/**
 *
 * @param args
 */
Base.prototype.unread = function (args) {
    var IM = this.IM;
    IM.socket.emit('unread', {appid: IM.appid}, function (res) {
        if (res.status === 200) {
            args.success(res.msg);
        } else {
            args.error(res.msg);
        }
    });
};
/**
 * 设置与某用户的聊天为已读
 * @param args
 */
Base.prototype.setRead = function (args) {
    var IM = this.IM;
    var roomId = IM.__findRoom__(args.to);
    if (!roomId) {
        args.error({status: 400, msg: "参数不全"});
        return;
    }
    IM.socket.emit('setRead', {from: IM.appid, roomId: roomId});
};
/**
 *
 * @param appid
 * @returns {*|string}
 */
Base.prototype.getNickNameByAppid = function (appid) {
    for (var i = 0; i < this.IM.users.length; i++ ) {
        if (this.IM.users[i].appid === appid) {
            return this.IM.users[i].nickName;
        }
    }
};
Base.prototype.getUserByRoomId = function (roomId) {
    for (var i = 0; i < this.IM.rooms.length; i++ ) {
        if (this.IM.rooms[i].roomId === roomId) {
            return {
                nickName : this.getNickNameByAppid(this.IM.rooms[i].to),
                appid : this.IM.rooms[i].to
            }
        }
    }
};
/**
 *
 * @returns {*|Array}
 */
Base.prototype.recentContact = function (){
    var IM = this.IM;
    return IM.rooms;
};
/**
 *
 * @param args
 */
Base.prototype.history = function (args){
    var IM = this.IM;
    var roomId = IM.__findRoom__(args.to);
    if (!roomId) {
        args.success({msg: null});
    }
    IM.socket.emit('history', {roomId: roomId}, function (res) {
        if (res.status === 200) {
            args.success(res.msgs);
        } else {
            args.error({msg: res.msg});
        }
    });
};
/**
 * 暂时屏蔽用户
 * @param args
 */
Base.prototype.shield = function (args) {
    var IM = this.IM;

    IM.shields.push({appid: args.appid, nickName: args.nickName});
};
/**
 * 解除屏蔽状态
 * @param args
 */
Base.prototype.unshield = function (args) {
    var IM = this.IM;
    for (var i = 0; i < IM.shields.length; i++ ) {
        if (IM.shields[i].appid === args.to) {
            IM.shields.splice(i, 1);
            args.success({msg: "解除屏蔽成功"});
            return;
        }
    }
    args.error({msg: "用户未被屏蔽"});
};
Base.prototype.readImage = function (e, cb) {
    var pic = e.files[0];
    var reader = new FileReader();
    if (!reader) {
        cb(null);
        return;
    }
    reader.onload = function(e) {
        cb({content: e.target.result});
    };
    reader.readAsDataURL(pic);
};
/**
 * 获取被屏蔽的用户
 * @returns {Array}
 */
Base.prototype.inshield = function () {
    return this.IM.shields;
};
/**
 * 进入对话窗口，获取对方状态
 * @param toAppid
 */
Base.prototype.inDialog = function (toAppid) {
    return this.IM.isShield(toAppid);
};
/**
 * 退出对话窗口
 *
 */
Base.prototype.outDialog = function (toAppid) {
    this.setRead(toAppid);
};
function Chat (IM) {
    this.IM = IM;
}
Chat.prototype.on = function (eventName, fn) {
    var bowerType = this.IM.__bowerType__();
    if (bowerType === 'IE') {
        document.attachEvent(eventName, function (event) {
            fn(event.message);
        });
    } else {
        document.addEventListener(eventName, function (event) {
            fn(event.message);
        });
    }
};
Chat.prototype.sendMsg = function (args) {
    var IM = this.IM;
    if (args.to && args.msg  && args.success && args.error) {
        IM.socket.emit('private_chat',
            {
                to: args.to,
                from: IM.appid,
                fromNickName: IM.nickName,
                roomId: IM.__findRoom__(args.to),
                msgContent: args.msg,
                msgType: args.msgType || 0
            }, function (res) {
                if (res.msg.newRoom === 1) {
                    res.msg.from = res.msg.to;
                    IM.__setRoom__(res.msg);
                }
                args.success(res.msg);
            });
        IM.Base.setRead(args);
    } else {
        args.error({msg: "参数不全"});
    }
};
Chat.prototype.broadcast = function (args) {
    var IM = this.IM;
    args.msg && args.msgType && args.success && args.error?
        IM.socket.emit('private_chat',
            {
                to: "ALL",
                form: IM.appid,
                msgContent: args.msg,
                msgType: args.msgType
            }, function (res) {
                args.success(res.msg);
            })
        :function () {
        args.error({msg: "参数不全"});
    };
};

