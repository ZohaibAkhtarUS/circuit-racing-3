// ============================================================
// CIRCUIT RACING 1 — Input System (Keyboard + Mobile + Tilt)
// ============================================================

function getP1Input() {
    if (gameMode === 'vs_bots') {
        return {
            up: keys['ArrowUp'] || keys['KeyW'] || mobileInput.up,
            down: keys['ArrowDown'] || keys['KeyS'] || mobileInput.down,
            left: keys['ArrowLeft'] || keys['KeyA'] || mobileInput.left,
            right: keys['ArrowRight'] || keys['KeyD'] || mobileInput.right,
            drift: keys['ShiftLeft'] || keys['ShiftRight'] || keys['Space'] || mobileInput.drift,
            nitro: keys['KeyE'] || mobileInput.nitro,
            useItem: keys['KeyF'] || mobileInput.useItem,
            horn: keys['KeyH'] || mobileInput.horn
        };
    }
    return {
        up: keys['KeyW'] || mobileInput.up,
        down: keys['KeyS'] || mobileInput.down,
        left: keys['KeyA'] || mobileInput.left,
        right: keys['KeyD'] || mobileInput.right,
        drift: keys['Space'] || mobileInput.drift,
        nitro: keys['KeyE'] || mobileInput.nitro,
        useItem: keys['KeyF'] || mobileInput.useItem,
        horn: keys['KeyH'] || mobileInput.horn
    };
}

function getP2Input() {
    return {
        up: keys['ArrowUp'], down: keys['ArrowDown'],
        left: keys['ArrowLeft'], right: keys['ArrowRight'],
        drift: keys['ShiftLeft'] || keys['ShiftRight'],
        nitro: false, useItem: false, horn: false
    };
}

function setupMobileControls() {
    isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (!isMobile) return;

    document.body.classList.add('is-mobile');

    // Auto-gas on mobile (always accelerating)
    mobileInput.up = true;

    // --- Tilt Steering (DeviceOrientation) ---
    let tiltAvailable = false;

    function handleOrientation(event) {
        if (!tiltAvailable) tiltAvailable = true;
        const gamma = event.gamma || 0; // left-right tilt (-90..90)
        const threshold = 8;
        const maxTilt = 30;

        mobileInput.left = false;
        mobileInput.right = false;

        if (gamma < -threshold) {
            mobileInput.left = true;
            // Drift when tilting sharply
            mobileInput.drift = gamma < -(maxTilt * 0.7);
        } else if (gamma > threshold) {
            mobileInput.right = true;
            mobileInput.drift = gamma > (maxTilt * 0.7);
        }
    }

    // Request permission for iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        // Will be requested on first touch
        document.addEventListener('touchstart', function requestTilt() {
            DeviceOrientationEvent.requestPermission().then(response => {
                if (response === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                }
            }).catch(() => {});
            document.removeEventListener('touchstart', requestTilt);
        }, { once: true });
    } else {
        window.addEventListener('deviceorientation', handleOrientation);
    }

    // --- Tap steering buttons (fallback if no tilt) ---
    const steerLeft = document.getElementById('steer-left');
    const steerRight = document.getElementById('steer-right');

    if (steerLeft) {
        steerLeft.addEventListener('touchstart', function(e) {
            e.preventDefault();
            mobileInput.left = true;
            steerLeft.classList.add('pressed');
        }, { passive: false });
        steerLeft.addEventListener('touchend', function(e) {
            e.preventDefault();
            if (!tiltAvailable) mobileInput.left = false;
            steerLeft.classList.remove('pressed');
        }, { passive: false });
        steerLeft.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            if (!tiltAvailable) mobileInput.left = false;
            steerLeft.classList.remove('pressed');
        }, { passive: false });
    }

    if (steerRight) {
        steerRight.addEventListener('touchstart', function(e) {
            e.preventDefault();
            mobileInput.right = true;
            steerRight.classList.add('pressed');
        }, { passive: false });
        steerRight.addEventListener('touchend', function(e) {
            e.preventDefault();
            if (!tiltAvailable) mobileInput.right = false;
            steerRight.classList.remove('pressed');
        }, { passive: false });
        steerRight.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            if (!tiltAvailable) mobileInput.right = false;
            steerRight.classList.remove('pressed');
        }, { passive: false });
    }

    // --- Brake button ---
    const brakeBtn = document.getElementById('brake-btn');
    if (brakeBtn) {
        brakeBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            mobileInput.up = false;
            mobileInput.down = true;
            brakeBtn.classList.add('pressed');
        }, { passive: false });
        brakeBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            mobileInput.down = false;
            mobileInput.up = true; // Resume auto-gas
            brakeBtn.classList.remove('pressed');
        }, { passive: false });
        brakeBtn.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            mobileInput.down = false;
            mobileInput.up = true;
            brakeBtn.classList.remove('pressed');
        }, { passive: false });
    }

    // --- Action buttons ---
    function setupButton(id, inputKey, isToggle) {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            btn.classList.add('pressed');
            if (isToggle) {
                mobileInput[inputKey] = true;
                setTimeout(() => { mobileInput[inputKey] = false; }, 100);
            } else {
                mobileInput[inputKey] = true;
            }
        }, { passive: false });
        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            btn.classList.remove('pressed');
            if (!isToggle) mobileInput[inputKey] = false;
        }, { passive: false });
        btn.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            btn.classList.remove('pressed');
            if (!isToggle) mobileInput[inputKey] = false;
        }, { passive: false });
    }

    setupButton('btn-nitro', 'nitro', true);
    setupButton('btn-item', 'useItem', true);

    // Show tilt indicator briefly
    const tiltInd = document.getElementById('tilt-indicator');
    if (tiltInd) {
        tiltInd.style.display = 'block';
        setTimeout(() => { tiltInd.style.display = 'none'; }, 4000);
    }
}
