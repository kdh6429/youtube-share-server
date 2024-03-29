var parser = require('youtube-meta-parser')
var app = require('express')();
var server = require('http').createServer(app);
// http server를 socket.io server로 upgrade한다
var io = require('socket.io')(server);
var urlParser = require('js-video-url-parser')

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

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
  });
  
  // connection event handler
  io.on('connection', function(socket) {
  
    socket.on('init', function(data) {
      socket.room = data.room;
      socket.name = data.name;
      socket.emit('join', {name: data.name, room: data.room, list: rooms[ data.room].list, users: rooms[ data.room].users});

      socket.join(data.room);
      //socket.set('room', data.room);
      
      // socket.to(data.room).emit('system', { message : data.name + '님이 접속하셨습니다.' });

      // io.emit('welcome', data.name );
    });
  
    
    socket.on('changeSong', function(index) {
      rooms[socket.room].users[socket.name] = index;
      io.to(socket.room).emit('changeSong', { user: socket.name, songIndex: index });
    });

    socket.on('addVideo', function(videoId) {
      if(videoId.indexOf('http') !== -1) {
        videoId = urlParser.parse(videoId).id
      }
      const itemToFind = rooms[socket.room].list.find(function(item) {
        return item.id === videoId;
      })
      const idx = rooms[socket.room].list.indexOf(itemToFind) 
      if (idx > -1) 
      {
        socket.emit('system', "song already added(" + idx + ") ");
        return ;
      }
      parser.getMetadata(videoId).then( function(metadata) {
        const title = metadata['videoDetails']['title'];
        if (title === undefined) {
          socket.emit('system', 'No youtube id error');
        }
        else {
          rooms[socket.room].list.push( { title : title, id: videoId, adder: socket.name })
          socket.emit('system', "[SONG ADDED] `" + title + "` ");
          io.to(socket.room).emit('addVideo', { title : title, id: videoId, adder: socket.name });
        }
      }).catch((error)=>{
        socket.emit('system', error);
      });
    });

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
      io.to(socket.room).emit('deleteUser', socket.name);

      if (rooms[socket.room] && rooms[socket.room].users[socket.name]) {
        delete rooms[socket.room].users[socket.name];
      }
     
    });
  });
  
  server.listen(3000, function() {
    console.log('Socket IO server listening on port 3000');
  });
