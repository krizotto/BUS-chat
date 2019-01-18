var express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server);

server.listen(process.env.PORT || 5000);
app.use(express.static(__dirname + '/public'));
app.get('/',function(req,res){
  res.sendFile(__dirname+'/index.html');
});


io.sockets.on('connection', function (socket) {

   console.log("Socket connected.");

  socket.on('connection-established', function(json){
    console.log(json)
    io.emit('my connection', json)
  })

  socket.on('my event', function(json){
    console.log(json)
    console.log('message: ' + json['message'])
    io.emit('my response', json)
  })
  
});

