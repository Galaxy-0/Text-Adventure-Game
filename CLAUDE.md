# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start server**: `npm start` (production) or `npm run dev` (development with nodemon)
- **Run tests**: `npm test` (Jest test runner)
- **Install dependencies**: `npm install`

## Architecture Overview

This is a real-time multiplayer D&D-style text adventure game with advanced AI integration. The system supports both human and AI players, with an optional AI Dungeon Master.

### Core Components

**Server Architecture (server.js)**:
- Express.js web server with Socket.IO for real-time WebSocket communication
- All game events flow through socket handlers: `createGame`, `joinGame`, `createCharacter`, `playerAction`
- LLM integration happens automatically when `needsLLMResponse` is triggered

**Game Management (src/game/)**:
- `GameManager.js`: Central game registry, manages multiple concurrent games
- `Game.js`: Individual game instances with turn management and AI Master timer
- `Character.js`: Player character system with 5-attribute system (strategy, eloquence, knowledge, insight, connections)
- `AIPlayer.js`: Autonomous AI players with 4 distinct personalities and smart action timing

**LLM Integration (src/services/LLMService.js)**:
- Supports OpenAI, Anthropic, and OpenRouter APIs
- Dual prompting system: standard DM responses vs full AI Master mode
- AI Master can autonomously generate content and push narrative forward

### Key Game Mechanics

**Player System**:
- 1-4 human players + 0-4 AI players + human/AI Dungeon Master
- 5-point attribute allocation: strategy, eloquence, knowledge, insight, connections
- 4 character backgrounds with different bonuses and abilities
- d20 + attribute vs difficulty resolution system

**AI Player Behavior**:
- 4 personality types: cautious, ambitious, cunning, scholarly
- Time-aware action cooldowns (15-40 second intervals)
- Situation assessment determines action probability
- Personality influences action type preferences and attribute allocation

**Scenarios (src/data/scenarios.js)**:
- Pre-defined historical settings with NPCs, events, and backgrounds
- Current scenarios: Three Kingdoms period (谋士的博弈) and Samurai era (荣誉之刃)

### Environment Configuration

Required environment variables:
```bash
# LLM API (choose one)
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
OPENROUTER_API_KEY=your_key

# LLM Configuration
LLM_BASE_URL=https://api.openai.com/v1  # or OpenRouter/other
LLM_MODEL=gpt-3.5-turbo

# Server
PORT=3000
NODE_ENV=development
```

### AI Master vs Human DM

**AI Master Mode** (`dmMode: 'ai'`):
- Fully autonomous narrative generation
- 30-second timer for proactive content creation
- Enhanced prompting for story progression
- No human DM required

**Human DM Mode** (`dmMode: 'human'`):
- Traditional human Dungeon Master
- LLM provides narrative assistance only
- Human controls pacing and major decisions

### WebSocket Event Flow

1. `createGame` → Creates game instance with config (player count, AI count, DM mode)
2. `createCharacter` → Character creation with background and attribute allocation
3. `joinGame` → Adds players to existing games
4. `playerAction` → Processes action, rolls dice, triggers LLM response if needed
5. `gameUpdate` → Broadcasts game state changes to all players

The AI Master timer and AI player action timers run independently from human player actions, creating a dynamic, living game world.