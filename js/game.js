// ============================================================
// CIRCUIT RACING 1 — Main Game Init & Loop
// ============================================================

function init() {
    // Load settings
    const savedGfx = localStorage.getItem('cr1_gfxQuality');
    if (savedGfx && GFX_PRESETS[savedGfx]) {
        gfxQuality = savedGfx;
        currentGfx = GFX_PRESETS[savedGfx];
    }
    loadBestTimes();

    // Set initial difficulty selector
    document.querySelectorAll('.diff-option').forEach(b => {
        b.classList.toggle('selected', b.dataset.diff === selectedDifficulty);
    });
    document.querySelectorAll('.gfx-option').forEach(b => {
        b.classList.toggle('selected', b.dataset.gfx === gfxQuality);
    });

    scene = new THREE.Scene();
    const theme = TRACK_THEMES[selectedTrack] || TRACK_THEMES[0];
    scene.background = new THREE.Color(theme.sky);
    scene.fog = new THREE.Fog(theme.fog, 80, 280);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 30, 50);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = currentGfx.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
    document.getElementById('game-container').insertBefore(renderer.domElement, document.getElementById('menu-overlay'));

    // Enhanced Lighting
    setupLighting(theme);

    toonGradient = createToonGradient();
    track = buildTrack();
    initParticleSystem();

    minimapCtx = document.getElementById('minimap-canvas').getContext('2d');
    clock = new THREE.Clock();

    // Post-processing (bloom)
    setupPostProcessing();

    // Keyboard
    window.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (e.code === 'KeyC') {
            cameraMode = (cameraMode + 1) % cameraNames.length;
            const camInfo = document.getElementById('camera-info');
            if (camInfo) camInfo.innerHTML = `<kbd>C</kbd> ${cameraNames[cameraMode]}`;
        }
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        if (composer) composer.setSize(window.innerWidth, window.innerHeight);
    });

    // First interaction triggers audio
    document.addEventListener('click', () => { initAudio(); resumeAudio(); }, { once: true });
    document.addEventListener('touchstart', () => { initAudio(); resumeAudio(); }, { once: true });

    animate();
    setupMobileControls();

    // FPS monitoring for auto-quality
    let lowFpsCount = 0;
    setInterval(() => {
        if (gameState === 'racing') {
            const fps = 1 / Math.max(clock.getDelta(), 0.001);
            if (fps < 25) lowFpsCount++;
            else lowFpsCount = Math.max(0, lowFpsCount - 1);
            if (lowFpsCount > 10 && gfxQuality !== 'low') {
                setGfxQuality('low');
                console.log('Auto-lowered graphics quality for better performance');
            }
        }
    }, 1000);
}

function setupLighting(theme) {
    // Clear existing lights
    const lightsToRemove = [];
    scene.traverse(obj => { if (obj instanceof THREE.Light) lightsToRemove.push(obj); });
    lightsToRemove.forEach(l => scene.remove(l));

    // Ambient
    scene.add(new THREE.AmbientLight(theme.ambientColor, 0.5));

    // Main sun
    const sun = new THREE.DirectionalLight(theme.sunColor, theme.sunIntensity);
    sun.position.set(50, 80, 30);
    sun.castShadow = currentGfx.shadows;
    const shadowRes = currentGfx.shadowRes;
    sun.shadow.mapSize.width = sun.shadow.mapSize.height = shadowRes;
    sun.shadow.camera.left = sun.shadow.camera.bottom = -130;
    sun.shadow.camera.right = sun.shadow.camera.top = 130;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 200;
    sun.shadow.bias = -0.001;
    scene.add(sun);

    // Fill light from opposite direction
    const fill = new THREE.DirectionalLight(0x8899bb, 0.3);
    fill.position.set(-30, 40, -20);
    scene.add(fill);

    // Hemisphere for ambient color variation
    scene.add(new THREE.HemisphereLight(theme.hemiSky, theme.hemiGround, 0.4));

    // Warm point light near start area
    const warmLight = new THREE.PointLight(0xffaa44, 0.4, 80);
    warmLight.position.set(0, 10, 0);
    scene.add(warmLight);

    // Colored accent lights for atmosphere
    if (selectedTrack === 3) {
        // Islamabad - warm morning glow
        const morningLight = new THREE.PointLight(0xffe0b2, 0.3, 150);
        morningLight.position.set(0, 30, -150);
        scene.add(morningLight);
    }
}

function setupPostProcessing() {
    if (!currentGfx.bloom) {
        composer = null;
        return;
    }

    // Only set up if THREE addons are available
    if (typeof THREE.EffectComposer === 'undefined') {
        composer = null;
        return;
    }

    try {
        composer = new THREE.EffectComposer(renderer);
        const renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);

        if (typeof THREE.UnrealBloomPass !== 'undefined') {
            const bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.3, 0.4, 0.85
            );
            composer.addPass(bloomPass);
        }
    } catch (e) {
        composer = null;
    }
}

// --- GAME LOOP ---
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    // Clouds drift
    for (const c of clouds) { c.mesh.position.x += c.speed * dt; if (c.mesh.position.x > 200) c.mesh.position.x = -200; }

    if (gameState === 'racing' || gameState === 'finished') {
        if (playerCars[0]) playerCars[0].update(dt, getP1Input());
        if (playerCars[1]) playerCars[1].update(dt, getP2Input());
        for (const ai of aiCars) ai.updateAI(dt);

        // Particle effects
        for (const car of allCars) {
            const spd = Math.abs(car.speed);
            if (car.isDrifting && spd > 15) {
                const bx = car.x - Math.sin(car.angle) * 2.5, bz = car.z - Math.cos(car.angle) * 2.5;
                emitParticle(bx, car.mesh.position.y, bz, 'smoke');
                if (car.driftCharge > 0.8) emitParticle(bx, car.mesh.position.y, bz, 'spark');
            }
            if (spd > 5 && Math.random() < 0.12) {
                emitParticle(car.x - Math.sin(car.angle) * 2.5, car.mesh.position.y, car.z - Math.cos(car.angle) * 2.5, 'exhaust');
            }
            if (spd > 8 && !car.isOnTrack()) emitParticle(car.x, car.mesh.position.y, car.z, 'dust');
            if (car.nitroActive) {
                emitParticle(car.x - Math.sin(car.angle) * 2.5, car.mesh.position.y + 0.3, car.z - Math.cos(car.angle) * 2.5, 'fire');
                emitParticle(car.x - Math.sin(car.angle) * 2.5, car.mesh.position.y, car.z - Math.cos(car.angle) * 2.5, 'boost');
            }
        }

        updateParticles(dt);
        updateItemBoxes(dt);
        updateProjectiles(dt);
        updateHazards(dt);
        updateMovingObstacles(dt);
        updateHUD();
        updateCelebration(dt);
        checkRaceFinish();

        // Update drift popups
        for (let i = driftPopups.length - 1; i >= 0; i--) {
            driftPopups[i].life -= dt;
            driftPopups[i].y += dt * 3;
            if (driftPopups[i].life <= 0) driftPopups.splice(i, 1);
        }
    }

    if (gameState !== 'menu') updateCamera(dt);

    // Render
    if (composer) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
}

init();
