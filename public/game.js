class GameClient {
    constructor() {
        this.socket = io();
        this.currentGameId = null;
        this.selectedScenario = null;
        this.setupEventListeners();
        this.setupSocketEvents();
    }

    setupEventListeners() {
        // 场景选择
        document.querySelectorAll('.scenario-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedScenario = card.dataset.scenario;
            });
        });

        // 游戏配置监听
        ['totalPlayers', 'aiPlayers', 'dmMode'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.updateConfigSummary());
            }
        });

        // 初始化配置摘要
        this.updateConfigSummary();
    }

    updateConfigSummary() {
        const totalPlayers = parseInt(document.getElementById('totalPlayers')?.value || 2);
        const aiPlayers = parseInt(document.getElementById('aiPlayers')?.value || 1);
        const dmMode = document.getElementById('dmMode')?.value || 'ai';
        
        // 验证AI玩家数量不能超过总数
        const aiSelect = document.getElementById('aiPlayers');
        if (aiPlayers >= totalPlayers) {
            // 自动调整AI玩家数量
            const maxAI = totalPlayers - 1;
            if (maxAI >= 0) {
                aiSelect.value = maxAI;
            }
        }

        const humanPlayers = totalPlayers - parseInt(aiSelect.value);
        const dmText = dmMode === 'ai' ? 'AI地城主' : '人类地城主';
        
        const summary = `配置：${totalPlayers}人游戏，${humanPlayers}个人类玩家，${aiSelect.value}个AI玩家，${dmText}`;
        
        const summaryElement = document.getElementById('configSummary');
        if (summaryElement) {
            summaryElement.textContent = summary;
        }

        // 更新AI选项的最大值
        const maxAIOptions = totalPlayers;
        while (aiSelect.options.length > maxAIOptions) {
            aiSelect.removeChild(aiSelect.lastElementChild);
        }
        while (aiSelect.options.length < maxAIOptions) {
            const option = document.createElement('option');
            option.value = aiSelect.options.length;
            option.textContent = `${aiSelect.options.length}个`;
            aiSelect.appendChild(option);
        }
    }

    setupSocketEvents() {
        this.socket.on('gameCreated', (data) => {
            this.currentGameId = data.gameId;
            this.showCharacterCreation();
            this.addNotification(`游戏创建成功！游戏ID: ${data.gameId}`);
        });

        this.socket.on('characterCreated', (gameState) => {
            this.showGameInterface();
            this.updateGameState(gameState);
        });

        this.socket.on('playerJoined', (gameState) => {
            this.updateGameState(gameState);
        });

        this.socket.on('gameUpdate', (gameState) => {
            this.updateGameState(gameState);
        });

        this.socket.on('error', (error) => {
            alert(`错误: ${error}`);
        });

        this.socket.on('disconnect', () => {
            this.addNotification('与服务器连接断开');
        });
    }

    showCreateGame() {
        document.getElementById('createGamePanel').classList.remove('hidden');
        document.getElementById('joinGamePanel').classList.add('hidden');
    }

    showJoinGame() {
        document.getElementById('joinGamePanel').classList.remove('hidden');
        document.getElementById('createGamePanel').classList.add('hidden');
    }

    createGame() {
        if (!this.selectedScenario) {
            alert('请选择一个游戏场景');
            return;
        }

        const gameConfig = {
            scenario: this.selectedScenario,
            totalPlayers: parseInt(document.getElementById('totalPlayers').value),
            aiPlayers: parseInt(document.getElementById('aiPlayers').value),
            dmMode: document.getElementById('dmMode').value
        };

        // 验证配置
        if (gameConfig.aiPlayers >= gameConfig.totalPlayers) {
            alert('AI玩家数量不能等于或超过总玩家数量');
            return;
        }

        this.socket.emit('createGame', gameConfig);
    }

    joinGame() {
        const gameId = document.getElementById('joinGameId').value.trim();
        const playerName = document.getElementById('joinPlayerName').value.trim();

        if (!gameId || !playerName) {
            alert('请填写游戏ID和角色名称');
            return;
        }

        this.currentGameId = gameId;
        this.socket.emit('joinGame', {
            gameId: gameId,
            playerName: playerName
        });
    }

    showCharacterCreation() {
        document.getElementById('gameSetup').classList.add('hidden');
        document.getElementById('characterCreation').classList.remove('hidden');
        this.loadBackgrounds();
        this.setupAttributeAllocation();
    }

    showGameInterface() {
        document.getElementById('gameSetup').classList.add('hidden');
        document.getElementById('characterCreation').classList.add('hidden');
        document.getElementById('gameInterface').classList.remove('hidden');
    }

    loadBackgrounds() {
        // 这里应该从服务器获取背景数据，暂时硬编码
        const backgrounds = [
            { id: 'fallenNoble', name: '落魄贵族', description: '出身名门但家道中落' },
            { id: 'scholar', name: '游学书生', description: '饱读诗书的学者' },
            { id: 'formerAssassin', name: '前刺客', description: '曾经的江湖人士' },
            { id: 'merchantSon', name: '商人之子', description: '商贾家庭出身' }
        ];

        const container = document.getElementById('backgroundSelection');
        container.innerHTML = '';

        backgrounds.forEach(bg => {
            const div = document.createElement('div');
            div.className = 'scenario-card';
            div.innerHTML = `<h4>${bg.name}</h4><p>${bg.description}</p>`;
            div.onclick = () => {
                document.querySelectorAll('#backgroundSelection .scenario-card').forEach(c => c.classList.remove('selected'));
                div.classList.add('selected');
                this.selectedBackground = bg;
            };
            container.appendChild(div);
        });
    }

    setupAttributeAllocation() {
        const inputs = ['strategy', 'eloquence', 'knowledge', 'insight', 'connections'];
        inputs.forEach(attr => {
            const input = document.getElementById(attr);
            input.addEventListener('input', () => this.updateRemainingPoints());
        });
        this.updateRemainingPoints();
    }

    updateRemainingPoints() {
        const inputs = ['strategy', 'eloquence', 'knowledge', 'insight', 'connections'];
        const total = inputs.reduce((sum, attr) => {
            return sum + parseInt(document.getElementById(attr).value || 0);
        }, 0);
        const remaining = 5 - total;
        document.getElementById('remainingPoints').textContent = remaining;
        
        // 禁用超出点数的输入
        inputs.forEach(attr => {
            const input = document.getElementById(attr);
            if (remaining < 0) {
                input.style.borderColor = 'red';
            } else {
                input.style.borderColor = '';
            }
        });
    }

    createCharacter() {
        const name = document.getElementById('characterName').value.trim();
        if (!name) {
            alert('请输入角色名称');
            return;
        }

        if (!this.selectedBackground) {
            alert('请选择角色背景');
            return;
        }

        const remaining = parseInt(document.getElementById('remainingPoints').textContent);
        if (remaining !== 0) {
            alert('请分配完所有属性点');
            return;
        }

        const attributes = {
            strategy: parseInt(document.getElementById('strategy').value),
            eloquence: parseInt(document.getElementById('eloquence').value),
            knowledge: parseInt(document.getElementById('knowledge').value),
            insight: parseInt(document.getElementById('insight').value),
            connections: parseInt(document.getElementById('connections').value)
        };

        this.socket.emit('createCharacter', {
            gameId: this.currentGameId,
            characterData: {
                name,
                background: this.selectedBackground,
                attributes
            }
        });
    }

    updateGameState(gameState) {
        this.updateNarrative(gameState.narrative);
        this.updatePlayers(gameState.players);
    }

    updateNarrative(narrative) {
        const container = document.getElementById('narrativeContent');
        container.innerHTML = '';

        narrative.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'narrative-entry';
            
            const timestamp = document.createElement('div');
            timestamp.className = 'narrative-timestamp';
            timestamp.textContent = `第${entry.turn}回合 - ${new Date(entry.timestamp).toLocaleTimeString()}`;
            
            const text = document.createElement('div');
            text.textContent = entry.text;
            
            div.appendChild(timestamp);
            div.appendChild(text);
            container.appendChild(div);
        });

        container.scrollTop = container.scrollHeight;
    }

    updatePlayers(players) {
        const container = document.getElementById('playersContent');
        container.innerHTML = '';

        players.forEach(player => {
            const div = document.createElement('div');
            div.className = 'player-card';
            
            const attributes = Object.entries(player.attributes)
                .map(([key, value]) => `${this.translateAttribute(key)}: ${value}`)
                .join(', ');

            div.innerHTML = `
                <div><strong>${player.name}</strong></div>
                <div>背景: ${player.background?.name || '未设定'}</div>
                <div>属性: ${attributes}</div>
                <div>声望: ${player.reputation} | 生命: ${player.health}</div>
                <div>物品: ${player.items.length}件</div>
            `;
            
            container.appendChild(div);
        });
    }

    translateAttribute(attr) {
        const translations = {
            strategy: '战略',
            eloquence: '辩才',
            knowledge: '学识',
            insight: '洞察',
            connections: '人脉'
        };
        return translations[attr] || attr;
    }

    submitAction() {
        const description = document.getElementById('actionDescription').value.trim();
        const type = document.getElementById('actionType').value;
        const attribute = document.getElementById('actionAttribute').value;

        if (!description) {
            alert('请输入行动描述');
            return;
        }

        const action = {
            description,
            type,
            attribute,
            difficulty: this.calculateDifficulty(type),
            timeSpent: this.calculateTimeSpent(type)
        };

        this.socket.emit('playerAction', {
            gameId: this.currentGameId,
            action
        });

        // 清空输入
        document.getElementById('actionDescription').value = '';
    }

    calculateDifficulty(actionType) {
        const difficulties = {
            dialogue: 12,
            exploration: 14,
            strategy: 16,
            combat: 18,
            social: 10
        };
        return difficulties[actionType] || 12;
    }

    calculateTimeSpent(actionType) {
        const timeSpent = {
            dialogue: 5,
            exploration: 15,
            strategy: 20,
            combat: 10,
            social: 10
        };
        return timeSpent[actionType] || 10;
    }

    addNotification(message) {
        const container = document.getElementById('narrativeContent');
        const div = document.createElement('div');
        div.className = 'narrative-entry';
        div.style.background = 'rgba(100, 80, 60, 0.6)';
        
        const timestamp = document.createElement('div');
        timestamp.className = 'narrative-timestamp';
        timestamp.textContent = `系统消息 - ${new Date().toLocaleTimeString()}`;
        
        const text = document.createElement('div');
        text.textContent = message;
        
        div.appendChild(timestamp);
        div.appendChild(text);
        container.appendChild(div);
        
        container.scrollTop = container.scrollHeight;
    }
}

// 全局函数供HTML调用
let gameClient;

function showCreateGame() {
    gameClient.showCreateGame();
}

function showJoinGame() {
    gameClient.showJoinGame();
}

function createGame() {
    gameClient.createGame();
}

function joinGame() {
    gameClient.joinGame();
}

function submitAction() {
    gameClient.submitAction();
}

function createCharacter() {
    gameClient.createCharacter();
}

// 初始化游戏客户端
document.addEventListener('DOMContentLoaded', () => {
    gameClient = new GameClient();
});