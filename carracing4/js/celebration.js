// ===== CIRCUIT RACING 4 - CELEBRATION =====

const Celebration = (() => {

    function showResults(playerPosition, allResults) {
        GAME.state = 'finished';
        HUD.hide();

        const overlay = document.getElementById('result-overlay');
        const titleEl = document.getElementById('result-title');
        const listEl = document.getElementById('result-list');
        const unlockEl = document.getElementById('result-unlock');
        const rewardsEl = document.getElementById('result-rewards');

        // Title - fun encouraging messages!
        const pick = arr => arr[Math.floor(Math.random() * arr.length)];
        if (playerPosition === 1) {
            titleEl.textContent = pick(FUN_MESSAGES.win);
            titleEl.style.background = 'linear-gradient(180deg, #ffd700, #ff8800)';
        } else if (playerPosition <= 3) {
            titleEl.textContent = 'AWESOME RACE!';
            titleEl.style.background = 'linear-gradient(180deg, #88bbff, #4466aa)';
        } else {
            titleEl.textContent = pick(FUN_MESSAGES.lose);
            titleEl.style.background = 'linear-gradient(180deg, #ff8866, #cc6644)';
        }
        titleEl.style.webkitBackgroundClip = 'text';
        titleEl.style.webkitTextFillColor = 'transparent';

        // Results list
        listEl.innerHTML = '';
        allResults.forEach((r, i) => {
            const row = document.createElement('div');
            row.className = 'result-row' + (r.isPlayer ? ' player' : '');

            const pos = document.createElement('span');
            pos.className = 'result-pos';
            if (i === 0) pos.classList.add('gold');
            else if (i === 1) pos.classList.add('silver');
            else if (i === 2) pos.classList.add('bronze');
            pos.textContent = `${i + 1}.`;

            const name = document.createElement('span');
            name.className = 'result-name';
            name.textContent = r.name;

            const time = document.createElement('span');
            time.className = 'result-time';
            time.textContent = HUD.formatTime(r.totalTime);

            row.appendChild(pos);
            row.appendChild(name);
            row.appendChild(time);
            listEl.appendChild(row);
        });

        // Award career result
        const trackId = GAME.trackDef ? GAME.trackDef.id : 0;
        const playerTime = GAME.playerCar ? GAME.playerCar.totalTime : 0;
        const result = Career.awardRaceResult(trackId, playerPosition, playerTime);

        // Rewards
        const trophyEl = document.getElementById('reward-trophy');
        const coinsEl = document.getElementById('reward-coins');
        if (trophyEl) {
            trophyEl.textContent = result.trophy ?
                `${result.trophy === 'gold' ? '\u{1F3C6}' : result.trophy === 'silver' ? '\u{1F948}' : '\u{1F949}'} ${result.trophy.toUpperCase()} TROPHY` : '';
        }
        if (coinsEl) coinsEl.textContent = `+${result.coins} COINS`;

        // Unlocks
        if (result.unlocks && result.unlocks.length > 0) {
            unlockEl.classList.remove('hidden');
            unlockEl.innerHTML = result.unlocks.map(u => {
                if (u.type === 'track') return `${u.icon} NEW TRACK: ${u.name} UNLOCKED!`;
                if (u.id === 'bugatti') return '🏎️ BUGATTI UNLOCKED! 570 KPH SUPERCAR! 🏎️';
                return `NEW CAR: ${u.name} UNLOCKED!`;
            }).join('<br>');
            Audio.play('unlock', { volume: 0.6 });
            // Extra celebration for Bugatti
            if (result.unlocks.some(u => u.id === 'bugatti')) {
                Audio.play('victory', { volume: 0.7 });
                spawnFireworks();
                spawnFireworks();
                spawnConfetti();
                spawnConfetti();
                spawnConfetti();
            }
        } else {
            unlockEl.classList.add('hidden');
        }

        overlay.classList.remove('hidden');

        // Victory effects - EXTRA celebration for kids!
        if (playerPosition === 1) {
            Audio.play('victory', { volume: 0.6 });
            spawnConfetti();
            spawnConfetti(); // Double confetti!
            spawnFireworks();
            // Keep spawning confetti for celebration
            let celebCount = 0;
            const celebInterval = setInterval(() => {
                spawnConfetti();
                celebCount++;
                if (celebCount > 5) clearInterval(celebInterval);
            }, 800);
        } else if (playerPosition <= 3) {
            Audio.play('lap', { volume: 0.5 });
            spawnConfetti();
            spawnFireworks();
        } else {
            // Even when losing, play encouraging sound
            Audio.play('pickup', { volume: 0.4 });
        }
    }

    function spawnConfetti() {
        if (!GAME.playerCar) return;
        const x = GAME.playerCar.x;
        const y = GAME.playerCar.y + 3;
        const z = GAME.playerCar.z;

        for (let i = 0; i < 40; i++) {
            Particles.emit(x, y, z, 'confetti', 1);
        }
    }

    function spawnFireworks() {
        if (!GAME.playerCar) return;
        let count = 0;
        const interval = setInterval(() => {
            if (count >= 5) { clearInterval(interval); return; }
            const x = GAME.playerCar.x + (Math.random() - 0.5) * 30;
            const y = GAME.playerCar.y + 10 + Math.random() * 15;
            const z = GAME.playerCar.z + (Math.random() - 0.5) * 30;
            Particles.emit(x, y, z, 'firework', 25);
            count++;
        }, 600);
    }

    function hide() {
        document.getElementById('result-overlay').classList.add('hidden');
    }

    return { showResults, hide };
})();
