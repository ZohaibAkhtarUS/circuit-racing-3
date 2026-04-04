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

        // Rubber banding for kid mode
        if (selectedDifficulty === 'kid') {
            const sorted = [...allCars].sort((a, b) => b.raceProgress - a.raceProgress);
            const playerPos = sorted.findIndex(c => c.playerIndex >= 0);
            const aiPos = sorted.indexOf(this);
            // If AI is far ahead of player, slow down
            if (aiPos < playerPos && playerPos > 1) {
                this.speed *= 0.97;
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
