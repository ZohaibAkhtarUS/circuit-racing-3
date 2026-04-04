// ============================================================
// CIRCUIT RACING 1 — Victory Celebrations
// ============================================================

let celebrationActive = false;
let confettiTimer = 0;
let fireworkTimer = 0;

function startCelebration(isWinner) {
    celebrationActive = true;
    confettiTimer = 4;
    fireworkTimer = 0;

    if (isWinner) {
        playVictoryFanfare();
        // Victory donut - make the winning car spin
        const p = playerCars[0];
        if (p) {
            const spinInterval = setInterval(() => {
                if (!celebrationActive) { clearInterval(spinInterval); return; }
                p.angle += 0.15;
                p.mesh.rotation.y = p.angle;
            }, 16);
            setTimeout(() => clearInterval(spinInterval), 3000);
        }
    }
}

function updateCelebration(dt) {
    if (!celebrationActive) return;

    const p = playerCars[0];
    if (!p) return;

    // Confetti shower
    if (confettiTimer > 0) {
        confettiTimer -= dt;
        for (let i = 0; i < 3; i++) {
            emitParticle(
                p.x + (Math.random() - 0.5) * 30,
                p.mesh.position.y + 15 + Math.random() * 10,
                p.z + (Math.random() - 0.5) * 30,
                'confetti'
            );
        }
    }

    // Fireworks (timed bursts)
    fireworkTimer += dt;
    if (fireworkTimer > 0.8 && fireworkTimer < 5) {
        if (Math.random() < 0.06) {
            const fx = p.x + (Math.random() - 0.5) * 50;
            const fy = p.mesh.position.y + 20 + Math.random() * 20;
            const fz = p.z + (Math.random() - 0.5) * 50;
            for (let i = 0; i < 20; i++) {
                emitParticle(fx, fy, fz, 'firework');
            }
            // Flash light at firework position
            const light = new THREE.PointLight(
                new THREE.Color().setHSL(Math.random(), 1, 0.6).getHex(),
                2, 40
            );
            light.position.set(fx, fy, fz);
            scene.add(light);
            setTimeout(() => scene.remove(light), 400);
        }
    }

    if (confettiTimer <= 0 && fireworkTimer > 5) {
        celebrationActive = false;
    }
}

function getStarRating(position) {
    if (position === 1) return 3;
    if (position === 2) return 2;
    if (position === 3) return 1;
    return 0;
}

function renderStars(count) {
    let html = '';
    for (let i = 0; i < 3; i++) {
        if (i < count) {
            html += '<span class="star filled">&#9733;</span>';
        } else {
            html += '<span class="star empty">&#9734;</span>';
        }
    }
    return html;
}
