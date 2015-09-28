//var socket = io(window.location.host + '/chat',
//    {query: "accessToken=1K4HLSt2fWDTf4shcCR1aBZVb3ObupPE9hMoEu1eIfszcc4nHKeWwmEEGPlAw75k&id="
//    + window.location.hash.substr(1)});
//socket.on('error', function (err) {
//    console.log(err);
//});
//socket.once('initSeckill', function (info, result, status) {
//    console.log(info, result, status);
//});
//socket.on('killFail', function(err){
//    console.log(err);
//    //err是一个字符串
//    //认证信息（id）错误  'verifyId wrong'
//    //已经抢过票了   'already gotten'
//    //还没有开始      'not started'
//    //没有余票了   'no enough'
//    //写入数据库出错   'database error'
//});
//socket.on('killSuccess', function() {
//    console.log('Seckill successfully!');
//});
//socket.on('addResult', function(verifyId){
//    console.log(verifyId);
//});

var app = angular.module('domo',[]);
app.controller('domoCtrl', function ($scope) {
    chat = new EtuanChat();
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
function EtuanChat () {
    var str = 'http://' + window.location.host + '/chat';
    this.socket = io(str);
    var that = this;
    this.socket.once('init', function (status, friends, others) {
        var data = {
            status: status,
            friends: friends,
            others: others
        };
        that.linkmans = others;
        that.__fire__('on_chat_init', data);
    });
    this.socket.once('cookieId', function (cookie) {
        this.cookie = cookie;
    });
    this.socket.on('broadcast', function (status, friends, others) {
        var data = {
            status: status,
            friends: friends,
            others: others
        };
        that.linkmans = others;
        that.__fire__('on_chat_init', data);
    });
    this.socket.on('private', function (data) {
        that.__fire__('new_msg_res', data);
    });
    //this.socket.emit('broadcast', 'sm');
}

/**
 * 发送消息
 * @param config Object
 * toAppId 接收者appId
 * appId   发送者appId
 * msg     消息内容
 * @return 100成功，101失败
 */
EtuanChat.prototype.sendMsg = function (config) {
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
EtuanChat.prototype.login = function (nickName, appId, cb) {
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
EtuanChat.prototype.__findUser__ = function (appid) {
    var users = this.linkmans;
    for (var i = 0; i < users.length; i++ ) {
        if (users[i].appId === appid) {
            return users[i];
        }
    }
    return null;
}
//监听事件
EtuanChat.prototype.on = function (eventName, fn) {
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
EtuanChat.prototype.__fire__ = function (eventName, message) {
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
EtuanChat.prototype.__bowerType__ = function () {
    if (document.all) {
        return 'IE';
    } else {
        return '!IE';
    }
}