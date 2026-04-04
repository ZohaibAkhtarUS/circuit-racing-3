// ============================================================
// CIRCUIT RACING 1 — Power-Up System
// ============================================================

function spawnItemBoxes(wp) {
    itemBoxes = [];
    for (let i = 0; i < wp.length; i += 10) {
        const p = wp[i];
        const group = new THREE.Group();

        // Rainbow spinning "?" block
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            new THREE.MeshStandardMaterial({
                color: 0xffcc00,
                emissive: 0xffaa00, emissiveIntensity: 0.3,
                roughness: 0.3, metalness: 0.5
            })
        );
        group.add(box);

        // "?" mark on each face
        const qCanvas = document.createElement('canvas');
        qCanvas.width = 64; qCanvas.height = 64;
        const qctx = qCanvas.getContext('2d');
        qctx.fillStyle = '#ffcc00';
        qctx.fillRect(0, 0, 64, 64);
        qctx.fillStyle = '#ffffff';
        qctx.font = 'bold 48px Arial';
        qctx.textAlign = 'center';
        qctx.fillText('?', 32, 48);
        const qTex = new THREE.CanvasTexture(qCanvas);
        box.material.map = qTex;

        // Glow ring around item box
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1.8, 0.1, 8, 16),
            new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0.4 })
        );
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        group.position.set(p.x, p.y + 1.8, p.z);
        scene.add(group);
        itemBoxes.push({ mesh: group, pos: p.clone(), active: true, respawnTimer: 0, baseY: p.y + 1.8 });
    }
}

function updateItemBoxes(dt) {
    const t = performance.now() * 0.001;
    const itemList = ITEM_LISTS[selectedDifficulty] || ITEM_LISTS.easy;

    for (const ib of itemBoxes) {
        if (ib.active) {
            ib.mesh.rotation.y += dt * 2.5;
            ib.mesh.position.y = ib.baseY + Math.sin(t * 2 + ib.pos.x) * 0.5;
            ib.mesh.visible = true;

            // Rainbow color cycle
            const hue = (t * 0.3 + ib.pos.x * 0.01) % 1;
            const rgb = hslToRgb(hue, 1, 0.6);
            ib.mesh.children[0].material.color.setRGB(rgb[0], rgb[1], rgb[2]);
            ib.mesh.children[0].material.emissive.setRGB(rgb[0] * 0.3, rgb[1] * 0.3, rgb[2] * 0.3);

            // Glow ring pulse
            if (ib.mesh.children[1]) {
                ib.mesh.children[1].rotation.z = t * 2;
                ib.mesh.children[1].material.opacity = 0.3 + Math.sin(t * 3) * 0.15;
            }

            // Check car collision
            for (const car of allCars) {
                if (car.heldItem) continue;
                const dx = car.x - ib.pos.x, dz = car.z - ib.pos.z;
                if (dx * dx + dz * dz < 12) {
                    car.heldItem = itemList[Math.floor(Math.random() * itemList.length)];
                    ib.active = false;
                    ib.mesh.visible = false;
                    ib.respawnTimer = 4;
                    flashItemPickup();
                    playItemPickup();
                    // Auto-use items on mobile for kid mode
                    if (isMobile && selectedDifficulty === 'kid' && car.playerIndex >= 0) {
                        setTimeout(() => { if (car.heldItem) car.activateItem(); }, 500);
                    }
                }
            }
        } else {
            ib.respawnTimer -= dt;
            if (ib.respawnTimer <= 0) { ib.active = true; }
        }
    }
}

function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.life -= dt;
        if (p.life <= 0) {
            scene.remove(p.mesh);
            projectiles.splice(i, 1);
            continue;
        }
        p.mesh.position.x += Math.sin(p.angle) * 120 * dt;
        p.mesh.position.z += Math.cos(p.angle) * 120 * dt;

        // Trail particles
        if (Math.random() < 0.3) {
            emitParticle(p.mesh.position.x, p.mesh.position.y, p.mesh.position.z, 'fire');
        }

        for (const car of allCars) {
            if (car === p.owner) continue;
            const dx = car.x - p.mesh.position.x, dz = car.z - p.mesh.position.z;
            if (dx * dx + dz * dz < 6) {
                if (car.starActive) continue;
                if (car.shieldActive) {
                    car.shieldActive = false;
                    if (car.shieldMesh) car.shieldMesh.visible = false;
                } else {
                    car.speed *= 0.4;
                    car.driftAngle = 1.5;
                    for (let j = 0; j < 8; j++) emitParticle(car.x, car.mesh.position.y, car.z, 'spark');
                }
                playCollision();
                scene.remove(p.mesh);
                projectiles.splice(i, 1);
                break;
            }
        }
    }
}

function updateHazards(dt) {
    for (let i = hazards.length - 1; i >= 0; i--) {
        const h = hazards[i];
        h.life -= dt;
        if (h.life <= 0) {
            scene.remove(h.mesh);
            hazards.splice(i, 1);
            continue;
        }
        // Banana spin animation
        if (h.type === 'banana') {
            h.mesh.rotation.y += dt * 3;
        }

        for (const car of allCars) {
            if (car === h.owner || car.starActive) continue;
            const dx = car.x - h.mesh.position.x, dz = car.z - h.mesh.position.z;
            if (dx * dx + dz * dz < 6 && !car.oilCooldown) {
                if (car.shieldActive) {
                    car.shieldActive = false;
                    if (car.shieldMesh) car.shieldMesh.visible = false;
                } else {
                    car.angle += Math.PI * (h.type === 'banana' ? 0.7 : 0.5);
                    car.speed *= 0.4;
                    car.oilCooldown = 1.5;
                    if (h.type === 'banana') {
                        playBananaSlip();
                        for (let j = 0; j < 5; j++) emitParticle(car.x, car.mesh.position.y, car.z, 'star');
                    }
                }
                // Remove hazard on hit
                scene.remove(h.mesh);
                hazards.splice(i, 1);
                break;
            }
        }
    }
}

function updateMovingObstacles(dt) {
    for (const obs of movingObstacles) {
        obs.time += dt * obs.speed;
        const offset = Math.sin(obs.time) * obs.range;
        obs.mesh.position.x = obs.center.x + obs.norm.x * offset;
        obs.mesh.position.z = obs.center.z + obs.norm.z * offset;
        obs.mesh.rotation.y += dt;
        for (const car of allCars) {
            if (car.starActive) continue;
            const dx = car.x - obs.mesh.position.x, dz = car.z - obs.mesh.position.z;
            if (dx * dx + dz * dz < 6) {
                car.speed *= -0.3;
                const pushDir = Math.atan2(dx, dz);
                car.x += Math.sin(pushDir) * 3;
                car.z += Math.cos(pushDir) * 3;
                playCollision();
            }
        }
    }
}
