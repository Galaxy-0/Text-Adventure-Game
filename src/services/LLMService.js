const axios = require('axios');

class LLMService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY;
    this.baseURL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.LLM_MODEL || 'gpt-3.5-turbo';
    this.useOpenRouter = process.env.LLM_BASE_URL?.includes('openrouter.ai');
  }

  async generateResponse(gameState, playerAction) {
    const prompt = this.buildPrompt(gameState, playerAction);
    
    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(gameState.scenario)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.8
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

  getSystemPrompt(scenario) {
    return `你是一位经验丰富的D&D地城主，正在主持一场"${scenario}"背景的文字冒险游戏。

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

  buildPrompt(gameState, playerAction) {
    const recentNarrative = gameState.narrative.slice(-5).map(n => n.text).join('\n');
    const players = gameState.players.map(p => 
      `${p.name}(${p.background?.name || '未设定背景'}) - 声望:${p.reputation}, 生命:${p.health}`
    ).join(', ');

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