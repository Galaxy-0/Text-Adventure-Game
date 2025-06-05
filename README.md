# 多人D&D文字冒险游戏 📜

基于大模型的历史题材多人文字角色扮演游戏，融合传统D&D机制与现代AI技术。

## 🎮 游戏特色

- **多人实时游戏**：支持最多4名玩家同时冒险
- **AI地城主**：大语言模型担任智能地城主，动态生成剧情
- **历史背景**：精心设计的历史场景，兼顾真实性与游戏性
- **角色成长**：5属性系统，4种背景选择，深度角色定制
- **开放选择**：每个行动都有实际影响，避免装饰性选项

## 📚 游戏场景

### 《谋士的博弈》- 三国时期
- **时代背景**：公元220年，三国初期的襄阳
- **角色定位**：年轻谋士，运用政治手段影响战局
- **核心机制**：政治阴谋、声望系统、情报交易
- **时间限制**：7天倒计时营造紧张感

### 《荣誉之刃》- 日本战国
- **时代背景**：1570年的城下町
- **角色定位**：失主浪人，寻求荣誉与生存的平衡
- **核心机制**：荣誉/实用主义双轴道德系统

## 🛠 技术架构

- **后端**：Node.js + Express + Socket.IO
- **前端**：原生HTML/CSS/JavaScript
- **AI集成**：支持OpenAI/Anthropic等多种LLM API
- **实时通信**：WebSocket实现多人同步游戏

## 🚀 快速开始

### 环境要求
- Node.js 16+
- npm或yarn包管理器

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd Text-Adventure-Game
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境**
   ```bash
   cp .env.example .env
   # 编辑.env文件，填入你的LLM API密钥
   ```

4. **启动服务器**
   ```bash
   npm start
   # 开发模式: npm run dev
   ```

5. **开始游戏**
   - 打开浏览器访问 `http://localhost:3000`
   - 创建游戏或加入现有游戏
   - 邀请朋友一起冒险！

## ⚙️ 配置说明

### 环境变量
```env
# LLM API配置
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-3.5-turbo

# 服务器配置
PORT=3000
NODE_ENV=development
```

### 支持的LLM服务
- **OpenAI GPT系列**：GPT-3.5, GPT-4等
- **Anthropic Claude系列**：Claude-3-Haiku, Claude-3-Sonnet等  
- **OpenRouter**：统一访问多种模型的平台
- **其他兼容OpenAI API格式的服务**

### OpenRouter配置示例
```env
# 使用OpenRouter访问多种模型
LLM_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_API_KEY=your_openrouter_api_key
LLM_MODEL=anthropic/claude-3-haiku
# 或者: openai/gpt-4, google/gemini-pro, meta-llama/llama-2-70b-chat
```

## 🎯 游戏机制

### 角色系统
- **属性**：战略、辩才、学识、洞察、人脉（共5点分配）
- **背景**：落魄贵族、游学书生、前刺客、商人之子
- **成长**：通过行动获得经验，提升属性和声望

### 行动系统
- **行动类型**：对话、探索、策略、战斗、社交
- **检定机制**：d20 + 属性 vs 难度值
- **时间系统**：每个行动消耗游戏时间

### 多人协作
- **实时同步**：所有玩家共享游戏状态
- **合作机制**：鼓励团队协作解决问题
- **个人选择**：每个玩家的决定都会影响故事走向

## 📁 项目结构

```
Text-Adventure-Game/
├── server.js              # 主服务器文件
├── package.json           # 项目配置和依赖
├── .env.example          # 环境变量模板
├── src/
│   ├── game/             # 游戏核心逻辑
│   │   ├── GameManager.js # 游戏管理器
│   │   ├── Game.js       # 游戏实例
│   │   └── Character.js  # 角色系统
│   ├── services/         # 外部服务
│   │   └── LLMService.js # LLM集成服务
│   └── data/             # 游戏数据
│       └── scenarios.js  # 场景定义
├── public/               # 前端资源
│   ├── index.html        # 主页面
│   └── game.js          # 客户端脚本
└── docs/
    └── CHANGELOG.md      # 版本更新记录
```

## 🤝 贡献指南

欢迎提交问题报告和功能建议！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🎖️ 致谢

- 灵感来源于经典D&D规则和现代文字冒险游戏
- 感谢所有开源社区的贡献者
