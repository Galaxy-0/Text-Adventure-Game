class Game {
  constructor(id, scenario, dmId, config = {}) {
    this.id = id;
    this.scenario = scenario;
    this.dmId = dmId;
    this.players = new Map();
    this.maxPlayers = config.totalPlayers || 4;
    this.aiPlayerCount = config.aiPlayers || 0;
    this.isAIMaster = config.dmMode === 'ai';
    this.currentTurn = 0;
    this.gameState = 'waiting'; // waiting, playing, paused, ended
    this.narrative = [];
    this.currentScene = scenario.initialScene;
    this.gameTime = 0;
    this.globalAttributes = new Map();
    this.createdAt = new Date();
    this.lastActionTime = Date.now();
    this.aiActionTimer = null;
  }

  addPlayer(playerId, character) {
    this.players.set(playerId, character);
    this.addNarrativeEvent(`${character.name} 加入了冒险团队`);
    
    // 检查是否需要自动开始游戏
    this.checkGameStart();
  }

  checkGameStart() {
    const humanPlayers = Array.from(this.players.values()).filter(p => !p.isAI).length;
    const totalPlayersNeeded = this.maxPlayers - this.aiPlayerCount;
    
    if (humanPlayers >= totalPlayersNeeded && this.gameState === 'waiting') {
      this.gameState = 'playing';
      this.addNarrativeEvent(this.scenario.introText);
      
      // 如果是AI Master，启动自动内容生成
      if (this.isAIMaster) {
        this.startAIMasterMode();
      }
    }
  }

  createAIPlayers() {
    const AIPlayer = require('./AIPlayer');
    const aiNames = ['李智', '王谋', '张策', '刘慧']; // 预设AI角色名
    
    for (let i = 0; i < this.aiPlayerCount; i++) {
      const aiPlayer = new AIPlayer(aiNames[i] || `AI角色${i + 1}`, this.id);
      aiPlayer.autoSelectBackground();
      aiPlayer.autoAllocateAttributes();
      this.addPlayer(aiPlayer.playerId, aiPlayer);
    }
  }

  startAIMasterMode() {
    // 启动AI Master的定期内容生成
    this.aiActionTimer = setInterval(() => {
      this.processAITurn();
    }, 30000); // 每30秒检查一次
  }

  processAITurn() {
    // 让AI玩家考虑是否行动
    const aiPlayers = Array.from(this.players.values()).filter(p => p.isAI);
    
    aiPlayers.forEach(aiPlayer => {
      if (aiPlayer.shouldTakeAction(this.getState())) {
        const action = aiPlayer.generateAction(this.getState());
        this.processPlayerAction(aiPlayer.playerId, action);
      }
    });
  }

  stopAIMasterMode() {
    if (this.aiActionTimer) {
      clearInterval(this.aiActionTimer);
      this.aiActionTimer = null;
    }
  }

  removePlayer(playerId) {
    const character = this.players.get(playerId);
    if (character) {
      this.players.delete(playerId);
      this.addNarrativeEvent(`${character.name} 离开了冒险团队`);
    }
  }

  processPlayerAction(playerId, action) {
    const character = this.players.get(playerId);
    if (!character) {
      throw new Error('玩家不存在');
    }

    const actionResult = this.resolveAction(character, action);
    this.addNarrativeEvent(`${character.name}: ${action.description}`);
    
    if (actionResult.success) {
      this.applyActionEffects(character, actionResult.effects);
    }

    this.currentTurn++;
    this.gameTime += action.timeSpent || 10;

    return {
      success: actionResult.success,
      needsLLMResponse: actionResult.needsLLMResponse || false
    };
  }

  resolveAction(character, action) {
    const difficulty = action.difficulty || 10;
    const relevantAttribute = character.attributes[action.attribute] || 0;
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + relevantAttribute;

    const success = total >= difficulty;

    return {
      success,
      roll,
      total,
      needsLLMResponse: action.type === 'dialogue' || action.type === 'exploration',
      effects: success ? action.successEffects : action.failureEffects
    };
  }

  applyActionEffects(character, effects) {
    if (!effects) return;

    if (effects.attributeChanges) {
      Object.entries(effects.attributeChanges).forEach(([attr, change]) => {
        character.modifyAttribute(attr, change);
      });
    }

    if (effects.itemsGained) {
      effects.itemsGained.forEach(item => character.addItem(item));
    }

    if (effects.questUpdates) {
      effects.questUpdates.forEach(update => {
        character.updateQuest(update.questId, update.progress);
      });
    }
  }

  addNarrativeEvent(text) {
    this.narrative.push({
      timestamp: new Date(),
      text,
      turn: this.currentTurn
    });
  }

  getState() {
    const humanPlayers = Array.from(this.players.values()).filter(p => !p.isAI).length;
    const totalPlayersNeeded = this.maxPlayers - this.aiPlayerCount;
    
    return {
      id: this.id,
      scenario: this.scenario.name,
      players: Array.from(this.players.values()).map(p => p.getState()),
      narrative: this.narrative.slice(-20), // 只返回最近20条
      currentScene: this.currentScene,
      gameState: this.gameState,
      currentTurn: this.currentTurn,
      gameTime: this.gameTime,
      lastActionTime: this.lastActionTime,
      isAIMaster: this.isAIMaster,
      canJoin: humanPlayers < totalPlayersNeeded && this.gameState === 'waiting',
      config: {
        maxPlayers: this.maxPlayers,
        aiPlayerCount: this.aiPlayerCount,
        humanPlayersNeeded: totalPlayersNeeded - humanPlayers
      }
    };
  }
}

module.exports = Game;