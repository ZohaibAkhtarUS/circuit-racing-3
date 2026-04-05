// ============================================================
// MIGHTY MIKHAIL - Audio System (Web Audio API)
// ============================================================

let audioCtx = null;
let audioInitialized = false;

function initAudio() {
    if (audioInitialized) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioInitialized = true;
}

function osc(type, freq, dur, vol, startTime) {
    if (!audioCtx) return;
    const t = startTime || audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t);
    o.stop(t + dur);
}

function noise(dur, vol, startTime) {
    if (!audioCtx) return;
    const t = startTime || audioCtx.currentTime;
    const bufSize = audioCtx.sampleRate * dur;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(vol || 0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(g);
    g.connect(audioCtx.destination);
    src.start(t);
    src.stop(t + dur);
}

function sweep(type, freqStart, freqEnd, dur, vol) {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freqStart, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t + dur);
    g.gain.setValueAtTime(vol || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t);
    o.stop(t + dur);
}

function playSound(type) {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    switch (type) {
        case 'laser':
            sweep('sine', 1000, 200, 0.08, 0.12);
            break;
        case 'booster':
            noise(0.15, 0.06);
            osc('sawtooth', 120, 0.15, 0.04);
            break;
        case 'fart':
            sweep('sawtooth', 80, 40, 0.3, 0.15);
            noise(0.2, 0.08);
            break;
        case 'poop_jingle':
            osc('sine', 523, 0.15, 0.1, t);
            osc('sine', 440, 0.15, 0.1, t + 0.15);
            osc('sine', 349, 0.15, 0.1, t + 0.3);
            osc('sine', 294, 0.25, 0.1, t + 0.45);
            break;
        case 'cry':
            sweep('triangle', 600, 300, 0.4, 0.12);
            break;
        case 'snore':
            sweep('sine', 100, 200, 0.5, 0.06);
            break;
        case 'shield':
            osc('sine', 800, 0.3, 0.08);
            osc('sine', 1200, 0.3, 0.06);
            break;
        case 'freeze':
            osc('sine', 2000, 0.15, 0.08, t);
            osc('sine', 2500, 0.15, 0.06, t + 0.05);
            osc('sine', 3000, 0.15, 0.05, t + 0.1);
            break;
        case 'sonic_boom':
            noise(0.2, 0.2);
            sweep('sine', 200, 50, 0.3, 0.15);
            break;
        case 'coin':
            osc('sine', 523, 0.08, 0.1, t);
            osc('sine', 659, 0.08, 0.1, t + 0.08);
            osc('sine', 784, 0.08, 0.1, t + 0.16);
            osc('sine', 1047, 0.15, 0.1, t + 0.24);
            break;
        case 'villager_help':
            osc('sine', 400, 0.1, 0.08, t);
            osc('sine', 500, 0.1, 0.08, t + 0.1);
            osc('sine', 600, 0.15, 0.08, t + 0.2);
            break;
        case 'enemy_hit':
            sweep('square', 400, 100, 0.08, 0.1);
            break;
        case 'enemy_die':
            noise(0.15, 0.12);
            sweep('sawtooth', 300, 50, 0.2, 0.1);
            break;
        case 'level_complete':
            osc('sine', 523, 0.15, 0.1, t);
            osc('sine', 659, 0.15, 0.1, t + 0.15);
            osc('sine', 784, 0.15, 0.1, t + 0.3);
            osc('sine', 1047, 0.3, 0.12, t + 0.45);
            break;
        case 'baby':
            sweep('sine', 600, 900, 0.2, 0.08);
            break;
        case 'diaper':
            noise(0.1, 0.08);
            osc('sine', 200, 0.15, 0.06);
            break;
        case 'powerup':
            osc('sine', 400, 0.1, 0.1, t);
            osc('sine', 600, 0.1, 0.1, t + 0.1);
            osc('sine', 800, 0.1, 0.1, t + 0.2);
            osc('sine', 1200, 0.2, 0.12, t + 0.3);
            break;
        case 'select':
            osc('sine', 600, 0.08, 0.08);
            break;
        case 'hurt':
            sweep('square', 300, 100, 0.12, 0.12);
            noise(0.08, 0.06);
            break;
        case 'food':
            osc('sine', 500, 0.1, 0.08, t);
            osc('sine', 700, 0.15, 0.08, t + 0.1);
            break;
        case 'defeat':
            sweep('triangle', 400, 100, 0.5, 0.12);
            osc('sine', 200, 0.3, 0.08, t + 0.3);
            break;
    }
}
