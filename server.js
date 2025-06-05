const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const GameManager = require('./src/game/GameManager');
const LLMService = require('./src/services/LLMService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const gameManager = new GameManager();
const llmService = new LLMService();

io.on('connection', (socket) => {
  console.log('玩家连接:', socket.id);

  socket.on('createGame', (data) => {
    const game = gameManager.createGame(data.scenario, socket.id);
    socket.join(game.id);
    socket.emit('gameCreated', { gameId: game.id, game });
  });

  socket.on('joinGame', (data) => {
    const result = gameManager.joinGame(data.gameId, socket.id, data.playerName);
    if (result.success) {
      socket.join(data.gameId);
      io.to(data.gameId).emit('playerJoined', result.game);
    } else {
      socket.emit('error', result.error);
    }
  });

  socket.on('playerAction', async (data) => {
    const result = await gameManager.processAction(data.gameId, socket.id, data.action);
    if (result.success) {
      io.to(data.gameId).emit('gameUpdate', result.gameState);
      
      if (result.needsLLMResponse) {
        const llmResponse = await llmService.generateResponse(result.gameState, data.action);
        const updateResult = gameManager.updateGameWithLLMResponse(data.gameId, llmResponse);
        io.to(data.gameId).emit('gameUpdate', updateResult.gameState);
      }
    } else {
      socket.emit('error', result.error);
    }
  });

  socket.on('disconnect', () => {
    console.log('玩家断开连接:', socket.id);
    gameManager.removePlayer(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});