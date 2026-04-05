// ============================================================
// MIGHTY MIKHAIL - Renderer (Parallax Backgrounds + Camera)
// ============================================================

const camera = { x: 0, y: 0, targetX: 0, targetY: 0, shakeTime: 0, shakeAmt: 0 };

function updateCamera(dt) {
    if (!player) return;
    camera.targetX = player.x - W * 0.35;
    camera.targetY = player.flying ? (player.y - H * 0.4) : 0;
    camera.targetY = clamp(camera.targetY, -(H * 0.4), 0);

    const levelW = LEVELS[currentLevel] ? LEVELS[currentLevel].width : 5000;
    camera.targetX = clamp(camera.targetX, 0, levelW - W);

    camera.x = lerp(camera.x, camera.targetX, Math.min(1, 8 * dt));
    camera.y = lerp(camera.y, camera.targetY, Math.min(1, 4 * dt));

    if (camera.shakeTime > 0) {
        camera.shakeTime -= dt;
    }
}

function shakeCamera(amt, dur) {
    camera.shakeAmt = amt;
    camera.shakeTime = dur;
}

function drawBackground(ctx, levelIdx) {
    const lv = LEVELS[levelIdx];
    if (!lv) return;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, lv.sky[0]);
    skyGrad.addColorStop(1, lv.sky[1]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Sun/moon
    if (levelIdx === 4) {
        // Red dramatic sky - moon
        ctx.fillStyle = 'rgba(255,200,150,0.3)';
        ctx.beginPath();
        ctx.arc(W - 100, 60, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,220,180,0.5)';
        ctx.beginPath();
        ctx.arc(W - 100, 60, 25, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Sun
        ctx.fillStyle = 'rgba(255,240,100,0.4)';
        ctx.beginPath();
        ctx.arc(W - 120, 70, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,250,200,0.6)';
        ctx.beginPath();
        ctx.arc(W - 120, 70, 25, 0, Math.PI * 2);
        ctx.fill();
    }

    // Clouds
    drawClouds(ctx, levelIdx);

    // Far layer - Mountains (0.2x scroll)
    drawMountains(ctx, levelIdx);

    // Mid layer - Buildings/structures (0.5x scroll)
    drawMidLayer(ctx, levelIdx);

    // Near layer - Foreground detail (0.8x scroll)
    drawNearLayer(ctx, levelIdx);

    // Ground
    const groundY = GROUND_Y + camera.y;
    ctx.fillStyle = lv.groundColor;
    ctx.fillRect(0, groundY, W, H - groundY);
    // Ground texture line
    ctx.fillStyle = shadeColor(lv.groundColor, -0.15);
    ctx.fillRect(0, groundY, W, 3);
    // Ground detail dots
    ctx.fillStyle = shadeColor(lv.groundColor, 0.1);
    for (let i = 0; i < 30; i++) {
        const gx = ((i * 137 + camera.x * 0.8) % (W + 100)) - 50;
        const gy = groundY + 8 + (i * 31 % 40);
        ctx.fillRect(gx, gy, 2 + (i % 3), 1);
    }
}

function drawClouds(ctx, levelIdx) {
    ctx.fillStyle = levelIdx === 4 ? 'rgba(100,50,50,0.2)' : 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 6; i++) {
        const cx = ((i * 270 + 100 - camera.x * 0.1) % (W + 200)) - 100;
        const cy = 30 + (i * 47 % 80);
        const cw = 60 + (i * 23 % 40);
        ctx.beginPath();
        ctx.ellipse(cx, cy, cw, 15 + (i % 8), 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawMountains(ctx, levelIdx) {
    const scrollX = camera.x * 0.2;
    ctx.save();

    if (levelIdx === 3) {
        // Margalla Hills - tall jagged peaks
        ctx.fillStyle = '#6a7a6a';
        for (let i = 0; i < 8; i++) {
            const mx = i * 200 - scrollX % 200 - 100;
            const mh = 120 + (i * 37 % 80);
            ctx.beginPath();
            ctx.moveTo(mx - 80, GROUND_Y + camera.y);
            ctx.lineTo(mx - 20, GROUND_Y + camera.y - mh * 0.7);
            ctx.lineTo(mx, GROUND_Y + camera.y - mh);
            ctx.lineTo(mx + 30, GROUND_Y + camera.y - mh * 0.6);
            ctx.lineTo(mx + 90, GROUND_Y + camera.y);
            ctx.fill();
        }
        // Snow caps
        ctx.fillStyle = '#dde8ee';
        for (let i = 0; i < 8; i++) {
            const mx = i * 200 - scrollX % 200 - 100;
            const mh = 120 + (i * 37 % 80);
            const top = GROUND_Y + camera.y - mh;
            ctx.beginPath();
            ctx.moveTo(mx - 10, top + 15);
            ctx.lineTo(mx, top);
            ctx.lineTo(mx + 15, top + 20);
            ctx.fill();
        }
    } else {
        // Gentle rolling mountains
        ctx.fillStyle = levelIdx === 4 ? '#3a2a3a' : '#7a9a7a';
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y + camera.y);
        for (let x = 0; x <= W + 50; x += 5) {
            const worldX = x + scrollX;
            const mh = Math.sin(worldX * 0.003) * 60 + Math.sin(worldX * 0.007) * 30 + 80;
            ctx.lineTo(x, GROUND_Y + camera.y - mh);
        }
        ctx.lineTo(W + 50, GROUND_Y + camera.y);
        ctx.fill();
    }
    ctx.restore();
}

function drawMidLayer(ctx, levelIdx) {
    const scrollX = camera.x * 0.5;
    ctx.save();

    switch (LEVELS[levelIdx].bgTheme) {
        case 'village':
            // Mud/brick houses
            for (let i = 0; i < 10; i++) {
                const bx = i * 300 - scrollX % 300 - 50;
                const bh = 40 + (i * 31 % 30);
                const by = GROUND_Y + camera.y - bh;
                // House body
                ctx.fillStyle = (i % 2) ? '#c8a070' : '#b89060';
                ctx.fillRect(bx, by, 50, bh);
                // Roof
                ctx.fillStyle = '#884422';
                ctx.beginPath();
                ctx.moveTo(bx - 5, by);
                ctx.lineTo(bx + 25, by - 20);
                ctx.lineTo(bx + 55, by);
                ctx.fill();
                // Door
                ctx.fillStyle = '#554422';
                drawRR(ctx, bx + 18, by + bh - 22, 14, 22, 3, '#554422');
                // Window
                ctx.fillStyle = '#aaddee';
                ctx.fillRect(bx + 8, by + 10, 10, 8);
                ctx.strokeStyle = '#443322';
                ctx.lineWidth = 1;
                ctx.strokeRect(bx + 8, by + 10, 10, 8);
            }
            // Trees
            for (let i = 0; i < 6; i++) {
                const tx = i * 400 + 150 - scrollX % 400;
                drawTree(ctx, tx, GROUND_Y + camera.y, 30 + (i * 13 % 20));
            }
            break;

        case 'bazaar':
            // Market stalls with colored awnings
            for (let i = 0; i < 12; i++) {
                const sx = i * 250 - scrollX % 250 - 30;
                const sh = 50 + (i * 17 % 20);
                const sy = GROUND_Y + camera.y - sh;
                // Stall body
                ctx.fillStyle = '#8a7a5a';
                ctx.fillRect(sx, sy + 15, 60, sh - 15);
                // Awning (triangle)
                const awningColors = ['#cc3333', '#3366cc', '#33aa33', '#cc9900'];
                ctx.fillStyle = awningColors[i % 4];
                ctx.beginPath();
                ctx.moveTo(sx - 8, sy + 15);
                ctx.lineTo(sx + 30, sy);
                ctx.lineTo(sx + 68, sy + 15);
                ctx.fill();
                // Goods (small colored circles)
                for (let j = 0; j < 4; j++) {
                    ctx.fillStyle = ['#ff6644', '#ffcc00', '#44cc44', '#ff44aa'][j];
                    ctx.beginPath();
                    ctx.arc(sx + 10 + j * 14, sy + 30, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            // Hanging lights
            for (let i = 0; i < 20; i++) {
                const lx = i * 120 + 50 - scrollX % 120;
                ctx.fillStyle = ['#ffcc00', '#ff4444', '#44ff44'][i % 3];
                ctx.beginPath();
                ctx.arc(lx, GROUND_Y + camera.y - 70, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(lx, GROUND_Y + camera.y - 73);
                ctx.lineTo(lx, GROUND_Y + camera.y - 80);
                ctx.stroke();
            }
            break;

        case 'park':
            // Large trees
            for (let i = 0; i < 8; i++) {
                const tx = i * 350 + 80 - scrollX % 350;
                drawTree(ctx, tx, GROUND_Y + camera.y, 40 + (i * 19 % 25));
            }
            // Playground equipment
            // Swing set
            const swX = 400 - scrollX % 1200;
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(swX, GROUND_Y + camera.y);
            ctx.lineTo(swX + 15, GROUND_Y + camera.y - 50);
            ctx.lineTo(swX + 45, GROUND_Y + camera.y - 50);
            ctx.lineTo(swX + 60, GROUND_Y + camera.y);
            ctx.stroke();
            // Chains
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(swX + 22, GROUND_Y + camera.y - 48);
            ctx.lineTo(swX + 20, GROUND_Y + camera.y - 15);
            ctx.moveTo(swX + 38, GROUND_Y + camera.y - 48);
            ctx.lineTo(swX + 40, GROUND_Y + camera.y - 15);
            ctx.stroke();
            // Seats
            ctx.fillStyle = '#884422';
            ctx.fillRect(swX + 16, GROUND_Y + camera.y - 15, 10, 3);
            ctx.fillRect(swX + 36, GROUND_Y + camera.y - 15, 10, 3);
            // Bench
            const bnX = 700 - scrollX % 1200;
            ctx.fillStyle = '#885533';
            ctx.fillRect(bnX, GROUND_Y + camera.y - 18, 40, 4);
            ctx.fillRect(bnX + 2, GROUND_Y + camera.y - 18, 3, 18);
            ctx.fillRect(bnX + 35, GROUND_Y + camera.y - 18, 3, 18);
            break;

        case 'hills':
            // Pine trees
            for (let i = 0; i < 10; i++) {
                const tx = i * 280 + 60 - scrollX % 280;
                drawPineTree(ctx, tx, GROUND_Y + camera.y, 35 + (i * 23 % 20));
            }
            // Rocky outcrops
            for (let i = 0; i < 5; i++) {
                const rx = i * 600 + 200 - scrollX % 600;
                ctx.fillStyle = '#8a7a6a';
                ctx.beginPath();
                ctx.moveTo(rx - 20, GROUND_Y + camera.y);
                ctx.lineTo(rx - 10, GROUND_Y + camera.y - 25);
                ctx.lineTo(rx + 5, GROUND_Y + camera.y - 30);
                ctx.lineTo(rx + 20, GROUND_Y + camera.y - 15);
                ctx.lineTo(rx + 30, GROUND_Y + camera.y);
                ctx.fill();
            }
            break;

        case 'city':
            // Tall buildings
            for (let i = 0; i < 12; i++) {
                const bx = i * 220 - scrollX % 220 - 40;
                const bh = 80 + (i * 43 % 80);
                const by = GROUND_Y + camera.y - bh;
                ctx.fillStyle = ['#334455', '#445566', '#3a3a4a'][i % 3];
                ctx.fillRect(bx, by, 50, bh);
                // Windows (lit)
                for (let wy = by + 8; wy < by + bh - 10; wy += 14) {
                    for (let wx = bx + 6; wx < bx + 44; wx += 12) {
                        ctx.fillStyle = (i * 7 + wy * 3 + wx) % 5 > 1 ? '#ffee88' : '#334455';
                        ctx.fillRect(wx, wy, 6, 8);
                    }
                }
            }
            // Faisal Mosque silhouette (far background)
            const mosqueX = W * 0.5 - scrollX * 0.3;
            ctx.fillStyle = '#2a2a3a';
            // Main dome
            ctx.beginPath();
            ctx.arc(mosqueX, GROUND_Y + camera.y - 80, 40, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(mosqueX - 40, GROUND_Y + camera.y - 80, 80, 80);
            // Minarets
            for (let m = -1; m <= 1; m += 2) {
                ctx.fillRect(mosqueX + m * 55 - 3, GROUND_Y + camera.y - 120, 6, 120);
                ctx.beginPath();
                ctx.moveTo(mosqueX + m * 55 - 4, GROUND_Y + camera.y - 120);
                ctx.lineTo(mosqueX + m * 55, GROUND_Y + camera.y - 130);
                ctx.lineTo(mosqueX + m * 55 + 4, GROUND_Y + camera.y - 120);
                ctx.fill();
            }
            break;
    }
    ctx.restore();
}

function drawNearLayer(ctx, levelIdx) {
    const scrollX = camera.x * 0.8;
    ctx.save();

    // Bushes and small details close to ground
    ctx.fillStyle = '#3a6a2a';
    for (let i = 0; i < 15; i++) {
        const bx = i * 200 + 30 - scrollX % 200;
        const by = GROUND_Y + camera.y - 8;
        const bw = 20 + (i * 17 % 15);
        ctx.beginPath();
        ctx.ellipse(bx, by, bw, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Lamp posts (city & bazaar)
    if (levelIdx === 1 || levelIdx === 4) {
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const lx = i * 350 + 100 - scrollX % 350;
            ctx.beginPath();
            ctx.moveTo(lx, GROUND_Y + camera.y);
            ctx.lineTo(lx, GROUND_Y + camera.y - 60);
            ctx.stroke();
            ctx.fillStyle = '#ffee88';
            ctx.beginPath();
            ctx.arc(lx, GROUND_Y + camera.y - 62, 5, 0, Math.PI * 2);
            ctx.fill();
            // Glow
            ctx.fillStyle = 'rgba(255,238,136,0.15)';
            ctx.beginPath();
            ctx.arc(lx, GROUND_Y + camera.y - 62, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

function drawTree(ctx, x, groundY, height) {
    // Trunk
    ctx.fillStyle = '#6a4a2a';
    ctx.fillRect(x - 4, groundY - height * 0.4, 8, height * 0.4);
    // Foliage (overlapping circles)
    ctx.fillStyle = '#3a8a2a';
    ctx.beginPath();
    ctx.arc(x, groundY - height * 0.6, height * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a9a3a';
    ctx.beginPath();
    ctx.arc(x - height * 0.15, groundY - height * 0.5, height * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + height * 0.15, groundY - height * 0.5, height * 0.25, 0, Math.PI * 2);
    ctx.fill();
}

function drawPineTree(ctx, x, groundY, height) {
    // Trunk
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(x - 3, groundY - height * 0.3, 6, height * 0.3);
    // Triangle layers
    for (let i = 0; i < 3; i++) {
        const ly = groundY - height * (0.3 + i * 0.25);
        const lw = height * (0.35 - i * 0.08);
        ctx.fillStyle = i === 0 ? '#2a6a2a' : i === 1 ? '#3a7a3a' : '#4a8a4a';
        ctx.beginPath();
        ctx.moveTo(x - lw, ly);
        ctx.lineTo(x, ly - height * 0.25);
        ctx.lineTo(x + lw, ly);
        ctx.fill();
    }
}
