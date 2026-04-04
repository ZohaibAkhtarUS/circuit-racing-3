// ============================================================
// CIRCUIT RACING 1 — AI Car
// ============================================================

class AICar extends GameCar {
    constructor(x, z, angle, colorKey, difficulty) {
        super(x, z, angle, colorKey, -1);
        this.diff = AI_DIFF[difficulty] || AI_DIFF.medium;
        this.currentWP = 0;
        this.steerNoise = (Math.random() - 0.5) * 0.3;
        this.speedVar = 0.95 + Math.random() * 0.1;
        this.itemUseTimer = 2 + Math.random() * 3;
    }

    updateAI(dt) {
        if (!track) return;
        const wp = track.waypoints[this.currentWP];
        const dx = wp.x - this.x, dz = wp.z - this.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < this.diff.wpThresh) this.currentWP = (this.currentWP + 1) % track.waypoints.length;

        const targetAngle = Math.atan2(dx, dz);
        let angleDiff = targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const input = { up: true, down: false, left: false, right: false, drift: false, nitro: false, useItem: false, horn: false };
        const combined = angleDiff + this.steerNoise * (1 - this.diff.accuracy);
        if (combined > 0.05) input.left = true;
        else if (combined < -0.05) input.right = true;
        if (Math.abs(angleDiff) > 0.5 && this.speed > 50) { input.up = false; input.down = true; }

        // AI nitro
        if (Math.abs(angleDiff) < 0.2 && this.speed > 60 && this.nitroCooldownTimer <= 0) input.nitro = true;

        // AI item usage
        if (this.heldItem) {
            this.itemUseTimer -= dt;
            if (this.itemUseTimer <= 0) {
                input.useItem = true;
                this.itemUseTimer = 3 + Math.random() * 4;
            }
        }

        // Obstacle avoidance — steer away from nearby obstacles
        const avoidDist = 12 + this.speed * 0.08;
        let avoidX = 0, avoidZ = 0;
        for (const obs of staticObstacles) {
            const odx = this.x - obs.x, odz = this.z - obs.z;
            const oDist = Math.sqrt(odx * odx + odz * odz);
            if (oDist < avoidDist && oDist > 0.1) {
                // Check if obstacle is ahead of us
                const toObs = Math.atan2(obs.x - this.x, obs.z - this.z);
                let relAngle = toObs - this.angle;
                while (relAngle > Math.PI) relAngle -= Math.PI * 2;
                while (relAngle < -Math.PI) relAngle += Math.PI * 2;
                if (Math.abs(relAngle) < 1.0) {
                    const strength = 1 - (oDist / avoidDist);
                    avoidX += (odx / oDist) * strength;
                    avoidZ += (odz / oDist) * strength;
                }
            }
        }
        for (const obs of movingObstacles) {
            const odx = this.x - obs.mesh.position.x, odz = this.z - obs.mesh.position.z;
            const oDist = Math.sqrt(odx * odx + odz * odz);
            if (oDist < avoidDist && oDist > 0.1) {
                const toObs = Math.atan2(obs.mesh.position.x - this.x, obs.mesh.position.z - this.z);
                let relAngle = toObs - this.angle;
                while (relAngle > Math.PI) relAngle -= Math.PI * 2;
                while (relAngle < -Math.PI) relAngle += Math.PI * 2;
                if (Math.abs(relAngle) < 1.0) {
                    const strength = 1 - (oDist / avoidDist);
                    avoidX += (odx / oDist) * strength * 1.5;
                    avoidZ += (odz / oDist) * strength * 1.5;
                }
            }
        }
        if (avoidX !== 0 || avoidZ !== 0) {
            const avoidAngle = Math.atan2(avoidX, avoidZ);
            let avoidDiff = avoidAngle - this.angle;
            while (avoidDiff > Math.PI) avoidDiff -= Math.PI * 2;
            while (avoidDiff < -Math.PI) avoidDiff += Math.PI * 2;
            if (avoidDiff > 0.05) { input.left = true; input.right = false; }
            else if (avoidDiff < -0.05) { input.right = true; input.left = false; }
        }

        // Rubber banding for kid mode — very aggressive so kid always has a chance
        if (selectedDifficulty === 'kid') {
            const sorted = [...allCars].sort((a, b) => b.raceProgress - a.raceProgress);
            const playerPos = sorted.findIndex(c => c.playerIndex >= 0);
            const aiPos = sorted.indexOf(this);
            // If AI is ahead of player at all, slow down hard
            if (aiPos < playerPos) {
                this.speed *= 0.90;
            }
            // AI randomly brakes/hesitates to let the kid catch up
            if (Math.random() < 0.03) {
                this.speed *= 0.7;
            }
            // No nitro for AI in kid mode
            input.nitro = false;
            // No offensive items in kid mode
            if (this.heldItem === ITEMS.MISSILE || this.heldItem === ITEMS.LIGHTNING || this.heldItem === ITEMS.BANANA || this.heldItem === ITEMS.OIL) {
                this.heldItem = null;
            }
        }
        // Rubber banding for easy mode too (lighter)
        if (selectedDifficulty === 'easy') {
            const sorted = [...allCars].sort((a, b) => b.raceProgress - a.raceProgress);
            const playerPos = sorted.findIndex(c => c.playerIndex >= 0);
            const aiPos = sorted.indexOf(this);
            if (aiPos < playerPos && playerPos > 2) {
                this.speed *= 0.95;
            }
        }

        this.update(dt, input);
        const aiMax = this.carMaxSpeed || PHYS.maxSpeed;
        this.speed = Math.min(this.speed, aiMax * this.diff.speedMult * this.speedVar);

        if (Math.random() < 0.02) this.steerNoise = (Math.random() - 0.5) * 0.3;
        if (Math.random() < 0.005) this.speedVar = 0.93 + Math.random() * 0.14;

        // Random horn (fun for kids!)
        if (Math.random() < 0.002) playHorn();
    }
}
