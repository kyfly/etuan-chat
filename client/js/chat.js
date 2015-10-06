var app = angular.module('domo',[]);
function Base (IM) {
    this.IM = IM;
}
Base.prototype.login = function (args) {

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
function EtuanIM (appid, nickName) {
    this.appid = appid;
    this.nickName = nickName;
    var str = 'http://' + window.location.host + '/chat';
    this.socket = io(str);
    this.Base = new Base(this);
    this.Chat = new Chat(this);
}
app.controller('domoCtrl', function ($scope) {

    var chat = new EtuanIM('g','fdsd');
    chat.Base.login({success: function () {

    }});
    return;
    $scope.msgs = [];
    $scope.linkman = {
        nickName : 'EtuanChat',
        appId : null
    };
    chat.on('on_login', function (event) {
        console.log(event, 1);
    });
    chat.on('on_chat_init', function (message) {
        $scope.$apply(function () {
            $scope.others = message.others;
        });
    });
    chat.on('new_msg_res', function (message) {
        $scope.$apply(function () {
            $scope.linkman = message.from;
            $scope.msgs.push(message.msg);
            console.log($scope.linkman);
        });
    });
    $scope.login = function () {
        chat.login($scope.nickName, $scope.appId, function (res) {
            console.log(res,2);
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
/*
function Base () {
    //this.socket = socket;

}
function EtuanChat () {
    this.name = 'EtuamChat';
    var Base = new Base();
    Base.login.call(this, this.name);
}
EtuanIM.prototype.Base = function (){

    return new Base(this.socket);
    /!*that: this.socket,
    *!/
};
Base.prototype.login = function (args) {
    console.log(this, args);
};
/!**
 * 发送消息
 * @param config Object
 * toAppId 接收者appId
 * appId   发送者appId
 * msg     消息内容
 * @return 100成功，101失败
 *!/
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
//100成功，101失败
EtuanIM.prototype.login = function (nickName, appId, cb) {
    var that = this;
    var ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function () {
        if (ajax.readyState === 4 && ajax.status === 200)
        {
            res = ajax.responseText;
            res = JSON.parse(res);
            if (res.id && res.status === 200) {
                cb(100);
            } else {
                cb(101);
            }
        }
    };
    that.owner = {
        nickName: nickName,
        appId: appId,
        cookieId: that.socket.cookie
    };
    ajax.open("POST","/api/ChatUsers",true);
    ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    ajax.send('nickName='+ nickName + '&appId='+ appId + '&cookieId=' + that.socket.cookie);
};
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
};*/
