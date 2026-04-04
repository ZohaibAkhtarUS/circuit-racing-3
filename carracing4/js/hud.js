// ===== CIRCUIT RACING 4 - HUD =====

const HUD = (() => {
    let popupTimer = 0;
    let comboTimer = 0;
    let posChangeTimer = 0;
    let lastPosition = 1;
    let speedLinesEls = [];

    function init() {
        // Create speed lines
        const container = document.getElementById('speed-lines');
        if (container) {
            container.innerHTML = '';
            for (let i = 0; i < 20; i++) {
                const line = document.createElement('div');
                line.className = 'speed-line';
                const angle = Math.random() * 360;
                const dist = 30 + Math.random() * 40;
                const len = 30 + Math.random() * 60;
                line.style.width = `${len}px`;
                line.style.height = '2px';
                line.style.left = `${50 + Math.cos(angle * Math.PI / 180) * dist}%`;
                line.style.top = `${50 + Math.sin(angle * Math.PI / 180) * dist}%`;
                line.style.transform = `rotate(${angle}deg)`;
                container.appendChild(line);
                speedLinesEls.push(line);
            }
        }
    }

    function update(dt) {
        const car = GAME.playerCar;
        if (!car) return;

        // Speed
        const speedKPH = car.getSpeedKPH();
        const speedEl = document.getElementById('speed-num');
        const speedBar = document.getElementById('speed-bar');
        if (speedEl) speedEl.textContent = speedKPH;
        if (speedBar) {
            const pct = Math.min(100, (speedKPH / (PHYS.maxSpeed * 3.6)) * 100);
            speedBar.style.width = pct + '%';
        }

        // Position
        const sorted = [...GAME.allCars].sort((a, b) => b.progress - a.progress);
        const pos = sorted.indexOf(car) + 1;
        const posEl = document.getElementById('pos-num');
        const suffEl = document.getElementById('pos-suffix');
        if (posEl) posEl.textContent = pos;
        if (suffEl) suffEl.textContent = getOrdinalSuffix(pos);

        // Position change
        if (pos !== lastPosition) {
            const change = lastPosition - pos;
            showPosChange(change);
            lastPosition = pos;
        }

        // Lap
        const lapEl = document.getElementById('lap-current');
        const lapTotalEl = document.getElementById('lap-total');
        if (lapEl) lapEl.textContent = Math.min(car.lap, GAME.totalLaps);
        if (lapTotalEl) lapTotalEl.textContent = GAME.totalLaps;

        // Lap time
        const lapTimeEl = document.getElementById('hud-laptime');
        if (lapTimeEl) lapTimeEl.textContent = formatTime(car.currentLapTime);

        // Nitro
        const nitroBar = document.getElementById('nitro-bar');
        if (nitroBar) {
            if (car.nitroActive) {
                nitroBar.style.width = (car.nitroTimer / PHYS.nitroDuration * 100) + '%';
                nitroBar.style.background = 'linear-gradient(90deg, #00ffcc, #0088ff)';
            } else if (!car.nitroReady) {
                nitroBar.style.width = ((1 - car.nitroCooldown / PHYS.nitroCooldown) * 100) + '%';
                nitroBar.style.background = 'linear-gradient(90deg, #444, #666)';
            } else {
                nitroBar.style.width = '100%';
                nitroBar.style.background = 'linear-gradient(90deg, #4488ff, #00ccff)';
            }
        }

        // Item
        const itemIcon = document.getElementById('item-icon');
        const itemName = document.getElementById('item-name');
        if (itemIcon && itemName) {
            if (car.heldItem) {
                itemIcon.textContent = car.heldItem.icon;
                itemName.textContent = car.heldItem.name;
            } else {
                itemIcon.textContent = '';
                itemName.textContent = '';
            }
        }

        // Slipstream
        const slipEl = document.getElementById('hud-slipstream');
        const slipBar = document.getElementById('slip-bar');
        if (slipEl && slipBar) {
            if (car.slipstreamTimer > 0) {
                slipEl.classList.remove('hidden');
                const pct = Math.min(100, (car.slipstreamTimer / PHYS.slipstreamMinTime) * 100);
                slipBar.style.width = pct + '%';
            } else {
                slipEl.classList.add('hidden');
            }
        }

        // Wrong way
        const wrongEl = document.getElementById('hud-wrong-way');
        if (wrongEl) {
            wrongEl.classList.toggle('hidden', !car.goingWrongWay);
        }

        // Speed lines
        const lineContainer = document.getElementById('speed-lines');
        if (lineContainer) {
            if (car.nitroActive || speedKPH > PHYS.maxSpeed * 2.5) {
                lineContainer.classList.remove('hidden');
                lineContainer.style.opacity = Math.min(1, speedKPH / (PHYS.maxSpeed * 4));
            } else {
                lineContainer.classList.add('hidden');
            }
        }

        // Minimap
        updateMinimap();

        // Popup timer
        if (popupTimer > 0) {
            popupTimer -= dt;
            if (popupTimer <= 0) {
                const popup = document.getElementById('hud-popup');
                if (popup) popup.style.opacity = '0';
            }
        }
    }

    function updateMinimap() {
        const canvas = document.getElementById('minimap');
        if (!canvas || !GAME.trackData) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const wp = GAME.trackData.waypoints;
        if (!wp || !wp.length) return;

        // Find bounds
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        wp.forEach(p => {
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
            minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
        });
        const rangeX = maxX - minX || 1;
        const rangeZ = maxZ - minZ || 1;
        const scale = Math.min((w - 20) / rangeX, (h - 20) / rangeZ);
        const offX = (w - rangeX * scale) / 2;
        const offZ = (h - rangeZ * scale) / 2;

        const mapX = (x) => (x - minX) * scale + offX;
        const mapZ = (z) => (z - minZ) * scale + offZ;

        // Draw track
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        wp.forEach((p, i) => {
            if (i === 0) ctx.moveTo(mapX(p.x), mapZ(p.z));
            else ctx.lineTo(mapX(p.x), mapZ(p.z));
        });
        ctx.closePath();
        ctx.stroke();

        // Draw cars
        GAME.allCars.forEach(car => {
            ctx.fillStyle = car.isPlayer ? '#ff4444' : '#ffffff';
            ctx.beginPath();
            ctx.arc(mapX(car.x), mapZ(car.z), car.isPlayer ? 4 : 2.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function showPopup(text, color = '#ffdd00') {
        const popup = document.getElementById('hud-popup');
        if (popup) {
            popup.textContent = text;
            popup.style.color = color;
            popup.style.opacity = '1';
            popupTimer = 2;
        }
    }

    function showCombo(text) {
        const combo = document.getElementById('hud-combo');
        if (combo) {
            combo.textContent = text;
            combo.style.opacity = '1';
            comboTimer = 1.5;
            setTimeout(() => { combo.style.opacity = '0'; }, 1500);
        }
    }

    function showPosChange(change) {
        const el = document.getElementById('hud-pos-change');
        if (el) {
            el.textContent = change > 0 ? `+${change}` : `${change}`;
            el.style.color = change > 0 ? '#44ff44' : '#ff4444';
            el.style.opacity = '1';
            setTimeout(() => { el.style.opacity = '0'; }, 1500);
        }
    }

    function getOrdinalSuffix(n) {
        if (n === 1) return 'ST';
        if (n === 2) return 'ND';
        if (n === 3) return 'RD';
        return 'TH';
    }

    function formatTime(t) {
        const min = Math.floor(t / 60);
        const sec = Math.floor(t % 60);
        const ms = Math.floor((t % 1) * 100);
        return `${min}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }

    function show() { document.getElementById('hud').classList.remove('hidden'); }
    function hide() { document.getElementById('hud').classList.add('hidden'); }

    return { init, update, showPopup, showCombo, show, hide, formatTime };
})();
