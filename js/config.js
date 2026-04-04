// ============================================================
// CIRCUIT RACING 1 — Config & Constants
// ============================================================

const CAR_COLORS = {
    dragon:    { body: 0xe74c3c, accent: 0xff2200, name: 'Fire Dragon', topSpeed: 100 },
    thunder:   { body: 0x3498db, accent: 0x1a6dff, name: 'Thunder Bolt', topSpeed: 110 },
    hulk:      { body: 0x2ecc71, accent: 0x00cc44, name: 'Hulk Smasher', topSpeed: 120 },
    goldking:  { body: 0xf1c40f, accent: 0xffaa00, name: 'Gold King', topSpeed: 130 },
    shadow:    { body: 0x2c3e50, accent: 0x1a1a2e, name: 'Shadow Ninja', topSpeed: 140 },
    rocket:    { body: 0xff6b35, accent: 0xff4400, name: 'Rocket Blaster', topSpeed: 155 },
    galaxy:    { body: 0x9b59b6, accent: 0x7d3c98, name: 'Galaxy Rider', topSpeed: 170 },
    ice:       { body: 0x00d2ff, accent: 0x00aacc, name: 'Ice Breaker', topSpeed: 185 },
    tiger:     { body: 0xff8c00, accent: 0xcc6600, name: 'Tiger Claw', topSpeed: 200 },
    bugatti:   { body: 0x1a1a2e, accent: 0x00aaff, name: 'Bugatti Chiron SS', topSpeed: 490 }
};

const AI_DRIVERS = [
    { name: 'Ayzal', title: 'Speed Queen' },
    { name: 'Chachu', title: 'Drift Master' },
    { name: 'Dadi', title: 'The Legend' },
    { name: 'Dada', title: 'Road King' },
    { name: 'Mama', title: 'Turbo Star' },
    { name: 'Baba', title: 'The Champion' }
];

const PHYS = {
    maxSpeed: 140, accel: 55, brake: 70, reverseMax: 30,
    turnSpeed: 2.5, friction: 0.988, driftFriction: 0.93,
    driftTurnMult: 1.8, minTurnSpeed: 3, offTrackMult: 0.94,
    nitroBoost: 50, nitroDuration: 2.0, nitroCooldown: 8.0,
    wallSpeedLoss: 0.7, gravity: 30
};

const AI_DIFF = {
    kid:    { speedMult: 0.55, accuracy: 0.45, wpThresh: 30 },
    easy:   { speedMult: 0.72, accuracy: 0.60, wpThresh: 22 },
    medium: { speedMult: 0.86, accuracy: 0.82, wpThresh: 15 },
    hard:   { speedMult: 0.95, accuracy: 0.93, wpThresh: 11 }
};

const RACE_LAPS = 10;
const TRACK_ROAD_W = 22;
const ITEMS = { BOOST: 'boost', SHIELD: 'shield', MISSILE: 'missile', OIL: 'oil', BANANA: 'banana', STAR: 'star', LIGHTNING: 'lightning', MAGNET: 'magnet' };

// Item distribution per difficulty
const ITEM_LISTS = {
    kid:    [ITEMS.BOOST, ITEMS.BOOST, ITEMS.BOOST, ITEMS.SHIELD, ITEMS.SHIELD, ITEMS.STAR, ITEMS.MAGNET],
    easy:   [ITEMS.BOOST, ITEMS.BOOST, ITEMS.SHIELD, ITEMS.SHIELD, ITEMS.MISSILE, ITEMS.STAR, ITEMS.BANANA],
    medium: [ITEMS.BOOST, ITEMS.SHIELD, ITEMS.MISSILE, ITEMS.MISSILE, ITEMS.OIL, ITEMS.BANANA, ITEMS.STAR, ITEMS.LIGHTNING],
    hard:   [ITEMS.BOOST, ITEMS.SHIELD, ITEMS.MISSILE, ITEMS.MISSILE, ITEMS.OIL, ITEMS.OIL, ITEMS.BANANA, ITEMS.LIGHTNING]
};

const TRACK_NAMES = ['Green Valley', 'Desert Circuit', 'Mountain Pass', 'Islamabad GP'];

const TRACK_THEMES = {
    0: { sky: 0x7ec8e3, fog: 0x7ec8e3, ground: '#2d5a1e', sunColor: 0xffeedd, sunIntensity: 1.1, ambientColor: 0x505070, hemiSky: 0x87ceeb, hemiGround: 0x2d5a1e, name: 'Green Valley' },
    1: { sky: 0xe8c87a, fog: 0xe8c87a, ground: '#c4a35a', sunColor: 0xffffff, sunIntensity: 1.4, ambientColor: 0x706050, hemiSky: 0xe8c87a, hemiGround: 0x8b7355, name: 'Desert Circuit' },
    2: { sky: 0x8aafc7, fog: 0x8aafc7, ground: '#3a6b3a', sunColor: 0xccddff, sunIntensity: 0.9, ambientColor: 0x405060, hemiSky: 0x8aafc7, hemiGround: 0x3a6b3a, name: 'Mountain Pass' },
    3: { sky: 0x87ceeb, fog: 0xa8d8ea, ground: '#2a6e2a', sunColor: 0xffe8cc, sunIntensity: 1.2, ambientColor: 0x556070, hemiSky: 0x87ceeb, hemiGround: 0x2a6e2a, name: 'Islamabad GP' }
};

// Graphics quality presets
const GFX_PRESETS = {
    low:    { shadows: false, shadowRes: 512,  bloom: false, particles: 200,  fxaa: false, detailTrees: false },
    medium: { shadows: true,  shadowRes: 1024, bloom: true,  particles: 600,  fxaa: true,  detailTrees: true },
    high:   { shadows: true,  shadowRes: 4096, bloom: true,  particles: 1200, fxaa: true,  detailTrees: true }
};

// --- GLOBALS ---
let scene, camera, renderer, clock, composer;
let gameState = 'menu';
let gameMode = 'vs_bots';
let playerColorKey = 'dragon';
let selectedTrack = 0;
let selectedDifficulty = 'easy';
let allCars = [], playerCars = [], aiCars = [];
let track = null;
let cameraMode = 0;
const cameraNames = ['Chase Cam', 'Cockpit', 'Overhead', 'Orbit'];
let orbitAngle = 0;
let raceStartTime = 0;
let keys = {};
let mobileInput = { up: false, down: false, left: false, right: false, drift: false, nitro: false, useItem: false, horn: false };
let isMobile = false;
let trackWalls = [];
let tutorialActive = false, tutorialStep = 0;
let minimapCtx = null;
let toonGradient = null;
let gfxQuality = 'medium';
let currentGfx = GFX_PRESETS.medium;

// Particle system
let particleSystem = null;
let particleData = [];

// Power-ups
let itemBoxes = [];
let projectiles = [];
let hazards = [];

// Clouds
let clouds = [];

// Moving obstacles
let movingObstacles = [];

// Static obstacles (cones, barrels, barriers)
let staticObstacles = [];

// Drift scoring
let driftScore = 0;
let driftCombo = 0;
let driftComboTimer = 0;
let driftPopups = [];

// Best times (localStorage)
let bestTimes = {};

// Star active effect
let starEffectCars = [];

// Lightning effect
let lightningFlashTimer = 0;

function loadBestTimes() {
    try { bestTimes = JSON.parse(localStorage.getItem('cr1_bestTimes') || '{}'); } catch(e) { bestTimes = {}; }
}
function saveBestTimes() {
    localStorage.setItem('cr1_bestTimes', JSON.stringify(bestTimes));
}
function formatTime(ms) {
    const s = ms / 1000;
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}.${Math.floor((s * 10) % 10)}`;
}
