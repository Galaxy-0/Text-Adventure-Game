const { v4: uuidv4 } = require('uuid');
const Game = require('./Game');
const Character = require('./Character');
const scenarios = require('../data/scenarios');

class GameManager {
  constructor() {
    this.games = new Map();
    this.playerToGame = new Map();
  }

  createGame(scenarioId, dmId) {
    const gameId = uuidv4();
    const scenario = scenarios[scenarioId];
    
    if (!scenario) {
      throw new Error('未知的场景ID');
    }

    const game = new Game(gameId, scenario, dmId);
    this.games.set(gameId, game);
    this.playerToGame.set(dmId, gameId);
    
    return game;
  }

  joinGame(gameId, playerId, playerName) {
    const game = this.games.get(gameId);
    
    if (!game) {
      return { success: false, error: '游戏不存在' };
    }

    if (game.players.size >= game.maxPlayers) {
      return { success: false, error: '游戏已满' };
    }

    const character = new Character(playerName, playerId);
    game.addPlayer(playerId, character);
    this.playerToGame.set(playerId, gameId);

    return { success: true, game: game.getState() };
  }

  async processAction(gameId, playerId, action) {
    const game = this.games.get(gameId);
    
    if (!game) {
      return { success: false, error: '游戏不存在' };
    }

    if (!game.players.has(playerId)) {
      return { success: false, error: '玩家不在游戏中' };
    }

    const result = game.processPlayerAction(playerId, action);
    
    return {
      success: true,
      gameState: game.getState(),
      needsLLMResponse: result.needsLLMResponse
    };
  }

  updateGameWithLLMResponse(gameId, llmResponse) {
    const game = this.games.get(gameId);
    game.addNarrativeEvent(llmResponse);
    
    return {
      success: true,
      gameState: game.getState()
    };
  }

  removePlayer(playerId) {
    const gameId = this.playerToGame.get(playerId);
    if (gameId) {
      const game = this.games.get(gameId);
      if (game) {
        game.removePlayer(playerId);
        if (game.players.size === 0) {
          this.games.delete(gameId);
        }
      }
      this.playerToGame.delete(playerId);
    }
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }
}

module.exports = GameManager;