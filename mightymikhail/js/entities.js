// ============================================================
// MIGHTY MIKHAIL - Entities (Player, Enemies, Villagers, etc.)
// ============================================================

let player = null;
let enemies = [];
let villagers = [];
let projectiles = [];
let particles = [];
let pickups = []; // coins, food, special items

// --- PLAYER ---
function createPlayer() {
    return {
        x: 200, y: GROUND_Y - 48, w: 28, h: 48,
        vx: 0, vy: 0,
        facing: 1, // 1=right, -1=left
        flying: false,
        boosterFuel: BOOSTER_FUEL_MAX,
        hp: 100, maxHp: 100,
        energy: ENERGY_MAX,
        maxEnergy: ENERGY_MAX,
        maxFuel: BOOSTER_FUEL_MAX,
        baseLaserDamage: 15,
        baseSpeedMultiplier: 1,
        lives: MAX_LIVES,
        score: 0, coins: 0,
        abilities: ['laser', 'fart'],
        currentAbility: 'laser',
        cooldowns: {},
        activeEffects: {},
        state: 'idle', // idle, walk, fly, shoot, hurt, cry, runaway, sleep, poop
        animTimer: 0,
        shootTimer: 0,
        invincible: 0,
        poopTimer: -1, // -1 = no poop needed
        speedMultiplier: 1,
        damageMultiplier: 1,
        visible: true,
    };
}

function updatePlayer(dt) {
    if (!player) return;
    const inp = getInput();

    player.animTimer += dt;

    // Decrement timers
    if (player.invincible > 0) player.invincible -= dt;
    if (player.shootTimer > 0) player.shootTimer -= dt;
    updatePlayerEffects(dt);

    // State-specific updates
    switch (player.state) {
        case 'idle':
        case 'walk':
        case 'fly':
        case 'shoot':
            updatePlayerMovement(dt, inp);
            updatePlayerActions(dt, inp);
            break;
        case 'hurt':
            player.vx *= 0.9;
            player.animTimer += dt;
            if (player.animTimer > 0.3) {
                if (player.hp <= 0) {
                    player.state = 'cry';
                    player.animTimer = 0;
                    playSound('cry');
                } else {
                    player.state = 'idle';
                }
            }
            break;
        case 'cry':
            player.vx = 0;
            emitParticles(player.x + player.w/2, player.y + 8, 'tears', 1);
            if (player.animTimer > CRY_DURATION) {
                player.state = 'runaway';
                player.animTimer = 0;
                player.vx = -300;
            }
            break;
        case 'runaway':
            player.x += player.vx * dt;
            if (player.animTimer > 0.8) {
                player.state = 'sleep';
                player.animTimer = 0;
                player.vx = 0;
                playSound('snore');
            }
            break;
        case 'sleep':
            player.energy = Math.min(player.maxEnergy, player.energy + ENERGY_REGEN_SLEEP * dt);
            if (player.animTimer % 1.0 < 0.05) {
                emitParticles(player.x + player.w/2, player.y, 'zzz', 1);
            }
            if (player.animTimer > SLEEP_DURATION) {
                // Respawn
                player.state = 'idle';
                player.hp = player.maxHp;
                player.energy = player.maxEnergy;
                player.boosterFuel = player.maxFuel;
                player.lives--;
                player.invincible = INVINCIBLE_TIME;
                player.x = camera.x + 100;
                player.y = GROUND_Y - player.h;
                player.flying = false;
                if (player.lives <= 0) {
                    setState('gameover');
                }
            }
            break;
        case 'poop':
            // Handled by cutscenes
            break;
    }

    // Apply gravity if not flying
    if (!player.flying && player.state !== 'sleep') {
        player.vy += GRAVITY * dt;
    }

    // Apply velocity
    if (player.state !== 'sleep' && player.state !== 'poop') {
        player.x += player.vx * dt;
        player.y += player.vy * dt;
    }

    // Ground collision
    if (player.y + player.h > GROUND_Y) {
        player.y = GROUND_Y - player.h;
        player.vy = 0;
        if (player.flying) player.flying = false;
    }

    // Ceiling
    if (player.y < 10) { player.y = 10; player.vy = 0; }

    // Level bounds
    const levelW = LEVELS[currentLevel] ? LEVELS[currentLevel].width : 5000;
    player.x = clamp(player.x, 0, levelW - player.w);

    // Energy regen (normal)
    if (player.state === 'idle' || player.state === 'walk') {
        player.energy = Math.min(player.maxEnergy, player.energy + ENERGY_REGEN * dt);
    }

    // Booster fuel regen on ground
    if (!player.flying) {
        player.boosterFuel = Math.min(player.maxFuel, player.boosterFuel + BOOSTER_REGEN * dt);
    }

    // Poop timer
    if (player.poopTimer > 0 && player.state !== 'poop' && player.state !== 'sleep' && player.state !== 'cry') {
        player.poopTimer -= dt;
        if (player.poopTimer <= 0 && canPoop()) {
            startPoopBreak();
        }
    }

    // Update state label
    if (player.state === 'idle' || player.state === 'walk' || player.state === 'fly' || player.state === 'shoot') {
        if (player.flying) player.state = 'fly';
        else if (Math.abs(player.vx) > 10) player.state = 'walk';
        else if (player.shootTimer > 0) player.state = 'shoot';
        else player.state = 'idle';
    }
}

function updatePlayerMovement(dt, inp) {
    const speed = (player.flying ? FLY_SPEED : WALK_SPEED) * player.speedMultiplier;

    if (inp.left) { player.vx = -speed; player.facing = -1; }
    else if (inp.right) { player.vx = speed; player.facing = 1; }
    else { player.vx *= 0.8; }

    // Flying
    if (inp.fly && player.boosterFuel > 0) {
        if (!player.flying) {
            player.flying = true;
            playSound('booster');
        }
        player.vy = -FLY_SPEED * 0.8;
        if (inp.up) player.vy = -FLY_SPEED;
        if (inp.down) player.vy = FLY_SPEED * 0.5;
        player.boosterFuel -= BOOSTER_DRAIN * dt;
        if (player.boosterFuel <= 0) {
            player.boosterFuel = 0;
            player.flying = false;
        }
        // Booster particles
        if (Math.random() < 0.5) {
            emitParticles(player.x + player.w/2 - 6, player.y + player.h, 'booster', 1);
            emitParticles(player.x + player.w/2 + 6, player.y + player.h, 'booster', 1);
        }
    } else if (player.flying && !inp.fly) {
        player.flying = false;
    }

    // Wind gusts in Margalla Hills
    if (LEVELS[currentLevel] && LEVELS[currentLevel].windGusts && player.flying) {
        const windForce = Math.sin(player.animTimer * 0.8) * 80;
        player.vx += windForce * dt;
    }
}

function updatePlayerActions(dt, inp) {
    // Shoot
    if (consumeShoot() && player.shootTimer <= 0) {
        fireLaser();
        player.shootTimer = 0.2;
    }

    // Use ability
    if (consumeAbility()) {
        Abilities.activate(player, player.currentAbility);
    }

    // Cycle ability
    if (consumeCycle()) {
        cycleAbility();
    }
}

function fireLaser() {
    const px = player.x + (player.facing > 0 ? player.w : 0);
    const py = player.y + player.h * 0.35;
    projectiles.push({
        x: px, y: py, w: 20, h: 4,
        vx: LASER_SPEED * player.facing, vy: 0,
        damage: player.baseLaserDamage * player.damageMultiplier,
        type: 'laser', owner: 'player',
        life: 1.5, color: MIKHAIL.laser,
    });
    playSound('laser');
    // Muzzle flash particles
    emitParticles(px, py, 'laser_spark', 3);
}

function cycleAbility() {
    const abilities = player.abilities;
    if (abilities.length <= 1) return;
    const idx = abilities.indexOf(player.currentAbility);
    player.currentAbility = abilities[(idx + 1) % abilities.length];
    playSound('select');
}

function hurtPlayer(damage) {
    if (player.invincible > 0 || player.state === 'cry' || player.state === 'sleep' || player.state === 'runaway') return;
    if (player.activeEffects.shield) return; // Shield blocks damage
    if (!player.visible) return; // Invisible

    player.hp -= damage;
    player.state = 'hurt';
    player.animTimer = 0;
    player.invincible = 0.5;
    playSound('hurt');
    shakeCamera(5, 0.2);
    emitParticles(player.x + player.w/2, player.y + player.h/2, 'hit', 5);
}

function updatePlayerEffects(dt) {
    for (const key in player.activeEffects) {
        const eff = player.activeEffects[key];
        eff.timer -= dt;
        if (eff.timer <= 0) {
            delete player.activeEffects[key];
            // Reset multipliers
            if (key === 'speed_boost') player.speedMultiplier = player.baseSpeedMultiplier;
            if (key === 'super_strength') player.damageMultiplier = 1;
            if (key === 'invisibility') player.visible = true;
        }
    }
}

// --- DRAW PLAYER ---
function drawPlayer(ctx) {
    if (!player) return;
    if (player.state === 'sleep') {
        drawPlayerSleeping(ctx);
        return;
    }
    if (player.state === 'runaway' && player.animTimer > 0.6) return; // Off screen

    // Invincibility flash
    if (player.invincible > 0 && Math.floor(player.invincible * 10) % 2 === 0) return;

    // Invisibility
    if (player.activeEffects.invisibility) ctx.globalAlpha = 0.3;

    const px = player.x - camera.x;
    const py = player.y + camera.y;
    const f = player.facing;

    ctx.save();
    ctx.translate(px + player.w/2, py + player.h);
    ctx.scale(f, 1);

    const walkCycle = Math.sin(player.animTimer * 10) * 0.3;
    const flyBob = player.flying ? Math.sin(player.animTimer * 5) * 2 : 0;

    // Cape
    ctx.fillStyle = MIKHAIL.cape;
    ctx.beginPath();
    const capeWave = Math.sin(player.animTimer * 6) * 4;
    ctx.moveTo(-8, -38);
    ctx.quadraticCurveTo(-18 + capeWave, -25, -20 + capeWave * 1.5, -10);
    ctx.quadraticCurveTo(-15 + capeWave, -5, -10, -15);
    ctx.fill();

    // Legs
    const legSpread = (player.state === 'walk') ? walkCycle * 6 : 0;
    ctx.fillStyle = MIKHAIL.suit;
    ctx.fillRect(-6, -16 + flyBob, 5, 16);
    ctx.fillRect(1 + legSpread, -16 + flyBob, 5, 16);

    // Boots
    ctx.fillStyle = MIKHAIL.boots;
    ctx.fillRect(-7, -2 + flyBob, 6, 4);
    ctx.fillRect(legSpread, -2 + flyBob, 6, 4);

    // Body (suit)
    ctx.fillStyle = MIKHAIL.suit;
    drawRR(ctx, -10, -38 + flyBob, 20, 22, 3, MIKHAIL.suit);
    // Suit highlight
    ctx.fillStyle = MIKHAIL.suitLight;
    ctx.fillRect(-8, -36 + flyBob, 4, 18);

    // Star emblem
    drawStar(ctx, 0, -28 + flyBob, 5, 5, MIKHAIL.star);

    // Rocket boosters on back
    ctx.fillStyle = MIKHAIL.booster;
    ctx.fillRect(-12, -34 + flyBob, 4, 12);
    ctx.fillRect(8, -34 + flyBob, 4, 12);

    // Booster flames when flying
    if (player.flying) {
        const flameH = 8 + Math.random() * 6;
        ctx.fillStyle = MIKHAIL.flame;
        ctx.beginPath();
        ctx.moveTo(-12, -22 + flyBob);
        ctx.lineTo(-10, -22 + flyBob + flameH);
        ctx.lineTo(-8, -22 + flyBob);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(8, -22 + flyBob);
        ctx.lineTo(10, -22 + flyBob + flameH);
        ctx.lineTo(12, -22 + flyBob);
        ctx.fill();
        ctx.fillStyle = MIKHAIL.flameInner;
        ctx.beginPath();
        ctx.moveTo(-11, -22 + flyBob);
        ctx.lineTo(-10, -22 + flyBob + flameH * 0.6);
        ctx.lineTo(-9, -22 + flyBob);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(9, -22 + flyBob);
        ctx.lineTo(10, -22 + flyBob + flameH * 0.6);
        ctx.lineTo(11, -22 + flyBob);
        ctx.fill();
    }

    // Arms
    ctx.fillStyle = MIKHAIL.skin;
    if (player.shootTimer > 0 || player.state === 'shoot') {
        // Arms forward (shooting)
        ctx.fillRect(8, -34 + flyBob, 14, 4);
        // Laser glow on hand
        ctx.fillStyle = MIKHAIL.laserGlow;
        ctx.beginPath();
        ctx.arc(22, -32 + flyBob, 3, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Normal arms
        const armSwing = (player.state === 'walk') ? walkCycle * 4 : 0;
        ctx.fillRect(10, -34 + armSwing + flyBob, 4, 10);
        ctx.fillRect(-14, -34 - armSwing + flyBob, 4, 10);
    }

    // Head
    ctx.fillStyle = MIKHAIL.skin;
    ctx.beginPath();
    ctx.arc(0, -44 + flyBob, 10, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = MIKHAIL.hair;
    ctx.beginPath();
    ctx.arc(0, -48 + flyBob, 10, Math.PI, 0);
    ctx.fill();

    // Face expression
    drawPlayerFace(ctx, 0, -44 + flyBob, player.state);

    // Shield visual
    if (player.activeEffects.shield) {
        ctx.strokeStyle = 'rgba(68, 136, 255, 0.5)';
        ctx.lineWidth = 3;
        const shieldPulse = 1 + Math.sin(player.animTimer * 6) * 0.1;
        ctx.beginPath();
        ctx.arc(0, -24, 28 * shieldPulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(68, 136, 255, 0.1)';
        ctx.fill();
    }

    // Speed boost lines
    if (player.activeEffects.speed_boost) {
        ctx.strokeStyle = 'rgba(255,255,68,0.4)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const ly = -40 + i * 12 + flyBob;
            ctx.beginPath();
            ctx.moveTo(-18, ly);
            ctx.lineTo(-28 - Math.random() * 10, ly);
            ctx.stroke();
        }
    }

    // Super strength glow
    if (player.activeEffects.super_strength) {
        ctx.fillStyle = 'rgba(255, 68, 68, 0.2)';
        ctx.beginPath();
        ctx.arc(0, -26, 22, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
}

function drawPlayerFace(ctx, cx, cy, state) {
    switch (state) {
        case 'hurt':
            // X eyes
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1.5;
            for (let s = -1; s <= 1; s += 2) {
                const ex = cx + s * 4;
                ctx.beginPath();
                ctx.moveTo(ex - 2, cy - 2);
                ctx.lineTo(ex + 2, cy + 2);
                ctx.moveTo(ex + 2, cy - 2);
                ctx.lineTo(ex - 2, cy + 2);
                ctx.stroke();
            }
            // Open mouth
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 4, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'cry':
            // Closed eyes crying
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1.5;
            for (let s = -1; s <= 1; s += 2) {
                const ex = cx + s * 4;
                ctx.beginPath();
                ctx.arc(ex, cy, 2, 0, Math.PI);
                ctx.stroke();
            }
            // Tears
            ctx.fillStyle = '#44aaff';
            ctx.fillRect(cx - 6, cy + 1, 2, 4);
            ctx.fillRect(cx + 4, cy + 1, 2, 4);
            // Wailing mouth
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 5, 5, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'poop':
            // Straining face
            ctx.fillStyle = '#ff6644';
            ctx.beginPath();
            ctx.arc(cx - 5, cy, 3, 0, Math.PI * 2);
            ctx.arc(cx + 5, cy, 3, 0, Math.PI * 2);
            ctx.fill(); // Red cheeks
            // Squeezed eyes
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1.5;
            for (let s = -1; s <= 1; s += 2) {
                ctx.beginPath();
                ctx.moveTo(cx + s * 3, cy - 1);
                ctx.lineTo(cx + s * 5, cy + 1);
                ctx.stroke();
            }
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(cx, cy + 4, 2, 0, Math.PI * 2);
            ctx.fill();
            break;
        default:
            // Normal happy face
            // Eyes
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(cx - 4, cy - 1, 3, 0, Math.PI * 2);
            ctx.arc(cx + 4, cy - 1, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(cx - 3.5, cy - 1, 1.5, 0, Math.PI * 2);
            ctx.arc(cx + 4.5, cy - 1, 1.5, 0, Math.PI * 2);
            ctx.fill();
            // Smile (bigger when shooting)
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (state === 'shoot' || player.shootTimer > 0) {
                // Determined grin
                ctx.moveTo(cx - 3, cy + 3);
                ctx.lineTo(cx + 3, cy + 3);
            } else {
                ctx.arc(cx, cy + 2, 3, 0.1, Math.PI - 0.1);
            }
            ctx.stroke();
            break;
    }
}

function drawPlayerSleeping(ctx) {
    const px = W / 2 - 20;
    const py = H / 2 + 20;

    ctx.save();
    // Dim background
    ctx.fillStyle = 'rgba(0,0,30,0.5)';
    ctx.fillRect(0, 0, W, H);

    // Sleeping text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Mikhail is sleeping...', W/2, H/2 - 40);

    // Lying down Mikhail
    ctx.translate(px, py);
    // Body horizontal
    ctx.fillStyle = MIKHAIL.suit;
    drawRR(ctx, 0, 0, 40, 16, 4, MIKHAIL.suit);
    // Head
    ctx.fillStyle = MIKHAIL.skin;
    ctx.beginPath();
    ctx.arc(-5, 4, 10, 0, Math.PI * 2);
    ctx.fill();
    // Closed eyes
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-7, 3, 2, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-3, 3, 2, 0, Math.PI);
    ctx.stroke();

    // Energy bar refilling
    const energyPct = player.energy / player.maxEnergy;
    ctx.restore();

    ctx.save();
    drawRR(ctx, W/2 - 60, H/2 + 50, 120, 12, 4, '#222');
    drawRR(ctx, W/2 - 60, H/2 + 50, 120 * energyPct, 12, 4, '#ffcc00');
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Energy', W/2, H/2 + 58);
    ctx.restore();

    // Lives remaining
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Lives: ${player.lives - 1}`, W/2, H/2 + 80);
    ctx.restore();
}

// --- ENEMIES ---
function createEnemy(type, x, y) {
    const def = ENEMY_DEFS[type];
    if (!def) return null;
    return {
        type, x, y: y || (def.flies ? rnd(50, GROUND_Y - 100) : GROUND_Y - def.h),
        w: def.w, h: def.h,
        vx: 0, vy: 0,
        hp: def.hp, maxHp: def.hp,
        speed: def.speed,
        damage: def.damage,
        attackRange: def.attackRange,
        attackCooldown: def.attackCooldown,
        attackTimer: 0,
        score: def.score,
        color: def.color, accent: def.accent,
        flies: def.flies || false,
        boss: def.boss || false,
        state: 'patrol', // patrol, chase_villager, attack_villager, stunned, frozen, flee, dead
        target: null,
        animTimer: 0,
        flashTimer: 0,
        stunTimer: 0,
        frozenTimer: 0,
        fleeTimer: 0,
        facing: -1,
        holdingNose: false,
    };
}

function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.animTimer += dt;
        if (e.flashTimer > 0) e.flashTimer -= dt;

        switch (e.state) {
            case 'patrol':
            case 'chase_villager':
                // Find nearest alive villager
                let nearestV = null, nearestDist = Infinity;
                for (const v of villagers) {
                    if (v.state === 'fainted') continue;
                    const d = dist(e.x, e.y, v.x, v.y);
                    if (d < nearestDist) { nearestDist = d; nearestV = v; }
                }
                if (nearestV) {
                    e.target = nearestV;
                    e.state = 'chase_villager';
                    // Move toward villager
                    const dx = nearestV.x - e.x;
                    const dy = (e.flies ? nearestV.y : 0) - (e.flies ? e.y : 0);
                    e.facing = dx > 0 ? 1 : -1;
                    e.vx = Math.sign(dx) * e.speed;
                    if (e.flies) e.vy = Math.sign(dy) * e.speed * 0.5;

                    // Check if in attack range
                    if (nearestDist < e.attackRange) {
                        e.state = 'attack_villager';
                        e.vx = 0;
                        e.vy = 0;
                    }
                } else {
                    // No villagers, wander toward player
                    if (player && player.state !== 'sleep') {
                        const dx = player.x - e.x;
                        e.facing = dx > 0 ? 1 : -1;
                        e.vx = Math.sign(dx) * e.speed * 0.5;
                    }
                }
                break;

            case 'attack_villager':
                e.vx = 0;
                e.attackTimer -= dt;
                if (e.attackTimer <= 0) {
                    // Attack the villager
                    if (e.target && e.target.state !== 'fainted') {
                        const d = dist(e.x, e.y, e.target.x, e.target.y);
                        if (d < e.attackRange * 1.5) {
                            hurtVillager(e.target, e.damage);
                            // Shoot projectile for ranged enemies
                            if (e.attackRange > 60) {
                                projectiles.push({
                                    x: e.x + e.w/2, y: e.y + e.h * 0.3,
                                    w: 8, h: 4, vx: e.facing * 300, vy: 0,
                                    damage: e.damage * 0.5, type: 'enemy_laser',
                                    owner: 'enemy', life: 1.0, color: e.accent,
                                });
                            }
                        }
                    }
                    e.attackTimer = e.attackCooldown;
                    e.state = 'chase_villager';
                }
                break;

            case 'stunned':
                e.vx = 0;
                e.stunTimer -= dt;
                if (e.stunTimer <= 0) e.state = 'patrol';
                break;

            case 'frozen':
                e.vx = 0; e.vy = 0;
                e.frozenTimer -= dt;
                if (e.frozenTimer <= 0) e.state = 'patrol';
                break;

            case 'flee':
                e.fleeTimer -= dt;
                e.holdingNose = true;
                // Run away from player
                if (player) {
                    const dx = e.x - player.x;
                    e.facing = dx > 0 ? 1 : -1;
                    e.vx = Math.sign(dx) * e.speed * 1.5;
                }
                if (e.fleeTimer <= 0) {
                    e.state = 'patrol';
                    e.holdingNose = false;
                }
                break;

            case 'dead':
                break;
        }

        // Apply velocity
        e.x += e.vx * dt;
        if (e.flies) {
            e.y += e.vy * dt;
            e.y = clamp(e.y, 20, GROUND_Y - e.h);
        }

        // Stay in level bounds
        const levelW = LEVELS[currentLevel] ? LEVELS[currentLevel].width : 5000;
        e.x = clamp(e.x, -50, levelW + 50);

        // Remove dead enemies that have faded
        if (e.state === 'dead') {
            enemies.splice(i, 1);
        }
    }
}

function hurtEnemy(e, damage) {
    e.hp -= damage;
    e.flashTimer = 0.15;
    e.state = 'stunned';
    e.stunTimer = 0.3;
    playSound('enemy_hit');
    emitParticles(e.x + e.w/2, e.y + e.h/2, 'hit', 3);

    if (e.hp <= 0) {
        killEnemy(e);
    }
}

function killEnemy(e) {
    e.state = 'dead';
    player.score += e.score;
    playSound('enemy_die');
    emitParticles(e.x + e.w/2, e.y + e.h/2, 'explosion', 10);
    shakeCamera(3, 0.15);

    // Random food drop
    if (Math.random() < ENEMY_FOOD_DROP_CHANCE) {
        const foodIdx = rndInt(0, FOOD_ITEMS.length - 1);
        const food = FOOD_ITEMS[foodIdx];
        pickups.push({
            type: 'food', x: e.x, y: GROUND_Y - 30, w: 18, h: 14,
            color: food.color, name: food.name,
            poopDelay: food.poopDelay, energy: food.energy, score: food.score,
        });
    }
}

function drawEnemies(ctx) {
    for (const e of enemies) {
        if (e.state === 'dead') continue;
        const ex = e.x - camera.x;
        const ey = e.y + camera.y;
        if (ex < -60 || ex > W + 60) continue;

        ctx.save();
        ctx.translate(ex + e.w/2, ey + e.h);
        ctx.scale(e.facing, 1);

        // Flash white when hit
        if (e.flashTimer > 0) {
            ctx.globalAlpha = 0.7;
        }

        // Frozen tint
        if (e.state === 'frozen') {
            ctx.globalAlpha = 0.8;
        }

        if (e.type === 'small_robot' || e.type === 'big_robot') {
            drawRobot(ctx, e);
        } else if (e.type === 'ground_alien' || e.type === 'flying_alien') {
            drawAlien(ctx, e);
        } else if (e.type === 'alien_mothership') {
            drawMothership(ctx, e);
        }

        // Frozen overlay
        if (e.state === 'frozen') {
            ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
            ctx.fillRect(-e.w/2, -e.h, e.w, e.h);
            // Ice crystals
            ctx.strokeStyle = '#aaeeff';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const ix = rnd(-e.w/3, e.w/3);
                const iy = rnd(-e.h, -e.h/3);
                ctx.beginPath();
                ctx.moveTo(ix, iy - 4);
                ctx.lineTo(ix, iy + 4);
                ctx.moveTo(ix - 3, iy - 2);
                ctx.lineTo(ix + 3, iy + 2);
                ctx.moveTo(ix + 3, iy - 2);
                ctx.lineTo(ix - 3, iy + 2);
                ctx.stroke();
            }
        }

        ctx.restore();

        // HP bar
        if (e.hp < e.maxHp) {
            const barW = e.w;
            const barH = 4;
            const barX = ex;
            const barY = ey - 6;
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(barX, barY, barW * (e.hp / e.maxHp), barH);
        }
    }
}

function drawRobot(ctx, e) {
    const w2 = e.w / 2;
    const big = e.type === 'big_robot';

    // Body
    ctx.fillStyle = e.color;
    drawRR(ctx, -w2, -e.h, e.w, e.h * 0.6, 4, e.color);

    // Head
    ctx.fillStyle = shadeColor(e.color, 0.2);
    drawRR(ctx, -w2 * 0.7, -e.h - 8, e.w * 0.7, 12, 3, shadeColor(e.color, 0.2));

    // Eye (single glowing)
    ctx.fillStyle = e.accent;
    ctx.beginPath();
    ctx.arc(0, -e.h - 2, big ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(1, -e.h - 3, 1, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = shadeColor(e.color, -0.2);
    ctx.fillRect(-w2 * 0.6, -e.h * 0.4, e.w * 0.25, e.h * 0.4);
    ctx.fillRect(w2 * 0.1, -e.h * 0.4, e.w * 0.25, e.h * 0.4);

    // Arms
    const armAngle = e.state === 'attack_villager' ? Math.sin(e.animTimer * 8) * 0.3 : 0;
    ctx.fillStyle = shadeColor(e.color, -0.1);
    ctx.save();
    ctx.rotate(armAngle);
    ctx.fillRect(w2, -e.h * 0.75, 4, e.h * 0.3);
    ctx.restore();

    // Antenna (small robot)
    if (!big) {
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -e.h - 8);
        ctx.lineTo(0, -e.h - 16);
        ctx.stroke();
        ctx.fillStyle = e.accent;
        ctx.beginPath();
        ctx.arc(0, -e.h - 16, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Holding nose (fleeing from fart)
    if (e.holdingNose) {
        ctx.fillStyle = e.color;
        ctx.fillRect(-2, -e.h - 4, 6, 4);
    }
}

function drawAlien(ctx, e) {
    const w2 = e.w / 2;
    const flying = e.type === 'flying_alien';

    // Body (organic, round)
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.ellipse(0, -e.h * 0.5, w2, e.h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head (larger)
    ctx.fillStyle = shadeColor(e.color, 0.15);
    ctx.beginPath();
    ctx.ellipse(0, -e.h * 0.8, w2 * 0.7, e.h * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Big eyes
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(-4, -e.h * 0.8, 4, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(4, -e.h * 0.8, 4, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Eye shine
    ctx.fillStyle = e.accent;
    ctx.beginPath();
    ctx.arc(-3, -e.h * 0.82, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, -e.h * 0.82, 1.5, 0, Math.PI * 2);
    ctx.fill();

    if (!flying) {
        // Legs (tentacle-like)
        ctx.strokeStyle = shadeColor(e.color, -0.2);
        ctx.lineWidth = 3;
        const legWiggle = Math.sin(e.animTimer * 6) * 3;
        ctx.beginPath();
        ctx.moveTo(-6, -e.h * 0.15);
        ctx.quadraticCurveTo(-8 + legWiggle, e.h * 0.1, -6, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(6, -e.h * 0.15);
        ctx.quadraticCurveTo(8 - legWiggle, e.h * 0.1, 6, 0);
        ctx.stroke();
    } else {
        // Wings
        ctx.fillStyle = shadeColor(e.color, 0.3);
        const wingFlap = Math.sin(e.animTimer * 12) * 0.3;
        ctx.save();
        ctx.rotate(wingFlap);
        ctx.beginPath();
        ctx.ellipse(-w2, -e.h * 0.5, 12, 6, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.rotate(-wingFlap);
        ctx.beginPath();
        ctx.ellipse(w2, -e.h * 0.5, 12, 6, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Holding nose (fleeing from fart)
    if (e.holdingNose) {
        ctx.fillStyle = shadeColor(e.color, 0.2);
        ctx.beginPath();
        ctx.arc(0, -e.h * 0.7, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawMothership(ctx, e) {
    // Large oval body
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.ellipse(0, -e.h * 0.5, e.w * 0.5, e.h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dome on top
    ctx.fillStyle = shadeColor(e.color, 0.2);
    ctx.beginPath();
    ctx.ellipse(0, -e.h * 0.7, e.w * 0.25, e.h * 0.2, 0, Math.PI, 0);
    ctx.fill();

    // Glowing lights around rim
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + e.animTimer * 2;
        const lx = Math.cos(a) * e.w * 0.45;
        const ly = -e.h * 0.5 + Math.sin(a) * e.h * 0.1;
        ctx.fillStyle = i % 2 === 0 ? e.accent : '#ffff44';
        ctx.beginPath();
        ctx.arc(lx, ly, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Beam underneath
    if (e.state === 'attack_villager') {
        ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(-20, -e.h * 0.2);
        ctx.lineTo(-40, 100);
        ctx.lineTo(40, 100);
        ctx.lineTo(20, -e.h * 0.2);
        ctx.fill();
    }

    // Window/eye
    ctx.fillStyle = e.accent;
    ctx.beginPath();
    ctx.ellipse(0, -e.h * 0.6, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
}

// --- VILLAGERS ---
function createVillager(x) {
    const def = VILLAGER_DEFS[rndInt(0, VILLAGER_DEFS.length - 1)];
    return {
        x, y: GROUND_Y - def.h, w: def.w, h: def.h,
        vx: 0,
        hp: def.hp, maxHp: def.hp,
        speed: def.speed,
        skin: def.skin, shirt: def.shirt, pants: def.pants,
        headscarf: def.headscarf, beard: def.beard,
        name: def.name,
        state: 'idle', // idle, scared, hurt, fainted
        animTimer: 0,
        facing: Math.random() > 0.5 ? 1 : -1,
        helpTimer: 0,
    };
}

function updateVillagers(dt) {
    for (const v of villagers) {
        v.animTimer += dt;
        if (v.helpTimer > 0) v.helpTimer -= dt;

        switch (v.state) {
            case 'idle':
                // Gentle wander
                if (Math.random() < 0.01) {
                    v.facing = Math.random() > 0.5 ? 1 : -1;
                    v.vx = v.facing * v.speed * 0.3;
                }
                if (Math.random() < 0.02) v.vx = 0;

                // Check for nearby enemies
                for (const e of enemies) {
                    if (e.state === 'dead' || e.state === 'frozen') continue;
                    if (dist(v.x, v.y, e.x, e.y) < 150) {
                        v.state = 'scared';
                        v.helpTimer = 2;
                        break;
                    }
                }
                break;

            case 'scared':
                // Run away from nearest enemy
                let nearE = null, nearD = Infinity;
                for (const e of enemies) {
                    if (e.state === 'dead') continue;
                    const d = dist(v.x, v.y, e.x, e.y);
                    if (d < nearD) { nearD = d; nearE = e; }
                }
                if (nearE) {
                    v.facing = (v.x - nearE.x) > 0 ? 1 : -1;
                    v.vx = v.facing * v.speed;
                }
                // Calm down if no enemies nearby
                if (nearD > 300 || enemies.length === 0) {
                    v.state = 'idle';
                    v.vx = 0;
                }
                break;

            case 'hurt':
                v.vx = 0;
                if (v.animTimer > 0.3) {
                    if (v.hp <= 0) {
                        v.state = 'fainted';
                    } else {
                        v.state = 'scared';
                    }
                }
                break;

            case 'fainted':
                v.vx = 0;
                break;
        }

        v.x += v.vx * dt;
        // Keep on screen-ish
        const levelW = LEVELS[currentLevel] ? LEVELS[currentLevel].width : 5000;
        v.x = clamp(v.x, 20, levelW - 20);
    }
}

function hurtVillager(v, damage) {
    v.hp -= damage;
    v.state = 'hurt';
    v.animTimer = 0;
    v.helpTimer = 3;
    emitParticles(v.x + v.w/2, v.y + v.h/2, 'hit', 2);
    playSound('villager_help');
}

function drawVillagers(ctx) {
    for (const v of villagers) {
        const vx = v.x - camera.x;
        const vy = v.y + camera.y;
        if (vx < -40 || vx > W + 40) continue;

        ctx.save();
        ctx.translate(vx + v.w/2, vy + v.h);
        ctx.scale(v.facing, 1);

        if (v.state === 'fainted') {
            // Lying on ground
            ctx.rotate(Math.PI / 2);
            ctx.translate(-v.h/2, 0);
        }

        // Legs
        const walkAnim = v.vx !== 0 ? Math.sin(v.animTimer * 8) * 3 : 0;
        ctx.fillStyle = v.pants;
        ctx.fillRect(-4, -v.h * 0.35, 3, v.h * 0.35);
        ctx.fillRect(1 + walkAnim, -v.h * 0.35, 3, v.h * 0.35);

        // Body
        ctx.fillStyle = v.shirt;
        drawRR(ctx, -v.w/2, -v.h * 0.7, v.w, v.h * 0.35, 2, v.shirt);

        // Head
        ctx.fillStyle = v.skin;
        ctx.beginPath();
        ctx.arc(0, -v.h * 0.82, v.w * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Headscarf
        if (v.headscarf) {
            ctx.fillStyle = v.headscarf;
            ctx.beginPath();
            ctx.arc(0, -v.h * 0.85, v.w * 0.38, Math.PI, 0);
            ctx.fill();
        }

        // Beard
        if (v.beard) {
            ctx.fillStyle = '#ccc';
            ctx.beginPath();
            ctx.arc(0, -v.h * 0.72, v.w * 0.25, 0, Math.PI);
            ctx.fill();
        }

        // Eyes
        if (v.state !== 'fainted') {
            ctx.fillStyle = '#222';
            ctx.fillRect(-3, -v.h * 0.84, 2, 2);
            ctx.fillRect(1, -v.h * 0.84, 2, 2);
        } else {
            // X eyes
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-3, -v.h * 0.86); ctx.lineTo(-1, -v.h * 0.82);
            ctx.moveTo(-1, -v.h * 0.86); ctx.lineTo(-3, -v.h * 0.82);
            ctx.stroke();
        }

        ctx.restore();

        // Help bubble
        if (v.helpTimer > 0 && v.state !== 'fainted') {
            drawSpeechBubble(ctx, vx + v.w/2, vy - 4, 'Help!', 'rgba(255,200,200,0.9)');
        }

        // HP bar when hurt
        if (v.hp < v.maxHp && v.state !== 'fainted') {
            const barW = v.w + 4;
            const barX = vx - 2;
            const barY = vy - 8;
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barW, 3);
            ctx.fillStyle = '#44cc44';
            ctx.fillRect(barX, barY, barW * (v.hp / v.maxHp), 3);
        }
    }
}

// --- PROJECTILES ---
function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        if (p.life <= 0) {
            projectiles.splice(i, 1);
            continue;
        }

        // Check collisions
        if (p.owner === 'player') {
            for (const e of enemies) {
                if (e.state === 'dead' || e.state === 'frozen') continue;
                if (rectsOverlap(p.x, p.y, p.w, p.h, e.x, e.y, e.w, e.h)) {
                    hurtEnemy(e, p.damage);
                    projectiles.splice(i, 1);
                    break;
                }
            }
        } else if (p.owner === 'enemy') {
            // Enemy projectiles hit villagers
            for (const v of villagers) {
                if (v.state === 'fainted') continue;
                if (rectsOverlap(p.x, p.y, p.w, p.h, v.x, v.y, v.w, v.h)) {
                    hurtVillager(v, p.damage);
                    projectiles.splice(i, 1);
                    break;
                }
            }
            // Can also hit player
            if (player && rectsOverlap(p.x, p.y, p.w, p.h, player.x, player.y, player.w, player.h)) {
                hurtPlayer(p.damage);
                projectiles.splice(i, 1);
            }
        }

        // Off screen
        if (p.x < camera.x - 100 || p.x > camera.x + W + 100) {
            projectiles.splice(i, 1);
        }
    }
}

function drawProjectiles(ctx) {
    for (const p of projectiles) {
        const px = p.x - camera.x;
        const py = p.y + camera.y;
        if (px < -20 || px > W + 20) continue;

        if (p.type === 'laser') {
            // Glowing laser beam
            ctx.fillStyle = p.color;
            ctx.fillRect(px, py - 1, p.w, p.h);
            ctx.fillStyle = MIKHAIL.laserGlow;
            ctx.globalAlpha = 0.4;
            ctx.fillRect(px - 2, py - 3, p.w + 4, p.h + 4);
            ctx.globalAlpha = 1;
        } else if (p.type === 'freeze_ray') {
            ctx.fillStyle = '#44ccff';
            ctx.fillRect(px, py - 1, p.w, p.h);
            ctx.fillStyle = 'rgba(100,220,255,0.3)';
            ctx.fillRect(px - 3, py - 4, p.w + 6, p.h + 6);
        } else if (p.type === 'enemy_laser') {
            ctx.fillStyle = p.color;
            ctx.fillRect(px, py, p.w, p.h);
        } else if (p.type === 'sonic_wave') {
            ctx.strokeStyle = 'rgba(255,170,0,' + (p.life * 0.8) + ')';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(px, py, p.radius || 20, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// --- PARTICLES ---
function emitParticles(x, y, type, count) {
    for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
        const p = { x, y, type, life: 1, maxLife: 1 };
        switch (type) {
            case 'booster':
                p.vx = rnd(-20, 20);
                p.vy = rnd(40, 100);
                p.life = p.maxLife = rnd(0.2, 0.5);
                p.size = rnd(2, 5);
                p.color = Math.random() > 0.5 ? MIKHAIL.flame : MIKHAIL.flameInner;
                break;
            case 'laser_spark':
                p.vx = rnd(-100, 100);
                p.vy = rnd(-100, 100);
                p.life = p.maxLife = rnd(0.1, 0.3);
                p.size = rnd(1, 3);
                p.color = '#ff8888';
                break;
            case 'hit':
                p.vx = rnd(-150, 150);
                p.vy = rnd(-150, 50);
                p.life = p.maxLife = rnd(0.2, 0.5);
                p.size = rnd(2, 5);
                p.color = '#ffcc44';
                break;
            case 'explosion':
                p.vx = rnd(-200, 200);
                p.vy = rnd(-200, 100);
                p.life = p.maxLife = rnd(0.3, 0.8);
                p.size = rnd(3, 8);
                p.color = ['#ff4444', '#ff8844', '#ffcc44', '#888'][Math.floor(Math.random() * 4)];
                break;
            case 'coin_sparkle':
                p.vx = rnd(-50, 50);
                p.vy = rnd(-80, -20);
                p.life = p.maxLife = rnd(0.3, 0.6);
                p.size = rnd(2, 4);
                p.color = '#ffee44';
                break;
            case 'fart_cloud':
                p.vx = rnd(-30, 30);
                p.vy = rnd(-40, -10);
                p.life = p.maxLife = rnd(1.0, 2.0);
                p.size = rnd(6, 15);
                p.color = '#66cc33';
                break;
            case 'freeze_crystal':
                p.vx = rnd(-80, 80);
                p.vy = rnd(-80, 80);
                p.life = p.maxLife = rnd(0.3, 0.7);
                p.size = rnd(2, 5);
                p.color = '#aaeeff';
                break;
            case 'tears':
                p.vx = rnd(-40, 40);
                p.vy = rnd(-60, -20);
                p.life = p.maxLife = rnd(0.3, 0.6);
                p.size = rnd(2, 4);
                p.color = '#44aaff';
                break;
            case 'zzz':
                p.vx = rnd(-10, 10);
                p.vy = rnd(-30, -15);
                p.life = p.maxLife = rnd(1.0, 2.0);
                p.size = 12;
                p.color = '#fff';
                p.text = 'Z';
                break;
            case 'confetti':
                p.vx = rnd(-200, 200);
                p.vy = rnd(-300, -100);
                p.life = p.maxLife = rnd(1.5, 3.0);
                p.size = rnd(3, 6);
                p.color = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff'][Math.floor(Math.random() * 5)];
                p.gravity = 200;
                break;
            case 'stink':
                p.vx = rnd(-15, 15);
                p.vy = rnd(-30, -10);
                p.life = p.maxLife = rnd(0.5, 1.5);
                p.size = rnd(3, 8);
                p.color = '#88aa44';
                break;
        }
        particles.push(p);
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.gravity) p.vy += p.gravity * dt;
    }
}

function drawParticles(ctx) {
    for (const p of particles) {
        const px = p.x - camera.x;
        const py = p.y + camera.y;
        if (px < -20 || px > W + 20) continue;

        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;

        if (p.text) {
            ctx.fillStyle = p.color;
            ctx.font = `bold ${p.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(p.text, px, py);
        } else if (p.type === 'fart_cloud' || p.type === 'stink') {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha * 0.4;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = p.color;
            ctx.fillRect(px - p.size/2, py - p.size/2, p.size, p.size);
        }
    }
    ctx.globalAlpha = 1;
}

// --- PICKUPS ---
function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const pk = pickups[i];
        pk.animTimer = (pk.animTimer || 0) + dt;

        if (!player) continue;
        // Check pickup collision with player
        if (rectsOverlap(player.x, player.y, player.w, player.h, pk.x, pk.y, pk.w, pk.h)) {
            switch (pk.type) {
                case 'coin':
                    player.coins++;
                    player.score += 10;
                    playSound('coin');
                    emitParticles(pk.x + pk.w/2, pk.y, 'coin_sparkle', 5);
                    break;
                case 'food':
                    player.energy = Math.min(player.maxEnergy, player.energy + pk.energy);
                    player.score += pk.score;
                    player.poopTimer = pk.poopDelay;
                    playSound('food');
                    break;
                case 'special':
                    if (pk.ability && !player.abilities.includes(pk.ability)) {
                        player.abilities.push(pk.ability);
                        player.currentAbility = pk.ability;
                        playSound('powerup');
                    }
                    break;
            }
            pickups.splice(i, 1);
        }
    }
}

function drawPickups(ctx) {
    for (const pk of pickups) {
        const px = pk.x - camera.x;
        const py = pk.y + camera.y + Math.sin((pk.animTimer || 0) * 3) * 4;
        if (px < -20 || px > W + 20) continue;

        switch (pk.type) {
            case 'coin':
                // Gold coin
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath();
                ctx.arc(px + 8, py + 8, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffee44';
                ctx.beginPath();
                ctx.arc(px + 7, py + 6, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#cc9900';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('$', px + 8, py + 12);
                break;
            case 'food':
                // Colored food item
                ctx.fillStyle = pk.color;
                drawRR(ctx, px, py, 18, 14, 4, pk.color);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 8px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(pk.name[0], px + 9, py + 11);
                break;
            case 'special':
                // Glowing power orb
                const ability = ABILITY_DEFS[pk.ability];
                const glow = 0.5 + Math.sin((pk.animTimer || 0) * 4) * 0.3;
                ctx.fillStyle = ability ? ability.color : '#ff44ff';
                ctx.globalAlpha = glow;
                ctx.beginPath();
                ctx.arc(px + 10, py + 10, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.fillStyle = ability ? ability.color : '#ff44ff';
                ctx.beginPath();
                ctx.arc(px + 10, py + 10, 8, 0, Math.PI * 2);
                ctx.fill();
                drawStar(ctx, px + 10, py + 10, 5, 4, '#fff');
                // Label
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 9px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(ability ? ability.name : '?', px + 10, py + 28);
                break;
        }
    }
}
