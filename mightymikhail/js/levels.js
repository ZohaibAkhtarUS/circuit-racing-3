// ============================================================
// MIGHTY MIKHAIL - Level System
// ============================================================

let currentLevel = 0;
let waveIndex = 0;
let waveLocked = false;
let waveEnemiesAlive = 0;
let levelComplete = false;
let goArrowTimer = 0;
let levelIntroTimer = 0;
let bossActive = false;
let bossEntity = null;
let tutorialStep = 0;
let tutorialTimer = 0;

function startLevel(levelIdx) {
    currentLevel = levelIdx;
    const lv = LEVELS[levelIdx];

    player = createPlayer();
    enemies = [];
    villagers = [];
    projectiles = [];
    particles = [];
    pickups = [];

    // Restore unlocked abilities from save
    const save = loadProgress();
    player.abilities = ['laser', 'fart'];
    for (let i = 0; i <= levelIdx; i++) {
        const ab = LEVELS[i].unlockAbility;
        if (ab && !player.abilities.includes(ab)) {
            player.abilities.push(ab);
        }
    }
    // Also add abilities from special items of previous levels
    if (levelIdx >= 2) {
        if (!player.abilities.includes('sonic_boom')) player.abilities.push('sonic_boom');
    }
    if (levelIdx >= 3) {
        if (!player.abilities.includes('speed_boost')) player.abilities.push('speed_boost');
    }

    // Apply shop upgrades and skin
    Shop.applyUpgrades(player);
    Shop.applyEquippedSkin();

    camera.x = 0;
    camera.y = 0;
    camera.shakeTime = 0;

    waveIndex = 0;
    waveLocked = false;
    waveEnemiesAlive = 0;
    levelComplete = false;
    goArrowTimer = 0;
    levelIntroTimer = 2.5;
    bossActive = false;
    bossEntity = null;
    tutorialStep = 0;
    tutorialTimer = 0;

    // Spawn coins
    for (const cx of lv.coinLocations) {
        pickups.push({
            type: 'coin', x: cx, y: GROUND_Y - 40, w: 16, h: 16,
        });
    }

    // Spawn food
    for (const f of lv.foodPickups) {
        const food = FOOD_ITEMS[f.type];
        pickups.push({
            type: 'food', x: f.x, y: GROUND_Y - 30, w: 18, h: 14,
            color: food.color, name: food.name,
            poopDelay: food.poopDelay, energy: food.energy, score: food.score,
        });
    }

    // Spawn special items
    for (const s of lv.specialItems) {
        pickups.push({
            type: 'special', x: s.x, y: GROUND_Y - 50, w: 20, h: 20,
            ability: s.ability,
        });
    }

    setState('playing');
}

function updateWaves(dt) {
    const lv = LEVELS[currentLevel];
    if (!lv || levelComplete) return;

    levelIntroTimer -= dt;
    goArrowTimer += dt;

    // Count alive enemies
    waveEnemiesAlive = enemies.filter(e => e.state !== 'dead').length;

    // If wave is locked, wait for all enemies to die
    if (waveLocked) {
        if (waveEnemiesAlive === 0) {
            waveLocked = false;
            goArrowTimer = 0;
        }
        return;
    }

    // Check if we should trigger next wave
    if (waveIndex < lv.waves.length) {
        const wave = lv.waves[waveIndex];
        if (camera.x + W * 0.5 >= wave.triggerX) {
            spawnWave(wave);
            waveIndex++;
            waveLocked = true;
        }
    }

    // Check if all waves done and all enemies dead
    if (waveIndex >= lv.waves.length && waveEnemiesAlive === 0 && !bossActive) {
        if (lv.boss) {
            // Spawn boss
            spawnBoss(lv.boss);
        } else {
            completeLevel();
        }
    }

    // Boss defeated check
    if (bossActive && bossEntity && bossEntity.state === 'dead') {
        bossActive = false;
        bossEntity = null;
        completeLevel();
    }

    // Tutorial
    if (lv.tutorial) {
        updateTutorial(dt);
    }
}

function spawnWave(wave) {
    for (const group of wave.enemies) {
        const def = ENEMY_DEFS[group.type];
        for (let i = 0; i < group.count; i++) {
            const spawnX = camera.x + W + rnd(50, 200) + i * 60;
            const e = createEnemy(group.type, spawnX);
            if (e) enemies.push(e);
        }
    }

    // Spawn villagers from wave
    if (wave.villagers) {
        for (const vg of wave.villagers) {
            for (let i = 0; i < vg.count; i++) {
                const vx = vg.x + rnd(-50, 50);
                villagers.push(createVillager(vx));
            }
        }
    }
}

function spawnBoss(bossType) {
    bossActive = true;
    const spawnX = camera.x + W + 100;
    bossEntity = createEnemy(bossType, spawnX, 80);
    if (bossEntity) {
        enemies.push(bossEntity);
    }
    shakeCamera(10, 0.5);
}

function completeLevel() {
    levelComplete = true;
    playSound('level_complete');
    emitParticles(W/2 + camera.x, H/2, 'confetti', 30);

    // Count saved villagers
    const saved = villagers.filter(v => v.state !== 'fainted').length;
    const total = villagers.length;

    // Calculate stars
    const savedPct = total > 0 ? saved / total : 1;
    const stars = savedPct >= 0.8 ? 3 : (savedPct >= 0.5 ? 2 : 1);

    // Save progress
    const progress = loadProgress();
    if (currentLevel + 1 >= progress.unlocked) {
        progress.unlocked = Math.min(5, currentLevel + 2);
    }
    progress.scores[currentLevel] = Math.max(progress.scores[currentLevel] || 0, player.score);
    progress.stars[currentLevel] = Math.max(progress.stars[currentLevel] || 0, stars);
    saveProgress(progress);

    // Save coins to shop
    Shop.addCoins(player.coins);

    // Show sister Ayzal scene first, then result
    setTimeout(() => {
        showSisterScene(saved, total, stars);
    }, 1500);
}

function updateTutorial(dt) {
    tutorialTimer += dt;
}

function drawTutorial(ctx) {
    if (!LEVELS[currentLevel] || !LEVELS[currentLevel].tutorial) return;
    if (levelIntroTimer > 0) return;

    ctx.save();
    const msgs = [
        { trigger: 0, msg: 'Use WASD or Joystick to move!', until: 5 },
        { trigger: 5, msg: 'Press SPACE or SHOOT to fire lasers!', until: 12 },
        { trigger: 12, msg: 'Hold SHIFT or FLY to fly with boosters!', until: 20 },
        { trigger: 20, msg: 'Protect the villagers from robots!', until: 28 },
        { trigger: 28, msg: 'Press E or POWER to use special abilities!', until: 35 },
    ];

    for (const m of msgs) {
        if (tutorialTimer >= m.trigger && tutorialTimer < m.until) {
            const alpha = Math.min(1, (tutorialTimer - m.trigger) * 2);
            const fadeOut = Math.max(0, Math.min(1, (m.until - tutorialTimer) * 2));
            ctx.globalAlpha = Math.min(alpha, fadeOut);
            drawRR(ctx, W/2 - 180, H - 70, 360, 36, 8, 'rgba(0,0,0,0.7)');
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(m.msg, W/2, H - 48);
            break;
        }
    }
    ctx.restore();
}

// --- PROGRESS ---
function loadProgress() {
    try {
        const saved = localStorage.getItem('mightyMikhail');
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { unlocked: 1, scores: {}, stars: {}, coins: 0 };
}

function saveProgress(progress) {
    try {
        localStorage.setItem('mightyMikhail', JSON.stringify(progress));
    } catch (e) {}
}
