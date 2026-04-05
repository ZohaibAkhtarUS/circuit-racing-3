// ============================================================
// MIGHTY MIKHAIL - Main Game Loop & State Machine
// ============================================================

let canvas, ctx;
let gameState = 'menu';
let lastTime = 0;
let selectedLevel = 0;

function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = W;
    canvas.height = H;

    setupKeyboard();
    setupTouch();
    setupUI();

    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    dt = Math.min(dt, 0.05); // Cap delta

    updateInputEdges();

    switch (gameState) {
        case 'playing':
            updatePlaying(dt);
            break;
        case 'cutscene_poop':
            updatePoopBreak(dt);
            break;
    }

    render();
    requestAnimationFrame(gameLoop);
}

function updatePlaying(dt) {
    // Check if poop break should happen
    if (player && player.state === 'poop') {
        gameState = 'cutscene_poop';
        return;
    }

    updatePlayer(dt);
    updateEnemies(dt);
    updateVillagers(dt);
    updateProjectiles(dt);
    Abilities.update(player, dt);
    updateWaves(dt);
    updatePickups(dt);
    updateParticles(dt);
    updateCamera(dt);

    // Check player-enemy collisions (enemies can bump into player)
    if (player && player.state !== 'sleep' && player.state !== 'cry') {
        for (const e of enemies) {
            if (e.state === 'dead' || e.state === 'frozen' || e.state === 'flee') continue;
            if (rectsOverlap(player.x, player.y, player.w, player.h, e.x, e.y, e.w, e.h)) {
                hurtPlayer(e.damage * 0.5); // Bumping does less damage
            }
        }
    }
}

function render() {
    ctx.clearRect(0, 0, W, H);

    if (gameState === 'playing' || gameState === 'paused' || gameState === 'cutscene_poop') {
        // Camera shake
        ctx.save();
        if (camera.shakeTime > 0) {
            ctx.translate(
                (Math.random() - 0.5) * camera.shakeAmt * 2,
                (Math.random() - 0.5) * camera.shakeAmt * 2
            );
        }

        drawBackground(ctx, currentLevel);
        drawPickups(ctx);
        drawVillagers(ctx);
        drawEnemies(ctx);
        drawPlayer(ctx);
        drawProjectiles(ctx);
        drawParticles(ctx);

        ctx.restore();

        drawHUD(ctx);
        drawTutorial(ctx);

        // Poop cutscene overlay
        if (gameState === 'cutscene_poop') {
            drawPoopBreak(ctx);
        }

        // Pause overlay on canvas
        if (gameState === 'paused') {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(0, 0, W, H);
        }
    } else if (gameState === 'menu' || gameState === 'level_select') {
        // Draw a nice background for menus
        drawMenuBackground(ctx);
    }
}

function drawMenuBackground(ctx) {
    // Gradient sky
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#4488cc');
    grad.addColorStop(1, '#88bbee');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Mountains
    ctx.fillStyle = '#6a9a6a';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 5) {
        const mh = Math.sin(x * 0.005) * 80 + Math.sin(x * 0.012) * 40 + 120;
        ctx.lineTo(x, H - mh);
    }
    ctx.lineTo(W, H);
    ctx.fill();

    // Ground
    ctx.fillStyle = '#5a8a3f';
    ctx.fillRect(0, H - 80, W, 80);

    // Sun
    ctx.fillStyle = 'rgba(255,240,100,0.4)';
    ctx.beginPath();
    ctx.arc(W - 100, 80, 50, 0, Math.PI * 2);
    ctx.fill();

    // Draw mini Mikhail flying across
    const t = Date.now() / 1000;
    const mx = (t * 60) % (W + 200) - 100;
    const my = H / 3 + Math.sin(t * 2) * 30;
    ctx.save();
    ctx.translate(mx, my);
    ctx.scale(0.8, 0.8);
    // Mini character
    ctx.fillStyle = MIKHAIL.suit;
    ctx.fillRect(-8, -12, 16, 14);
    ctx.fillStyle = MIKHAIL.skin;
    ctx.beginPath();
    ctx.arc(0, -18, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = MIKHAIL.hair;
    ctx.beginPath();
    ctx.arc(0, -21, 8, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = MIKHAIL.cape;
    ctx.beginPath();
    ctx.moveTo(-8, -12);
    ctx.quadraticCurveTo(-18, -5, -22, 5);
    ctx.lineTo(-10, 0);
    ctx.fill();
    // Flames
    ctx.fillStyle = MIKHAIL.flame;
    const fh = 5 + Math.random() * 4;
    ctx.beginPath();
    ctx.moveTo(-5, 2); ctx.lineTo(-4, 2 + fh); ctx.lineTo(-3, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(3, 2); ctx.lineTo(4, 2 + fh); ctx.lineTo(5, 2);
    ctx.fill();
    ctx.restore();
}

function setState(newState) {
    const prevState = gameState;
    gameState = newState;

    // Toggle overlays
    document.getElementById('menu-overlay').classList.toggle('hidden', newState !== 'menu');
    document.getElementById('level-select-overlay').classList.toggle('hidden', newState !== 'level_select');
    document.getElementById('pause-overlay').classList.toggle('hidden', newState !== 'paused');
    document.getElementById('result-overlay').classList.toggle('hidden', newState !== 'victory' && newState !== 'gameover');
    document.getElementById('sister-overlay').classList.toggle('hidden', newState !== 'sister');

    const pauseBtn = document.getElementById('btn-pause');
    pauseBtn.style.display = (newState === 'playing' || newState === 'cutscene_poop') ? 'flex' : 'none';

    if (isMobile) {
        const showControls = newState === 'playing' || newState === 'paused' || newState === 'cutscene_poop';
        document.getElementById('mobile-controls').style.display = showControls ? 'block' : 'none';
    }

    const kbHint = document.getElementById('keyboard-hint');
    if (kbHint) {
        kbHint.style.display = (!isMobile && newState === 'playing') ? 'block' : 'none';
    }

    switch (newState) {
        case 'level_select':
            buildLevelSelect();
            break;
        case 'playing':
            if (prevState === 'cutscene_poop') {
                // Returning from poop break
            }
            break;
    }
}

function buildLevelSelect() {
    const progress = loadProgress();
    const container = document.getElementById('level-options');
    container.innerHTML = '';

    LEVELS.forEach((lv, i) => {
        const opt = document.createElement('div');
        const unlocked = i < progress.unlocked;
        opt.className = 'level-option' + (!unlocked ? ' locked' : '');

        const name = document.createElement('div');
        name.className = 'level-name';
        name.textContent = (i + 1) + '. ' + lv.name;
        opt.appendChild(name);

        const sub = document.createElement('div');
        sub.className = 'level-subtitle';
        sub.textContent = lv.subtitle;
        opt.appendChild(sub);

        const stars = document.createElement('div');
        stars.className = 'level-stars';
        const s = progress.stars[i] || 0;
        stars.textContent = (s >= 1 ? '\u2605' : '\u2606') + (s >= 2 ? '\u2605' : '\u2606') + (s >= 3 ? '\u2605' : '\u2606');
        opt.appendChild(stars);

        if (unlocked) {
            opt.addEventListener('click', () => {
                initAudio();
                playSound('select');
                selectedLevel = i;
                startLevel(i);
            });
        }

        container.appendChild(opt);
    });
}

function showResult(victory, saved, total, stars) {
    const details = document.getElementById('result-details');
    const title = document.getElementById('result-title');
    const nextBtn = document.getElementById('btn-next-level');

    if (victory) {
        title.textContent = 'VICTORY!';
        title.style.color = '#ffcc00';

        const earnedStars = stars || 1;
        details.innerHTML = `
            <div class="result-score">${player.score}</div>
            <div class="result-stars">${'\u2605'.repeat(earnedStars)}${'\u2606'.repeat(3 - earnedStars)}</div>
            <div class="result-villagers">Villagers Saved: ${saved || 0}/${total || 0}</div>
            <div>Coins: ${player.coins}</div>
        `;

        nextBtn.style.display = currentLevel < 4 ? 'block' : 'none';
        nextBtn.textContent = 'NEXT LEVEL';
        nextBtn.onclick = () => {
            selectedLevel = currentLevel + 1;
            startLevel(selectedLevel);
        };

        setState('victory');
        playSound('level_complete');
    } else {
        title.textContent = 'GAME OVER';
        title.style.color = '#ff4444';
        details.innerHTML = `
            <div class="result-score">${player ? player.score : 0}</div>
            <div>Better luck next time!</div>
        `;
        nextBtn.textContent = 'TRY AGAIN';
        nextBtn.style.display = 'block';
        nextBtn.onclick = () => startLevel(currentLevel);

        setState('gameover');
        playSound('defeat');
    }
}

function setupUI() {
    // Menu
    document.getElementById('btn-play').addEventListener('click', () => {
        initAudio();
        playSound('select');
        setState('level_select');
    });

    // Level select back
    document.getElementById('btn-back-menu').addEventListener('click', () => {
        playSound('select');
        setState('menu');
    });

    // Pause
    document.getElementById('btn-pause').addEventListener('click', () => {
        if (gameState === 'playing') {
            playSound('select');
            setState('paused');
        }
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
        playSound('select');
        setState('playing');
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
        playSound('select');
        startLevel(currentLevel);
    });

    document.getElementById('btn-quit').addEventListener('click', () => {
        playSound('select');
        setState('level_select');
    });

    // Result
    document.getElementById('btn-result-menu').addEventListener('click', () => {
        playSound('select');
        setState('level_select');
    });
}

// Prevent default touch behaviors on game container
document.addEventListener('touchmove', e => {
    if (e.target.closest('#game-container')) e.preventDefault();
}, { passive: false });

// Start the game
window.addEventListener('load', init);
