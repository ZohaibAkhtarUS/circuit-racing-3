// ===== CIRCUIT RACING 4 - MENU =====

const Menu = (() => {
    let selectedCareerTrack = -1;

    function init() {
        Career.load();

        // Tab switching
        document.querySelectorAll('.menu-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
                Audio.play('click', { volume: 0.3 });
            });
        });

        // Build track selection
        buildTrackSelect();
        buildCarSelect();
        buildCareerMap();

        // Button groups
        document.querySelectorAll('.btn-group').forEach(group => {
            group.querySelectorAll('.sel-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    group.querySelectorAll('.sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    Audio.play('click', { volume: 0.3 });

                    // Apply setting
                    if (group.id === 'difficulty-select') GAME.difficulty = btn.dataset.val;
                    if (group.id === 'mode-select') GAME.mode = btn.dataset.val;
                    if (group.id === 'laps-select') GAME.totalLaps = parseInt(btn.dataset.val);
                    if (group.id === 'gfx-select') {
                        GAME.gfxPreset = btn.dataset.val;
                        GAME.gfx = GFX_PRESETS[btn.dataset.val];
                    }
                    if (group.id === 'sound-toggle') {
                        GAME.soundEnabled = btn.dataset.val === 'on';
                        Audio.setMuted(!GAME.soundEnabled);
                    }
                    if (group.id === 'shake-toggle') GAME.shakeEnabled = btn.dataset.val === 'on';
                });
            });
        });

        // Start race button
        document.getElementById('btn-start-race').addEventListener('click', () => {
            Audio.init();
            Audio.play('click', { volume: 0.5 });
            startRace(GAME.selectedTrack);
        });

        // Career race button
        document.getElementById('btn-career-race').addEventListener('click', () => {
            if (selectedCareerTrack >= 0) {
                Audio.init();
                startRace(selectedCareerTrack);
            }
        });

        // Tutorial button
        document.getElementById('btn-tutorial').addEventListener('click', () => {
            Audio.init();
            GAME.selectedTrack = 0;
            GAME.difficulty = 'easy';
            startRace(0, true);
        });

        // Pause buttons
        document.getElementById('btn-resume').addEventListener('click', () => Input.togglePause());
        document.getElementById('btn-restart').addEventListener('click', () => {
            document.getElementById('pause-overlay').classList.add('hidden');
            startRace(GAME.trackDef ? GAME.trackDef.id : 0);
        });
        document.getElementById('btn-quit').addEventListener('click', () => {
            document.getElementById('pause-overlay').classList.add('hidden');
            showMenu();
        });

        // Result buttons
        document.getElementById('btn-next-race').addEventListener('click', () => {
            Celebration.hide();
            const nextTrack = getNextUnlockedTrack();
            if (nextTrack >= 0) startRace(nextTrack);
            else showMenu();
        });
        document.getElementById('btn-back-menu').addEventListener('click', () => {
            Celebration.hide();
            showMenu();
        });
    }

    function buildTrackSelect() {
        const container = document.getElementById('track-select');
        container.innerHTML = '';

        TRACK_DEFS.forEach((track, i) => {
            const card = document.createElement('div');
            card.className = 'track-card';
            const unlocked = Career.isTrackUnlocked(track.id);

            if (!unlocked) card.classList.add('locked');
            if (i === GAME.selectedTrack && unlocked) card.classList.add('selected');

            // Preview color bar
            const preview = document.createElement('div');
            preview.className = 'track-preview';
            preview.style.background = `linear-gradient(135deg, ${track.skyColors[0]}, ${track.skyColors[1]}, ${track.skyColors[2]})`;
            card.appendChild(preview);

            const nameEl = document.createElement('div');
            nameEl.className = 'track-name';
            nameEl.textContent = track.name;
            card.appendChild(nameEl);

            const themeEl = document.createElement('div');
            themeEl.className = 'track-theme';
            themeEl.textContent = track.icon + ' ' + track.theme;
            card.appendChild(themeEl);

            // Trophy
            const trophyEmoji = Career.getTrophyEmoji(track.id);
            if (trophyEmoji) {
                const trophy = document.createElement('div');
                trophy.className = 'track-trophy';
                trophy.textContent = trophyEmoji;
                card.appendChild(trophy);
            }

            if (unlocked) {
                card.addEventListener('click', () => {
                    container.querySelectorAll('.track-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    GAME.selectedTrack = i;
                    Audio.play('click', { volume: 0.3 });
                });
            }

            container.appendChild(card);
        });
    }

    function buildCarSelect() {
        const container = document.getElementById('car-select');
        container.innerHTML = '';

        CAR_COLORS.forEach((car, i) => {
            const card = document.createElement('div');
            card.className = 'car-card';
            const unlocked = Career.isCarUnlocked(car.id);

            if (!unlocked) card.classList.add('locked');
            if (i === GAME.selectedCar && unlocked) card.classList.add('selected');

            const swatch = document.createElement('div');
            swatch.className = 'car-swatch';
            swatch.style.background = '#' + car.color.toString(16).padStart(6, '0');
            card.appendChild(swatch);

            const name = document.createElement('div');
            name.className = 'car-name';
            name.textContent = car.name;
            card.appendChild(name);

            if (unlocked) {
                card.addEventListener('click', () => {
                    container.querySelectorAll('.car-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    GAME.selectedCar = i;
                    Audio.play('click', { volume: 0.3 });
                });
            }

            container.appendChild(card);
        });
    }

    function buildCareerMap() {
        const container = document.getElementById('career-map');
        container.innerHTML = '';
        selectedCareerTrack = -1;

        const careerState = Career.getState();

        TRACK_DEFS.forEach((track, i) => {
            if (i > 0) {
                const connector = document.createElement('div');
                connector.className = 'career-connector';
                container.appendChild(connector);
            }

            const node = document.createElement('div');
            node.className = 'career-node';
            const unlocked = careerState.unlockedTracks.includes(track.id);
            const trophy = careerState.trophies[track.id];

            if (!unlocked) node.classList.add('locked');
            if (trophy) node.classList.add('completed');

            const icon = document.createElement('div');
            icon.className = 'career-node-icon';
            icon.style.background = `linear-gradient(135deg, ${track.skyColors[0]}, ${track.skyColors[2]})`;
            icon.textContent = track.icon;
            node.appendChild(icon);

            const name = document.createElement('div');
            name.className = 'career-node-name';
            name.textContent = track.name;
            node.appendChild(name);

            if (trophy) {
                const trophyEl = document.createElement('div');
                trophyEl.className = 'career-node-trophy';
                trophyEl.textContent = Career.getTrophyEmoji(track.id);
                node.appendChild(trophyEl);
            }

            if (unlocked) {
                node.addEventListener('click', () => {
                    container.querySelectorAll('.career-node').forEach(n => n.classList.remove('selected'));
                    node.classList.add('selected');
                    selectedCareerTrack = track.id;
                    document.getElementById('btn-career-race').disabled = false;
                    document.getElementById('btn-career-race').textContent = `RACE: ${track.name}`;
                    Audio.play('click', { volume: 0.3 });
                });
            }

            container.appendChild(node);
        });

        // Update stats
        document.getElementById('career-coins').textContent = careerState.coins;
        document.getElementById('career-wins').textContent = careerState.totalWins;
        document.getElementById('career-trophies-count').textContent = Object.keys(careerState.trophies).length;
    }

    function startRace(trackId, isTutorial = false) {
        document.getElementById('menu-overlay').classList.remove('active');
        document.getElementById('menu-overlay').classList.add('hidden');

        GAME.trackDef = TRACK_DEFS[trackId];
        Game.startRace(isTutorial);
    }

    function showMenu() {
        GAME.state = 'menu';
        HUD.hide();
        buildTrackSelect();
        buildCarSelect();
        buildCareerMap();
        document.getElementById('menu-overlay').classList.remove('hidden');
        document.getElementById('menu-overlay').classList.add('active');
    }

    function getNextUnlockedTrack() {
        const currentId = GAME.trackDef ? GAME.trackDef.id : 0;
        for (let i = currentId + 1; i < TRACK_DEFS.length; i++) {
            if (Career.isTrackUnlocked(i)) return i;
        }
        return currentId;
    }

    return { init, showMenu, buildTrackSelect, buildCarSelect, buildCareerMap };
})();
