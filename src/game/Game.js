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
    
    // 回合制系统
    this.turnOrder = []; // 玩家行动顺序
    this.currentPlayerIndex = 0; // 当前行动玩家索引
    this.waitingForPlayer = null; // 等待行动的玩家ID
    this.turnTimeout = null; // 回合超时计时器
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
      
      // 初始化回合制系统
      this.initializeTurnOrder();
      
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
    
    // 初始化回合顺序
    this.initializeTurnOrder();
  }

  processAITurn() {
    // AI Master定期检查是否需要推进剧情（不是AI玩家行动）
    const timeSinceLastAction = Date.now() - this.lastActionTime;
    if (timeSinceLastAction > 120000) { // 2分钟无动作时推进剧情
      this.addNarrativeEvent('时间静静流逝，周围的环境似乎在等待着什么...');
      this.lastActionTime = Date.now();
    }
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

    // 检查是否轮到该玩家行动
    if (this.turnOrder.length > 0 && this.waitingForPlayer !== playerId) {
      throw new Error('不是你的回合');
    }

    const actionResult = this.resolveAction(character, action);
    this.addNarrativeEvent(`${character.name}: ${action.description}`);
    
    if (actionResult.success) {
      this.applyActionEffects(character, actionResult.effects);
    }

    this.currentTurn++;
    this.gameTime += action.timeSpent || 10;
    this.lastActionTime = Date.now();
    
    // 转到下一个玩家
    this.nextTurn();

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

  // 新增：初始化回合顺序
  initializeTurnOrder() {
    this.turnOrder = Array.from(this.players.keys());
    // 打乱顺序以获得随机性
    for (let i = this.turnOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.turnOrder[i], this.turnOrder[j]] = [this.turnOrder[j], this.turnOrder[i]];
    }
    this.currentPlayerIndex = 0;
    this.startNextTurn();
  }

  // 新增：开始下一个回合
  startNextTurn() {
    if (this.turnOrder.length === 0) return;
    
    this.waitingForPlayer = this.turnOrder[this.currentPlayerIndex];
    const currentPlayer = this.players.get(this.waitingForPlayer);
    
    if (!currentPlayer) {
      this.nextTurn();
      return;
    }
    
    // 如果是AI玩家，自动执行行动
    if (currentPlayer.isAI) {
      setTimeout(() => {
        this.executeAIAction(currentPlayer);
      }, 2000 + Math.random() * 3000); // 2-5秒随机延迟，模拟思考时间
    } else {
      // 人类玩家，设置超时
      this.turnTimeout = setTimeout(() => {
        this.addNarrativeEvent(`${currentPlayer.name}陷入沉思，跳过了这个回合...`);
        this.nextTurn();
      }, 60000); // 60秒超时
    }
  }

  // 新增：转到下一个玩家
  nextTurn() {
    if (this.turnTimeout) {
      clearTimeout(this.turnTimeout);
      this.turnTimeout = null;
    }
    
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.turnOrder.length;
    this.startNextTurn();
  }

  // 新增：执行AI行动
  executeAIAction(aiPlayer) {
    if (this.waitingForPlayer !== aiPlayer.playerId) return; // 双重检查
    
    const action = aiPlayer.generateAction(this.getState());
    try {
      this.processPlayerAction(aiPlayer.playerId, action);
    } catch (error) {
      console.error('AI行动执行失败:', error);
      this.nextTurn();
    }
  }

  getState() {
    const humanPlayers = Array.from(this.players.values()).filter(p => !p.isAI).length;
    const totalPlayersNeeded = this.maxPlayers - this.aiPlayerCount;
    const currentPlayer = this.waitingForPlayer ? this.players.get(this.waitingForPlayer) : null;
    
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
      // 回合制信息
      currentPlayer: currentPlayer ? {
        id: currentPlayer.playerId,
        name: currentPlayer.name,
        isAI: currentPlayer.isAI
      } : null,
      isYourTurn: false, // 这个将在服务器端根据具体玩家设置
      config: {
        maxPlayers: this.maxPlayers,
        aiPlayerCount: this.aiPlayerCount,
        humanPlayersNeeded: totalPlayersNeeded - humanPlayers
      }
    };
  }
}

module.exports = Game;