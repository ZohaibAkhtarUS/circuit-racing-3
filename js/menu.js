// ============================================================
// CIRCUIT RACING 1 — Menu, Results, Tutorial
// ============================================================

function selectMode(el) {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    gameMode = el.dataset.mode;
    const help = document.getElementById('controls-help');
    if (help) {
        help.textContent = gameMode === 'vs_bots'
            ? 'WASD/Arrows: Drive | Space/Shift: Drift | E: Nitro | F: Use Item | H: Horn | C: Camera'
            : 'P1: WASD+Space+E+F+H | P2: Arrows+Shift | C: Camera';
    }
}

function selectCar(el) {
    document.querySelectorAll('.car-option').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    playerColorKey = el.dataset.color;
}

function selectTrackOption(el) {
    document.querySelectorAll('.track-option').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    selectedTrack = parseInt(el.dataset.track);
}

function selectDifficulty(el) {
    document.querySelectorAll('.diff-option').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    selectedDifficulty = el.dataset.diff;
}

function setGfxQuality(quality) {
    gfxQuality = quality;
    currentGfx = GFX_PRESETS[quality] || GFX_PRESETS.medium;
    localStorage.setItem('cr1_gfxQuality', quality);
    document.querySelectorAll('.gfx-option').forEach(b => {
        b.classList.toggle('selected', b.dataset.gfx === quality);
    });
}

function rebuildScene() {
    const toRemove = [];
    scene.traverse(obj => {
        if (obj !== scene && !(obj instanceof THREE.Light) && !(obj instanceof THREE.Camera)) toRemove.push(obj);
    });
    toRemove.forEach(obj => {
        scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
        }
    });
    particleData = [];
    itemBoxes = []; projectiles = []; hazards = []; movingObstacles = []; staticObstacles = []; clouds = [];
    driftScore = 0; driftCombo = 0; driftComboTimer = 0; driftPopups = [];
    celebrationActive = false;
    track = buildTrack();
    initParticleSystem();
}

function startRace() {
    initAudio();
    resumeAudio();

    document.getElementById('menu-overlay').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('result-overlay').style.display = 'none';

    allCars.forEach(c => c.destroy());
    allCars = []; playerCars = []; aiCars = [];

    rebuildScene();

    const sp = track.startPositions;
    const availColors = Object.keys(CAR_COLORS).filter(c => c !== playerColorKey);
    for (let i = availColors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availColors[i], availColors[j]] = [availColors[j], availColors[i]];
    }

    // Map difficulty to AI difficulties
    const diffMap = {
        kid:    ['kid', 'kid', 'kid', 'kid', 'kid'],
        easy:   ['easy', 'easy', 'medium', 'medium', 'hard'],
        medium: ['medium', 'medium', 'medium', 'hard', 'hard'],
        hard:   ['hard', 'hard', 'hard', 'hard', 'hard']
    };
    const aiDiffs = diffMap[selectedDifficulty] || diffMap.easy;

    if (gameMode === 'vs_bots') {
        const p1 = new GameCar(sp[0].pos.x, sp[0].pos.z, sp[0].angle, playerColorKey, 0);
        p1.driverName = 'YOU';
        playerCars.push(p1);
        allCars.push(p1);
        const numAI = Math.min(5, sp.length - 1, availColors.length);
        for (let i = 0; i < numAI; i++) {
            const ai = new AICar(sp[i + 1].pos.x, sp[i + 1].pos.z, sp[i + 1].angle, availColors[i], aiDiffs[i]);
            ai.driverName = AI_DRIVERS[i].name;
            ai.driverTitle = AI_DRIVERS[i].title;
            aiCars.push(ai); allCars.push(ai);
        }
    } else {
        const p1 = new GameCar(sp[0].pos.x, sp[0].pos.z, sp[0].angle, playerColorKey, 0);
        p1.driverName = 'Player 1';
        playerCars.push(p1);
        const p2 = new GameCar(sp[1].pos.x, sp[1].pos.z, sp[1].angle, availColors[0], 1);
        p2.driverName = 'Player 2';
        playerCars.push(p2);
        allCars.push(p1, p2);
        const numAI = Math.min(4, sp.length - 2, availColors.length - 1);
        for (let i = 0; i < numAI; i++) {
            const ai = new AICar(sp[i + 2].pos.x, sp[i + 2].pos.z, sp[i + 2].angle, availColors[i + 1], aiDiffs[i]);
            ai.driverName = AI_DRIVERS[i + 1].name;
            ai.driverTitle = AI_DRIVERS[i + 1].title;
            aiCars.push(ai); allCars.push(ai);
        }
    }

    startEngineSound();

    if (!localStorage.getItem('cr1TutorialDone')) {
        gameState = 'tutorial';
        startTutorial();
        localStorage.setItem('cr1TutorialDone', '1');
    } else {
        gameState = 'countdown';
        runCountdown();
    }
}

function startRaceWithTutorial() { localStorage.removeItem('cr1TutorialDone'); startRace(); }

function runCountdown() {
    const el = document.getElementById('countdown');
    el.style.display = 'block';
    el.style.fontSize = '100px';
    let count = 3;
    function tick() {
        if (count > 0) {
            el.textContent = count;
            el.style.color = count === 3 ? '#fff' : count === 2 ? '#f1c40f' : '#e74c3c';
            el.style.animation = 'none'; void el.offsetHeight; el.style.animation = 'countPop 0.4s ease-out';
            playCountdownBeep(false);
            count--; setTimeout(tick, 1000);
        } else {
            el.textContent = 'GO!'; el.style.color = '#2ecc71'; el.style.fontSize = '80px';
            el.style.animation = 'none'; void el.offsetHeight; el.style.animation = 'countPop 0.4s ease-out';
            playCountdownBeep(true);
            gameState = 'racing'; raceStartTime = performance.now();
            allCars.forEach(c => { c.lapStartTime = performance.now(); c.lap = 1; });
            setTimeout(() => { el.style.display = 'none'; }, 500);
        }
    }
    tick();
}

function checkRaceFinish() {
    if (gameState !== 'racing') return;
    if (playerCars.every(c => c.finished)) {
        gameState = 'finished';
        allCars.forEach(c => { if (!c.finished) { c.finished = true; c.finishTime = performance.now(); } });
        const sorted = [...allCars].sort((a, b) => a.finishTime - b.finishTime);
        const isWinner = sorted[0].playerIndex >= 0;
        startCelebration(isWinner);
        stopEngineSound();
        setTimeout(showResults, 2000);
    }
}

function showResults() {
    const sorted = [...allCars].sort((a, b) => a.finishTime - b.finishTime);
    const isWinner = sorted[0].playerIndex >= 0;
    const overlay = document.getElementById('result-overlay');
    overlay.style.display = 'flex';

    const playerPos = sorted.findIndex(c => c.playerIndex >= 0) + 1;
    const stars = getStarRating(playerPos);
    const winnerName = sorted[0].driverName || CAR_COLORS[sorted[0].colorKey].name;

    if (isWinner) {
        document.getElementById('result-title').textContent = 'YOU WIN!';
        document.getElementById('result-title').style.color = '#f1c40f';
    } else {
        document.getElementById('result-title').textContent = `${winnerName} Wins!`;
        document.getElementById('result-title').style.color = '#ff6b35';
    }

    // Star rating
    const starDiv = document.getElementById('result-stars');
    if (starDiv) starDiv.innerHTML = renderStars(stars);

    // Best time check
    const trackKey = `track_${selectedTrack}`;
    const raceTime = sorted[0].finishTime - raceStartTime;
    loadBestTimes();
    let isNewRecord = false;
    if (!bestTimes[trackKey] || raceTime < bestTimes[trackKey]) {
        if (isWinner) {
            bestTimes[trackKey] = raceTime;
            saveBestTimes();
            isNewRecord = true;
        }
    }

    const newRecordEl = document.getElementById('new-record');
    if (newRecordEl) {
        newRecordEl.style.display = isNewRecord ? 'block' : 'none';
    }

    // Drift score
    const driftResultEl = document.getElementById('drift-result');
    if (driftResultEl) {
        driftResultEl.textContent = driftScore > 0 ? `Drift Score: ${driftScore}` : '';
    }

    const table = document.getElementById('result-table');
    table.innerHTML = '';
    const posColors = { 1: '#f1c40f', 2: '#bdc3c7', 3: '#cd7f32' };
    const suffixes = { 1: 'ST', 2: 'ND', 3: 'RD' };

    sorted.forEach((car, i) => {
        const pos = i + 1, c = CAR_COLORS[car.colorKey], isP = car.playerIndex >= 0;
        const driverLabel = car.driverName || c.name;
        const titleLabel = car.driverTitle ? ` "${car.driverTitle}"` : '';
        const row = document.createElement('div');
        row.className = 'result-row' + (isP ? ' player' : '');
        row.style.animation = `resultSlideIn 0.4s ease-out ${i * 0.15}s both`;
        row.innerHTML = `<span class="result-pos" style="color:${posColors[pos] || '#888'}">${pos}<small>${suffixes[pos] || 'TH'}</small></span><span class="result-car-preview" style="background:#${c.body.toString(16).padStart(6, '0')}"></span><span class="result-name" style="color:${isP ? '#ff6b35' : '#ccc'}">${driverLabel}${titleLabel}</span><span class="result-time">${formatTime(car.finishTime - raceStartTime)}</span>`;
        table.appendChild(row);
    });
}

function togglePause() {
    if (gameState !== 'racing' && !gamePaused) return;
    gamePaused = !gamePaused;
    const overlay = document.getElementById('pause-overlay');
    if (gamePaused) {
        overlay.style.display = 'flex';
        gameState = 'paused';
        clock.stop();
    } else {
        overlay.style.display = 'none';
        gameState = 'racing';
        clock.start();
    }
}

function quitToMenu() {
    gamePaused = false;
    document.getElementById('pause-overlay').style.display = 'none';
    backToMenu();
}

function restartRace() { gamePaused = false; document.getElementById('pause-overlay').style.display = 'none'; document.getElementById('result-overlay').style.display = 'none'; startRace(); }
function backToMenu() {
    document.getElementById('result-overlay').style.display = 'none';
    document.getElementById('hud').style.display = 'none';
    document.getElementById('menu-overlay').style.display = 'flex';
    gameState = 'menu';
    allCars.forEach(c => c.destroy());
    allCars = []; playerCars = []; aiCars = [];
    stopEngineSound();
}

// --- TUTORIAL ---
const TUTORIAL_STEPS = [
    { title: 'Welcome to Circuit Racing 1!', text: 'Get ready for the most exciting kart race ever! Let\'s learn how to drive!', keys: [], highlight: null },
    { title: 'Go Fast!', text: 'Your car accelerates automatically on mobile! On keyboard, hold gas to speed up.', keys: [{ key: 'W / UP', label: 'Gas' }, { key: 'S / DOWN', label: 'Brake' }], highlight: 'speed-panel' },
    { title: 'Steering', text: 'Tilt your phone or tap the arrows to steer. On keyboard, use A/D or arrows.', keys: [{ key: 'A / LEFT', label: 'Left' }, { key: 'D / RIGHT', label: 'Right' }], highlight: null },
    { title: 'Drifting', text: 'Tilt sharply or hold drift while turning for sharp corners. Release for a speed boost!', keys: [{ key: 'SPACE / SHIFT', label: 'Drift' }], highlight: null },
    { title: 'Nitro Boost!', text: 'Press the rocket button for SUPER SPEED! 8 second cooldown.', keys: [{ key: 'E', label: 'Nitro' }], highlight: 'nitro-panel' },
    { title: 'Power-Ups!', text: 'Drive through rainbow boxes to get items! You get rockets, shields, bananas, stars and more!', keys: [{ key: 'F', label: 'Use Item' }], highlight: 'item-panel' },
    { title: 'Horn!', text: 'Press H to honk your horn! It\'s fun!', keys: [{ key: 'H', label: 'HONK!' }], highlight: null },
    { title: 'Ready to Race!', text: 'Complete 10 laps to win! Dodge obstacles and hit ramps for big air! GO GO GO!', keys: [], highlight: null, isFinal: true }
];

function startTutorial() { tutorialActive = true; tutorialStep = 0; document.getElementById('tutorial-overlay').style.display = 'flex'; showTutorialStep(); }
function showTutorialStep() {
    const step = TUTORIAL_STEPS[tutorialStep], total = TUTORIAL_STEPS.length;
    const ind = document.getElementById('tutorial-step-indicator');
    ind.innerHTML = '';
    for (let i = 0; i < total; i++) { const d = document.createElement('div'); d.className = 'dot' + (i === tutorialStep ? ' active' : i < tutorialStep ? ' done' : ''); ind.appendChild(d); }
    document.getElementById('tutorial-title').textContent = step.title;
    document.getElementById('tutorial-text').textContent = step.text;
    const keysDiv = document.getElementById('tutorial-keys');
    keysDiv.innerHTML = '';
    step.keys.forEach(k => { const b = document.createElement('div'); b.className = 'key-badge'; b.innerHTML = `${k.key}<span class="key-label">${k.label}</span>`; keysDiv.appendChild(b); });
    document.getElementById('tutorial-next').textContent = step.isFinal ? 'Start Race!' : 'Next';
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    if (step.highlight) { const el = document.getElementById(step.highlight); if (el) el.classList.add('tutorial-highlight'); }
    const box = document.getElementById('tutorial-box');
    box.style.animation = 'none'; void box.offsetHeight; box.style.animation = 'tutorialSlideUp 0.4s ease-out';
}
function nextTutorialStep() { tutorialStep++; if (tutorialStep >= TUTORIAL_STEPS.length) endTutorial(); else showTutorialStep(); }
function skipTutorial() { endTutorial(); }
function endTutorial() { tutorialActive = false; document.getElementById('tutorial-overlay').style.display = 'none'; document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight')); gameState = 'countdown'; runCountdown(); }
