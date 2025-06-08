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
    const config = {
      totalPlayers: data.totalPlayers || 2,
      aiPlayers: data.aiPlayers || 0,
      dmMode: data.dmMode || 'human'
    };
    
    const game = gameManager.createGame(data.scenario, socket.id, config);
    socket.join(game.id);
    socket.emit('gameCreated', { gameId: game.id, game: game.getState() });
  });

  socket.on('createCharacter', (data) => {
    const result = gameManager.createCharacter(data.gameId, socket.id, data.characterData);
    if (result.success) {
      io.to(data.gameId).emit('characterCreated', result.game);
      
      // 如果游戏已开始，通知当前行动玩家
      const game = gameManager.getGame(data.gameId);
      if (game && game.gameState === 'playing' && game.waitingForPlayer) {
        io.to(game.waitingForPlayer).emit('yourTurn', { 
          isYourTurn: true,
          currentPlayer: result.game.currentPlayer 
        });
        
        // 通知其他玩家等待
        const allSockets = io.sockets.adapter.rooms.get(data.gameId);
        if (allSockets) {
          allSockets.forEach(socketId => {
            if (socketId !== game.waitingForPlayer) {
              io.to(socketId).emit('yourTurn', { 
                isYourTurn: false,
                currentPlayer: result.game.currentPlayer 
              });
            }
          });
        }
      }
    } else {
      socket.emit('error', result.error);
    }
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
      // 为每个玩家设置是否轮到他们行动
      const gameState = result.gameState;
      const game = gameManager.getGame(data.gameId);
      
      // 向所有玩家广播游戏状态更新
      io.to(data.gameId).emit('gameUpdate', gameState);
      
      // 单独告知每个玩家是否轮到他们
      if (game && game.waitingForPlayer) {
        io.to(game.waitingForPlayer).emit('yourTurn', { 
          isYourTurn: true,
          currentPlayer: gameState.currentPlayer 
        });
        
        // 通知其他玩家等待
        const allSockets = io.sockets.adapter.rooms.get(data.gameId);
        if (allSockets) {
          allSockets.forEach(socketId => {
            if (socketId !== game.waitingForPlayer) {
              io.to(socketId).emit('yourTurn', { 
                isYourTurn: false,
                currentPlayer: gameState.currentPlayer 
              });
            }
          });
        }
      }
      
      if (result.needsLLMResponse) {
        const isAIMaster = game && game.isAIMaster;
        const llmResponse = await llmService.generateResponse(result.gameState, data.action, isAIMaster);
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