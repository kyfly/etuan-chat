module.exports = function(Room) {
	Room.remoteMethod('getHistory', {
		accepts: [{arg: 'from', type: 'string'},
				{arg: 'to', type: 'string'}],
	    returns: {arg: 'list', type: 'object'},
	    http: {verb: 'GET', path: '/getHistory'}
	});
	Room.getHistory = function (from, to, cb) {
		Room.findOne(
		{
			where: 
			{
				and: [{
					'_chatGroups.appid': from
				},{
					'_chatGroups.appid': to
				}]
			},
			fields: {
				msg: true
			}
		}, function (err, data) {
			cb(err, data.msg);
		});
	}
};
