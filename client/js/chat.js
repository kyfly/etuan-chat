var app = angular.module('domo',[]);
function Base (IM) {
    this.IM = IM;
}
Base.prototype.login = function (args) {
    this.IM.socket.emit(
        'sign_up',{
            appid: args.appid,
            nickName: args.nickName
        }, function (res){
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
    args.to && args.msg && args.msgType && args.success && args.error?
        IM.socket.emit('private_chat',
            {
                to: args.to,
                form: IM.appid,
                msgContent: args.msg,
                msgType: args.msgType
            }, function (res) {
                args.success(res);
            })
        :function () {
        args.error({status:400, msg: "参数不全"});
    };
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
function EtuanIM (appid, nickName) {
    this.appid = appid;
    this.nickName = nickName;
    var str = 'http://' + window.location.host + '/chat';
    this.socket = io(str);
    this.Base = new Base(this);
    this.Chat = new Chat(this);
    this.listen();
}
EtuanIM.prototype.listen = function () {
    var that = this;
    var socket = this.socket;
    socket.on('init', function (onlines, rooms, unreads) {
        that.__fire__('init', {onlineUsers: onlines, rooms:rooms,unreadMsg: unreads});
    });
    socket.on('new_user_in', function (user) {
        that.__fire__('new_user_in', user);
    });
    socket.on('new_msg_in', function (user) {
        that.__fire__('new_user_in', user);
    });
    socket.on('have_user_out', function (user) {
        that.__fire__('have_user_out', user);
    });
    socket.on('system_error', function (user) {
        that.__fire__('system_error', user);
    });
};
app.controller('domoCtrl', function ($scope) {

    var IM = new EtuanIM('g','fdsd');

    IM.Chat.on('init', function (users) {
        $scope.$apply(function () {
            $scope.others = users.onlineUsers;
        });
        console.log(users);
    });
    IM.Chat.on('new_msg_in', function () {

    });
    IM.Chat.on('new_user_in', function () {

    });
    IM.Chat.on('have_user_out', function () {

    });
    IM.Chat.on('system_error', function () {

    });
    IM.Chat.broadcast({msg: "some msg"}, function (res) {

    });
    $scope.msgs = [];
    $scope.linkman = {
        nickName : 'EtuanChat',
        appId : null
    };
    $scope.login = function () {
        IM.Base.login(
            {
                appid: $scope.appId,
                nickName: $scope.nickName,
                success: function (res) {
                    console.log(res);
                },
                error: function (res) {
                    console.log(res);
                }
            });
    };
    $scope.sendMsg = function () {
        var config = {
            toAppId: $scope.linkman.appId,
            appid: $scope.appId,
            msg: $scope.msg
        };
        chat.sendMsg(config);
    };
    $scope.changeUser = function () {
        var linkman = {};
        linkman.nickName = this.user.nickName;
        linkman.appId = this.user.appId;
        $scope.linkman = linkman;
    }
});

//function EtuanIM (appid, nickName) {
//    var str = 'http://' + window.location.host + '/chat';
//    this.socket = io(str);
//    var that = this;
//    this.socket.once('init', function (status, friends, others) {
//        var data = {
//            status: status,
//            friends: friends,
//            others: others
//        };
//        that.linkmans = others;
//        that.__fire__('on_chat_init', data);
//    });
//    this.socket.once('cookieId', function (cookie) {
//        this.cookie = cookie;
//    });
//    this.socket.emit('sign_up', {appid:"1",nickName:"123"}, function (data) {
//        console.log(data);
//    });
//    this.socket.on('broadcast', function (status, friends, others) {
//        var data = {
//            status: status,
//            friends: friends,
//            others: others
//        };
//        that.linkmans = others;
//        that.__fire__('on_chat_init', data);
//    });
//    this.socket.on('private', function (data) {
//        that.__fire__('new_msg_res', data);
//    });
//    this.socket.emit('broadcast', 'sm');
//}

/**
 * 发送消息
 * @param config Object
 * toAppId 接收者appId
 * appId   发送者appId
 * msg     消息内容
 * @return 100成功，101失败
 */
EtuanIM.prototype.sendMsg = function (config) {
    var from = this.owner;
    var to = this.__findUser__(config.toAppId);

    if (from && to) {
        data = {
            from: from.cookieId,
            to: to.cookieId,
            msg: config.msg
        };
        this.socket.emit('private', data);
        return 100;
    } else {
        return 101;
    }
}

EtuanIM.prototype.__findUser__ = function (appid) {
    var users = this.linkmans;
    for (var i = 0; i < users.length; i++ ) {
        if (users[i].appId === appid) {
            return users[i];
        }
    }
    return null;
}
//监听事件
EtuanIM.prototype.on = function (eventName, fn) {
    var bowerType = this.__bowerType__();
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
