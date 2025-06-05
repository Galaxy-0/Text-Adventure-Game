const axios = require('axios');

class LLMService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY;
    this.baseURL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.LLM_MODEL || 'gpt-3.5-turbo';
    this.useOpenRouter = process.env.LLM_BASE_URL?.includes('openrouter.ai');
  }

  async generateResponse(gameState, playerAction, isAIMaster = false) {
    const prompt = this.buildPrompt(gameState, playerAction, isAIMaster);
    
    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(gameState.scenario, isAIMaster)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: isAIMaster ? 400 : 500,
        temperature: isAIMaster ? 0.9 : 0.8
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(this.useOpenRouter && {
            'HTTP-Referer': 'https://github.com/anthropics/claude-code',
            'X-Title': 'Text Adventure Game'
          })
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('LLM服务错误:', error);
      return this.getFallbackResponse(playerAction);
    }
  }

  async generateAutonomousContent(gameState) {
    // AI Master自主生成内容，推进剧情
    const prompt = this.buildAutonomousPrompt(gameState);
    
    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(gameState.scenario, true)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.9
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(this.useOpenRouter && {
            'HTTP-Referer': 'https://github.com/anthropics/claude-code',
            'X-Title': 'Text Adventure Game'
          })
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI Master自主内容生成错误:', error);
      return '时间静静流逝，周围的环境似乎在等待着什么...';
    }
  }

  getSystemPrompt(scenario, isAIMaster = false) {
    const basePrompt = `你是一位经验丰富的D&D地城主，正在主持一场"${scenario}"背景的文字冒险游戏。`;
    
    if (isAIMaster) {
      return basePrompt + `

作为AI地城主，你需要：

**完全自主的游戏管理**：
1. 主动推进剧情发展，无需等待人类DM指令
2. 根据玩家行动动态调整故事走向
3. 创造突发事件和转折点
4. 管理NPC行为和对话
5. 控制游戏节奏和难度

**故事创作职责**：
1. 生成详细的场景描述和环境细节
2. 创造有趣的NPC角色和对话
3. 设计谜题、挑战和机遇
4. 根据玩家选择产生合理后果
5. 维持故事的连贯性和历史真实性

**互动管理**：
1. 为每个玩家（包括AI玩家）创造参与机会
2. 平衡不同角色的戏份和重要性
3. 鼓励玩家之间的互动与合作
4. 适时制造紧张感和戏剧冲突

**叙述风格**：
- 使用沉浸式的第二人称描述
- 富有感官细节的环境描绘
- 符合历史时期的语言风格
- 长度控制在150-250字，保持节奏感

记住：你是完全自主的AI地城主，要主动创造精彩的冒险体验。`;
    } else {
      return basePrompt + `

游戏规则：
1. 根据玩家行动生成生动的叙述和场景描述
2. 创造有意义的选择和后果
3. 保持历史背景的真实性
4. 鼓励创造性的问题解决方案
5. 平衡挑战和奖励
6. 为所有玩家创造参与机会

叙述风格：
- 使用第二人称("你"，"你们")
- 描述具体、富有感官细节
- 创造紧张感和悬念
- 保持历史时期的语言风格
- 长度控制在200-300字

请根据当前游戏状态和玩家行动，生成合适的叙述回应。`;
    }
  }

  buildPrompt(gameState, playerAction, isAIMaster = false) {
    const recentNarrative = gameState.narrative.slice(-5).map(n => n.text).join('\n');
    const players = gameState.players.map(p => {
      const aiIndicator = p.isAI ? '(AI)' : '';
      const personality = p.personality ? ` - ${p.personality}` : '';
      return `${p.name}${aiIndicator}(${p.background?.name || '未设定背景'})${personality} - 声望:${p.reputation}, 生命:${p.health}`;
    }).join(', ');

    if (isAIMaster) {
      return `当前游戏状态：
场景：${gameState.scenario}
玩家团队：${players}
当前回合：${gameState.currentTurn}
游戏时间：${gameState.gameTime}分钟

最近的故事发展：
${recentNarrative}

最新行动：${playerAction.description}
行动者：${playerAction.isAI ? 'AI角色' : '玩家角色'}
行动类型：${playerAction.type}
使用属性：${playerAction.attribute}

作为AI地城主，请：
1. 描述这个行动的结果和后果
2. 推进整体剧情发展
3. 创造新的情况或机遇
4. 为其他角色创造参与机会
5. 保持故事的紧张感和趣味性`;
    } else {
      return `当前游戏状态：
场景：${gameState.scenario}
玩家：${players}
当前回合：${gameState.currentTurn}
游戏时间：${gameState.gameTime}分钟

最近的叙述：
${recentNarrative}

玩家行动：${playerAction.description}
行动类型：${playerAction.type}
使用属性：${playerAction.attribute}
难度：${playerAction.difficulty || 10}

请基于以上信息生成地城主的叙述回应，描述行动的结果和环境的变化。`;
    }
  }

  buildAutonomousPrompt(gameState) {
    const recentNarrative = gameState.narrative.slice(-3).map(n => n.text).join('\n');
    const players = gameState.players.map(p => {
      const aiIndicator = p.isAI ? '(AI)' : '';
      return `${p.name}${aiIndicator} - 状态良好，等待行动`;
    }).join(', ');

    const timeSinceLastAction = Date.now() - (gameState.lastActionTime || 0);
    const shouldCreateEvent = timeSinceLastAction > 60000; // 1分钟无动作

    return `当前游戏状态：
场景：${gameState.scenario}
冒险团队：${players}
当前回合：${gameState.currentTurn}
游戏时间：${gameState.gameTime}分钟

最近发生的事：
${recentNarrative}

${shouldCreateEvent ? '游戏似乎需要新的转折点或事件来推进剧情。' : '请继续推进当前的情况。'}

作为AI地城主，请主动：
1. 创造一个新的情况、事件或转折点
2. 描述环境的变化或新发现
3. 引入NPC行动或对话
4. 为玩家提供新的选择机会
5. 保持历史背景的真实性

请生成150-200字的叙述内容。`;
  }

  getFallbackResponse(playerAction) {
    const fallbackResponses = [
      `你的${playerAction.description}引起了周围环境的注意...`,
      `随着行动的展开，情况变得更加复杂...`,
      `你的选择产生了意想不到的后果...`,
      `环境对你的行动做出了反应...`
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  async generateNPCDialogue(npc, context, playerMessage) {
    const prompt = `作为NPC "${npc.name}"(${npc.description})，在以下情境中回应玩家：
    
情境：${context}
玩家说话：${playerMessage}

请生成符合角色性格的回应，保持历史背景的真实性。回应长度控制在50-100字。`;

    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an NPC in a historical text adventure game. Respond in character.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.9
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('NPC对话生成错误:', error);
      return `${npc.name}沉思了一会儿，然后点了点头。`;
    }
  }
}

module.exports = LLMService;