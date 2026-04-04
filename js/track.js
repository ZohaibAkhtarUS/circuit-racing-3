// ============================================================
// CIRCUIT RACING 1 — Track Builder + Environment
// ============================================================

function getTrackWaypoints(trackId) {
    const pts = [];
    const segs = 120;
    const cx = 0, cz = 0;

    for (let i = 0; i < segs; i++) {
        const t = (i / segs) * Math.PI * 2;
        let x, y, z;

        if (trackId === 0) {
            // Green Valley - oval with gentle hills
            const rx = 85 + Math.sin(t * 2) * 20;
            const rz = 52 + Math.cos(t * 3) * 12;
            x = cx + Math.cos(t) * rx;
            z = cz + Math.sin(t) * rz;
            y = Math.sin(t * 4) * 2.5 + Math.cos(t * 2) * 1.5;
        } else if (trackId === 1) {
            // Desert Circuit - figure-8 with aggressive elevation
            x = cx + Math.sin(t) * 75;
            z = cz + Math.sin(2 * t) * 48;
            y = Math.sin(t * 3) * 4 + Math.cos(t * 5) * 1.5;
        } else if (trackId === 2) {
            // Mountain Pass - long with switchbacks
            const rx = 90 + Math.sin(t * 3) * 25;
            const rz = 45 + Math.cos(t * 2) * 20;
            x = cx + Math.cos(t) * rx;
            z = cz + Math.sin(t) * rz;
            y = Math.sin(t * 2) * 5 + Math.cos(t * 4) * 2;
        } else {
            // Islamabad GP - flowing with dramatic Margalla Hills elevation
            const rx = 80 + Math.sin(t * 2) * 22 + Math.cos(t * 5) * 8;
            const rz = 55 + Math.cos(t * 3) * 18;
            x = cx + Math.cos(t) * rx;
            z = cz + Math.sin(t) * rz;
            y = Math.sin(t * 2) * 6 + Math.cos(t * 3) * 3 + Math.sin(t * 6) * 1.5;
        }

        pts.push(new THREE.Vector3(x, Math.max(y, 0), z));
    }

    // Smooth 3 iterations
    for (let iter = 0; iter < 3; iter++) {
        const np = [];
        for (let i = 0; i < pts.length; i++) {
            const prev = pts[(i - 1 + pts.length) % pts.length];
            const curr = pts[i];
            const next = pts[(i + 1) % pts.length];
            np.push(new THREE.Vector3(
                curr.x * 0.5 + (prev.x + next.x) * 0.25,
                curr.y * 0.5 + (prev.y + next.y) * 0.25,
                curr.z * 0.5 + (prev.z + next.z) * 0.25
            ));
        }
        pts.length = 0;
        pts.push(...np);
    }
    return pts;
}

function getTrackHeight(x, z, wp) {
    let minD = Infinity, ci = 0;
    for (let i = 0; i < wp.length; i++) {
        const dx = x - wp[i].x, dz = z - wp[i].z;
        const d = dx * dx + dz * dz;
        if (d < minD) { minD = d; ci = i; }
    }
    const ni = (ci + 1) % wp.length;
    const pi = (ci - 1 + wp.length) % wp.length;
    const d1 = Math.sqrt((x - wp[pi].x) ** 2 + (z - wp[pi].z) ** 2);
    const d2 = Math.sqrt((x - wp[ni].x) ** 2 + (z - wp[ni].z) ** 2);
    const total = d1 + d2;
    if (total < 0.01) return wp[ci].y;
    return (wp[pi].y * d2 + wp[ni].y * d1) / total;
}

function buildTrack() {
    const wp = getTrackWaypoints(selectedTrack);
    const roadW = TRACK_ROAD_W;
    const theme = TRACK_THEMES[selectedTrack] || TRACK_THEMES[0];
    trackWalls = [];

    // Ground
    const groundGeo = new THREE.PlaneGeometry(600, 400);
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 512; groundCanvas.height = 512;
    const gctx = groundCanvas.getContext('2d');
    gctx.fillStyle = theme.ground;
    gctx.fillRect(0, 0, 512, 512);
    // Add noise texture
    for (let i = 0; i < 400; i++) {
        const baseColor = theme.ground;
        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);
        gctx.fillStyle = `rgba(${r + (Math.random() - 0.5) * 30 | 0},${g + (Math.random() - 0.5) * 30 | 0},${b + (Math.random() - 0.5) * 20 | 0},0.35)`;
        gctx.beginPath();
        gctx.arc(Math.random() * 512, Math.random() * 512, 3 + Math.random() * 10, 0, Math.PI * 2);
        gctx.fill();
    }
    const groundTex = new THREE.CanvasTexture(groundCanvas);
    groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(8, 6);
    const ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ map: groundTex }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Road ribbon with elevation
    const roadVerts = [], roadUVs = [], roadIdx = [];
    const wallDataL = [], wallDataR = [];

    for (let i = 0; i < wp.length; i++) {
        const curr = wp[i], next = wp[(i + 1) % wp.length];
        const dir = new THREE.Vector3().subVectors(next, curr).normalize();
        const norm = new THREE.Vector3(-dir.z, 0, dir.x);
        const l = curr.clone().add(norm.clone().multiplyScalar(roadW / 2));
        const r = curr.clone().add(norm.clone().multiplyScalar(-roadW / 2));
        roadVerts.push(l.x, curr.y + 0.05, l.z, r.x, curr.y + 0.05, r.z);
        roadUVs.push(0, i / wp.length * 20, 1, i / wp.length * 20);
        const ni = (i + 1) % wp.length;
        roadIdx.push(i * 2, ni * 2, i * 2 + 1, i * 2 + 1, ni * 2, ni * 2 + 1);

        const wOff = roadW / 2 + 1.5;
        const nextDir = new THREE.Vector3().subVectors(wp[(i + 2) % wp.length], next).normalize();
        const nextNorm = new THREE.Vector3(-nextDir.z, 0, nextDir.x);
        const lw = curr.clone().add(norm.clone().multiplyScalar(wOff));
        const rw = curr.clone().add(norm.clone().multiplyScalar(-wOff));
        const nlw = next.clone().add(nextNorm.clone().multiplyScalar(wOff));
        const nrw = next.clone().add(nextNorm.clone().multiplyScalar(-wOff));
        wallDataL.push({ x1: lw.x, z1: lw.z, x2: nlw.x, z2: nlw.z, nx: norm.x, nz: norm.z });
        wallDataR.push({ x1: rw.x, z1: rw.z, x2: nrw.x, z2: nrw.z, nx: -norm.x, nz: -norm.z });
    }
    trackWalls = [...wallDataL, ...wallDataR];

    // Road mesh with better texture
    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));
    roadGeo.setIndex(roadIdx);
    roadGeo.computeVertexNormals();

    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 128; roadCanvas.height = 512;
    const rctx = roadCanvas.getContext('2d');
    // Asphalt base
    rctx.fillStyle = '#3a3a3a';
    rctx.fillRect(0, 0, 128, 512);
    // Noise for asphalt texture
    for (let i = 0; i < 800; i++) {
        rctx.fillStyle = `rgba(${50 + Math.random() * 30 | 0},${50 + Math.random() * 30 | 0},${50 + Math.random() * 30 | 0},0.3)`;
        rctx.fillRect(Math.random() * 128, Math.random() * 512, 2, 2);
    }
    // Tire marks (subtle)
    rctx.strokeStyle = 'rgba(30,30,30,0.15)';
    rctx.lineWidth = 3;
    for (let y = 0; y < 512; y += 64) {
        const x = 40 + Math.sin(y * 0.02) * 8;
        rctx.beginPath(); rctx.moveTo(x, y); rctx.lineTo(x + 2, y + 64); rctx.stroke();
    }
    // Edge lines
    rctx.fillStyle = '#ffffff';
    rctx.fillRect(0, 0, 3, 512);
    rctx.fillRect(125, 0, 3, 512);
    // Center dashes
    for (let y = 0; y < 512; y += 24) {
        rctx.fillStyle = 'rgba(255,255,255,0.5)';
        rctx.fillRect(61, y, 6, 12);
    }
    const roadTex = new THREE.CanvasTexture(roadCanvas);
    roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
    const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.85, metalness: 0.05 });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // 3D Curbs with alternating colors
    for (let i = 0; i < wp.length; i++) {
        const curr = wp[i], next = wp[(i + 1) % wp.length];
        const dir = new THREE.Vector3().subVectors(next, curr);
        const segLen = dir.length();
        dir.normalize();
        const norm = new THREE.Vector3(-dir.z, 0, dir.x);
        const angle = Math.atan2(dir.x, dir.z);
        const color = (Math.floor(i / 4) % 2 === 0) ? 0xff2200 : 0xffffff;
        const curbH = 0.35;

        for (const side of [-1, 1]) {
            const cOff = roadW / 2 + 0.75;
            const mid = curr.clone().add(next).multiplyScalar(0.5).add(norm.clone().multiplyScalar(side * cOff));
            const curb = new THREE.Mesh(
                new THREE.BoxGeometry(1.0, curbH, segLen + 0.05),
                new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
            );
            curb.position.set(mid.x, curr.y + curbH / 2, mid.z);
            curb.rotation.y = angle;
            curb.castShadow = currentGfx.shadows;
            scene.add(curb);
        }
    }

    // Walls - alternating tire walls and concrete barriers
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.7 });
    const wallTopMat = new THREE.MeshStandardMaterial({ color: 0xff6633, roughness: 0.5 });
    const tireWallMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    for (let i = 0; i < wp.length; i += 2) {
        const curr = wp[i], next = wp[(i + 1) % wp.length];
        const dir = new THREE.Vector3().subVectors(next, curr);
        const segLen = dir.length() * 2;
        dir.normalize();
        const norm = new THREE.Vector3(-dir.z, 0, dir.x);
        const angle = Math.atan2(dir.x, dir.z);
        const wallH = 1.3;
        const isTireWall = (i % 8) < 4;

        for (const side of [-1, 1]) {
            const wOff = roadW / 2 + 1.8;
            const mid = curr.clone().add(next).multiplyScalar(0.5).add(norm.clone().multiplyScalar(side * wOff));

            if (isTireWall) {
                // Tire stack wall
                for (let row = 0; row < 3; row++) {
                    const tire = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.4, 0.4, segLen + 0.2, 8),
                        tireWallMat
                    );
                    tire.position.set(mid.x, curr.y + 0.4 + row * 0.7, mid.z);
                    tire.rotation.x = Math.PI / 2;
                    tire.rotation.z = angle;
                    scene.add(tire);
                }
            } else {
                // Concrete barrier
                const wall = new THREE.Mesh(new THREE.BoxGeometry(0.6, wallH, segLen + 0.2), wallMat);
                wall.position.set(mid.x, curr.y + wallH / 2, mid.z);
                wall.rotation.y = angle;
                wall.castShadow = currentGfx.shadows;
                scene.add(wall);
                const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, segLen + 0.2), wallTopMat);
                stripe.position.set(mid.x, curr.y + wallH + 0.1, mid.z);
                stripe.rotation.y = angle;
                scene.add(stripe);
            }
        }
    }

    // Start/finish checkered
    const p0 = wp[0], p1 = wp[1];
    const sDir = new THREE.Vector3().subVectors(p1, p0).normalize();
    const sNorm = new THREE.Vector3(-sDir.z, 0, sDir.x);
    for (let row = -1; row <= 1; row++) {
        for (let col = -5; col <= 5; col++) {
            const isW = (row + col + 100) % 2 === 0;
            const pos = p0.clone().add(sDir.clone().multiplyScalar(row * 1.5)).add(sNorm.clone().multiplyScalar(col * 2));
            const ch = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2), new THREE.MeshLambertMaterial({ color: isW ? 0xffffff : 0x222222 }));
            ch.rotation.x = -Math.PI / 2;
            ch.position.set(pos.x, p0.y + 0.08, pos.z);
            scene.add(ch);
        }
    }

    // Start/finish banner arch
    const archL = p0.clone().add(sNorm.clone().multiplyScalar(roadW / 2 + 2));
    const archR = p0.clone().add(sNorm.clone().multiplyScalar(-roadW / 2 - 2));
    const pillarGeo = new THREE.CylinderGeometry(0.4, 0.4, 8, 8);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
    const pillarL = new THREE.Mesh(pillarGeo, pillarMat);
    pillarL.position.set(archL.x, p0.y + 4, archL.z);
    scene.add(pillarL);
    const pillarR = new THREE.Mesh(pillarGeo, pillarMat);
    pillarR.position.set(archR.x, p0.y + 4, archR.z);
    scene.add(pillarR);
    const bannerGeo = new THREE.BoxGeometry(roadW + 4, 1.5, 0.3);
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0xff6b35, emissive: 0xff4400, emissiveIntensity: 0.2 });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    const bannerCenter = archL.clone().add(archR).multiplyScalar(0.5);
    banner.position.set(bannerCenter.x, p0.y + 7.5, bannerCenter.z);
    banner.rotation.y = Math.atan2(sDir.x, sDir.z);
    scene.add(banner);

    // Ramps — 5 big wedge-shaped launch ramps spread around the track
    const ramps = [];
    const rampIndices = [0.12, 0.3, 0.5, 0.7, 0.88].map(f => Math.floor(f * wp.length));
    const rampColors = [0xffaa33, 0x33aaff, 0xff33aa, 0x33ffaa, 0xffff33];
    rampIndices.forEach((ri, idx) => {
        const rp = wp[ri], rn = wp[(ri + 1) % wp.length];
        const rd = new THREE.Vector3().subVectors(rn, rp).normalize();
        const angle = Math.atan2(rd.x, rd.z);
        const rNorm = new THREE.Vector3(-rd.z, 0, rd.x);
        const rampW = roadW * 0.55;
        const rampLen = 12;
        const rampH = 2.5;

        // Build wedge shape using custom geometry (triangular prism)
        const wedgeShape = new THREE.Shape();
        wedgeShape.moveTo(0, 0);
        wedgeShape.lineTo(rampLen, 0);
        wedgeShape.lineTo(rampLen, rampH);
        wedgeShape.lineTo(0, 0);
        const wedgeGeo = new THREE.ExtrudeGeometry(wedgeShape, {
            depth: rampW, bevelEnabled: false
        });
        wedgeGeo.center();
        const rampMat = new THREE.MeshStandardMaterial({
            color: rampColors[idx], roughness: 0.25, metalness: 0.5,
            emissive: rampColors[idx], emissiveIntensity: 0.15
        });
        const rampMesh = new THREE.Mesh(wedgeGeo, rampMat);
        rampMesh.position.set(rp.x, rp.y, rp.z);
        rampMesh.rotation.y = angle;
        rampMesh.castShadow = currentGfx.shadows;
        rampMesh.receiveShadow = true;
        scene.add(rampMesh);

        // Racing stripes on ramp surface
        for (let s = 0; s < 4; s++) {
            const stripeFrac = (s + 0.5) / 4;
            const stripeX = rp.x + rd.x * (stripeFrac - 0.5) * rampLen;
            const stripeZ = rp.z + rd.z * (stripeFrac - 0.5) * rampLen;
            const stripeY = rp.y + stripeFrac * rampH * 0.7;
            const stripe = new THREE.Mesh(
                new THREE.PlaneGeometry(rampW * 0.8, 0.6),
                new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
            );
            stripe.position.set(stripeX, stripeY + 0.15, stripeZ);
            stripe.rotation.x = -Math.PI / 2 + 0.2;
            stripe.rotation.z = -angle + Math.PI / 2;
            scene.add(stripe);
        }

        // Big chevron arrows floating above ramp
        for (let a = 0; a < 3; a++) {
            const arrow = new THREE.Mesh(
                new THREE.ConeGeometry(1.2, 2, 3),
                new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 + a * 0.2 })
            );
            const offset = (a - 1) * 3;
            arrow.position.set(
                rp.x + rd.x * offset,
                rp.y + rampH + 1.5 + a * 0.3,
                rp.z + rd.z * offset
            );
            arrow.rotation.x = -Math.PI / 2;
            arrow.rotation.z = -angle;
            scene.add(arrow);
        }

        // Tall side poles with glowing tips
        for (const side of [-1, 1]) {
            // Main pole
            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 5, 6),
                new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.3 })
            );
            pole.position.set(
                rp.x + rNorm.x * side * (rampW * 0.55),
                rp.y + 2.5,
                rp.z + rNorm.z * side * (rampW * 0.55)
            );
            scene.add(pole);
            // Glowing top
            const glow = new THREE.Mesh(
                new THREE.SphereGeometry(0.5, 8, 6),
                new THREE.MeshBasicMaterial({ color: rampColors[idx] })
            );
            glow.position.set(
                rp.x + rNorm.x * side * (rampW * 0.55),
                rp.y + 5.2,
                rp.z + rNorm.z * side * (rampW * 0.55)
            );
            scene.add(glow);
            // Glow light
            const glowLight = new THREE.PointLight(rampColors[idx], 0.4, 15);
            glowLight.position.copy(glow.position);
            scene.add(glowLight);
        }

        // "JUMP!" sign above ramp
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 256; signCanvas.height = 64;
        const sctx = signCanvas.getContext('2d');
        sctx.fillStyle = '#000000';
        sctx.fillRect(0, 0, 256, 64);
        sctx.fillStyle = '#ffcc00';
        sctx.font = 'bold 40px Arial';
        sctx.textAlign = 'center';
        sctx.fillText('JUMP!', 128, 46);
        const signTex = new THREE.CanvasTexture(signCanvas);
        const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(5, 1.3),
            new THREE.MeshBasicMaterial({ map: signTex, transparent: true, side: THREE.DoubleSide })
        );
        sign.position.set(rp.x, rp.y + 6.5, rp.z);
        sign.rotation.y = angle;
        scene.add(sign);

        ramps.push({ pos: rp.clone(), radius: 10 });
    });

    // Static obstacles — cones, barrels, and barriers placed on track
    staticObstacles = [];
    const obstaclePositions = [0.08, 0.18, 0.28, 0.38, 0.48, 0.58, 0.68, 0.78, 0.85, 0.93];
    obstaclePositions.forEach((frac, idx) => {
        const oi = Math.floor(frac * wp.length);
        const op = wp[oi], on = wp[(oi + 1) % wp.length];
        const od = new THREE.Vector3().subVectors(on, op).normalize();
        const oNorm = new THREE.Vector3(-od.z, 0, od.x);
        // Place obstacle offset from center (left or right side)
        const side = (idx % 2 === 0) ? 1 : -1;
        const lateralOffset = (roadW * 0.15) + Math.random() * (roadW * 0.2);
        const ox = op.x + oNorm.x * side * lateralOffset;
        const oz = op.z + oNorm.z * side * lateralOffset;
        const oy = op.y;

        const obstType = idx % 3;
        let obsMesh;
        if (obstType === 0) {
            // Traffic cone cluster (2-3 cones)
            const group = new THREE.Group();
            for (let c = 0; c < 2 + Math.floor(Math.random() * 2); c++) {
                const cone = new THREE.Mesh(
                    new THREE.ConeGeometry(0.4, 1.2, 8),
                    new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.5 })
                );
                cone.position.set((Math.random() - 0.5) * 1.5, 0.6, (Math.random() - 0.5) * 1.5);
                group.add(cone);
                // White stripe on cone
                const stripe = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.32, 0.36, 0.15, 8),
                    new THREE.MeshBasicMaterial({ color: 0xffffff })
                );
                stripe.position.copy(cone.position);
                stripe.position.y = 0.75;
                group.add(stripe);
            }
            group.position.set(ox, oy, oz);
            obsMesh = group;
        } else if (obstType === 1) {
            // Barrel stack
            const group = new THREE.Group();
            const barrelGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 10);
            const barrelColors = [0xff4444, 0x4444ff, 0xffaa00];
            for (let b = 0; b < 2; b++) {
                const barrel = new THREE.Mesh(
                    barrelGeo,
                    new THREE.MeshStandardMaterial({ color: barrelColors[b % 3], roughness: 0.6, metalness: 0.2 })
                );
                barrel.position.set(b * 1.2 - 0.6, 0.6, 0);
                group.add(barrel);
                // Metal band
                const band = new THREE.Mesh(
                    new THREE.TorusGeometry(0.6, 0.05, 6, 12),
                    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 })
                );
                band.position.copy(barrel.position);
                band.position.y = 0.3;
                band.rotation.x = Math.PI / 2;
                group.add(band);
            }
            group.position.set(ox, oy, oz);
            obsMesh = group;
        } else {
            // Road barrier (striped)
            const group = new THREE.Group();
            const barrier = new THREE.Mesh(
                new THREE.BoxGeometry(3, 1, 0.6),
                new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
            );
            barrier.position.y = 0.5;
            group.add(barrier);
            // Red stripes
            for (let s = 0; s < 3; s++) {
                const stripe = new THREE.Mesh(
                    new THREE.BoxGeometry(0.8, 0.9, 0.65),
                    new THREE.MeshStandardMaterial({ color: 0xff2222, roughness: 0.5 })
                );
                stripe.position.set(-1 + s * 1, 0.5, 0);
                group.add(stripe);
            }
            group.position.set(ox, oy, oz);
            group.rotation.y = Math.atan2(od.x, od.z) + (Math.random() - 0.5) * 0.3;
            obsMesh = group;
        }

        obsMesh.castShadow = currentGfx.shadows;
        scene.add(obsMesh);
        staticObstacles.push({ mesh: obsMesh, x: ox, z: oz, radius: 2.2 });
    });

    // Moving obstacles — 3 sweeping barriers across the track
    movingObstacles = [];
    const movObsPositions = [0.2, 0.45, 0.75];
    movObsPositions.forEach((frac, idx) => {
        const obsIdx = Math.floor(frac * wp.length);
        const op = wp[obsIdx], on = wp[(obsIdx + 1) % wp.length];
        const od = new THREE.Vector3().subVectors(on, op).normalize();
        const oNorm = new THREE.Vector3(-od.z, 0, od.x);
        const obsColors = [0xff4444, 0x44ff44, 0x4444ff];
        const obsGeo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
        const obsMat = new THREE.MeshStandardMaterial({
            color: obsColors[idx], emissive: obsColors[idx], emissiveIntensity: 0.15, roughness: 0.3
        });
        const obs = new THREE.Mesh(obsGeo, obsMat);
        obs.position.set(op.x, op.y + 1.25, op.z);
        obs.castShadow = currentGfx.shadows;
        scene.add(obs);
        // Warning sign above
        const warningCanvas = document.createElement('canvas');
        warningCanvas.width = 64; warningCanvas.height = 64;
        const wctx = warningCanvas.getContext('2d');
        wctx.fillStyle = '#ffcc00';
        wctx.beginPath(); wctx.moveTo(32, 4); wctx.lineTo(60, 56); wctx.lineTo(4, 56); wctx.closePath(); wctx.fill();
        wctx.fillStyle = '#000000'; wctx.font = 'bold 32px Arial'; wctx.textAlign = 'center'; wctx.fillText('!', 32, 48);
        const warningTex = new THREE.CanvasTexture(warningCanvas);
        const warning = new THREE.Sprite(new THREE.SpriteMaterial({ map: warningTex, transparent: true }));
        warning.scale.set(2, 2, 1);
        warning.position.set(0, 2.5, 0);
        obs.add(warning);
        movingObstacles.push({
            mesh: obs, center: op.clone(), norm: oNorm.clone(),
            range: roadW * 0.38, speed: 0.6 + idx * 0.3, time: idx * 2
        });
    });

    // Decorations
    addDecorations(wp, roadW);
    addBuildings(wp, roadW);
    addClouds();

    // Islamabad-specific decorations
    if (selectedTrack === 3) addIslamabadLandmarks(wp, roadW);

    // Item boxes
    spawnItemBoxes(wp);

    // Checkpoints
    const checkpoints = [];
    const numCp = 10, cpSpacing = Math.floor(wp.length / numCp);
    for (let i = 0; i < numCp; i++) {
        checkpoints.push({ pos: wp[i * cpSpacing].clone(), index: i, radius: roadW * 1.2 });
    }

    // Start positions (6 cars: 3 rows x 2 cols)
    const startPositions = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 2; col++) {
            const off = sDir.clone().multiplyScalar(-5 - row * 6).add(sNorm.clone().multiplyScalar((col - 0.5) * 6));
            startPositions.push({ pos: p0.clone().add(off), angle: Math.atan2(sDir.x, sDir.z) });
        }
    }

    // Grandstand with spectators
    const gNorm = new THREE.Vector3(-sDir.z, 0, sDir.x);
    const gPos = p0.clone().add(gNorm.clone().multiplyScalar(roadW + 12));
    const stand = new THREE.Mesh(new THREE.BoxGeometry(16, 5, 6), new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 }));
    stand.position.set(gPos.x, p0.y + 2.5, gPos.z);
    stand.rotation.y = Math.atan2(sDir.x, sDir.z);
    stand.castShadow = currentGfx.shadows;
    scene.add(stand);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(17, 0.6, 7), new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.5 }));
    roof.position.set(gPos.x, p0.y + 5.5, gPos.z);
    roof.rotation.y = Math.atan2(sDir.x, sDir.z);
    scene.add(roof);

    // Add spectators on grandstand
    addSpectators(gPos, p0.y + 5, Math.atan2(sDir.x, sDir.z));

    return { waypoints: wp, checkpoints, startPositions, ramps };
}

function addDecorations(wp, roadW) {
    if (!toonGradient) toonGradient = createToonGradient();
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 3, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4e37, roughness: 0.9 });

    for (let i = 0; i < wp.length; i += 6) {
        const p = wp[i], next = wp[(i + 1) % wp.length];
        const dir = new THREE.Vector3().subVectors(next, p).normalize();
        const norm = new THREE.Vector3(-dir.z, 0, dir.x);

        for (const side of [-1, 1]) {
            const dist = roadW * 0.8 + 8 + Math.random() * 18;
            const tx = p.x + norm.x * side * dist + (Math.random() - 0.5) * 4;
            const tz = p.z + norm.z * side * dist + (Math.random() - 0.5) * 4;
            const ty = getTrackHeight(tx, tz, wp);

            if (Math.random() < 0.65) {
                if (selectedTrack === 1) {
                    // Desert - palm trees
                    addPalmTree(tx, ty, tz);
                } else if (selectedTrack === 2) {
                    // Mountain - tall pines
                    addPineTree(tx, ty, tz);
                } else if (selectedTrack === 3) {
                    // Islamabad - mix of trees
                    if (Math.random() < 0.4) addFloweringTree(tx, ty, tz);
                    else addPineTree(tx, ty, tz);
                } else {
                    // Green Valley - layered trees
                    addLayeredTree(tx, ty, tz, trunkGeo, trunkMat);
                }
            } else if (Math.random() < 0.5) {
                // Bush cluster
                for (let b = 0; b < 3; b++) {
                    const bx = tx + (Math.random() - 0.5) * 2;
                    const bz = tz + (Math.random() - 0.5) * 2;
                    const bushColor = selectedTrack === 1 ? 0x8b7355 : 0x3a7a2a;
                    const bush = new THREE.Mesh(
                        new THREE.SphereGeometry(0.8 + Math.random() * 0.6, 7, 5),
                        new THREE.MeshStandardMaterial({ color: bushColor, roughness: 0.8 })
                    );
                    bush.position.set(bx, ty + 0.6, bz);
                    bush.scale.y = 0.7;
                    scene.add(bush);
                }
            }

            // Ground vegetation patches
            if (selectedTrack !== 1 && Math.random() < 0.3) {
                const patchColor = selectedTrack === 3 ? 0x4a9a4a : 0x3a7a2a;
                const patch = new THREE.Mesh(
                    new THREE.CircleGeometry(1.5 + Math.random() * 2, 6),
                    new THREE.MeshLambertMaterial({ color: patchColor, transparent: true, opacity: 0.4 })
                );
                patch.rotation.x = -Math.PI / 2;
                patch.position.set(tx + (Math.random() - 0.5) * 3, ty + 0.02, tz + (Math.random() - 0.5) * 3);
                scene.add(patch);
            }
        }
    }
}

function addLayeredTree(tx, ty, tz, trunkGeo, trunkMat) {
    const greens = [0x1a7a1a, 0x228b22, 0x2d8b2d];
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(tx, ty + 1.5, tz);
    scene.add(trunk);
    const sizes = [2.8, 2.2, 1.5];
    const heights = [3.5, 5, 6.2];
    sizes.forEach((s, li) => {
        const foliage = new THREE.Mesh(
            new THREE.ConeGeometry(s, 2.2, 7),
            new THREE.MeshStandardMaterial({ color: greens[li], roughness: 0.8 })
        );
        foliage.position.set(tx, ty + heights[li], tz);
        foliage.castShadow = currentGfx.shadows;
        scene.add(foliage);
    });
}

function addPalmTree(tx, ty, tz) {
    // Curved trunk
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.9 });
    for (let seg = 0; seg < 5; seg++) {
        const h = seg * 1.5;
        const lean = Math.sin(seg * 0.3) * 0.5;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25 - seg * 0.03, 0.3 - seg * 0.03, 1.6, 6),
            trunkMat
        );
        trunk.position.set(tx + lean, ty + h + 0.8, tz);
        scene.add(trunk);
    }
    // Palm fronds
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x2d7a1e, roughness: 0.7 });
    for (let f = 0; f < 6; f++) {
        const angle = (f / 6) * Math.PI * 2;
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.5, 4, 4), frondMat);
        frond.position.set(tx + Math.cos(angle) * 1.5 + 1, ty + 8, tz + Math.sin(angle) * 1.5);
        frond.rotation.z = Math.cos(angle) * 0.8;
        frond.rotation.x = Math.sin(angle) * 0.8;
        scene.add(frond);
    }
}

function addPineTree(tx, ty, tz) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4e37, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 5, 6), trunkMat);
    trunk.position.set(tx, ty + 2.5, tz);
    scene.add(trunk);
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x1a5a1a, roughness: 0.8 });
    const sizes = [2.0, 1.6, 1.2, 0.7];
    sizes.forEach((s, i) => {
        const foliage = new THREE.Mesh(new THREE.ConeGeometry(s, 2.5, 7), pineMat);
        foliage.position.set(tx, ty + 3.5 + i * 1.8, tz);
        foliage.castShadow = currentGfx.shadows;
        scene.add(foliage);
    });
}

function addFloweringTree(tx, ty, tz) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4e37, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 6), trunkMat);
    trunk.position.set(tx, ty + 1.5, tz);
    scene.add(trunk);
    // Pink/white blossom canopy
    const colors = [0xff88aa, 0xffaacc, 0xffffff];
    const canopy = new THREE.Mesh(
        new THREE.SphereGeometry(2.5, 8, 6),
        new THREE.MeshStandardMaterial({ color: colors[Math.floor(Math.random() * 3)], roughness: 0.7 })
    );
    canopy.position.set(tx, ty + 4.5, tz);
    canopy.scale.y = 0.7;
    canopy.castShadow = currentGfx.shadows;
    scene.add(canopy);
}

function addBuildings(wp, roadW) {
    const buildingPositions = [0.15, 0.35, 0.55, 0.75].map(f => Math.floor(f * wp.length));
    const bColors = [0x8899aa, 0xaa8866, 0x7788aa, 0x998877];

    buildingPositions.forEach((idx, bi) => {
        const p = wp[idx], next = wp[(idx + 1) % wp.length];
        const dir = new THREE.Vector3().subVectors(next, p).normalize();
        const norm = new THREE.Vector3(-dir.z, 0, dir.x);
        const side = bi % 2 === 0 ? 1 : -1;
        const dist = roadW + 20 + Math.random() * 10;
        const bx = p.x + norm.x * side * dist;
        const bz = p.z + norm.z * side * dist;
        const by = getTrackHeight(bx, bz, wp);
        const bh = 6 + Math.random() * 8;

        const base = new THREE.Mesh(
            new THREE.BoxGeometry(8, bh, 6),
            new THREE.MeshStandardMaterial({ color: bColors[bi], roughness: 0.7 })
        );
        base.position.set(bx, by + bh / 2, bz);
        base.castShadow = currentGfx.shadows;
        scene.add(base);

        // Windows (emissive rectangles)
        if (currentGfx.detailTrees) {
            const windowMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
            for (let wy = 1; wy < bh - 1; wy += 2) {
                for (let wx = -2.5; wx <= 2.5; wx += 2.5) {
                    if (Math.random() < 0.7) {
                        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), windowMat);
                        win.position.set(bx + wx, by + wy, bz + 3.05);
                        scene.add(win);
                        const win2 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), windowMat);
                        win2.position.set(bx + wx, by + wy, bz - 3.05);
                        win2.rotation.y = Math.PI;
                        scene.add(win2);
                    }
                }
            }
        }

        // Roof
        const roofM = new THREE.Mesh(
            new THREE.BoxGeometry(9, 0.5, 7),
            new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6 })
        );
        roofM.position.set(bx, by + bh + 0.25, bz);
        scene.add(roofM);
    });
}

function addClouds() {
    clouds = [];
    for (let i = 0; i < 12; i++) {
        const group = new THREE.Group();
        const x = (Math.random() - 0.5) * 300;
        const y = 45 + Math.random() * 25;
        const z = (Math.random() - 0.5) * 200;
        const count = 3 + Math.floor(Math.random() * 4);
        for (let c = 0; c < count; c++) {
            const s = 4 + Math.random() * 6;
            const cloud = new THREE.Mesh(
                new THREE.SphereGeometry(s, 8, 6),
                new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 })
            );
            cloud.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 4);
            cloud.scale.y = 0.5;
            group.add(cloud);
        }
        group.position.set(x, y, z);
        scene.add(group);
        clouds.push({ mesh: group, speed: 0.5 + Math.random() * 1.5 });
    }
}

function addSpectators(pos, baseY, angle) {
    const bodyColors = [0xff4444, 0x4444ff, 0x44ff44, 0xffff44, 0xff44ff, 0x44ffff, 0xff8800, 0xffffff];
    for (let i = 0; i < 12; i++) {
        const group = new THREE.Group();
        const xOff = (Math.random() - 0.5) * 14;
        const zOff = (Math.random() - 0.5) * 4;
        // Body
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.3, 1, 6),
            new THREE.MeshStandardMaterial({ color: bodyColors[i % bodyColors.length] })
        );
        body.position.y = 0.5;
        group.add(body);
        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.22, 6, 4),
            new THREE.MeshStandardMaterial({ color: 0xffcc99 })
        );
        head.position.y = 1.2;
        group.add(head);
        group.position.set(pos.x + xOff, baseY + 0.5, pos.z + zOff);
        group.userData = { bobSpeed: 2 + Math.random() * 3, bobPhase: Math.random() * Math.PI * 2 };
        scene.add(group);
    }
}

function addIslamabadLandmarks(wp, roadW) {
    // Faisal Mosque silhouette in the distance
    const mosqueX = 0, mosqueZ = -180, mosqueY = 0;

    // Main prayer hall - triangular/tent shape
    const hallGeo = new THREE.ConeGeometry(25, 30, 4);
    const hallMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4, metalness: 0.1 });
    const hall = new THREE.Mesh(hallGeo, hallMat);
    hall.position.set(mosqueX, mosqueY + 15, mosqueZ);
    hall.rotation.y = Math.PI / 4;
    scene.add(hall);

    // Four minarets
    const minaretGeo = new THREE.CylinderGeometry(0.8, 1, 40, 8);
    const minaretMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.3 });
    const minaretPositions = [[-30, 0, -30], [30, 0, -30], [-30, 0, 30], [30, 0, 30]];
    minaretPositions.forEach(([mx, my, mz]) => {
        const minaret = new THREE.Mesh(minaretGeo, minaretMat);
        minaret.position.set(mosqueX + mx, mosqueY + 20, mosqueZ + mz);
        scene.add(minaret);
        // Minaret cap
        const cap = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3, 8), minaretMat);
        cap.position.set(mosqueX + mx, mosqueY + 41.5, mosqueZ + mz);
        scene.add(cap);
    });

    // Margalla Hills - large green mounds in background
    const hillMat = new THREE.MeshStandardMaterial({ color: 0x3a7a3a, roughness: 0.9 });
    for (let i = 0; i < 5; i++) {
        const hx = -120 + i * 60;
        const hz = -200 + Math.random() * 20;
        const radius = 30 + Math.random() * 25;
        const height = 20 + Math.random() * 15;
        const hill = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
            hillMat
        );
        hill.position.set(hx, 0, hz);
        hill.scale.y = height / radius;
        scene.add(hill);
    }

    // Welcome banner near start
    const p0 = wp[0];
    const bannerGeo = new THREE.PlaneGeometry(12, 3);
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 512; bannerCanvas.height = 128;
    const bctx = bannerCanvas.getContext('2d');
    bctx.fillStyle = '#1a6b1a';
    bctx.fillRect(0, 0, 512, 128);
    bctx.fillStyle = '#ffffff';
    bctx.font = 'bold 36px Arial';
    bctx.textAlign = 'center';
    bctx.fillText('ISLAMABAD GRAND PRIX', 256, 55);
    bctx.font = '22px Arial';
    bctx.fillText('The Beautiful City', 256, 90);
    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    const welcomeBanner = new THREE.Mesh(bannerGeo, new THREE.MeshBasicMaterial({ map: bannerTex }));
    welcomeBanner.position.set(p0.x + 30, p0.y + 10, p0.z - 20);
    scene.add(welcomeBanner);
}

function createToonGradient() {
    const colors = new Uint8Array([40, 80, 160, 220]);
    const fmt = THREE.RedFormat || THREE.LuminanceFormat;
    const tex = new THREE.DataTexture(colors, 4, 1, fmt);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    return tex;
}
