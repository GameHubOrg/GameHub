class Game2048 {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 4;
        this.tileSize = 80;
        this.padding = 10;
        this.grid = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('2048BestScore') || 0;
        this.gameOver = false;
        this.paused = false;
        this.shouldStop = false;
        this.moved = false;
        this.animations = [];
        this.animationId = null;
        this.lastTime = 0;
        
        // Updated colors to match game hub theme with better contrast
        this.colors = {
            0: 'rgba(255, 255, 255, 0.05)',
            2: '#4ecdc4',
            4: '#45b7aa',
            8: '#3da89b',
            16: '#34998c',
            32: '#2b8a7d',
            64: '#227b6e',
            128: '#196c5f',
            256: '#105d50',
            512: '#074e41',
            1024: '#003f32',
            2048: '#003023'
        };

        this.textColors = {
            0: '#ffffff',
            2: '#ffffff',
            4: '#ffffff',
            8: '#ffffff',
            16: '#ffffff',
            32: '#ffffff',
            64: '#ffffff',
            128: '#ffffff',
            256: '#ffffff',
            512: '#ffffff',
            1024: '#ffffff',
            2048: '#ffffff'
        };

        this.init();
    }

    init() {
        this.createGrid();
        this.addRandomTile();
        this.addRandomTile();
        this.updateCanvasSize();
        this.bindEvents();
        this.draw();
        this.startAnimationLoop();
    }

    createGrid() {
        this.grid = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = 0;
            }
        }
    }

    updateCanvasSize() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const maxWidth = Math.min(containerWidth - 40, 400);
        
        // Calculate tile size based on container width
        const availableSpace = maxWidth - (this.gridSize + 1) * this.padding;
        this.tileSize = availableSpace / this.gridSize;
        
        this.canvas.style.width = maxWidth + 'px';
        this.canvas.style.height = maxWidth + 'px';
        this.canvas.width = maxWidth;
        this.canvas.height = maxWidth;
    }

    addRandomTile() {
        const emptyCells = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
            
            // Add spawn animation
            this.addSpawnAnimation(randomCell.row, randomCell.col, this.grid[randomCell.row][randomCell.col]);
        }
    }

    addSpawnAnimation(row, col, value) {
        const x = this.getTileX(col);
        const y = this.getTileY(row);
        
        this.animations.push({
            type: 'spawn',
            x: x,
            y: y,
            value: value,
            scale: 0,
            alpha: 0,
            duration: 200,
            startTime: performance.now()
        });
    }

    getTileX(col) {
        const gridWidth = this.gridSize * this.tileSize + (this.gridSize - 1) * this.padding;
        const startX = (this.canvas.width - gridWidth) / 2;
        return startX + col * (this.tileSize + this.padding);
    }

    getTileY(row) {
        const gridHeight = this.gridSize * this.tileSize + (this.gridSize - 1) * this.padding;
        const startY = (this.canvas.height - gridHeight) / 2;
        return startY + row * (this.tileSize + this.padding);
    }

    move(direction) {
        if (this.gameOver || this.paused) return false;

        this.moved = false;
        let moved = false;

        switch (direction) {
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
        }

        if (moved) {
            this.addRandomTile();
            this.updateStats();
            this.checkGameOver();
        }

        return moved;
    }

    moveLeft() {
        let moved = false;
        for (let row = 0; row < this.gridSize; row++) {
            const newRow = this.mergeRow(this.grid[row]);
            if (JSON.stringify(newRow) !== JSON.stringify(this.grid[row])) {
                this.grid[row] = newRow;
                moved = true;
            }
        }
        return moved;
    }

    moveRight() {
        let moved = false;
        for (let row = 0; row < this.gridSize; row++) {
            const reversedRow = this.grid[row].slice().reverse();
            const mergedRow = this.mergeRow(reversedRow);
            const newRow = mergedRow.reverse();
            if (JSON.stringify(newRow) !== JSON.stringify(this.grid[row])) {
                this.grid[row] = newRow;
                moved = true;
            }
        }
        return moved;
    }

    moveUp() {
        let moved = false;
        for (let col = 0; col < this.gridSize; col++) {
            const column = [];
            for (let row = 0; row < this.gridSize; row++) {
                column.push(this.grid[row][col]);
            }
            const mergedColumn = this.mergeRow(column);
            if (JSON.stringify(mergedColumn) !== JSON.stringify(column)) {
                for (let row = 0; row < this.gridSize; row++) {
                    this.grid[row][col] = mergedColumn[row];
                }
                moved = true;
            }
        }
        return moved;
    }

    moveDown() {
        let moved = false;
        for (let col = 0; col < this.gridSize; col++) {
            const column = [];
            for (let row = 0; row < this.gridSize; row++) {
                column.push(this.grid[row][col]);
            }
            const reversedColumn = column.slice().reverse();
            const mergedColumn = this.mergeRow(reversedColumn);
            const newColumn = mergedColumn.reverse();
            if (JSON.stringify(newColumn) !== JSON.stringify(column)) {
                for (let row = 0; row < this.gridSize; row++) {
                    this.grid[row][col] = newColumn[row];
                }
                moved = true;
            }
        }
        return moved;
    }

    mergeRow(row) {
        // Remove zeros
        const filtered = row.filter(cell => cell !== 0);
        
        // Merge adjacent equal tiles
        for (let i = 0; i < filtered.length - 1; i++) {
            if (filtered[i] === filtered[i + 1]) {
                filtered[i] *= 2;
                this.score += filtered[i];
                filtered.splice(i + 1, 1);
            }
        }
        
        // Add zeros back
        while (filtered.length < this.gridSize) {
            filtered.push(0);
        }
        
        return filtered;
    }

    checkGameOver() {
        // Check if there are any empty cells
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) {
                    return;
                }
            }
        }

        // Check if any merges are possible
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const current = this.grid[row][col];
                
                // Check right neighbor
                if (col < this.gridSize - 1 && this.grid[row][col + 1] === current) {
                    return;
                }
                
                // Check bottom neighbor
                if (row < this.gridSize - 1 && this.grid[row + 1][col] === current) {
                    return;
                }
            }
        }

        this.gameOver = true;
    }

    draw() {
        // Clear canvas completely to prevent ghosting
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fill with game hub theme background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate grid position to center it
        const gridWidth = this.gridSize * this.tileSize + (this.gridSize - 1) * this.padding;
        const gridHeight = this.gridSize * this.tileSize + (this.gridSize - 1) * this.padding;
        const startX = (this.canvas.width - gridWidth) / 2;
        const startY = (this.canvas.height - gridHeight) / 2;

        // Draw grid
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const x = startX + col * (this.tileSize + this.padding);
                const y = startY + row * (this.tileSize + this.padding);
                const value = this.grid[row][col];
                
                this.drawTile(x, y, value);
            }
        }

        // Draw animations
        this.drawAnimations();
    }

    drawAnimations() {
        const currentTime = performance.now();
        
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const animation = this.animations[i];
            const elapsed = currentTime - animation.startTime;
            const progress = Math.min(elapsed / animation.duration, 1);
            
            if (animation.type === 'spawn') {
                const scale = this.easeOutBack(progress);
                const alpha = this.easeOutCubic(progress);
                
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                this.ctx.translate(animation.x + this.tileSize / 2, animation.y + this.tileSize / 2);
                this.ctx.scale(scale, scale);
                this.ctx.translate(-(animation.x + this.tileSize / 2), -(animation.y + this.tileSize / 2));
                
                this.drawTile(animation.x, animation.y, animation.value);
                this.ctx.restore();
            }
            
            if (progress >= 1) {
                this.animations.splice(i, 1);
            }
        }
    }

    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    drawTile(x, y, value) {
        const color = this.colors[value] || 'rgba(255, 255, 255, 0.05)';
        const textColor = this.textColors[value] || '#ffffff';
        
        // Draw tile background with rounded corners
        this.ctx.fillStyle = color;
        this.roundRect(x, y, this.tileSize, this.tileSize, 8);
        this.ctx.fill();
        
        // Add gradient overlay for depth
        if (value !== 0) {
            const gradient = this.ctx.createLinearGradient(x, y, x, y + this.tileSize);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
            this.ctx.fillStyle = gradient;
            this.roundRect(x, y, this.tileSize, this.tileSize, 8);
            this.ctx.fill();
        }
        
        // Draw tile border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.roundRect(x, y, this.tileSize, this.tileSize, 8);
        this.ctx.stroke();
        
        // Draw tile value
        if (value !== 0) {
            this.ctx.fillStyle = textColor;
            this.ctx.font = this.getFontSize(value);
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                value.toString(),
                x + this.tileSize / 2,
                y + this.tileSize / 2
            );
        }
    }

    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    getFontSize(value) {
        if (value < 100) return `bold ${Math.max(16, this.tileSize * 0.4)}px Arial`;
        if (value < 1000) return `bold ${Math.max(14, this.tileSize * 0.35)}px Arial`;
        return `bold ${Math.max(12, this.tileSize * 0.3)}px Arial`;
    }

    startAnimationLoop() {
        const animate = (currentTime) => {
            if (this.shouldStop) return;
            
            // Limit to 60fps for smooth animations
            if (currentTime - this.lastTime >= 16.67) { // ~60fps
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
                    e.preventDefault();
                    this.move('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.move('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.move('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.move('right');
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });

        // Touch controls
        document.getElementById('upBtn2048')?.addEventListener('click', () => {
            this.move('up');
        });

        document.getElementById('downBtn2048')?.addEventListener('click', () => {
            this.move('down');
        });

        document.getElementById('leftBtn2048')?.addEventListener('click', () => {
            this.move('left');
        });

        document.getElementById('rightBtn2048')?.addEventListener('click', () => {
            this.move('right');
        });

        document.getElementById('pauseBtn2048')?.addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('restartBtn2048')?.addEventListener('click', () => {
            this.restart();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateCanvasSize();
        });
    }

    togglePause() {
        this.paused = !this.paused;
        const pauseBtn = document.getElementById('pauseBtn2048');
        if (pauseBtn) {
            pauseBtn.textContent = this.paused ? 'Resume' : 'Pause';
        }
    }

    restart() {
        this.grid = [];
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        this.shouldStop = false;
        this.moved = false;
        this.animations = [];
        
        this.createGrid();
        this.addRandomTile();
        this.addRandomTile();
        this.updateStats();
        
        const overlay = document.getElementById('gameOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        const pauseBtn = document.getElementById('pauseBtn2048');
        if (pauseBtn) {
            pauseBtn.textContent = 'Pause';
        }
    }

    updateStats() {
        const scoreElement = document.getElementById('score');
        const bestScoreElement = document.getElementById('bestScore');
        
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('2048BestScore', this.bestScore);
        }
        
        if (bestScoreElement) {
            bestScoreElement.textContent = this.bestScore;
        }
    }
}
