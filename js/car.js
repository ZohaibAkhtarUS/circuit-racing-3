// ============================================================
// CIRCUIT RACING 1 — Car Class + Enhanced Model
// ============================================================

function createCarMesh(colorKey) {
    const c = CAR_COLORS[colorKey];
    const group = new THREE.Group();
    if (!toonGradient) toonGradient = createToonGradient();

    // Use MeshStandardMaterial for metallic paint look
    const bodyMat = new THREE.MeshStandardMaterial({
        color: c.body, roughness: 0.3, metalness: 0.6,
        envMapIntensity: 0.5
    });
    const accentMat = new THREE.MeshStandardMaterial({
        color: c.accent, roughness: 0.4, metalness: 0.5
    });

    // Car body - smooth extruded shape with bevel
    const shape = new THREE.Shape();
    shape.moveTo(-2, 0);
    shape.lineTo(2, 0);
    shape.quadraticCurveTo(2.3, 0, 2.3, 0.3);
    shape.lineTo(2.1, 0.5);
    shape.lineTo(1.2, 0.5);
    shape.quadraticCurveTo(0.9, 1.0, 0.7, 1.1);
    shape.lineTo(-0.5, 1.1);
    shape.quadraticCurveTo(-1.0, 1.05, -1.3, 0.7);
    shape.lineTo(-1.8, 0.5);
    shape.quadraticCurveTo(-2.2, 0.3, -2.2, 0.15);
    shape.lineTo(-2, 0);

    const bodyGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 1.8, bevelEnabled: true, bevelThickness: 0.12,
        bevelSize: 0.12, bevelSegments: 3
    });
    bodyGeo.center();
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.y = Math.PI / 2;
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);

    // Windshield
    const wsShape = new THREE.Shape();
    wsShape.moveTo(-0.75, 0); wsShape.lineTo(0.75, 0);
    wsShape.quadraticCurveTo(0.7, 0.4, 0, 0.45);
    wsShape.quadraticCurveTo(-0.7, 0.4, -0.75, 0);
    const wsGeo = new THREE.ShapeGeometry(wsShape);
    const wsMat = new THREE.MeshPhongMaterial({ color: 0x88ccee, transparent: true, opacity: 0.55, shininess: 140 });
    const ws = new THREE.Mesh(wsGeo, wsMat);
    ws.position.set(0, 1.0, 0.95);
    ws.rotation.x = -0.35;
    group.add(ws);

    // Rear window
    const rwGeo = new THREE.ShapeGeometry(wsShape);
    const rw = new THREE.Mesh(rwGeo, new THREE.MeshPhongMaterial({ color: 0x88ccee, transparent: true, opacity: 0.4, shininess: 100 }));
    rw.position.set(0, 0.95, -1.15);
    rw.rotation.x = 0.4;
    rw.scale.set(0.8, 0.7, 1);
    group.add(rw);

    // Wheels with hubs - store references for animation
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const hubGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.3, 8);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.3, metalness: 0.7 });
    const wheelPositions = [[-1.05, 0.38, 1.15], [1.05, 0.38, 1.15], [-1.05, 0.38, -1.15], [1.05, 0.38, -1.15]];
    group.userData.wheels = [];
    wheelPositions.forEach(([x, y, z]) => {
        const wheelGroup = new THREE.Group();
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        wheelGroup.add(wheel);
        const hub = new THREE.Mesh(hubGeo, hubMat);
        hub.rotation.z = Math.PI / 2;
        wheelGroup.add(hub);
        wheelGroup.position.set(x, y, z);
        group.add(wheelGroup);
        group.userData.wheels.push(wheelGroup);
    });

    // Spoiler
    const spoilerSupGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);
    const spoilerWingGeo = new THREE.BoxGeometry(1.6, 0.08, 0.5);
    [-0.5, 0.5].forEach(xOff => {
        const sup = new THREE.Mesh(spoilerSupGeo, accentMat);
        sup.position.set(xOff, 1.15, -1.7);
        group.add(sup);
    });
    const wing = new THREE.Mesh(spoilerWingGeo, accentMat);
    wing.position.set(0, 1.42, -1.7);
    wing.castShadow = true;
    group.add(wing);

    // Side mirrors
    const mirrorMat = new THREE.MeshStandardMaterial({ color: c.body, roughness: 0.3, metalness: 0.6 });
    [-1, 1].forEach(side => {
        const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.3), mirrorMat);
        mirror.position.set(side * 1.1, 0.85, 0.5);
        group.add(mirror);
    });

    // Exhaust pipes
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.3, metalness: 0.8 });
    [-0.35, 0.35].forEach(xOff => {
        const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.4, 8), exhaustMat);
        exhaust.position.set(xOff, 0.25, -2.2);
        exhaust.rotation.x = Math.PI / 2;
        group.add(exhaust);
    });

    // Headlights (emissive)
    const hlGeo = new THREE.SphereGeometry(0.14, 8, 6);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    [[-0.55, 0.55, 2.1], [0.55, 0.55, 2.1]].forEach(([x, y, z]) => {
        const hl = new THREE.Mesh(hlGeo, hlMat);
        hl.position.set(x, y, z);
        group.add(hl);
    });

    // Taillights - stored for brake light effect
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    const taillights = [];
    [[-0.55, 0.55, -2.1], [0.55, 0.55, -2.1]].forEach(([x, y, z]) => {
        const tl = new THREE.Mesh(hlGeo, tlMat);
        tl.position.set(x, y, z);
        group.add(tl);
        taillights.push(tl);
    });
    group.userData.taillights = taillights;
    group.userData.tlMat = tlMat;

    // Outline (cel-shade edge)
    const outlineBody = body.clone();
    outlineBody.material = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
    outlineBody.scale.set(1.04, 1.06, 1.04);
    outlineBody.position.copy(body.position);
    outlineBody.rotation.copy(body.rotation);
    group.add(outlineBody);

    // Headlight glow
    const spotLight = new THREE.SpotLight(0xffffcc, 0.4, 25, 0.4, 0.6);
    spotLight.position.set(0, 0.8, 2.5);
    spotLight.target.position.set(0, 0, 10);
    group.add(spotLight);
    group.add(spotLight.target);

    return group;
}

class GameCar {
    constructor(x, z, angle, colorKey, playerIdx) {
        this.colorKey = colorKey;
        this.playerIndex = playerIdx;
        this.mesh = createCarMesh(colorKey);
        this.mesh.position.set(x, 0, z);
        this.mesh.rotation.y = angle;
        scene.add(this.mesh);

        this.x = x; this.z = z; this.angle = angle;
        this.carMaxSpeed = CAR_COLORS[colorKey].topSpeed || PHYS.maxSpeed;
        this.speed = 0; this.vx = 0; this.vz = 0;
        this.vy = 0; this.airTime = 0; this.isAirborne = false;
        this.isDrifting = false; this.driftAngle = 0; this.driftCharge = 0;
        this.bodyRoll = 0; this.bodyPitch = 0;

        this.lap = 0; this.checkpoint = 0; this.finished = false;
        this.finishTime = 0; this.lapTimes = []; this.lapStartTime = 0; this.raceProgress = 0;

        this.nitroActive = false; this.nitroTimer = 0; this.nitroCooldownTimer = 0;
        this.heldItem = null; this.shieldActive = false; this.shieldMesh = null;
        this.oilCooldown = 0;
        this.lastPos = 0;
        this.driverName = '';
        this.driverTitle = '';

        // Star power-up
        this.starActive = false; this.starTimer = 0; this.starMesh = null;
        // Magnet power-up
        this.magnetActive = false; this.magnetTimer = 0;
        // Lightning slowdown
        this.lightningSlowed = false; this.lightningSlowTimer = 0;
        // Drift scoring
        this.driftScoreTotal = 0;
        this.currentDriftDuration = 0;
        // Horn
        this.hornBubble = null; this.hornTimer = 0;
        // Braking state
        this.isBraking = false;
    }

    update(dt, input) {
        if (this.finished) { this.speed *= 0.95; this.applyPosition(dt); return; }
        if (this.oilCooldown > 0) this.oilCooldown -= dt;

        // Star timer
        if (this.starActive) {
            this.starTimer -= dt;
            if (this.starTimer <= 0) {
                this.starActive = false;
                if (this.starMesh) { this.starMesh.visible = false; }
            }
        }

        // Magnet effect
        if (this.magnetActive) {
            this.magnetTimer -= dt;
            if (this.magnetTimer <= 0) this.magnetActive = false;
            else if (track) {
                // Pull toward 1st place car
                const sorted = [...allCars].sort((a, b) => b.raceProgress - a.raceProgress);
                const leader = sorted[0];
                if (leader !== this) {
                    const dx = leader.x - this.x, dz = leader.z - this.z;
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    if (dist > 5) {
                        this.x += (dx / dist) * 15 * dt;
                        this.z += (dz / dist) * 15 * dt;
                    }
                }
            }
        }

        // Lightning slowdown
        if (this.lightningSlowed) {
            this.lightningSlowTimer -= dt;
            if (this.lightningSlowTimer <= 0) this.lightningSlowed = false;
        }

        const baseMax = this.carMaxSpeed || PHYS.maxSpeed;
        const effectiveMax = this.starActive ? baseMax + PHYS.nitroBoost * 1.5 :
                             this.nitroActive ? baseMax + PHYS.nitroBoost :
                             this.lightningSlowed ? baseMax * 0.5 : baseMax;
        const effectiveAccel = this.nitroActive ? PHYS.accel * 1.5 :
                               this.lightningSlowed ? PHYS.accel * 0.6 : PHYS.accel;

        // Auto-gas for kid mode on mobile
        const autoGas = (selectedDifficulty === 'kid' && isMobile);
        const actualUp = input.up || autoGas;

        // Accel/brake
        this.isBraking = false;
        if (actualUp) this.speed += effectiveAccel * dt;
        else if (input.down) {
            this.isBraking = true;
            if (this.speed > 2) this.speed -= PHYS.brake * dt;
            else this.speed -= PHYS.accel * 0.5 * dt;
        } else {
            this.speed *= PHYS.friction;
        }
        this.speed = Math.max(-PHYS.reverseMax, Math.min(effectiveMax, this.speed));

        // Off-track slowdown (reduced penalty for kid mode)
        if (track && !this.isOnTrack()) {
            this.speed *= selectedDifficulty === 'kid' ? 0.97 : PHYS.offTrackMult;
        }

        // Auto-steering assist for kid mode
        if (selectedDifficulty === 'kid' && this.playerIndex >= 0 && track) {
            this.applySteeringAssist(input);
        }

        // Steering
        const canTurn = Math.abs(this.speed) > PHYS.minTurnSpeed;
        if (canTurn) {
            let turnRate = PHYS.turnSpeed;
            if (this.isDrifting) turnRate *= PHYS.driftTurnMult;
            turnRate *= (1 - (Math.abs(this.speed) / effectiveMax) * 0.3);
            const dir = this.speed >= 0 ? 1 : -1;
            if (input.left) this.angle += turnRate * dt * dir;
            if (input.right) this.angle -= turnRate * dt * dir;
        }

        // Drift
        const wasDrifting = this.isDrifting;
        this.isDrifting = input.drift && Math.abs(this.speed) > 15;
        if (this.isDrifting) {
            this.speed *= PHYS.driftFriction;
            const target = input.left ? 0.35 : input.right ? -0.35 : 0;
            this.driftAngle += (target - this.driftAngle) * 0.15;
            this.driftCharge = Math.min(this.driftCharge + dt, 2.0);
            this.currentDriftDuration += dt;
            if (Math.random() < 0.15) playDriftSound();
        } else {
            if (wasDrifting && this.driftCharge > 0.5) {
                this.speed += this.driftCharge * 15;
                for (let i = 0; i < 5; i++) emitParticle(this.x, this.mesh.position.y, this.z, 'boost');
                playDriftBoostRelease();
                // Drift scoring
                if (this.playerIndex >= 0 && this.currentDriftDuration > 0.5) {
                    const points = this.currentDriftDuration < 1 ? 50 :
                                   this.currentDriftDuration < 2 ? 200 :
                                   Math.floor(500 * this.currentDriftDuration / 2);
                    this.driftScoreTotal += points;
                    driftScore += points;
                    driftCombo++;
                    driftComboTimer = 2;
                    driftPopups.push({ text: `+${points}`, x: this.x, y: this.mesh.position.y + 4, z: this.z, life: 1.5 });
                    if (driftCombo > 1) {
                        driftPopups.push({ text: `x${driftCombo} COMBO!`, x: this.x, y: this.mesh.position.y + 5.5, z: this.z, life: 1.5 });
                    }
                }
            }
            this.currentDriftDuration = 0;
            this.driftCharge = 0;
            this.driftAngle *= 0.85;
        }

        // Nitro
        if (input.nitro && this.nitroCooldownTimer <= 0 && !this.nitroActive) {
            this.nitroActive = true;
            this.nitroTimer = PHYS.nitroDuration;
            playBoostActivate();
        }
        if (this.nitroActive) {
            this.nitroTimer -= dt;
            if (this.nitroTimer <= 0) {
                this.nitroActive = false;
                this.nitroCooldownTimer = PHYS.nitroCooldown;
            }
        }
        if (this.nitroCooldownTimer > 0) this.nitroCooldownTimer -= dt;

        // Use item
        if (input.useItem && this.heldItem) {
            this.activateItem();
        }

        // Horn
        if (input.horn && this.hornTimer <= 0) {
            playHorn();
            this.hornTimer = 0.5;
            // Create HONK bubble
            if (!this.hornBubble) {
                const canvas = document.createElement('canvas');
                canvas.width = 128; canvas.height = 64;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('HONK!', 64, 40);
                const tex = new THREE.CanvasTexture(canvas);
                this.hornBubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
                this.hornBubble.scale.set(3, 1.5, 1);
                this.mesh.add(this.hornBubble);
            }
            this.hornBubble.visible = true;
            this.hornBubble.position.set(0, 3, 0);
        }
        if (this.hornTimer > 0) {
            this.hornTimer -= dt;
            if (this.hornBubble && this.hornTimer <= 0) {
                this.hornBubble.visible = false;
            }
        }

        if (Math.abs(this.speed) < 0.3 && !actualUp && !input.down) this.speed = 0;

        // Body dynamics (roll/pitch)
        const targetRoll = (input.left ? -0.08 : input.right ? 0.08 : 0) * (Math.abs(this.speed) / (this.carMaxSpeed || PHYS.maxSpeed));
        this.bodyRoll += (targetRoll - this.bodyRoll) * 0.1;
        const targetPitch = this.isBraking ? 0.05 : (input.up && this.speed > 30 ? -0.03 : 0);
        this.bodyPitch += (targetPitch - this.bodyPitch) * 0.1;

        this.applyPosition(dt);
        this.updateCheckpoints();

        // Update wheel rotation
        if (this.mesh.userData.wheels) {
            const wheelSpeed = this.speed * 0.1;
            this.mesh.userData.wheels.forEach(w => {
                w.children[0].rotation.x += wheelSpeed * dt;
                w.children[1].rotation.x += wheelSpeed * dt;
            });
        }

        // Update brake lights
        if (this.mesh.userData.taillights) {
            const brightness = this.isBraking ? 0xff4444 : 0xff2222;
            const intensity = this.isBraking ? 1 : 0.5;
            this.mesh.userData.taillights.forEach(tl => {
                tl.material.color.setHex(brightness);
            });
        }

        // Star glow effect
        if (this.starActive) {
            if (!this.starMesh) {
                this.starMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(3, 12, 8),
                    new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0.2 })
                );
                this.mesh.add(this.starMesh);
            }
            this.starMesh.visible = true;
            this.starMesh.material.opacity = 0.15 + Math.sin(performance.now() * 0.01) * 0.1;
            emitParticle(this.x, this.mesh.position.y, this.z, 'star');
        }

        // Engine sound
        if (this.playerIndex === 0) updateEngineSound(this.speed);
    }

    applySteeringAssist(input) {
        if (!track) return;
        // Find nearest waypoint
        let minD = Infinity, closestIdx = 0;
        for (let i = 0; i < track.waypoints.length; i++) {
            const dx = this.x - track.waypoints[i].x, dz = this.z - track.waypoints[i].z;
            const d = dx * dx + dz * dz;
            if (d < minD) { minD = d; closestIdx = i; }
        }
        // Look ahead a few waypoints
        const lookAhead = (closestIdx + 5) % track.waypoints.length;
        const target = track.waypoints[lookAhead];
        const dx = target.x - this.x, dz = target.z - this.z;
        const targetAngle = Math.atan2(dx, dz);
        let angleDiff = targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Gentle nudge toward track
        if (!input.left && !input.right && Math.abs(angleDiff) > 0.1) {
            this.angle += angleDiff * 0.03;
        }
    }

    activateItem() {
        const item = this.heldItem;
        this.heldItem = null;

        if (item === ITEMS.BOOST) {
            this.speed += 40;
            for (let i = 0; i < 8; i++) emitParticle(this.x, this.mesh.position.y, this.z, 'boost');
            playBoostActivate();
        } else if (item === ITEMS.SHIELD) {
            this.shieldActive = true;
            if (!this.shieldMesh) {
                this.shieldMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(2.5, 12, 8),
                    new THREE.MeshBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.25, wireframe: true })
                );
                this.mesh.add(this.shieldMesh);
            }
            this.shieldMesh.visible = true;
            playShieldActivate();
        } else if (item === ITEMS.MISSILE) {
            const missile = new THREE.Mesh(
                new THREE.ConeGeometry(0.3, 1.5, 6),
                new THREE.MeshBasicMaterial({ color: 0xff3333 })
            );
            missile.position.set(this.x + Math.sin(this.angle) * 3, this.mesh.position.y + 0.8, this.z + Math.cos(this.angle) * 3);
            missile.rotation.x = Math.PI / 2;
            missile.rotation.z = -this.angle;
            scene.add(missile);
            projectiles.push({ mesh: missile, angle: this.angle, owner: this, life: 3 });
            playMissileLaunch();
        } else if (item === ITEMS.OIL) {
            const oil = new THREE.Mesh(
                new THREE.CircleGeometry(2, 12),
                new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
            );
            oil.rotation.x = -Math.PI / 2;
            oil.position.set(this.x - Math.sin(this.angle) * 4, this.mesh.position.y + 0.05, this.z - Math.cos(this.angle) * 4);
            scene.add(oil);
            hazards.push({ mesh: oil, owner: this, life: 8, type: 'oil' });
        } else if (item === ITEMS.BANANA) {
            const banana = new THREE.Mesh(
                new THREE.SphereGeometry(0.6, 8, 6),
                new THREE.MeshStandardMaterial({ color: 0xffdd00, roughness: 0.5 })
            );
            banana.position.set(this.x - Math.sin(this.angle) * 4, this.mesh.position.y + 0.6, this.z - Math.cos(this.angle) * 4);
            banana.scale.set(1, 0.5, 1.5);
            scene.add(banana);
            hazards.push({ mesh: banana, owner: this, life: 10, type: 'banana' });
        } else if (item === ITEMS.STAR) {
            this.starActive = true;
            this.starTimer = 5;
            this.speed += 30;
            playStarPowerUp();
        } else if (item === ITEMS.LIGHTNING) {
            // Slow all other cars
            for (const car of allCars) {
                if (car !== this) {
                    car.lightningSlowed = true;
                    car.lightningSlowTimer = 3;
                    car.speed *= 0.5;
                }
            }
            lightningFlashTimer = 0.3;
            playLightning();
            for (const car of allCars) {
                if (car !== this) {
                    for (let i = 0; i < 5; i++) emitParticle(car.x, car.mesh.position.y + 2, car.z, 'lightning_spark');
                }
            }
        } else if (item === ITEMS.MAGNET) {
            this.magnetActive = true;
            this.magnetTimer = 3;
            playMagnet();
        }
    }

    applyPosition(dt) {
        this.vx = Math.sin(this.angle) * this.speed;
        this.vz = Math.cos(this.angle) * this.speed;
        let newX = this.x + this.vx * dt;
        let newZ = this.z + this.vz * dt;

        // Wall collision
        for (const w of trackWalls) {
            const ax = w.x2 - w.x1, az = w.z2 - w.z1;
            const bx = newX - w.x1, bz = newZ - w.z1;
            const segLen2 = ax * ax + az * az;
            if (segLen2 < 0.01) continue;
            const t = Math.max(0, Math.min(1, (bx * ax + bz * az) / segLen2));
            const cx = w.x1 + t * ax, cz = w.z1 + t * az;
            const dx = newX - cx, dz = newZ - cz;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 1.5) {
                const push = 1.5 - dist;
                newX += (dx / dist) * push;
                newZ += (dz / dist) * push;
                if (!this.starActive) this.speed *= PHYS.wallSpeedLoss;
                playCollision();
                break;
            }
        }
        this.x = newX; this.z = newZ;

        // Hard track clamp
        if (track) {
            let minD = Infinity, closestIdx = 0;
            for (let i = 0; i < track.waypoints.length; i++) {
                const dx = this.x - track.waypoints[i].x, dz = this.z - track.waypoints[i].z;
                const d = dx * dx + dz * dz;
                if (d < minD) { minD = d; closestIdx = i; }
            }
            const distFromCenter = Math.sqrt(minD);
            const maxDist = TRACK_ROAD_W / 2 + 1.2;
            if (distFromCenter > maxDist) {
                const wp = track.waypoints[closestIdx];
                const dx = this.x - wp.x, dz = this.z - wp.z;
                const len = Math.sqrt(dx * dx + dz * dz);
                if (len > 0.01) {
                    this.x = wp.x + (dx / len) * maxDist;
                    this.z = wp.z + (dz / len) * maxDist;
                    this.speed *= 0.6;
                }
            }
        }

        // Elevation + airborne
        const trackY = track ? getTrackHeight(this.x, this.z, track.waypoints) : 0;

        if (track && track.ramps && !this.isAirborne) {
            for (const ramp of track.ramps) {
                const dx = this.x - ramp.pos.x, dz = this.z - ramp.pos.z;
                if (dx * dx + dz * dz < ramp.radius * ramp.radius && this.speed > 30) {
                    this.vy = 10;
                    this.isAirborne = true;
                    this.airTime = 0;
                }
            }
        }

        if (this.isAirborne) {
            this.airTime += dt;
            this.vy -= PHYS.gravity * dt;
            const airY = trackY + this.vy * this.airTime;
            if (airY <= trackY && this.airTime > 0.1) {
                this.isAirborne = false;
                this.vy = 0;
                this.airTime = 0;
                this.mesh.position.y = trackY;
            } else {
                this.mesh.position.y = Math.max(trackY, airY);
            }
        } else {
            this.mesh.position.y = trackY;
        }

        this.mesh.position.x = this.x;
        this.mesh.position.z = this.z;
        this.mesh.rotation.y = this.angle + this.driftAngle * 0.4;
        this.mesh.rotation.z = this.bodyRoll;
        this.mesh.rotation.x = this.bodyPitch;
    }

    isOnTrack() {
        if (!track) return true;
        let minD = Infinity;
        for (const p of track.waypoints) {
            const dx = this.x - p.x, dz = this.z - p.z;
            const d = dx * dx + dz * dz;
            if (d < minD) minD = d;
        }
        return Math.sqrt(minD) < TRACK_ROAD_W * 0.6;
    }

    updateCheckpoints() {
        if (!track || this.finished) return;
        const cps = track.checkpoints;
        const nextCp = (this.checkpoint + 1) % cps.length;
        const cp = cps[nextCp];
        const dx = this.x - cp.pos.x, dz = this.z - cp.pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < cp.radius) {
            this.checkpoint = nextCp;
            if (nextCp === 0) {
                if (this.lap > 0) {
                    this.lapTimes.push(performance.now() - this.lapStartTime);
                    this.lapStartTime = performance.now();
                    if (this.playerIndex >= 0) playLapComplete();
                }
                this.lap++;
                if (this.lap === 1) this.lapStartTime = performance.now();
                if (this.lap > RACE_LAPS) { this.finished = true; this.finishTime = performance.now(); }
            }
        }
        this.raceProgress = (this.lap - 1) * cps.length + this.checkpoint + (1 - Math.min(dist / cp.radius, 1)) * 0.5;
    }

    getSpeedKPH() { return Math.abs(Math.round(this.speed * 2.8)); }
    destroy() { scene.remove(this.mesh); }
}
