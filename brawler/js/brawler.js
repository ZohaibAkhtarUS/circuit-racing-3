// ============================================================
// MIKHAIL'S BRAWLER - 2D Beat-em-Up Fighting Game
// Pure HTML5 Canvas + Vanilla JS, all assets procedural
// ============================================================

// --- CONSTANTS ---
const W = 960, H = 540;
const GROUND_Y = H * 0.55;
const WALK_MIN_Y = H * 0.5;
const WALK_MAX_Y = H * 0.92;
const GRAVITY = 1800;
const PLAYER_SPEED = 220;
const COMBO_WINDOW = 0.45;
const HIT_STOP_TIME = 0.045;
const INVINCIBLE_TIME = 0.6;
const MAX_PARTICLES = 200;
const MAX_ENEMIES_ON_SCREEN = 8;

const COLORS = {
    heroes: [
        { name: 'Blue Hero', shirt: '#3388ff', pants: '#2255aa', hair: '#332211', skin: '#e8b87a' },
        { name: 'Red Hero', shirt: '#ff3333', pants: '#aa2222', hair: '#111', skin: '#e8b87a' },
        { name: 'Green Hero', shirt: '#33cc55', pants: '#228833', hair: '#553311', skin: '#d4a06a' },
        { name: 'Purple Hero', shirt: '#9944ff', pants: '#6622cc', hair: '#222', skin: '#f0c896' },
    ],
};

const ENEMY_DEFS = {
    goon: { name: 'Goon', w: 36, h: 60, hp: 40, speed: 80, damage: 8, color: '#ff8844', skin: '#c8a070', attackRange: 45, attackCooldown: 1.2, score: 100 },
    brute: { name: 'Brute', w: 50, h: 70, hp: 100, speed: 50, damage: 18, color: '#885522', skin: '#b09060', attackRange: 55, attackCooldown: 2.0, score: 250 },
    ninja: { name: 'Ninja', w: 32, h: 56, hp: 30, speed: 160, damage: 10, color: '#333355', skin: '#d4b08a', attackRange: 40, attackCooldown: 0.8, score: 200 },
    robot: { name: 'Robot', w: 42, h: 64, hp: 80, speed: 70, damage: 14, color: '#8899aa', skin: '#aabbcc', attackRange: 120, attackCooldown: 1.5, score: 300 },
};

const BOSS_DEFS = [
    { name: 'BIG BULLY', w: 70, h: 90, hp: 250, speed: 60, damage: 22, color: '#cc4400', skin: '#c8a070', attackRange: 65, attackCooldown: 1.8, score: 1000, type: 'bully' },
    { name: 'SHADOW NINJA', w: 40, h: 62, hp: 300, speed: 180, damage: 16, color: '#222244', skin: '#d4b08a', attackRange: 50, attackCooldown: 0.6, score: 1500, type: 'shadow' },
    { name: 'MECH SUIT', w: 65, h: 85, hp: 400, speed: 55, damage: 25, color: '#667788', skin: '#99aacc', attackRange: 140, attackCooldown: 1.4, score: 2000, type: 'mech' },
    { name: 'TWIN TERROR', w: 44, h: 66, hp: 180, speed: 100, damage: 15, color: '#884488', skin: '#d0a880', attackRange: 50, attackCooldown: 1.0, score: 1200, type: 'twin' },
    { name: 'DR. CHAOS', w: 55, h: 78, hp: 500, speed: 90, damage: 20, color: '#aa0000', skin: '#e0c090', attackRange: 60, attackCooldown: 1.2, score: 3000, type: 'chaos' },
];

const LEVELS = [
    {
        name: 'City Park', width: 4800, sky: ['#87CEEB','#c8e8ff'], ground: '#4a7c3f', groundAlt: '#3d6b34',
        bgElements: 'park',
        waves: [
            { triggerX: 300, enemies: [{ type: 'goon', count: 2 }] },
            { triggerX: 900, enemies: [{ type: 'goon', count: 3 }] },
            { triggerX: 1500, enemies: [{ type: 'goon', count: 3 }] },
            { triggerX: 2200, enemies: [{ type: 'goon', count: 4 }] },
            { triggerX: 3000, enemies: [{ type: 'goon', count: 3 }] },
            { triggerX: 3800, enemies: [{ type: 'goon', count: 4 }] },
        ],
        boss: 0
    },
    {
        name: 'Downtown', width: 5200, sky: ['#667799','#aabbdd'], ground: '#777777', groundAlt: '#666666',
        bgElements: 'city',
        waves: [
            { triggerX: 300, enemies: [{ type: 'goon', count: 3 }] },
            { triggerX: 900, enemies: [{ type: 'goon', count: 2 }, { type: 'brute', count: 1 }] },
            { triggerX: 1600, enemies: [{ type: 'brute', count: 2 }] },
            { triggerX: 2400, enemies: [{ type: 'goon', count: 3 }, { type: 'brute', count: 1 }] },
            { triggerX: 3200, enemies: [{ type: 'goon', count: 2 }, { type: 'brute', count: 2 }] },
            { triggerX: 4200, enemies: [{ type: 'goon', count: 3 }, { type: 'brute', count: 1 }] },
        ],
        boss: 1
    },
    {
        name: 'Rooftops', width: 5000, sky: ['#0a0a2e','#1a1a4e'], ground: '#555566', groundAlt: '#444455',
        bgElements: 'rooftop',
        waves: [
            { triggerX: 300, enemies: [{ type: 'ninja', count: 2 }] },
            { triggerX: 900, enemies: [{ type: 'goon', count: 2 }, { type: 'ninja', count: 2 }] },
            { triggerX: 1600, enemies: [{ type: 'ninja', count: 3 }] },
            { triggerX: 2400, enemies: [{ type: 'goon', count: 3 }, { type: 'ninja', count: 1 }] },
            { triggerX: 3200, enemies: [{ type: 'ninja', count: 3 }, { type: 'goon', count: 1 }] },
            { triggerX: 4000, enemies: [{ type: 'ninja', count: 4 }] },
        ],
        boss: 2
    },
    {
        name: 'Robot Factory', width: 5400, sky: ['#222233','#334455'], ground: '#556677', groundAlt: '#445566',
        bgElements: 'factory',
        waves: [
            { triggerX: 300, enemies: [{ type: 'robot', count: 2 }] },
            { triggerX: 900, enemies: [{ type: 'robot', count: 2 }, { type: 'brute', count: 1 }] },
            { triggerX: 1600, enemies: [{ type: 'brute', count: 2 }, { type: 'robot', count: 1 }] },
            { triggerX: 2400, enemies: [{ type: 'robot', count: 3 }] },
            { triggerX: 3400, enemies: [{ type: 'robot', count: 2 }, { type: 'brute', count: 2 }] },
            { triggerX: 4400, enemies: [{ type: 'robot', count: 3 }, { type: 'brute', count: 1 }] },
        ],
        boss: 3
    },
    {
        name: 'Final Fortress', width: 6000, sky: ['#1a0a0a','#3a1a2a'], ground: '#443333', groundAlt: '#332222',
        bgElements: 'fortress',
        waves: [
            { triggerX: 300, enemies: [{ type: 'goon', count: 2 }, { type: 'ninja', count: 1 }] },
            { triggerX: 1000, enemies: [{ type: 'brute', count: 1 }, { type: 'robot', count: 2 }] },
            { triggerX: 1800, enemies: [{ type: 'ninja', count: 2 }, { type: 'robot', count: 1 }] },
            { triggerX: 2600, enemies: [{ type: 'goon', count: 2 }, { type: 'brute', count: 1 }, { type: 'ninja', count: 1 }] },
            { triggerX: 3500, enemies: [{ type: 'robot', count: 2 }, { type: 'ninja', count: 2 }] },
            { triggerX: 4500, enemies: [{ type: 'brute', count: 2 }, { type: 'robot', count: 2 }] },
        ],
        boss: 4
    },
    {
        name: 'Islamabad Streets', width: 5500, sky: ['#6cacdf','#c8e0f0'], ground: '#707a6a', groundAlt: '#606a5a',
        bgElements: 'islamabad',
        waves: [
            { triggerX: 300, enemies: [{ type: 'goon', count: 3 }] },
            { triggerX: 900, enemies: [{ type: 'goon', count: 2 }, { type: 'brute', count: 1 }] },
            { triggerX: 1600, enemies: [{ type: 'brute', count: 2 }, { type: 'goon', count: 2 }] },
            { triggerX: 2400, enemies: [{ type: 'goon', count: 3 }, { type: 'brute', count: 2 }] },
            { triggerX: 3400, enemies: [{ type: 'ninja', count: 2 }, { type: 'goon', count: 2 }] },
            { triggerX: 4500, enemies: [{ type: 'brute', count: 2 }, { type: 'goon', count: 3 }] },
        ],
        boss: 0
    },
    {
        name: 'Haunted Castle', width: 5800, sky: ['#1a0a2e','#3a2a4e'], ground: '#3a3a44', groundAlt: '#2e2e38',
        bgElements: 'castle',
        waves: [
            { triggerX: 300, enemies: [{ type: 'ninja', count: 2 }] },
            { triggerX: 800, enemies: [{ type: 'ninja', count: 3 }] },
            { triggerX: 1500, enemies: [{ type: 'ninja', count: 2 }, { type: 'goon', count: 2 }] },
            { triggerX: 2200, enemies: [{ type: 'ninja', count: 3 }, { type: 'brute', count: 1 }] },
            { triggerX: 3000, enemies: [{ type: 'ninja', count: 4 }] },
            { triggerX: 3800, enemies: [{ type: 'ninja', count: 3 }, { type: 'robot', count: 1 }] },
            { triggerX: 4700, enemies: [{ type: 'ninja', count: 4 }, { type: 'brute', count: 1 }] },
        ],
        boss: 1
    },
    {
        name: 'Space Arena', width: 6500, sky: ['#050510','#0a0a20'], ground: '#4a4a5a', groundAlt: '#3e3e4e',
        bgElements: 'space',
        waves: [
            { triggerX: 300, enemies: [{ type: 'robot', count: 2 }, { type: 'goon', count: 1 }] },
            { triggerX: 900, enemies: [{ type: 'ninja', count: 2 }, { type: 'robot', count: 1 }] },
            { triggerX: 1600, enemies: [{ type: 'brute', count: 2 }, { type: 'ninja', count: 2 }] },
            { triggerX: 2400, enemies: [{ type: 'robot', count: 2 }, { type: 'brute', count: 1 }, { type: 'goon', count: 2 }] },
            { triggerX: 3200, enemies: [{ type: 'ninja', count: 3 }, { type: 'robot', count: 2 }] },
            { triggerX: 4000, enemies: [{ type: 'brute', count: 2 }, { type: 'robot', count: 2 }, { type: 'ninja', count: 1 }] },
            { triggerX: 4800, enemies: [{ type: 'goon', count: 2 }, { type: 'brute', count: 2 }, { type: 'ninja', count: 2 }] },
            { triggerX: 5600, enemies: [{ type: 'robot', count: 3 }, { type: 'brute', count: 2 }, { type: 'ninja', count: 2 }] },
        ],
        boss: 4
    },
];

// --- BODY SCALE CONSTANTS ---
const BODY_SCALE_MIN = 0.6;
const BODY_SCALE_MAX = 1.5;
const BODY_SCALE_LERP = 3.0;

// --- ATTACK DATA (punch and kick combos) ---
const ATTACK_DATA = {
    punch: [
        { name: 'jab', damage: 10, knockback: 80, range: 55, activeFrame: 1, totalFrames: 3, frameDur: 0.09, type: 'punch' },
        { name: 'cross', damage: 15, knockback: 120, range: 60, activeFrame: 1, totalFrames: 3, frameDur: 0.1, type: 'punch' },
        { name: 'uppercut', damage: 28, knockback: 250, range: 65, activeFrame: 2, totalFrames: 4, frameDur: 0.1, type: 'punch' },
    ],
    kick: [
        { name: 'low_kick', damage: 12, knockback: 100, range: 60, activeFrame: 1, totalFrames: 3, frameDur: 0.08, type: 'kick' },
        { name: 'high_kick', damage: 18, knockback: 150, range: 65, activeFrame: 2, totalFrames: 4, frameDur: 0.09, type: 'kick' },
        { name: 'spin_kick', damage: 30, knockback: 280, range: 70, activeFrame: 2, totalFrames: 4, frameDur: 0.1, type: 'kick' },
    ],
};

// --- WEAPON DATA ---
const WEAPON_DATA = {
    bat: {
        name: 'Baseball Bat', duration: 18,
        attacks: [
            { name: 'bat_swing', damage: 22, knockback: 250, range: 75, activeFrame: 2, totalFrames: 4, frameDur: 0.14, type: 'punch' },
            { name: 'bat_slam', damage: 35, knockback: 350, range: 80, activeFrame: 2, totalFrames: 5, frameDur: 0.16, type: 'punch' },
        ],
        color: '#8B4513', dropOnHit: true,
    },
    nunchucks: {
        name: 'Nunchucks', duration: 15,
        attacks: [
            { name: 'nunchuck_l', damage: 8, knockback: 60, range: 55, activeFrame: 1, totalFrames: 2, frameDur: 0.06, type: 'punch' },
            { name: 'nunchuck_r', damage: 8, knockback: 60, range: 55, activeFrame: 1, totalFrames: 2, frameDur: 0.06, type: 'punch' },
            { name: 'nunchuck_spin', damage: 20, knockback: 180, range: 65, activeFrame: 1, totalFrames: 3, frameDur: 0.07, type: 'punch' },
        ],
        color: '#654321', dropOnHit: true,
    },
    sword: {
        name: 'Sword', duration: 20,
        attacks: [
            { name: 'sword_slash', damage: 25, knockback: 180, range: 85, activeFrame: 1, totalFrames: 3, frameDur: 0.1, type: 'punch' },
            { name: 'sword_thrust', damage: 30, knockback: 200, range: 95, activeFrame: 2, totalFrames: 4, frameDur: 0.12, type: 'punch' },
        ],
        color: '#C0C0C0', dropOnHit: false,
    },
    stars: {
        name: 'Throwing Stars', duration: 999, ammo: 5,
        attacks: [],
        color: '#AAA', dropOnHit: false,
    },
};

// --- GLOBALS ---
let canvas, ctx;
let gameState = 'menu';
let selectedHero = 0;
let selectedLevel = 0;
let player = null;
let enemies = [];
let particles = [];
let pickups = [];
let projectiles = [];
let damageNumbers = [];
let camera = { x: 0, y: 0, shakeX: 0, shakeY: 0, shakeIntensity: 0, shakeTime: 0 };
let hitStopTimer = 0;
let score = 0;
let lives = 3;
let specialMeter = 0;
let comboCount = 0;
let comboTimer = 0;
let comboDisplayTimer = 0;
let maxComboDisplay = 0;
let waveIndex = 0;
let waveLocked = false;
let waveEnemiesAlive = 0;
let bossActive = false;
let boss = null;
let levelComplete = false;
let goArrowTimer = 0;
let levelIntroTimer = 0;
let bossIntroTimer = 0;
let lastTime = 0;
let isMobile = false;
let audioCtx = null;
let audioInitialized = false;
let bgElements = [];
let savedProgress = { unlocked: 1, scores: [0,0,0,0,0], stars: [0,0,0,0,0] };

// --- NEW VISUAL GLOBALS ---
let impactEffects = [];
let ambientParticles = [];
let screenFlashAlpha = 0;
let transitionAlpha = 0;
let hudShakeTimer = 0;
let scoreDisplayTimer = 0;
let lastScore = 0;

const keys = {};
const mobileInput = { left: false, right: false, up: false, down: false, attack: false, kick: false, jump: false, special: false };
let joystickActive = false;
let joystickId = null;
let joystickBaseX = 0, joystickBaseY = 0;

// --- UTILITY FUNCTIONS ---
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
function rnd(a, b) { return a + Math.random() * (b - a); }
function rndInt(a, b) { return Math.floor(rnd(a, b + 1)); }
function dist(x1, y1, x2, y2) { return Math.sqrt((x2-x1)**2 + (y2-y1)**2); }
function rectsOverlap(x1,y1,w1,h1, x2,y2,w2,h2) {
    return x1 < x2+w2 && x1+w1 > x2 && y1 < y2+h2 && y1+h1 > y2;
}

// --- GRAPHICS HELPER FUNCTIONS ---
function shadeColor(color, amt) {
    if (!color || typeof color !== 'string') return '#888888';
    // Handle HSL colors
    if (color.startsWith('hsl')) {
        const m = color.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/);
        if (m) {
            const l = Math.max(0, Math.min(100, parseFloat(m[3]) * (1 + amt)));
            return `hsl(${m[1]}, ${m[2]}%, ${l.toFixed(1)}%)`;
        }
        return color;
    }
    // Handle RGB/RGBA
    if (color.startsWith('rgb')) return color;
    // Handle hex
    let hex = color.replace('#','');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    let r = parseInt(hex.substr(0,2),16), g = parseInt(hex.substr(2,2),16), b = parseInt(hex.substr(4,2),16);
    if (isNaN(r)) r = 128; if (isNaN(g)) g = 128; if (isNaN(b)) b = 128;
    r = Math.max(0, Math.min(255, Math.round(r * (1 + amt))));
    g = Math.max(0, Math.min(255, Math.round(g * (1 + amt))));
    b = Math.max(0, Math.min(255, Math.round(b * (1 + amt))));
    return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

function drawRR(ctx, x, y, w, h, r, fill, stroke, strokeW) {
    r = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
    ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
    ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
    ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
    ctx.closePath();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeW || 2; ctx.stroke(); }
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
}

function drawGradRect(ctx, x, y, w, h, c1, c2, r, vertical) {
    const g = vertical !== false
        ? ctx.createLinearGradient(x, y, x, y+h)
        : ctx.createLinearGradient(x, y, x+w, y);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    r = r || 0;
    if (r > 0) { drawRR(ctx, x, y, w, h, r, null); ctx.fillStyle = g; ctx.fill(); }
    else { ctx.fillStyle = g; ctx.fillRect(x, y, w, h); }
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    if (r > 0) { drawRR(ctx, x, y, w, h, r, null, '#000', 2); }
    else { ctx.strokeRect(x-1, y-1, w+2, h+2); }
}

function drawGradCircle(ctx, x, y, r, cCenter, cEdge) {
    const g = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.1, x, y, r);
    g.addColorStop(0, cCenter); g.addColorStop(1, cEdge);
    ctx.beginPath(); ctx.arc(x, y, r + 2, 0, Math.PI*2);
    ctx.fillStyle = '#000'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fillStyle = g; ctx.fill();
}

function drawStar(ctx, cx, cy, outerR, innerR, pts, rot, fill) {
    ctx.beginPath();
    for (let i = 0; i < pts * 2; i++) {
        const r2 = i % 2 === 0 ? outerR : innerR;
        const a = rot + (i * Math.PI / pts);
        const method = i === 0 ? 'moveTo' : 'lineTo';
        ctx[method](cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    }
    ctx.closePath();
    ctx.fillStyle = fill || '#fff'; ctx.fill();
}

function drawImpactBurst(ctx, x, y, size, color, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    const spikes = 8;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? size : size * 0.4;
        const a = (i * Math.PI / spikes);
        const method = i === 0 ? 'moveTo' : 'lineTo';
        ctx[method](x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
}

function drawSpeedLines(ctx, x, y, facing, count, len, alpha) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    for (let i = 0; i < count; i++) {
        const a = (Math.random() - 0.5) * 1.2 + (facing > 0 ? Math.PI : 0);
        const l = len * (0.5 + Math.random() * 0.5);
        ctx.beginPath();
        ctx.moveTo(x, y + (Math.random() - 0.5) * 40);
        ctx.lineTo(x + Math.cos(a) * l, y + (Math.random() - 0.5) * 40 + Math.sin(a) * l);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

function drawSoftGlow(ctx, x, y, r, color, alpha) {
    for (let i = 3; i >= 0; i--) {
        ctx.globalAlpha = alpha * (0.25 - i * 0.05);
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, r * (1 + i * 0.3), 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// --- SOUND SYSTEM ---
function initAudio() {
    if (audioInitialized) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioInitialized = true;
    } catch(e) {}
}

function playSound(type) {
    if (!audioCtx) return;
    try {
        switch(type) {
            case 'punch': synthHit(400, 100, 0.05, 'square'); break;
            case 'kick': synthHit(200, 60, 0.08, 'sawtooth'); break;
            case 'hurt': synthHit(300, 200, 0.15, 'triangle', true); break;
            case 'jump': synthSweep(200, 600, 0.12); break;
            case 'land': synthHit(100, 50, 0.04, 'sine'); break;
            case 'powerup': synthArpeggio([523, 659, 784, 1047], 0.08); break;
            case 'combo': synthArpeggio([440, 554, 659], 0.06); break;
            case 'special': synthSweep(100, 800, 0.3); synthHit(150, 80, 0.2, 'sawtooth'); break;
            case 'boss': synthSweep(60, 200, 0.5); break;
            case 'victory': synthArpeggio([523, 659, 784, 1047, 1319], 0.15); break;
            case 'defeat': synthSweep(400, 100, 0.4); break;
            case 'select': synthHit(1000, 800, 0.03, 'sine'); break;
            case 'block': synthHit(600, 300, 0.06, 'square'); break;
            case 'bat': synthHit(150, 50, 0.1, 'square'); break;
            case 'sword': synthSweep(800, 200, 0.08); synthHit(1200, 400, 0.04, 'sine'); break;
            case 'nunchuck': synthSweep(400, 800, 0.05); synthHit(600, 200, 0.03, 'sine'); break;
            case 'star': synthSweep(1000, 2000, 0.06); break;
        }
    } catch(e) {}
}

function synthHit(startFreq, endFreq, dur, type, vibrato) {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), t + dur);
    if (vibrato) {
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = 20;
        lfoGain.gain.value = 50;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(t); lfo.stop(t + dur);
    }
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + dur);
}

function synthSweep(startFreq, endFreq, dur) {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), t + dur);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + dur);
}

function synthArpeggio(notes, noteDur) {
    const t = audioCtx.currentTime;
    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t + i * noteDur);
        gain.gain.linearRampToValueAtTime(0.12, t + i * noteDur + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + (i + 1) * noteDur);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(t + i * noteDur); osc.stop(t + (i + 1) * noteDur + 0.05);
    });
}

// --- PARTICLE SYSTEM ---
function emitParticles(x, y, type, facing) {
    const configs = {
        hit: { count: 8, spread: 200, upward: 150, life: 0.3, colors: ['#ffff00','#ff8800','#ffffff'], size: 5, gravity: 200, shape: 'star' },
        dust: { count: 5, spread: 80, upward: 60, life: 0.25, colors: ['#aa9977','#887755'], size: 4, gravity: 100, shape: 'soft' },
        star: { count: 6, spread: 100, upward: 120, life: 0.5, colors: ['#ffff00','#ffcc00','#ffffff'], size: 6, gravity: -20, shape: 'sparkle' },
        powerup: { count: 12, spread: 120, upward: 200, life: 0.6, colors: ['#ff44ff','#44ffff','#ffff44','#44ff44'], size: 5, gravity: -50, shape: 'sparkle' },
        explosion: { count: 25, spread: 300, upward: 250, life: 0.6, colors: ['#ff4400','#ffaa00','#ffff00','#ffffff'], size: 7, gravity: 150, shape: 'star' },
        confetti: { count: 30, spread: 200, upward: 350, life: 1.5, colors: ['#ff4444','#44ff44','#4444ff','#ffff44','#ff44ff','#44ffff'], size: 6, gravity: 120, shape: 'rect' },
        block: { count: 4, spread: 60, upward: 40, life: 0.2, colors: ['#88ccff','#aaddff'], size: 4, gravity: 0, shape: 'diamond' },
        special: { count: 20, spread: 250, upward: 200, life: 0.5, colors: ['#ffaa00','#ffcc44','#ffffff','#ff6600'], size: 8, gravity: -30, shape: 'sparkle' },
    };
    const c = configs[type] || configs.hit;
    const dir = facing || 1;
    for (let i = 0; i < c.count; i++) {
        if (particles.length >= MAX_PARTICLES) particles.shift();
        particles.push({
            x, y,
            vx: (Math.random() - 0.3) * c.spread * dir,
            vy: -Math.random() * c.upward,
            life: c.life * (0.7 + Math.random() * 0.6),
            maxLife: c.life,
            color: c.colors[Math.floor(Math.random() * c.colors.length)],
            size: c.size * (0.6 + Math.random() * 0.8),
            gravity: c.gravity,
            shape: c.shape || 'circle',
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 8,
        });
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        p.life -= dt;
        if (p.rotation !== undefined) p.rotation += (p.rotationSpeed || 0) * dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function renderParticles(ctx) {
    for (const p of particles) {
        const alpha = clamp(p.life / p.maxLife, 0, 1);
        ctx.globalAlpha = alpha;
        const px2 = p.x - camera.x;
        const s = p.size * alpha;

        switch(p.shape) {
            case 'star':
                drawStar(ctx, px2, p.y, s, s * 0.4, 4, p.rotation || 0, p.color);
                break;
            case 'soft':
                const dg = ctx.createRadialGradient(px2, p.y, 0, px2, p.y, s);
                dg.addColorStop(0, p.color);
                dg.addColorStop(1, 'transparent');
                ctx.fillStyle = dg;
                ctx.beginPath(); ctx.arc(px2, p.y, s * 1.5, 0, Math.PI*2); ctx.fill();
                break;
            case 'rect':
                ctx.save(); ctx.translate(px2, p.y); ctx.rotate(p.rotation || 0);
                ctx.fillStyle = p.color;
                ctx.fillRect(-s/2, -s/4, s, s/2);
                ctx.restore();
                break;
            case 'sparkle':
                ctx.save(); ctx.translate(px2, p.y); ctx.rotate(p.rotation || 0);
                ctx.fillStyle = p.color;
                ctx.fillRect(-s/2, -1, s, 2);
                ctx.fillRect(-1, -s/2, 2, s);
                ctx.restore();
                break;
            case 'diamond':
                ctx.save(); ctx.translate(px2, p.y); ctx.rotate(Math.PI/4 + (p.rotation || 0));
                ctx.fillStyle = p.color;
                ctx.fillRect(-s/2, -s/2, s, s);
                ctx.restore();
                break;
            default:
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(px2, p.y, s, 0, Math.PI*2); ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
}

// --- DAMAGE NUMBERS ---
function spawnDamageNumber(x, y, damage, type) {
    damageNumbers.push({
        x, y, text: '' + Math.round(damage),
        color: type === 'combo' ? '#ffcc00' : type === 'weapon' ? '#44ffff' : type === 'critical' ? '#ff4444' : '#ffffff',
        scale: 0.8 + damage / 40,
        life: 0.8, maxLife: 0.8, vy: -120,
    });
}

function updateDamageNumbers(dt) {
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const d = damageNumbers[i];
        d.y += d.vy * dt;
        d.life -= dt;
        if (d.life <= 0) damageNumbers.splice(i, 1);
    }
}

function renderDamageNumbers(ctx) {
    for (const d of damageNumbers) {
        const alpha = clamp(d.life / d.maxLife, 0, 1);
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${Math.round(20 * d.scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
        ctx.strokeText(d.text, d.x - camera.x, d.y);
        ctx.fillStyle = d.color;
        ctx.fillText(d.text, d.x - camera.x, d.y);
    }
    ctx.globalAlpha = 1;
}

// --- PROCEDURAL DRAWING (legacy helpers kept for menus) ---
function drawOutlinedRect(ctx, x, y, w, h, fill, outW) {
    ctx.fillStyle = '#000';
    ctx.fillRect(x - outW, y - outW, w + outW*2, h + outW*2);
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
}

function drawOutlinedCircle(ctx, x, y, r, fill, outW) {
    ctx.beginPath(); ctx.arc(x, y, r + outW, 0, Math.PI*2);
    ctx.fillStyle = '#000'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fillStyle = fill; ctx.fill();
}

// --- NEW EYES DRAWING ---
function drawEyes(ctx, x, y, facing, hurt, state) {
    if (hurt) {
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x-6, y-3); ctx.lineTo(x-1, y+2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x-6, y+2); ctx.lineTo(x-1, y-3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+1, y-3); ctx.lineTo(x+6, y+2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+1, y+2); ctx.lineTo(x+6, y-3); ctx.stroke();
        return;
    }
    const ex = facing * 2;
    const isAtk = state === 'attacking' || state === 'attack1' || state === 'special' || state === 'slide';

    // Eyebrows
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    const browAngle = isAtk ? -0.4 : 0.1;
    ctx.beginPath();
    ctx.moveTo(x - 8 + ex, y - 6 + (isAtk ? -1 : 0));
    ctx.lineTo(x - 2 + ex, y - 6 + browAngle * 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 2 + ex, y - 6 + browAngle * 4);
    ctx.lineTo(x + 8 + ex, y - 6 + (isAtk ? -1 : 0));
    ctx.stroke();

    // Eyes with gradient
    drawGradCircle(ctx, x - 5 + ex, y, 4, '#fff', '#ddd');
    drawGradCircle(ctx, x + 5 + ex, y, 4, '#fff', '#ddd');
    // Pupils
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(x - 4 + ex + facing * 2, y + 0.5, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 6 + ex + facing * 2, y + 0.5, 2, 0, Math.PI*2); ctx.fill();
    // Highlights
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x - 3 + ex + facing, y - 1, 1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 7 + ex + facing, y - 1, 1, 0, Math.PI*2); ctx.fill();

    // Nose
    ctx.strokeStyle = shadeColor(ctx._skinColor || '#e8b87a', -0.2);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + ex * 0.5, y + 5, 2.5, 0.3, Math.PI - 0.3);
    ctx.stroke();
}

// --- NEW MOUTH DRAWING ---
function drawMouth(ctx, x, y, state, comboCount) {
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    const isAtk = state === 'attacking' || state === 'attack1' || state === 'special' || state === 'slide';
    if (state === 'hurt' || state === 'dead') {
        ctx.beginPath(); ctx.arc(x, y + 5, 4, 0.2, Math.PI - 0.2); ctx.stroke();
    } else if (isAtk) {
        const mSize = 4 + Math.min(comboCount || 0, 5);
        ctx.beginPath(); ctx.arc(x, y, mSize, 0.1, Math.PI - 0.1);
        ctx.fillStyle = '#600'; ctx.fill(); ctx.stroke();
        if (comboCount >= 3) {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x - mSize + 2, y); ctx.lineTo(x + mSize - 2, y); ctx.stroke();
        }
    } else if (state === 'block') {
        ctx.beginPath(); ctx.moveTo(x - 4, y + 2); ctx.lineTo(x + 4, y + 2); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
        for (let t = -3; t <= 3; t += 2) {
            ctx.beginPath(); ctx.moveTo(x + t, y + 1); ctx.lineTo(x + t, y + 3); ctx.stroke();
        }
    } else {
        ctx.beginPath(); ctx.arc(x, y + 1, 4, 0.1, Math.PI - 0.1); ctx.stroke();
    }
}

// --- CHARACTER DRAWING ---
function drawCharacter(ctx, entity, colors, isEnemy) {
    const { x, y, w, h, facing, state, animFrame, flashTimer, invincible } = entity;
    const sx = x - camera.x;
    const sy = y;

    if (invincible > 0 && Math.floor(invincible * 20) % 2 === 0) return;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(facing, 1);

    // Apply body scale for player
    const bodyScale = entity.bodyScale || 1;
    ctx.scale(bodyScale, bodyScale);

    const isHurt = state === 'hurt' || state === 'dead';
    const isAttack = state === 'attack1' || state === 'attack2' || state === 'attack3' || state === 'attacking' || state === 'special';
    const isKick = isAttack && entity.currentAttack && entity.currentAttack.type === 'kick';
    const isSlide = state === 'slide';
    const isWalk = state === 'walk';
    const isJump = state === 'jump' || state === 'jump_attack';
    const isBlock = state === 'block';

    // flash white on hit
    if (flashTimer > 0) {
        ctx.globalCompositeOperation = 'source-atop';
    }

    const bob = isWalk ? Math.sin(animFrame * 3) * 3 : 0;
    const headY = -h + bob;
    const slideOffset = isSlide ? 15 : 0;

    // --- Gradient shadow that scales with jump height ---
    const shadowScale = entity.grounded ? 1 : 0.5;
    const shadowAlpha = entity.grounded ? 0.25 : 0.12;
    ctx.globalAlpha = shadowAlpha;
    const sg = ctx.createRadialGradient(0, 4, 0, 0, 4, w * 0.6 * shadowScale);
    sg.addColorStop(0, 'rgba(0,0,0,0.5)');
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.ellipse(0, 4, w * 0.7 * shadowScale, 8 * shadowScale, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;

    // --- Player glow ---
    if (!isEnemy) {
        drawSoftGlow(ctx, 0, -h/2, h * 0.5, colors.shirt, 0.1);
    }

    // --- LEGS ---
    if (isKick) {
        // Back leg stays normal
        drawGradRect(ctx, -10, -h * 0.4, 8, h * 0.4, colors.pants, shadeColor(colors.pants, -0.25), 3);
        // Front leg extends forward (kick)
        const kickExt = animFrame === (entity.currentAttack ? entity.currentAttack.activeFrame : 1) ? 25 : 12;
        ctx.save();
        ctx.translate(0, -h * 0.35);
        ctx.rotate(-0.3);
        drawGradRect(ctx, 2, 0, 8, h * 0.3 + kickExt, colors.pants, shadeColor(colors.pants, -0.25), 3);
        // Shoe at end of kick
        drawRR(ctx, 0, h * 0.3 + kickExt - 2, 12, 6, 4, '#333', '#000', 2);
        // Sole
        ctx.fillStyle = '#222';
        ctx.fillRect(0, h * 0.3 + kickExt + 2, 12, 2);
        ctx.restore();
        // Normal back shoe
        drawRR(ctx, -12, -2, 12, 6, 4, '#333', '#000', 2);
        ctx.fillStyle = '#222';
        ctx.fillRect(-12, 2, 12, 2);

        // Kick arc trail
        if (!isEnemy && animFrame >= 1) {
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = colors.pants; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, -h * 0.35, h * 0.3 + 15, -1.0, 0.5);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    } else if (isSlide) {
        drawGradRect(ctx, -5, -h * 0.2, 30, 8, colors.pants, shadeColor(colors.pants, -0.25), 3);
        drawRR(ctx, 22, -h * 0.2, 12, 6, 4, '#333', '#000', 2);
    } else {
        const legSpread = isWalk ? Math.sin(animFrame * 3) * 10 : (isJump ? 8 : 4);
        drawGradRect(ctx, -10, -h * 0.4, 8, h * 0.4 + (isJump ? -5 : 0), colors.pants, shadeColor(colors.pants, -0.25), 3);
        drawGradRect(ctx, 2 + (isWalk ? legSpread * 0.5 : 0), -h * 0.4, 8, h * 0.4 + (isJump ? -5 : 0), colors.pants, shadeColor(colors.pants, -0.25), 3);
        // Shoes
        drawRR(ctx, -12, -2, 12, 6, 4, '#333', '#000', 2);
        ctx.fillStyle = '#222';
        ctx.fillRect(-12, 2, 12, 2);
        drawRR(ctx, 0 + (isWalk ? legSpread * 0.5 : 0), -2, 12, 6, 4, '#333', '#000', 2);
        ctx.fillStyle = '#222';
        ctx.fillRect(0 + (isWalk ? legSpread * 0.5 : 0), 2, 12, 2);
    }

    // Body
    const bodyW = isEnemy ? w * 0.75 : w * 0.7;
    const bodyYOffset = isSlide ? slideOffset : 0;
    drawGradRect(ctx, -bodyW/2, -h * 0.72 + bob - bodyYOffset, bodyW, h * 0.35, colors.shirt, shadeColor(colors.shirt, -0.2), 5);
    // Subtle center line for body definition
    ctx.strokeStyle = shadeColor(colors.shirt, -0.1);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.72 + bob - bodyYOffset + 4);
    ctx.lineTo(0, -h * 0.72 + bob - bodyYOffset + h * 0.35 - 4);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // --- ARMS ---
    const armY = -h * 0.68 + bob - bodyYOffset;

    if (isKick) {
        // Arms in guard position when kicking
        drawGradRect(ctx, bodyW/2 - 4, armY, 8, 14, colors.skin, shadeColor(colors.skin, -0.15), 3);
        drawGradRect(ctx, -bodyW/2 - 4, armY, 8, 14, colors.skin, shadeColor(colors.skin, -0.15), 3);
    } else if (isSlide) {
        // Arms trailing behind during slide
        drawGradRect(ctx, -bodyW/2 - 10, armY + 4, 12, 10, colors.skin, shadeColor(colors.skin, -0.15), 3);
        drawGradRect(ctx, -bodyW/2 - 6, armY + 8, 10, 10, colors.skin, shadeColor(colors.skin, -0.15), 3);
    } else if (isAttack && !isKick) {
        const punchExt = animFrame === 1 ? 25 : (animFrame === 2 ? 20 : 10);

        // Check if entity has a weapon (for punch attacks)
        if (entity.weapon && entity.weapon !== 'stars') {
            const wColor = WEAPON_DATA[entity.weapon] ? WEAPON_DATA[entity.weapon].color : '#888';

            // Attacking arm
            drawGradRect(ctx, bodyW/2 - 2, armY, punchExt, 10, colors.skin, shadeColor(colors.skin, -0.15), 3);

            // Draw weapon in hand
            if (entity.weapon === 'bat') {
                ctx.save();
                ctx.translate(bodyW/2 + punchExt, armY);
                ctx.rotate(-0.5 + animFrame * 0.4);
                drawGradRect(ctx, 0, -3, 28, 6, wColor, shadeColor(wColor, -0.3), 2);
                ctx.restore();

                // Bat trail
                if (animFrame >= 1) {
                    ctx.globalAlpha = 0.35;
                    ctx.strokeStyle = '#ff8800'; ctx.lineWidth = 4; ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.arc(bodyW/2 + punchExt, armY, 24, -1 + animFrame * 0.5, 0.5 + animFrame * 0.3);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            } else if (entity.weapon === 'sword') {
                ctx.save();
                ctx.translate(bodyW/2 + punchExt, armY);
                ctx.rotate(-0.3 + animFrame * 0.3);
                // Blade
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(30, 0); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill();
                ctx.fillStyle = wColor;
                ctx.beginPath(); ctx.moveTo(1, -3); ctx.lineTo(28, 0); ctx.lineTo(1, 3); ctx.closePath(); ctx.fill();
                ctx.restore();

                // Sword trail
                if (animFrame >= 1) {
                    ctx.globalAlpha = 0.35;
                    ctx.strokeStyle = '#aabbff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.arc(bodyW/2 + punchExt, armY, 26, -1 + animFrame * 0.5, 0.5 + animFrame * 0.3);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            } else if (entity.weapon === 'nunchucks') {
                drawGradCircle(ctx, bodyW/2 + punchExt + 5, armY + 2, 4, shadeColor(wColor, 0.2), wColor);
                drawGradCircle(ctx, bodyW/2 + punchExt + 18, armY - 3 + Math.sin(animFrame * 3) * 5, 4, shadeColor(wColor, 0.2), wColor);
                ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(bodyW/2 + punchExt + 5, armY + 2); ctx.lineTo(bodyW/2 + punchExt + 18, armY - 3 + Math.sin(animFrame * 3) * 5); ctx.stroke();
            }

            // Off-hand guard
            drawGradRect(ctx, -bodyW/2 - 6, armY + 4, 10, 14, colors.skin, shadeColor(colors.skin, -0.15), 3);
        } else {
            // Normal punch (no weapon or stars weapon)
            drawGradRect(ctx, bodyW/2 - 2, armY, punchExt, 10, colors.skin, shadeColor(colors.skin, -0.15), 3);
            // Fist as gradient circle
            drawGradCircle(ctx, bodyW/2 + punchExt + 2, armY + 5, 6, isEnemy ? colors.shirt : '#ffdd44', isEnemy ? shadeColor(colors.shirt, -0.2) : '#ff8800');

            // Punch trail effect (player only)
            if (!isEnemy) {
                for (let trail = 1; trail <= 2; trail++) {
                    ctx.globalAlpha = 0.3 / trail;
                    drawGradCircle(ctx, bodyW/2 + punchExt - 4 - trail * 10, armY + 5, 5, '#ffcc00', '#ff8800');
                }
                ctx.globalAlpha = 1;
            }

            drawGradRect(ctx, -bodyW/2 - 6, armY + 4, 10, 14, colors.skin, shadeColor(colors.skin, -0.15), 3);
        }
    } else if (isBlock) {
        drawGradRect(ctx, -4, armY - 4, 16, 12, colors.skin, shadeColor(colors.skin, -0.15), 3);
        drawGradRect(ctx, -4, armY + 8, 16, 12, colors.skin, shadeColor(colors.skin, -0.15), 3);
    } else {
        const armSwing = isWalk ? Math.sin(animFrame * 3) * 6 : 0;
        drawGradRect(ctx, bodyW/2, armY + armSwing, 10, 16, colors.skin, shadeColor(colors.skin, -0.15), 3);
        drawGradRect(ctx, -bodyW/2 - 8, armY - armSwing, 10, 16, colors.skin, shadeColor(colors.skin, -0.15), 3);

        // Show stars in hand during idle/walk
        if (entity.weapon === 'stars' && !isAttack) {
            const starX = bodyW/2 + 6;
            const starY = armY + 6;
            drawStar(ctx, starX, starY, 5, 2.5, 5, -Math.PI/2, '#AAA');
        }
    }

    // Head
    const headR = isEnemy ? (entity.bossType ? 18 : 14) : 15;
    const headYDraw = isSlide ? headY - headR + bob - bodyYOffset : headY - headR + bob;
    drawGradCircle(ctx, 0, headYDraw, headR, colors.skin, shadeColor(colors.skin, -0.15));

    // --- Spiky hair ---
    const hairColor = colors.hair || colors.shirt;
    const spikeCount = 5 + (isEnemy ? 0 : 2);
    const hairTop = headYDraw - headR * 0.6;
    const hairBase = headYDraw - headR * 0.2;
    // Black outline
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(-headR - 2, hairBase + 2);
    for (let s = 0; s < spikeCount; s++) {
        const sx2 = -headR + (s / (spikeCount-1)) * headR * 2;
        const spikeH = 6 + (s % 2) * 5 + (s === Math.floor(spikeCount/2) ? 4 : 0);
        ctx.lineTo(sx2, hairTop - spikeH - 2);
        ctx.lineTo(sx2 + headR/(spikeCount-1) * 0.7, hairBase + 2);
    }
    ctx.lineTo(headR + 2, hairBase + 2);
    ctx.closePath(); ctx.fill();
    // Color fill
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.moveTo(-headR, hairBase + 1);
    for (let s = 0; s < spikeCount; s++) {
        const sx2 = -headR + (s / (spikeCount-1)) * headR * 2;
        const spikeH = 5 + (s % 2) * 5 + (s === Math.floor(spikeCount/2) ? 4 : 0);
        ctx.lineTo(sx2, hairTop - spikeH);
        ctx.lineTo(sx2 + headR/(spikeCount-1) * 0.7, hairBase + 1);
    }
    ctx.lineTo(headR, hairBase + 1);
    ctx.closePath(); ctx.fill();

    // Eyes & mouth
    ctx._skinColor = colors.skin;
    drawEyes(ctx, 0, headYDraw + 4, 1, isHurt, state);
    drawMouth(ctx, 0, headYDraw + 10, state, comboCount);

    // Special effects for enemies
    if (isEnemy && entity.bossType) {
        // Crown/helmet for bosses - gradient gold with detail
        const crownG = ctx.createLinearGradient(-12, headYDraw - headR - 12, 14, headYDraw - headR - 2);
        crownG.addColorStop(0, '#ffee44');
        crownG.addColorStop(0.5, '#ffcc00');
        crownG.addColorStop(1, '#cc9900');
        ctx.fillStyle = crownG;
        ctx.beginPath();
        ctx.moveTo(-12, headYDraw - headR - 2);
        ctx.lineTo(-8, headYDraw - headR - 10);
        ctx.lineTo(-2, headYDraw - headR - 4);
        ctx.lineTo(2, headYDraw - headR - 12);
        ctx.lineTo(8, headYDraw - headR - 4);
        ctx.lineTo(12, headYDraw - headR - 10);
        ctx.lineTo(14, headYDraw - headR - 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
        // Gem on crown
        ctx.fillStyle = '#ff2244';
        ctx.beginPath(); ctx.arc(2, headYDraw - headR - 8, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
    }

    // White flash overlay - bright flash on hit
    if (flashTimer > 0) {
        ctx.globalCompositeOperation = 'source-atop';
        const flashAlpha = Math.min(1, flashTimer * 6);
        ctx.fillStyle = `rgba(255,255,255,${flashAlpha * 0.7})`;
        ctx.fillRect(-w * 1.5, -h * 2.5, w * 3, h * 3);
        ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
}

// --- BACKGROUND DRAWING ---
function generateBgElements(level) {
    bgElements = [];
    const lv = LEVELS[level];

    for (let x = 0; x < lv.width; x += rnd(100, 250)) {
        const type = lv.bgElements;
        if (type === 'park') {
            if (Math.random() < 0.5) {
                bgElements.push({ type: 'tree', x: x + rnd(0,50), size: rnd(40, 70) });
            } else {
                bgElements.push({ type: 'bush', x: x + rnd(0,50), size: rnd(20, 35) });
            }
        } else if (type === 'city') {
            bgElements.push({ type: 'building', x, w: rnd(60, 120), h: rnd(100, 250), color: `hsl(${rnd(200,240)}, ${rnd(10,30)}%, ${rnd(30,50)}%)` });
        } else if (type === 'rooftop') {
            bgElements.push({ type: 'building_bg', x, w: rnd(80, 150), h: rnd(150, 300), color: `hsl(${rnd(210,250)}, ${rnd(10,20)}%, ${rnd(15,30)}%)` });
        } else if (type === 'factory') {
            bgElements.push({ type: 'machine', x, w: rnd(50, 100), h: rnd(60, 120) });
        } else if (type === 'fortress') {
            bgElements.push({ type: 'pillar', x, h: rnd(100, 200) });
        } else if (type === 'islamabad') {
            if (Math.random() < 0.4) {
                bgElements.push({ type: 'isb_building', x, w: rnd(70, 130), h: rnd(80, 200), color: `hsl(${rnd(30,50)}, ${rnd(15,30)}%, ${rnd(55,75)}%)` });
            } else if (Math.random() < 0.5) {
                bgElements.push({ type: 'isb_tree', x: x + rnd(0,40), size: rnd(45, 80) });
            } else {
                bgElements.push({ type: 'isb_car', x: x + rnd(0,30), color: `hsl(${rnd(0,360)}, ${rnd(50,80)}%, ${rnd(40,60)}%)` });
            }
        } else if (type === 'castle') {
            if (Math.random() < 0.4) {
                bgElements.push({ type: 'castle_pillar', x, h: rnd(120, 250) });
            } else if (Math.random() < 0.5) {
                bgElements.push({ type: 'castle_torch', x: x + rnd(0,30), h: rnd(60, 100) });
            } else {
                bgElements.push({ type: 'castle_bat', x: x + rnd(0,60), y: rnd(30, 120), size: rnd(8, 16) });
            }
        } else if (type === 'space') {
            if (Math.random() < 0.35) {
                bgElements.push({ type: 'space_panel', x, w: rnd(60, 110), h: rnd(50, 100) });
            } else if (Math.random() < 0.5) {
                bgElements.push({ type: 'space_screen', x: x + rnd(0,30), w: rnd(40, 70), h: rnd(30, 55) });
            } else {
                bgElements.push({ type: 'space_tube', x: x + rnd(0,20), h: rnd(80, 160) });
            }
        }
    }

    // Clouds
    for (let i = 0; i < 8; i++) {
        bgElements.push({ type: 'cloud', x: rnd(0, lv.width), y: rnd(20, 100), size: rnd(30, 60) });
    }
}

function drawBackground(ctx, level) {
    const lv = LEVELS[level];

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, WALK_MIN_Y);
    grad.addColorStop(0, lv.sky[0]);
    grad.addColorStop(1, lv.sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, WALK_MIN_Y);

    // Sun / Moon
    if (level <= 1 || lv.bgElements === 'islamabad') {
        // Sun
        drawSoftGlow(ctx, W - 80, 60, 40, '#ffdd44', 0.15);
        drawGradCircle(ctx, W - 80, 60, 22, '#ffee66', '#ffaa00');
    } else {
        // Moon
        drawSoftGlow(ctx, 80, 50, 30, '#aabbff', 0.1);
        drawGradCircle(ctx, 80, 50, 16, '#eeeeff', '#aabbcc');
        // Stars
        for (let i = 0; i < 25; i++) {
            const starX = (i * 137 + level * 50) % W;
            const starY = (i * 73 + level * 30) % (WALK_MIN_Y - 30) + 10;
            const twinkle = 0.3 + Math.sin(Date.now() * 0.002 + i * 1.7) * 0.3;
            ctx.globalAlpha = twinkle;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(starX, starY, 1.2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // Ground
    ctx.fillStyle = lv.ground;
    ctx.fillRect(0, WALK_MIN_Y, W, H - WALK_MIN_Y);

    // Ground textures
    const groundType = lv.bgElements;
    if (groundType === 'park') {
        // Grass blades
        ctx.strokeStyle = shadeColor(lv.ground, 0.15);
        ctx.lineWidth = 1.5;
        for (let gx = Math.floor(-camera.x % 12); gx < W; gx += 12) {
            const gh = 4 + Math.sin(gx * 0.3) * 3;
            ctx.beginPath();
            ctx.moveTo(gx, WALK_MIN_Y);
            ctx.quadraticCurveTo(gx + 2, WALK_MIN_Y - gh, gx + 1, WALK_MIN_Y - gh - 2);
            ctx.stroke();
        }
    } else if (groundType === 'city') {
        // Subtle brick/concrete lines
        ctx.strokeStyle = shadeColor(lv.ground, -0.1); ctx.lineWidth = 0.5;
        for (let gy = WALK_MIN_Y + 20; gy < H; gy += 20) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
            const offset = (gy / 20) % 2 === 0 ? 0 : 25;
            for (let gx2 = offset; gx2 < W; gx2 += 50) {
                ctx.beginPath(); ctx.moveTo(gx2, gy); ctx.lineTo(gx2, gy + 20); ctx.stroke();
            }
        }
    } else if (groundType === 'rooftop') {
        // Roof tiles
        ctx.fillStyle = shadeColor(lv.ground, 0.08);
        for (let gy = WALK_MIN_Y; gy < H; gy += 12) {
            const offset = (gy / 12) % 2 === 0 ? 0 : 10;
            for (let gx2 = offset - camera.x % 20; gx2 < W; gx2 += 20) {
                drawRR(ctx, gx2, gy, 18, 10, 2, shadeColor(lv.ground, 0.05 + Math.sin(gx2*0.1)*0.03));
            }
        }
    } else if (groundType === 'factory') {
        // Metal plates with rivets
        ctx.strokeStyle = shadeColor(lv.ground, 0.1); ctx.lineWidth = 1;
        for (let gx2 = -camera.x % 60; gx2 < W; gx2 += 60) {
            ctx.strokeRect(gx2, WALK_MIN_Y + 5, 55, 40);
            ctx.fillStyle = shadeColor(lv.ground, 0.15);
            for (const corner of [[3,8],[50,8],[3,40],[50,40]]) {
                ctx.beginPath(); ctx.arc(gx2 + corner[0], WALK_MIN_Y + corner[1], 2, 0, Math.PI*2); ctx.fill();
            }
        }
    } else if (groundType === 'fortress') {
        // Stone blocks
        ctx.strokeStyle = shadeColor(lv.ground, -0.12); ctx.lineWidth = 1;
        for (let gy = WALK_MIN_Y; gy < H; gy += 18) {
            const offset = (gy / 18) % 2 === 0 ? 0 : 20;
            for (let gx2 = offset - camera.x % 40; gx2 < W; gx2 += 40) {
                ctx.strokeRect(gx2, gy, 38, 16);
            }
        }
    } else if (groundType === 'islamabad') {
        // Road markings and sidewalk
        ctx.fillStyle = shadeColor(lv.ground, -0.08);
        ctx.fillRect(0, WALK_MIN_Y + 30, W, 4);
        // Dashed center line
        ctx.fillStyle = '#cccc88';
        for (let gx2 = -camera.x % 40; gx2 < W; gx2 += 40) {
            ctx.fillRect(gx2, WALK_MIN_Y + 60, 20, 3);
        }
        // Sidewalk edge
        ctx.fillStyle = shadeColor(lv.ground, 0.12);
        ctx.fillRect(0, WALK_MIN_Y, W, 8);
    } else if (groundType === 'castle') {
        // Dark stone floor with cracks
        ctx.strokeStyle = shadeColor(lv.ground, -0.15); ctx.lineWidth = 0.8;
        for (let gy = WALK_MIN_Y; gy < H; gy += 22) {
            const offset = (gy / 22) % 2 === 0 ? 0 : 18;
            for (let gx2 = offset - camera.x % 36; gx2 < W; gx2 += 36) {
                ctx.strokeRect(gx2, gy, 34, 20);
                // Random crack
                if (((gx2 * 7 + gy * 3) & 0xff) > 200) {
                    ctx.beginPath();
                    ctx.moveTo(gx2 + 10, gy + 5);
                    ctx.lineTo(gx2 + 18, gy + 12);
                    ctx.lineTo(gx2 + 25, gy + 10);
                    ctx.stroke();
                }
            }
        }
        // Purple mist at ground level
        const mistGrad = ctx.createLinearGradient(0, WALK_MIN_Y, 0, WALK_MIN_Y + 30);
        mistGrad.addColorStop(0, 'rgba(100,50,150,0.15)');
        mistGrad.addColorStop(1, 'rgba(100,50,150,0)');
        ctx.fillStyle = mistGrad;
        ctx.fillRect(0, WALK_MIN_Y, W, 30);
    } else if (groundType === 'space') {
        // Metallic floor panels
        ctx.strokeStyle = shadeColor(lv.ground, 0.15); ctx.lineWidth = 1;
        for (let gx2 = -camera.x % 50; gx2 < W; gx2 += 50) {
            for (let gy = WALK_MIN_Y; gy < H; gy += 35) {
                ctx.strokeRect(gx2, gy, 48, 33);
                // Corner rivets
                ctx.fillStyle = shadeColor(lv.ground, 0.25);
                for (const corner of [[3,3],[45,3],[3,30],[45,30]]) {
                    ctx.beginPath(); ctx.arc(gx2 + corner[0], gy + corner[1], 1.5, 0, Math.PI*2); ctx.fill();
                }
            }
        }
        // Glowing floor strip
        const stripGlow = 0.3 + Math.sin(Date.now() * 0.003) * 0.15;
        ctx.fillStyle = `rgba(0,200,255,${stripGlow})`;
        ctx.fillRect(0, WALK_MIN_Y + 2, W, 2);
    }

    // Ground-line shadow at WALK_MIN_Y
    const groundShadow = ctx.createLinearGradient(0, WALK_MIN_Y - 4, 0, WALK_MIN_Y + 4);
    groundShadow.addColorStop(0, 'rgba(0,0,0,0)');
    groundShadow.addColorStop(0.5, 'rgba(0,0,0,0.15)');
    groundShadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = groundShadow;
    ctx.fillRect(0, WALK_MIN_Y - 4, W, 8);

    // Background elements (parallax)
    for (const el of bgElements) {
        const px = el.x - camera.x * (el.type === 'cloud' ? 0.2 : el.type.includes('bg') ? 0.3 : 0.5);

        if (px < -200 || px > W + 200) continue;

        switch(el.type) {
            case 'tree':
                // Trunk with bark texture
                drawGradRect(ctx, px - 6, WALK_MIN_Y - el.size, 12, el.size, '#6a4a2a', '#4a2a0a', 2);
                ctx.strokeStyle = '#3a1a00'; ctx.lineWidth = 1;
                for (let by = WALK_MIN_Y - el.size + 8; by < WALK_MIN_Y - 5; by += 8) {
                    ctx.beginPath(); ctx.moveTo(px - 4, by); ctx.lineTo(px + 4, by); ctx.stroke();
                }
                // Layered canopy
                drawGradCircle(ctx, px - 10, WALK_MIN_Y - el.size + 2, el.size * 0.3, '#3a9a3a', '#1a6a1a');
                drawGradCircle(ctx, px + 10, WALK_MIN_Y - el.size + 2, el.size * 0.3, '#2a8a2a', '#1a6a1a');
                drawGradCircle(ctx, px, WALK_MIN_Y - el.size - 8, el.size * 0.45, '#44aa44', '#2a7a2a');
                drawGradCircle(ctx, px + 5, WALK_MIN_Y - el.size - 3, el.size * 0.35, '#3aaa3a', '#2a8a2a');
                break;
            case 'bush':
                drawGradCircle(ctx, px, WALK_MIN_Y - el.size * 0.3, el.size * 0.5, '#4aaa4a', '#2a7a2a');
                drawGradCircle(ctx, px - 10, WALK_MIN_Y - el.size * 0.15, el.size * 0.35, '#3a9a3a', '#1a6a1a');
                break;
            case 'building':
                drawGradRect(ctx, px, WALK_MIN_Y - el.h, el.w, el.h, el.color, shadeColor(el.color, -0.3), 2);
                // Rooftop variation
                const roofType = Math.floor(el.x / 100) % 3;
                if (roofType === 0) {
                    ctx.fillStyle = shadeColor(el.color, -0.2);
                    ctx.beginPath(); ctx.moveTo(px - 2, WALK_MIN_Y - el.h);
                    ctx.lineTo(px + el.w/2, WALK_MIN_Y - el.h - 15);
                    ctx.lineTo(px + el.w + 2, WALK_MIN_Y - el.h);
                    ctx.closePath(); ctx.fill();
                }
                // Glowing windows
                for (let wy = WALK_MIN_Y - el.h + 15; wy < WALK_MIN_Y - 15; wy += 25) {
                    for (let wx = px + 10; wx < px + el.w - 10; wx += 20) {
                        if (((wx * 7 + wy * 13) & 0xff) > 77) {
                            const wg = ctx.createRadialGradient(wx+5, wy+6, 0, wx+5, wy+6, 8);
                            wg.addColorStop(0, 'rgba(255,238,136,0.6)');
                            wg.addColorStop(1, 'rgba(255,238,136,0)');
                            ctx.fillStyle = wg;
                            ctx.fillRect(wx - 2, wy - 2, 14, 16);
                            ctx.fillStyle = '#ffee88';
                            ctx.fillRect(wx, wy, 10, 12);
                        }
                    }
                }
                break;
            case 'building_bg':
                ctx.fillStyle = el.color;
                ctx.fillRect(px, WALK_MIN_Y - el.h, el.w, el.h);
                ctx.fillStyle = 'rgba(255,238,136,0.3)';
                for (let wy = WALK_MIN_Y - el.h + 20; wy < WALK_MIN_Y - 10; wy += 30) {
                    for (let wx = px + 10; wx < px + el.w - 10; wx += 22) {
                        ctx.fillRect(wx, wy, 8, 10);
                    }
                }
                break;
            case 'machine':
                drawGradRect(ctx, px, WALK_MIN_Y - el.h, el.w, el.h, '#667788', '#445566', 3);
                drawGradCircle(ctx, px + el.w/2, WALK_MIN_Y - el.h/2, 12, '#aacc22', '#889900');
                ctx.fillStyle = '#ff4400';
                ctx.fillRect(px + 5, WALK_MIN_Y - el.h + 5, 8, 8);
                break;
            case 'pillar':
                drawGradRect(ctx, px, WALK_MIN_Y - el.h, 30, el.h, '#665555', '#443333', 2);
                drawGradRect(ctx, px - 5, WALK_MIN_Y - el.h, 40, 15, '#776666', '#554444', 3);
                break;
            case 'isb_building':
                // Islamabad-style building with warm tones
                drawGradRect(ctx, px, WALK_MIN_Y - el.h, el.w, el.h, el.color, shadeColor(el.color, -0.25), 2);
                // Flat roof with parapet
                ctx.fillStyle = shadeColor(el.color, -0.15);
                ctx.fillRect(px - 3, WALK_MIN_Y - el.h, el.w + 6, 8);
                // Windows
                for (let wy = WALK_MIN_Y - el.h + 20; wy < WALK_MIN_Y - 12; wy += 22) {
                    for (let wx = px + 8; wx < px + el.w - 8; wx += 18) {
                        if (((wx * 11 + wy * 7) & 0xff) > 90) {
                            ctx.fillStyle = '#ffee88';
                            ctx.fillRect(wx, wy, 10, 14);
                            ctx.fillStyle = 'rgba(255,238,136,0.3)';
                            ctx.fillRect(wx - 2, wy - 2, 14, 18);
                        }
                    }
                }
                break;
            case 'isb_tree':
                // Green tree with thick trunk
                drawGradRect(ctx, px - 5, WALK_MIN_Y - el.size * 0.5, 10, el.size * 0.5, '#5a3a1a', '#3a2a0a', 2);
                drawGradCircle(ctx, px, WALK_MIN_Y - el.size * 0.55, el.size * 0.4, '#2a8a2a', '#1a5a1a');
                drawGradCircle(ctx, px - 8, WALK_MIN_Y - el.size * 0.45, el.size * 0.3, '#3a9a3a', '#2a7a2a');
                drawGradCircle(ctx, px + 8, WALK_MIN_Y - el.size * 0.48, el.size * 0.32, '#34944a', '#1a6a2a');
                break;
            case 'isb_car':
                // Parked car silhouette
                ctx.fillStyle = el.color;
                drawRR(ctx, px, WALK_MIN_Y - 22, 40, 16, 4, el.color);
                drawRR(ctx, px + 6, WALK_MIN_Y - 32, 28, 12, 3, shadeColor(el.color, -0.15));
                // Wheels
                ctx.fillStyle = '#222';
                ctx.beginPath(); ctx.arc(px + 10, WALK_MIN_Y - 5, 5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(px + 32, WALK_MIN_Y - 5, 5, 0, Math.PI * 2); ctx.fill();
                // Window shine
                ctx.fillStyle = 'rgba(150,200,255,0.4)';
                ctx.fillRect(px + 10, WALK_MIN_Y - 30, 10, 8);
                ctx.fillRect(px + 22, WALK_MIN_Y - 30, 10, 8);
                break;
            case 'castle_pillar':
                // Gothic stone pillar
                drawGradRect(ctx, px, WALK_MIN_Y - el.h, 28, el.h, '#665566', '#443344', 2);
                // Capital / top decoration
                drawGradRect(ctx, px - 5, WALK_MIN_Y - el.h, 38, 12, '#776677', '#554455', 3);
                // Pointed arch at top
                ctx.fillStyle = '#776677';
                ctx.beginPath();
                ctx.moveTo(px - 2, WALK_MIN_Y - el.h);
                ctx.lineTo(px + 14, WALK_MIN_Y - el.h - 18);
                ctx.lineTo(px + 30, WALK_MIN_Y - el.h);
                ctx.closePath(); ctx.fill();
                // Stone lines
                ctx.strokeStyle = '#3a2a3a'; ctx.lineWidth = 0.8;
                for (let sy = WALK_MIN_Y - el.h + 20; sy < WALK_MIN_Y - 5; sy += 16) {
                    ctx.beginPath(); ctx.moveTo(px + 2, sy); ctx.lineTo(px + 26, sy); ctx.stroke();
                }
                break;
            case 'castle_torch':
                // Wall-mounted torch
                drawGradRect(ctx, px, WALK_MIN_Y - el.h, 8, el.h, '#5a4a3a', '#3a2a1a', 1);
                // Bracket
                ctx.fillStyle = '#6a5a4a';
                ctx.fillRect(px - 3, WALK_MIN_Y - el.h + 4, 14, 5);
                // Flame glow
                {
                    const flameFlicker = 0.7 + Math.sin(Date.now() * 0.008 + px * 0.1) * 0.3;
                    const fg = ctx.createRadialGradient(px + 4, WALK_MIN_Y - el.h - 5, 0, px + 4, WALK_MIN_Y - el.h - 5, 20);
                    fg.addColorStop(0, `rgba(255,150,30,${0.6 * flameFlicker})`);
                    fg.addColorStop(0.5, `rgba(255,80,0,${0.3 * flameFlicker})`);
                    fg.addColorStop(1, 'rgba(255,50,0,0)');
                    ctx.fillStyle = fg;
                    ctx.fillRect(px - 16, WALK_MIN_Y - el.h - 25, 40, 40);
                    // Flame core
                    ctx.fillStyle = `rgba(255,220,80,${0.9 * flameFlicker})`;
                    ctx.beginPath();
                    ctx.moveTo(px, WALK_MIN_Y - el.h);
                    ctx.quadraticCurveTo(px + 4, WALK_MIN_Y - el.h - 14 * flameFlicker, px + 8, WALK_MIN_Y - el.h);
                    ctx.fill();
                }
                break;
            case 'castle_bat':
                // Animated bat silhouette
                {
                    const wingPhase = Math.sin(Date.now() * 0.01 + el.x * 0.5) * 0.6;
                    ctx.fillStyle = '#1a1a2e';
                    ctx.save();
                    ctx.translate(px, el.y);
                    // Body
                    ctx.beginPath(); ctx.ellipse(0, 0, el.size * 0.3, el.size * 0.2, 0, 0, Math.PI * 2); ctx.fill();
                    // Left wing
                    ctx.beginPath();
                    ctx.moveTo(-2, 0);
                    ctx.quadraticCurveTo(-el.size * 0.6, -el.size * wingPhase, -el.size, el.size * 0.1 * wingPhase);
                    ctx.lineTo(-el.size * 0.4, el.size * 0.15);
                    ctx.closePath(); ctx.fill();
                    // Right wing
                    ctx.beginPath();
                    ctx.moveTo(2, 0);
                    ctx.quadraticCurveTo(el.size * 0.6, -el.size * wingPhase, el.size, el.size * 0.1 * wingPhase);
                    ctx.lineTo(el.size * 0.4, el.size * 0.15);
                    ctx.closePath(); ctx.fill();
                    // Eyes
                    ctx.fillStyle = '#ff3333';
                    ctx.beginPath(); ctx.arc(-2, -1, 1.5, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(2, -1, 1.5, 0, Math.PI * 2); ctx.fill();
                    ctx.restore();
                }
                break;
            case 'space_panel':
                // Control panel
                drawGradRect(ctx, px, WALK_MIN_Y - el.h, el.w, el.h, '#3a4a5a', '#2a3a4a', 3);
                // Panel border
                ctx.strokeStyle = '#5a7a9a'; ctx.lineWidth = 1.5;
                ctx.strokeRect(px + 2, WALK_MIN_Y - el.h + 2, el.w - 4, el.h - 4);
                // Blinking lights
                for (let lx = px + 8; lx < px + el.w - 8; lx += 14) {
                    for (let ly = WALK_MIN_Y - el.h + 12; ly < WALK_MIN_Y - 8; ly += 14) {
                        const blink = Math.sin(Date.now() * 0.003 + lx * 0.2 + ly * 0.3) > 0;
                        const lColor = blink ? ['#44ff44','#ff4444','#4488ff','#ffaa00'][Math.floor((lx + ly) * 0.1) % 4] : '#333';
                        ctx.fillStyle = lColor;
                        ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI * 2); ctx.fill();
                        if (blink) {
                            ctx.fillStyle = lColor.replace(')', ',0.3)').replace('rgb', 'rgba');
                            ctx.beginPath(); ctx.arc(lx, ly, 6, 0, Math.PI * 2); ctx.fill();
                        }
                    }
                }
                break;
            case 'space_screen':
                // Monitor/screen
                drawGradRect(ctx, px, WALK_MIN_Y - el.h, el.w, el.h, '#1a2a3a', '#0a1a2a', 2);
                // Screen glow
                {
                    const scanline = (Date.now() * 0.05 + px) % el.h;
                    ctx.fillStyle = 'rgba(0,180,255,0.15)';
                    ctx.fillRect(px + 3, WALK_MIN_Y - el.h + 3, el.w - 6, el.h - 6);
                    // Scrolling data lines
                    ctx.fillStyle = 'rgba(0,255,180,0.5)';
                    for (let sy = 0; sy < el.h - 10; sy += 6) {
                        const lineW = ((px * 7 + sy * 13) % 30) + 8;
                        ctx.fillRect(px + 6, WALK_MIN_Y - el.h + 6 + sy, Math.min(lineW, el.w - 14), 2);
                    }
                    // Scan line
                    ctx.fillStyle = 'rgba(0,255,255,0.2)';
                    ctx.fillRect(px + 3, WALK_MIN_Y - el.h + 3 + scanline, el.w - 6, 2);
                }
                // Frame
                ctx.strokeStyle = '#4a6a8a'; ctx.lineWidth = 2;
                ctx.strokeRect(px, WALK_MIN_Y - el.h, el.w, el.h);
                break;
            case 'space_tube':
                // Glowing energy tube
                drawGradRect(ctx, px, WALK_MIN_Y - el.h, 16, el.h, '#3a4a5a', '#2a3a4a', 2);
                // Glass tube with energy
                {
                    const energyPulse = 0.5 + Math.sin(Date.now() * 0.004 + px * 0.1) * 0.5;
                    const eg = ctx.createLinearGradient(px + 3, WALK_MIN_Y - el.h, px + 3, WALK_MIN_Y);
                    eg.addColorStop(0, `rgba(0,255,200,${0.1 + energyPulse * 0.3})`);
                    eg.addColorStop(0.5, `rgba(0,200,255,${0.2 + energyPulse * 0.4})`);
                    eg.addColorStop(1, `rgba(0,255,200,${0.1 + energyPulse * 0.3})`);
                    ctx.fillStyle = eg;
                    ctx.fillRect(px + 3, WALK_MIN_Y - el.h + 5, 10, el.h - 10);
                    // Glow
                    const tg = ctx.createRadialGradient(px + 8, WALK_MIN_Y - el.h / 2, 0, px + 8, WALK_MIN_Y - el.h / 2, 25);
                    tg.addColorStop(0, `rgba(0,255,220,${0.15 * energyPulse})`);
                    tg.addColorStop(1, 'rgba(0,255,220,0)');
                    ctx.fillStyle = tg;
                    ctx.fillRect(px - 17, WALK_MIN_Y - el.h, 50, el.h);
                }
                // Caps
                ctx.fillStyle = '#5a6a7a';
                ctx.fillRect(px - 1, WALK_MIN_Y - el.h, 18, 6);
                ctx.fillRect(px - 1, WALK_MIN_Y - 6, 18, 6);
                break;
            case 'cloud':
                const cg = ctx.createRadialGradient(px, el.y, 0, px, el.y, el.size);
                cg.addColorStop(0, 'rgba(255,255,255,0.45)');
                cg.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = cg;
                ctx.beginPath(); ctx.ellipse(px, el.y, el.size * 1.2, el.size * 0.5, 0, 0, Math.PI*2); ctx.fill();
                // Secondary puff
                const cg2 = ctx.createRadialGradient(px - el.size*0.4, el.y+3, 0, px - el.size*0.4, el.y+3, el.size*0.7);
                cg2.addColorStop(0, 'rgba(255,255,255,0.35)');
                cg2.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = cg2;
                ctx.beginPath(); ctx.ellipse(px - el.size*0.4, el.y+3, el.size*0.8, el.size*0.35, 0, 0, Math.PI*2); ctx.fill();
                break;
        }
    }
}

// --- ENTITY CREATION ---
function createPlayer(heroIndex) {
    const c = COLORS.heroes[heroIndex];
    return {
        x: 100, y: WALK_MAX_Y - 40, w: 36, h: 64,
        vx: 0, vy: 0,
        hp: 100, maxHp: 100,
        state: 'idle', stateTimer: 0,
        facing: 1, animFrame: 0, animTimer: 0,
        invincible: 0, flashTimer: 0,
        grounded: true, comboStep: 0, comboTimer: 0,
        colors: c, isPlayer: true,
        attackHit: false,
        speed: PLAYER_SPEED,
        bodyScale: 1.0,
        targetBodyScale: 1.0,
        weapon: null,
        weaponTimer: 0,
        weaponAmmo: 0,
        currentAttack: null,
        attackType: null,
        damageMult: 1,
        afterimages: [],
    };
}

function createEnemy(type, x, y, bossIndex) {
    const def = bossIndex !== undefined ? BOSS_DEFS[bossIndex] : ENEMY_DEFS[type];
    return {
        x, y: y || rnd(WALK_MIN_Y + 30, WALK_MAX_Y - 20), w: def.w, h: def.h,
        vx: 0, vy: 0,
        hp: def.hp, maxHp: def.hp,
        state: 'idle', stateTimer: 0,
        facing: -1, animFrame: 0, animTimer: 0,
        invincible: 0, flashTimer: 0,
        grounded: true,
        colors: { shirt: def.color, pants: def.color, skin: def.skin, hair: def.color },
        isEnemy: true, enemyType: type,
        speed: def.speed, damage: def.damage,
        attackRange: def.attackRange, attackCooldown: def.attackCooldown,
        attackTimer: rnd(0.5, 1.5),
        score: def.score,
        aiState: 'approach', aiTimer: 0,
        bossType: bossIndex !== undefined ? def.type : null,
        projectileTimer: 0,
    };
}

function createPickup(x, y, type) {
    return { x, y, type, animTimer: 0, collected: false };
}

function createProjectile(x, y, vx, vy, damage, fromEnemy) {
    return { x, y, vx, vy, damage, fromEnemy, life: 3, w: 10, h: 10 };
}

// --- PICKUP DRAWING ---
function drawPickup(ctx, pickup) {
    const sx = pickup.x - camera.x;
    const sy = pickup.y + Math.sin(pickup.animTimer * 4) * 5;
    const glow = 0.5 + Math.sin(pickup.animTimer * 6) * 0.3;

    ctx.globalAlpha = glow + 0.5;
    switch(pickup.type) {
        case 'health':
            drawGradCircle(ctx, sx, sy, 12, '#66ff66', '#22aa22');
            ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
            ctx.fillText('+', sx, sy + 6);
            break;
        case 'power':
            drawGradCircle(ctx, sx, sy, 12, '#ff6666', '#aa2222');
            ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
            ctx.fillText('P', sx, sy + 5);
            break;
        case 'speed':
            drawGradCircle(ctx, sx, sy, 12, '#ffff66', '#aaaa22');
            ctx.fillStyle = '#000'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
            ctx.fillText('S', sx, sy + 5);
            break;
        case 'shield':
            drawGradCircle(ctx, sx, sy, 12, '#6688ff', '#2244aa');
            ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
            ctx.fillText('SH', sx, sy + 4);
            break;
        case 'food_burger':
            // Bun top
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(sx, sy - 6, 13, 7, 0, Math.PI, 0); ctx.fill();
            ctx.fillStyle = '#D2691E'; ctx.beginPath(); ctx.ellipse(sx, sy - 6, 11, 6, 0, Math.PI, 0); ctx.fill();
            // Patty
            drawRR(ctx, sx - 11, sy - 5, 22, 5, 2, '#8B4513', '#000', 1);
            // Lettuce
            ctx.fillStyle = '#44aa22'; ctx.fillRect(sx - 10, sy - 2, 20, 3);
            // Bun bottom
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(sx, sy + 3, 13, 5, 0, 0, Math.PI); ctx.fill();
            ctx.fillStyle = '#D2691E'; ctx.beginPath(); ctx.ellipse(sx, sy + 3, 11, 4, 0, 0, Math.PI); ctx.fill();
            break;
        case 'food_pizza':
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.moveTo(sx, sy - 12); ctx.lineTo(sx - 11, sy + 8); ctx.lineTo(sx + 11, sy + 8); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#E8C33A';
            ctx.beginPath(); ctx.moveTo(sx, sy - 10); ctx.lineTo(sx - 9, sy + 7); ctx.lineTo(sx + 9, sy + 7); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#cc2222';
            ctx.beginPath(); ctx.arc(sx - 3, sy, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(sx + 3, sy - 3, 2, 0, Math.PI * 2); ctx.fill();
            break;
        case 'food_chicken':
            // Drumstick
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(sx - 2, sy - 2, 11, 8, -0.3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#D2961E'; ctx.beginPath(); ctx.ellipse(sx - 2, sy - 2, 9, 7, -0.3, 0, Math.PI * 2); ctx.fill();
            // Bone stick
            drawRR(ctx, sx + 6, sy - 3, 10, 4, 2, '#f5f5dc', '#000', 1);
            break;
        case 'weapon_bat':
            drawGradRect(ctx, sx - 3, sy - 14, 6, 24, '#A0522D', '#6B3410', 2);
            drawGradRect(ctx, sx - 4, sy - 16, 8, 6, '#B8652E', '#8B4513', 2);
            break;
        case 'weapon_nunchucks':
            drawGradCircle(ctx, sx - 6, sy - 4, 5, '#876543', '#654321');
            drawGradCircle(ctx, sx + 6, sy - 4, 5, '#876543', '#654321');
            ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(sx - 4, sy - 4); ctx.lineTo(sx + 4, sy - 4); ctx.stroke();
            break;
        case 'weapon_sword':
            drawGradRect(ctx, sx - 2, sy - 16, 4, 22, '#D8D8D8', '#A0A0A0', 1);
            drawRR(ctx, sx - 6, sy + 4, 12, 3, 1, '#8B4513', '#000', 1);
            drawGradRect(ctx, sx - 2, sy + 6, 4, 5, '#876543', '#654321', 1);
            break;
        case 'weapon_stars':
            for (let a = 0; a < 5; a++) {
                const angle = a * Math.PI * 2 / 5 - Math.PI / 2;
                const px2 = sx + Math.cos(angle) * 9;
                const py2 = sy + Math.sin(angle) * 9;
                drawStar(ctx, px2, py2, 3, 1.5, 4, angle, '#BBB');
            }
            break;
    }
    ctx.globalAlpha = 1;
}

// --- PLAYER UPDATE ---
function updatePlayer(dt) {
    if (!player || player.state === 'dead') return;

    const inp = getInput();

    // Update timers
    player.invincible = Math.max(0, player.invincible - dt);
    player.flashTimer = Math.max(0, player.flashTimer - dt);
    player.stateTimer = Math.max(0, player.stateTimer - dt);
    player.comboTimer = Math.max(0, player.comboTimer - dt);
    if (player.comboTimer <= 0) player.comboStep = 0;

    // Body scale lerp
    player.bodyScale = lerp(player.bodyScale, player.targetBodyScale, BODY_SCALE_LERP * dt);

    // Weapon timer
    if (player.weapon) {
        player.weaponTimer -= dt;
        if (player.weaponTimer <= 0) { player.weapon = null; }
    }

    // Effective speed based on body scale
    const effectiveSpeed = player.speed * (1.15 - player.bodyScale * 0.15);

    // Afterimage update
    if (player.afterimages) {
        if (comboCount >= 5 && player.state === 'attacking' && player.afterimages.length < 3) {
            player.afterimages.push({ x: player.x, y: player.y, facing: player.facing, life: 0.15 });
        }
        for (let i = player.afterimages.length - 1; i >= 0; i--) {
            player.afterimages[i].life -= dt;
            if (player.afterimages[i].life <= 0) player.afterimages.splice(i, 1);
        }
    }

    // State machine
    if (player.state === 'hurt') {
        if (player.stateTimer <= 0) player.state = 'idle';
        player.vx *= 0.9;
        player.x += player.vx * dt;
        applyGravity(player, dt);
        return;
    }

    if (player.state === 'special') {
        if (player.stateTimer <= 0) player.state = 'idle';
        applyGravity(player, dt);
        return;
    }

    // Unified attacking state (replaces attack1/attack2/attack3)
    if (player.state === 'attacking') {
        const atk = player.currentAttack;
        player.animTimer += dt;
        if (player.animTimer >= atk.frameDur) {
            player.animTimer -= atk.frameDur;
            player.animFrame++;

            // Check hitbox on active frame
            if (player.animFrame === atk.activeFrame && !player.attackHit) {
                checkPlayerAttack(atk);
            }

            if (player.animFrame >= atk.totalFrames) {
                player.state = 'idle';
                player.animFrame = 0;
                player.attackHit = false;
            }
        }
        // Allow combo: can press punch or kick during last frames
        if (player.animFrame >= atk.totalFrames - 1 && player.comboStep < 3) {
            if (consumeAttack()) startAttack('punch');
            else if (consumeKick()) startAttack('kick');
        }
        player.vx *= 0.85;
        player.x += player.vx * dt;
        applyGravity(player, dt);
        return;
    }

    // Slide state
    if (player.state === 'slide') {
        player.stateTimer -= dt;
        if (!player.attackHit) {
            checkPlayerAttack({ damage: 15, knockback: 180, range: 70, name: 'slide', type: 'kick' });
        }
        player.x += player.vx * dt;
        player.vx *= 0.95;
        if (player.stateTimer <= 0) {
            player.state = 'idle';
            player.attackHit = false;
            emitParticles(player.x, player.y, 'dust', player.facing);
        }
        return;
    }

    if (player.state === 'jump_attack') {
        player.animTimer += dt;
        if (player.animTimer >= 0.08) {
            player.animTimer = 0;
            player.animFrame = (player.animFrame + 1) % 3;
        }
        // Check hit
        if (!player.attackHit) {
            checkPlayerAttack({ damage: 20, knockback: 200, range: 55, name: 'jump_attack', type: 'kick' });
        }
        applyGravity(player, dt);
        player.x += player.vx * dt;
        if (player.grounded) {
            player.state = 'idle';
            player.attackHit = false;
            emitParticles(player.x, player.y, 'dust', player.facing);
            playSound('land');
        }
        return;
    }

    // Movement
    let mx = 0, my = 0;
    if (inp.left) { mx = -1; player.facing = -1; }
    if (inp.right) { mx = 1; player.facing = 1; }
    if (inp.up) my = -1;
    if (inp.down) my = 1;

    if (mx !== 0 || my !== 0) {
        player.state = 'walk';
        player.x += mx * effectiveSpeed * dt;
        player.y += my * effectiveSpeed * 0.6 * dt;
        player.y = clamp(player.y, WALK_MIN_Y + 10, WALK_MAX_Y);
    } else if (player.grounded && player.state === 'walk') {
        player.state = 'idle';
    }

    // Walk animation
    if (player.state === 'walk') {
        player.animTimer += dt;
        if (player.animTimer >= 0.1) {
            player.animTimer = 0;
            player.animFrame = (player.animFrame + 1) % 8;
        }
    } else if (player.state === 'idle') {
        player.animTimer += dt;
        if (player.animTimer >= 0.4) {
            player.animTimer = 0;
            player.animFrame = (player.animFrame + 1) % 2;
        }
    }

    // Jump
    if (consumeJump() && player.grounded) {
        player.vy = -550;
        player.grounded = false;
        player.state = 'jump';
        playSound('jump');
    }

    // Slide: down + direction + punch while grounded
    if (inp.down && (inp.left || inp.right) && consumeAttack() && player.grounded) {
        player.state = 'slide';
        player.stateTimer = 0.4;
        player.vx = player.facing * 400;
        player.attackHit = false;
        emitParticles(player.x, player.y, 'dust', player.facing);
        playSound('kick');
    }
    // Attack (punch button)
    else if (consumeAttack()) {
        if (player.weapon === 'stars' && player.weaponAmmo > 0) {
            // Throw star projectile
            projectiles.push(createProjectile(player.x + player.facing * 20, player.y - player.h * 0.4, player.facing * 500, 0, 15, false));
            player.weaponAmmo--;
            if (player.weaponAmmo <= 0) player.weapon = null;
            playSound('star');
        } else if (player.grounded) {
            startAttack('punch');
        } else if (player.state === 'jump') {
            player.state = 'jump_attack';
            player.animFrame = 0;
            player.attackHit = false;
            playSound('kick');
        }
    }

    // Kick button
    if (consumeKick() && player.grounded) {
        startAttack('kick');
    }

    // Special
    if (consumeSpecial() && specialMeter >= 100 && player.grounded) {
        player.state = 'special';
        player.stateTimer = 0.4;
        player.animFrame = 0;
        specialMeter = 0;
        playSound('special');
        triggerShake(8, 0.3);
        emitParticles(player.x, player.y - player.h/2, 'special', player.facing);
        // Damage all enemies nearby
        for (const e of enemies) {
            if (e.state === 'dead') continue;
            if (dist(player.x, player.y, e.x, e.y) < 180) {
                applyDamage(e, 40, player.facing * 300);
            }
        }
        if (boss && boss.state !== 'dead' && dist(player.x, player.y, boss.x, boss.y) < 180) {
            applyDamage(boss, 40, player.facing * 300);
        }
    }

    // Camera bounds
    if (!waveLocked) {
        player.x = clamp(player.x, camera.x + 40, camera.x + W * 0.7);
    } else {
        player.x = clamp(player.x, camera.x + 40, camera.x + W - 40);
    }

    applyGravity(player, dt);
}

function startAttack(type) {
    // type is 'punch' or 'kick'
    if (player.comboTimer > 0 && player.comboStep < 3) {
        player.comboStep++;
    } else {
        player.comboStep = 1;
    }

    let attacks;
    if (type === 'punch' && player.weapon && player.weapon !== 'stars') {
        attacks = WEAPON_DATA[player.weapon].attacks;
    } else {
        attacks = ATTACK_DATA[type];
    }

    const atkIdx = Math.min(player.comboStep - 1, attacks.length - 1);
    player.currentAttack = attacks[atkIdx];
    player.attackType = type;
    player.state = 'attacking';
    player.animFrame = 0;
    player.animTimer = 0;
    player.comboTimer = COMBO_WINDOW;
    player.attackHit = false;
    player.vx = player.facing * 60;

    // Sound
    if (player.weapon === 'bat') playSound('bat');
    else if (player.weapon === 'sword') playSound('sword');
    else if (player.weapon === 'nunchucks') playSound('nunchuck');
    else playSound(type === 'kick' ? 'kick' : 'punch');
}

function checkPlayerAttack(atk) {
    const scale = player.bodyScale || 1;
    const dmgMult = scale * (player.damageMult || 1);
    const effectiveRange = atk.range * scale;
    const effectiveDamage = Math.round(atk.damage * dmgMult);
    const hx = player.x + player.facing * 15;

    const targets = [...enemies];
    if (boss && boss.state !== 'dead') targets.push(boss);

    for (const e of targets) {
        if (e.state === 'dead' || e.invincible > 0) continue;
        if (Math.abs(e.x - hx) < effectiveRange && Math.abs(e.y - player.y) < 60) {
            applyDamage(e, effectiveDamage, player.facing * atk.knockback);
            player.attackHit = true;

            score += Math.floor(effectiveDamage * 2);
            specialMeter = Math.min(100, specialMeter + 8);
            comboCount++;
            comboTimer = 1.5;
            comboDisplayTimer = 1.5;
            maxComboDisplay = Math.max(maxComboDisplay, comboCount);

            // Damage number
            const numType = player.weapon ? 'weapon' : (comboCount >= 3 ? 'combo' : 'normal');
            spawnDamageNumber(e.x, e.y - e.h, effectiveDamage, numType);

            emitParticles(e.x, e.y - e.h/2, 'hit', player.facing);
            hitStopTimer = HIT_STOP_TIME;
            triggerShake(player.comboStep === 3 ? 5 : 3, 0.1);

            if (comboCount >= 3 && comboCount % 3 === 0) playSound('combo');

            // Haptic
            if (navigator.vibrate) navigator.vibrate(15);

            // Impact effect (bigger, longer)
            impactEffects.push({ x: e.x, y: e.y - e.h/2, size: 32 + effectiveDamage * 0.7, life: 0.22, maxLife: 0.22, color: player.weapon ? '#44ffff' : '#ffff00' });

            // Small screen shake on every hit
            triggerShake(3 + effectiveDamage * 0.1, 0.08);

            // Screen flash on combo finisher
            if (player.comboStep === 3) { screenFlashAlpha = 0.35; triggerShake(12, 0.18); }
        }
    }
}

function applyDamage(entity, damage, knockbackX) {
    entity.hp -= damage;
    entity.vx = knockbackX;
    entity.flashTimer = 0.18;
    entity.invincible = 0.15;

    if (entity.hp <= 0) {
        entity.hp = 0;
        entity.state = 'dead';
        entity.stateTimer = 0.5;
        emitParticles(entity.x, entity.y - entity.h/2, 'explosion', 1);
        score += entity.score || 100;
        playSound('kick');
        triggerShake(10, 0.22);

        // Drop pickup (health, food, power-ups)
        if (Math.random() < 0.3 && !entity.bossType) {
            const types = ['health','health','food_burger','food_pizza','food_chicken','power','speed','shield'];
            pickups.push(createPickup(entity.x, entity.y, types[rndInt(0, types.length - 1)]));
        }
        // Weapon drop (separate, rarer)
        if (Math.random() < 0.08 && !entity.bossType) {
            const weaponTypes = ['bat', 'nunchucks', 'sword', 'stars'];
            pickups.push(createPickup(entity.x + rnd(-15, 15), entity.y, 'weapon_' + weaponTypes[rndInt(0, 3)]));
        }
    } else {
        entity.state = 'hurt';
        entity.stateTimer = 0.3;
        playSound('hurt');
    }
}

function applyGravity(entity, dt) {
    if (!entity.grounded) {
        entity.vy += GRAVITY * dt;
        entity.y += entity.vy * dt;
        if (entity.y >= entity._groundY || entity.y >= WALK_MAX_Y) {
            entity.y = entity._groundY || WALK_MAX_Y;
            entity.vy = 0;
            entity.grounded = true;
            if (entity.state === 'jump') entity.state = 'idle';
        }
    }
    entity._groundY = entity.y;
    entity.x += entity.vx * dt;
    entity.vx *= 0.9;
}

// --- ENEMY AI ---
function updateEnemyAI(enemy, dt) {
    if (enemy.state === 'dead') {
        enemy.stateTimer -= dt;
        enemy.vx *= 0.9;
        enemy.x += enemy.vx * dt;
        return enemy.stateTimer <= 0;
    }

    enemy.invincible = Math.max(0, enemy.invincible - dt);
    enemy.flashTimer = Math.max(0, enemy.flashTimer - dt);
    enemy.stateTimer = Math.max(0, enemy.stateTimer - dt);
    enemy.attackTimer = Math.max(0, enemy.attackTimer - dt);
    enemy.animTimer += dt;

    if (enemy.state === 'hurt') {
        if (enemy.stateTimer <= 0) enemy.state = 'idle';
        enemy.vx *= 0.9;
        enemy.x += enemy.vx * dt;
        applyGravity(enemy, dt);
        return false;
    }

    if (enemy.state === 'attack1') {
        if (enemy.animTimer >= 0.08) {
            enemy.animTimer = 0;
            enemy.animFrame++;
            if (enemy.animFrame === 2) {
                // Hit check
                if (Math.abs(player.x - enemy.x) < enemy.attackRange && Math.abs(player.y - enemy.y) < 40 && player.invincible <= 0) {
                    damagePlayer(enemy.damage, enemy.facing);
                }
                // Robot shoots projectile
                if (enemy.enemyType === 'robot' || (enemy.bossType === 'mech')) {
                    projectiles.push(createProjectile(enemy.x + enemy.facing * 20, enemy.y - enemy.h * 0.5, enemy.facing * 400, 0, enemy.damage, true));
                }
            }
            if (enemy.animFrame >= 4) {
                enemy.state = 'idle';
                enemy.animFrame = 0;
                enemy.attackTimer = enemy.attackCooldown * (0.8 + Math.random() * 0.4);
            }
        }
        return false;
    }

    if (!player || player.state === 'dead') return false;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const d = dist(player.x, player.y, enemy.x, enemy.y);

    enemy.facing = dx > 0 ? 1 : -1;

    // Boss-specific AI
    if (enemy.bossType) {
        return updateBossAI(enemy, dt, dx, dy, d);
    }

    // Approach player
    if (d > enemy.attackRange + 20) {
        enemy.state = 'walk';
        const speed = enemy.speed;
        enemy.x += Math.sign(dx) * speed * dt;
        enemy.y += Math.sign(dy) * speed * 0.4 * dt;
        enemy.y = clamp(enemy.y, WALK_MIN_Y + 10, WALK_MAX_Y);

        if (enemy.animTimer >= 0.12) {
            enemy.animTimer = 0;
            enemy.animFrame = (enemy.animFrame + 1) % 4;
        }
    }
    // In range -> attack
    else if (enemy.attackTimer <= 0) {
        enemy.state = 'attack1';
        enemy.animFrame = 0;
        enemy.animTimer = 0;

        // Ninja: sometimes jump attack
        if (enemy.enemyType === 'ninja' && Math.random() < 0.4) {
            enemy.vy = -400;
            enemy.grounded = false;
        }
    } else {
        enemy.state = 'idle';
        // Slight circling behavior
        if (d < enemy.attackRange) {
            enemy.x -= Math.sign(dx) * enemy.speed * 0.3 * dt;
        }
    }

    applyGravity(enemy, dt);

    // Keep in camera bounds
    enemy.x = clamp(enemy.x, camera.x + 20, camera.x + W - 20);

    return false;
}

function updateBossAI(boss, dt, dx, dy, d) {
    boss.aiTimer -= dt;

    switch(boss.bossType) {
        case 'bully':
            if (d > 100) {
                boss.state = 'walk';
                boss.x += Math.sign(dx) * boss.speed * dt;
                boss.y += Math.sign(dy) * boss.speed * 0.3 * dt;
            } else if (boss.attackTimer <= 0) {
                boss.state = 'attack1';
                boss.animFrame = 0; boss.animTimer = 0;
                // Ground slam - do area damage
                if (Math.random() < 0.3) {
                    boss.vx = boss.facing * 200;
                }
            }
            break;
        case 'shadow':
            if (boss.aiTimer <= 0) {
                // Teleport
                boss.x = player.x + (Math.random() < 0.5 ? -1 : 1) * rnd(60, 120);
                boss.y = player.y;
                boss.aiTimer = rnd(1.5, 3);
                emitParticles(boss.x, boss.y - boss.h/2, 'hit', 1);
            }
            if (d < boss.attackRange && boss.attackTimer <= 0) {
                boss.state = 'attack1';
                boss.animFrame = 0; boss.animTimer = 0;
            }
            if (d > boss.attackRange + 40 && boss.attackTimer <= 0) {
                // Throw projectile
                projectiles.push(createProjectile(boss.x, boss.y - boss.h * 0.5, boss.facing * 350, 0, boss.damage * 0.6, true));
                boss.attackTimer = boss.attackCooldown;
            }
            break;
        case 'mech':
            boss.state = 'walk';
            boss.x += Math.sign(dx) * boss.speed * dt;
            boss.y += Math.sign(dy) * boss.speed * 0.3 * dt;
            if (boss.attackTimer <= 0) {
                boss.state = 'attack1';
                boss.animFrame = 0; boss.animTimer = 0;
            }
            break;
        case 'twin':
            if (d > 80) {
                boss.x += Math.sign(dx) * boss.speed * dt;
                boss.y += Math.sign(dy) * boss.speed * 0.4 * dt;
                boss.state = 'walk';
            } else if (boss.attackTimer <= 0) {
                boss.state = 'attack1';
                boss.animFrame = 0; boss.animTimer = 0;
            }
            break;
        case 'chaos':
            // Multi-phase based on HP
            const phase = boss.hp > boss.maxHp * 0.6 ? 1 : (boss.hp > boss.maxHp * 0.3 ? 2 : 3);
            const spd = boss.speed * (phase === 3 ? 1.5 : 1);
            if (d > 80) {
                boss.x += Math.sign(dx) * spd * dt;
                boss.y += Math.sign(dy) * spd * 0.3 * dt;
                boss.state = 'walk';
            }
            if (boss.attackTimer <= 0) {
                boss.state = 'attack1';
                boss.animFrame = 0; boss.animTimer = 0;
                // Phase 1: spawn minions
                if (phase === 1 && Math.random() < 0.3 && enemies.length < MAX_ENEMIES_ON_SCREEN) {
                    enemies.push(createEnemy('goon', boss.x + rnd(-100, 100), boss.y));
                    waveEnemiesAlive++;
                }
                // Phase 2+: projectiles
                if (phase >= 2) {
                    projectiles.push(createProjectile(boss.x, boss.y - boss.h * 0.5, boss.facing * 400, 0, boss.damage * 0.7, true));
                }
            }
            break;
    }

    boss.y = clamp(boss.y, WALK_MIN_Y + 10, WALK_MAX_Y);
    boss.x = clamp(boss.x, camera.x + 20, camera.x + W - 20);
    applyGravity(boss, dt);

    if (boss.state === 'walk' && boss.animTimer >= 0.12) {
        boss.animTimer = 0;
        boss.animFrame = (boss.animFrame + 1) % 4;
    }

    return false;
}

function damagePlayer(damage, fromFacing) {
    if (player.invincible > 0 || player.state === 'dead') return;

    player.hp -= damage;
    player.flashTimer = 0.18;
    player.invincible = INVINCIBLE_TIME;
    player.state = 'hurt';
    player.stateTimer = 0.3;
    player.vx = -fromFacing * 150;

    emitParticles(player.x, player.y - player.h/2, 'hit', -fromFacing);
    triggerShake(8, 0.2);
    playSound('hurt');

    comboCount = 0;
    comboTimer = 0;

    // Body shrink
    player.targetBodyScale = Math.max(BODY_SCALE_MIN, player.targetBodyScale - 0.05);

    // Drop weapon on big hit
    if (player.weapon && damage >= 15 && WEAPON_DATA[player.weapon] && WEAPON_DATA[player.weapon].dropOnHit) {
        player.weapon = null;
        playSound('hurt');
    }

    // HUD shake
    hudShakeTimer = 0.15;

    if (player.hp <= 0) {
        player.hp = 0;
        lives--;
        if (lives <= 0) {
            player.state = 'dead';
            setTimeout(() => setState('gameover'), 1500);
        } else {
            // Respawn
            player.hp = Math.floor(player.maxHp * 0.5);
            player.invincible = 2;
            player.state = 'idle';
            emitParticles(player.x, player.y - player.h/2, 'star', 1);
        }
    }
}

// --- PROJECTILE SYSTEM ---
function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        if (p.life <= 0 || p.x < camera.x - 50 || p.x > camera.x + W + 50) {
            projectiles.splice(i, 1);
            continue;
        }

        // Hit player (enemy projectiles)
        if (p.fromEnemy && player && player.state !== 'dead' && player.invincible <= 0) {
            if (Math.abs(p.x - player.x) < 25 && Math.abs(p.y - player.y) < 30) {
                damagePlayer(p.damage, Math.sign(p.vx));
                emitParticles(p.x, p.y, 'hit', Math.sign(p.vx));
                projectiles.splice(i, 1);
                continue;
            }
        }

        // Hit enemies (player projectiles like throwing stars)
        if (!p.fromEnemy) {
            const targets = [...enemies];
            if (boss && boss.state !== 'dead') targets.push(boss);
            for (const e of targets) {
                if (e.state === 'dead' || e.invincible > 0) continue;
                if (Math.abs(p.x - e.x) < 25 && Math.abs(p.y - e.y) < 30) {
                    applyDamage(e, p.damage, Math.sign(p.vx) * 100);
                    spawnDamageNumber(e.x, e.y - e.h, p.damage, 'weapon');
                    emitParticles(p.x, p.y, 'hit', Math.sign(p.vx));
                    score += Math.floor(p.damage * 2);
                    specialMeter = Math.min(100, specialMeter + 5);
                    projectiles.splice(i, 1);
                    break;
                }
            }
        }
    }
}

function renderProjectiles(ctx) {
    for (const p of projectiles) {
        const sx = p.x - camera.x;
        ctx.save();
        ctx.translate(sx, p.y);
        if (p.fromEnemy) {
            ctx.fillStyle = '#ff4400';
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur = 8;
        } else {
            ctx.fillStyle = '#44aaff';
        }
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// --- IMPACT EFFECTS ---
function updateImpactEffects(dt) {
    for (let i = impactEffects.length - 1; i >= 0; i--) {
        impactEffects[i].life -= dt;
        if (impactEffects[i].life <= 0) impactEffects.splice(i, 1);
    }
}

function renderImpactEffects(ctx) {
    for (const ef of impactEffects) {
        const t = ef.life / ef.maxLife;
        drawImpactBurst(ctx, ef.x - camera.x, ef.y, ef.size * (1.5 - t * 0.5), ef.color, t);
    }
}

// --- AMBIENT PARTICLES ---
function updateAmbientParticles(dt) {
    // Spawn new ones
    if (ambientParticles.length < 30 && Math.random() < dt * 2) {
        const lv = LEVELS[selectedLevel];
        const type = lv.bgElements;
        let color, vy2, vx2, life2;
        if (type === 'park') { color = '#44aa22'; vy2 = rnd(10,30); vx2 = rnd(-20,20); life2 = 4; }
        else if (type === 'city') { color = '#aaa'; vy2 = rnd(-5,5); vx2 = rnd(-10,10); life2 = 5; }
        else if (type === 'rooftop') { color = '#ff8844'; vy2 = rnd(-40,-10); vx2 = rnd(-5,5); life2 = 3; }
        else if (type === 'factory') { color = '#ffcc00'; vy2 = rnd(-30,-10); vx2 = rnd(-15,15); life2 = 2; }
        else if (type === 'islamabad') { color = '#88aa44'; vy2 = rnd(-10,10); vx2 = rnd(-15,15); life2 = 4; }
        else if (type === 'castle') { color = '#8855aa'; vy2 = rnd(-20,-5); vx2 = rnd(-8,8); life2 = 3; }
        else if (type === 'space') { color = '#44ddff'; vy2 = rnd(-15,15); vx2 = rnd(-20,20); life2 = 2.5; }
        else { color = '#888'; vy2 = rnd(10,25); vx2 = rnd(-10,10); life2 = 4; }
        ambientParticles.push({
            x: camera.x + rnd(0, W), y: rnd(WALK_MIN_Y - 50, WALK_MIN_Y + 100),
            vx: vx2, vy: vy2, color, life: life2, maxLife: life2, size: rnd(1.5, 3), rotation: 0, rotationSpeed: rnd(-3,3)
        });
    }
    for (let i = ambientParticles.length - 1; i >= 0; i--) {
        const p = ambientParticles[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.rotation += p.rotationSpeed * dt; p.life -= dt;
        if (p.life <= 0 || p.x < camera.x - 50 || p.x > camera.x + W + 50) ambientParticles.splice(i, 1);
    }
}

function renderAmbientParticles(ctx) {
    for (const p of ambientParticles) {
        ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 0.5);
        ctx.save(); ctx.translate(p.x - camera.x, p.y); ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        ctx.restore();
    }
    ctx.globalAlpha = 1;
}

// --- WAVE SYSTEM ---
function updateWaves(dt) {
    if (levelComplete || bossActive) return;

    const lv = LEVELS[selectedLevel];

    if (waveLocked) {
        // Check if wave is cleared
        waveEnemiesAlive = enemies.filter(e => e.state !== 'dead').length;
        if (boss && boss.state !== 'dead') waveEnemiesAlive++;

        if (waveEnemiesAlive <= 0) {
            waveLocked = false;
            goArrowTimer = 2;
            playSound('powerup');
        }
        return;
    }

    // Check for next wave trigger
    if (waveIndex < lv.waves.length) {
        const wave = lv.waves[waveIndex];
        if (camera.x >= wave.triggerX - 50) {
            spawnWave(wave);
            waveIndex++;
            waveLocked = true;
        }
    } else if (!bossActive) {
        // All waves cleared, spawn boss
        if (camera.x >= lv.width - W - 200) {
            spawnBoss();
        }
    }
}

function spawnWave(wave) {
    for (const group of wave.enemies) {
        for (let i = 0; i < group.count; i++) {
            if (enemies.length >= MAX_ENEMIES_ON_SCREEN) break;
            const fromRight = Math.random() < 0.5;
            const x = fromRight ? camera.x + W + rnd(20, 80) : camera.x - rnd(20, 80);
            enemies.push(createEnemy(group.type, x));
        }
    }
    waveEnemiesAlive = enemies.filter(e => e.state !== 'dead').length;
}

function spawnBoss() {
    bossActive = true;
    bossIntroTimer = 1.5;
    const bossIdx = LEVELS[selectedLevel].boss;
    boss = createEnemy(null, camera.x + W + 50, WALK_MAX_Y - 40, bossIdx);
    boss.x = camera.x + W - 80;
    waveLocked = true;
    waveEnemiesAlive = 1;
    playSound('boss');
    triggerShake(6, 0.4);
}

// --- CAMERA ---
function updateCamera(dt) {
    if (!player) return;

    // Shake
    if (camera.shakeTime > 0) {
        camera.shakeTime -= dt;
        camera.shakeX = (Math.random() - 0.5) * camera.shakeIntensity * 2;
        camera.shakeY = (Math.random() - 0.5) * camera.shakeIntensity * 2;
    } else {
        camera.shakeX = 0;
        camera.shakeY = 0;
    }

    if (waveLocked) {
        // Still allow slight camera adjustments in locked mode
        return;
    }

    // Follow player smoothly
    const targetX = player.x - W * 0.35;
    camera.x = lerp(camera.x, targetX, 6 * dt);
    camera.x = clamp(camera.x, 0, LEVELS[selectedLevel].width - W);
}

function triggerShake(intensity, duration) {
    camera.shakeIntensity = intensity;
    camera.shakeTime = duration;
}

// --- PICKUP UPDATE ---
function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        p.animTimer += dt;

        if (!player) continue;
        if (Math.abs(p.x - player.x) < 30 && Math.abs(p.y - player.y) < 30) {
            // Weapon pickups
            if (p.type.startsWith('weapon_')) {
                const wType = p.type.replace('weapon_', '');
                player.weapon = wType;
                player.weaponTimer = WEAPON_DATA[wType].duration;
                player.weaponAmmo = WEAPON_DATA[wType].ammo || 0;
                emitParticles(p.x, p.y, 'powerup', 1);
                playSound('powerup');
                score += 50;
                pickups.splice(i, 1);
                continue;
            }

            // Collect
            switch(p.type) {
                case 'health': player.hp = Math.min(player.maxHp, player.hp + 30); break;
                case 'food_burger':
                    player.targetBodyScale = Math.min(BODY_SCALE_MAX, player.targetBodyScale + 0.15);
                    player.hp = Math.min(player.maxHp, player.hp + 10);
                    break;
                case 'food_pizza':
                    player.targetBodyScale = Math.min(BODY_SCALE_MAX, player.targetBodyScale + 0.1);
                    player.hp = Math.min(player.maxHp, player.hp + 15);
                    break;
                case 'food_chicken':
                    player.targetBodyScale = Math.min(BODY_SCALE_MAX, player.targetBodyScale + 0.12);
                    player.hp = Math.min(player.maxHp, player.hp + 20);
                    break;
                case 'power': player.damageMult = 2; setTimeout(() => { if(player) player.damageMult = 1; }, 8000); break;
                case 'speed': player.speed = PLAYER_SPEED * 1.4; setTimeout(() => { if(player) player.speed = PLAYER_SPEED; }, 6000); break;
                case 'shield': player.invincible = 5; break;
            }
            emitParticles(p.x, p.y, 'powerup', 1);
            playSound('powerup');
            score += 50;
            pickups.splice(i, 1);
        }

        // Timeout
        if (p.animTimer > 10) pickups.splice(i, 1);
    }
}

// --- INPUT ---
// --- GAMEPAD SUPPORT ---
const gamepadInput = { left: false, right: false, up: false, down: false, attack: false, kick: false, jump: false, special: false };

function pollGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (!gp) return;

    const deadzone = 0.3;
    // Left stick or D-pad
    gamepadInput.left = (gp.axes[0] < -deadzone) || (gp.buttons[14] && gp.buttons[14].pressed);
    gamepadInput.right = (gp.axes[0] > deadzone) || (gp.buttons[15] && gp.buttons[15].pressed);
    gamepadInput.up = (gp.axes[1] < -deadzone) || (gp.buttons[12] && gp.buttons[12].pressed);
    gamepadInput.down = (gp.axes[1] > deadzone) || (gp.buttons[13] && gp.buttons[13].pressed);
    // A/Cross = Jump, B/Circle = Punch, X/Square = Kick, Y/Triangle = Special
    gamepadInput.jump = gp.buttons[0] && gp.buttons[0].pressed;
    gamepadInput.attack = gp.buttons[1] && gp.buttons[1].pressed;
    gamepadInput.kick = gp.buttons[2] && gp.buttons[2].pressed;
    gamepadInput.special = gp.buttons[3] && gp.buttons[3].pressed;
    // Also: shoulder buttons for punch/kick
    if (gp.buttons[4] && gp.buttons[4].pressed) gamepadInput.kick = true;
    if (gp.buttons[5] && gp.buttons[5].pressed) gamepadInput.attack = true;
    // Start = pause
    if (gp.buttons[9] && gp.buttons[9].pressed) {
        if (!gamepadInput._startWas) {
            if (gameState === 'playing') setState('paused');
            else if (gameState === 'paused') setState('playing');
        }
        gamepadInput._startWas = true;
    } else { gamepadInput._startWas = false; }
}

function getInput() {
    return {
        left: keys['ArrowLeft'] || keys['KeyA'] || mobileInput.left || gamepadInput.left,
        right: keys['ArrowRight'] || keys['KeyD'] || mobileInput.right || gamepadInput.right,
        up: keys['ArrowUp'] || keys['KeyW'] || mobileInput.up || gamepadInput.up,
        down: keys['ArrowDown'] || keys['KeyS'] || mobileInput.down || gamepadInput.down,
        attack: keys['KeyJ'] || keys['Space'] || mobileInput.attack || gamepadInput.attack,
        kick: keys['KeyK'] || keys['KeyF'] || mobileInput.kick || gamepadInput.kick,
        jump: keys['KeyL'] || keys['ShiftLeft'] || mobileInput.jump || gamepadInput.jump,
        special: keys['KeyI'] || keys['KeyE'] || mobileInput.special || gamepadInput.special,
    };
}

// Edge-detection for single-press actions
let prevAttack = false, prevJump = false, prevSpecial = false, prevKick = false;
let attackPressed = false, jumpPressed = false, specialPressed = false, kickPressed = false;
function updateInputEdges() {
    const inp = getInput();
    if (inp.attack && !prevAttack) attackPressed = true;
    if (inp.kick && !prevKick) kickPressed = true;
    if (inp.jump && !prevJump) jumpPressed = true;
    if (inp.special && !prevSpecial) specialPressed = true;
    prevAttack = inp.attack;
    prevKick = inp.kick;
    prevJump = inp.jump;
    prevSpecial = inp.special;
}
function consumeAttack() { const v = attackPressed; attackPressed = false; return v; }
function consumeKick() { const v = kickPressed; kickPressed = false; return v; }
function consumeJump() { const v = jumpPressed; jumpPressed = false; return v; }
function consumeSpecial() { const v = specialPressed; specialPressed = false; return v; }

function setupKeyboard() {
    window.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });
}

function setupTouch() {
    isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (!isMobile) return;

    document.getElementById('mobile-controls').style.display = 'block';

    const joystickZone = document.getElementById('joystick-zone');
    const joystickBase = document.getElementById('joystick-base');
    const joystickThumb = document.getElementById('joystick-thumb');

    joystickZone.addEventListener('touchstart', e => {
        e.preventDefault();
        initAudio();
        const touch = e.changedTouches[0];
        joystickActive = true;
        joystickId = touch.identifier;
        const rect = joystickBase.getBoundingClientRect();
        joystickBaseX = rect.left + rect.width / 2;
        joystickBaseY = rect.top + rect.height / 2;
        updateJoystick(touch.clientX, touch.clientY);
    }, { passive: false });

    joystickZone.addEventListener('touchmove', e => {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            if (touch.identifier === joystickId) {
                updateJoystick(touch.clientX, touch.clientY);
            }
        }
    }, { passive: false });

    const endJoystick = e => {
        for (const touch of e.changedTouches) {
            if (touch.identifier === joystickId) {
                joystickActive = false;
                joystickId = null;
                mobileInput.left = mobileInput.right = mobileInput.up = mobileInput.down = false;
                joystickThumb.style.transform = 'translate(0, 0)';
            }
        }
    };
    joystickZone.addEventListener('touchend', endJoystick);
    joystickZone.addEventListener('touchcancel', endJoystick);

    function updateJoystick(cx, cy) {
        let dx = cx - joystickBaseX;
        let dy = cy - joystickBaseY;
        const maxDist = 55;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d > maxDist) { dx = dx/d * maxDist; dy = dy/d * maxDist; }
        joystickThumb.style.transform = `translate(${dx}px, ${dy}px)`;
        const deadzone = 0.2;
        const nx = dx / maxDist;
        const ny = dy / maxDist;
        mobileInput.left = nx < -deadzone;
        mobileInput.right = nx > deadzone;
        mobileInput.up = ny < -deadzone;
        mobileInput.down = ny > deadzone;
    }

    // Action buttons
    setupActionButton('btn-attack', 'attack');
    setupActionButton('btn-kick', 'kick');
    setupActionButton('btn-jump', 'jump');
    setupActionButton('btn-special', 'special');
}

function setupActionButton(id, action) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('touchstart', e => {
        e.preventDefault();
        initAudio();
        mobileInput[action] = true;
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(action === 'kick' ? 20 : action === 'attack' ? 15 : 30);
    }, { passive: false });
    btn.addEventListener('touchend', e => {
        e.preventDefault();
        mobileInput[action] = false;
    }, { passive: false });
    btn.addEventListener('touchcancel', e => {
        mobileInput[action] = false;
    });
}

// Prevent default touch behaviors
document.addEventListener('touchmove', e => {
    if (e.target.closest('#game-container')) e.preventDefault();
}, { passive: false });

// --- HUD ---
function drawHUD(ctx) {
    ctx.save();
    // HUD shake offset
    if (hudShakeTimer > 0) {
        ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    }

    // Health bar - rounded gradient
    drawRR(ctx, 14, 14, 204, 24, 6, 'rgba(0,0,0,0.5)');
    drawRR(ctx, 16, 16, 200, 20, 5, '#222');
    const hpPct = player ? player.hp / player.maxHp : 0;
    const hpColor = hpPct > 0.5 ? '#44cc44' : (hpPct > 0.25 ? '#ccaa22' : '#cc2222');
    if (hpPct > 0) {
        const hpGrad = ctx.createLinearGradient(16, 16, 16, 36);
        hpGrad.addColorStop(0, hpColor);
        hpGrad.addColorStop(1, shadeColor(hpColor, -0.35));
        drawRR(ctx, 16, 16, 200 * hpPct, 20, 5, null);
        ctx.fillStyle = hpGrad; ctx.fill();
        // Inner highlight
        ctx.globalAlpha = 0.2; ctx.fillStyle = '#fff';
        drawRR(ctx, 16, 16, 200 * hpPct, 8, 4, '#fff');
        ctx.globalAlpha = 1;
    }
    // Border
    drawRR(ctx, 16, 16, 200, 20, 5, null, '#fff', 2);
    // Heart icon
    ctx.fillStyle = '#ff4444';
    const hix = 24, hiy = 26;
    ctx.beginPath();
    ctx.moveTo(hix, hiy - 2);
    ctx.bezierCurveTo(hix, hiy - 5, hix - 5, hiy - 6, hix - 5, hiy - 3);
    ctx.bezierCurveTo(hix - 5, hiy, hix, hiy + 3, hix, hiy + 4);
    ctx.bezierCurveTo(hix, hiy + 3, hix + 5, hiy, hix + 5, hiy - 3);
    ctx.bezierCurveTo(hix + 5, hiy - 6, hix, hiy - 5, hix, hiy - 2);
    ctx.fill();

    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'left';
    ctx.fillText('HP', 32, 31);

    // Special meter - segmented with glow
    drawRR(ctx, 16, 40, 200, 10, 3, '#222');
    const specColor = specialMeter >= 100 ? '#ffcc00' : '#ff8800';
    if (specialMeter > 0) {
        const specGrad = ctx.createLinearGradient(16, 40, 16, 50);
        specGrad.addColorStop(0, specColor);
        specGrad.addColorStop(1, shadeColor(specColor, -0.3));
        drawRR(ctx, 16, 40, 200 * (specialMeter / 100), 10, 3, null);
        ctx.fillStyle = specGrad; ctx.fill();
    }
    // Segment lines
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
    for (let seg = 1; seg < 4; seg++) {
        ctx.beginPath(); ctx.moveTo(16 + seg * 50, 40); ctx.lineTo(16 + seg * 50, 50); ctx.stroke();
    }
    drawRR(ctx, 16, 40, 200, 10, 3, null, '#888', 1);
    if (specialMeter >= 100) {
        // Glow when full
        drawSoftGlow(ctx, 116, 45, 100, '#ffcc00', 0.08);
        ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 9px Arial';
        ctx.fillText('SPECIAL READY!', 60, 49);
    }

    // Weapon indicator
    if (player && player.weapon) {
        drawRR(ctx, 16, 54, 100, 18, 4, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = WEAPON_DATA[player.weapon].color;
        ctx.font = 'bold 11px Arial'; ctx.textAlign = 'left';
        let weaponText = WEAPON_DATA[player.weapon].name;
        if (player.weapon === 'stars') weaponText += ' x' + player.weaponAmmo;
        else weaponText += ' ' + Math.ceil(player.weaponTimer) + 's';
        ctx.fillText(weaponText, 20, 67);
    }

    // Body scale indicator
    if (player) {
        const bs = player.bodyScale;
        if (bs > 1.1 || bs < 0.9) {
            ctx.fillStyle = bs > 1 ? '#44ff44' : '#ff4444';
            ctx.font = 'bold 11px Arial'; ctx.textAlign = 'left';
            ctx.fillText(bs > 1 ? 'POWER UP!' : 'weakened', 16, 82);
        }
    }

    // Score with stroke outline and bounce on increase
    const scoreScale = scoreDisplayTimer > 0 ? 1 + scoreDisplayTimer * 0.5 : 1;
    ctx.save();
    ctx.translate(W/2, 30);
    ctx.scale(scoreScale, scoreScale);
    ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
    ctx.strokeText('SCORE: ' + score, 0, 0);
    ctx.fillStyle = '#fff';
    ctx.fillText('SCORE: ' + score, 0, 0);
    ctx.restore();

    // Lives - gradient hearts with pulse
    ctx.textAlign = 'right';
    for (let i = 0; i < lives; i++) {
        const lx = W - 30 - i * 28;
        const pulse = 1 + Math.sin(Date.now() * 0.003 + i) * 0.05;
        ctx.save();
        ctx.translate(lx, 24);
        ctx.scale(pulse, pulse);
        // Heart gradient
        const heartG = ctx.createRadialGradient(-2, -2, 0, 0, 2, 12);
        heartG.addColorStop(0, '#ff6666');
        heartG.addColorStop(1, '#cc2222');
        ctx.fillStyle = heartG;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(0, -6, -8, -10, -8, -4);
        ctx.bezierCurveTo(-8, 2, 0, 6, 0, 10);
        ctx.bezierCurveTo(0, 6, 8, 2, 8, -4);
        ctx.bezierCurveTo(8, -10, 0, -6, 0, 0);
        ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
    }

    // Boss HP bar - gradient fill
    if (bossActive && boss && boss.state !== 'dead') {
        const bw = 300;
        const bx = (W - bw) / 2;
        drawRR(ctx, bx - 2, 54, bw + 4, 22, 4, 'rgba(0,0,0,0.6)');
        drawRR(ctx, bx, 56, bw, 18, 3, '#222');
        const bossHpPct = boss.hp / boss.maxHp;
        if (bossHpPct > 0) {
            const bossGrad = ctx.createLinearGradient(bx, 56, bx, 74);
            bossGrad.addColorStop(0, '#ff4444');
            bossGrad.addColorStop(1, '#aa0000');
            drawRR(ctx, bx, 56, bw * bossHpPct, 18, 3, null);
            ctx.fillStyle = bossGrad; ctx.fill();
            // Inner highlight
            ctx.globalAlpha = 0.15; ctx.fillStyle = '#fff';
            drawRR(ctx, bx, 56, bw * bossHpPct, 7, 3, '#fff');
            ctx.globalAlpha = 1;
        }
        drawRR(ctx, bx, 56, bw, 18, 3, null, '#ff4444', 2);
        // Skull icon
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(bx + 14, 65, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(bx + 12, 64, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(bx + 16, 64, 1.5, 0, Math.PI*2); ctx.fill();
        // Boss name
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        ctx.strokeText(BOSS_DEFS[LEVELS[selectedLevel].boss].name, W/2, 70);
        ctx.fillText(BOSS_DEFS[LEVELS[selectedLevel].boss].name, W/2, 70);
    }

    // Combo counter with glow
    if (comboDisplayTimer > 0 && comboCount >= 2) {
        const scale = comboDisplayTimer > 1.3 ? 1 + (1.5 - comboDisplayTimer) * 3 : 1;
        const alpha = Math.min(1, comboDisplayTimer);
        ctx.globalAlpha = alpha;
        ctx.save();
        ctx.translate(W - 120, H * 0.35);
        ctx.scale(scale, scale);

        const comboColors = ['#ffcc00', '#ff8800', '#ff4444', '#ff44ff', '#44ffff'];
        const ccIdx = Math.min(comboCount - 2, comboColors.length - 1);
        ctx.fillStyle = comboColors[ccIdx];
        ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
        ctx.strokeText(comboCount + ' HIT', 0, 0);
        ctx.fillText(comboCount + ' HIT', 0, 0);

        if (comboCount >= 5) {
            // Glow behind combo text
            drawSoftGlow(ctx, 0, 0, 60, comboColors[ccIdx], 0.12);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 18px Arial';
            ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
            ctx.strokeText(comboCount >= 10 ? 'MEGA!!' : 'COMBO!', 0, 28);
            ctx.fillText(comboCount >= 10 ? 'MEGA!!' : 'COMBO!', 0, 28);
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    }

    // GO arrow
    if (goArrowTimer > 0 && !waveLocked) {
        const alpha = Math.min(1, goArrowTimer);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 32px Arial'; ctx.textAlign = 'center';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
        const arrowX = W - 80 + Math.sin(Date.now() / 200) * 10;
        ctx.strokeText('GO >', arrowX, H / 2);
        ctx.fillText('GO >', arrowX, H / 2);
        ctx.globalAlpha = 1;
    }

    // Level intro
    if (levelIntroTimer > 0) {
        const alpha = levelIntroTimer > 1 ? 1 : levelIntroTimer;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
        ctx.strokeText(LEVELS[selectedLevel].name, W/2, H/2 - 20);
        ctx.fillText(LEVELS[selectedLevel].name, W/2, H/2 - 20);
        ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 28px Arial';
        ctx.strokeText('FIGHT!', W/2, H/2 + 25);
        ctx.fillText('FIGHT!', W/2, H/2 + 25);
        ctx.globalAlpha = 1;
    }

    // Boss intro
    if (bossIntroTimer > 0) {
        const alpha = Math.min(1, bossIntroTimer);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, H/2 - 40, W, 80);
        ctx.fillStyle = '#ff4444'; ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
        const bossName = BOSS_DEFS[LEVELS[selectedLevel].boss].name;
        ctx.strokeText('WARNING: ' + bossName, W/2, H/2 + 10);
        ctx.fillText('WARNING: ' + bossName, W/2, H/2 + 10);
        ctx.globalAlpha = 1;
    }

    ctx.restore();

    // Update special button state
    const specialBtn = document.getElementById('btn-special');
    if (specialBtn) {
        specialBtn.classList.toggle('disabled', specialMeter < 100);
    }
}

// --- GAME STATE MANAGEMENT ---
function setState(newState) {
    gameState = newState;

    document.getElementById('menu-overlay').classList.toggle('hidden', newState !== 'menu');
    document.getElementById('char-select-overlay').classList.toggle('hidden', newState !== 'char_select');
    document.getElementById('level-select-overlay').classList.toggle('hidden', newState !== 'level_select');
    document.getElementById('pause-overlay').classList.toggle('hidden', newState !== 'paused');
    document.getElementById('result-overlay').classList.toggle('hidden', newState !== 'victory' && newState !== 'gameover');

    const pauseBtn = document.getElementById('btn-pause');
    pauseBtn.style.display = newState === 'playing' ? 'flex' : 'none';

    // Show/hide touch controls
    if (isMobile) {
        document.getElementById('mobile-controls').style.display = (newState === 'playing' || newState === 'paused') ? 'block' : 'none';
    }
    // Show/hide keyboard hint on desktop
    const kbHint = document.getElementById('keyboard-hint');
    if (kbHint) {
        kbHint.style.display = (!isMobile && newState === 'playing') ? 'block' : 'none';
    }

    switch(newState) {
        case 'char_select':
            buildCharSelect();
            break;
        case 'level_select':
            buildLevelSelect();
            break;
        case 'playing':
            if (gameState !== 'paused') {
                // Already playing, just resume
            }
            break;
        case 'victory':
            showResult(true);
            break;
        case 'gameover':
            showResult(false);
            break;
    }
}

function buildCharSelect() {
    const container = document.getElementById('char-options');
    container.innerHTML = '';
    COLORS.heroes.forEach((hero, i) => {
        const opt = document.createElement('div');
        opt.className = 'char-option' + (i === selectedHero ? ' selected' : '');

        // Draw mini character preview
        const miniCanvas = document.createElement('canvas');
        miniCanvas.width = 60; miniCanvas.height = 80;
        const mCtx = miniCanvas.getContext('2d');
        mCtx.translate(30, 70);
        const miniEntity = { x: 0, y: 0, w: 30, h: 50, facing: 1, state: 'idle', animFrame: 0, flashTimer: 0, invincible: 0 };
        // Draw simplified character
        drawOutlinedCircle(mCtx, 0, -45, 10, hero.skin, 2);
        drawOutlinedRect(mCtx, -10, -32, 20, 18, hero.shirt, 2);
        drawOutlinedRect(mCtx, -8, -14, 7, 16, hero.pants, 2);
        drawOutlinedRect(mCtx, 1, -14, 7, 16, hero.pants, 2);

        opt.appendChild(miniCanvas);

        const name = document.createElement('div');
        name.className = 'char-name';
        name.textContent = hero.name;
        opt.appendChild(name);

        opt.addEventListener('click', () => {
            initAudio();
            playSound('select');
            selectedHero = i;
            document.querySelectorAll('.char-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
        });

        container.appendChild(opt);
    });
}

function buildLevelSelect() {
    loadProgress();
    const container = document.getElementById('level-options');
    container.innerHTML = '';
    LEVELS.forEach((lv, i) => {
        const opt = document.createElement('div');
        const unlocked = i < savedProgress.unlocked;
        opt.className = 'level-option' + (i === selectedLevel ? ' selected' : '') + (!unlocked ? ' locked' : '');

        const name = document.createElement('div');
        name.className = 'level-name';
        name.textContent = (i + 1) + '. ' + lv.name;
        opt.appendChild(name);

        const stars = document.createElement('div');
        stars.className = 'level-stars';
        const s = savedProgress.stars[i] || 0;
        stars.textContent = (s >= 1 ? '\u2605' : '\u2606') + (s >= 2 ? '\u2605' : '\u2606') + (s >= 3 ? '\u2605' : '\u2606');
        opt.appendChild(stars);

        if (unlocked) {
            opt.addEventListener('click', () => {
                initAudio();
                playSound('select');
                selectedLevel = i;
                document.querySelectorAll('.level-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                startLevel(i);
            });
        }

        container.appendChild(opt);
    });
}

function startLevel(levelIdx) {
    selectedLevel = levelIdx;
    player = createPlayer(selectedHero);
    enemies = [];
    particles = [];
    pickups = [];
    projectiles = [];
    damageNumbers = [];
    camera.x = 0; camera.y = 0;
    camera.shakeTime = 0;
    score = 0;
    lives = 3;
    specialMeter = 0;
    comboCount = 0;
    comboTimer = 0;
    comboDisplayTimer = 0;
    maxComboDisplay = 0;
    waveIndex = 0;
    waveLocked = false;
    waveEnemiesAlive = 0;
    bossActive = false;
    boss = null;
    levelComplete = false;
    goArrowTimer = 0;
    levelIntroTimer = 2;
    bossIntroTimer = 0;
    hitStopTimer = 0;

    // Reset visual effects
    impactEffects = [];
    ambientParticles = [];
    screenFlashAlpha = 0;
    transitionAlpha = 0;
    hudShakeTimer = 0;
    lastScore = 0;
    scoreDisplayTimer = 0;

    generateBgElements(levelIdx);
    setState('playing');
}

function showResult(victory) {
    const details = document.getElementById('result-details');
    const title = document.getElementById('result-title');
    const nextBtn = document.getElementById('btn-next-level');

    if (victory) {
        title.textContent = 'VICTORY!';
        title.style.color = '#ffcc00';

        const earnedStars = lives === 3 ? 3 : (score > 2000 ? 2 : 1);
        details.innerHTML = `
            <div class="result-score">${score}</div>
            <div class="result-stars">${'\u2605'.repeat(earnedStars)}${'\u2606'.repeat(3 - earnedStars)}</div>
            <div>Best Combo: ${maxComboDisplay} hits</div>
        `;

        // Save progress
        loadProgress();
        if (selectedLevel + 1 > savedProgress.unlocked - 1) {
            savedProgress.unlocked = Math.min(5, selectedLevel + 2);
        }
        savedProgress.scores[selectedLevel] = Math.max(savedProgress.scores[selectedLevel], score);
        savedProgress.stars[selectedLevel] = Math.max(savedProgress.stars[selectedLevel], earnedStars);
        saveProgress();

        nextBtn.style.display = selectedLevel < 4 ? 'block' : 'none';
        nextBtn.textContent = 'NEXT LEVEL';

        emitParticles(W/2 + camera.x, H/2, 'confetti', 1);
        playSound('victory');
    } else {
        title.textContent = 'GAME OVER';
        title.style.color = '#ff4444';
        details.innerHTML = `
            <div class="result-score">${score}</div>
            <div>Best Combo: ${maxComboDisplay} hits</div>
        `;
        nextBtn.textContent = 'TRY AGAIN';
        nextBtn.style.display = 'block';
        nextBtn.onclick = () => startLevel(selectedLevel);
        playSound('defeat');
    }
}

// --- PROGRESS ---
function loadProgress() {
    try {
        const saved = localStorage.getItem('mikhailBrawler');
        if (saved) savedProgress = JSON.parse(saved);
    } catch(e) {}
}

function saveProgress() {
    try {
        localStorage.setItem('mikhailBrawler', JSON.stringify(savedProgress));
    } catch(e) {}
}

// --- MAIN GAME LOOP ---
function update(dt) {
    if (gameState !== 'playing') return;

    // Hit stop
    if (hitStopTimer > 0) {
        hitStopTimer -= dt;
        return;
    }

    // Timers
    levelIntroTimer = Math.max(0, levelIntroTimer - dt);
    bossIntroTimer = Math.max(0, bossIntroTimer - dt);
    goArrowTimer = Math.max(0, goArrowTimer - dt);
    comboTimer -= dt;
    comboDisplayTimer -= dt;
    if (comboTimer <= 0) comboCount = 0;

    if (levelIntroTimer > 0) return;

    // Edge-detect single-press inputs
    updateInputEdges();

    updatePlayer(dt);

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const dead = updateEnemyAI(enemies[i], dt);
        if (dead) enemies.splice(i, 1);
    }

    // Update boss
    if (boss) {
        const dead = updateEnemyAI(boss, dt);
        if (dead) {
            boss = null;
            bossActive = false;
            levelComplete = true;
            waveLocked = false;
            setTimeout(() => setState('victory'), 2000);
        }
    }

    updateWaves(dt);
    updateCamera(dt);
    updateParticles(dt);
    updateDamageNumbers(dt);
    updatePickups(dt);
    updateProjectiles(dt);

    // Update visual effects
    updateImpactEffects(dt);
    updateAmbientParticles(dt);
    screenFlashAlpha = Math.max(0, screenFlashAlpha - dt * 5);
    transitionAlpha = Math.max(0, transitionAlpha - dt * 2);
    hudShakeTimer = Math.max(0, hudShakeTimer - dt);
    if (score !== lastScore) { scoreDisplayTimer = 0.2; lastScore = score; }
    scoreDisplayTimer = Math.max(0, scoreDisplayTimer - dt);
}

function render() {
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    ctx.translate(camera.shakeX, camera.shakeY);

    // Background
    drawBackground(ctx, selectedLevel);

    // Collect all entities for depth sorting
    const entities = [];
    if (player && player.state !== 'dead') entities.push(player);
    for (const e of enemies) entities.push(e);
    if (boss) entities.push(boss);

    // Sort by Y position (depth)
    entities.sort((a, b) => a.y - b.y);

    // Pickups
    for (const p of pickups) drawPickup(ctx, p);

    // Draw afterimages before player
    if (player && player.afterimages) {
        for (const ai of player.afterimages) {
            ctx.globalAlpha = ai.life / 0.15 * 0.25;
            const tempEntity = {
                ...player,
                x: ai.x, y: ai.y, facing: ai.facing,
                invincible: 0, flashTimer: 0,
            };
            drawCharacter(ctx, tempEntity, player.colors, false);
        }
        ctx.globalAlpha = 1;
    }

    // Draw entities
    for (const e of entities) {
        if (e.isPlayer) {
            drawCharacter(ctx, e, e.colors, false);
        } else {
            drawCharacter(ctx, e, e.colors, true);
        }
    }

    // Projectiles
    renderProjectiles(ctx);

    // Particles
    renderParticles(ctx);

    // Damage numbers
    renderDamageNumbers(ctx);

    // Impact effects
    renderImpactEffects(ctx);

    // Ambient particles
    renderAmbientParticles(ctx);

    ctx.restore();

    // --- Screen effects (after camera restore) ---

    // Screen flash
    if (screenFlashAlpha > 0) {
        ctx.globalAlpha = screenFlashAlpha;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
    }

    // Boss vignette
    if (bossActive) {
        const vig = ctx.createRadialGradient(W/2, H/2, W * 0.4, W/2, H/2, W * 0.8);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
    }

    // Transition fade
    if (transitionAlpha > 0) {
        ctx.globalAlpha = transitionAlpha;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
    }

    // HUD (not affected by camera shake)
    if (gameState === 'playing') drawHUD(ctx);
}

function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);

    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    // Poll gamepad every frame
    pollGamepad();

    if (gameState === 'playing') {
        update(dt);
        render();
    } else if (gameState === 'paused') {
        render();
    }
}

// --- MENU BUTTON HANDLERS ---
function setupMenus() {
    document.getElementById('btn-start').addEventListener('click', () => {
        initAudio();
        playSound('select');
        setState('char_select');
    });

    document.getElementById('btn-char-confirm').addEventListener('click', () => {
        playSound('select');
        setState('level_select');
    });

    document.getElementById('btn-back-menu').addEventListener('click', () => {
        playSound('select');
        setState('menu');
    });

    document.getElementById('btn-pause').addEventListener('click', () => {
        playSound('select');
        setState('paused');
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
        playSound('select');
        setState('playing');
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
        playSound('select');
        startLevel(selectedLevel);
    });

    document.getElementById('btn-quit').addEventListener('click', () => {
        playSound('select');
        setState('menu');
    });

    document.getElementById('btn-next-level').addEventListener('click', () => {
        playSound('select');
        if (gameState === 'gameover') {
            startLevel(selectedLevel);
        } else if (selectedLevel < 4) {
            startLevel(selectedLevel + 1);
        } else {
            setState('menu');
        }
    });

    document.getElementById('btn-result-menu').addEventListener('click', () => {
        playSound('select');
        setState('menu');
    });
}

// --- INIT ---
function init() {
    canvas = document.getElementById('game-canvas');
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    loadProgress();
    setupKeyboard();
    setupTouch();
    setupMenus();

    // Keyboard shortcut for pause
    window.addEventListener('keydown', e => {
        if (e.code === 'Escape') {
            if (gameState === 'playing') setState('paused');
            else if (gameState === 'paused') setState('playing');
        }
    });

    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Start
init();
