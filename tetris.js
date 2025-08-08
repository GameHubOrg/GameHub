class Tetris {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 30;
        this.cols = 10;
        this.rows = 20;
        this.grid = [];
        this.currentPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        this.dropTime = 0;
        this.dropInterval = 1000;
        this.shouldStop = false;
        
        this.colors = [
            null,
            '#FF0D72', // I
            '#0DC2FF', // J
            '#0DFF72', // L
            '#F538FF', // O
            '#FF8E0D', // S
            '#FFE138', // T
            '#3877FF'  // Z
        ];

        this.pieces = [
            // I piece
            [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            // J piece
            [
                [2, 0, 0],
                [2, 2, 2],
                [0, 0, 0]
            ],
            // L piece
            [
                [0, 0, 3],
                [3, 3, 3],
                [0, 0, 0]
            ],
            // O piece
            [
                [4, 4],
                [4, 4]
            ],
            // S piece
            [
                [0, 5, 5],
                [5, 5, 0],
                [0, 0, 0]
            ],
            // T piece
            [
                [0, 6, 0],
                [6, 6, 6],
                [0, 0, 0]
            ],
            // Z piece
            [
                [7, 7, 0],
                [0, 7, 7],
                [0, 0, 0]
            ]
        ];

        this.init();
    }

    init() {
        this.createGrid();
        this.spawnPiece();
        this.updateCanvasSize();
        this.bindEvents();
        this.gameLoop();
    }

    createGrid() {
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = 0;
            }
        }
    }

    updateCanvasSize() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const maxWidth = Math.min(containerWidth - 40, 300);
        const scale = maxWidth / (this.cols * this.gridSize);
        
        this.canvas.style.width = maxWidth + 'px';
        this.canvas.style.height = (this.rows * this.gridSize * scale) + 'px';
        this.canvas.width = this.cols * this.gridSize;
        this.canvas.height = this.rows * this.gridSize;
    }

    spawnPiece() {
        const pieceIndex = Math.floor(Math.random() * this.pieces.length);
        this.currentPiece = {
            shape: this.pieces[pieceIndex],
            x: Math.floor(this.cols / 2) - Math.floor(this.pieces[pieceIndex][0].length / 2),
            y: 0
        };

        if (this.checkCollision()) {
            this.gameOver = true;
        }
    }

    checkCollision() {
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const newX = this.currentPiece.x + col;
                    const newY = this.currentPiece.y + row;

                    if (newX < 0 || newX >= this.cols || newY >= this.rows) {
                        return true;
                    }

                    if (newY >= 0 && this.grid[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    mergePiece() {
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const newX = this.currentPiece.x + col;
                    const newY = this.currentPiece.y + row;
                    if (newY >= 0) {
                        this.grid[newY][newX] = this.currentPiece.shape[row][col];
                    }
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.grid[row].every(cell => cell !== 0)) {
                this.grid.splice(row, 1);
                this.grid.unshift(new Array(this.cols).fill(0));
                linesCleared++;
                row++;
            }
        }
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateStats();
        }
    }

    movePiece(dx, dy) {
        if (this.gameOver || this.paused) return;

        this.currentPiece.x += dx;
        this.currentPiece.y += dy;

        if (this.checkCollision()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
            
            if (dy > 0) {
                this.mergePiece();
                this.clearLines();
                this.spawnPiece();
            }
            return false;
        }
        return true;
    }

    rotatePiece() {
        if (this.gameOver || this.paused) return;

        const rotated = [];
        const shape = this.currentPiece.shape;
        const rows = shape.length;
        const cols = shape[0].length;

        for (let col = 0; col < cols; col++) {
            rotated[col] = [];
            for (let row = rows - 1; row >= 0; row--) {
                rotated[col][rows - 1 - row] = shape[row][col];
            }
        }

        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;

        if (this.checkCollision()) {
            this.currentPiece.shape = originalShape;
        }
    }

    dropPiece() {
        if (this.gameOver || this.paused) return;

        while (this.movePiece(0, 1)) {
            this.score += 1;
        }
        this.updateStats();
    }

    updateStats() {
        const scoreElement = document.getElementById('score');
        const levelElement = document.getElementById('level');
        const linesElement = document.getElementById('lines');
        
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
        if (levelElement) {
            levelElement.textContent = this.level;
        }
        if (linesElement) {
            linesElement.textContent = this.lines;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col]) {
                    this.drawBlock(col, row, this.grid[row][col]);
                }
            }
        }

        // Draw current piece
        if (this.currentPiece) {
            for (let row = 0; row < this.currentPiece.shape.length; row++) {
                for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                    if (this.currentPiece.shape[row][col]) {
                        this.drawBlock(
                            this.currentPiece.x + col,
                            this.currentPiece.y + row,
                            this.currentPiece.shape[row][col]
                        );
                    }
                }
            }
        }

        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.cols; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i <= this.rows; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }

    drawBlock(x, y, colorIndex) {
        const color = this.colors[colorIndex];
        if (!color) return;

        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
        
        // Add highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize, 2);
        this.ctx.fillRect(x * this.gridSize, y * this.gridSize, 2, this.gridSize);
        
        // Add shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x * this.gridSize + this.gridSize - 2, y * this.gridSize, 2, this.gridSize);
        this.ctx.fillRect(x * this.gridSize, y * this.gridSize + this.gridSize - 2, this.gridSize, 2);
    }

    bindEvents() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.movePiece(0, 1);
                    this.score += 1;
                    this.updateStats();
                    break;
                case 'ArrowUp':
                case ' ':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });

        // Touch controls
        document.getElementById('leftBtn')?.addEventListener('click', () => {
            this.movePiece(-1, 0);
        });

        document.getElementById('rightBtn')?.addEventListener('click', () => {
            this.movePiece(1, 0);
        });

        document.getElementById('rotateBtn')?.addEventListener('click', () => {
            this.rotatePiece();
        });

        document.getElementById('dropBtn')?.addEventListener('click', () => {
            this.dropPiece();
        });

        document.getElementById('pauseBtn')?.addEventListener('click', () => {
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
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.textContent = this.paused ? 'Resume' : 'Pause';
        }
    }

    restart() {
        this.grid = [];
        this.currentPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        this.dropTime = 0;
        this.dropInterval = 1000;
        this.shouldStop = false;
        
        this.createGrid();
        this.spawnPiece();
        this.updateStats();
        
        const overlay = document.getElementById('gameOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.textContent = 'Pause';
        }
    }

    gameLoop(timestamp = 0) {
        // Check if we should stop the game loop
        if (this.shouldStop) {
            return;
        }

        if (!this.gameOver && !this.paused) {
            if (timestamp - this.dropTime > this.dropInterval) {
                this.movePiece(0, 1);
                this.dropTime = timestamp;
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
