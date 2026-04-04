// ============================================================
// CIRCUIT RACING 1 — Procedural Audio System (Web Audio API)
// ============================================================

let audioCtx = null;
let masterGain = null;
let soundEnabled = true;
let engineOsc = null;
let engineGain = null;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
}

function resumeAudio() {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    if (masterGain) masterGain.gain.value = soundEnabled ? 0.3 : 0;
    return soundEnabled;
}

function playTone(freq, duration, type, vol, detune) {
    if (!audioCtx || !soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;
    gain.gain.value = vol || 0.15;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration, vol, filterFreq) {
    if (!audioCtx || !soundEnabled) return;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq || 2000;
    filter.Q.value = 1.5;
    const gain = audioCtx.createGain();
    gain.gain.value = vol || 0.1;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    src.start();
}

// --- Sound Effects ---

function playCountdownBeep(isGo) {
    if (isGo) {
        playTone(880, 0.4, 'square', 0.12);
        setTimeout(() => playTone(1100, 0.3, 'square', 0.1), 50);
    } else {
        playTone(440, 0.25, 'square', 0.1);
    }
}

function playItemPickup() {
    playTone(600, 0.08, 'sine', 0.12);
    setTimeout(() => playTone(800, 0.08, 'sine', 0.12), 60);
    setTimeout(() => playTone(1000, 0.1, 'sine', 0.15), 120);
}

function playBoostActivate() {
    if (!audioCtx || !soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 200;
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
    gain.gain.value = 0.08;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
    playNoise(0.3, 0.06, 3000);
}

function playMissileLaunch() {
    if (!audioCtx || !soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 600;
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.5);
    gain.gain.value = 0.1;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
    playNoise(0.2, 0.08, 1500);
}

function playShieldActivate() {
    playTone(1200, 0.15, 'sine', 0.1);
    setTimeout(() => playTone(1600, 0.2, 'sine', 0.08), 80);
}

function playCollision() {
    playNoise(0.15, 0.12, 800);
    playTone(80, 0.2, 'sine', 0.1);
}

function playDriftSound() {
    playNoise(0.12, 0.04, 4000);
}

function playHorn() {
    if (!audioCtx || !soundEnabled) return;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc1.type = 'square'; osc1.frequency.value = 340;
    osc2.type = 'square'; osc2.frequency.value = 420;
    gain.gain.value = 0.1;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc1.connect(gain); osc2.connect(gain);
    gain.connect(masterGain);
    osc1.start(); osc2.start();
    osc1.stop(audioCtx.currentTime + 0.4);
    osc2.stop(audioCtx.currentTime + 0.4);
}

function playLightning() {
    playNoise(0.4, 0.15, 1200);
    playTone(100, 0.3, 'square', 0.1);
    setTimeout(() => playNoise(0.2, 0.1, 2000), 100);
}

function playStarPowerUp() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.15, 'sine', 0.1), i * 80));
}

function playLapComplete() {
    playTone(660, 0.1, 'square', 0.08);
    setTimeout(() => playTone(880, 0.15, 'square', 0.08), 100);
}

function playVictoryFanfare() {
    const melody = [523, 659, 784, 880, 1047];
    melody.forEach((n, i) => setTimeout(() => playTone(n, 0.25, 'sine', 0.12, i * 5), i * 150));
    setTimeout(() => {
        playTone(1047, 0.5, 'sine', 0.15);
        playTone(784, 0.5, 'sine', 0.1);
        playTone(523, 0.5, 'sine', 0.08);
    }, melody.length * 150);
}

function playDriftBoostRelease() {
    playTone(400, 0.15, 'sawtooth', 0.06);
    setTimeout(() => playTone(600, 0.15, 'sawtooth', 0.06), 50);
}

function playBananaSlip() {
    if (!audioCtx || !soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 800;
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.3);
    gain.gain.value = 0.1;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain); gain.connect(masterGain);
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
}

function playMagnet() {
    playTone(300, 0.2, 'triangle', 0.08);
    setTimeout(() => playTone(450, 0.2, 'triangle', 0.08), 100);
}

// Engine sound (continuous)
function startEngineSound() {
    if (!audioCtx || !soundEnabled || engineOsc) return;
    engineOsc = audioCtx.createOscillator();
    engineGain = audioCtx.createGain();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 60;
    engineGain.gain.value = 0;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    engineOsc.connect(filter);
    filter.connect(engineGain);
    engineGain.connect(masterGain);
    engineOsc.start();
}

function updateEngineSound(speed) {
    if (!engineOsc || !soundEnabled) return;
    const freq = 60 + Math.abs(speed) * 1.8;
    const vol = Math.min(0.04, Math.abs(speed) * 0.0004);
    engineOsc.frequency.value = freq;
    engineGain.gain.value = vol;
}

function stopEngineSound() {
    if (engineOsc) {
        engineOsc.stop();
        engineOsc = null;
        engineGain = null;
    }
}
