var chat = require('../../modules/etuan-chat/chat');
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
        case 'update':
            model.updateAll(query, data, callback);
    }
    return deferred.promise;//必须返回这个
}
module.exports = function(ChatUser) {
    ChatUser.beforeRemote('create', function (ctx, instance, next) {
        var postData = {
            nickName : ctx.req.body.nickName,
            appId: ctx.req.body.appId
        };
        var id = null;
        var cookieId = ctx.req.body.cookieId;
        promise(ChatUser, 'findOne', {where:{appId: postData.appId}})
            .then(function (data) {
                if (!data) {
                    return promise(ChatUser, 'create', {}, postData);
                } else {
                    id = data.id;
                    if (data.nickName !== postData.nickName)
                    {
                        return promise(ChatUser, 'update', {id: data.id}, {nickName: postData.nickName});
                    } else {
                        data.cookieId = cookieId;
                        if(chat.upUsers(data)) {
                            ctx.res.send({status: 200, id: data.id});
                        }
                    }
                }
            })
            .then(function (data) {
                postData.cookieId = cookieId;
                postData.id = id || data.id;
                if(chat.upUsers(postData)) {
                    ctx.res.send({status: 200, id: data.id});
                }
            }, function (err) {
                ctx.res.send('faild');
            });
    });
    ChatUser.remoteMethod(
        'otherUsers',
        {
            accepts:{arg:"id", type: 'string'},
            returns:{arg:'users', type: 'array'},
            http: {path: '/others',verb: 'get'}
        });
    ChatUser.otherUsers = function (id, cb) {
        var others = chat.otherUsers(id);
        cb(others);
    }
};
