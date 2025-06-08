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

    // 检查是否有其他玩家需要帮助或配合
    const needsCooperation = this.assessCooperationNeeds(gameState);
    if (needsCooperation) urgency += 0.4;

    // 检查是否应该支持其他玩家的行动
    const shouldSupport = this.shouldSupportOthers(gameState);
    if (shouldSupport) urgency += 0.5;

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
    // 检查是否应该配合其他玩家
    const cooperativeAction = this.tryGenerateCooperativeAction(gameState);
    if (cooperativeAction) {
      this.lastActionTime = Date.now();
      this.lastActionTurn = gameState.currentTurn;
      return cooperativeAction;
    }

    // 根据性格和当前状况生成行动
    const actionType = this.selectActionType(gameState);
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

  selectActionType(gameState) {
    // 根据性格偏好选择行动类型
    const preferences = this.personality.actionPreference.slice();
    
    // 根据当前情况调整行动偏好
    if (this.shouldPrioritizeTeamwork(gameState)) {
      preferences.unshift('social', 'dialogue');
    }

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

  // 新增：评估是否需要团队协作
  assessCooperationNeeds(gameState) {
    const recentNarrative = gameState.narrative.slice(-3);
    
    // 检查最近的叙述中是否提到了需要配合的情况
    const cooperationKeywords = [
      '配合', '协作', '合作', '一起', '共同', '协助', '支援',
      '团队', '联手', '齐心', '并肩', '互相', '分工'
    ];
    
    return recentNarrative.some(event => 
      cooperationKeywords.some(keyword => event.text.includes(keyword))
    );
  }

  // 新增：判断是否应该支持其他玩家
  shouldSupportOthers(gameState) {
    const recentActions = gameState.narrative.slice(-2);
    
    // 检查是否有其他玩家最近采取了行动，且我们可以协助
    return recentActions.some(event => {
      const text = event.text;
      // 检查是否有其他玩家的行动提及
      const hasOtherPlayerAction = gameState.players.some(player => 
        !player.isAI && player.name !== this.name && text.includes(player.name)
      );
      
      // 检查是否是可以协助的行动类型
      const isAssistableAction = [
        '探索', '调查', '观察', '寻找', '检查', '前往'
      ].some(actionWord => text.includes(actionWord));
      
      return hasOtherPlayerAction && isAssistableAction;
    });
  }

  // 新增：判断是否应该优先考虑团队合作
  shouldPrioritizeTeamwork(gameState) {
    // 检查团队状态
    const humanPlayers = gameState.players.filter(p => !p.isAI);
    const recentNarrative = gameState.narrative.slice(-2);
    
    // 如果最近的叙述中提到了危险或挑战，优先团队行动
    const dangerKeywords = ['危险', '威胁', '敌人', '陷阱', '困难', '挑战'];
    const hasDanger = recentNarrative.some(event => 
      dangerKeywords.some(keyword => event.text.includes(keyword))
    );
    
    // 如果有人类玩家最近行动了，倾向于配合
    const hasRecentHumanAction = recentNarrative.some(event => 
      humanPlayers.some(player => event.text.includes(player.name))
    );
    
    return hasDanger || hasRecentHumanAction;
  }

  // 新增：尝试生成协作性行动
  tryGenerateCooperativeAction(gameState) {
    const recentNarrative = gameState.narrative.slice(-2);
    const humanPlayers = gameState.players.filter(p => !p.isAI);
    
    // 查找最近的人类玩家行动
    let lastHumanAction = null;
    let lastHumanPlayer = null;
    
    for (let i = recentNarrative.length - 1; i >= 0; i--) {
      const event = recentNarrative[i];
      for (const player of humanPlayers) {
        if (event.text.includes(player.name + ':') || event.text.includes(player.name + '：')) {
          lastHumanAction = event.text;
          lastHumanPlayer = player;
          break;
        }
      }
      if (lastHumanAction) break;
    }
    
    if (!lastHumanAction || !lastHumanPlayer) {
      return null;
    }
    
    // 根据人类玩家的行动生成配合行动
    return this.generateSupportiveAction(lastHumanAction, lastHumanPlayer, gameState);
  }

  // 新增：生成支持性行动
  generateSupportiveAction(humanAction, humanPlayer, gameState) {
    const cooperativeActions = {
      '前往': {
        description: `${this.name}决定跟随${humanPlayer.name}，一起前往查看`,
        type: 'exploration',
        attribute: 'insight'
      },
      '观察': {
        description: `${this.name}协助${humanPlayer.name}观察，从不同角度寻找线索`,
        type: 'exploration', 
        attribute: 'insight'
      },
      '检查': {
        description: `${this.name}在${humanPlayer.name}检查的同时，留意周围的安全状况`,
        type: 'exploration',
        attribute: 'strategy'
      },
      '询问': {
        description: `${this.name}补充${humanPlayer.name}的询问，从另一个角度获取信息`,
        type: 'dialogue',
        attribute: 'eloquence'
      },
      '寻找': {
        description: `${this.name}配合${humanPlayer.name}的搜寻，扩大搜索范围`,
        type: 'exploration',
        attribute: 'insight'
      }
    };
    
    // 查找匹配的行动类型
    for (const [keyword, actionTemplate] of Object.entries(cooperativeActions)) {
      if (humanAction.includes(keyword)) {
        return {
          ...actionTemplate,
          difficulty: this.calculateDifficulty(actionTemplate.type) - 2, // 协作降低难度
          timeSpent: this.calculateTimeSpent(actionTemplate.type),
          isAI: true,
          isCooperative: true
        };
      }
    }
    
    // 默认的支持性行动
    return {
      description: `${this.name}观察${humanPlayer.name}的行动，准备提供必要的协助`,
      type: 'social',
      attribute: 'insight',
      difficulty: 10,
      timeSpent: 5,
      isAI: true,
      isCooperative: true
    };
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