class Character {
  constructor(name, playerId) {
    this.name = name;
    this.playerId = playerId;
    this.background = null;
    this.attributes = {
      strategy: 0,    // 战略
      eloquence: 0,   // 辩才  
      knowledge: 0,   // 学识
      insight: 0,     // 洞察
      connections: 0  // 人脉
    };
    this.items = [];
    this.reputation = 0;
    this.health = 100;
    this.relationships = new Map();
    this.quests = new Map();
    this.secrets = [];
    this.specialAbilities = [];
  }

  setBackground(backgroundData) {
    this.background = backgroundData;
    
    // 从场景数据中查找对应的背景配置
    const scenarios = require('../data/scenarios');
    let backgroundConfig = null;
    
    for (const scenario of Object.values(scenarios)) {
      if (scenario.backgrounds) {
        backgroundConfig = scenario.backgrounds.find(bg => bg.id === backgroundData.id);
        if (backgroundConfig) break;
      }
    }
    
    if (backgroundConfig) {
      // 根据背景设置初始属性加成
      if (backgroundConfig.attributeBonuses) {
        Object.entries(backgroundConfig.attributeBonuses).forEach(([attr, bonus]) => {
          this.attributes[attr] += bonus;
        });
      }
      
      if (backgroundConfig.startingItems) {
        this.items.push(...backgroundConfig.startingItems);
      }
      
      if (backgroundConfig.specialAbilities) {
        this.specialAbilities.push(...backgroundConfig.specialAbilities);
      }
    }
  }

  allocateAttributes(attributePoints) {
    const totalPoints = Object.values(attributePoints).reduce((sum, val) => sum + val, 0);
    if (totalPoints > 5) {
      throw new Error('属性点分配不能超过5点');
    }
    
    Object.entries(attributePoints).forEach(([attr, points]) => {
      if (this.attributes.hasOwnProperty(attr)) {
        this.attributes[attr] += points;
      }
    });
  }

  modifyAttribute(attribute, change) {
    if (this.attributes.hasOwnProperty(attribute)) {
      this.attributes[attribute] = Math.max(0, this.attributes[attribute] + change);
    }
  }

  addItem(item) {
    this.items.push({
      ...item,
      acquiredAt: new Date()
    });
  }

  removeItem(itemName) {
    const index = this.items.findIndex(item => item.name === itemName);
    if (index !== -1) {
      return this.items.splice(index, 1)[0];
    }
    return null;
  }

  updateRelationship(npcName, change) {
    const current = this.relationships.get(npcName) || 0;
    this.relationships.set(npcName, Math.max(-100, Math.min(100, current + change)));
  }

  addSecret(secret) {
    this.secrets.push({
      ...secret,
      discoveredAt: new Date()
    });
  }

  updateQuest(questId, progress) {
    const quest = this.quests.get(questId);
    if (quest) {
      quest.progress = progress;
      quest.updatedAt = new Date();
    } else {
      this.quests.set(questId, {
        id: questId,
        progress,
        startedAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  hasItem(itemName) {
    return this.items.some(item => item.name === itemName);
  }

  getAttributeTotal() {
    return Object.values(this.attributes).reduce((sum, val) => sum + val, 0);
  }

  getState() {
    return {
      name: this.name,
      playerId: this.playerId,
      background: this.background,
      attributes: this.attributes,
      items: this.items,
      reputation: this.reputation,
      health: this.health,
      relationships: Object.fromEntries(this.relationships),
      activeQuests: Object.fromEntries(this.quests),
      secretsKnown: this.secrets.length,
      specialAbilities: this.specialAbilities
    };
  }
}

module.exports = Character;