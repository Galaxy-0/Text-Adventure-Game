const Character = require('./Character');

class AIPlayer extends Character {
  constructor(name, gameId) {
    super(name, `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    this.isAI = true;
    this.gameId = gameId;
    this.personality = this.generatePersonality();
    this.actionCooldown = 0;
    this.lastActionTime = 0;
  }

  generatePersonality() {
    const personalities = [
      {
        name: '谨慎保守',
        traits: ['careful', 'analytical', 'risk-averse'],
        actionPreference: ['dialogue', 'exploration', 'strategy'],
        decisionMaking: 'thorough'
      },
      {
        name: '积极进取',
        traits: ['bold', 'ambitious', 'confident'],
        actionPreference: ['strategy', 'social', 'combat'],
        decisionMaking: 'quick'
      },
      {
        name: '机智狡猾',
        traits: ['clever', 'manipulative', 'opportunistic'],
        actionPreference: ['strategy', 'dialogue', 'social'],
        decisionMaking: 'calculated'
      },
      {
        name: '学者气质',
        traits: ['intellectual', 'curious', 'methodical'],
        actionPreference: ['exploration', 'dialogue', 'strategy'],
        decisionMaking: 'research-based'
      }
    ];

    return personalities[Math.floor(Math.random() * personalities.length)];
  }

  autoSelectBackground() {
    const backgrounds = [
      { id: 'fallenNoble', name: '落魄贵族' },
      { id: 'scholar', name: '游学书生' },
      { id: 'formerAssassin', name: '前刺客' },
      { id: 'merchantSon', name: '商人之子' }
    ];

    const selected = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    this.setBackground(selected);
  }

  autoAllocateAttributes() {
    // 根据性格特征自动分配属性点
    const baseAttributes = { strategy: 1, eloquence: 1, knowledge: 1, insight: 1, connections: 1 };
    let remainingPoints = 0; // 5点已经分配完了

    // 根据性格调整属性倾向
    switch (this.personality.name) {
      case '谨慎保守':
        baseAttributes.insight += 1;
        baseAttributes.knowledge += 1;
        baseAttributes.strategy -= 1;
        baseAttributes.eloquence -= 1;
        break;
      case '积极进取':
        baseAttributes.eloquence += 1;
        baseAttributes.connections += 1;
        baseAttributes.insight -= 1;
        baseAttributes.knowledge -= 1;
        break;
      case '机智狡猾':
        baseAttributes.strategy += 1;
        baseAttributes.insight += 1;
        baseAttributes.knowledge -= 1;
        baseAttributes.connections -= 1;
        break;
      case '学者气质':
        baseAttributes.knowledge += 1;
        baseAttributes.eloquence += 1;
        baseAttributes.strategy -= 1;
        baseAttributes.connections -= 1;
        break;
    }

    // 确保所有属性都不小于0
    Object.keys(baseAttributes).forEach(attr => {
      if (baseAttributes[attr] < 0) baseAttributes[attr] = 0;
    });

    this.allocateAttributes(baseAttributes);
  }

  shouldTakeAction(gameState) {
    const now = Date.now();
    const timeSinceLastAction = now - this.lastActionTime;
    
    // AI玩家的行动频率控制（避免过于频繁）
    const minInterval = 15000 + Math.random() * 25000; // 15-40秒随机间隔
    
    if (timeSinceLastAction < minInterval) {
      return false;
    }

    // 根据游戏状态和性格决定是否行动
    const urgency = this.assessSituation(gameState);
    const personalityFactor = this.getPersonalityActionChance();
    
    return Math.random() < (urgency * personalityFactor);
  }

  assessSituation(gameState) {
    // 评估当前形势的紧急性
    let urgency = 0.3; // 基础行动概率

    // 如果很久没有行动，提高概率
    const turnsSinceLastAction = gameState.currentTurn - this.lastActionTurn || 0;
    if (turnsSinceLastAction > 3) urgency += 0.3;

    // 如果生命值较低，提高行动概率
    if (this.health < 50) urgency += 0.4;

    // 如果有重要事件发生，提高概率
    const recentNarrative = gameState.narrative.slice(-3);
    const hasImportantEvent = recentNarrative.some(event => 
      event.text.includes('危险') || 
      event.text.includes('机会') || 
      event.text.includes('发现')
    );
    if (hasImportantEvent) urgency += 0.3;

    return Math.min(urgency, 1.0);
  }

  getPersonalityActionChance() {
    switch (this.personality.decisionMaking) {
      case 'quick': return 0.8;
      case 'thorough': return 0.4;
      case 'calculated': return 0.6;
      case 'research-based': return 0.5;
      default: return 0.6;
    }
  }

  generateAction(gameState) {
    // 根据性格和当前状况生成行动
    const actionType = this.selectActionType();
    const attribute = this.selectAttribute(actionType);
    
    const action = {
      description: this.generateActionDescription(actionType, gameState),
      type: actionType,
      attribute: attribute,
      difficulty: this.calculateDifficulty(actionType),
      timeSpent: this.calculateTimeSpent(actionType),
      isAI: true
    };

    this.lastActionTime = Date.now();
    this.lastActionTurn = gameState.currentTurn;

    return action;
  }

  selectActionType() {
    // 根据性格偏好选择行动类型
    const preferences = this.personality.actionPreference;
    const weights = preferences.map((type, index) => preferences.length - index);
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < preferences.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return preferences[i];
      }
    }
    
    return preferences[0];
  }

  selectAttribute(actionType) {
    const attributeMap = {
      dialogue: ['eloquence', 'insight'],
      exploration: ['insight', 'knowledge'],
      strategy: ['strategy', 'knowledge'],
      combat: ['strategy', 'insight'],
      social: ['eloquence', 'connections']
    };

    const possibleAttributes = attributeMap[actionType] || ['insight'];
    
    // 选择当前数值最高的属性
    return possibleAttributes.reduce((best, attr) => 
      this.attributes[attr] > this.attributes[best] ? attr : best
    );
  }

  generateActionDescription(actionType, gameState) {
    const templates = {
      dialogue: [
        `${this.name}走向附近的NPC，试图了解更多信息`,
        `${this.name}观察周围的人群，寻找合适的交谈对象`,
        `${this.name}仔细倾听，然后加入了正在进行的对话`
      ],
      exploration: [
        `${this.name}仔细观察周围的环境，寻找线索`,
        `${this.name}向${this.getRandomDirection()}方向探索`,
        `${this.name}检查附近的建筑物和设施`
      ],
      strategy: [
        `${this.name}思考当前的局势，制定下一步计划`,
        `${this.name}分析各方势力的动向`,
        `${this.name}考虑如何利用现有的信息和资源`
      ],
      social: [
        `${this.name}尝试与其他团队成员建立更好的关系`,
        `${this.name}观察团队动态，寻找合作机会`,
        `${this.name}分享自己的见解和想法`
      ],
      combat: [
        `${this.name}警觉地评估潜在的威胁`,
        `${this.name}检查自己的装备状态`,
        `${this.name}观察可能的逃生路线`
      ]
    };

    const typeTemplates = templates[actionType] || templates.exploration;
    const template = typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
    
    return template;
  }

  getRandomDirection() {
    const directions = ['北', '南', '东', '西', '上', '下'];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  calculateDifficulty(actionType) {
    const baseDifficulties = {
      dialogue: 12,
      exploration: 14,
      strategy: 16,
      combat: 18,
      social: 10
    };
    
    return baseDifficulties[actionType] || 12;
  }

  calculateTimeSpent(actionType) {
    const baseTimes = {
      dialogue: 5,
      exploration: 15,
      strategy: 20,
      combat: 10,
      social: 10
    };
    
    return baseTimes[actionType] || 10;
  }

  getState() {
    const baseState = super.getState();
    return {
      ...baseState,
      isAI: true,
      personality: this.personality.name,
      traits: this.personality.traits
    };
  }
}

module.exports = AIPlayer;