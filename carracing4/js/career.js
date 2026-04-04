// ===== CIRCUIT RACING 4 - CAREER =====

const Career = (() => {
    const STORAGE_KEY = 'cr4_career';

    const defaultState = {
        unlockedTracks: [0],
        unlockedCars: ['crimson', 'ocean', 'forest', 'gold', 'purple', 'orange', 'white', 'black'],
        trophies: {},      // trackId -> 'gold'|'silver'|'bronze'
        totalRaces: 0,
        totalWins: 0,
        bestTimes: {},     // trackId -> time
        tutorialDone: false,
        coins: 0
    };

    let state = null;

    function load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                state = { ...defaultState, ...JSON.parse(saved) };
            } else {
                state = { ...defaultState };
            }
        } catch (e) {
            state = { ...defaultState };
        }
        return state;
    }

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {}
    }

    function getState() {
        if (!state) load();
        return state;
    }

    function isTrackUnlocked(trackId) {
        const s = getState();
        return s.unlockedTracks.includes(trackId);
    }

    function isCarUnlocked(carId) {
        const s = getState();
        return s.unlockedCars.includes(carId);
    }

    function awardRaceResult(trackId, position, totalTime) {
        const s = getState();
        s.totalRaces++;

        // Coins
        const coinRewards = { 1: 100, 2: 60, 3: 30 };
        const coins = coinRewards[position] || 10;
        s.coins += coins;

        // Trophy
        let trophy = null;
        if (position === 1) trophy = 'gold';
        else if (position === 2) trophy = 'silver';
        else if (position === 3) trophy = 'bronze';

        if (trophy) {
            const existing = s.trophies[trackId];
            const rank = { gold: 3, silver: 2, bronze: 1 };
            if (!existing || rank[trophy] > (rank[existing] || 0)) {
                s.trophies[trackId] = trophy;
            }
        }

        if (position === 1) s.totalWins++;

        // Best time
        if (!s.bestTimes[trackId] || totalTime < s.bestTimes[trackId]) {
            s.bestTimes[trackId] = totalTime;
        }

        // Check unlocks
        const unlocks = checkUnlocks(s);

        save();
        return { coins, trophy, unlocks };
    }

    function checkUnlocks(s) {
        const unlocks = [];

        // Track unlocks
        TRACK_DEFS.forEach(track => {
            if (s.unlockedTracks.includes(track.id)) return;
            const req = track.unlockRequires;
            if (!req) return;

            let unlocked = false;
            switch (req.type) {
                case 'top3':
                    unlocked = s.trophies[req.trackId] != null;
                    break;
                case 'wins':
                    unlocked = s.totalWins >= req.count;
                    break;
                case 'winAll':
                    unlocked = TRACK_DEFS.filter(t => t.id < track.id).every(t => s.trophies[t.id] === 'gold');
                    break;
            }

            if (unlocked) {
                s.unlockedTracks.push(track.id);
                unlocks.push({ type: 'track', name: track.name, icon: track.icon });
            }
        });

        // Car unlocks
        const trophyCount = Object.keys(s.trophies).length;
        CAR_COLORS.forEach(car => {
            if (s.unlockedCars.includes(car.id)) return;
            if (!car.unlock) return;

            let unlocked = false;
            switch (car.unlock.type) {
                case 'trophies':
                    unlocked = trophyCount >= car.unlock.count;
                    break;
                case 'winAll':
                    unlocked = TRACK_DEFS.every(t => s.trophies[t.id] === 'gold' || s.trophies[t.id] === 'silver' || s.trophies[t.id] === 'bronze') && s.totalWins >= TRACK_DEFS.length;
                    break;
                case 'goldAll':
                    unlocked = TRACK_DEFS.every(t => s.trophies[t.id] === 'gold');
                    break;
            }

            if (unlocked) {
                s.unlockedCars.push(car.id);
                unlocks.push({ type: 'car', name: car.name, id: car.id });
            }
        });

        return unlocks;
    }

    function markTutorialDone() {
        const s = getState();
        s.tutorialDone = true;
        save();
    }

    function getTrophyEmoji(trackId) {
        const s = getState();
        const t = s.trophies[trackId];
        if (t === 'gold') return '\u{1F3C6}';
        if (t === 'silver') return '\u{1F948}';
        if (t === 'bronze') return '\u{1F949}';
        return '';
    }

    function reset() {
        state = { ...defaultState };
        save();
    }

    return { load, save, getState, isTrackUnlocked, isCarUnlocked, awardRaceResult, markTutorialDone, getTrophyEmoji, reset };
})();
