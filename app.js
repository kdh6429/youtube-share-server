var getYoutubeTitle = require('get-youtube-title')
var app = require('express')();
var server = require('http').createServer(app);
// http server를 socket.io server로 upgrade한다
var io = require('socket.io')(server);

var rooms = {
  "music" : {
    list: [
      {id: "Pg7nBHXQCCA", title: "Red Velvet 레드벨벳 - Psycho @ReVe Festival FINALE", adder : "TEST"}
    ],
    users: {

    }
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
      socket.emit('join', {name: data.name, room: data.room, list: rooms[ data.room].list, users: rooms[ data.room].users});

      socket.join(data.room);
      //socket.set('room', data.room);
      
      // socket.to(data.room).emit('system', { message : data.name + '님이 접속하셨습니다.' });

      // 접속된 모든 클라이언트에게 메시지를 전송한다
      // io.emit('welcome', data.name );
    });
  
    
    socket.on('changeSong', function(index) {
      console.log( "changeSong");
      rooms[socket.room].users[socket.name] = index;
      io.to(socket.room).emit('changeSong', { user: socket.name, songIndex: index });
    });

    // 클라이언트로부터의 메시지가 수신되면
    socket.on('addVideo', function(videoId) {
      const itemToFind = rooms[socket.room].list.find(function(item) {
        return item.id === videoId;
      })
      const idx = rooms[socket.room].list.indexOf(itemToFind) 
      if (idx > -1) 
      {
        socket.emit('system', "song already added(" + idx + ") ");
        return ;
      }
      console.log( "try addVideo");
      getYoutubeTitle(videoId, function (err, title) {
        if (title === undefined) {
          socket.emit('system', 'No youtube id error');
        }
        else {
          console.log("add video");
          rooms[socket.room].list.push( { title : title, id: videoId, adder: socket.name })
          socket.emit('system', "[SONG ADDED] `" + title + "` ");
          io.to(socket.room).emit('addVideo', { title : title, id: videoId, adder: socket.name });
        }
      })
    });

    // 클라이언트로부터의 메시지가 수신되면
    socket.on('deleteVideo', function(videoId) {
      const itemToFind = rooms[socket.room].list.find(function(item) {
        return item.id === videoId && item.adder === socket.name;
      })
      const idx = rooms[socket.room].list.indexOf(itemToFind) 
      if (idx > -1) 
      {
        rooms[socket.room].list.splice(idx, 1)
        socket.emit('system', "[SONG DELETED]");
        io.to(socket.room).emit('deleteVideo', {id: videoId});
      }
      else {
        socket.emit('system', "not owner error");
      }
    });
  

    // force client disconnect from server
    socket.on('forceDisconnect', function() {
      socket.disconnect();
    })
    socket.on('disconnect', function() {
      console.log( "disconnect");
      io.to(socket.room).emit('deleteUser', socket.name);

      if (rooms[socket.room] && rooms[socket.room].users[socket.name]) {
        delete rooms[socket.room].users[socket.name];
      }
     
      console.log('user disconnected: ' + socket.name);
    });
  });
  
  server.listen(3000, function() {
    console.log('Socket IO server listening on port 3000');
  });