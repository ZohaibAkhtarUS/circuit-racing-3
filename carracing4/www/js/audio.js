// ===== CIRCUIT RACING 4 - AUDIO =====

const Audio = (() => {
    let ctx = null;
    let master = null;
    let muted = false;

    function init() {
        if (ctx) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.2;
        master.connect(ctx.destination);
    }

    function resume() {
        if (ctx && ctx.state === 'suspended') ctx.resume();
    }

    function setMuted(m) { muted = m; master && (master.gain.value = m ? 0 : 0.2); }

    function play(type, opts = {}) {
        if (!ctx || muted) return;
        const t = ctx.currentTime;
        const vol = opts.volume || 0.5;

        switch (type) {
            case 'engine': return playEngine(t, vol, opts.pitch || 1);
            case 'drift': return playDrift(t, vol);
            case 'boost': return playBoost(t, vol);
            case 'nitro': return playBoost(t, vol * 1.2);
            case 'missile': return playMissile(t, vol);
            case 'hit': return playHit(t, vol);
            case 'horn': return playHorn(t, vol);
            case 'pickup': return playPickup(t, vol);
            case 'lap': return playLap(t, vol);
            case 'countdown': return playCountdown(t, vol, opts.num);
            case 'go': return playGo(t, vol);
            case 'victory': return playVictory(t, vol);
            case 'unlock': return playUnlock(t, vol);
            case 'turbostart': return playTurboStart(t, vol);
            case 'lightning': return playLightning(t, vol);
            case 'star': return playStar(t, vol);
            case 'rain': return playRain(t, vol);
            case 'wind': return playWind(t, vol, opts.speed || 0);
            case 'slipstream': return playSlipstream(t, vol);
            case 'click': return playClick(t, vol);
        }
    }

    function osc(type, freq, dur, vol, startTime) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(vol, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
        o.connect(g);
        g.connect(master);
        o.start(startTime);
        o.stop(startTime + dur);
        return o;
    }

    function noise(dur, vol, startTime, filterFreq = 4000) {
        const bufferSize = ctx.sampleRate * dur;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const flt = ctx.createBiquadFilter();
        flt.type = 'bandpass';
        flt.frequency.value = filterFreq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
        src.connect(flt);
        flt.connect(g);
        g.connect(master);
        src.start(startTime);
        return src;
    }

    function playEngine(t, vol, pitch) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const flt = ctx.createBiquadFilter();
        o.type = 'sawtooth';
        o.frequency.value = 60 + pitch * 180;
        flt.type = 'lowpass';
        flt.frequency.value = 300 + pitch * 600;
        g.gain.value = vol * 0.15;
        o.connect(flt);
        flt.connect(g);
        g.connect(master);
        o.start(t);
        o.stop(t + 0.05);
    }

    function playDrift(t, vol) {
        noise(0.3, vol * 0.2, t, 4000);
    }

    function playBoost(t, vol) {
        osc('sawtooth', 200, 0.4, vol * 0.3, t);
        osc('sawtooth', 400, 0.3, vol * 0.15, t + 0.05);
        noise(0.3, vol * 0.2, t, 3000);
    }

    function playMissile(t, vol) {
        // Gentle whoosh instead of scary sweep
        osc('sine', 400, 0.3, vol * 0.15, t);
        osc('sine', 300, 0.2, vol * 0.1, t + 0.1);
    }

    function playHit(t, vol) {
        // Soft bonk instead of harsh noise
        osc('sine', 200, 0.15, vol * 0.15, t);
        osc('sine', 150, 0.1, vol * 0.1, t + 0.05);
    }

    function playHorn(t, vol) {
        // Friendly beep beep
        osc('sine', 440, 0.15, vol * 0.1, t);
        osc('sine', 520, 0.15, vol * 0.08, t + 0.12);
    }

    function playPickup(t, vol) {
        osc('sine', 440, 0.1, vol * 0.2, t);
        osc('sine', 660, 0.1, vol * 0.2, t + 0.08);
        osc('sine', 880, 0.15, vol * 0.2, t + 0.16);
    }

    function playLap(t, vol) {
        osc('sine', 660, 0.15, vol * 0.3, t);
        osc('sine', 880, 0.2, vol * 0.3, t + 0.12);
    }

    function playCountdown(t, vol, num) {
        const freq = num === 0 ? 880 : 440;
        osc('sine', freq, 0.2, vol * 0.4, t);
    }

    function playGo(t, vol) {
        osc('sine', 660, 0.12, vol * 0.4, t);
        osc('sine', 880, 0.12, vol * 0.4, t + 0.1);
        osc('sine', 1100, 0.2, vol * 0.5, t + 0.2);
    }

    function playVictory(t, vol) {
        const notes = [523, 659, 784, 1047, 784, 1047];
        notes.forEach((n, i) => osc('sine', n, 0.25, vol * 0.3, t + i * 0.18));
    }

    function playUnlock(t, vol) {
        const notes = [440, 554, 659, 880, 1100];
        notes.forEach((n, i) => {
            osc('sine', n, 0.3, vol * 0.25, t + i * 0.12);
            osc('triangle', n * 2, 0.2, vol * 0.1, t + i * 0.12);
        });
    }

    function playTurboStart(t, vol) {
        osc('sawtooth', 150, 0.1, vol * 0.3, t);
        osc('sawtooth', 300, 0.1, vol * 0.3, t + 0.05);
        osc('sawtooth', 600, 0.15, vol * 0.4, t + 0.1);
        noise(0.2, vol * 0.3, t + 0.1, 5000);
    }

    function playLightning(t, vol) {
        // Gentle zap instead of scary thunder
        osc('sine', 500, 0.2, vol * 0.15, t);
        osc('sine', 400, 0.15, vol * 0.1, t + 0.05);
        osc('sine', 300, 0.1, vol * 0.08, t + 0.1);
    }

    function playStar(t, vol) {
        [660, 784, 880, 1047].forEach((n, i) => osc('sine', n, 0.2, vol * 0.25, t + i * 0.08));
    }

    function playRain(t, vol) {
        noise(2, vol * 0.08, t, 6000);
    }

    function playWind(t, vol, speed) {
        noise(0.1, vol * 0.05 * Math.min(speed / 150, 1), t, 800 + speed * 4);
    }

    function playSlipstream(t, vol) {
        noise(0.15, vol * 0.15, t, 1200);
        osc('sine', 200, 0.15, vol * 0.1, t);
    }

    function playClick(t, vol) {
        osc('sine', 800, 0.05, vol * 0.2, t);
    }

    return { init, resume, play, setMuted };
})();
