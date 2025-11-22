const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
console.log("Game script started");
window.gameScriptLoaded = true;

// Game State
let gameRunning = true;
let score = 0;
let lives = 3;
let coins = 0;
let currentLevelIndex = 0;
let currentLevel = null;
let cameraX = 0;
let isTransitioning = false;

// Resize Handling
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Input Handling
const keys = { left: false, right: false, up: false, shift: false, enter: false, f: false, m: false };

document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'ArrowUp' || e.code === 'Space') {
        if (!keys.up) {
            player.jump();
            keys.up = true;
        }
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (!keys.shift) {
            player.shoot();
            keys.shift = true;
        }
    }
    if (e.code === 'Enter') {
        if (!keys.enter) {
            handleEnter();
            keys.enter = true;
        }
    }
    if (e.code === 'KeyF') {
        if (!keys.f) {
            handleShopToggle();
            keys.f = true;
        }
    }
    if (e.code === 'KeyM') {
        if (!keys.m) {
            if (shopOpen) buyWings();
            keys.m = true;
        }
    }
    audioSys.start();
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'ArrowUp' || e.code === 'Space') keys.up = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = false;
    if (e.code === 'Enter') keys.enter = false;
    if (e.code === 'KeyF') keys.f = false;
    if (e.code === 'KeyM') keys.m = false;
});

document.getElementById('restart-btn').addEventListener('click', resetGame);
document.getElementById('buy-wings-btn').addEventListener('click', buyWings);

let shopOpen = false;

function handleShopToggle() {
    // Check if near shop in Level 2
    if (currentLevelIndex === 1 && player.x > 350 && player.x < 550) {
        shopOpen = !shopOpen;
        const screen = document.getElementById('shop-screen');
        if (shopOpen) {
            screen.classList.remove('hidden');
            gameRunning = false;
        } else {
            screen.classList.add('hidden');
            gameRunning = true;
            loop();
        }
    } else if (shopOpen) {
        // Allow closing even if moved (though movement is paused)
        shopOpen = false;
        document.getElementById('shop-screen').classList.add('hidden');
        gameRunning = true;
        loop();
    }
}

function buyWings() {
    if (coins >= 12) {
        coins -= 12;
        player.hasWings = true;
        audioSys.playPowerUp();
        updateUI();
        document.getElementById('shop-message').innerText = "Wings Purchased!";
        document.getElementById('shop-message').style.color = "green";
    } else {
        document.getElementById('shop-message').innerText = "Not enough coins!";
        document.getElementById('shop-message').style.color = "red";
    }
}

function handleEnter() {
    // Wings Activation
    if (player.hasWings && player.wingCooldown <= 0 && !player.wingActive) {
        player.wingActive = true;
        player.wingTimer = 900; // 15 seconds at 60fps
        audioSys.playPowerUp(); // Activation sound
    }
}

// --- Audio System ---
const audioSys = {
    ctx: null,
    isPlaying: false,
    masterGain: null,
    sfxGain: null,

    start: function () {
        if (this.isPlaying) return;
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.8;
            this.sfxGain.connect(this.masterGain);
        }
        this.isPlaying = true;
    },

    // SFX
    playJump: function (isTriple) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        if (isTriple) {
            osc.frequency.setValueAtTime(300, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + 0.2);
        } else {
            osc.frequency.setValueAtTime(150, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);
        }
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isTriple ? 0.2 : 0.1));
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + (isTriple ? 0.2 : 0.1));
    },

    playEnemyDeath: function () {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.1);
    },

    playShoot: function () {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(400, t + 0.1);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.1);
    },

    playPowerUp: function () {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.setValueAtTime(554, t + 0.1);
        osc.frequency.setValueAtTime(659, t + 0.2);
        osc.frequency.setValueAtTime(880, t + 0.3);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.5);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.5);
    },

    playCoin: function () {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(988, t); // B5
        osc.frequency.setValueAtTime(1318, t + 0.05); // E6
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.3);
    },

    playDeath: function () {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.5);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.5);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.5);
    },

    playWin: function () {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            this.playNote(freq, now + i * 0.2, 0.5, 'square', this.sfxGain);
        });
    },

    playNote: function (freq, time, duration, type, output) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(gain);
        gain.connect(output);
        osc.start(time);
        osc.stop(time + duration);
    }
};

// --- Level Configuration ---
const LEVELS = [
    {
        type: 'grassland',
        width: 30000,
        skyColor: '#5c94fc',
        groundColor: '#805300',
        groundTopColor: '#00b300',
        platformColor: '#B8860B',
        hillColor: '#228B22',
        enemyType: 'turtle'
    },
    {
        type: 'desert',
        width: 30000,
        skyColor: '#FF4500',
        groundColor: '#C2B280',
        groundTopColor: '#E6C288',
        platformColor: '#8B4513',
        hillColor: '#D2B48C',
        enemyType: 'crab'
    },
    {
        type: 'forest',
        width: 30000,
        skyColor: '#003300',
        groundColor: '#2d1a0e',
        groundTopColor: '#006400',
        platformColor: '#3e2723',
        hillColor: '#1B5E20',
        enemyType: 'bear'
    }
];

class Level {
    constructor(config) {
        this.config = config;
        this.width = config.width;
        this.platforms = [];
        this.blocks = [];
        this.enemies = [];
        this.items = [];
        this.projectiles = [];
        this.scenery = [];
        this.hills = [];
        this.goal = { x: this.width - 300, y: 0, w: 20, h: 150 };

        this.generate();
    }

    generate() {
        let currentX = 600;
        const groundY = canvas.height - 50;
        this.goal.y = groundY - 150;

        // Hills
        for (let x = 0; x < this.width; x += 400 + Math.random() * 400) {
            this.hills.push({ x: x, y: groundY, w: 200 + Math.random() * 300, h: 100 + Math.random() * 150 });
        }

        // Star Block
        const starX = 1000 + Math.random() * (this.width - 2000);
        let starPlaced = false;

        while (currentX < this.width - 600) {
            currentX += 200 + Math.random() * 300;

            // Platforms
            if (Math.random() < 0.4) {
                const w = 100 + Math.random() * 200;
                const h = 20;
                const y = groundY - 50 - Math.random() * 150;
                this.platforms.push({ x: currentX, y: y, w: w, h: h });
                if (Math.random() < 0.5) {
                    this.enemies.push(new Enemy(currentX + w / 2, y - 30, this.config.enemyType));
                }
            }

            // Blocks
            if (Math.random() < 0.3) {
                const y = groundY - 100 - Math.random() * 100;
                for (let i = 0; i < 1 + Math.random() * 2; i++) {
                    let type = Math.random() < 0.3 ? 'question' : 'brick';
                    if (!starPlaced && currentX > starX) {
                        type = 'question_star';
                        starPlaced = true;
                    }
                    this.blocks.push(new Block(currentX + i * 40, y, type));
                }
            }

            // Ground Enemies
            if (Math.random() < 0.3) {
                this.enemies.push(new Enemy(currentX, groundY - 30, this.config.enemyType));
            }

            // Scenery
            if (Math.random() < 0.6) {
                this.scenery.push({
                    x: currentX + Math.random() * 100,
                    y: groundY,
                    type: this.config.type === 'grassland' ? 'tree' : (this.config.type === 'desert' ? 'cactus' : 'forest_tree')
                });
            }
        }

        if (!starPlaced) this.blocks.push(new Block(currentX, groundY - 150, 'question_star'));

        // Shop for Level 2
        if (this.config.type === 'desert') { // Level 2 is desert
            // Shop is drawn in drawBackground, but we ensure space here if needed
        }
    }

    drawBackground(ctx, cameraX) {
        ctx.fillStyle = this.config.skyColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(-cameraX, 0);

        // Shop (Level 2 only)
        if (this.config.type === 'desert') {
            drawShop(ctx, 400, canvas.height - 200);
        }

        // Hills
        ctx.fillStyle = this.config.hillColor;
        this.hills.forEach(hill => {
            if (hill.x + hill.w > cameraX && hill.x < cameraX + canvas.width) {
                ctx.beginPath();
                ctx.ellipse(hill.x + hill.w / 2, hill.y, hill.w / 2, hill.h, 0, Math.PI, 0);
                ctx.fill();
            }
        });

        // Scenery
        this.scenery.forEach(item => {
            if (item.x > cameraX - 200 && item.x < cameraX + canvas.width + 200) {
                if (item.type === 'tree') drawTree(ctx, item.x, item.y);
                if (item.type === 'cactus') drawCactus(ctx, item.x, item.y);
                if (item.type === 'forest_tree') drawForestTree(ctx, item.x, item.y);
            }
        });

        // Platforms
        ctx.fillStyle = this.config.platformColor;
        this.platforms.forEach(p => {
            if (p.x + p.w > cameraX && p.x < cameraX + canvas.width) {
                ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.fillStyle = this.config.groundTopColor;
                ctx.fillRect(p.x, p.y, p.w, 5);
                ctx.fillStyle = this.config.platformColor;
            }
        });

        // Blocks
        this.blocks.forEach(b => {
            if (b.x > cameraX - 100 && b.x < cameraX + canvas.width + 100) {
                b.draw(ctx);
            }
        });

        // Ground
        const groundY = canvas.height - 50;
        ctx.fillStyle = this.config.groundColor;
        ctx.fillRect(cameraX, groundY, canvas.width, 50);
        ctx.fillStyle = this.config.groundTopColor;
        ctx.fillRect(cameraX, groundY, canvas.width, 10);

        // Goal
        drawFlag(ctx, this.goal.x, this.goal.y);

        // Items
        this.items.forEach(i => i.draw(ctx));

        // Projectiles
        this.projectiles.forEach(p => p.draw(ctx));

        ctx.restore();
    }
}

// --- Entities ---

const player = {
    x: 100,
    y: 400,
    width: 40,
    height: 40,
    vx: 0,
    vy: 0,
    speed: 6,
    jumpPower: -12,
    gravity: 0.6,
    grounded: false,
    jumpCount: 0,
    maxJumps: 2,
    facingRight: true,
    hasFireFlower: false,
    canTripleJump: false,
    invincible: false,
    invincibleTimer: 0,
    hasWings: false,
    wingActive: false,
    wingTimer: 0,
    wingActive: false,
    wingTimer: 0,
    wingCooldown: 0,
    shootCooldown: 0,

    update: function () {
        // Horizontal
        if (keys.left) { this.vx = -this.speed; this.facingRight = false; }
        else if (keys.right) { this.vx = this.speed; this.facingRight = true; }
        else { this.vx = 0; }

        this.x += this.vx;

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > currentLevel.width) this.x = currentLevel.width - this.width;

        // Vertical
        if (this.wingActive) {
            // Flight Logic
            if (keys.up) {
                this.vy -= 1.0; // Fly up
                if (this.vy < -8) this.vy = -8;
            } else {
                this.vy += 0.3; // Gentle gravity
            }

            this.wingTimer--;
            if (this.wingTimer <= 0) {
                this.wingActive = false;
                this.wingCooldown = 1800; // 30 seconds
            }
        } else {
            // Normal Gravity
            this.vy += this.gravity;
        }

        this.y += this.vy;

        this.grounded = false;

        // Ground Collision
        if (this.y + this.height > canvas.height - 50) {
            this.y = canvas.height - 50 - this.height;
            this.vy = 0;
            this.grounded = true;
            this.jumpCount = 0;
        }

        // Platform Collision
        currentLevel.platforms.forEach(p => {
            if (this.vy >= 0 &&
                this.x + this.width > p.x &&
                this.x < p.x + p.w &&
                this.y + this.height >= p.y &&
                this.y + this.height <= p.y + p.h + this.vy) {

                this.y = p.y - this.height;
                this.vy = 0;
                this.grounded = true;
                this.jumpCount = 0;
            }
        });

        // Block Collision
        currentLevel.blocks.forEach(b => {
            if (this.x < b.x + b.w && this.x + this.width > b.x &&
                this.y < b.y + b.h && this.y + this.height > b.y) {

                const dx = (this.x + this.width / 2) - (b.x + b.w / 2);
                const dy = (this.y + this.height / 2) - (b.y + b.h / 2);
                const width = (this.width + b.w) / 2;
                const height = (this.height + b.h) / 2;
                const crossWidth = width * dy;
                const crossHeight = height * dx;

                if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
                    if (crossWidth > crossHeight) {
                        if (crossWidth > -crossHeight) {
                            // Bottom
                            this.y = b.y + b.h;
                            this.vy = 0;
                            b.hit();
                        } else {
                            // Left
                            this.x = b.x - this.width;
                            this.vx = 0;
                        }
                    } else {
                        if (crossWidth > -crossHeight) {
                            // Right
                            this.x = b.x + b.w;
                            this.vx = 0;
                        } else {
                            // Top
                            this.y = b.y - this.height;
                            this.vy = 0;
                            this.grounded = true;
                            this.jumpCount = 0;
                        }
                    }
                }
            }
        });

        // Invincibility
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // Cooldown
        if (this.wingCooldown > 0) this.wingCooldown--;
        if (this.shootCooldown > 0) this.shootCooldown--;
    },

    jump: function () {
        if (this.wingActive) return; // No jump in flight

        if (this.jumpCount < this.maxJumps) {
            if (this.canTripleJump && this.jumpCount === 0) {
                this.vy = this.jumpPower * 1.5;
                audioSys.playJump(true);
                this.canTripleJump = false;
            } else {
                this.vy = this.jumpPower;
                audioSys.playJump(false);
            }
            this.jumpCount++;
            return true;
        }
        return false;
    },

    shoot: function () {
        if (this.hasFireFlower && this.shootCooldown <= 0) {
            const vx = this.facingRight ? 10 : -10;
            currentLevel.projectiles.push(new Fireball(this.x + this.width / 2, this.y + 10, vx));
            audioSys.playShoot();
            this.shootCooldown = 60; // 1 second at 60fps
        }
    },

    draw: function () {
        drawMario(ctx, this.x, this.y, this.width, this.height, this.facingRight, this.hasFireFlower, this.invincible, this.wingActive);
    }
};

class Block {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.w = 40;
        this.h = 40;
        this.type = type;
        this.active = true;
    }

    hit() {
        if (!this.active) return;

        if (this.type === 'question' || this.type === 'question_star') {
            const isStar = this.type === 'question_star';
            this.type = 'empty';

            if (isStar) {
                currentLevel.items.push(new Item(this.x, this.y - 40, 'star'));
            } else {
                const rand = Math.random();
                if (rand < 0.7) {
                    currentLevel.items.push(new Item(this.x, this.y - 40, 'coin'));
                } else {
                    currentLevel.items.push(new Item(this.x, this.y - 40, 'fireflower'));
                }
            }
            audioSys.playPowerUp();
        } else if (this.type === 'brick') {
            // Bump
        }
    }

    draw(ctx) {
        if (this.type === 'question' || this.type === 'question_star') {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.fillStyle = 'black';
            ctx.font = '20px Arial';
            ctx.fillText('?', this.x + 15, this.y + 28);
        } else if (this.type === 'brick') {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.strokeStyle = 'black';
            ctx.strokeRect(this.x, this.y, this.w, this.h);
        } else {
            ctx.fillStyle = '#654321';
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
    }
}

class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.w = 30;
        this.h = 30;
        this.type = type;
        this.vx = type === 'star' ? 3 : 0;
        this.vy = -5;
        this.grounded = false;
        if (type === 'coin') {
            this.vy = -8;
            this.vx = 0;
        }
    }

    update() {
        this.vy += 0.5;
        this.y += this.vy;
        this.x += this.vx;

        if (this.y + this.h > canvas.height - 50) {
            this.y = canvas.height - 50 - this.h;
            this.vy = this.type === 'star' ? -8 : 0;
            this.grounded = true;
        }

        currentLevel.platforms.forEach(p => {
            if (this.y + this.h > p.y && this.y + this.h < p.y + p.h + 10 && this.x > p.x && this.x < p.x + p.w) {
                this.y = p.y - this.h;
                this.vy = this.type === 'star' ? -8 : 0;
            }
        });
    }

    draw(ctx) {
        if (this.type === 'fireflower') {
            ctx.fillStyle = 'green'; ctx.fillRect(this.x + 12, this.y + 15, 6, 15);
            ctx.fillStyle = 'orange'; ctx.beginPath(); ctx.arc(this.x + 15, this.y + 10, 10, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(this.x + 15, this.y + 10, 5, 0, Math.PI * 2); ctx.fill();
        } else if (this.type === 'star') {
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath(); ctx.arc(this.x + 15, this.y + 15, 15, 0, Math.PI * 2); ctx.fill();
        } else if (this.type === 'coin') {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath(); ctx.ellipse(this.x + 15, this.y + 15, 10, 15, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFA500'; ctx.font = '20px Arial'; ctx.fillText('$', this.x + 8, this.y + 22);
        }
    }
}

class Fireball {
    constructor(x, y, vx) {
        this.x = x; this.y = y; this.w = 15; this.h = 15; this.vx = vx; this.vy = 0; this.active = true;
    }
    update() {
        this.x += this.vx; this.vy += 0.5; this.y += this.vy;
        if (this.y + this.h > canvas.height - 50) { this.y = canvas.height - 50 - this.h; this.vy = -8; }
        if (this.x < cameraX || this.x > cameraX + canvas.width) this.active = false;
    }
    draw(ctx) {
        ctx.fillStyle = 'orange'; ctx.beginPath(); ctx.arc(this.x + 7, this.y + 7, 7, 0, Math.PI * 2); ctx.fill();
    }
}

class Enemy {
    constructor(x, y, type) {
        this.x = x; this.y = y;
        this.width = type === 'bear' ? 60 : 40;
        this.height = type === 'bear' ? 50 : 30;
        this.vx = type === 'bear' ? -1.5 : -2;
        this.vy = 0; this.gravity = 0.6; this.alive = true; this.type = type; this.grounded = false;
    }
    update() {
        this.x += this.vx; this.vy += this.gravity; this.y += this.vy; this.grounded = false;
        if (this.y + this.height > canvas.height - 50) { this.y = canvas.height - 50 - this.height; this.vy = 0; this.grounded = true; }
        currentLevel.platforms.forEach(p => {
            if (this.vy >= 0 && this.x + this.width > p.x && this.x < p.x + p.w && this.y + this.height >= p.y && this.y + this.height <= p.y + p.h + this.vy) {
                this.y = p.y - this.height; this.vy = 0; this.grounded = true;
            }
        });
        if (this.x <= 0) { this.x = 0; this.vx *= -1; }
        if (this.x + this.width >= currentLevel.width) { this.x = currentLevel.width - this.width; this.vx *= -1; }
    }
    draw() {
        if (!this.alive) return;
        if (this.type === 'turtle') drawTurtle(ctx, this.x, this.y, this.width, this.height, this.vx > 0);
        if (this.type === 'crab') drawCrab(ctx, this.x, this.y, this.width, this.height, this.vx > 0);
        if (this.type === 'bear') drawBear(ctx, this.x, this.y, this.width, this.height, this.vx > 0);
    }
}

function updateUI() {
    document.getElementById('score').innerText = '🏆 ' + score;
    document.getElementById('coins').innerText = '🪙 ' + coins;

    let hearts = '';
    for (let i = 0; i < lives; i++) {
        hearts += '❤️';
    }
    document.getElementById('lives').innerText = hearts;
}

function drawMario(ctx, x, y, w, h, facingRight, hasFireFlower, invincible, wingActive) {
    // Colors
    let hatColor = '#FF0000';
    let shirtColor = '#FF0000';
    let overallsColor = '#0000FF';

    if (hasFireFlower) {
        hatColor = '#FFFFFF';
        shirtColor = '#FFFFFF';
        overallsColor = '#FF0000';
    }

    if (invincible) {
        const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        const colorIndex = Math.floor(Date.now() / 50) % colors.length;
        hatColor = colors[colorIndex];
        shirtColor = colors[(colorIndex + 1) % colors.length];
        overallsColor = colors[(colorIndex + 2) % colors.length];
    }

    // Body
    ctx.fillStyle = shirtColor;
    ctx.fillRect(x + 10, y + 15, w - 20, h - 25);

    // Overalls
    ctx.fillStyle = overallsColor;
    ctx.fillRect(x + 10, y + 25, w - 20, h - 25); // Main part
    // Straps
    ctx.fillStyle = overallsColor;
    ctx.fillRect(x + 10, y + 15, 5, 10);
    ctx.fillRect(x + w - 15, y + 15, 5, 10);

    // Head
    ctx.fillStyle = '#FFCC99'; // Skin
    const headX = x + (w - 20) / 2;
    ctx.fillRect(headX, y, 20, 20);

    // Hat
    ctx.fillStyle = hatColor;
    ctx.fillRect(headX, y, 20, 5); // Top
    // Brim
    if (facingRight) {
        ctx.fillRect(headX, y, 25, 5);
    } else {
        ctx.fillRect(headX - 5, y, 25, 5);
    }

    // Face (Eye/Mustache)
    ctx.fillStyle = 'black';
    if (facingRight) {
        ctx.fillRect(headX + 12, y + 8, 3, 3); // Eye
        ctx.fillRect(headX + 10, y + 15, 8, 3); // Mustache
    } else {
        ctx.fillRect(headX + 5, y + 8, 3, 3); // Eye
        ctx.fillRect(headX + 2, y + 15, 8, 3); // Mustache
    }

    // Wings
    if (wingActive || (typeof player !== 'undefined' && player.hasWings)) {
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;

        const wingX = facingRight ? x + 5 : x + w - 5;
        const wingDir = facingRight ? -1 : 1;

        ctx.beginPath();
        ctx.moveTo(wingX, y + 20);
        ctx.lineTo(wingX + (15 * wingDir), y + 5);
        ctx.lineTo(wingX + (20 * wingDir), y + 15);
        ctx.lineTo(wingX + (10 * wingDir), y + 25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

function drawPixelRect(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 5, 5); // 5x5 "pixel"
}

function drawTurtle(ctx, x, y, w, h, facingRight) {
    // Modern Pixel Art Turtle
    const p = 5; // Pixel size
    // Shell
    ctx.fillStyle = '#008000';
    ctx.fillRect(x + 5, y + 10, w - 10, h - 15);
    // Shell Pattern
    ctx.fillStyle = '#006400';
    ctx.fillRect(x + 15, y + 15, 10, 10);

    // Head
    ctx.fillStyle = '#90ee90';
    const headX = facingRight ? x + w - 10 : x;
    ctx.fillRect(headX, y + 5, 15, 15);

    // Eye
    ctx.fillStyle = 'black';
    const eyeX = facingRight ? headX + 10 : headX + 2;
    ctx.fillRect(eyeX, y + 8, 3, 3);

    // Feet
    ctx.fillStyle = '#FFD700'; // Boots
    ctx.fillRect(x + 5, y + h - 5, 10, 5);
    ctx.fillRect(x + w - 15, y + h - 5, 10, 5);
}

function drawCrab(ctx, x, y, w, h, facingRight) {
    // Modern Pixel Art Crab
    ctx.fillStyle = '#FF4500';
    ctx.fillRect(x + 5, y + 10, w - 10, h - 15); // Body

    // Claws
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(x, y, 10, 10);
    ctx.fillRect(x + w - 10, y, 10, 10);

    // Eyes
    ctx.fillStyle = 'white';
    ctx.fillRect(x + 10, y - 5, 5, 5);
    ctx.fillRect(x + w - 15, y - 5, 5, 5);
    ctx.fillStyle = 'black';
    ctx.fillRect(x + 12, y - 3, 2, 2);
    ctx.fillRect(x + w - 13, y - 3, 2, 2);

    // Legs
    ctx.fillStyle = '#FF4500';
    ctx.fillRect(x, y + h - 5, 5, 5);
    ctx.fillRect(x + 10, y + h - 5, 5, 5);
    ctx.fillRect(x + w - 15, y + h - 5, 5, 5);
    ctx.fillRect(x + w - 5, y + h - 5, 5, 5);
}

function drawBear(ctx, x, y, w, h, facingRight) {
    // Modern Pixel Art Bear
    ctx.fillStyle = '#4A3728'; // Dark Brown
    ctx.fillRect(x, y + 10, w, h - 10); // Body

    // Texture (Fur)
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x + 10, y + 20, 5, 5);
    ctx.fillRect(x + 30, y + 30, 5, 5);
    ctx.fillRect(x + 50, y + 15, 5, 5);

    // Head
    ctx.fillStyle = '#4A3728';
    const headX = facingRight ? x + w - 20 : x;
    ctx.fillRect(headX, y, 20, 20);

    // Ears
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(headX, y - 5, 5, 5);
    ctx.fillRect(headX + 15, y - 5, 5, 5);

    // Eye
    ctx.fillStyle = 'black';
    const eyeX = facingRight ? headX + 12 : headX + 4;
    ctx.fillRect(eyeX, y + 5, 3, 3);

    // Snout
    ctx.fillStyle = '#D7CCC8';
    const snoutX = facingRight ? headX + 15 : headX;
    ctx.fillRect(snoutX, y + 10, 5, 5);
}

function drawShop(ctx, x, y) {
    ctx.fillStyle = '#8B4513'; // Wood
    ctx.fillRect(x, y, 150, 150);
    ctx.fillStyle = '#654321'; // Roof
    ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x + 170, y); ctx.lineTo(x + 75, y - 80); ctx.fill();

    ctx.fillStyle = '#FFD700'; // Sign
    ctx.fillRect(x + 20, y + 20, 110, 40);
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText('WINGS SHOP', x + 25, y + 45);
    ctx.font = '12px Arial';
    ctx.fillText('3 Coins', x + 55, y + 100);
    ctx.fillText('Press ENTER', x + 40, y + 120);
}

function drawTree(ctx, x, y) {
    ctx.fillStyle = '#8B4513'; ctx.fillRect(x, y - 60, 20, 60);
    ctx.fillStyle = '#228B22'; ctx.beginPath(); ctx.moveTo(x - 20, y - 60); ctx.lineTo(x + 40, y - 60); ctx.lineTo(x + 10, y - 140); ctx.fill();
}
function drawForestTree(ctx, x, y) {
    ctx.fillStyle = '#3E2723'; ctx.fillRect(x, y - 150, 30, 150);
    ctx.fillStyle = '#1B5E20'; ctx.beginPath(); ctx.moveTo(x - 40, y - 100); ctx.lineTo(x + 70, y - 100); ctx.lineTo(x + 15, y - 250); ctx.fill();
}
function drawCactus(ctx, x, y) {
    ctx.fillStyle = '#2E8B57'; ctx.fillRect(x, y - 60, 20, 60);
}
function drawFlag(ctx, x, y) {
    ctx.fillStyle = '#C0C0C0'; ctx.fillRect(x, y, 5, 150);
    ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(x + 2.5, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FF0000'; ctx.beginPath(); ctx.moveTo(x + 5, y + 10); ctx.lineTo(x + 50, y + 30); ctx.lineTo(x + 5, y + 50); ctx.fill();
}

// --- Game Logic ---

function loadLevel(index) {
    console.log("loadLevel called with index", index);
    if (index >= LEVELS.length) {
        document.querySelector('#game-over-screen h1').innerText = "YOU WIN!";
        document.querySelector('#game-over-screen button').innerText = "Play Again";
        gameOver();
        return;
    }

    currentLevelIndex = index;
    currentLevel = new Level(LEVELS[index]);

    player.x = 100;
    player.y = 400;
    player.vx = 0;
    player.vy = 0;
    cameraX = 0;

    updateUI();
}

function showLevelTransition(nextIndex) {
    isTransitioning = true;
    audioSys.playWin();
    const screen = document.getElementById('level-transition-screen');
    screen.classList.remove('hidden');
    setTimeout(() => {
        screen.classList.add('hidden');
        isTransitioning = false;
        loadLevel(nextIndex);
    }, 3000);
}

function checkCollisions() {
    if (isTransitioning) return;

    // Items
    currentLevel.items.forEach(item => {
        item.update();
        if (player.x < item.x + item.w && player.x + player.width > item.x &&
            player.y < item.y + item.h && player.y + player.height > item.y) {

            if (item.type === 'fireflower') {
                player.hasFireFlower = true;
                audioSys.playPowerUp();
            } else if (item.type === 'star') {
                player.invincible = true;
                player.invincibleTimer = 600;
            } else if (item.type === 'coin') {
                score += 50;
                coins++;
                audioSys.playCoin();
            }
            currentLevel.items = currentLevel.items.filter(i => i !== item);
            updateUI();
        }
    });

    // Projectiles
    currentLevel.projectiles.forEach(p => {
        p.update();
        currentLevel.enemies.forEach(e => {
            if (e.alive && p.active &&
                p.x < e.x + e.width && p.x + p.w > e.x &&
                p.y < e.y + e.height && p.y + p.h > e.y) {

                e.alive = false;
                p.active = false;
                score += 100;
                audioSys.playEnemyDeath();
                if (currentLevelIndex >= 2) player.canTripleJump = true;
                updateUI();
            }
        });
    });
    currentLevel.projectiles = currentLevel.projectiles.filter(p => p.active);

    // Enemies
    currentLevel.enemies.forEach(enemy => {
        if (!enemy.alive) return;

        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {

            if (player.invincible) {
                enemy.alive = false;
                score += 100;
                audioSys.playEnemyDeath();
                updateUI();
            } else if (player.vy > 0 && player.y + player.height - player.vy <= enemy.y + enemy.height / 2 + 10) {
                enemy.alive = false;
                player.vy = -8;
                score += 100;
                updateUI();
                audioSys.playEnemyDeath();
                if (currentLevelIndex >= 2) player.canTripleJump = true;
            } else {
                if (player.hasFireFlower) {
                    player.hasFireFlower = false;
                    player.invincible = true;
                    player.invincibleTimer = 120; // 2 seconds invincibility
                    audioSys.playDeath(); // Use death sound as "hurt" sound for now, or add a specific one
                    updateUI();
                } else {
                    takeDamage();
                }
            }
        }
    });

    // Goal
    const g = currentLevel.goal;
    if (player.x < g.x + g.w &&
        player.x + player.width > g.x &&
        player.y < g.y + g.h &&
        player.y + player.height > g.y) {
        showLevelTransition(currentLevelIndex + 1);
    }
}

function takeDamage() {
    if (player.invincible) return;

    lives--;
    updateUI();
    audioSys.playDeath();
    player.x = Math.max(0, player.x - 100);
    player.y = 400;
    player.vy = 0;
    if (lives <= 0) {
        gameOver();
    }
}

function gameOver() {
    gameRunning = false;
    document.getElementById('game-over-screen').classList.remove('hidden');
    audioSys.playDeath();
}

function resetGame() {
    lives = 3;
    score = 0;
    coins = 0;
    player.hasWings = false;
    gameRunning = true;
    document.getElementById('game-over-screen').classList.add('hidden');
    loadLevel(0);
    loop();
}

// Main Loop
function loop() {
    if (!gameRunning) return;

    if (!isTransitioning) {
        // Update Camera
        cameraX = player.x - canvas.width / 2;
        if (cameraX < 0) cameraX = 0;
        if (cameraX > currentLevel.width - canvas.width) cameraX = currentLevel.width - canvas.width;

        player.update();
        currentLevel.enemies.forEach(enemy => {
            if (enemy.x > cameraX - 100 && enemy.x < cameraX + canvas.width + 100) {
                enemy.update();
            }
        });

        checkCollisions();
        if (player.wingActive || player.hasWings) updateUI(); // Update timer
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    currentLevel.drawBackground(ctx, cameraX);

    ctx.save();
    ctx.translate(-cameraX, 0);

    player.draw();

    currentLevel.enemies.forEach(enemy => {
        if (enemy.x > cameraX - 100 && enemy.x < cameraX + canvas.width + 100) {
            enemy.draw();
        }
    });

    ctx.restore();

    requestAnimationFrame(loop);
}

// Init
// Error Handling
window.onerror = function (msg, url, line, col, error) {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '100%';
    div.style.backgroundColor = 'red';
    div.style.color = 'white';
    div.style.padding = '20px';
    div.style.zIndex = '9999';
    div.innerText = 'Error: ' + msg + '\nLine: ' + line + '\nCol: ' + col + '\nStack: ' + (error ? error.stack : 'N/A');
    document.body.appendChild(div);
    return false;
};

try {
    loadLevel(0);
    loop();
} catch (e) {
    console.error(e);
    window.onerror(e.message, 'game.js', 'N/A', 'N/A', e);
}
