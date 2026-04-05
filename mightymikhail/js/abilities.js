// ============================================================
// MIGHTY MIKHAIL - Abilities System
// ============================================================

const Abilities = {
    activate(player, abilityName) {
        const def = ABILITY_DEFS[abilityName];
        if (!def) return;
        if (!player.abilities.includes(abilityName)) return;

        // Check cooldown
        if (player.cooldowns[abilityName] && player.cooldowns[abilityName] > 0) return;
        // Check energy
        if (player.energy < def.energyCost) return;

        player.energy -= def.energyCost;
        player.cooldowns[abilityName] = def.cooldown;

        switch (abilityName) {
            case 'laser':
                fireLaser();
                break;

            case 'fart':
                this.doFart(player);
                break;

            case 'freeze_ray':
                this.doFreezeRay(player);
                break;

            case 'shield':
                player.activeEffects.shield = { timer: def.duration };
                playSound('shield');
                break;

            case 'sonic_boom':
                this.doSonicBoom(player);
                break;

            case 'invisibility':
                player.activeEffects.invisibility = { timer: def.duration };
                player.visible = false;
                break;

            case 'speed_boost':
                player.activeEffects.speed_boost = { timer: def.duration };
                player.speedMultiplier = 2;
                break;

            case 'super_strength':
                player.activeEffects.super_strength = { timer: def.duration };
                player.damageMultiplier = 3;
                playSound('powerup');
                break;
        }
    },

    doFart(player) {
        playSound('fart');
        // Green gas cloud
        const cx = player.x + player.w / 2;
        const cy = player.y + player.h / 2;
        emitParticles(cx, cy, 'fart_cloud', 15);

        // Enemies in radius flee
        const radius = 150;
        for (const e of enemies) {
            if (e.state === 'dead') continue;
            if (dist(cx, cy, e.x + e.w/2, e.y + e.h/2) < radius) {
                e.state = 'flee';
                e.fleeTimer = 3;
                e.holdingNose = true;
            }
        }
        shakeCamera(3, 0.2);
    },

    doFreezeRay(player) {
        playSound('freeze');
        const px = player.x + (player.facing > 0 ? player.w : 0);
        const py = player.y + player.h * 0.35;
        projectiles.push({
            x: px, y: py, w: 25, h: 6,
            vx: LASER_SPEED * player.facing * 0.8, vy: 0,
            damage: 20 * player.damageMultiplier,
            type: 'freeze_ray', owner: 'player',
            life: 1.5, color: '#44ccff',
            freezeOnHit: true,
        });
        emitParticles(px, py, 'freeze_crystal', 5);
    },

    doSonicBoom(player) {
        playSound('sonic_boom');
        const cx = player.x + player.w / 2;
        const cy = player.y + player.h / 2;

        // Expanding shockwave
        projectiles.push({
            x: cx, y: cy, w: 0, h: 0,
            vx: 0, vy: 0,
            damage: 0, type: 'sonic_wave',
            owner: 'player', life: 0.8,
            radius: 20, expandRate: 400,
        });

        // Knockback all enemies in radius
        const radius = 200;
        for (const e of enemies) {
            if (e.state === 'dead') continue;
            const d = dist(cx, cy, e.x + e.w/2, e.y + e.h/2);
            if (d < radius) {
                const knockback = 300 * (1 - d / radius);
                const dx = e.x - cx;
                const dy = e.y - cy;
                const mag = Math.sqrt(dx*dx + dy*dy) || 1;
                e.vx = (dx / mag) * knockback;
                if (e.flies) e.vy = (dy / mag) * knockback;
                hurtEnemy(e, 25 * player.damageMultiplier);
            }
        }
        shakeCamera(8, 0.3);
    },

    update(player, dt) {
        // Update cooldowns
        for (const key in player.cooldowns) {
            if (player.cooldowns[key] > 0) {
                player.cooldowns[key] -= dt;
            }
        }

        // Update sonic wave projectiles
        for (const p of projectiles) {
            if (p.type === 'sonic_wave') {
                p.radius = (p.radius || 20) + (p.expandRate || 400) * dt;
            }
        }

        // Freeze ray projectile special hit handling
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            if (p.freezeOnHit && p.owner === 'player') {
                for (const e of enemies) {
                    if (e.state === 'dead' || e.state === 'frozen') continue;
                    if (rectsOverlap(p.x, p.y, p.w, p.h, e.x, e.y, e.w, e.h)) {
                        e.state = 'frozen';
                        e.frozenTimer = ABILITY_DEFS.freeze_ray.duration;
                        hurtEnemy(e, p.damage);
                        emitParticles(e.x + e.w/2, e.y + e.h/2, 'freeze_crystal', 8);
                        projectiles.splice(i, 1);
                        break;
                    }
                }
            }
        }
    },
};
