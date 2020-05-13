var getYoutubeTitle = require('get-youtube-title')
var app = require('express')();
var server = require('http').createServer(app);
// http server를 socket.io server로 upgrade한다
var io = require('socket.io')(server);

var rooms = {
  "music" : {
    list: [
      {id: "Pg7nBHXQCCA", title: "Red Velvet 레드벨벳 - Psycho @ReVe Festival FINALE", adder : "TEST"}
    ]
  },
  "asfd2" : {

  }
}

// localhost:3000으로 서버에 접속하면 클라이언트로 index.html을 전송한다
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
  });
  
  // connection event handler
  // connection이 수립되면 event handler function의 인자로 socket인 들어온다
  io.on('connection', function(socket) {
  
    // 접속한 클라이언트의 정보가 수신되면
    socket.on('init', function(data) {
      console.log('Client logged-in: ' + data.name);
  
      // socket에 클라이언트 정보를 저장한다
      socket.room = data.room;
      socket.name = data.name;
      socket.emit('join', {name: data.name, room: data.room, list: rooms[ data.room].list});

      socket.join(data.room);
      //socket.set('room', data.room);
      
      // socket.to(data.room).emit('system', { message : data.name + '님이 접속하셨습니다.' });

      // 접속된 모든 클라이언트에게 메시지를 전송한다
      // io.emit('welcome', data.name );
    });
  
    // 클라이언트로부터의 메시지가 수신되면
    socket.on('addVideo', function(data) {
      getYoutubeTitle(data.videoId, function (err, title) {
        if (title === undefined) {
          socket.emit('addVideoError', {message: 'No youtube id error'});
        }
        else {
          rooms[socket.room].list.push( { title : title, id: data.videoId, adder: socket.name })
          socket.emit('system', "[SONG ADDED] `" + title + "` ");
          io.to(socket.room).emit('addVideo', { title : title, id: data.videoId, adder: socket.name });
        }
      })
    });
    // 클라이언트로부터의 메시지가 수신되면
    socket.on('chat', function(data) {
      console.log('Message from %s: %s', socket.name, data.msg);
  
      var msg = {
        from: {
          name: socket.name,
          userid: socket.userid
        },
        msg: data.msg
      };
  
      // 메시지를 전송한 클라이언트를 제외한 모든 클라이언트에게 메시지를 전송한다
      socket.broadcast.emit('chat', msg);
  
      // 메시지를 전송한 클라이언트에게만 메시지를 전송한다
      // socket.emit('s2c chat', msg);
  
      // 접속된 모든 클라이언트에게 메시지를 전송한다
      // io.emit('s2c chat', msg);
  
      // 특정 클라이언트에게만 메시지를 전송한다
      // io.to(id).emit('s2c chat', data);
    });
  
    // force client disconnect from server
    socket.on('forceDisconnect', function() {
      socket.disconnect();
    })
  
    socket.on('disconnect', function() {
      console.log('user disconnected: ' + socket.name);
    });
  });
  
  server.listen(3000, function() {
    console.log('Socket IO server listening on port 3000');
  });