// ============================================================
// MIGHTY MIKHAIL - HUD (Heads Up Display)
// ============================================================

let scoreDisplayTimer = 0;
let lastDisplayedScore = 0;

function drawHUD(ctx) {
    if (!player) return;
    ctx.save();

    // Camera shake for HUD
    if (camera.shakeTime > 0) {
        ctx.translate((Math.random() - 0.5) * camera.shakeAmt, (Math.random() - 0.5) * camera.shakeAmt);
    }

    // --- HP Bar (top left) ---
    const hpX = 14, hpY = 14;
    drawRR(ctx, hpX - 2, hpY - 2, 154, 18, 5, 'rgba(0,0,0,0.5)');
    drawRR(ctx, hpX, hpY, 150, 14, 4, '#222');
    const hpPct = player.hp / player.maxHp;
    const hpColor = hpPct > 0.5 ? '#44cc44' : (hpPct > 0.25 ? '#ccaa22' : '#cc2222');
    if (hpPct > 0) {
        drawRR(ctx, hpX, hpY, 150 * hpPct, 14, 4, hpColor);
    }
    drawRR(ctx, hpX, hpY, 150, 14, 4, null, '#fff', 1.5);
    // Heart icon
    drawHeart(ctx, hpX + 8, hpY + 7, 6, '#ff4444');
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('HP', hpX + 16, hpY + 11);

    // --- Energy Bar ---
    const enX = 14, enY = 36;
    drawRR(ctx, enX - 2, enY - 2, 124, 14, 4, 'rgba(0,0,0,0.5)');
    drawRR(ctx, enX, enY, 120, 10, 3, '#222');
    const enPct = player.energy / (player.maxEnergy || ENERGY_MAX);
    if (enPct > 0) {
        drawRR(ctx, enX, enY, 120 * enPct, 10, 3, '#ffcc00');
    }
    drawRR(ctx, enX, enY, 120, 10, 3, null, 'rgba(255,255,255,0.5)', 1);
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 9px Arial';
    ctx.fillText('EN', enX + 4, enY + 8);

    // --- Booster Fuel Bar (only when flying or fuel < max) ---
    if (player.flying || player.boosterFuel < (player.maxFuel || BOOSTER_FUEL_MAX)) {
        const bX = 14, bY = 52;
        drawRR(ctx, bX - 2, bY - 2, 104, 12, 4, 'rgba(0,0,0,0.5)');
        drawRR(ctx, bX, bY, 100, 8, 3, '#222');
        const bPct = player.boosterFuel / (player.maxFuel || BOOSTER_FUEL_MAX);
        if (bPct > 0) {
            drawRR(ctx, bX, bY, 100 * bPct, 8, 3, '#4488ff');
        }
        ctx.fillStyle = '#88bbff';
        ctx.font = 'bold 8px Arial';
        ctx.fillText('FUEL', bX + 4, bY + 7);
    }

    // --- Lives ---
    const livesX = 14, livesY = 68;
    for (let i = 0; i < player.lives; i++) {
        drawHeart(ctx, livesX + i * 18, livesY, 7, i < player.lives ? '#ff4444' : '#444');
    }

    // --- Score (top right) ---
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    if (player.score !== lastDisplayedScore) {
        scoreDisplayTimer = 0.3;
        lastDisplayedScore = player.score;
    }
    if (scoreDisplayTimer > 0) {
        scoreDisplayTimer -= 1/60;
        ctx.font = 'bold 22px Arial';
        ctx.fillStyle = '#ffcc00';
    }
    ctx.fillText(player.score.toString(), W - 14, 28);
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText('SCORE', W - 14, 14);

    // --- Coins ---
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(player.coins.toString(), W - 14, 48);
    // Coin icon
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(W - 38, 43, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cc9900';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('$', W - 38, 46);

    // --- Level Name (top center) ---
    ctx.textAlign = 'center';
    if (levelIntroTimer > 0) {
        const alpha = Math.min(1, levelIntroTimer);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(LEVELS[currentLevel].name, W/2, H/2 - 20);
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#ffcc00';
        ctx.fillText(LEVELS[currentLevel].subtitle, W/2, H/2 + 10);
        ctx.globalAlpha = 1;
    } else {
        // Small level indicator
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = 'bold 11px Arial';
        ctx.fillText(`Level ${currentLevel + 1}: ${LEVELS[currentLevel].name}`, W/2, 14);
        // Wave indicator
        const totalWaves = LEVELS[currentLevel].waves.length;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px Arial';
        ctx.fillText(`Wave ${Math.min(waveIndex, totalWaves)}/${totalWaves}`, W/2, 26);
    }

    // --- Villager Status (small icons) ---
    if (villagers.length > 0) {
        const vsX = W/2 - villagers.length * 9;
        const vsY = 36;
        for (let i = 0; i < villagers.length; i++) {
            const v = villagers[i];
            const color = v.state === 'fainted' ? '#555' : (v.state === 'hurt' || v.state === 'scared' ? '#ff6644' : '#44cc44');
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(vsX + i * 18, vsY, 5, 0, Math.PI * 2);
            ctx.fill();
            // Tiny face
            ctx.fillStyle = '#fff';
            ctx.fillRect(vsX + i * 18 - 2, vsY - 2, 1, 1);
            ctx.fillRect(vsX + i * 18 + 1, vsY - 2, 1, 1);
        }
    }

    // --- Current Ability Indicator (bottom center) ---
    const abDef = ABILITY_DEFS[player.currentAbility];
    if (abDef) {
        const abX = W/2;
        const abY = H - 30;
        // Background
        drawRR(ctx, abX - 40, abY - 12, 80, 24, 8, 'rgba(0,0,0,0.6)');
        // Ability name
        ctx.fillStyle = abDef.color;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(abDef.name.toUpperCase(), abX, abY + 4);
        // Cooldown overlay
        const cd = player.cooldowns[player.currentAbility] || 0;
        if (cd > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            drawRR(ctx, abX - 40, abY - 12, 80 * (cd / abDef.cooldown), 24, 8, 'rgba(0,0,0,0.5)');
            ctx.fillStyle = '#ff8888';
            ctx.font = 'bold 10px Arial';
            ctx.fillText(cd.toFixed(1) + 's', abX, abY + 4);
        }
    }

    // --- Boss HP Bar ---
    if (bossActive && bossEntity && bossEntity.state !== 'dead') {
        const bossBarW = W - 100;
        const bossBarX = 50;
        const bossBarY = H - 60;
        drawRR(ctx, bossBarX - 2, bossBarY - 2, bossBarW + 4, 18, 5, 'rgba(0,0,0,0.6)');
        drawRR(ctx, bossBarX, bossBarY, bossBarW, 14, 4, '#222');
        const bossPct = bossEntity.hp / bossEntity.maxHp;
        if (bossPct > 0) {
            const bossGrad = ctx.createLinearGradient(bossBarX, bossBarY, bossBarX + bossBarW * bossPct, bossBarY);
            bossGrad.addColorStop(0, '#ff4444');
            bossGrad.addColorStop(1, '#ff8844');
            drawRR(ctx, bossBarX, bossBarY, bossBarW * bossPct, 14, 4, null);
            ctx.fillStyle = bossGrad;
            ctx.fill();
        }
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(ENEMY_DEFS[bossEntity.type] ? ENEMY_DEFS[bossEntity.type].name : 'BOSS', W/2, bossBarY + 11);
    }

    // --- GO Arrow (when wave cleared) ---
    if (!waveLocked && !levelComplete && waveIndex > 0 && waveIndex < LEVELS[currentLevel].waves.length) {
        const arrowAlpha = 0.5 + Math.sin(goArrowTimer * 4) * 0.3;
        ctx.globalAlpha = arrowAlpha;
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GO >', W - 50, H/2);
        ctx.globalAlpha = 1;
    }

    ctx.restore();
}
