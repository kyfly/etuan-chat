var app = angular.module('domo', []);
app.controller('domoCtrl', function ($scope) {
    var IM = new EtuanIM();
    $scope.login = function () {
        IM.Base.login(
            {
                appid: $scope.appId,
                nickName: $scope.nickName,
                success: function (res) {
                    console.log("join success");
                },
                error: function (res) {
                    console.log("join fail");
                }
            });
    };
    IM.Chat.on('onlineusers', function (users) {
        console.log('new user join');
        $scope.$apply(function () {
            $scope.others = users;
        });
    });
    IM.Chat.on('init', function (unreads) {
        var user;
        for (var i = 0; i < unreads.length; i++) {
            user = IM.Base.getUserByRoomId(unreads[i].id);
            unreads[i].appid = user.appid;
            unreads[i].nickName = user.nickName;
            unreads[i].msgNo = unreads[i].msg.length;
        }
        console.log('join system success', unreads);
        $scope.$apply(function () {
            $scope.unreads = unreads;
        });
    });
    function addTounread (msg) {
        var index = -1;
        unreads = $scope.unreads;
        var user = {
            appid: msg.from,
            nickName : msg.fromNickName,
            id: msg.roomId,
            msg: [msg],
            msgNo: 1
        };
        for (var i = 0; i < unreads.length; i++) {
            if (unreads[i].id === msg.roomId) {
                index = i;
            }
        }
        if (index === -1) {
            unreads.push(user);
        } else {
            unreads[index].msgNo ++;
            unreads[index].msg.push(msg);
        }
        $scope.$apply(function () {
            $scope.unreads = unreads;
        });
    }
    IM.Chat.on('new_msg_in', function (msg) {
        if (msg.from === $scope.linkman.appid) {
            $scope.$apply(function () {
                $scope.msgs = [msg];
            });
        } else {
            addTounread(msg);
        }
    });
    IM.Chat.on('new_user_in', function (user) {
        console.log('new user join');
    });
    IM.Chat.on('have_user_out', function (user) {
        console.log('have user quit');
    });
    IM.Chat.on('waring', function (msg) {
        console.log(msg);
    });
    $scope.linkman = {
        nickName: 'EtuanChat',
        appId: null
    };

    $scope.sendMsg = function () {
        var config = {
            to: $scope.linkman.appid,
            msg: $scope.msg,
            msgType: 0,
            success: function (msg) {
                $scope.$apply(function () {
                    $scope.msgs = [msg];
                });
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
        readMsg (this.user.appid);
    };
    function readMsg (appid) {
        for (var i = 0; i < $scope.unreads.length; i++) {
            if ($scope.unreads[i].appid === appid) {
                $scope.unreads.splice(i, 1);
                return $scope.unreads;
            }
        }
    }
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
    $scope.readMsg = function () {
        var linkman = {};
        linkman.nickName = this.user.nickName;
        linkman.appid = this.user.appid;
        $scope.linkman = linkman;
        $scope.msgs = this.user.msg;
        readMsg (this.user.appid);
        $scope.setRead();
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
            error: function (res) {
                console.log(res);
            }
        };
        IM.Base.setRead(config);
    };
    $scope.shield = function () {
        var config = {
            appid: $scope.linkman.appid,
            nickName: $scope.linkman.nickName
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
