// ============================================================
// MIGHTY MIKHAIL - Config & Constants
// ============================================================

const W = 960, H = 540;
const GROUND_Y = H * 0.78;
const GRAVITY = 1200;
const FLY_SPEED = 280;
const WALK_SPEED = 200;
const LASER_SPEED = 600;
const BOOSTER_FUEL_MAX = 100;
const BOOSTER_DRAIN = 25; // per second while flying
const BOOSTER_REGEN = 15; // per second on ground
const ENERGY_MAX = 100;
const ENERGY_REGEN = 5; // per second normal
const ENERGY_REGEN_SLEEP = 60; // per second during sleep
const MAX_LIVES = 5;
const MAX_PARTICLES = 200;
const MAX_ENEMIES = 6;
const MAX_VILLAGERS = 5;
const MAX_PROJECTILES = 20;
const INVINCIBLE_TIME = 2.0;
const CRY_DURATION = 1.0;
const SLEEP_DURATION = 2.0;
const POOP_DURATION = 3.5;

const ENEMY_DEFS = {
    small_robot: { name: 'Scout Bot', w: 32, h: 48, hp: 30, speed: 60, damage: 8, attackRange: 40, attackCooldown: 1.5, score: 100, color: '#889999', accent: '#44ddff' },
    big_robot: { name: 'Tank Bot', w: 48, h: 60, hp: 60, speed: 35, damage: 12, attackRange: 50, attackCooldown: 2.5, score: 250, color: '#667788', accent: '#ff4444' },
    ground_alien: { name: 'Alien Grunt', w: 36, h: 52, hp: 40, speed: 70, damage: 10, attackRange: 45, attackCooldown: 1.8, score: 200, color: '#44aa44', accent: '#aaff44' },
    flying_alien: { name: 'Sky Alien', w: 38, h: 40, hp: 35, speed: 90, damage: 9, attackRange: 80, attackCooldown: 2.0, score: 300, color: '#6644aa', accent: '#ff44ff', flies: true },
    alien_mothership: { name: 'Mothership', w: 120, h: 80, hp: 500, speed: 20, damage: 15, attackRange: 200, attackCooldown: 1.0, score: 5000, color: '#333355', accent: '#ff00ff', flies: true, boss: true },
};

const VILLAGER_DEFS = [
    { name: 'Man', w: 24, h: 48, hp: 50, speed: 40, skin: '#d4a06a', shirt: '#4466aa', pants: '#334455' },
    { name: 'Woman', w: 22, h: 46, hp: 45, speed: 45, skin: '#e8b87a', shirt: '#cc4488', pants: '#663355', headscarf: '#ff6699' },
    { name: 'Child', w: 18, h: 32, hp: 30, speed: 55, skin: '#d4a06a', shirt: '#ffaa33', pants: '#555555' },
    { name: 'Elder', w: 26, h: 46, hp: 35, speed: 25, skin: '#c89a60', shirt: '#eeeeee', pants: '#666666', beard: true },
];

const ABILITY_DEFS = {
    laser: { name: 'Laser', energyCost: 5, cooldown: 0.3, duration: 0, unlockLevel: 0, color: '#ff3333', desc: 'Zap!' },
    fart: { name: 'Fart', energyCost: 20, cooldown: 8, duration: 3, unlockLevel: 0, color: '#66cc33', desc: 'Stinky!' },
    freeze_ray: { name: 'Freeze', energyCost: 15, cooldown: 4, duration: 2, unlockLevel: 1, color: '#44ccff', desc: 'Ice cold!' },
    shield: { name: 'Shield', energyCost: 25, cooldown: 10, duration: 5, unlockLevel: 2, color: '#4488ff', desc: 'Protected!' },
    sonic_boom: { name: 'Boom', energyCost: 30, cooldown: 6, duration: 0, unlockLevel: 2, color: '#ffaa00', desc: 'BOOM!' },
    invisibility: { name: 'Invisible', energyCost: 40, cooldown: 12, duration: 4, unlockLevel: 3, color: '#aaaaff', desc: 'Now you see me...' },
    speed_boost: { name: 'Speed', energyCost: 20, cooldown: 8, duration: 3, unlockLevel: 3, color: '#ffff44', desc: 'Zoom!' },
    super_strength: { name: 'Strong', energyCost: 25, cooldown: 10, duration: 6, unlockLevel: 4, color: '#ff4444', desc: 'POWER!' },
};

const FOOD_ITEMS = [
    { name: 'Biryani', color: '#dd8833', poopDelay: 40, energy: 30, score: 50 },
    { name: 'Samosa', color: '#cc9944', poopDelay: 30, energy: 20, score: 30 },
    { name: 'Mango', color: '#ffcc00', poopDelay: 25, energy: 15, score: 20 },
    { name: 'Chai', color: '#885533', poopDelay: 35, energy: 25, score: 40 },
];

const LEVELS = [
    {
        name: 'Village Outskirts', subtitle: 'Learn to be a hero!', width: 5000,
        sky: ['#87CEEB', '#c8e8ff'], groundColor: '#5a8a3f', bgTheme: 'village',
        tutorial: true, villagersToProtect: 5,
        waves: [
            { triggerX: 400, enemies: [{ type: 'small_robot', count: 2 }], villagers: [{ count: 2, x: 500 }] },
            { triggerX: 1200, enemies: [{ type: 'small_robot', count: 2 }], villagers: [{ count: 1, x: 1400 }] },
            { triggerX: 2000, enemies: [{ type: 'small_robot', count: 3 }] },
            { triggerX: 2800, enemies: [{ type: 'small_robot', count: 3 }], villagers: [{ count: 2, x: 3000 }] },
            { triggerX: 3800, enemies: [{ type: 'small_robot', count: 4 }] },
        ],
        unlockAbility: null, boss: null,
        foodPickups: [{ x: 600, type: 1 }, { x: 1200, type: 2 }, { x: 1800, type: 0 }, { x: 2600, type: 1 }, { x: 3400, type: 2 }],
        coinLocations: [600, 1000, 1600, 2200, 2600, 3200, 3600, 4200],
        specialItems: [],
    },
    {
        name: 'Market Bazaar', subtitle: 'Protect the shoppers!', width: 5500,
        sky: ['#e8c888', '#f0d8a8'], groundColor: '#8a7a5a', bgTheme: 'bazaar',
        tutorial: false, villagersToProtect: 8,
        waves: [
            { triggerX: 300, enemies: [{ type: 'small_robot', count: 3 }], villagers: [{ count: 3, x: 500 }] },
            { triggerX: 1000, enemies: [{ type: 'small_robot', count: 2 }, { type: 'big_robot', count: 1 }] },
            { triggerX: 1800, enemies: [{ type: 'big_robot', count: 2 }], villagers: [{ count: 2, x: 2000 }] },
            { triggerX: 2600, enemies: [{ type: 'small_robot', count: 3 }, { type: 'big_robot', count: 1 }] },
            { triggerX: 3400, enemies: [{ type: 'ground_alien', count: 2 }, { type: 'small_robot', count: 2 }], villagers: [{ count: 3, x: 3600 }] },
            { triggerX: 4400, enemies: [{ type: 'ground_alien', count: 3 }] },
        ],
        unlockAbility: 'freeze_ray', boss: null,
        foodPickups: [{ x: 500, type: 1 }, { x: 1100, type: 2 }, { x: 1500, type: 0 }, { x: 2200, type: 3 }, { x: 3000, type: 1 }, { x: 4000, type: 2 }],
        coinLocations: [400, 800, 1200, 1600, 2000, 2400, 2800, 3200, 3800, 4200],
        specialItems: [{ x: 2200, ability: 'freeze_ray' }],
    },
    {
        name: 'Park & Playground', subtitle: 'Save the children!', width: 5500,
        sky: ['#88bbee', '#aaddff'], groundColor: '#4a8a3a', bgTheme: 'park',
        tutorial: false, villagersToProtect: 8,
        waves: [
            { triggerX: 300, enemies: [{ type: 'small_robot', count: 2 }, { type: 'ground_alien', count: 1 }], villagers: [{ count: 3, x: 500 }] },
            { triggerX: 1000, enemies: [{ type: 'ground_alien', count: 3 }] },
            { triggerX: 1800, enemies: [{ type: 'big_robot', count: 2 }, { type: 'ground_alien', count: 1 }], villagers: [{ count: 2, x: 2000 }] },
            { triggerX: 2600, enemies: [{ type: 'small_robot', count: 2 }, { type: 'flying_alien', count: 1 }] },
            { triggerX: 3400, enemies: [{ type: 'flying_alien', count: 2 }, { type: 'ground_alien', count: 2 }], villagers: [{ count: 3, x: 3600 }] },
            { triggerX: 4400, enemies: [{ type: 'big_robot', count: 3 }] },
        ],
        unlockAbility: 'shield', boss: null,
        foodPickups: [{ x: 500, type: 2 }, { x: 1100, type: 0 }, { x: 1700, type: 1 }, { x: 2400, type: 3 }, { x: 3200, type: 0 }, { x: 4200, type: 2 }],
        coinLocations: [300, 700, 1100, 1500, 1900, 2300, 2700, 3100, 3500, 4000, 4500],
        specialItems: [{ x: 1600, ability: 'shield' }, { x: 3000, ability: 'sonic_boom' }],
    },
    {
        name: 'Margalla Hills', subtitle: 'Brave the mountains!', width: 6000,
        sky: ['#aabbcc', '#dde8ee'], groundColor: '#7a6a5a', bgTheme: 'hills',
        tutorial: false, villagersToProtect: 6,
        waves: [
            { triggerX: 400, enemies: [{ type: 'flying_alien', count: 2 }], villagers: [{ count: 2, x: 600 }] },
            { triggerX: 1200, enemies: [{ type: 'ground_alien', count: 2 }, { type: 'flying_alien', count: 1 }] },
            { triggerX: 2000, enemies: [{ type: 'big_robot', count: 2 }, { type: 'flying_alien', count: 2 }], villagers: [{ count: 2, x: 2200 }] },
            { triggerX: 3000, enemies: [{ type: 'flying_alien', count: 3 }] },
            { triggerX: 4000, enemies: [{ type: 'ground_alien', count: 3 }, { type: 'flying_alien', count: 2 }], villagers: [{ count: 2, x: 4200 }] },
            { triggerX: 5000, enemies: [{ type: 'big_robot', count: 2 }, { type: 'flying_alien', count: 2 }] },
        ],
        unlockAbility: 'invisibility', boss: null,
        foodPickups: [{ x: 600, type: 1 }, { x: 1300, type: 0 }, { x: 1800, type: 3 }, { x: 2600, type: 2 }, { x: 3600, type: 0 }, { x: 4400, type: 1 }, { x: 5200, type: 2 }],
        coinLocations: [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500],
        specialItems: [{ x: 1400, ability: 'invisibility' }, { x: 3400, ability: 'speed_boost' }],
        windGusts: true,
    },
    {
        name: 'City Center', subtitle: 'The Final Battle!', width: 7000,
        sky: ['#2a1a2a', '#4a2a3a'], groundColor: '#555566', bgTheme: 'city',
        tutorial: false, villagersToProtect: 10,
        waves: [
            { triggerX: 300, enemies: [{ type: 'small_robot', count: 3 }, { type: 'ground_alien', count: 2 }], villagers: [{ count: 3, x: 500 }] },
            { triggerX: 1200, enemies: [{ type: 'big_robot', count: 2 }, { type: 'flying_alien', count: 2 }] },
            { triggerX: 2000, enemies: [{ type: 'ground_alien', count: 3 }, { type: 'flying_alien', count: 2 }], villagers: [{ count: 3, x: 2200 }] },
            { triggerX: 3000, enemies: [{ type: 'big_robot', count: 2 }, { type: 'small_robot', count: 3 }] },
            { triggerX: 4000, enemies: [{ type: 'flying_alien', count: 3 }, { type: 'ground_alien', count: 3 }], villagers: [{ count: 4, x: 4200 }] },
            { triggerX: 5500, enemies: [{ type: 'big_robot', count: 3 }, { type: 'flying_alien', count: 2 }] },
        ],
        unlockAbility: 'super_strength', boss: 'alien_mothership',
        foodPickups: [{ x: 600, type: 0 }, { x: 1200, type: 1 }, { x: 1600, type: 3 }, { x: 2400, type: 2 }, { x: 3400, type: 0 }, { x: 4400, type: 1 }, { x: 5000, type: 3 }, { x: 5800, type: 0 }],
        coinLocations: [400, 800, 1200, 1600, 2000, 2400, 2800, 3200, 3600, 4000, 4400, 4800, 5200, 5600, 6000, 6400],
        specialItems: [{ x: 2600, ability: 'super_strength' }],
    },
];

// Shop - Hero Skins
const SHOP_SKINS = [
    { id: 'classic', name: 'Classic Hero', cost: 0, suit: '#3366cc', suitLight: '#4488ee', cape: '#cc2222', capeShade: '#991111', boots: '#dd4444', star: '#ffcc00' },
    { id: 'fire', name: 'Fire Hero', cost: 100, suit: '#cc3322', suitLight: '#ee5544', cape: '#ff8800', capeShade: '#cc6600', boots: '#ff6622', star: '#ffee00' },
    { id: 'ice', name: 'Ice Hero', cost: 100, suit: '#ddeeff', suitLight: '#eef4ff', cape: '#4488ff', capeShade: '#2266cc', boots: '#6699ff', star: '#aaeeff' },
    { id: 'shadow', name: 'Shadow Hero', cost: 150, suit: '#222233', suitLight: '#333355', cape: '#6633cc', capeShade: '#4422aa', boots: '#443366', star: '#aa66ff' },
    { id: 'gold', name: 'Gold Hero', cost: 200, suit: '#ccaa22', suitLight: '#eecc44', cape: '#ffcc00', capeShade: '#cc9900', boots: '#ddaa00', star: '#ffffff' },
    { id: 'pakistan', name: 'Pakistan Hero', cost: 250, suit: '#006633', suitLight: '#118844', cape: '#ffffff', capeShade: '#cccccc', boots: '#008844', star: '#ffffff' },
];

// Shop - Stat Upgrades
const SHOP_UPGRADES = [
    { id: 'hp', name: 'Max HP+', cost: 50, maxLevel: 4, perLevel: 25, icon: '\u2764', desc: '+25 HP' },
    { id: 'energy', name: 'Max Energy+', cost: 50, maxLevel: 4, perLevel: 25, icon: '\u26A1', desc: '+25 Energy' },
    { id: 'laser', name: 'Laser Power+', cost: 75, maxLevel: 3, perLevel: 5, icon: '\u2604', desc: '+5 Damage' },
    { id: 'speed', name: 'Speed+', cost: 75, maxLevel: 3, perLevel: 0.1, icon: '\u{1F3C3}', desc: '+10% Speed' },
    { id: 'fuel', name: 'Booster Fuel+', cost: 60, maxLevel: 3, perLevel: 25, icon: '\u{1F680}', desc: '+25 Fuel' },
];

// Enemy food drop chance
const ENEMY_FOOD_DROP_CHANCE = 0.2;

// Mikhail drawing colors (updated by skin system)
const MIKHAIL = {
    skin: '#d4a06a',
    hair: '#222',
    suit: '#3366cc',
    suitLight: '#4488ee',
    cape: '#cc2222',
    capeShade: '#991111',
    boots: '#dd4444',
    star: '#ffcc00',
    booster: '#888',
    flame: '#ff8800',
    flameInner: '#ffee44',
    laser: '#ff3333',
    laserGlow: '#ff8888',
};
