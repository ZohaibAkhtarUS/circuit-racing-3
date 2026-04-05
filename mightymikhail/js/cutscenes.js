// ============================================================
// MIGHTY MIKHAIL - Cutscenes (Poop, Sleep, Sister Ayzal)
// ============================================================

let poopAnimTimer = 0;
let poopPhase = 0; // 0=running to outhouse, 1=inside, 2=coming out
let outhouseX = 0;

function canPoop() {
    if (!player) return false;
    if (bossActive) return false;
    if (gameState !== 'playing') return false;
    if (player.state === 'cry' || player.state === 'sleep' || player.state === 'runaway') return false;
    return true;
}

function startPoopBreak() {
    player.state = 'poop';
    player.vx = 0;
    player.vy = 0;
    player.flying = false;
    poopAnimTimer = 0;
    poopPhase = 0;
    outhouseX = W + 50; // Start off screen right

    // Freeze all enemies
    for (const e of enemies) {
        if (e.state !== 'dead') {
            e._frozenByPoop = true;
            e._prevState = e.state;
            e._prevVx = e.vx;
            e.vx = 0;
            if (e.flies) e.vy = 0;
        }
    }
    playSound('poop_jingle');
}

function updatePoopBreak(dt) {
    if (!player || player.state !== 'poop') return;
    poopAnimTimer += dt;

    switch (poopPhase) {
        case 0: // Speech bubble + outhouse sliding in
            // Outhouse slides in from right
            outhouseX = lerp(outhouseX, W/2 + 30, Math.min(1, 6 * dt));
            if (poopAnimTimer > 1.2) {
                poopPhase = 1;
                poopAnimTimer = 0;
            }
            break;
        case 1: // Inside outhouse (shaking)
            // Stink particles
            if (Math.random() < 0.3) {
                emitParticles(outhouseX, H/2 - 20, 'stink', 1);
            }
            if (poopAnimTimer > 1.5) {
                poopPhase = 2;
                poopAnimTimer = 0;
            }
            break;
        case 2: // Coming out
            if (poopAnimTimer > 0.8) {
                endPoopBreak();
            }
            break;
    }
}

function endPoopBreak() {
    if (!player) return;
    player.state = 'idle';
    player.poopTimer = -1;

    // Unfreeze enemies
    for (const e of enemies) {
        if (e._frozenByPoop) {
            e.state = e._prevState || 'patrol';
            e.vx = e._prevVx || 0;
            delete e._frozenByPoop;
            delete e._prevState;
            delete e._prevVx;
        }
    }
}

function drawPoopBreak(ctx) {
    if (!player || player.state !== 'poop') return;

    ctx.save();

    // Darken background slightly
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, W, H);

    const centerY = H / 2;

    switch (poopPhase) {
        case 0:
            // Speech bubble
            drawSpeechBubble(ctx, W/2 - 50, centerY - 50, 'Wait! Gotta go!', 'rgba(255,255,200,0.95)');

            // Draw outhouse sliding in
            drawOuthouse(ctx, outhouseX, centerY - 40);

            // Draw Mikhail running toward outhouse
            drawMiniMikhail(ctx, lerp(W/2 - 100, outhouseX - 30, clamp(poopAnimTimer / 1.0, 0, 1)), centerY, 'running');
            break;

        case 1:
            // Outhouse shaking
            const shake = Math.sin(poopAnimTimer * 20) * 3;
            drawOuthouse(ctx, outhouseX + shake, centerY - 40);

            // Sound effects text
            const sfx = ['GRUNT!', 'PUSH!', 'NNGH!', 'PLOP!'];
            const sfxIdx = Math.floor(poopAnimTimer * 3) % sfx.length;
            ctx.fillStyle = '#884400';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(sfx[sfxIdx], outhouseX + 20 + Math.random() * 10, centerY - 55);

            // Stink lines
            ctx.strokeStyle = '#88aa44';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                const sx = outhouseX + 20 + i * 12;
                const wiggle = Math.sin(poopAnimTimer * 4 + i) * 5;
                ctx.beginPath();
                ctx.moveTo(sx, centerY - 35);
                ctx.quadraticCurveTo(sx + wiggle, centerY - 50, sx - wiggle, centerY - 65);
                ctx.stroke();
            }
            break;

        case 2:
            // Door open, Mikhail coming out with thumbs up
            drawOuthouse(ctx, outhouseX, centerY - 40, true); // door open
            drawMiniMikhail(ctx, outhouseX - 10, centerY, 'thumbsup');

            // "Ahh!" speech bubble
            drawSpeechBubble(ctx, outhouseX - 30, centerY - 50, 'Ahh! Much better!', 'rgba(200,255,200,0.95)');
            break;
    }

    ctx.restore();
}

function drawOuthouse(ctx, x, y, doorOpen) {
    // Back wall
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(x, y, 40, 60);
    // Roof
    ctx.fillStyle = '#664422';
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x + 20, y - 15);
    ctx.lineTo(x + 45, y);
    ctx.fill();
    // Door
    if (doorOpen) {
        ctx.fillStyle = '#6a4a2a';
        ctx.fillRect(x - 5, y + 5, 15, 50);
    } else {
        ctx.fillStyle = '#7a5a3a';
        ctx.fillRect(x + 5, y + 5, 30, 50);
        // Moon crescent on door
        ctx.fillStyle = '#ffee88';
        ctx.beginPath();
        ctx.arc(x + 20, y + 22, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7a5a3a';
        ctx.beginPath();
        ctx.arc(x + 23, y + 20, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawMiniMikhail(ctx, x, y, pose) {
    ctx.save();
    ctx.translate(x, y);

    // Body
    ctx.fillStyle = MIKHAIL.suit;
    ctx.fillRect(-8, -18, 16, 14);
    // Head
    ctx.fillStyle = MIKHAIL.skin;
    ctx.beginPath();
    ctx.arc(0, -24, 8, 0, Math.PI * 2);
    ctx.fill();
    // Hair
    ctx.fillStyle = MIKHAIL.hair;
    ctx.beginPath();
    ctx.arc(0, -27, 8, Math.PI, 0);
    ctx.fill();
    // Legs
    ctx.fillStyle = MIKHAIL.suit;
    ctx.fillRect(-6, -4, 4, 10);
    ctx.fillRect(2, -4, 4, 10);

    if (pose === 'thumbsup') {
        // Arm up with thumb
        ctx.fillStyle = MIKHAIL.skin;
        ctx.fillRect(10, -22, 4, 10);
        ctx.fillRect(12, -26, 3, 4); // Thumb
        // Happy face
        ctx.fillStyle = '#222';
        ctx.fillRect(-3, -26, 2, 2);
        ctx.fillRect(1, -26, 2, 2);
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -22, 3, 0.1, Math.PI - 0.1);
        ctx.stroke();
    } else if (pose === 'running') {
        // Running legs
        const t = Date.now() / 100;
        ctx.fillStyle = MIKHAIL.suit;
        ctx.save();
        ctx.translate(-2, -4);
        ctx.rotate(Math.sin(t) * 0.5);
        ctx.fillRect(0, 0, 4, 10);
        ctx.restore();
        ctx.save();
        ctx.translate(2, -4);
        ctx.rotate(-Math.sin(t) * 0.5);
        ctx.fillRect(0, 0, 4, 10);
        ctx.restore();
        // Worried face
        ctx.fillStyle = '#ff6644'; // Red cheeks
        ctx.beginPath();
        ctx.arc(-5, -23, 2, 0, Math.PI * 2);
        ctx.arc(5, -23, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// --- SISTER AYZAL SCENE ---
let sisterFed = false;
let sisterDiapered = false;

function showSisterScene(savedVillagers, totalVillagers, stars) {
    sisterFed = false;
    sisterDiapered = false;
    setState('sister');

    // Draw baby on sister canvas
    drawBabyAyzal();

    // Setup buttons
    document.getElementById('btn-feed').onclick = () => {
        if (sisterFed) return;
        sisterFed = true;
        player.coins += 50;
        playSound('baby');
        drawBabyAyzal('feeding');
        document.getElementById('btn-feed').style.opacity = '0.4';
        checkSisterDone(savedVillagers, totalVillagers, stars);
    };

    document.getElementById('btn-diaper').onclick = () => {
        if (sisterDiapered) return;
        sisterDiapered = true;
        player.hp = Math.min(player.maxHp, player.hp + 25);
        playSound('diaper');
        drawBabyAyzal('diaper');
        document.getElementById('btn-diaper').style.opacity = '0.4';
        checkSisterDone(savedVillagers, totalVillagers, stars);
    };
}

function checkSisterDone(saved, total, stars) {
    if (sisterFed && sisterDiapered) {
        document.getElementById('sister-buttons').style.display = 'none';
        const doneBtn = document.getElementById('btn-sister-done');
        doneBtn.classList.remove('hidden');
        doneBtn.onclick = () => {
            showResult(true, saved, total, stars);
        };
    }
}

function drawBabyAyzal(action) {
    const canvas = document.getElementById('sister-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 400, 300);

    // Background
    const grad = ctx.createRadialGradient(200, 150, 50, 200, 150, 180);
    grad.addColorStop(0, '#ffe8f0');
    grad.addColorStop(1, '#ffccdd');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Baby body (round)
    ctx.fillStyle = '#ffccee';
    ctx.beginPath();
    ctx.ellipse(200, 180, 40, 35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Baby head
    ctx.fillStyle = '#e8b87a';
    ctx.beginPath();
    ctx.arc(200, 130, 30, 0, Math.PI * 2);
    ctx.fill();

    // Little hair tuft
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(200, 105, 8, Math.PI, 0);
    ctx.fill();

    // Big eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(190, 128, 8, 0, Math.PI * 2);
    ctx.arc(210, 128, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#442211';
    ctx.beginPath();
    ctx.arc(192, 128, 4, 0, Math.PI * 2);
    ctx.arc(212, 128, 4, 0, Math.PI * 2);
    ctx.fill();
    // Eye sparkle
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(194, 126, 2, 0, Math.PI * 2);
    ctx.arc(214, 126, 2, 0, Math.PI * 2);
    ctx.fill();

    // Cheeks
    ctx.fillStyle = 'rgba(255,130,130,0.4)';
    ctx.beginPath();
    ctx.arc(178, 138, 8, 0, Math.PI * 2);
    ctx.arc(222, 138, 8, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#663322';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (action === 'feeding') {
        // Open mouth eating
        ctx.fillStyle = '#ff8888';
        ctx.beginPath();
        ctx.arc(200, 143, 6, 0, Math.PI * 2);
        ctx.fill();
    } else if (action === 'diaper') {
        // Surprised face
        ctx.fillStyle = '#ff8888';
        ctx.beginPath();
        ctx.ellipse(200, 143, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.arc(200, 140, 8, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }

    // Baby arms (little stubs)
    ctx.fillStyle = '#e8b87a';
    ctx.beginPath();
    ctx.ellipse(165, 170, 12, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(235, 170, 12, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Baby feet
    ctx.beginPath();
    ctx.ellipse(185, 210, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(215, 210, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Name
    ctx.fillStyle = '#993366';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Baby Ayzal', 200, 260);

    // Action specific
    if (action === 'feeding') {
        // Bottle near mouth
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(160, 130, 8, 20);
        ctx.fillStyle = '#ffffcc';
        ctx.fillRect(160, 135, 8, 15);
        ctx.fillStyle = '#ffcc88';
        ctx.beginPath();
        ctx.arc(164, 130, 4, Math.PI, 0);
        ctx.fill();
        // Hearts
        ctx.fillStyle = '#ff6688';
        ctx.font = '20px Arial';
        ctx.fillText('\u2665', 140, 110);
        ctx.fillText('\u2665', 260, 110);
    } else if (action === 'diaper') {
        // Stink lines
        ctx.strokeStyle = '#88aa44';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const sx = 190 + i * 10;
            ctx.beginPath();
            ctx.moveTo(sx, 200);
            ctx.quadraticCurveTo(sx + 5, 185, sx - 5, 170);
            ctx.stroke();
        }
        // Diaper icon
        ctx.fillStyle = '#fff';
        ctx.fillRect(250, 175, 20, 15);
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(250, 175, 20, 15);
    }
}
