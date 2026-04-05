// ===== CIRCUIT RACING 4 - CONFIG =====
// Made with love for Mikhail in Islamabad!

const CR4 = {
    VERSION: '4.0.0',
    DEBUG: false
};

// Physics constants - forgiving for kids
const PHYS = {
    maxSpeed: 150,
    acceleration: 65,       // Faster acceleration so it feels zippy
    braking: 75,
    turnSpeed: 2.8,         // More responsive steering
    friction: 0.988,
    driftFriction: 0.93,
    driftTurnMult: 1.8,
    offTrackPenalty: 0.96,  // Less punishment for going off track
    wallBounce: 0.85,       // Gentler wall bounce
    gravity: 30,
    nitroBoost: 60,         // Bigger nitro boost - more exciting!
    nitroDuration: 2.5,
    nitroCooldown: 5,       // Faster cooldown so kids can boost more
    slipstreamRange: 25,
    slipstreamAngle: 0.5,   // Easier to draft
    slipstreamBoost: 14,
    slipstreamMinTime: 0.3, // Quicker drafting
    turboStartWindow: [0.05, 0.5],      // Much wider window
    turboStartPerfectWindow: [0.1, 0.4], // Much wider perfect window
    turboStartBoost: 35,
    turboStartPerfectBoost: 55,
    rampLaunchSpeed: 20,
    rampMinSpeed: 30        // Easier to hit ramps
};

// Graphics presets
const GFX_PRESETS = {
    low: { shadows: false, shadowRes: 512, bloom: false, particles: 200, reflections: false, weather: false, tireMarks: false },
    medium: { shadows: true, shadowRes: 1024, bloom: true, particles: 600, reflections: true, weather: true, tireMarks: true },
    high: { shadows: true, shadowRes: 2048, bloom: true, particles: 1000, reflections: true, weather: true, tireMarks: true },
    ultra: { shadows: true, shadowRes: 4096, bloom: true, particles: 1500, reflections: true, weather: true, tireMarks: true }
};

// Track definitions - Islamabad-themed first track!
const TRACK_DEFS = [
    {
        id: 0, name: 'Margalla Hills', theme: 'beach',
        description: 'Race through the beautiful hills of Islamabad!',
        icon: '\u{1F3D4}', weather: 'clear', timeOfDay: 'morning',
        roadColor: '#555566', groundColor: '#44883a',
        skyColors: ['#5599dd', '#77bbee', '#aaddff', '#ddeeff'],
        fogColor: 0x99ccee, fogDensity: 0.003,
        roadWidth: 26, laps: 2,
        unlockRequires: null
    },
    {
        id: 1, name: 'Faisal Circuit', theme: 'neon',
        description: 'Speed through the city streets near Faisal Mosque!',
        icon: '\u{1F54C}', weather: 'clear', timeOfDay: 'morning',
        roadColor: '#444455', groundColor: '#558844',
        skyColors: ['#4488cc', '#66aaee', '#88ccff', '#ccddff'],
        fogColor: 0x88aadd, fogDensity: 0.004,
        roadWidth: 24, laps: 2,
        unlockRequires: { type: 'top3', trackId: 0 }
    },
    {
        id: 2, name: 'Snowy Mountains', theme: 'snow',
        description: 'Race up the snowy peaks of northern Pakistan!',
        icon: '\u{2744}', weather: 'snow', timeOfDay: 'morning',
        roadColor: '#667788', groundColor: '#e8e8f0',
        skyColors: ['#6699cc', '#88bbdd', '#aaddee', '#ddeeff'],
        fogColor: 0xbbccdd, fogDensity: 0.006,
        roadWidth: 24, laps: 2,
        unlockRequires: { type: 'top3', trackId: 1 }
    },
    {
        id: 3, name: 'Volcano Rush', theme: 'volcano',
        description: 'Escape the volcano before it erupts!',
        icon: '\u{1F30B}', weather: 'clear', timeOfDay: 'morning',
        roadColor: '#444433', groundColor: '#3a3a2a',
        skyColors: ['#5588bb', '#77aacc', '#99ccdd', '#bbddee'],
        fogColor: 0x88aacc, fogDensity: 0.005,
        roadWidth: 24, laps: 2,
        unlockRequires: { type: 'wins', count: 2 }
    },
    {
        id: 4, name: 'Cloud Kingdom', theme: 'sky',
        description: 'Race on highways in the sky above the clouds!',
        icon: '\u{2601}', weather: 'clear', timeOfDay: 'morning',
        roadColor: '#ccccdd', groundColor: '#aabbdd',
        skyColors: ['#4488dd', '#66aaee', '#88ccff', '#aaddff'],
        fogColor: 0x88bbee, fogDensity: 0.003,
        roadWidth: 26, laps: 2,
        unlockRequires: { type: 'wins', count: 3 }
    },
    {
        id: 5, name: 'Rainbow Road', theme: 'rainbow',
        description: 'The ultimate magical rainbow challenge!',
        icon: '\u{1F308}', weather: 'clear', timeOfDay: 'morning',
        roadColor: '#884488', groundColor: '#334466',
        skyColors: ['#3377bb', '#55aadd', '#88ccee', '#bbddff'],
        fogColor: 0x6699cc, fogDensity: 0.003,
        roadWidth: 22, laps: 2,
        unlockRequires: { type: 'winAll' }
    },
    {
        id: 6, name: 'Desert Dunes', theme: 'desert',
        description: 'Race across the golden sands and dodge the cacti!',
        icon: '\u{1F3DC}', weather: 'clear', timeOfDay: 'morning',
        roadColor: '#665544', groundColor: '#ddbb66',
        skyColors: ['#5599dd', '#77bbee', '#aaddff', '#eeeedd'],
        fogColor: 0xccbb99, fogDensity: 0.004,
        roadWidth: 26, laps: 2,
        unlockRequires: { type: 'top3', trackId: 2 }
    },
    {
        id: 7, name: 'Jungle Temple', theme: 'jungle',
        description: 'Zoom through the ancient jungle temple ruins!',
        icon: '\u{1F334}', weather: 'clear', timeOfDay: 'morning',
        roadColor: '#445533', groundColor: '#337722',
        skyColors: ['#448855', '#66aa77', '#88ccaa', '#aaddcc'],
        fogColor: 0x66aa77, fogDensity: 0.007,
        roadWidth: 22, laps: 2,
        unlockRequires: { type: 'wins', count: 4 }
    },
    {
        id: 8, name: 'Ice Lake', theme: 'ice',
        description: 'Slide and drift on the frozen mega lake!',
        icon: '\u{1F9CA}', weather: 'snow', timeOfDay: 'morning',
        roadColor: '#8899bb', groundColor: '#aaccee',
        skyColors: ['#6699cc', '#88bbdd', '#bbddee', '#ddeeff'],
        fogColor: 0xaaccdd, fogDensity: 0.005,
        roadWidth: 28, laps: 2,
        unlockRequires: { type: 'wins', count: 5 }
    },
    {
        id: 9, name: 'Space Station', theme: 'space',
        description: 'Race in zero gravity around the space station!',
        icon: '\u{1F680}', weather: 'clear', timeOfDay: 'morning',
        roadColor: '#334455', groundColor: '#111122',
        skyColors: ['#050510', '#0a0a22', '#111144', '#0a0a22'],
        fogColor: 0x0a0a22, fogDensity: 0.002,
        roadWidth: 24, laps: 2,
        unlockRequires: { type: 'trophies', count: 6 }
    }
];

// Car color definitions - fun kid-friendly names
const CAR_COLORS = [
    { id: 'crimson', name: 'Fire Red', color: 0xcc2233, accent: 0xff4455, unlock: null },
    { id: 'ocean', name: 'Super Blue', color: 0x2255cc, accent: 0x4488ff, unlock: null },
    { id: 'forest', name: 'Hulk Green', color: 0x22aa44, accent: 0x44dd66, unlock: null },
    { id: 'gold', name: 'Gold King', color: 0xddaa00, accent: 0xffcc33, unlock: null },
    { id: 'purple', name: 'Magic Purple', color: 0x7733bb, accent: 0xaa55ee, unlock: null },
    { id: 'orange', name: 'Tiger', color: 0xee6600, accent: 0xff8833, unlock: null },
    { id: 'white', name: 'Snow White', color: 0xddddee, accent: 0xffffff, unlock: null },
    { id: 'black', name: 'Batman', color: 0x222233, accent: 0x444455, unlock: null },
    { id: 'midnight', name: 'Ninja', color: 0x112266, accent: 0x2244aa, unlock: { type: 'trophies', count: 3 } },
    { id: 'chrome', name: 'Robot', color: 0xaabbcc, accent: 0xddddee, unlock: { type: 'trophies', count: 5 } },
    { id: 'neon', name: 'Alien', color: 0x00ff88, accent: 0x00ffcc, unlock: { type: 'winAll' } },
    { id: 'bugatti', name: 'BUGATTI', color: 0x0022aa, accent: 0x0044dd, unlock: { type: 'goldAll' }, speedBoost: 570 }
];

// AI driver definitions - family members!
const AI_DRIVERS = [
    { name: 'Ayzal', title: 'Speed Queen', personality: 'cautious', colorIdx: 1 },
    { name: 'Chachu', title: 'The Veteran', personality: 'cautious', colorIdx: 5 },
    { name: 'Dadi', title: 'The Wise', personality: 'cautious', colorIdx: 3 },
    { name: 'Dada', title: 'The Legend', personality: 'cautious', colorIdx: 6 },
    { name: 'Mama', title: 'The Pro', personality: 'cautious', colorIdx: 4 },
    { name: 'Baba', title: 'The Boss', personality: 'cautious', colorIdx: 2 }
];

// AI personality settings - all much slower so Mikhail can win!
const AI_PERSONALITIES = {
    aggressive: { speedMult: 0.7, accuracy: 0.4, itemDelay: 5, driftChance: 0.1, blockChance: 0.1 },
    balanced: { speedMult: 0.65, accuracy: 0.35, itemDelay: 6, driftChance: 0.08, blockChance: 0.05 },
    defensive: { speedMult: 0.6, accuracy: 0.3, itemDelay: 7, driftChance: 0.05, blockChance: 0.02 },
    cautious: { speedMult: 0.55, accuracy: 0.25, itemDelay: 8, driftChance: 0.03, blockChance: 0.01 },
    chaotic: { speedMult: 0.6, accuracy: 0.2, itemDelay: 3, driftChance: 0.2, blockChance: 0.1 }
};

// Difficulty settings - easy is default and very easy!
const DIFFICULTY = {
    easy: { aiSpeedMult: 0.32, aiAccuracy: 0.25, rubberBand: 2.5, itemBias: 'defensive' },
    medium: { aiSpeedMult: 0.42, aiAccuracy: 0.35, rubberBand: 1.8, itemBias: 'balanced' },
    hard: { aiSpeedMult: 0.55, aiAccuracy: 0.5, rubberBand: 1.0, itemBias: 'aggressive' }
};

// Item definitions
const ITEM_TYPES = [
    { id: 'boost', name: 'TURBO!', icon: '\u{1F680}', weight: 25, effect: 'speed' },
    { id: 'shield', name: 'Shield!', icon: '\u{1F6E1}', weight: 20, effect: 'defense' },
    { id: 'missile', name: 'Rocket!', icon: '\u{1F3AF}', weight: 15, effect: 'attack' },
    { id: 'oil', name: 'Oil Spill!', icon: '\u{1F4A7}', weight: 8, effect: 'hazard' },
    { id: 'banana', name: 'Banana!', icon: '\u{1F34C}', weight: 10, effect: 'hazard' },
    { id: 'star', name: 'SUPERSTAR!', icon: '\u{2B50}', weight: 10, effect: 'special' },
    { id: 'lightning', name: 'ZAP!', icon: '\u{26A1}', weight: 8, effect: 'attack' },
    { id: 'magnet', name: 'Magnet!', icon: '\u{1F9F2}', weight: 8, effect: 'special' }
];

// Fun popup messages for kids!
const FUN_MESSAGES = {
    firstPlace: ['YOU ARE #1!', 'CHAMPION!', 'SUPERSTAR!', 'AMAZING!', 'UNSTOPPABLE!', 'LEGEND!'],
    overtake: ['ZOOM ZOOM!', 'SEE YA!', 'EAT MY DUST!', 'TOO FAST!', 'WHOOSH!', 'BEEP BEEP!'],
    drift: ['DRIFTING!', 'SIDEWAYS!', 'SKRRRT!', 'SO COOL!', 'DRIFT KING!', 'WOW!'],
    boost: ['TURBO!!!', 'ZOOM!!!', 'SUPER SPEED!', 'WOOOO!', 'ROCKET MODE!'],
    airtime: ['FLYING!', 'WHEEE!', 'AIR TIME!', 'SO HIGH!', 'YEET!'],
    item: ['GOT IT!', 'POWER UP!', 'NICE CATCH!', 'OOOOH!'],
    win: ['MIKHAIL WINS!', 'YOU ARE THE CHAMPION!', 'INCREDIBLE!', 'BEST RACER EVER!', 'ISLAMABAD IS PROUD!'],
    lose: ['GOOD TRY!', 'SO CLOSE!', 'NEXT TIME!', 'KEEP RACING!', 'YOU ARE STILL AWESOME!']
};

// Global game state
const GAME = {
    state: 'menu',
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    clock: null,
    trackDef: null,
    trackData: null,
    allCars: [],
    playerCar: null,
    player2Car: null,
    aiCars: [],
    items: { boxes: [], projectiles: [], hazards: [], obstacles: [] },
    mode: 'vs_bots',
    difficulty: 'easy',      // Default to easy for kids!
    selectedTrack: 0,
    selectedCar: 0,
    totalLaps: 2,             // Shorter races - 2 laps default
    gfxPreset: 'medium',
    gfx: null,
    soundEnabled: true,
    shakeEnabled: true,
    isMobile: false,
    autoGas: true,            // Auto-accelerate for mobile/kids!
    countdownTimer: 0,
    raceTime: 0,
    turboStartTime: -1,
    paused: false
};

// Detect mobile
GAME.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);

// Auto-gas on mobile
GAME.autoGas = GAME.isMobile;

// Set initial GFX
GAME.gfx = GFX_PRESETS[GAME.isMobile ? 'low' : 'medium'];
