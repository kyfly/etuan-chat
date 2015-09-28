var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();
var Chat = require('../modules/etuan-chat/chat');
app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
app.use(loopback.static('../client'));
boot(app, __dirname, function(err) {
  if (err) throw err;
  // start the server if `$ node server.js`

});
if (require.main === module)
  var server = app.start();
Chat.etuanChat(app, server);

