class GameHub {
    constructor() {
        this.currentGame = null;
        this.games = {
            tetris: {
                name: 'Tetris',
                description: 'Classic block-stacking puzzle game',
                status: 'available',
                icon: 'fas fa-th-large'
            },
            snake: {
                name: 'Snake',
                description: 'Navigate and grow your snake',
                status: 'available',
                icon: 'fas fa-snake'
            },
            '2048': {
                name: '2048',
                description: 'Merge tiles to reach 2048',
                status: 'available',
                icon: 'fas fa-cubes'
            },
            pong: {
                name: 'Pong',
                description: 'Classic paddle and ball game',
                status: 'available',
                icon: 'fas fa-table-tennis'
            },
            pacman: {
                name: 'Pac-Man',
                description: 'Classic maze navigation game',
                status: 'available',
                icon: 'fas fa-ghost'
            }
        };
        
        this.init();
    }

    init() {
        this.bindGameCardEvents();
        this.setupSearchFunctionality();
        this.setupBackButton();
        this.setupAdBanners();
        this.handleMobileOptimizations();
        this.setupGameControls();
    }

    bindGameCardEvents() {
        const gameCards = document.querySelectorAll('.game-card');
        
        gameCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const gameType = card.dataset.game;
                this.selectGame(gameType);
            });
        });
    }

    setupSearchFunctionality() {
        const searchInput = document.getElementById('gameSearch');
        const searchClear = document.getElementById('searchClear');
        const gameCards = document.querySelectorAll('.game-card');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase().trim();
                this.filterGames(searchTerm);
                
                // Show/hide clear button
                if (searchTerm.length > 0) {
                    searchClear.classList.add('visible');
                } else {
                    searchClear.classList.remove('visible');
                }
            });

            // Clear search
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                this.filterGames('');
                searchClear.classList.remove('visible');
                searchInput.focus();
            });

            // Handle Enter key
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const visibleCards = document.querySelectorAll('.game-card:not(.hidden)');
                    if (visibleCards.length === 1) {
                        const gameType = visibleCards[0].dataset.game;
                        this.selectGame(gameType);
                    }
                }
            });
        }
    }

    filterGames(searchTerm) {
        const gameCards = document.querySelectorAll('.game-card');
        
        gameCards.forEach(card => {
            const searchData = card.dataset.search.toLowerCase();
            const title = card.querySelector('.game-card-title').textContent.toLowerCase();
            const description = card.querySelector('.game-card-description').textContent.toLowerCase();
            
            const matches = searchData.includes(searchTerm) || 
                           title.includes(searchTerm) || 
                           description.includes(searchTerm);
            
            if (matches || searchTerm === '') {
                card.classList.remove('hidden');
                card.style.animation = 'fadeIn 0.3s ease-in';
            } else {
                card.classList.add('hidden');
            }
        });
    }

    setupBackButton() {
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showGameSelection();
            });
        }
    }

    selectGame(gameType) {
        if (!this.games[gameType] || this.games[gameType].status === 'coming-soon') {
            this.showComingSoonMessage(gameType);
            return;
        }

        this.currentGame = gameType;
        this.showGamePlay(gameType);
    }

    showGameSelection() {
        const gameSelection = document.getElementById('gameSelection');
        const gamePlay = document.getElementById('gamePlay');
        
        if (gameSelection && gamePlay) {
            gameSelection.style.display = 'block';
            gamePlay.style.display = 'none';
            
            // Clean up any running games
            this.cleanupGames();
        }
    }

    cleanupGames() {
        // Stop and clean up Tetris game
        if (window.tetrisGame) {
            window.tetrisGame.gameOver = true;
            window.tetrisGame.paused = true;
            // Stop the game loop by setting a flag
            window.tetrisGame.shouldStop = true;
            window.tetrisGame = null;
        }
        
        // Stop and clean up Snake game
        if (window.snakeGame) {
            window.snakeGame.gameOver = true;
            window.snakeGame.paused = true;
            // Stop the game loop by setting a flag
            window.snakeGame.shouldStop = true;
            window.snakeGame = null;
        }

        // Stop and clean up 2048 game
        if (window.game2048) {
            window.game2048.gameOver = true;
            window.game2048.paused = true;
            // Stop the game loop by setting a flag
            window.game2048.shouldStop = true;
            // Cancel animation frame if it exists
            if (window.game2048.animationId) {
                cancelAnimationFrame(window.game2048.animationId);
            }
            window.game2048 = null;
        }

        // Stop and clean up Pong game
        if (window.pongGame) {
            window.pongGame.gameOver = true;
            window.pongGame.paused = true;
            // Stop the game loop by setting a flag
            window.pongGame.shouldStop = true;
            // Cancel animation frame if it exists
            if (window.pongGame.animationId) {
                cancelAnimationFrame(window.pongGame.animationId);
            }
            window.pongGame = null;
        }

        // Stop and clean up Pac-Man game
        if (window.pacmanGame) {
            window.pacmanGame.gameOver = true;
            window.pacmanGame.paused = true;
            // Stop the game loop by setting a flag
            window.pacmanGame.shouldStop = true;
            // Cancel animation frame if it exists
            if (window.pacmanGame.animationId) {
                cancelAnimationFrame(window.pacmanGame.animationId);
            }
            window.pacmanGame = null;
        }

        // Clear the canvas completely
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Hide any game over overlays
        const overlay = document.getElementById('gameOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    showGamePlay(gameType) {
        const gameSelection = document.getElementById('gameSelection');
        const gamePlay = document.getElementById('gamePlay');
        const gameTitle = document.querySelector('.game-title');
        const tetrisControls = document.getElementById('tetrisControls');
        const tetrisControls2 = document.getElementById('tetrisControls2');
        const snakeControls = document.getElementById('snakeControls');
        const snakeControls2 = document.getElementById('snakeControls2');
        const snakeControls3 = document.getElementById('snakeControls3');
        const controls2048 = document.getElementById('controls2048');
        const controls2048_2 = document.getElementById('controls2048_2');
        const controls2048_3 = document.getElementById('controls2048_3');
        const pongControls = document.getElementById('pongControls');
        const pongControls2 = document.getElementById('pongControls2');
        const pongControls3 = document.getElementById('pongControls3');
        const highScoreStat = document.getElementById('highScoreStat');
        const bestScoreStat = document.getElementById('bestScoreStat');
        const levelStat = document.querySelector('.stat:nth-child(2)');
        const linesStat = document.querySelector('.stat:nth-child(3)');
        const canvas = document.getElementById('gameCanvas');

        if (gameSelection && gamePlay) {
            gameSelection.style.display = 'none';
            gamePlay.style.display = 'block';
        }

        // Clean up any existing games first
        this.cleanupGames();

        // Hide all controls first
        if (tetrisControls) tetrisControls.style.display = 'none';
        if (tetrisControls2) tetrisControls2.style.display = 'none';
        if (snakeControls) snakeControls.style.display = 'none';
        if (snakeControls2) snakeControls2.style.display = 'none';
        if (snakeControls3) snakeControls3.style.display = 'none';
        if (controls2048) controls2048.style.display = 'none';
        if (controls2048_2) controls2048_2.style.display = 'none';
        if (controls2048_3) controls2048_3.style.display = 'none';
        if (pongControls) pongControls.style.display = 'none';
        if (pongControls2) pongControls2.style.display = 'none';
        if (pongControls3) pongControls3.style.display = 'none';
        
        // Hide Pac-Man controls
        const pacmanControls = document.getElementById('pacmanControls');
        const pacmanControls2 = document.getElementById('pacmanControls2');
        const pacmanControls3 = document.getElementById('pacmanControls3');
        if (pacmanControls) pacmanControls.style.display = 'none';
        if (pacmanControls2) pacmanControls2.style.display = 'none';
        if (pacmanControls3) pacmanControls3.style.display = 'none';

        // Remove any existing placeholders
        const existingPlaceholder = document.querySelector('.game-placeholder');
        if (existingPlaceholder) {
            existingPlaceholder.remove();
        }

        if (canvas) {
            canvas.style.display = 'block';
            // Clear the canvas completely
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Set canvas background to match the game background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (gameType === 'tetris') {
            // Update title and show Tetris controls
            if (gameTitle) gameTitle.textContent = this.games[gameType].name;
            if (tetrisControls) tetrisControls.style.display = 'flex';
            if (tetrisControls2) tetrisControls2.style.display = 'flex';
            if (highScoreStat) highScoreStat.style.display = 'none';
            if (bestScoreStat) bestScoreStat.style.display = 'none';
            if (levelStat) levelStat.style.display = 'block';
            if (linesStat) linesStat.style.display = 'block';
            
            // Initialize Tetris
            if (canvas) {
                window.tetrisGame = new Tetris(canvas);
            }
        } else if (gameType === 'snake') {
            // Update title and show Snake controls
            if (gameTitle) gameTitle.textContent = this.games[gameType].name;
            if (snakeControls) snakeControls.style.display = 'flex';
            if (snakeControls2) snakeControls2.style.display = 'flex';
            if (snakeControls3) snakeControls3.style.display = 'flex';
            if (highScoreStat) highScoreStat.style.display = 'block';
            if (bestScoreStat) bestScoreStat.style.display = 'none';
            if (levelStat) levelStat.style.display = 'none';
            if (linesStat) linesStat.style.display = 'none';
            
            // Initialize Snake
            if (canvas) {
                window.snakeGame = new Snake(canvas);
            }
        } else if (gameType === '2048') {
            // Update title and show 2048 controls
            if (gameTitle) gameTitle.textContent = this.games[gameType].name;
            if (controls2048) controls2048.style.display = 'flex';
            if (controls2048_2) controls2048_2.style.display = 'flex';
            if (controls2048_3) controls2048_3.style.display = 'flex';
            if (highScoreStat) highScoreStat.style.display = 'none';
            if (bestScoreStat) bestScoreStat.style.display = 'block';
            if (levelStat) levelStat.style.display = 'none';
            if (linesStat) linesStat.style.display = 'none';
            
            // Initialize 2048
            if (canvas) {
                window.game2048 = new Game2048(canvas);
            }
        } else if (gameType === 'pong') {
            // Update title and show Pong controls
            if (gameTitle) gameTitle.textContent = this.games[gameType].name;
            if (pongControls) pongControls.style.display = 'flex';
            if (pongControls2) pongControls2.style.display = 'flex';
            if (pongControls3) pongControls3.style.display = 'flex';
            if (highScoreStat) highScoreStat.style.display = 'block';
            if (bestScoreStat) bestScoreStat.style.display = 'none';
            if (levelStat) levelStat.style.display = 'none';
            if (linesStat) linesStat.style.display = 'none';
            
            // Initialize Pong
            if (canvas) {
                window.pongGame = new Pong(canvas);
            }
        } else if (gameType === 'pacman') {
            // Update title and show Pac-Man controls
            if (gameTitle) gameTitle.textContent = this.games[gameType].name;
            if (pacmanControls) pacmanControls.style.display = 'flex';
            if (pacmanControls2) pacmanControls2.style.display = 'flex';
            if (pacmanControls3) pacmanControls3.style.display = 'flex';
            if (highScoreStat) highScoreStat.style.display = 'block';
            if (bestScoreStat) bestScoreStat.style.display = 'none';
            if (levelStat) levelStat.style.display = 'block';
            if (linesStat) linesStat.style.display = 'block';
            
            // Initialize Pac-Man
            if (canvas) {
                window.pacmanGame = new PacMan(canvas);
            }
        }
    }

    showComingSoonMessage(gameType) {
        const gameName = this.games[gameType]?.name || gameType;
        
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'notification notification-info';
        notification.innerHTML = `
            <i class="fas fa-clock"></i>
            <span>${gameName} will be available soon!</span>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    setupAdBanners() {
        // Simulate ad loading
        const adBanners = document.querySelectorAll('.ad-banner');
        
        adBanners.forEach((banner, index) => {
            // Add loading animation
            banner.classList.add('fade-in');
            
            // Simulate ad content loading
            setTimeout(() => {
                const placeholder = banner.querySelector('.ad-placeholder');
                if (placeholder) {
                    placeholder.innerHTML = `
                        <div class="ad-content">
                            <span>🎮 Ad Space ${index + 1}</span>
                            <small>Advertisement</small>
                        </div>
                    `;
                }
            }, 1000 + index * 500);
        });
    }

    handleMobileOptimizations() {
        // Check if device is mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Add mobile-specific classes
            document.body.classList.add('mobile-device');
            
            // Optimize touch targets
            const touchTargets = document.querySelectorAll('.control-btn, .game-card, .btn, .back-btn');
            touchTargets.forEach(target => {
                target.style.minHeight = '44px';
            });
            
            // Handle orientation change
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    if (window.tetrisGame) {
                        window.tetrisGame.updateCanvasSize();
                    }
                    if (window.snakeGame) {
                        window.snakeGame.updateCanvasSize();
                    }
                }, 100);
            });
        }
    }

    setupGameControls() {
        // Add keyboard shortcuts for game switching
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.selectGame('tetris');
                        break;
                    case '2':
                        e.preventDefault();
                        this.selectGame('snake');
                        break;
                    case '3':
                        e.preventDefault();
                        this.selectGame('2048');
                        break;
                    case '4':
                        e.preventDefault();
                        this.selectGame('pong');
                        break;
                }
            }
            
            // Escape key to go back to game selection
            if (e.key === 'Escape' && this.currentGame) {
                this.showGameSelection();
            }
        });

        // Add swipe gestures for mobile
        let startX = 0;
        let startY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Minimum swipe distance
            if (Math.abs(diffX) > 50 || Math.abs(diffY) > 50) {
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    // Horizontal swipe
                    if (diffX > 0) {
                        // Swipe left - next game
                        this.swipeToNextGame();
                    } else {
                        // Swipe right - previous game
                        this.swipeToPreviousGame();
                    }
                }
            }
            
            startX = 0;
            startY = 0;
        });
    }

    swipeToNextGame() {
        if (!this.currentGame) return;
        
        const gameOrder = ['tetris', 'snake', '2048', 'pong'];
        const currentIndex = gameOrder.indexOf(this.currentGame);
        const nextIndex = (currentIndex + 1) % gameOrder.length;
        this.selectGame(gameOrder[nextIndex]);
    }

    swipeToPreviousGame() {
        if (!this.currentGame) return;
        
        const gameOrder = ['tetris', 'snake', '2048', 'pong'];
        const currentIndex = gameOrder.indexOf(this.currentGame);
        const prevIndex = (currentIndex - 1 + gameOrder.length) % gameOrder.length;
        this.selectGame(gameOrder[prevIndex]);
    }

    // Utility methods
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    getGameStats() {
        if (this.currentGame === 'tetris' && window.tetrisGame) {
            return {
                score: window.tetrisGame.score,
                level: window.tetrisGame.level,
                lines: window.tetrisGame.lines
            };
        } else if (this.currentGame === 'snake' && window.snakeGame) {
            return {
                score: window.snakeGame.score,
                highScore: window.snakeGame.highScore
            };
        } else if (this.currentGame === '2048' && window.game2048) {
            return {
                score: window.game2048.score,
                bestScore: window.game2048.bestScore
            };
        } else if (this.currentGame === 'pong' && window.pongGame) {
            return {
                score: window.pongGame.score,
                highScore: window.pongGame.highScore
            };
        }
        return null;
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.gameHub = new GameHub();
    
    // Add some CSS for new components
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            max-width: 300px;
        }
        
        .notification-info {
            border-left: 4px solid #4ecdc4;
        }
        
        .notification-success {
            border-left: 4px solid #4ecdc4;
        }
        
        .notification-warning {
            border-left: 4px solid #ff8e0d;
        }
        
        .notification-error {
            border-left: 4px solid #ff6b6b;
        }
        
        .ad-content {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .ad-content small {
            opacity: 0.7;
            font-size: 0.8rem;
        }
        
        @media (max-width: 768px) {
            .notification {
                right: 10px;
                left: 10px;
                max-width: none;
            }
        }
    `;
    document.head.appendChild(style);
});
