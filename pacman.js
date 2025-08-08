class PacMan {
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
        this.lives = 3;
        this.level = 1;
        this.highScore = localStorage.getItem('pacmanHighScore') || 0;
        
        // Responsive sizing - improved for mobile
        this.baseWidth = 800;
        this.baseHeight = 800;
        this.scale = 1;
        this.minGridSize = 12; // Minimum grid size for mobile
        
        // Game grid - optimized for better visibility
        this.gridSize = 20;
        this.cols = 28; // Reduced for better mobile experience
        this.rows = 31; // Classic Pac-Man proportions
        
        // Modern color scheme matching game hub theme
        this.colors = {
            background: 'rgba(0, 0, 0, 0.95)',
            wall: '#4ecdc4',
            dot: '#ff6b6b',
            powerPellet: '#ffff00',
            pacman: '#ffff00',
            ghost1: '#ff0000',    // Red - Blinky (aggressive)
            ghost2: '#ffb8ff',    // Pink - Pinky (ambush)
            ghost3: '#00ffff',    // Cyan - Inky (random)
            ghost4: '#ffb852',    // Orange - Clyde (scared)
            scared: '#0000ff',    // Blue when scared
            text: '#ffffff',
            overlay: 'rgba(0, 0, 0, 0.9)',
            fruit: '#ff8c00',     // Orange for fruit
            uiBackground: 'rgba(0, 0, 0, 0.8)',
            uiBorder: 'rgba(255, 255, 255, 0.2)'
        };
        
        // Game objects
        this.pacman = {
            x: 14,
            y: 23,
            direction: 'right',
            nextDirection: 'right',
            speed: 1.8, // Slightly slower for better control
            mouthAngle: 0,
            mouthOpen: true,
            invulnerable: false,
            invulnerableTimer: 0
        };
        
        // Enhanced ghosts with personality
        this.ghosts = [
            { 
                x: 13, y: 11, direction: 'left', speed: 1.4, color: 'ghost1', 
                mode: 'chase', scared: false, personality: 'aggressive',
                targetX: 0, targetY: 0, scatterTarget: { x: 26, y: 1 }
            },
            { 
                x: 14, y: 11, direction: 'up', speed: 1.2, color: 'ghost2', 
                mode: 'chase', scared: false, personality: 'ambush',
                targetX: 0, targetY: 0, scatterTarget: { x: 1, y: 1 }
            },
            { 
                x: 15, y: 11, direction: 'right', speed: 1.3, color: 'ghost3', 
                mode: 'chase', scared: false, personality: 'random',
                targetX: 0, targetY: 0, scatterTarget: { x: 26, y: 29 }
            },
            { 
                x: 16, y: 11, direction: 'down', speed: 1.1, color: 'ghost4', 
                mode: 'chase', scared: false, personality: 'scared',
                targetX: 0, targetY: 0, scatterTarget: { x: 1, y: 29 }
            }
        ];
        
        // Maze layout (1 = wall, 0 = path, 2 = dot, 3 = power pellet)
        this.maze = this.createMaze();
        this.dots = this.createDots();
        this.powerPellets = this.createPowerPellets();
        
        // Fruit bonus system
        this.fruit = null;
        this.fruitTimer = 0;
        this.fruitSpawnTime = 10; // Spawn fruit after 10 seconds
        this.fruitTypes = [
            { name: 'Cherry', points: 100, color: '#ff0000' },
            { name: 'Strawberry', points: 300, color: '#ff6b6b' },
            { name: 'Orange', points: 500, color: '#ff8c00' },
            { name: 'Apple', points: 700, color: '#ff0000' },
            { name: 'Melon', points: 1000, color: '#00ff00' },
            { name: 'Galaxian', points: 2000, color: '#00ffff' },
            { name: 'Bell', points: 3000, color: '#ffff00' },
            { name: 'Key', points: 5000, color: '#ff00ff' }
        ];
        
        // Animation
        this.lastTime = 0;
        this.animationId = null;
        this.ghostModeTimer = 0;
        this.scaredTimer = 0;
        this.fruitBlinkTimer = 0;
        
        // UI properties
        this.uiPanelHeight = 60; // Default UI panel height
        
        // Sound effects (using Web Audio API)
        this.audioContext = null;
        this.sounds = {};
        this.initAudio();
        
        this.init();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    createSounds() {
        // Pac-Man chomp sound
        this.sounds.chomp = this.createChompSound();
        // Ghost eaten sound
        this.sounds.ghostEaten = this.createGhostEatenSound();
        // Power pellet sound
        this.sounds.powerPellet = this.createPowerPelletSound();
        // Death sound
        this.sounds.death = this.createDeathSound();
    }
    
    createChompSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        return { oscillator, gainNode };
    }
    
    createGhostEatenSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        return { oscillator, gainNode };
    }
    
    createPowerPelletSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        return { oscillator, gainNode };
    }
    
    createDeathSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 1);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
        
        return { oscillator, gainNode };
    }
    
    playSound(soundName) {
        if (!this.audioContext || !this.sounds[soundName]) return;
        
        try {
            const sound = this.sounds[soundName];
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Copy the sound parameters
            oscillator.frequency.setValueAtTime(sound.oscillator.frequency.value, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(
                sound.oscillator.frequency.value * 0.5, 
                this.audioContext.currentTime + 0.1
            );
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (e) {
            console.log('Error playing sound:', e);
        }
    }
    
    init() {
        this.updateCanvasSize();
        this.bindEvents();
        this.startAnimationLoop();
        
        // Show loading state briefly
        this.showLoadingState();
    }
    
    showLoadingState() {
        // Create a loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'pacmanLoading';
        loadingOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            font-family: 'Orbitron', monospace;
            color: white;
            font-size: 1.2rem;
            font-weight: bold;
        `;
        loadingOverlay.innerHTML = `
            <div style="text-align: center;">
                <div style="margin-bottom: 1rem;">🎮</div>
                <div>Loading Pac-Man...</div>
            </div>
        `;
        
        this.canvas.parentElement.style.position = 'relative';
        this.canvas.parentElement.appendChild(loadingOverlay);
        
        // Remove loading state after a short delay
        setTimeout(() => {
            if (loadingOverlay.parentNode) {
                loadingOverlay.parentNode.removeChild(loadingOverlay);
            }
        }, 1500);
    }
    
    createMaze() {
        // Classic Pac-Man maze layout - optimized for mobile
        return [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,3,1,0,0,1,2,1,0,0,0,1,2,1,1,2,1,0,0,0,1,2,1,0,0,1,3,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1],
            [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
            [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,0,0,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,2,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,2,1],
            [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
            [1,3,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,3,1],
            [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
            [1,2,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,1,1],
            [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
    }
    
    createDots() {
        const dots = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.maze[row][col] === 2) {
                    dots.push({ x: col, y: row, collected: false });
                }
            }
        }
        return dots;
    }
    
    createPowerPellets() {
        const powerPellets = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.maze[row][col] === 3) {
                    powerPellets.push({ x: col, y: row, collected: false });
                }
            }
        }
        return powerPellets;
    }
    
    updateCanvasSize() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight || containerWidth;
        
        // Calculate optimal size for mobile and desktop
        let maxWidth, maxHeight;
        
        if (containerWidth <= 768) {
            // Mobile: use most of the available width, but ensure minimum grid size
            maxWidth = Math.min(containerWidth - 20, Math.max(containerWidth * 0.95, this.cols * this.minGridSize));
            maxHeight = Math.min(containerHeight - 20, maxWidth);
        } else {
            // Desktop: use a reasonable maximum size
            maxWidth = Math.min(containerWidth - 40, 800);
            maxHeight = maxWidth;
        }
        
        // Ensure the canvas maintains aspect ratio
        const aspectRatio = this.cols / this.rows;
        if (maxHeight * aspectRatio < maxWidth) {
            maxWidth = maxHeight * aspectRatio;
        } else {
            maxHeight = maxWidth / aspectRatio;
        }
        
        // Set canvas size
        this.canvas.style.width = maxWidth + 'px';
        this.canvas.style.height = maxHeight + 'px';
        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;
        
        this.width = maxWidth;
        this.height = maxHeight;
        this.scale = maxWidth / this.baseWidth;
        this.gridSize = maxWidth / this.cols;
        
        // Ensure minimum grid size for playability
        if (this.gridSize < this.minGridSize) {
            this.gridSize = this.minGridSize;
            const newWidth = this.cols * this.gridSize;
            const newHeight = this.rows * this.gridSize;
            
            this.canvas.style.width = newWidth + 'px';
            this.canvas.style.height = newHeight + 'px';
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
            
            this.width = newWidth;
            this.height = newHeight;
            this.scale = newWidth / this.baseWidth;
        }
        
        // Update UI positioning for mobile
        this.updateUIPositioning();
    }
    
    updateUIPositioning() {
        // Adjust UI positioning for mobile devices
        if (this.width <= 400) {
            // Mobile: reduce UI panel height
            this.uiPanelHeight = 40;
        } else {
            // Desktop: standard UI panel height
            this.uiPanelHeight = 60;
        }
    }
    
    update(deltaTime) {
        if (this.gameOver || this.paused) return;
        
        const dt = deltaTime / 1000;
        
        // Update timers
        this.ghostModeTimer += dt;
        this.fruitTimer += dt;
        this.fruitBlinkTimer += dt;
        
        if (this.scaredTimer > 0) {
            this.scaredTimer -= dt;
            if (this.scaredTimer <= 0) {
                this.setGhostsNormal();
            }
        }
        
        // Handle Pac-Man invulnerability
        if (this.pacman.invulnerable) {
            this.pacman.invulnerableTimer -= dt;
            if (this.pacman.invulnerableTimer <= 0) {
                this.pacman.invulnerable = false;
            }
        }
        
        // Spawn fruit
        if (this.fruitTimer >= this.fruitSpawnTime && !this.fruit) {
            this.spawnFruit();
        }
        
        // Remove fruit after 10 seconds
        if (this.fruit && this.fruitTimer >= this.fruitSpawnTime + 10) {
            this.fruit = null;
        }
        
        // Change ghost mode every 10 seconds
        if (this.ghostModeTimer >= 10) {
            this.ghostModeTimer = 0;
            this.toggleGhostMode();
        }
        
        // Update Pac-Man
        this.updatePacman(dt);
        
        // Update ghosts
        this.updateGhosts(dt);
        
        // Check collisions
        this.checkCollisions();
        
        // Check win condition
        this.checkWinCondition();
    }
    
    updatePacman(dt) {
        // Update mouth animation
        this.pacman.mouthAngle += 0.3;
        if (this.pacman.mouthAngle >= Math.PI) {
            this.pacman.mouthAngle = 0;
            this.pacman.mouthOpen = !this.pacman.mouthOpen;
        }
        
        // Try to change direction
        if (this.canMove(this.pacman.x, this.pacman.y, this.pacman.nextDirection)) {
            this.pacman.direction = this.pacman.nextDirection;
        }
        
        // Move in current direction
        if (this.canMove(this.pacman.x, this.pacman.y, this.pacman.direction)) {
            const speed = this.pacman.speed * dt;
            switch (this.pacman.direction) {
                case 'up':
                    this.pacman.y -= speed;
                    break;
                case 'down':
                    this.pacman.y += speed;
                    break;
                case 'left':
                    this.pacman.x -= speed;
                    break;
                case 'right':
                    this.pacman.x += speed;
                    break;
            }
        }
        
        // Wrap around edges
        if (this.pacman.x < 0) this.pacman.x = this.cols - 1;
        if (this.pacman.x >= this.cols) this.pacman.x = 0;
        
        // Collect dots
        this.collectDots();
    }
    
    updateGhosts(dt) {
        this.ghosts.forEach(ghost => {
            // Simple AI: move towards Pac-Man or randomly
            if (ghost.mode === 'chase' && !ghost.scared) {
                this.moveGhostTowardsPacman(ghost, dt);
            } else {
                this.moveGhostRandomly(ghost, dt);
            }
            
            // Wrap around edges
            if (ghost.x < 0) ghost.x = this.cols - 1;
            if (ghost.x >= this.cols) ghost.x = 0;
        });
    }
    
    moveGhostTowardsPacman(ghost, dt) {
        const speed = ghost.speed * dt;
        
        // Calculate target based on ghost personality
        if (ghost.mode === 'scatter') {
            ghost.targetX = ghost.scatterTarget.x;
            ghost.targetY = ghost.scatterTarget.y;
        } else {
            switch (ghost.personality) {
                case 'aggressive': // Blinky - directly targets Pac-Man
                    ghost.targetX = this.pacman.x;
                    ghost.targetY = this.pacman.y;
                    break;
                case 'ambush': // Pinky - tries to ambush by targeting ahead of Pac-Man
                    const aheadX = this.pacman.x + (this.pacman.direction === 'right' ? 4 : 
                                                   this.pacman.direction === 'left' ? -4 : 0);
                    const aheadY = this.pacman.y + (this.pacman.direction === 'up' ? -4 : 
                                                   this.pacman.direction === 'down' ? 4 : 0);
                    ghost.targetX = aheadX;
                    ghost.targetY = aheadY;
                    break;
                case 'random': // Inky - random movement with slight bias towards Pac-Man
                    if (Math.random() < 0.7) {
                        ghost.targetX = this.pacman.x + (Math.random() - 0.5) * 6;
                        ghost.targetY = this.pacman.y + (Math.random() - 0.5) * 6;
                    } else {
                        ghost.targetX = Math.random() * this.cols;
                        ghost.targetY = Math.random() * this.rows;
                    }
                    break;
                case 'scared': // Clyde - runs away when close, chases when far
                    const distance = Math.sqrt((this.pacman.x - ghost.x) ** 2 + (this.pacman.y - ghost.y) ** 2);
                    if (distance < 8) {
                        ghost.targetX = ghost.scatterTarget.x;
                        ghost.targetY = ghost.scatterTarget.y;
                    } else {
                        ghost.targetX = this.pacman.x;
                        ghost.targetY = this.pacman.y;
                    }
                    break;
            }
        }
        
        const dx = ghost.targetX - ghost.x;
        const dy = ghost.targetY - ghost.y;
        
        // Improved pathfinding: try to move in the direction of target
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0 && this.canMove(ghost.x, ghost.y, 'right')) {
                ghost.x += speed;
                ghost.direction = 'right';
            } else if (dx < 0 && this.canMove(ghost.x, ghost.y, 'left')) {
                ghost.x -= speed;
                ghost.direction = 'left';
            } else if (dy > 0 && this.canMove(ghost.x, ghost.y, 'down')) {
                ghost.y += speed;
                ghost.direction = 'down';
            } else if (dy < 0 && this.canMove(ghost.x, ghost.y, 'up')) {
                ghost.y -= speed;
                ghost.direction = 'up';
            }
        } else {
            if (dy > 0 && this.canMove(ghost.x, ghost.y, 'down')) {
                ghost.y += speed;
                ghost.direction = 'down';
            } else if (dy < 0 && this.canMove(ghost.x, ghost.y, 'up')) {
                ghost.y -= speed;
                ghost.direction = 'up';
            } else if (dx > 0 && this.canMove(ghost.x, ghost.y, 'right')) {
                ghost.x += speed;
                ghost.direction = 'right';
            } else if (dx < 0 && this.canMove(ghost.x, ghost.y, 'left')) {
                ghost.x -= speed;
                ghost.direction = 'left';
            }
        }
    }
    
    moveGhostRandomly(ghost, dt) {
        const speed = ghost.speed * dt;
        
        // Randomly change direction
        if (Math.random() < 0.02) {
            const directions = ['up', 'down', 'left', 'right'];
            ghost.direction = directions[Math.floor(Math.random() * directions.length)];
        }
        
        // Try to move in current direction
        if (this.canMove(ghost.x, ghost.y, ghost.direction)) {
            switch (ghost.direction) {
                case 'up':
                    ghost.y -= speed;
                    break;
                case 'down':
                    ghost.y += speed;
                    break;
                case 'left':
                    ghost.x -= speed;
                    break;
                case 'right':
                    ghost.x += speed;
                    break;
            }
        } else {
            // If can't move, pick a random direction
            const directions = ['up', 'down', 'left', 'right'];
            ghost.direction = directions[Math.floor(Math.random() * directions.length)];
        }
    }
    
    canMove(x, y, direction) {
        let newX = x;
        let newY = y;
        
        switch (direction) {
            case 'up':
                newY = Math.floor(y - 1);
                break;
            case 'down':
                newY = Math.floor(y + 1);
                break;
            case 'left':
                newX = Math.floor(x - 1);
                break;
            case 'right':
                newX = Math.floor(x + 1);
                break;
        }
        
        // Check bounds
        if (newX < 0 || newX >= this.cols || newY < 0 || newY >= this.rows) {
            return false;
        }
        
        // Check if it's a wall
        return this.maze[newY][newX] !== 1;
    }
    
    spawnFruit() {
        // Find a suitable location for fruit (center of maze)
        const centerX = Math.floor(this.cols / 2);
        const centerY = Math.floor(this.rows / 2);
        
        // Choose fruit type based on level
        const fruitIndex = Math.min(Math.floor(this.level / 2), this.fruitTypes.length - 1);
        const fruitType = this.fruitTypes[fruitIndex];
        
        this.fruit = {
            x: centerX,
            y: centerY,
            type: fruitType,
            collected: false,
            blinkTimer: 0
        };
    }
    
    collectDots() {
        const pacmanGridX = Math.floor(this.pacman.x);
        const pacmanGridY = Math.floor(this.pacman.y);
        
        // Collect regular dots
        this.dots.forEach(dot => {
            if (!dot.collected && dot.x === pacmanGridX && dot.y === pacmanGridY) {
                dot.collected = true;
                this.score += 10;
                this.playSound('chomp');
                this.updateStats();
            }
        });
        
        // Collect power pellets
        this.powerPellets.forEach(pellet => {
            if (!pellet.collected && pellet.x === pacmanGridX && pellet.y === pacmanGridY) {
                pellet.collected = true;
                this.score += 50;
                this.scaredTimer = 10; // 10 seconds of scared ghosts
                this.setGhostsScared();
                this.playSound('powerPellet');
                this.updateStats();
            }
        });
        
        // Collect fruit
        if (this.fruit && !this.fruit.collected && 
            Math.abs(this.fruit.x - pacmanGridX) < 1 && 
            Math.abs(this.fruit.y - pacmanGridY) < 1) {
            this.fruit.collected = true;
            this.score += this.fruit.type.points;
            this.playSound('ghostEaten'); // Use ghost eaten sound for fruit
            this.updateStats();
            this.fruit = null;
        }
    }
    
    setGhostsScared() {
        this.ghosts.forEach(ghost => {
            ghost.scared = true;
        });
    }
    
    setGhostsNormal() {
        this.ghosts.forEach(ghost => {
            ghost.scared = false;
        });
    }
    
    toggleGhostMode() {
        this.ghosts.forEach(ghost => {
            if (!ghost.scared) {
                ghost.mode = ghost.mode === 'chase' ? 'scatter' : 'chase';
            }
        });
    }
    
    checkCollisions() {
        if (this.pacman.invulnerable) return;
        
        const pacmanGridX = Math.floor(this.pacman.x);
        const pacmanGridY = Math.floor(this.pacman.y);
        
        this.ghosts.forEach(ghost => {
            const ghostGridX = Math.floor(ghost.x);
            const ghostGridY = Math.floor(ghost.y);
            
            if (pacmanGridX === ghostGridX && pacmanGridY === ghostGridY) {
                if (ghost.scared) {
                    // Eat ghost
                    this.score += 200;
                    this.playSound('ghostEaten');
                    this.updateStats();
                    // Reset ghost to starting position
                    ghost.x = 14 + Math.random() * 4;
                    ghost.y = 11;
                    ghost.scared = false;
                } else {
                    // Lose life
                    this.lives--;
                    this.playSound('death');
                    this.updateStats();
                    if (this.lives <= 0) {
                        this.gameOver = true;
                    } else {
                        this.resetPositions();
                        // Make Pac-Man temporarily invulnerable
                        this.pacman.invulnerable = true;
                        this.pacman.invulnerableTimer = 3; // 3 seconds of invulnerability
                    }
                }
            }
        });
    }
    
    checkWinCondition() {
        const remainingDots = this.dots.filter(dot => !dot.collected).length;
        const remainingPowerPellets = this.powerPellets.filter(pellet => !pellet.collected).length;
        
        if (remainingDots === 0 && remainingPowerPellets === 0) {
            this.level++;
            this.score += 1000; // Level completion bonus
            this.updateStats();
            this.nextLevel();
        }
    }
    
    nextLevel() {
        // Increase difficulty
        this.ghosts.forEach(ghost => {
            ghost.speed += 0.2;
        });
        
        // Reset positions and create new dots
        this.resetPositions();
        this.dots = this.createDots();
        this.powerPellets = this.createPowerPellets();
    }
    
    resetPositions() {
        this.pacman.x = 14;
        this.pacman.y = 23;
        this.pacman.direction = 'right';
        this.pacman.nextDirection = 'right';
        
        this.ghosts[0].x = 13; this.ghosts[0].y = 11;
        this.ghosts[1].x = 14; this.ghosts[1].y = 11;
        this.ghosts[2].x = 15; this.ghosts[2].y = 11;
        this.ghosts[3].x = 16; this.ghosts[3].y = 11;
        
        this.ghosts.forEach(ghost => {
            ghost.scared = false;
        });
    }
    
    draw() {
        // Clear canvas with modern background
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw maze with rounded corners and modern styling
        this.drawMaze();
        
        // Draw dots with improved visibility
        this.drawDots();
        
        // Draw power pellets with animation
        this.drawPowerPellets();
        
        // Draw fruit with modern design
        this.drawFruit();
        
        // Draw Pac-Man with improved design
        this.drawPacman();
        
        // Draw ghosts with modern styling
        this.drawGhosts();
        
        // Draw UI with modern design
        this.drawUI();
        
        // Draw game over screen with modern overlay
        if (this.gameOver) {
            this.drawGameOver();
        }
    }
    
    drawMaze() {
        // Draw maze with rounded corners and modern styling
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.maze[row][col] === 1) {
                    const x = col * this.gridSize;
                    const y = row * this.gridSize;
                    const size = this.gridSize;
                    
                    // Create rounded rectangle effect
                    this.ctx.fillStyle = this.colors.wall;
                    this.ctx.shadowColor = 'rgba(78, 205, 196, 0.3)';
                    this.ctx.shadowBlur = 4;
                    this.ctx.fillRect(x, y, size, size);
                    this.ctx.shadowBlur = 0;
                    
                    // Add subtle gradient effect
                    const gradient = this.ctx.createLinearGradient(x, y, x + size, y + size);
                    gradient.addColorStop(0, 'rgba(78, 205, 196, 0.8)');
                    gradient.addColorStop(1, 'rgba(78, 205, 196, 1)');
                    this.ctx.fillStyle = gradient;
                    this.ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
                }
            }
        }
    }
    
    drawDots() {
        this.ctx.fillStyle = this.colors.dot;
        this.ctx.shadowColor = 'rgba(255, 107, 107, 0.5)';
        this.ctx.shadowBlur = 3;
        
        this.dots.forEach(dot => {
            if (!dot.collected) {
                const centerX = dot.x * this.gridSize + this.gridSize / 2;
                const centerY = dot.y * this.gridSize + this.gridSize / 2;
                const radius = Math.max(2, this.gridSize / 8);
                
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        this.ctx.shadowBlur = 0;
    }
    
    drawPowerPellets() {
        this.powerPellets.forEach(pellet => {
            if (!pellet.collected) {
                const centerX = pellet.x * this.gridSize + this.gridSize / 2;
                const centerY = pellet.y * this.gridSize + this.gridSize / 2;
                const radius = Math.max(6, this.gridSize / 3);
                
                // Animated pulsing effect
                const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
                const finalRadius = radius * pulse;
                
                // Glow effect
                this.ctx.shadowColor = this.colors.powerPellet;
                this.ctx.shadowBlur = 8;
                this.ctx.fillStyle = this.colors.powerPellet;
                
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, finalRadius, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.shadowBlur = 0;
            }
        });
    }
    
    drawPacman() {
        const centerX = this.pacman.x * this.gridSize + this.gridSize / 2;
        const centerY = this.pacman.y * this.gridSize + this.gridSize / 2;
        const radius = this.gridSize / 2 - 3;
        
        // Handle invulnerability flashing with modern effect
        if (this.pacman.invulnerable && Math.floor(this.pacman.invulnerableTimer * 10) % 2 === 0) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            this.ctx.shadowBlur = 8;
        } else {
            this.ctx.fillStyle = this.colors.pacman;
            this.ctx.shadowColor = 'rgba(255, 255, 0, 0.5)';
            this.ctx.shadowBlur = 6;
        }
        
        this.ctx.beginPath();
        
        if (this.pacman.mouthOpen) {
            // Draw Pac-Man with open mouth - improved angles
            let startAngle, endAngle;
            switch (this.pacman.direction) {
                case 'right':
                    startAngle = 0.2;
                    endAngle = 1.8 * Math.PI;
                    break;
                case 'left':
                    startAngle = Math.PI + 0.2;
                    endAngle = 3.8 * Math.PI;
                    break;
                case 'up':
                    startAngle = 1.5 * Math.PI + 0.2;
                    endAngle = 0.5 * Math.PI - 0.2;
                    break;
                case 'down':
                    startAngle = 0.5 * Math.PI + 0.2;
                    endAngle = 1.5 * Math.PI - 0.2;
                    break;
            }
            
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.lineTo(centerX, centerY);
        } else {
            // Draw full circle
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        }
        
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    drawFruit() {
        if (!this.fruit || this.fruit.collected) return;
        
        const centerX = this.fruit.x * this.gridSize + this.gridSize / 2;
        const centerY = this.fruit.y * this.gridSize + this.gridSize / 2;
        const size = this.gridSize / 2 - 2;
        
        // Blinking effect with modern timing
        if (this.fruitBlinkTimer > 8) { // Start blinking in last 2 seconds
            if (Math.floor(this.fruitBlinkTimer * 5) % 2 === 0) return;
        }
        
        // Add glow effect
        this.ctx.shadowColor = this.fruit.type.color;
        this.ctx.shadowBlur = 6;
        
        // Draw fruit based on type with improved design
        this.ctx.fillStyle = this.fruit.type.color;
        
        switch (this.fruit.type.name) {
            case 'Cherry':
                this.drawCherry(centerX, centerY, size);
                break;
            case 'Strawberry':
                this.drawStrawberry(centerX, centerY, size);
                break;
            case 'Orange':
                this.drawOrange(centerX, centerY, size);
                break;
            default:
                // Default circle for other fruits
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
                this.ctx.fill();
                break;
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    drawCherry(x, y, size) {
        // Draw two cherries with modern styling
        this.ctx.beginPath();
        this.ctx.arc(x - size/3, y, size/2, 0, Math.PI * 2);
        this.ctx.arc(x + size/3, y, size/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw stems with improved design
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = Math.max(1, size/8);
        this.ctx.beginPath();
        this.ctx.moveTo(x - size/3, y - size/2);
        this.ctx.lineTo(x, y - size);
        this.ctx.moveTo(x + size/3, y - size/2);
        this.ctx.lineTo(x, y - size);
        this.ctx.stroke();
    }
    
    drawStrawberry(x, y, size) {
        // Draw strawberry body with modern shape
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, size/2, size, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw seeds with improved visibility
        this.ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const seedX = x + Math.cos(angle) * size/3;
            const seedY = y + Math.sin(angle) * size/3;
            this.ctx.beginPath();
            this.ctx.arc(seedX, seedY, Math.max(1, size/12), 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawOrange(x, y, size) {
        // Draw orange with modern design
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw segments with improved visibility
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = Math.max(1, size/12);
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const startX = x;
            const startY = y;
            const endX = x + Math.cos(angle) * size;
            const endY = y + Math.sin(angle) * size;
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
        }
        this.ctx.stroke();
    }
    
    drawGhosts() {
        this.ghosts.forEach(ghost => {
            const centerX = ghost.x * this.gridSize + this.gridSize / 2;
            const centerY = ghost.y * this.gridSize + this.gridSize / 2;
            const radius = this.gridSize / 2 - 2;
            
            // Choose color based on ghost state with modern effects
            let color = ghost.scared ? this.colors.scared : this.colors[ghost.color];
            this.ctx.fillStyle = color;
            
            // Add glow effect for ghosts
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 4;
            
            // Draw ghost body with modern rounded design
            this.ctx.beginPath();
            this.ctx.roundRect(
                centerX - radius,
                centerY - radius,
                radius * 2,
                radius * 2,
                radius
            );
            this.ctx.fill();
            
            // Draw bottom spikes with improved design
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - radius, centerY + radius);
            for (let i = 0; i <= 4; i++) {
                const x = centerX - radius + (i * radius * 2) / 4;
                const y = centerY + radius + (i % 2 === 0 ? 0 : 4);
                this.ctx.lineTo(x, y);
            }
            this.ctx.lineTo(centerX + radius, centerY + radius);
            this.ctx.fill();
            
            // Draw eyes with modern styling
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowBlur = 0;
            const eyeSize = radius / 3;
            this.ctx.beginPath();
            this.ctx.arc(centerX - eyeSize, centerY - eyeSize, eyeSize, 0, Math.PI * 2);
            this.ctx.arc(centerX + eyeSize, centerY - eyeSize, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw pupils with improved design
            this.ctx.fillStyle = '#000000';
            const pupilSize = eyeSize / 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX - eyeSize, centerY - eyeSize, pupilSize, 0, Math.PI * 2);
            this.ctx.arc(centerX + eyeSize, centerY - eyeSize, pupilSize, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawUI() {
        // Modern UI design with background panels
        const panelHeight = this.uiPanelHeight;
        const panelPadding = 10;
        
        // Top panel background
        this.ctx.fillStyle = this.colors.uiBackground;
        this.ctx.fillRect(0, 0, this.width, panelHeight);
        
        // Bottom border
        this.ctx.strokeStyle = this.colors.uiBorder;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, panelHeight);
        this.ctx.lineTo(this.width, panelHeight);
        this.ctx.stroke();
        
        // Draw score with modern typography
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `bold ${Math.round(16 * this.scale)}px 'Orbitron', monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, panelPadding, 25);
        
        // Draw lives with modern design
        this.ctx.fillText(`Lives: ${this.lives}`, panelPadding, 45);
        
        // Draw level with modern styling
        this.ctx.fillText(`Level: ${this.level}`, this.width / 2 - 30, 35);
        
        // Draw high score with modern design
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`High Score: ${this.highScore}`, this.width - panelPadding, 35);
    }
    
    drawGameOver() {
        // Modern overlay with blur effect simulation
        this.ctx.fillStyle = this.colors.overlay;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Modern game over panel
        const panelWidth = this.width * 0.8;
        const panelHeight = 200;
        const panelX = (this.width - panelWidth) / 2;
        const panelY = (this.height - panelHeight) / 2;
        
        // Panel background with modern styling
        this.ctx.fillStyle = this.colors.uiBackground;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // Panel border
        this.ctx.strokeStyle = this.colors.uiBorder;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Game over text with modern typography
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `bold ${Math.round(32 * this.scale)}px 'Orbitron', monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.width / 2, panelY + 60);
        
        // Score text
        this.ctx.font = `${Math.round(18 * this.scale)}px 'Orbitron', monospace`;
        this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, panelY + 100);
        this.ctx.fillText(`High Score: ${this.highScore}`, this.width / 2, panelY + 125);
        
        // Restart instruction
        this.ctx.font = `${Math.round(14 * this.scale)}px 'Orbitron', monospace`;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillText('Press Restart to play again', this.width / 2, panelY + 160);
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
        // Resume audio context on first interaction (needed for mobile)
        const resumeAudio = () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            document.removeEventListener('keydown', resumeAudio);
            document.removeEventListener('mousedown', resumeAudio);
            document.removeEventListener('touchstart', resumeAudio);
        };
        
        document.addEventListener('keydown', resumeAudio);
        document.addEventListener('mousedown', resumeAudio);
        document.addEventListener('touchstart', resumeAudio);
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.pacman.nextDirection = 'up';
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    this.pacman.nextDirection = 'down';
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.pacman.nextDirection = 'left';
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.pacman.nextDirection = 'right';
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    this.togglePause();
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });
        
        // Enhanced touch controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        
        // Touch controls for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.gameOver && e.changedTouches[0]) {
                const touch = e.changedTouches[0];
                const deltaX = touch.clientX - touchStartX;
                const deltaY = touch.clientY - touchStartY;
                const minSwipeDistance = 30;
                
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal swipe
                    if (Math.abs(deltaX) > minSwipeDistance) {
                        if (deltaX > 0) {
                            this.pacman.nextDirection = 'right';
                        } else {
                            this.pacman.nextDirection = 'left';
                        }
                    }
                } else {
                    // Vertical swipe
                    if (Math.abs(deltaY) > minSwipeDistance) {
                        if (deltaY > 0) {
                            this.pacman.nextDirection = 'down';
                        } else {
                            this.pacman.nextDirection = 'up';
                        }
                    }
                }
            }
        });
        
        // Mouse controls for desktop
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.gameOver) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate direction based on click position relative to Pac-Man
            const pacmanX = this.pacman.x * this.gridSize + this.gridSize / 2;
            const pacmanY = this.pacman.y * this.gridSize + this.gridSize / 2;
            
            const deltaX = x - pacmanX;
            const deltaY = y - pacmanY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal movement
                if (deltaX > 0) {
                    this.pacman.nextDirection = 'right';
                } else {
                    this.pacman.nextDirection = 'left';
                }
            } else {
                // Vertical movement
                if (deltaY > 0) {
                    this.pacman.nextDirection = 'down';
                } else {
                    this.pacman.nextDirection = 'up';
                }
            }
        });
        
        // Control button events
        document.getElementById('upBtnPacman')?.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.pacman.nextDirection = 'up';
        });
        
        document.getElementById('downBtnPacman')?.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.pacman.nextDirection = 'down';
        });
        
        document.getElementById('leftBtnPacman')?.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.pacman.nextDirection = 'left';
        });
        
        document.getElementById('rightBtnPacman')?.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.pacman.nextDirection = 'right';
        });
        
        document.getElementById('pauseBtnPacman')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.togglePause();
        });
        
        document.getElementById('restartBtnPacman')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.restart();
        });
        
        // Handle window resize with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateCanvasSize();
            }, 250);
        });
    }
    
    togglePause() {
        this.paused = !this.paused;
        const pauseBtn = document.getElementById('pauseBtnPacman');
        if (pauseBtn) {
            pauseBtn.textContent = this.paused ? 'Resume' : 'Pause';
        }
        
        // Update pause overlay
        const overlay = document.querySelector('.game-overlay');
        if (overlay) {
            if (this.paused) {
                overlay.classList.add('active');
                const content = overlay.querySelector('.overlay-content');
                if (content) {
                    content.innerHTML = '<h3>Game Paused</h3><p>Press P or click Resume to continue</p>';
                }
            } else {
                overlay.classList.remove('active');
            }
        }
    }
    
    restart() {
        this.gameOver = false;
        this.paused = false;
        this.shouldStop = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        // Reset positions
        this.resetPositions();
        
        // Reset dots and power pellets
        this.dots = this.createDots();
        this.powerPellets = this.createPowerPellets();
        
        // Reset fruit
        this.fruit = null;
        this.fruitTimer = 0;
        
        // Reset Pac-Man invulnerability
        this.pacman.invulnerable = false;
        this.pacman.invulnerableTimer = 0;
        
        // Reset ghosts
        this.ghosts.forEach(ghost => {
            ghost.speed = ghost.color === 'ghost1' ? 1.4 : 
                         ghost.color === 'ghost2' ? 1.2 : 
                         ghost.color === 'ghost3' ? 1.3 : 1.1;
            ghost.scared = false;
            ghost.mode = 'chase';
        });
        
        this.ghostModeTimer = 0;
        this.scaredTimer = 0;
        this.fruitBlinkTimer = 0;
        
        // Update stats
        this.updateStats();
        
        // Update UI
        const pauseBtn = document.getElementById('pauseBtnPacman');
        if (pauseBtn) {
            pauseBtn.textContent = 'Pause';
        }
        
        // Remove pause overlay
        const overlay = document.querySelector('.game-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
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
            linesElement.textContent = this.lives;
        }
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('pacmanHighScore', this.highScore);
            
            // Show high score notification
            this.showHighScoreNotification();
        }
    }
    
    showHighScoreNotification() {
        // Create a temporary high score notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            font-family: 'Orbitron', monospace;
            font-weight: bold;
            z-index: 1000;
            animation: slideInRight 0.5s ease-out;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;
        notification.textContent = '🎉 New High Score! 🎉';
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 3000);
    }
}

// Add roundRect method to CanvasRenderingContext2D if not available
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}
