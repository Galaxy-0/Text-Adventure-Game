class Game {
  constructor(id, scenario, dmId) {
    this.id = id;
    this.scenario = scenario;
    this.dmId = dmId;
    this.players = new Map();
    this.maxPlayers = 4;
    this.currentTurn = 0;
    this.gameState = 'waiting'; // waiting, playing, paused, ended
    this.narrative = [];
    this.currentScene = scenario.initialScene;
    this.gameTime = 0;
    this.globalAttributes = new Map();
    this.createdAt = new Date();
  }

  addPlayer(playerId, character) {
    this.players.set(playerId, character);
    this.addNarrativeEvent(`${character.name} 加入了冒险团队`);
    
    if (this.players.size === 1 && this.gameState === 'waiting') {
      this.gameState = 'playing';
      this.addNarrativeEvent(this.scenario.introText);
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
    return {
      id: this.id,
      scenario: this.scenario.name,
      players: Array.from(this.players.values()).map(p => p.getState()),
      narrative: this.narrative.slice(-20), // 只返回最近20条
      currentScene: this.currentScene,
      gameState: this.gameState,
      currentTurn: this.currentTurn,
      gameTime: this.gameTime,
      canJoin: this.players.size < this.maxPlayers && this.gameState === 'waiting'
    };
  }
}

module.exports = Game;