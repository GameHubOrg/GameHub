class Pong {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Game state
        this.gameOver = false;
        this.paused = false;
        this.shouldStop = false;
        this.gameStarted = false;
        this.score = 0;
        this.highScore = localStorage.getItem('pongHighScore') || 0;
        
        // Responsive sizing
        this.baseWidth = 600;
        this.baseHeight = 400;
        this.scale = 1;
        
        // Paddles (will be scaled)
        this.paddleWidth = 15;
        this.paddleHeight = 80;
        this.paddleSpeed = 300; // pixels per second
        this.leftPaddle = {
            x: 20,
            y: this.height / 2 - this.paddleHeight / 2,
            dy: 0
        };
        this.rightPaddle = {
            x: this.width - 20 - this.paddleWidth,
            y: this.height / 2 - this.paddleHeight / 2,
            dy: 0
        };
        
        // Ball (will be scaled)
        this.ballSize = 10;
        this.ball = {
            x: this.width / 2,
            y: this.height / 2,
            dx: 0,
            dy: 0,
            speed: 250 // pixels per second
        };
        
        // AI difficulty
        this.aiDifficulty = 0.6;
        
        // Animation
        this.lastTime = 0;
        this.animationId = null;
        
        // Colors matching game hub theme
        this.colors = {
            background: 'rgba(0, 0, 0, 0.8)',
            paddle: '#4ecdc4',
            ball: '#ffffff',
            net: 'rgba(255, 255, 255, 0.2)',
            text: '#ffffff',
            overlay: 'rgba(0, 0, 0, 0.8)'
        };
        
        this.init();
    }
    
    init() {
        this.updateCanvasSize();
        this.bindEvents();
        this.startAnimationLoop();
    }
    
    updateCanvasSize() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = Math.min(window.innerHeight * 0.6, 400);
        
        // Calculate responsive dimensions
        const maxWidth = Math.min(containerWidth - 40, 600);
        const maxHeight = Math.min(containerHeight, 400);
        
        // Maintain aspect ratio
        const aspectRatio = this.baseWidth / this.baseHeight;
        let finalWidth = maxWidth;
        let finalHeight = maxWidth / aspectRatio;
        
        if (finalHeight > maxHeight) {
            finalHeight = maxHeight;
            finalWidth = maxHeight * aspectRatio;
        }
        
        this.canvas.style.width = finalWidth + 'px';
        this.canvas.style.height = finalHeight + 'px';
        this.canvas.width = finalWidth;
        this.canvas.height = finalHeight;
        
        this.width = finalWidth;
        this.height = finalHeight;
        this.scale = finalWidth / this.baseWidth;
        
        // Scale game elements
        this.paddleWidth = Math.round(15 * this.scale);
        this.paddleHeight = Math.round(80 * this.scale);
        this.ballSize = Math.round(10 * this.scale);
        this.paddleSpeed = 300 * this.scale;
        this.ball.speed = 250 * this.scale;
        
        // Update paddle positions
        this.leftPaddle.x = Math.round(20 * this.scale);
        this.leftPaddle.y = this.height / 2 - this.paddleHeight / 2;
        this.rightPaddle.x = this.width - Math.round(20 * this.scale) - this.paddleWidth;
        this.rightPaddle.y = this.height / 2 - this.paddleHeight / 2;
        
        // Reset ball
        this.resetBall();
    }
    
    resetBall() {
        this.ball.x = this.width / 2;
        this.ball.y = this.height / 2;
        this.ball.dx = 0;
        this.ball.dy = 0;
        this.gameStarted = false;
    }
    
    startGame() {
        if (!this.gameStarted && !this.gameOver) {
            this.gameStarted = true;
            // Start ball with random direction but consistent speed
            const angle = (Math.random() - 0.5) * Math.PI / 2; // -45 to 45 degrees
            const direction = Math.random() > 0.5 ? 1 : -1;
            this.ball.dx = Math.cos(angle) * this.ball.speed * direction;
            this.ball.dy = Math.sin(angle) * this.ball.speed;
        }
    }
    
    update(deltaTime) {
        if (this.gameOver || this.paused) return;
        
        // Convert deltaTime to seconds
        const dt = deltaTime / 1000;
        
        // Update paddles
        this.updatePaddles(dt);
        
        // Update ball only if game has started
        if (this.gameStarted) {
            this.updateBall(dt);
            this.updateAI(dt);
            this.checkCollisions();
            this.checkScoring();
        }
    }
    
    updatePaddles(dt) {
        // Left paddle (player)
        this.leftPaddle.y += this.leftPaddle.dy * dt;
        this.leftPaddle.y = Math.max(0, Math.min(this.height - this.paddleHeight, this.leftPaddle.y));
        
        // Right paddle (AI)
        this.rightPaddle.y += this.rightPaddle.dy * dt;
        this.rightPaddle.y = Math.max(0, Math.min(this.height - this.paddleHeight, this.rightPaddle.y));
    }
    
    updateBall(dt) {
        this.ball.x += this.ball.dx * dt;
        this.ball.y += this.ball.dy * dt;
        
        // Ball bounces off top and bottom
        if (this.ball.y <= 0 || this.ball.y >= this.height - this.ballSize) {
            this.ball.dy = -this.ball.dy;
            this.ball.y = Math.max(0, Math.min(this.height - this.ballSize, this.ball.y));
        }
    }
    
    updateAI(dt) {
        // Simple AI - follow the ball with some delay
        const paddleCenter = this.rightPaddle.y + this.paddleHeight / 2;
        const ballCenter = this.ball.y + this.ballSize / 2;
        const targetY = ballCenter - this.paddleHeight / 2;
        
        if (paddleCenter < ballCenter - 10) {
            this.rightPaddle.dy = this.paddleSpeed * this.aiDifficulty;
        } else if (paddleCenter > ballCenter + 10) {
            this.rightPaddle.dy = -this.paddleSpeed * this.aiDifficulty;
        } else {
            this.rightPaddle.dy = 0;
        }
    }
    
    checkCollisions() {
        // Left paddle collision
        if (this.ball.x <= this.leftPaddle.x + this.paddleWidth &&
            this.ball.x + this.ballSize >= this.leftPaddle.x &&
            this.ball.y <= this.leftPaddle.y + this.paddleHeight &&
            this.ball.y + this.ballSize >= this.leftPaddle.y) {
            
            this.ball.x = this.leftPaddle.x + this.paddleWidth;
            this.ball.dx = Math.abs(this.ball.dx);
            
            // Add some randomness to the bounce
            const hitPos = (this.ball.y - this.leftPaddle.y) / this.paddleHeight;
            this.ball.dy = (hitPos - 0.5) * this.ball.speed * 1.5;
        }
        
        // Right paddle collision
        if (this.ball.x + this.ballSize >= this.rightPaddle.x &&
            this.ball.x <= this.rightPaddle.x + this.paddleWidth &&
            this.ball.y <= this.rightPaddle.y + this.paddleHeight &&
            this.ball.y + this.ballSize >= this.rightPaddle.y) {
            
            this.ball.x = this.rightPaddle.x - this.ballSize;
            this.ball.dx = -Math.abs(this.ball.dx);
            
            // Add some randomness to the bounce
            const hitPos = (this.ball.y - this.rightPaddle.y) / this.paddleHeight;
            this.ball.dy = (hitPos - 0.5) * this.ball.speed * 1.5;
        }
    }
    
    checkScoring() {
        // Ball goes past left paddle (AI scores)
        if (this.ball.x <= 0) {
            this.gameOver = true;
            this.updateStats();
        }
        
        // Ball goes past right paddle (player scores)
        if (this.ball.x >= this.width) {
            this.score++;
            this.updateStats();
            this.resetBall();
            
            // Increase difficulty slightly
            this.aiDifficulty = Math.min(0.85, this.aiDifficulty + 0.02);
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw background
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw net
        this.drawNet();
        
        // Draw paddles
        this.drawPaddle(this.leftPaddle, this.colors.paddle);
        this.drawPaddle(this.rightPaddle, this.colors.paddle);
        
        // Draw ball
        this.drawBall();
        
        // Draw score
        this.drawScore();
        
        // Draw start screen if game hasn't started
        if (!this.gameStarted && !this.gameOver) {
            this.drawStartScreen();
        }
        
        // Draw game over screen
        if (this.gameOver) {
            this.drawGameOver();
        }
    }
    
    drawStartScreen() {
        // Semi-transparent overlay
        this.ctx.fillStyle = this.colors.overlay;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Start text
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `bold ${Math.round(24 * this.scale)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press SPACE or tap to start', this.width / 2, this.height / 2);
        
        this.ctx.font = `${Math.round(16 * this.scale)}px Arial`;
        this.ctx.fillText('Use Arrow Keys or WASD to move paddle', this.width / 2, this.height / 2 + 30 * this.scale);
    }
    
    drawNet() {
        this.ctx.strokeStyle = this.colors.net;
        this.ctx.lineWidth = Math.max(1, Math.round(2 * this.scale));
        this.ctx.setLineDash([Math.round(10 * this.scale), Math.round(10 * this.scale)]);
        
        const centerX = this.width / 2;
        for (let y = 0; y < this.height; y += Math.round(20 * this.scale)) {
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, y);
            this.ctx.lineTo(centerX, y + Math.round(10 * this.scale));
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }
    
    drawPaddle(paddle, color) {
        // Draw paddle with rounded corners effect
        this.ctx.fillStyle = color;
        this.ctx.fillRect(paddle.x, paddle.y, this.paddleWidth, this.paddleHeight);
        
        // Add highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(paddle.x, paddle.y, this.paddleWidth, Math.round(2 * this.scale));
    }
    
    drawBall() {
        this.ctx.fillStyle = this.colors.ball;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x + this.ballSize / 2, this.ball.y + this.ballSize / 2, this.ballSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawScore() {
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `bold ${Math.round(24 * this.scale)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.score.toString(), this.width / 2, Math.round(30 * this.scale));
    }
    
    drawGameOver() {
        // Semi-transparent overlay
        this.ctx.fillStyle = this.colors.overlay;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Game over text
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `bold ${Math.round(32 * this.scale)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.width / 2, this.height / 2 - Math.round(20 * this.scale));
        
        this.ctx.font = `${Math.round(18 * this.scale)}px Arial`;
        this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + Math.round(10 * this.scale));
        this.ctx.fillText(`High Score: ${this.highScore}`, this.width / 2, this.height / 2 + Math.round(35 * this.scale));
        
        this.ctx.font = `${Math.round(14 * this.scale)}px Arial`;
        this.ctx.fillText('Press Restart to play again', this.width / 2, this.height / 2 + Math.round(70 * this.scale));
    }
    
    startAnimationLoop() {
        const animate = (currentTime) => {
            if (this.shouldStop) return;
            
            const deltaTime = currentTime - this.lastTime;
            
            if (deltaTime >= 16.67) { // ~60fps
                this.update(deltaTime);
                this.draw();
                this.lastTime = currentTime;
            }
            
            this.animationId = requestAnimationFrame(animate);
        };
        this.animationId = requestAnimationFrame(animate);
    }
    
    bindEvents() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.leftPaddle.dy = -this.paddleSpeed;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    this.leftPaddle.dy = this.paddleSpeed;
                    break;
                case ' ':
                    e.preventDefault();
                    this.startGame();
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'ArrowDown':
                case 'w':
                case 'W':
                case 's':
                case 'S':
                    this.leftPaddle.dy = 0;
                    break;
            }
        });
        
        // Touch controls
        document.getElementById('upBtnPong')?.addEventListener('mousedown', () => {
            this.leftPaddle.dy = -this.paddleSpeed;
            if (!this.gameStarted) this.startGame();
        });
        
        document.getElementById('upBtnPong')?.addEventListener('mouseup', () => {
            this.leftPaddle.dy = 0;
        });
        
        document.getElementById('downBtnPong')?.addEventListener('mousedown', () => {
            this.leftPaddle.dy = this.paddleSpeed;
            if (!this.gameStarted) this.startGame();
        });
        
        document.getElementById('downBtnPong')?.addEventListener('mouseup', () => {
            this.leftPaddle.dy = 0;
        });
        
        document.getElementById('pauseBtnPong')?.addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('restartBtnPong')?.addEventListener('click', () => {
            this.restart();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateCanvasSize();
        });
    }
    
    togglePause() {
        this.paused = !this.paused;
        const pauseBtn = document.getElementById('pauseBtnPong');
        if (pauseBtn) {
            pauseBtn.textContent = this.paused ? 'Resume' : 'Pause';
        }
    }
    
    restart() {
        this.gameOver = false;
        this.paused = false;
        this.shouldStop = false;
        this.gameStarted = false;
        this.score = 0;
        this.aiDifficulty = 0.6;
        
        // Reset paddles
        this.leftPaddle.y = this.height / 2 - this.paddleHeight / 2;
        this.rightPaddle.y = this.height / 2 - this.paddleHeight / 2;
        this.leftPaddle.dy = 0;
        this.rightPaddle.dy = 0;
        
        // Reset ball
        this.resetBall();
        
        // Update stats
        this.updateStats();
        
        const pauseBtn = document.getElementById('pauseBtnPong');
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
            localStorage.setItem('pongHighScore', this.highScore);
        }
        
        if (highScoreElement) {
            highScoreElement.textContent = this.highScore;
        }
    }
}
