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
    }

    setupSocketEvents() {
        this.socket.on('gameCreated', (data) => {
            this.currentGameId = data.gameId;
            this.showGameInterface();
            this.updateGameState(data.game);
            this.addNotification(`游戏创建成功！游戏ID: ${data.gameId}`);
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

        this.socket.emit('createGame', {
            scenario: this.selectedScenario
        });
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

    showGameInterface() {
        document.getElementById('gameSetup').classList.add('hidden');
        document.getElementById('gameInterface').classList.remove('hidden');
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

// 初始化游戏客户端
document.addEventListener('DOMContentLoaded', () => {
    gameClient = new GameClient();
});