// ===== CIRCUIT RACING 4 - ITEMS =====

const Items = (() => {
    let itemBoxes = [];
    let projectiles = [];
    let hazards = [];

    function init(itemPositions, scene) {
        cleanup(scene);

        itemPositions.forEach((pos, idx) => {
            const box = createItemBox(pos, scene);
            box.userData.index = idx;
            box.userData.respawnTimer = 0;
            box.userData.active = true;
            itemBoxes.push(box);
        });
    }

    function createItemBox(pos, scene) {
        const group = new THREE.Group();

        const boxGeom = new THREE.BoxGeometry(1.8, 1.8, 1.8);

        // Rainbow canvas texture
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 64, 64);
        gradient.addColorStop(0, '#ff0044');
        gradient.addColorStop(0.25, '#ffaa00');
        gradient.addColorStop(0.5, '#00ff44');
        gradient.addColorStop(0.75, '#0088ff');
        gradient.addColorStop(1, '#aa00ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        ctx.strokeStyle = '#ffffff88';
        ctx.lineWidth = 3;
        ctx.strokeRect(8, 8, 48, 48);
        // Question mark
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', 32, 46);

        const tex = new THREE.CanvasTexture(canvas);
        const boxMat = new THREE.MeshStandardMaterial({
            map: tex,
            emissive: 0x332211,
            emissiveIntensity: 0.4,
            roughness: 0.3,
            metalness: 0.5
        });

        const mesh = new THREE.Mesh(boxGeom, boxMat);
        mesh.castShadow = true;
        group.add(mesh);

        group.position.set(pos.x, pos.y, pos.z);
        scene.add(group);

        return group;
    }

    function update(dt, scene) {
        // Animate item boxes
        itemBoxes.forEach(box => {
            if (box.userData.active) {
                box.rotation.y += dt * 1.5;
                box.position.y = box.userData.baseY || box.position.y;
                box.children[0].position.y = Math.sin(Date.now() * 0.003) * 0.3;
            } else {
                box.userData.respawnTimer -= dt;
                if (box.userData.respawnTimer <= 0) {
                    box.userData.active = true;
                    box.visible = true;
                }
            }
        });

        // Store base Y
        itemBoxes.forEach(box => {
            if (!box.userData.baseY) box.userData.baseY = box.position.y;
        });

        // Check car-box collisions
        GAME.allCars.forEach(car => {
            if (car.heldItem) return;
            itemBoxes.forEach(box => {
                if (!box.userData.active) return;
                const dx = car.x - box.position.x;
                const dz = car.z - box.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < 3) {
                    car.heldItem = getRandomItem(car);
                    box.userData.active = false;
                    box.visible = false;
                    box.userData.respawnTimer = 4 + Math.random();
                    if (car.isPlayer) Audio.play('pickup', { volume: 0.5 });
                    Particles.emit(box.position.x, box.position.y, box.position.z, 'star', 5);
                }
            });
        });

        // Update projectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.mesh.position.x += Math.sin(p.angle) * p.speed * dt;
            p.mesh.position.z += Math.cos(p.angle) * p.speed * dt;
            p.life -= dt;

            // Trail
            if (Math.random() > 0.5) {
                Particles.emit(p.mesh.position.x, p.mesh.position.y, p.mesh.position.z, 'fire', 1);
            }

            // Hit check
            let hit = false;
            GAME.allCars.forEach(car => {
                if (car === p.owner) return;
                const dx = car.x - p.mesh.position.x;
                const dz = car.z - p.mesh.position.z;
                if (Math.sqrt(dx * dx + dz * dz) < 2.5) {
                    car.hitByAttack('missile');
                    hit = true;
                }
            });

            if (hit || p.life <= 0) {
                scene.remove(p.mesh);
                Particles.emit(p.mesh.position.x, p.mesh.position.y, p.mesh.position.z, 'spark', 8);
                projectiles.splice(i, 1);
            }
        }

        // Update hazards
        for (let i = hazards.length - 1; i >= 0; i--) {
            const h = hazards[i];
            h.life -= dt;
            h.mesh.rotation.y += dt * (h.type === 'banana' ? 2 : 0.5);

            // Hit check
            GAME.allCars.forEach(car => {
                if (car === h.owner && h.ownerGrace > 0) return;
                const dx = car.x - h.mesh.position.x;
                const dz = car.z - h.mesh.position.z;
                if (Math.sqrt(dx * dx + dz * dz) < 2) {
                    car.hitByAttack(h.type);
                    h.life = 0;
                }
            });
            h.ownerGrace -= dt;

            if (h.life <= 0) {
                scene.remove(h.mesh);
                hazards.splice(i, 1);
            }
        }
    }

    function getRandomItem(car) {
        // Weight by position - cars behind get better items
        const position = car.isPlayer ? getCarPosition(car) : Math.floor(Math.random() * GAME.allCars.length);
        const positionFactor = position / Math.max(1, GAME.allCars.length - 1); // 0=first, 1=last

        const weights = ITEM_TYPES.map(item => {
            let w = item.weight;
            if (positionFactor > 0.5) {
                // Behind: more attack and special items
                if (item.effect === 'attack' || item.effect === 'special') w *= 2;
            } else {
                // Ahead: more defense items
                if (item.effect === 'defense') w *= 2;
                if (item.effect === 'special') w *= 0.3;
            }
            return w;
        });

        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let rand = Math.random() * totalWeight;
        for (let i = 0; i < ITEM_TYPES.length; i++) {
            rand -= weights[i];
            if (rand <= 0) return ITEM_TYPES[i];
        }
        return ITEM_TYPES[0];
    }

    function getCarPosition(car) {
        const sorted = [...GAME.allCars].sort((a, b) => b.progress - a.progress);
        return sorted.indexOf(car);
    }

    function fireMissile(car) {
        const missileGeom = new THREE.ConeGeometry(0.3, 1.5, 6);
        const missileMat = new THREE.MeshStandardMaterial({
            color: 0xff2200,
            emissive: 0xff4400,
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.7
        });
        const missile = new THREE.Mesh(missileGeom, missileMat);
        missile.rotation.x = Math.PI / 2;
        missile.position.set(car.x, car.y + 0.8, car.z);

        GAME.scene.add(missile);
        projectiles.push({
            mesh: missile,
            angle: car.angle,
            speed: 130,
            life: 4,
            owner: car
        });
    }

    function dropHazard(car, type) {
        const behind = 3.5;
        const hx = car.x - Math.sin(car.angle) * behind;
        const hz = car.z - Math.cos(car.angle) * behind;

        let mesh;
        if (type === 'oil') {
            const geom = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 12);
            const mat = new THREE.MeshStandardMaterial({
                color: 0x222222, transparent: true, opacity: 0.7,
                roughness: 0.1, metalness: 0.8
            });
            mesh = new THREE.Mesh(geom, mat);
        } else {
            const geom = new THREE.SphereGeometry(0.6, 8, 8);
            const mat = new THREE.MeshStandardMaterial({
                color: 0xffee00, roughness: 0.5
            });
            mesh = new THREE.Mesh(geom, mat);
        }

        mesh.position.set(hx, car.y + 0.3, hz);
        GAME.scene.add(mesh);

        hazards.push({
            mesh,
            type,
            life: 10,
            owner: car,
            ownerGrace: 1
        });
    }

    function cleanup(scene) {
        itemBoxes.forEach(b => scene.remove(b));
        projectiles.forEach(p => scene.remove(p.mesh));
        hazards.forEach(h => scene.remove(h.mesh));
        itemBoxes = [];
        projectiles = [];
        hazards = [];
    }

    return { init, update, fireMissile, dropHazard, cleanup };
})();
