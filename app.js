let express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server);

server.listen(process.env.PORT || 5000); //choose port

app.use(express.static(__dirname + '/public')); //directory to static files (*.css, *.js)
app.get('/',function(req,res){
  res.sendFile(__dirname+'/index.html');
}); //redirect to index.html on main page


io.sockets.on('connection', function (socket) {

  console.log("Socket connected.");

  socket.on('connection-request', function(json){
    console.log(json)
    io.emit('connection-response', json)
  })

  socket.on('message-request', function(json){
    console.log(json)
    console.log('message: ' + json['message'])
    io.emit('message-response', json)
  })
  
});

