// ============================================================
// CIRCUIT RACING 1 — HUD & Minimap
// ============================================================

function updateHUD() {
    const p = playerCars[0];
    if (!p) return;

    document.getElementById('speed-value').textContent = p.getSpeedKPH();
    const ratio = Math.abs(p.speed) / PHYS.maxSpeed;
    const bar = document.getElementById('speed-bar');
    bar.style.width = Math.min(ratio * 100, 100) + '%';
    bar.style.backgroundColor = ratio > 0.9 ? '#e74c3c' : ratio > 0.5 ? '#f1c40f' : '#2ecc71';

    const lap = Math.max(1, Math.min(p.lap, RACE_LAPS));
    document.getElementById('lap-text').textContent = `LAP ${lap}/${RACE_LAPS}`;
    if (p.lapStartTime > 0 && !p.finished) {
        document.getElementById('lap-time').textContent = formatTime(performance.now() - p.lapStartTime);
    }

    // Position
    const sorted = [...allCars].sort((a, b) => b.raceProgress - a.raceProgress);
    const pos = sorted.indexOf(p) + 1;
    document.getElementById('position-value').textContent = pos;
    const suffix = pos === 1 ? 'ST' : pos === 2 ? 'ND' : pos === 3 ? 'RD' : 'TH';
    document.getElementById('position-suffix').textContent = suffix;
    const posColor = { 1: '#f1c40f', 2: '#bdc3c7', 3: '#cd7f32' }[pos] || '#aaa';
    document.getElementById('position-value').style.color = posColor;
    document.getElementById('position-suffix').style.color = posColor;

    // Position change
    if (p.lastPos && p.lastPos !== pos) {
        const change = document.getElementById('position-change');
        change.textContent = pos < p.lastPos ? `+${p.lastPos - pos}` : `-${pos - p.lastPos}`;
        change.style.color = pos < p.lastPos ? '#2ecc71' : '#e74c3c';
        change.style.display = 'block';
        change.style.animation = 'none';
        void change.offsetHeight;
        change.style.animation = 'posChange 1s ease-out forwards';
    }
    p.lastPos = pos;

    // Item
    const itemIcon = document.getElementById('item-icon');
    const itemName = document.getElementById('item-name');
    if (p.heldItem) {
        const icons = { boost: '\u26A1', shield: '\uD83D\uDEE1', missile: '\uD83D\uDE80', oil: '\uD83D\uDEE2', banana: '\uD83C\uDF4C', star: '\u2B50', lightning: '\u26A1', magnet: '\uD83E\uDDF2' };
        const names = { boost: 'BOOST', shield: 'SHIELD', missile: 'ROCKET', oil: 'OIL', banana: 'BANANA', star: 'STAR', lightning: 'ZAP', magnet: 'MAGNET' };
        itemIcon.textContent = icons[p.heldItem] || '?';
        itemName.textContent = names[p.heldItem] || '';
        document.getElementById('item-panel').style.borderColor = 'rgba(255,200,0,0.8)';
    } else {
        itemIcon.textContent = '-';
        itemName.textContent = '';
        document.getElementById('item-panel').style.borderColor = 'rgba(255,107,53,0.3)';
    }

    // Nitro bar
    const nitroBar = document.getElementById('nitro-bar');
    if (p.nitroActive) {
        nitroBar.style.width = (p.nitroTimer / PHYS.nitroDuration * 100) + '%';
        nitroBar.style.backgroundColor = '#00aaff';
    } else if (p.nitroCooldownTimer > 0) {
        nitroBar.style.width = ((1 - p.nitroCooldownTimer / PHYS.nitroCooldown) * 100) + '%';
        nitroBar.style.backgroundColor = '#666';
    } else {
        nitroBar.style.width = '100%';
        nitroBar.style.backgroundColor = '#00aaff';
    }

    // Drift score display
    const driftEl = document.getElementById('drift-score');
    if (driftEl) {
        if (driftScore > 0) {
            driftEl.style.display = 'block';
            driftEl.textContent = `DRIFT: ${driftScore}`;
        } else {
            driftEl.style.display = 'none';
        }
    }

    // Drift combo timer
    if (driftComboTimer > 0) {
        driftComboTimer -= 0.016;
        if (driftComboTimer <= 0) driftCombo = 0;
    }

    // Lightning flash overlay
    const flashEl = document.getElementById('lightning-flash');
    if (flashEl) {
        if (lightningFlashTimer > 0) {
            flashEl.style.display = 'block';
            flashEl.style.opacity = lightningFlashTimer;
            lightningFlashTimer -= 0.016;
        } else {
            flashEl.style.display = 'none';
        }
    }

    // Wrong way detection
    const wrongWayEl = document.getElementById('wrong-way');
    if (wrongWayEl && track && !p.finished) {
        let minD = Infinity, closestIdx = 0;
        for (let i = 0; i < track.waypoints.length; i++) {
            const dx = p.x - track.waypoints[i].x, dz = p.z - track.waypoints[i].z;
            const d = dx * dx + dz * dz;
            if (d < minD) { minD = d; closestIdx = i; }
        }
        const nextIdx = (closestIdx + 1) % track.waypoints.length;
        const toNext = new THREE.Vector3(
            track.waypoints[nextIdx].x - p.x,
            0,
            track.waypoints[nextIdx].z - p.z
        ).normalize();
        const carDir = new THREE.Vector3(Math.sin(p.angle), 0, Math.cos(p.angle));
        const dot = toNext.dot(carDir);
        wrongWayEl.style.display = (dot < -0.5 && Math.abs(p.speed) > 10) ? 'block' : 'none';
    }

    updateMinimap();
}

function updateMinimap() {
    if (!minimapCtx || !track) return;
    const ctx = minimapCtx;
    ctx.clearRect(0, 0, 160, 160);
    const wp = track.waypoints;
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    for (const p of wp) { minX = Math.min(minX, p.x); minZ = Math.min(minZ, p.z); maxX = Math.max(maxX, p.x); maxZ = Math.max(maxZ, p.z); }
    const pad = 15, sx = 130 / (maxX - minX), sz = 130 / (maxZ - minZ);
    const scale = Math.min(sx, sz);
    const ox = pad + (130 - (maxX - minX) * scale) / 2;
    const oz = pad + (130 - (maxZ - minZ) * scale) / 2;
    ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i < wp.length; i++) {
        const x = ox + (wp[i].x - minX) * scale, y = oz + (wp[i].z - minZ) * scale;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
    for (const car of allCars) {
        const x = ox + (car.x - minX) * scale, y = oz + (car.z - minZ) * scale;
        const hex = '#' + CAR_COLORS[car.colorKey].body.toString(16).padStart(6, '0');
        if (car.playerIndex >= 0) { ctx.fillStyle = hex; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
        ctx.fillStyle = hex; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    }
}

function flashItemPickup() {
    const panel = document.getElementById('item-panel');
    if (!panel) return;
    panel.style.animation = 'none';
    void panel.offsetHeight;
    panel.style.animation = 'itemFlash 0.4s ease-out';
}
