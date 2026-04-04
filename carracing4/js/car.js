// ===== CIRCUIT RACING 4 - CAR =====

class GameCar {
    constructor(colorDef, name, isPlayer = false) {
        this.name = name;
        this.isPlayer = isPlayer;
        this.colorDef = colorDef;

        // Physics state
        this.x = 0; this.y = 0; this.z = 0;
        this.angle = 0;
        this.speed = 0;
        this.vx = 0; this.vy = 0; this.vz = 0;
        this.airborne = false;
        this.onTrack = true;

        // Drift
        this.drifting = false;
        this.driftCharge = 0;
        this.driftDir = 0;

        // Nitro
        this.nitroActive = false;
        this.nitroTimer = 0;
        this.nitroCooldown = 0;
        this.nitroReady = true;

        // Items
        this.heldItem = null;
        this.shieldActive = false;
        this.starActive = false;
        this.starTimer = 0;
        this.magnetActive = false;
        this.magnetTimer = 0;
        this.stunTimer = 0;
        this.slowTimer = 0;

        // Slipstream
        this.slipstreamTimer = 0;
        this.slipstreamActive = false;
        this.slipstreamTarget = null;

        // Turbo start
        this.turboStartBonus = 0;

        // Lap tracking
        this.lap = 1;
        this.checkpoint = 0;
        this.progress = 0;
        this.lapTimes = [];
        this.currentLapTime = 0;
        this.totalTime = 0;
        this.finished = false;
        this.finishPosition = 0;
        this.lastCheckpointDir = 1;

        // 3D
        this.mesh = null;
        this.shieldMesh = null;
        this.headlightL = null;
        this.headlightR = null;
        this.wheels = [];

        this.createMesh();
    }

    createMesh() {
        this.mesh = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({
            color: this.colorDef.color,
            metalness: 0.7,
            roughness: 0.25,
            envMapIntensity: 1.2
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: this.colorDef.accent,
            metalness: 0.6,
            roughness: 0.3
        });

        // --- Main body: smooth capsule-like lower body ---
        // Use a LatheGeometry for a smooth rounded body profile
        const bodyProfile = [];
        // Create a smooth car side profile (half cross-section to revolve)
        for (let i = 0; i <= 20; i++) {
            const t = i / 20; // 0 to 1 front to back
            const z = (t - 0.5) * 4.2; // -2.1 to 2.1
            // Width varies: narrow at front/back, wide in middle
            const widthCurve = Math.sin(t * Math.PI) * 1.1 + 0.1;
            // Height curve: low at front, rises to cabin, drops at rear
            const heightCurve = Math.sin(t * Math.PI) * 0.45;
            bodyProfile.push(new THREE.Vector2(widthCurve, z));
        }

        // Lower body - stretched ellipsoid shape
        const lowerGeom = new THREE.SphereGeometry(1, 16, 12);
        const lower = new THREE.Mesh(lowerGeom, bodyMat);
        lower.scale.set(1.1, 0.4, 2.2);
        lower.position.set(0, 0.45, 0);
        lower.castShadow = true;
        lower.receiveShadow = true;
        this.mesh.add(lower);
        this.bodyMesh = lower;

        // Upper body / hood - slightly flatter ellipsoid on top
        const upperGeom = new THREE.SphereGeometry(1, 14, 10);
        const upper = new THREE.Mesh(upperGeom, bodyMat);
        upper.scale.set(0.95, 0.25, 1.8);
        upper.position.set(0, 0.75, 0.2);
        upper.castShadow = true;
        this.mesh.add(upper);

        // Cabin / cockpit bubble
        const cabinGeom = new THREE.SphereGeometry(1, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
        const cabinMat = new THREE.MeshPhongMaterial({
            color: 0x88bbff,
            transparent: true,
            opacity: 0.45,
            shininess: 120,
            side: THREE.DoubleSide
        });
        const cabin = new THREE.Mesh(cabinGeom, cabinMat);
        cabin.scale.set(0.75, 0.45, 0.85);
        cabin.position.set(0, 0.85, -0.15);
        this.mesh.add(cabin);

        // Front nose cone - smooth taper
        const noseGeom = new THREE.ConeGeometry(0.5, 1.2, 12);
        const nose = new THREE.Mesh(noseGeom, bodyMat);
        nose.rotation.x = -Math.PI / 2;
        nose.position.set(0, 0.5, 2.4);
        nose.scale.set(1.4, 1, 0.6);
        nose.castShadow = true;
        this.mesh.add(nose);

        // Rear taper
        const rearGeom = new THREE.ConeGeometry(0.6, 1.5, 12);
        const rear = new THREE.Mesh(rearGeom, accentMat);
        rear.rotation.x = Math.PI / 2;
        rear.position.set(0, 0.55, -2.2);
        rear.scale.set(1.2, 1, 0.5);
        rear.castShadow = true;
        this.mesh.add(rear);

        // Side skirts (smooth tubes along the body)
        [-1, 1].forEach(side => {
            const skirtGeom = new THREE.CapsuleGeometry(0.12, 3, 4, 8);
            const skirt = new THREE.Mesh(skirtGeom, accentMat);
            skirt.rotation.x = Math.PI / 2;
            skirt.position.set(side * 0.95, 0.3, 0);
            this.mesh.add(skirt);
        });

        // Spoiler - curved wing
        const spoilerGeom = new THREE.TorusGeometry(1, 0.06, 6, 12, Math.PI);
        const spoilerMat = new THREE.MeshStandardMaterial({ color: this.colorDef.accent, metalness: 0.8, roughness: 0.2 });
        const spoiler = new THREE.Mesh(spoilerGeom, spoilerMat);
        spoiler.rotation.x = Math.PI / 2;
        spoiler.position.set(0, 1.05, -2);
        spoiler.scale.set(0.8, 1, 0.5);
        this.mesh.add(spoiler);
        // Spoiler mounts
        [-0.5, 0.5].forEach(xOff => {
            const mountGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6);
            const mount = new THREE.Mesh(mountGeom, spoilerMat);
            mount.position.set(xOff, 0.88, -2);
            this.mesh.add(mount);
        });

        // Wheels - rounded tires with visible rims
        const wheelGeom = new THREE.TorusGeometry(0.32, 0.14, 8, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.2, roughness: 0.9 });
        const wheelPositions = [
            [-1.05, 0.32, 1.3], [1.05, 0.32, 1.3],
            [-1.05, 0.32, -1.4], [1.05, 0.32, -1.4]
        ];
        wheelPositions.forEach(([wx, wy, wz]) => {
            // Tire
            const wheel = new THREE.Mesh(wheelGeom, wheelMat);
            wheel.rotation.y = Math.PI / 2;
            wheel.position.set(wx, wy, wz);
            wheel.castShadow = true;
            this.mesh.add(wheel);
            this.wheels.push(wheel);
            // Rim disc
            const rimGeom = new THREE.CircleGeometry(0.22, 8);
            const rimMat = new THREE.MeshStandardMaterial({ color: 0xccccdd, metalness: 0.9, roughness: 0.1, side: THREE.DoubleSide });
            const rim = new THREE.Mesh(rimGeom, rimMat);
            rim.rotation.y = Math.PI / 2;
            rim.position.set(wx > 0 ? wx + 0.14 : wx - 0.14, wy, wz);
            this.mesh.add(rim);
            // Hub
            const hubGeom = new THREE.SphereGeometry(0.08, 6, 6);
            const hub = new THREE.Mesh(hubGeom, rimMat);
            hub.position.set(wx > 0 ? wx + 0.15 : wx - 0.15, wy, wz);
            this.mesh.add(hub);
        });

        // Wheel arches / fenders (half-torus over each wheel)
        wheelPositions.forEach(([wx, wy, wz]) => {
            const archGeom = new THREE.TorusGeometry(0.42, 0.08, 6, 10, Math.PI);
            const arch = new THREE.Mesh(archGeom, bodyMat);
            arch.rotation.y = Math.PI / 2;
            arch.position.set(wx > 0 ? wx - 0.1 : wx + 0.1, wy + 0.05, wz);
            this.mesh.add(arch);
        });

        // Headlights - round lenses
        const hlGeom = new THREE.SphereGeometry(0.15, 8, 8);
        const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
        [[-0.55, 0.5, 2.5], [0.55, 0.5, 2.5]].forEach(([hx, hy, hz], i) => {
            const hl = new THREE.Mesh(hlGeom, hlMat);
            hl.position.set(hx, hy, hz);
            this.mesh.add(hl);
            if (i === 0) this.headlightL = hl; else this.headlightR = hl;
        });

        // Taillights - red glow
        const tlMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
        [[-0.4, 0.55, -2.6], [0.4, 0.55, -2.6]].forEach(([tx, ty, tz]) => {
            const tl = new THREE.Mesh(hlGeom, tlMat);
            tl.scale.set(1.2, 0.6, 0.5);
            tl.position.set(tx, ty, tz);
            this.mesh.add(tl);
        });

        // Shield mesh (hidden initially)
        const shieldGeom = new THREE.SphereGeometry(2.5, 16, 16);
        const shieldMat = new THREE.MeshStandardMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.2,
            wireframe: true,
            metalness: 0.5,
            roughness: 0.3
        });
        this.shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
        this.shieldMesh.visible = false;
        this.mesh.add(this.shieldMesh);
    }

    setEnvMap(envMap) {
        this.mesh.traverse(child => {
            if (child.isMesh && child.material.isMeshStandardMaterial) {
                child.material.envMap = envMap;
                child.material.needsUpdate = true;
            }
        });
    }

    update(dt, input, trackData) {
        if (this.finished) return;
        if (this.stunTimer > 0) { this.stunTimer -= dt; this.speed *= 0.95; }
        if (this.slowTimer > 0) { this.slowTimer -= dt; }

        const slowMult = this.slowTimer > 0 ? 0.5 : 1;
        const maxSpd = (PHYS.maxSpeed + (this.nitroActive ? PHYS.nitroBoost : 0) +
            (this.slipstreamActive ? PHYS.slipstreamBoost : 0) +
            (this.starActive ? 30 : 0)) * slowMult;

        // Acceleration
        if (input.gas && this.stunTimer <= 0) {
            this.speed += PHYS.acceleration * dt;
        }
        if (input.brake) {
            this.speed -= PHYS.braking * dt;
        }
        if (!input.gas && !input.brake) {
            this.speed *= PHYS.friction;
        }
        this.speed = Math.max(-30, Math.min(maxSpd, this.speed));

        // Steering
        if (this.stunTimer <= 0) {
            const steerFactor = 1 - (Math.abs(this.speed) / (maxSpd + 50)) * 0.4;
            let turnAmt = 0;
            if (input.left) turnAmt = PHYS.turnSpeed * steerFactor;
            if (input.right) turnAmt = -PHYS.turnSpeed * steerFactor;

            if (this.drifting) {
                turnAmt *= PHYS.driftTurnMult;
                this.driftCharge = Math.min(2.5, this.driftCharge + dt);
            }
            this.angle += turnAmt * dt * (this.speed >= 0 ? 1 : -1);
        }

        // Drift
        if (input.drift && Math.abs(this.speed) > 30 && !this.drifting) {
            this.drifting = true;
            this.driftCharge = 0;
            this.driftDir = input.left ? 1 : (input.right ? -1 : (Math.random() > 0.5 ? 1 : -1));
        }
        if (!input.drift && this.drifting) {
            this.drifting = false;
            if (this.driftCharge > 0.3) {
                this.speed += this.driftCharge * 18;
                Particles.emit(this.x, this.y + 0.5, this.z, 'boost', 8);
                Audio.play('boost', { volume: 0.4 });
            }
            this.driftCharge = 0;
        }
        if (this.drifting) {
            this.speed *= PHYS.driftFriction;
            // Tire marks
            if (GAME.gfx.tireMarks && Math.random() > 0.6) {
                const offX = Math.cos(this.angle + Math.PI / 2) * 0.8;
                const offZ = Math.sin(this.angle + Math.PI / 2) * 0.8;
                Particles.addTireMark(this.x + offX, this.y, this.z - offZ, this.angle, GAME.scene);
                Particles.addTireMark(this.x - offX, this.y, this.z + offZ, this.angle, GAME.scene);
            }
            if (Math.random() > 0.7) {
                Particles.emit(this.x, this.y + 0.2, this.z, 'smoke', 1);
            }
        }

        // Nitro
        if (input.nitro && this.nitroReady && !this.nitroActive) {
            this.nitroActive = true;
            this.nitroTimer = PHYS.nitroDuration;
            this.nitroReady = false;
            this.nitroCooldown = PHYS.nitroCooldown;
            Audio.play('nitro', { volume: 0.5 });
        }
        if (this.nitroActive) {
            this.nitroTimer -= dt;
            if (Math.random() > 0.5) Particles.emit(this.x, this.y + 0.5, this.z, 'nitro', 1);
            if (this.nitroTimer <= 0) this.nitroActive = false;
        }
        if (!this.nitroReady) {
            this.nitroCooldown -= dt;
            if (this.nitroCooldown <= 0) this.nitroReady = true;
        }

        // Star
        if (this.starActive) {
            this.starTimer -= dt;
            if (Math.random() > 0.7) Particles.emit(this.x, this.y + 1, this.z, 'star', 1);
            if (this.starTimer <= 0) this.starActive = false;
        }

        // Magnet
        if (this.magnetActive) {
            this.magnetTimer -= dt;
            if (this.magnetTimer <= 0) this.magnetActive = false;
        }

        // Apply position
        this.applyPosition(dt, trackData);

        // Update 3D
        this.updateMesh(dt, input);

        // Update checkpoints
        this.updateCheckpoints(trackData);

        // Timers
        this.currentLapTime += dt;
        this.totalTime += dt;

        // Exhaust particles
        if (this.speed > 20 && Math.random() > 0.8) {
            const behindX = this.x - Math.sin(this.angle) * 2.2;
            const behindZ = this.z - Math.cos(this.angle) * 2.2;
            Particles.emit(behindX, this.y + 0.4, behindZ, 'smoke', 1);
        }

        // Engine sound
        if (this.isPlayer && this.speed > 5) {
            Audio.play('engine', { volume: 0.2, pitch: this.speed / PHYS.maxSpeed });
        }
    }

    applyPosition(dt, trackData) {
        if (!trackData) return;

        const dx = Math.sin(this.angle) * this.speed * dt;
        const dz = Math.cos(this.angle) * this.speed * dt;
        this.x += dx;
        this.z += dz;

        // Airborne
        if (this.airborne) {
            this.vy -= PHYS.gravity * dt;
            this.y += this.vy * dt;
            const groundY = this.getGroundHeight(trackData);
            if (this.y <= groundY) {
                this.y = groundY;
                this.airborne = false;
                this.vy = 0;
                Particles.emit(this.x, this.y, this.z, 'dust', 5);
            }
            return;
        }

        // Ground height and track check
        const groundY = this.getGroundHeight(trackData);
        this.y = groundY;

        // Track boundaries
        const trackResult = this.checkTrackBounds(trackData);
        this.onTrack = trackResult.onTrack;
        if (!this.onTrack) {
            this.speed *= PHYS.offTrackPenalty;
            if (Math.random() > 0.8) Particles.emit(this.x, this.y + 0.1, this.z, 'dust', 1);
        }

        // Wall collision
        if (trackResult.wallHit) {
            this.speed *= PHYS.wallBounce;
            this.x += trackResult.pushX || 0;
            this.z += trackResult.pushZ || 0;
            if (Math.abs(this.speed) > 20) {
                Particles.emit(this.x, this.y + 0.5, this.z, 'spark', 4);
                Audio.play('hit', { volume: 0.3 });
            }
        }

        // Ramp detection
        if (trackResult.onRamp && this.speed > PHYS.rampMinSpeed) {
            this.airborne = true;
            this.vy = PHYS.rampLaunchSpeed;
        }

        // Sky Highway fall detection
        if (GAME.trackDef && GAME.trackDef.theme === 'sky' && !this.onTrack) {
            if (this.y < -10) this.respawn(trackData);
        }
    }

    getGroundHeight(trackData) {
        if (!trackData || !trackData.waypoints) return 0;
        const wp = trackData.waypoints;
        let closestDist = Infinity;
        let closestIdx = 0;
        for (let i = 0; i < wp.length; i++) {
            const dx = this.x - wp[i].x;
            const dz = this.z - wp[i].z;
            const dist = dx * dx + dz * dz;
            if (dist < closestDist) { closestDist = dist; closestIdx = i; }
        }
        return wp[closestIdx].y || 0;
    }

    checkTrackBounds(trackData) {
        if (!trackData || !trackData.waypoints) return { onTrack: true, wallHit: false };
        const wp = trackData.waypoints;
        const halfWidth = (GAME.trackDef ? GAME.trackDef.roadWidth : 22) / 2;
        const wallDist = halfWidth + 1.5; // Hard wall boundary
        let minDist = Infinity;
        let closestIdx = 0;

        for (let i = 0; i < wp.length; i++) {
            const dx = this.x - wp[i].x;
            const dz = this.z - wp[i].z;
            const dist = dx * dx + dz * dz;
            if (dist < minDist) { minDist = dist; closestIdx = i; }
        }

        const dist = Math.sqrt(minDist);
        const onTrack = dist < halfWidth;
        let wallHit = false;
        let pushX = 0, pushZ = 0;

        // Hard wall: if car goes past the wall boundary, push it back inside
        if (dist > wallDist) {
            wallHit = true;
            const cp = wp[closestIdx];
            const dx = this.x - cp.x;
            const dz = this.z - cp.z;
            const len = Math.sqrt(dx * dx + dz * dz);
            // Snap car back to wall boundary
            this.x = cp.x + (dx / len) * wallDist;
            this.z = cp.z + (dz / len) * wallDist;
            // Also push inward a bit
            pushX = -(dx / len) * 0.5;
            pushZ = -(dz / len) * 0.5;
        }

        // Check ramp
        let onRamp = false;
        if (trackData.ramps) {
            for (const ramp of trackData.ramps) {
                const rdx = this.x - ramp.x;
                const rdz = this.z - ramp.z;
                if (Math.sqrt(rdx * rdx + rdz * rdz) < 5) { onRamp = true; break; }
            }
        }

        return { onTrack, wallHit, pushX, pushZ, onRamp, closestIdx };
    }

    updateCheckpoints(trackData) {
        if (!trackData || !trackData.waypoints) return;
        const wp = trackData.waypoints;
        const numCheckpoints = wp.length;
        const nextCP = (this.checkpoint + 1) % numCheckpoints;
        const cpPos = wp[nextCP];

        const dx = this.x - cpPos.x;
        const dz = this.z - cpPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 15) {
            const prevCheckpoint = this.checkpoint;
            this.checkpoint = nextCP;
            this.checkpointsHit = (this.checkpointsHit || 0) + 1;
            this.progress = this.lap + this.checkpoint / numCheckpoints;

            // Lap complete - only when crossing waypoint 0 AND having passed enough checkpoints
            if (nextCP === 0 && this.checkpointsHit >= numCheckpoints * 0.6) {
                this.lap++;
                this.lapTimes.push(this.currentLapTime);
                this.currentLapTime = 0;
                this.checkpointsHit = 0; // Reset for next lap

                if (this.isPlayer) {
                    Audio.play('lap', { volume: 0.5 });
                }

                if (this.lap > GAME.totalLaps) {
                    this.finished = true;
                }
            }
        }

        // Wrong way detection
        if (this.isPlayer) {
            const prevCP = (this.checkpoint - 1 + numCheckpoints) % numCheckpoints;
            const pcp = wp[prevCP];
            const pdx = this.x - pcp.x;
            const pdz = this.z - pcp.z;
            const prevDist = Math.sqrt(pdx * pdx + pdz * pdz);
            this.goingWrongWay = prevDist < dist * 0.5 && this.speed > 20;
        }
    }

    updateMesh(dt, input) {
        if (!this.mesh) return;
        this.mesh.position.set(this.x, this.y, this.z);
        this.mesh.rotation.y = this.angle;

        // Body lean
        const targetLean = (input.left ? 0.06 : 0) + (input.right ? -0.06 : 0);
        const leanMult = this.speed / PHYS.maxSpeed;
        if (this.bodyMesh) {
            this.bodyMesh.parent.rotation.z += (targetLean * leanMult - this.bodyMesh.parent.rotation.z) * 0.1;
        }

        // Wheel spin
        this.wheels.forEach(w => {
            w.rotation.x += this.speed * dt * 0.3;
        });

        // Shield visibility
        if (this.shieldMesh) {
            this.shieldMesh.visible = this.shieldActive;
            if (this.shieldActive) this.shieldMesh.rotation.y += dt * 2;
        }

        // Star glow
        if (this.starActive && this.bodyMesh) {
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            this.bodyMesh.material.emissive = new THREE.Color(1 * pulse, 0.8 * pulse, 0);
            this.bodyMesh.material.emissiveIntensity = 0.5;
        } else if (this.bodyMesh && this.bodyMesh.material.emissiveIntensity > 0) {
            this.bodyMesh.material.emissive = new THREE.Color(0, 0, 0);
            this.bodyMesh.material.emissiveIntensity = 0;
        }
    }

    activateItem() {
        if (!this.heldItem) return;
        const item = this.heldItem;
        this.heldItem = null;

        switch (item.id) {
            case 'boost':
                this.speed += 45;
                Particles.emit(this.x, this.y + 0.5, this.z, 'boost', 10);
                Audio.play('boost', { volume: 0.5 });
                break;
            case 'shield':
                this.shieldActive = true;
                Audio.play('pickup', { volume: 0.4 });
                break;
            case 'missile':
                Items.fireMissile(this);
                Audio.play('missile', { volume: 0.5 });
                break;
            case 'oil':
                Items.dropHazard(this, 'oil');
                break;
            case 'banana':
                Items.dropHazard(this, 'banana');
                break;
            case 'star':
                this.starActive = true;
                this.starTimer = 5;
                this.speed += 30;
                Audio.play('star', { volume: 0.5 });
                break;
            case 'lightning':
                GAME.allCars.forEach(c => {
                    if (c !== this && !c.shieldActive) {
                        c.slowTimer = 3;
                        c.speed *= 0.4;
                    }
                });
                Audio.play('lightning', { volume: 0.5 });
                break;
            case 'magnet':
                this.magnetActive = true;
                this.magnetTimer = 4;
                break;
        }
    }

    hitByAttack(attackType) {
        if (this.starActive) return;
        if (this.shieldActive) {
            this.shieldActive = false;
            Particles.emit(this.x, this.y + 1, this.z, 'spark', 10);
            Audio.play('hit', { volume: 0.3 });
            return;
        }
        switch (attackType) {
            case 'missile':
                this.speed *= 0.3;
                this.stunTimer = 1.5;
                break;
            case 'oil':
                this.angle += (Math.random() - 0.5) * 1.5;
                this.speed *= 0.6;
                this.stunTimer = 0.8;
                break;
            case 'banana':
                this.angle += (Math.random() - 0.5) * 2;
                this.speed *= 0.5;
                this.stunTimer = 1;
                break;
        }
        Particles.emit(this.x, this.y + 1, this.z, 'spark', 8);
        Audio.play('hit', { volume: 0.4 });
    }

    respawn(trackData) {
        if (!trackData || !trackData.waypoints) return;
        const wp = trackData.waypoints[this.checkpoint];
        this.x = wp.x;
        this.y = (wp.y || 0) + 2;
        this.z = wp.z;
        this.speed = 30;
        this.airborne = false;
        this.vy = 0;
        const next = trackData.waypoints[(this.checkpoint + 1) % trackData.waypoints.length];
        this.angle = Math.atan2(next.x - wp.x, next.z - wp.z);
    }

    getSpeedKPH() {
        return Math.round(Math.abs(this.speed) * 3.6);
    }
}
