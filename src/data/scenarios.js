const scenarios = {
  threeKingdoms: {
    id: 'threeKingdoms',
    name: '谋士的博弈',
    period: '三国时期，公元220年',
    location: '襄阳',
    description: '汉朝覆灭后的三国初期，玩家扮演年轻谋士，在兵家必争之地襄阳寻求生存与发展。',
    timeLimit: 7, // 天数
    
    initialScene: {
      name: '襄阳城门',
      description: '夕阳西下，襄阳城墙在金光中显得威严壮观。城门口兵丁林立，商贾往来不绝。你作为一名年轻谋士，怀着满腔抱负来到这个兵家必争之地。',
      availableActions: ['观察城防', '与守门兵交谈', '前往客栈', '寻找当地名士']
    },

    backgrounds: [
      {
        id: 'fallenNoble',
        name: '落魄贵族',
        description: '出身名门但家道中落，拥有良好教育和人脉基础',
        attributeBonuses: { connections: 2, knowledge: 1 },
        startingItems: ['家族印章', '推荐信'],
        specialAbilities: ['贵族礼仪', '家族声望']
      },
      {
        id: 'scholar',
        name: '游学书生',
        description: '饱读诗书的学者，擅长分析和辩论',
        attributeBonuses: { knowledge: 2, eloquence: 1 },
        startingItems: ['古籍', '文房四宝'],
        specialAbilities: ['博学多才', '引经据典']
      },
      {
        id: 'formerAssassin',
        name: '前刺客',
        description: '曾经的江湖人士，现欲从良，拥有独特的信息网络',
        attributeBonuses: { insight: 2, strategy: 1 },
        startingItems: ['暗器', '江湖令牌'],
        specialAbilities: ['敏锐直觉', '暗中行动']
      },
      {
        id: 'merchantSon',
        name: '商人之子',
        description: '商贾家庭出身，善于计算和交易',
        attributeBonuses: { connections: 1, insight: 1, eloquence: 1 },
        startingItems: ['银两', '商路地图'],
        specialAbilities: ['商业头脑', '人情世故']
      }
    ],

    npcs: [
      {
        id: 'cityGuard',
        name: '城门守将',
        description: '经验丰富的老兵，对城内情况了如指掌',
        relationships: { suspicious: -10, respectful: 10 },
        secrets: ['魏国间谍活动', '粮草运输路线']
      },
      {
        id: 'innkeeper',
        name: '客栈老板',
        description: '消息灵通的本地人，经营着城中最大的客栈',
        relationships: { friendly: 5 },
        secrets: ['各方势力动向', '商路情报']
      }
    ],

    events: [
      {
        id: 'spyMeeting',
        name: '密会目击',
        description: '你无意中目击了魏国将领与蜀国间谍的秘密会面',
        triggers: ['nighttime', 'exploring'],
        choices: [
          {
            text: '立即举报获得当权者青睐',
            effects: { reputation: 10, connections: 5 },
            risks: ['树敌', '卷入政治斗争']
          },
          {
            text: '敲诈双方获取资源',
            effects: { wealth: 20, insight: 2 },
            risks: ['生命危险', '信任危机']
          },
          {
            text: '传递假情报操纵局势',
            effects: { strategy: 3, reputation: -5 },
            risks: ['计划败露', '多方追杀']
          },
          {
            text: '假装什么都没看到',
            effects: { safety: 10 },
            risks: ['错失机会']
          }
        ]
      }
    ],

    introText: '襄阳，这座历经战火的古城，如今成为三国争霸的关键棋子。作为一名心怀大志的谋士，你踏入了这个权谋与阴谋交织的世界。七日之内，一场决定性的大战即将来临。你的每一个选择，都将影响这片土地的命运...'
  },

  samuraiHonor: {
    id: 'samuraiHonor',
    name: '荣誉之刃',
    period: '日本战国，1570年',
    location: '某城下町',
    description: '前主君遭暗杀后，浪人抵达城下町，面对各方势力争夺控制权',
    
    backgrounds: [
      {
        id: 'masterlessRonin',
        name: '失主浪人',
        description: '武士道精神的践行者，虽失去主君但保持荣誉',
        attributeBonuses: { honor: 2, martialArts: 1 },
        startingItems: ['祖传刀', '主君遗物']
      }
    ],

    introText: '樱花飘落的季节，你踏入了这座被权力斗争撕裂的城下町。刀剑的寒光与政治的阴霾交织，荣誉与生存的天平摇摆不定...'
  }
};

module.exports = scenarios;