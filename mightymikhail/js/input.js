// ============================================================
// MIGHTY MIKHAIL - Input System
// ============================================================

const keys = {};
const mobileInput = { left: false, right: false, up: false, down: false, shoot: false, fly: false, ability: false, cycle: false };
let isMobile = false;
let joystickActive = false, joystickId = null;
let joystickBaseX = 0, joystickBaseY = 0;

function getInput() {
    return {
        left: keys['ArrowLeft'] || keys['KeyA'] || mobileInput.left,
        right: keys['ArrowRight'] || keys['KeyD'] || mobileInput.right,
        up: keys['ArrowUp'] || keys['KeyW'] || mobileInput.up,
        down: keys['ArrowDown'] || keys['KeyS'] || mobileInput.down,
        shoot: keys['Space'] || mobileInput.shoot,
        fly: keys['ShiftLeft'] || keys['ShiftRight'] || mobileInput.fly,
        ability: keys['KeyE'] || mobileInput.ability,
        cycle: keys['KeyQ'] || mobileInput.cycle,
    };
}

// Edge detection
let prevShoot = false, prevAbility = false, prevCycle = false;
let shootPressed = false, abilityPressed = false, cyclePressed = false;

function updateInputEdges() {
    const inp = getInput();
    if (inp.shoot && !prevShoot) shootPressed = true;
    if (inp.ability && !prevAbility) abilityPressed = true;
    if (inp.cycle && !prevCycle) cyclePressed = true;
    prevShoot = inp.shoot;
    prevAbility = inp.ability;
    prevCycle = inp.cycle;
}

function consumeShoot() { const v = shootPressed; shootPressed = false; return v; }
function consumeAbility() { const v = abilityPressed; abilityPressed = false; return v; }
function consumeCycle() { const v = cyclePressed; cyclePressed = false; return v; }

function setupKeyboard() {
    window.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
        if (e.code === 'Escape') {
            if (gameState === 'playing') setState('paused');
            else if (gameState === 'paused') setState('playing');
        }
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });
}

function setupTouch() {
    isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (!isMobile) return;

    document.getElementById('mobile-controls').style.display = 'block';

    const joystickZone = document.getElementById('joystick-zone');
    const joystickBase = document.getElementById('joystick-base');
    const joystickThumb = document.getElementById('joystick-thumb');

    joystickZone.addEventListener('touchstart', e => {
        e.preventDefault();
        initAudio();
        const touch = e.changedTouches[0];
        joystickActive = true;
        joystickId = touch.identifier;
        const rect = joystickBase.getBoundingClientRect();
        joystickBaseX = rect.left + rect.width / 2;
        joystickBaseY = rect.top + rect.height / 2;
        updateJoystick(touch.clientX, touch.clientY);
    }, { passive: false });

    joystickZone.addEventListener('touchmove', e => {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            if (touch.identifier === joystickId) {
                updateJoystick(touch.clientX, touch.clientY);
            }
        }
    }, { passive: false });

    const endJoystick = e => {
        for (const touch of e.changedTouches) {
            if (touch.identifier === joystickId) {
                joystickActive = false;
                joystickId = null;
                mobileInput.left = mobileInput.right = mobileInput.up = mobileInput.down = false;
                joystickThumb.style.transform = 'translate(0, 0)';
            }
        }
    };
    joystickZone.addEventListener('touchend', endJoystick);
    joystickZone.addEventListener('touchcancel', endJoystick);

    function updateJoystick(cx, cy) {
        let dx = cx - joystickBaseX;
        let dy = cy - joystickBaseY;
        const maxDist = 55;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d > maxDist) { dx = dx/d * maxDist; dy = dy/d * maxDist; }
        joystickThumb.style.transform = `translate(${dx}px, ${dy}px)`;
        const deadzone = 0.2;
        const nx = dx / maxDist;
        const ny = dy / maxDist;
        mobileInput.left = nx < -deadzone;
        mobileInput.right = nx > deadzone;
        mobileInput.up = ny < -deadzone;
        mobileInput.down = ny > deadzone;
    }

    // Action buttons
    setupActionButton('btn-shoot', 'shoot');
    setupActionButton('btn-fly', 'fly');
    setupActionButton('btn-ability', 'ability');
    setupActionButton('btn-cycle', 'cycle');
}

function setupActionButton(id, action) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('touchstart', e => {
        e.preventDefault();
        initAudio();
        mobileInput[action] = true;
        if (navigator.vibrate) navigator.vibrate(15);
    }, { passive: false });
    btn.addEventListener('touchend', e => {
        e.preventDefault();
        mobileInput[action] = false;
    }, { passive: false });
    btn.addEventListener('touchcancel', () => {
        mobileInput[action] = false;
    });
}

// Prevent default touch behaviors
document.addEventListener('touchmove', e => {
    if (e.target.closest('#game-container')) e.preventDefault();
}, { passive: false });
