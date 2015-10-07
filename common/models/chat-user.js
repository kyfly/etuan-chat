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

};
