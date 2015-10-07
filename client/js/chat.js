function EtuanIM (appid, nickName) {
    this.appid = appid;
    this.nickName = nickName;
    var str = 'http://' + window.location.host + '/chat';
    this.socket = io(str);
    this.Base = new Base(this);
    this.Chat = new Chat(this);
    this.listen();
    this.authorized = false;
}
EtuanIM.prototype.listen = function () {
    var that = this;
    var socket = this.socket;
    /**
     * 用户进入系统后初始化
     */
    socket.on('init', function (onlines, rooms, unreads) {
        that.rooms = rooms;
        that.onlines = onlines;
        that.__fire__('init', {onlineUsers: onlines, rooms:rooms,unreadMsg: unreads});
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
    socket.on('system_error', function (user) {
        that.__fire__('system_error', user);
    });
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

EtuanIM.prototype.__findUser__ = function (appid) {
    var users = this.linkmans;
    for (var i = 0; i < users.length; i++ ) {
        if (users[i].appId === appid) {
            return users[i];
        }
    }
    return null;
};
//触发事件
EtuanIM.prototype.__fire__ = function (eventName, message) {
    var bowerType = this.__bowerType__();
    if (bowerType === 'IE') {
        var event = document.createEventObject();
        event.message = message;
        document.fireEvent(eventName, event);
    } else {
        var event = document.createEvent('HTMLEvents');
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
    IM.nickName = args.nickName;

    IM.socket.emit(
        'sign_up',{
            appid: args.appid,
            nickName: args.nickName
        }, function (res){
            IM.authorized = true;
            args.success(res);
        });
};

Base.prototype.unread = function (args) {

};
Base.prototype.setRead = function (args) {

};

Base.prototype.recentContact = function (args){

};

Base.prototype.history = function (args){

};

Base.prototype.shield = function (args) {

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
                args.success(res);
            });
    } else {
        args.error({status:400, msg: "参数不全"});
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
                args.success(res);
            })
        :function () {
        args.error({status: 400, msg: "参数不全"});
    };
};

