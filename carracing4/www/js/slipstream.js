// ===== CIRCUIT RACING 4 - SLIPSTREAM & TURBO START =====

const Slipstream = (() => {

    function update(dt) {
        GAME.allCars.forEach(car => {
            updateSlipstream(car, dt);
        });
    }

    function updateSlipstream(car, dt) {
        let drafting = false;
        let bestTarget = null;
        let bestDist = Infinity;

        GAME.allCars.forEach(other => {
            if (other === car) return;

            const dx = other.x - car.x;
            const dz = other.z - car.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist > PHYS.slipstreamRange || dist < 2) return;

            // Check if other car is ahead and in our forward cone
            const angleToOther = Math.atan2(dx, dz);
            let angleDiff = angleToOther - car.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            if (Math.abs(angleDiff) < PHYS.slipstreamAngle && dist < bestDist) {
                bestDist = dist;
                bestTarget = other;
                drafting = true;
            }
        });

        if (drafting) {
            car.slipstreamTimer += dt;
            car.slipstreamTarget = bestTarget;

            if (car.slipstreamTimer >= PHYS.slipstreamMinTime) {
                car.slipstreamActive = true;

                // Visual trail between cars
                if (car.isPlayer && Math.random() > 0.5) {
                    const mx = (car.x + bestTarget.x) / 2;
                    const my = (car.y + bestTarget.y) / 2 + 0.5;
                    const mz = (car.z + bestTarget.z) / 2;
                    Particles.emit(mx, my, mz, 'slipstream', 1);
                }

                if (car.isPlayer) {
                    Audio.play('slipstream', { volume: 0.2 });
                }
            }
        } else {
            car.slipstreamTimer = Math.max(0, car.slipstreamTimer - dt * 2);
            if (car.slipstreamTimer <= 0) {
                car.slipstreamActive = false;
                car.slipstreamTarget = null;
            }
        }
    }

    // Turbo start
    let turboStartPhase = 'waiting'; // waiting, ready, done
    let goTime = 0;

    function resetTurboStart() {
        turboStartPhase = 'waiting';
        goTime = 0;
    }

    function setGoTime(time) {
        goTime = time;
        turboStartPhase = 'ready';
    }

    function checkTurboStart(car, pressTime) {
        if (turboStartPhase !== 'ready') return;
        turboStartPhase = 'done';

        const diff = goTime - pressTime; // How long before GO the player pressed
        const window = PHYS.turboStartWindow;
        const perfectWindow = PHYS.turboStartPerfectWindow;

        if (diff >= perfectWindow[0] && diff <= perfectWindow[1]) {
            // Perfect turbo start
            car.turboStartBonus = PHYS.turboStartPerfectBoost;
            car.speed += PHYS.turboStartPerfectBoost;
            Audio.play('turbostart', { volume: 0.6 });
            Particles.emit(car.x, car.y + 0.5, car.z, 'boost', 15);
            HUD.showPopup('PERFECT START!', '#00ff88');
        } else if (diff >= window[0] && diff <= window[1]) {
            // Good turbo start
            car.turboStartBonus = PHYS.turboStartBoost;
            car.speed += PHYS.turboStartBoost;
            Audio.play('turbostart', { volume: 0.4 });
            Particles.emit(car.x, car.y + 0.5, car.z, 'boost', 8);
            HUD.showPopup('GREAT START!', '#ffaa00');
        } else if (diff > window[1]) {
            // Too early - stall
            car.speed = 0;
            car.stunTimer = 1;
            HUD.showPopup('TOO EARLY!', '#ff3333');
        }
        // If diff < window[0], player pressed after GO which is normal acceleration
    }

    return { update, resetTurboStart, setGoTime, checkTurboStart };
})();
