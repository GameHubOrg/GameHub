class Snake {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 20;
        this.cols = 30;
        this.rows = 20;
        this.snake = [];
        this.food = null;
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameOver = false;
        this.paused = false;
        this.gameSpeed = 150;
        this.lastUpdate = 0;
        this.shouldStop = false;
        
        this.colors = {
            snake: '#4ecdc4',
            snakeHead: '#2e8b87',
            food: '#ff6b6b',
            background: 'rgba(0, 0, 0, 0.8)',
            grid: 'rgba(255, 255, 255, 0.1)'
        };

        this.init();
    }

    init() {
        this.createSnake();
        this.spawnFood();
        this.updateCanvasSize();
        this.bindEvents();
        this.gameLoop();
    }

    createSnake() {
        // Start with 3 segments in the middle
        const startX = Math.floor(this.cols / 2);
        const startY = Math.floor(this.rows / 2);
        
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        
        this.direction = 'right';
        this.nextDirection = 'right';
    }

    updateCanvasSize() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const maxWidth = Math.min(containerWidth - 40, 600);
        const scale = maxWidth / (this.cols * this.gridSize);
        
        this.canvas.style.width = maxWidth + 'px';
        this.canvas.style.height = (this.rows * this.gridSize * scale) + 'px';
        this.canvas.width = this.cols * this.gridSize;
        this.canvas.height = this.rows * this.gridSize;
    }

    spawnFood() {
        let foodX, foodY;
        do {
            foodX = Math.floor(Math.random() * this.cols);
            foodY = Math.floor(Math.random() * this.rows);
        } while (this.snake.some(segment => segment.x === foodX && segment.y === foodY));
        
        this.food = { x: foodX, y: foodY };
    }

    update() {
        if (this.gameOver || this.paused) return;

        // Update direction
        this.direction = this.nextDirection;

        // Get head position
        const head = { ...this.snake[0] };

        // Move head based on direction
        switch (this.direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
            this.gameOver = true;
            return;
        }

        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver = true;
            return;
        }

        // Add new head
        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.spawnFood();
            this.updateStats();
            
            // Increase speed every 50 points
            if (this.score % 50 === 0) {
                this.gameSpeed = Math.max(50, this.gameSpeed - 10);
            }
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Draw snake
        this.snake.forEach((segment, index) => {
            const color = index === 0 ? this.colors.snakeHead : this.colors.snake;
            this.drawSegment(segment.x, segment.y, color);
        });

        // Draw food
        if (this.food) {
            this.drawFood(this.food.x, this.food.y);
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let i = 0; i <= this.cols; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let i = 0; i <= this.rows; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }

    drawSegment(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.gridSize + 1,
            y * this.gridSize + 1,
            this.gridSize - 2,
            this.gridSize - 2
        );

        // Add highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(
            x * this.gridSize + 1,
            y * this.gridSize + 1,
            this.gridSize - 2,
            2
        );
        this.ctx.fillRect(
            x * this.gridSize + 1,
            y * this.gridSize + 1,
            2,
            this.gridSize - 2
        );
    }

    drawFood(x, y) {
        this.ctx.fillStyle = this.colors.food;
        this.ctx.beginPath();
        this.ctx.arc(
            x * this.gridSize + this.gridSize / 2,
            y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            2 * Math.PI
        );
        this.ctx.fill();

        // Add glow effect
        this.ctx.shadowColor = this.colors.food;
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    bindEvents() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    if (this.direction !== 'down') {
                        this.nextDirection = 'up';
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (this.direction !== 'up') {
                        this.nextDirection = 'down';
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (this.direction !== 'right') {
                        this.nextDirection = 'left';
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (this.direction !== 'left') {
                        this.nextDirection = 'right';
                    }
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });

        // Touch controls - using the correct button IDs
        document.getElementById('upBtn')?.addEventListener('click', () => {
            if (this.direction !== 'down') {
                this.nextDirection = 'up';
            }
        });

        document.getElementById('downBtn')?.addEventListener('click', () => {
            if (this.direction !== 'up') {
                this.nextDirection = 'down';
            }
        });

        document.getElementById('leftBtnSnake')?.addEventListener('click', () => {
            if (this.direction !== 'right') {
                this.nextDirection = 'left';
            }
        });

        document.getElementById('rightBtnSnake')?.addEventListener('click', () => {
            if (this.direction !== 'left') {
                this.nextDirection = 'right';
            }
        });

        document.getElementById('pauseBtnSnake')?.addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('restartBtn')?.addEventListener('click', () => {
            this.restart();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateCanvasSize();
        });
    }

    togglePause() {
        this.paused = !this.paused;
        const pauseBtn = document.getElementById('pauseBtnSnake');
        if (pauseBtn) {
            pauseBtn.textContent = this.paused ? 'Resume' : 'Pause';
        }
    }

    restart() {
        this.snake = [];
        this.food = null;
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        this.gameSpeed = 150;
        this.lastUpdate = 0;
        this.shouldStop = false;
        
        this.createSnake();
        this.spawnFood();
        this.updateStats();
        
        const overlay = document.getElementById('gameOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        const pauseBtn = document.getElementById('pauseBtnSnake');
        if (pauseBtn) {
            pauseBtn.textContent = 'Pause';
        }
    }

    updateStats() {
        const scoreElement = document.getElementById('score');
        const highScoreElement = document.getElementById('highScore');
        
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
        }
        
        if (highScoreElement) {
            highScoreElement.textContent = this.highScore;
        }
    }

    gameLoop(timestamp = 0) {
        // Check if we should stop the game loop
        if (this.shouldStop) {
            return;
        }

        if (!this.gameOver && !this.paused) {
            if (timestamp - this.lastUpdate > this.gameSpeed) {
                this.update();
                this.lastUpdate = timestamp;
            }
        }

        this.draw();

        if (this.gameOver) {
            const overlay = document.getElementById('gameOverlay');
            const finalScore = document.getElementById('finalScore');
            const overlayTitle = document.getElementById('overlayTitle');
            const overlayMessage = document.getElementById('overlayMessage');
            
            if (overlay && finalScore && overlayTitle && overlayMessage) {
                overlayTitle.textContent = 'Game Over';
                overlayMessage.textContent = `Your score: ${this.score}`;
                finalScore.textContent = this.score;
                overlay.classList.add('active');
            }
        }

        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
}
