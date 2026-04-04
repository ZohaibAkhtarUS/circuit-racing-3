// ===== CIRCUIT RACING 4 - GAME =====

const Game = (() => {
    let lastTime = 0;
    let countdownNum = 3;
    let countdownTime = 0;
    let goTimestamp = 0;

    function init() {
        // Renderer
        GAME.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        GAME.renderer.setSize(window.innerWidth, window.innerHeight);
        GAME.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        GAME.renderer.shadowMap.enabled = GAME.gfx.shadows;
        GAME.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        GAME.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        GAME.renderer.toneMappingExposure = 1.1;
        document.getElementById('game-container').insertBefore(GAME.renderer.domElement, document.getElementById('game-container').firstChild);

        // Camera
        GAME.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 600);

        // Scene
        GAME.scene = new THREE.Scene();

        // Clock
        GAME.clock = new THREE.Clock();

        // Resize
        window.addEventListener('resize', () => {
            GAME.camera.aspect = window.innerWidth / window.innerHeight;
            GAME.camera.updateProjectionMatrix();
            GAME.renderer.setSize(window.innerWidth, window.innerHeight);
            Effects.resize(window.innerWidth, window.innerHeight);
        });

        // Input
        Input.init();

        // HUD
        HUD.init();

        // Menu
        Menu.init();

        // Start animation loop
        requestAnimationFrame(animate);
    }

    function animate(timestamp) {
        requestAnimationFrame(animate);

        const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
        lastTime = timestamp;

        if (GAME.state === 'counting') {
            updateCountdown(dt);
        } else if (GAME.state === 'racing') {
            updateRacing(dt);
        } else if (GAME.state === 'tutorial') {
            updateRacing(dt);
            Tutorial.update(dt);
        } else if (GAME.state === 'finished') {
            // Still render but don't update physics
            Particles.update(dt);
        }

        // Always render
        if (GAME.scene && GAME.camera && GAME.renderer) {
            if (!Effects.render()) {
                GAME.renderer.render(GAME.scene, GAME.camera);
            }
        }
    }

    function startRace(isTutorial = false) {
        // Clear scene
        while (GAME.scene.children.length > 0) {
            GAME.scene.remove(GAME.scene.children[0]);
        }
        GAME.allCars = [];
        GAME.aiCars = [];

        const trackDef = GAME.trackDef || TRACK_DEFS[0];
        GAME.trackDef = trackDef;

        // Build track
        GAME.trackData = Track.buildTrack(trackDef, GAME.scene);

        // Build environment
        Environment.build(trackDef, GAME.trackData.waypoints, GAME.scene);

        // Post-processing
        GAME.composer = Effects.setupPostProcessing(GAME.renderer, GAME.scene, GAME.camera);

        // Environment map
        const envMap = Effects.createEnvironmentMap(GAME.scene);

        // Init particles
        Particles.init(GAME.scene);

        // Init items
        Items.init(GAME.trackData.itemBoxPositions, GAME.scene);

        // Create player car
        const playerColor = CAR_COLORS[GAME.selectedCar] || CAR_COLORS[0];
        GAME.playerCar = new GameCar(playerColor, 'Mikhail', true);
        if (envMap) GAME.playerCar.setEnvMap(envMap);
        GAME.scene.add(GAME.playerCar.mesh);
        GAME.allCars.push(GAME.playerCar);

        // Place player at start
        const startWP = GAME.trackData.waypoints[0];
        const nextWP = GAME.trackData.waypoints[1];
        const startAngle = Math.atan2(nextWP.x - startWP.x, nextWP.z - startWP.z);

        GAME.playerCar.x = startWP.x;
        GAME.playerCar.y = (startWP.y || 0) + 0.5;
        GAME.playerCar.z = startWP.z;
        GAME.playerCar.angle = startAngle;

        // Player 2 (if applicable)
        if (GAME.mode === '2p_coop' || GAME.mode === '2p_vs') {
            const p2Color = CAR_COLORS[(GAME.selectedCar + 1) % CAR_COLORS.length];
            GAME.player2Car = new GameCar(p2Color, 'Player 2', true);
            if (envMap) GAME.player2Car.setEnvMap(envMap);
            GAME.scene.add(GAME.player2Car.mesh);
            GAME.allCars.push(GAME.player2Car);

            GAME.player2Car.x = startWP.x + Math.cos(startAngle) * 3;
            GAME.player2Car.y = (startWP.y || 0) + 0.5;
            GAME.player2Car.z = startWP.z - Math.sin(startAngle) * 3;
            GAME.player2Car.angle = startAngle;
        }

        // AI cars
        const numAI = GAME.mode === '2p_vs' ? 2 : (GAME.mode === '2p_coop' ? 3 : 5);
        for (let i = 0; i < numAI; i++) {
            const driver = AI_DRIVERS[i % AI_DRIVERS.length];
            const aiColor = CAR_COLORS[driver.colorIdx] || CAR_COLORS[i + 1];
            const aiCar = new AICar(driver, aiColor);
            if (envMap) aiCar.setEnvMap(envMap);
            GAME.scene.add(aiCar.mesh);

            // Stagger start positions behind the player on the track
            const rowIdx = GAME.allCars.length; // 1-based row (player is 0)
            const gridSide = rowIdx % 2 === 0 ? -3 : 3;
            // Place behind start on the track by going backwards along waypoints
            const behindIdx = (GAME.trackData.waypoints.length - rowIdx * 2) % GAME.trackData.waypoints.length;
            const gpWP = GAME.trackData.waypoints[behindIdx];
            aiCar.x = gpWP.x + Math.cos(startAngle) * gridSide;
            aiCar.y = (gpWP.y || 0) + 0.5;
            aiCar.z = gpWP.z + Math.sin(startAngle) * gridSide;
            // Set checkpoint to match placement so they don't get instant lap
            aiCar.checkpoint = behindIdx;
            aiCar.angle = startAngle;

            GAME.allCars.push(aiCar);
            GAME.aiCars.push(aiCar);
        }

        // Camera setup
        Camera.reset();
        GAME.camera.position.set(
            GAME.playerCar.x - Math.sin(startAngle) * 20,
            (startWP.y || 0) + 10,
            GAME.playerCar.z - Math.cos(startAngle) * 20
        );
        GAME.camera.lookAt(GAME.playerCar.x, GAME.playerCar.y, GAME.playerCar.z);

        // Update renderer settings
        GAME.renderer.shadowMap.enabled = GAME.gfx.shadows;

        // Start countdown
        GAME.state = 'counting';
        GAME.raceTime = 0;
        GAME.turboStartTime = -1;
        GAME._aiFinishTime = null;
        finishOrder = [];
        countdownNum = 3;
        countdownTime = 0;
        Slipstream.resetTurboStart();

        const countdownOverlay = document.getElementById('countdown-overlay');
        const countdownEl = document.getElementById('countdown-num');
        const turboHint = document.getElementById('turbo-start-hint');
        countdownOverlay.classList.remove('hidden');
        countdownEl.textContent = '3';
        turboHint.classList.add('hidden');

        HUD.show();
        Audio.init();
        Audio.play('countdown', { volume: 0.5, num: 3 });

        if (isTutorial) {
            // Tutorial starts after countdown
            GAME._startTutorial = true;
        }
    }

    function updateCountdown(dt) {
        countdownTime += dt;

        const countdownEl = document.getElementById('countdown-num');
        const turboHint = document.getElementById('turbo-start-hint');
        const countdownOverlay = document.getElementById('countdown-overlay');

        if (countdownTime >= 1 && countdownNum === 3) {
            countdownNum = 2;
            countdownEl.textContent = '2';
            countdownEl.style.animation = 'none';
            void countdownEl.offsetWidth;
            countdownEl.style.animation = 'countPulse 1s ease-out';
            Audio.play('countdown', { volume: 0.5, num: 2 });
        }
        if (countdownTime >= 2 && countdownNum === 2) {
            countdownNum = 1;
            countdownEl.textContent = '1';
            countdownEl.style.animation = 'none';
            void countdownEl.offsetWidth;
            countdownEl.style.animation = 'countPulse 1s ease-out';
            turboHint.classList.remove('hidden');
            Audio.play('countdown', { volume: 0.5, num: 1 });
        }
        if (countdownTime >= 3 && countdownNum === 1) {
            countdownNum = 0;
            countdownEl.textContent = 'GO!';
            countdownEl.style.color = '#00ff88';
            countdownEl.style.animation = 'none';
            void countdownEl.offsetWidth;
            countdownEl.style.animation = 'countPulse 1s ease-out';
            Audio.play('go', { volume: 0.6 });

            goTimestamp = performance.now() / 1000;
            Slipstream.setGoTime(goTimestamp);

            // Check turbo start
            if (GAME.turboStartTime > 0 && GAME.playerCar) {
                Slipstream.checkTurboStart(GAME.playerCar, GAME.turboStartTime);
            }

            // AI turbo starts
            GAME.aiCars.forEach(ai => {
                const reactionTime = 0.05 + Math.random() * 0.3;
                ai.speed = 20 + Math.random() * 15;
            });
        }
        if (countdownTime >= 3.8) {
            countdownOverlay.classList.add('hidden');
            if (GAME._startTutorial) {
                GAME.state = 'tutorial';
                GAME._startTutorial = false;
                Tutorial.start();
            } else {
                GAME.state = 'racing';
            }
        }

        // Camera during countdown
        Camera.update(dt, GAME.camera, GAME.playerCar);
        GAME.renderer.render(GAME.scene, GAME.camera);
    }

    function updateRacing(dt) {
        GAME.raceTime += dt;

        // Player input
        const p1Input = Input.getP1Input();

        // Update player
        if (GAME.playerCar && !GAME.playerCar.finished) {
            if (p1Input.item && GAME.playerCar.heldItem) GAME.playerCar.activateItem();
            GAME.playerCar.update(dt, p1Input, GAME.trackData);
        }

        // Player 2
        if (GAME.player2Car && !GAME.player2Car.finished) {
            const p2Input = Input.getP2Input();
            if (p2Input.item && GAME.player2Car.heldItem) GAME.player2Car.activateItem();
            GAME.player2Car.update(dt, p2Input, GAME.trackData);
        }

        // AI
        GAME.aiCars.forEach(ai => {
            if (!ai.finished) ai.updateAI(dt, GAME.trackData);
        });

        // Magnet effect
        GAME.allCars.forEach(car => {
            if (car.magnetActive) {
                const leader = getLeader();
                if (leader && leader !== car) {
                    const dx = leader.x - car.x;
                    const dz = leader.z - car.z;
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    if (dist > 5) {
                        car.x += (dx / dist) * 30 * dt;
                        car.z += (dz / dist) * 30 * dt;
                    }
                }
            }
        });

        // Car-car collision
        for (let i = 0; i < GAME.allCars.length; i++) {
            for (let j = i + 1; j < GAME.allCars.length; j++) {
                const a = GAME.allCars[i];
                const b = GAME.allCars[j];
                const dx = b.x - a.x;
                const dz = b.z - a.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < 2.5 && dist > 0) {
                    const push = (2.5 - dist) / 2;
                    const nx = dx / dist;
                    const nz = dz / dist;
                    a.x -= nx * push;
                    a.z -= nz * push;
                    b.x += nx * push;
                    b.z += nz * push;

                    // Speed exchange
                    const avgSpeed = (a.speed + b.speed) / 2;
                    a.speed = a.speed * 0.9 + avgSpeed * 0.1;
                    b.speed = b.speed * 0.9 + avgSpeed * 0.1;
                }
            }
        }

        // Slipstream
        Slipstream.update(dt);

        // Items
        Items.update(dt, GAME.scene);

        // Particles
        Particles.update(dt);
        Particles.updateTireMarks(dt);

        // Environment
        Environment.update(dt);

        // Camera
        Camera.update(dt, GAME.camera, GAME.playerCar);

        // HUD
        HUD.update(dt);

        // Wind sound
        if (GAME.playerCar) {
            Audio.play('wind', { volume: 0.1, speed: GAME.playerCar.speed });
        }

        // Weather ambient
        if (GAME.trackDef && GAME.trackDef.weather === 'rain' && Math.random() > 0.95) {
            Audio.play('rain', { volume: 0.2 });
        }

        // Fun popups - lots of exciting messages for kids!
        if (GAME.playerCar) {
            const car = GAME.playerCar;
            const pick = arr => arr[Math.floor(Math.random() * arr.length)];

            // Drift messages
            if (car.drifting && car.driftCharge > 0.5 && Math.random() > 0.95) {
                HUD.showPopup(pick(FUN_MESSAGES.drift), '#ff66aa');
            }
            // Slipstream
            if (car.slipstreamActive && Math.random() > 0.95) {
                HUD.showPopup('DRAFTING!', '#00ccff');
            }
            // Air time
            if (car.airborne && Math.random() > 0.9) {
                HUD.showPopup(pick(FUN_MESSAGES.airtime), '#ffaa00');
            }
            // Nitro active
            if (car.nitroActive && Math.random() > 0.95) {
                HUD.showPopup(pick(FUN_MESSAGES.boost), '#00ffaa');
            }
            // First place
            const sorted = [...GAME.allCars].sort((a, b) => b.progress - a.progress);
            const pos = sorted.indexOf(car) + 1;
            if (pos === 1 && Math.random() > 0.98) {
                HUD.showPopup(pick(FUN_MESSAGES.firstPlace), '#ffd700');
            }
            // Speed milestone popups
            const spd = car.getSpeedKPH();
            if (spd > 400 && Math.random() > 0.99) {
                HUD.showPopup('SUPER FAST!', '#ff4444');
            }
            // Auto-use items for kids after holding for 2 seconds
            if (car.heldItem && car.isPlayer) {
                car._itemHoldTime = (car._itemHoldTime || 0) + dt;
                if (car._itemHoldTime > 2.5) {
                    car.activateItem();
                    car._itemHoldTime = 0;
                    HUD.showPopup(pick(FUN_MESSAGES.item), '#ffaa00');
                }
            } else {
                car._itemHoldTime = 0;
            }
        }

        // Check race finish
        checkFinish();

        // Update sun shadow to follow player
        if (GAME.scene.userData.sunLight && GAME.playerCar) {
            const sun = GAME.scene.userData.sunLight;
            sun.position.set(GAME.playerCar.x + 50, GAME.playerCar.y + 80, GAME.playerCar.z + 30);
            sun.target.position.set(GAME.playerCar.x, GAME.playerCar.y, GAME.playerCar.z);
            sun.target.updateMatrixWorld();
        }
    }

    function getLeader() {
        if (!GAME.allCars.length) return null;
        return GAME.allCars.reduce((best, car) => car.progress > best.progress ? car : best, GAME.allCars[0]);
    }

    let finishOrder = []; // Track the order cars cross the finish line

    function checkFinish() {
        // Track finish order for each car as they complete
        GAME.allCars.forEach(car => {
            if (car.finished && !finishOrder.includes(car)) {
                finishOrder.push(car);
                car.finishPosition = finishOrder.length;
                if (car.isPlayer) {
                    Audio.play('lap', { volume: 0.5 });
                }
            }
        });

        // Race ends when player finishes
        if (GAME.playerCar && GAME.playerCar.finished && GAME.state === 'racing') {
            finishRace();
            return;
        }
        if (GAME.playerCar && GAME.playerCar.finished && GAME.state === 'tutorial') {
            Tutorial.stop();
            finishRace();
            return;
        }

        // Also end race 5 seconds after all AI finish (player DNF)
        const allAIFinished = GAME.aiCars.every(c => c.finished);
        if (allAIFinished && !GAME.playerCar.finished) {
            if (!GAME._aiFinishTime) GAME._aiFinishTime = GAME.raceTime;
            if (GAME.raceTime - GAME._aiFinishTime > 5) {
                // Player didn't finish - mark as last place
                if (!finishOrder.includes(GAME.playerCar)) {
                    finishOrder.push(GAME.playerCar);
                    GAME.playerCar.finishPosition = finishOrder.length;
                }
                finishRace();
                return;
            }
        }

        // Timeout after 5 minutes
        if (GAME.raceTime > 300) {
            GAME.allCars.forEach(car => {
                if (!finishOrder.includes(car)) {
                    finishOrder.push(car);
                    car.finishPosition = finishOrder.length;
                }
            });
            if (GAME.state === 'racing' || GAME.state === 'tutorial') finishRace();
        }
    }

    function finishRace() {
        // Sort by finish order (cars that finished first are ranked higher)
        // Cars that didn't finish are ranked by progress
        const finished = finishOrder.slice();
        const unfinished = GAME.allCars.filter(c => !finished.includes(c));
        unfinished.sort((a, b) => b.progress - a.progress);
        const sorted = [...finished, ...unfinished];

        const results = sorted.map((car, i) => ({
            name: car.name,
            totalTime: car.totalTime,
            isPlayer: car === GAME.playerCar || car === GAME.player2Car,
            position: i + 1
        }));

        const playerPos = sorted.indexOf(GAME.playerCar) + 1;
        Celebration.showResults(playerPos, results);
    }

    // Start on load
    window.addEventListener('load', init);

    return { startRace };
})();
