// ===== CIRCUIT RACING 4 - AI =====

class AICar extends GameCar {
    constructor(driverDef, colorDef) {
        super(colorDef, driverDef.name, false);
        this.driver = driverDef;
        this.personality = AI_PERSONALITIES[driverDef.personality] || AI_PERSONALITIES.balanced;
        this.targetWP = 2;
        this.steerNoise = 0;
        this.noiseTimer = 0;
        this.itemTimer = this.personality.itemDelay;
        this.speedVariation = 0.95 + Math.random() * 0.1;
    }

    updateAI(dt, trackData) {
        if (this.finished || !trackData || !trackData.waypoints) return;

        const wp = trackData.waypoints;
        const diffSettings = DIFFICULTY[GAME.difficulty];
        const numWP = wp.length;

        // Find closest waypoint
        let closestDist = Infinity;
        let closestIdx = 0;
        for (let i = 0; i < numWP; i++) {
            const dx = this.x - wp[i].x;
            const dz = this.z - wp[i].z;
            const dist = dx * dx + dz * dz;
            if (dist < closestDist) { closestDist = dist; closestIdx = i; }
        }

        // Target ahead
        const lookAhead = 3 + Math.floor(this.speed / 30);
        this.targetWP = (closestIdx + lookAhead) % numWP;
        const target = wp[this.targetWP];

        // Steer toward target
        const dx = target.x - this.x;
        const dz = target.z - this.z;
        const targetAngle = Math.atan2(dx, dz);
        let angleDiff = targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Steering noise
        this.noiseTimer -= dt;
        if (this.noiseTimer <= 0) {
            this.steerNoise = (Math.random() - 0.5) * (1 - this.personality.accuracy) * 1.5;
            this.noiseTimer = 0.3 + Math.random() * 0.5;
        }

        // Build input
        const input = { gas: true, brake: false, left: false, right: false, drift: false, nitro: false, item: false };

        const steerAngle = angleDiff + this.steerNoise;
        const steerThreshold = 0.05;
        if (steerAngle > steerThreshold) input.left = true;
        if (steerAngle < -steerThreshold) input.right = true;

        // Brake for sharp turns
        if (Math.abs(angleDiff) > 0.8 && this.speed > 60) {
            input.brake = true;
            input.gas = false;
        }

        // Drift in sharp turns
        if (Math.abs(angleDiff) > 1.0 && this.speed > 40 && Math.random() < this.personality.driftChance) {
            input.drift = true;
        }

        // Speed control based on difficulty
        const aiMaxSpeed = PHYS.maxSpeed * diffSettings.aiSpeedMult * this.personality.speedMult * this.speedVariation;
        if (this.speed > aiMaxSpeed) {
            input.gas = false;
        }

        // Rubber-banding - STRONG so player (Mikhail) can always catch up!
        if (GAME.playerCar) {
            const playerProg = GAME.playerCar.progress;
            const myProg = this.progress;
            const diff = myProg - playerProg;
            const rb = diffSettings.rubberBand;

            if (diff > 1.5) {
                input.gas = false; // Way ahead, stop accelerating
                this.speed *= 0.9;  // Brake hard
            } else if (diff > 0.8) {
                input.gas = false;
                this.speed *= 0.95;
            } else if (diff > 0.3) {
                if (this.speed > aiMaxSpeed * 0.5) input.gas = false;
            } else if (diff < -1.5 * rb) {
                // Behind player, speed up a tiny bit
                this.speed = Math.min(this.speed * 1.005, aiMaxSpeed * 0.9);
            }
        }

        // Nitro usage
        if (this.nitroReady && this.speed > 50 && Math.abs(angleDiff) < 0.3 && Math.random() < 0.01) {
            input.nitro = true;
        }

        // Item usage
        if (this.heldItem) {
            this.itemTimer -= dt;
            if (this.itemTimer <= 0) {
                input.item = true;
                this.itemTimer = this.personality.itemDelay + Math.random() * 3;
            }
        }

        // Random horn
        if (Math.random() < 0.002) Audio.play('horn', { volume: 0.1 });

        // Apply input
        if (input.item && this.heldItem) this.activateItem();
        this.update(dt, input, trackData);
    }
}
