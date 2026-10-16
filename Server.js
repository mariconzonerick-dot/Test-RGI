const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

let connectedUsers = {};
const CREATOR_NICK = "Mendoza";

io.on('connection', (socket) => {
  socket.on('login', (data) => {
    let nickname = data.nickname.trim();
    let globalRank = "User";

    if (nickname.toLowerCase() === CREATOR_NICK.toLowerCase()) {
      globalRank = "Owner [Creador]";
    }

    connectedUsers[socket.id] = {
      nickname: nickname,
      globalRank: globalRank
    };

    io.emit('updateUsers', Object.values(connectedUsers));
  });

  socket.on('sendMessage', (messageText) => {
    const user = connectedUsers[socket.id];
    if (!user) return;

    // Comando exclusivo del Owner para asignar rangos globales: /setrank [usuario] [rango]
    if (messageText.startsWith('/setrank') && user.globalRank.includes("Owner")) {
      const parts = messageText.split(' ');
      const targetNick = parts[1];
      const newRank = parts.slice(2).join(' ');

      for (let id in connectedUsers) {
        if (connectedUsers[id].nickname.toLowerCase() === targetNick.toLowerCase()) {
          connectedUsers[id].globalRank = newRank;
          io.emit('updateUsers', Object.values(connectedUsers));
          return;
        }
      }
    }

    io.emit('chatMessage', {
      user: user.nickname,
      globalRank: user.globalRank,
      text: messageText
    });
  });

  socket.on('disconnect', () => {
    if (connectedUsers[socket.id]) {
      delete connectedUsers[socket.id];
      io.emit('updateUsers', Object.values(connectedUsers));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor RGI activo en puerto ${PORT}`);
});
