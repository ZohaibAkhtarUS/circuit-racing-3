// ===== CIRCUIT RACING 4 - INPUT =====

const Input = (() => {
    const keys = {};
    const touches = { left: false, right: false, brake: false, nitro: false, item: false, drift: false };
    let tiltEnabled = false;
    let tiltAngle = 0;

    function init() {
        // Keyboard
        window.addEventListener('keydown', e => {
            keys[e.code] = true;
            Audio.resume();

            if (e.code === 'KeyC') {
                const modeName = Camera.nextMode();
                HUD.showPopup(modeName, '#88aaff');
            }
            if (e.code === 'KeyH') Audio.play('horn', { volume: 0.5 });
            if (e.code === 'Escape') {
                if (GAME.state === 'racing') togglePause();
                else if (GAME.state === 'paused') togglePause();
            }

            // Turbo start
            if ((e.code === 'KeyW' || e.code === 'ArrowUp') && GAME.state === 'counting') {
                GAME.turboStartTime = performance.now() / 1000;
            }
        });

        window.addEventListener('keyup', e => { keys[e.code] = false; });

        // Mobile touch
        setupMobileControls();

        // Device orientation
        if (GAME.isMobile && window.DeviceOrientationEvent) {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                document.addEventListener('click', () => {
                    DeviceOrientationEvent.requestPermission().then(state => {
                        if (state === 'granted') enableTilt();
                    }).catch(() => {});
                }, { once: true });
            } else {
                enableTilt();
            }
        }
    }

    function enableTilt() {
        tiltEnabled = true;
        window.addEventListener('deviceorientation', e => {
            tiltAngle = (e.gamma || 0) / 30; // -1 to 1
            tiltAngle = Math.max(-1, Math.min(1, tiltAngle));
        });
    }

    function setupMobileControls() {
        const btns = {
            'mob-left': 'left', 'mob-right': 'right', 'mob-brake': 'brake',
            'mob-nitro': 'nitro', 'mob-item': 'item', 'mob-drift': 'drift'
        };

        Object.entries(btns).forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('touchstart', e => { e.preventDefault(); touches[key] = true; Audio.resume(); });
            el.addEventListener('touchend', e => { e.preventDefault(); touches[key] = false; });
            el.addEventListener('touchcancel', e => { touches[key] = false; });
        });
    }

    function getP1Input() {
        const isMob = GAME.isMobile;
        const input = {
            gas: GAME.autoGas ? true : (keys['KeyW'] || keys['ArrowUp']),
            brake: isMob ? touches.brake : (keys['KeyS'] || keys['ArrowDown']),
            left: false,
            right: false,
            drift: isMob ? touches.drift : (keys['Space'] || keys['ShiftLeft']),
            nitro: isMob ? touches.nitro : keys['KeyE'],
            item: isMob ? touches.item : keys['KeyQ']
        };

        // Steering
        if (isMob) {
            if (tiltEnabled) {
                input.left = tiltAngle < -0.2;
                input.right = tiltAngle > 0.2;
            } else {
                input.left = touches.left;
                input.right = touches.right;
            }
        } else {
            input.left = keys['KeyA'] || keys['ArrowLeft'];
            input.right = keys['KeyD'] || keys['ArrowRight'];
        }

        return input;
    }

    function getP2Input() {
        return {
            gas: keys['KeyI'],
            brake: keys['KeyK'],
            left: keys['KeyJ'],
            right: keys['KeyL'],
            drift: keys['KeyN'],
            nitro: keys['KeyU'],
            item: keys['KeyO']
        };
    }

    function isAnyKeyPressed() {
        return Object.values(keys).some(v => v) || Object.values(touches).some(v => v);
    }

    function togglePause() {
        if (GAME.state === 'racing') {
            GAME.state = 'paused';
            document.getElementById('pause-overlay').classList.remove('hidden');
            document.getElementById('hud').classList.add('hidden');
        } else if (GAME.state === 'paused') {
            GAME.state = 'racing';
            document.getElementById('pause-overlay').classList.add('hidden');
            document.getElementById('hud').classList.remove('hidden');
        }
    }

    return { init, getP1Input, getP2Input, isAnyKeyPressed, togglePause };
})();
