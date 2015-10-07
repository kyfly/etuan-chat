var app = angular.module('domo',[]);
app.controller('domoCtrl', function ($scope) {

    var IM = new EtuanIM('g','fdsd');
    IM.Chat.on('onlineusers', function (users) {
        $scope.$apply(function () {
            $scope.others = users;
        });
        console.log('online',users);
    });
    IM.Chat.on('init', function (users) {
        $scope.$apply(function () {
            $scope.others = users.onlineUsers;
        });
    });
    IM.Chat.on('new_msg_in', function (msg) {
        console.log(msg);
        var msgs = window.localStorage[msg.from + '_from'];
        if (msgs)
            msgs = JSON.parse(msgs);
        else
            msgs = [];
        msgs.push(msg);
        $scope.$apply(function () {
            $scope.msgs = msgs;
        });
        console.log(msgs);
        window.localStorage[msg.from + '_from'] = JSON.stringify(msgs);
    });
    IM.Chat.on('new_user_in', function (user) {
        console.log('in ',user);
    });
    IM.Chat.on('have_user_out', function (user) {
        console.log('out ',user);
    });
    IM.Chat.on('system_error', function () {

    });
    IM.Chat.on('waring', function (msg) {
        console.log(msg);
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
            to: $scope.linkman.appid,
            msg: $scope.msg,
            msgType: 0,
            success: function (res) {
                console.log(res);
            },
            error: function (res) {
                console.log(res);
            }
        };
        IM.Chat.sendMsg(config);
    };
    $scope.changeUser = function () {
        var linkman = {};
        linkman.nickName = this.user.nickName;
        linkman.appid = this.user.appid;
        $scope.linkman = linkman;
    };

    $scope.history = function () {
        var config = {
            to: $scope.linkman.appid,
            success: function (res) {
                console.log(res);
            },
            error: function (res) {
                console.log(res);
            }
        };
        IM.Base.history(config);
    };
    $scope.unread = function () {
        var config = {
            success: function (res) {
                console.log(res);
            },
            error: function (res) {
                console.log(res);
            }
        };
        IM.Base.unread(config);
    };
    $scope.setRead = function () {
        var config = {
            to: $scope.linkman.appid,
            success: function (res) {
                console.log(res);
            },
            error: function (res) {
                console.log(res);
            }
        };
        IM.Base.setRead(config);
    };
    $scope.shield = function () {
        var config = {
            to: $scope.linkman.appid,
            nickName: $scope.linkman.nickName,
            success: function (res) {
                console.log(res);
            },
            error: function (res) {
                console.log(res);
            }
        };
        IM.Base.shield(config);
    };
    $scope.unshield = function () {
        var config = {
            to: $scope.linkman.appid,
            success: function (res) {
                console.log(res);
            },
            error: function (res) {
                console.log(res);
            }
        };
        IM.Base.unshield(config);
    };
    $scope.recentContact = function () {
        var users = IM.Base.recentContact();
        console.log(users);
    };
    $scope.inshield = function () {
        var users = IM.Base.inshield();
        console.log(users);
    };
});