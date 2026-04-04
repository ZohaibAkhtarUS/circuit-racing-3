// ===== CIRCUIT RACING 4 - TUTORIAL =====

const Tutorial = (() => {
    let active = false;
    let currentStep = 0;
    let stepTimer = 0;

    const steps = [
        {
            title: 'WELCOME TO CIRCUIT RACING 4!',
            text: 'Let\'s learn the basics. Press any key to continue.',
            condition: () => Input.isAnyKeyPressed()
        },
        {
            title: 'ACCELERATE',
            text: 'Hold W or UP ARROW to go faster. On mobile, your car drives automatically!',
            condition: () => GAME.playerCar && GAME.playerCar.speed > 30
        },
        {
            title: 'STEER',
            text: 'Press A/D or LEFT/RIGHT to steer. Try turning through the next corner!',
            condition: () => {
                stepTimer += 0.016;
                return stepTimer > 4;
            }
        },
        {
            title: 'BRAKE',
            text: 'Press S or DOWN to slow down before sharp turns.',
            condition: () => {
                stepTimer += 0.016;
                return stepTimer > 3;
            }
        },
        {
            title: 'DRIFT!',
            text: 'Hold SPACE while turning to drift! Release for a speed boost. Longer drifts = bigger boosts!',
            condition: () => GAME.playerCar && GAME.playerCar.driftCharge > 0.5
        },
        {
            title: 'NITRO',
            text: 'Press E to activate NITRO when your boost bar is full! It gives massive speed.',
            condition: () => GAME.playerCar && GAME.playerCar.nitroActive
        },
        {
            title: 'ITEMS',
            text: 'Drive through the rainbow boxes to collect items. Press Q to use your item!',
            condition: () => GAME.playerCar && !GAME.playerCar.heldItem && GAME.playerCar.totalTime > 5
        },
        {
            title: 'SLIPSTREAM',
            text: 'Follow closely behind another car to draft! You\'ll get a speed boost after 0.5 seconds.',
            condition: () => {
                stepTimer += 0.016;
                return stepTimer > 5;
            }
        },
        {
            title: 'TURBO START',
            text: 'At the start of a race, press GAS right when "GO!" appears for a turbo boost! Perfect timing = huge boost!',
            condition: () => {
                stepTimer += 0.016;
                return stepTimer > 4;
            }
        },
        {
            title: 'YOU\'RE READY!',
            text: 'That\'s everything! Now go win some races and unlock all 6 tracks!',
            condition: () => {
                stepTimer += 0.016;
                return stepTimer > 3;
            }
        }
    ];

    function start() {
        active = true;
        currentStep = 0;
        stepTimer = 0;
        showStep();
        document.getElementById('tutorial-overlay').classList.remove('hidden');
    }

    function stop() {
        active = false;
        document.getElementById('tutorial-overlay').classList.add('hidden');
        Career.markTutorialDone();
    }

    function showStep() {
        const step = steps[currentStep];
        if (!step) { stop(); return; }

        const titleEl = document.getElementById('tutorial-title');
        const textEl = document.getElementById('tutorial-text');
        const progressEl = document.getElementById('tutorial-progress');

        if (titleEl) titleEl.textContent = step.title;
        if (textEl) textEl.textContent = step.text;

        // Progress dots
        if (progressEl) {
            progressEl.innerHTML = '';
            steps.forEach((_, i) => {
                const dot = document.createElement('div');
                dot.className = 'tut-dot' +
                    (i < currentStep ? ' done' : '') +
                    (i === currentStep ? ' current' : '');
                progressEl.appendChild(dot);
            });
        }

        stepTimer = 0;
    }

    function update(dt) {
        if (!active) return;
        const step = steps[currentStep];
        if (!step) return;

        if (step.condition()) {
            currentStep++;
            if (currentStep >= steps.length) {
                stop();
                return;
            }
            showStep();
            Audio.play('pickup', { volume: 0.3 });
        }
    }

    function isActive() { return active; }
    function isDone() {
        const career = Career.getState();
        return career.tutorialDone;
    }

    return { start, stop, update, isActive, isDone };
})();
