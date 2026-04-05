// ===== CIRCUIT RACING 4 - TRACK =====

const Track = (() => {

    function generateWaypoints(trackDef) {
        const numPoints = 240;
        const raw = [];

        for (let i = 0; i < numPoints; i++) {
            const t = (i / numPoints) * Math.PI * 2;
            let x, z, y;

            // All tracks use non-crossing closed loop shapes
            // Base radius varies per track, with small perturbations for interest
            switch (trackDef.id) {
                case 0: // Margalla Hills - clean oval, always above ground
                    x = Math.sin(t) * 90;
                    z = Math.cos(t) * 60;
                    y = 1 + Math.sin(t * 2) * 1;
                    break;
                case 1: // Faisal Circuit
                    x = Math.sin(t) * 80;
                    z = Math.cos(t) * 55;
                    y = 1 + Math.sin(t * 2) * 0.5;
                    break;
                case 2: // Snowy Mountains - hills but always above ground
                    x = Math.sin(t) * 75;
                    z = Math.cos(t) * 55;
                    y = 2 + Math.sin(t) * 3 + Math.cos(t * 2) * 1;
                    break;
                case 3: // Volcano Rush
                    x = Math.sin(t) * 70;
                    z = Math.cos(t) * 60;
                    y = 1 + Math.sin(t * 2) * 1;
                    break;
                case 4: // Cloud Kingdom - big elevated oval
                    x = Math.sin(t) * 95;
                    z = Math.cos(t) * 65;
                    y = 30 + Math.sin(t * 2) * 2;
                    break;
                case 5: // Rainbow Road - elevated oval
                    x = Math.sin(t) * 65;
                    z = Math.cos(t) * 50;
                    y = 20 + Math.sin(t * 2) * 3;
                    break;
                case 6: // Desert Dunes - wide oval
                    x = Math.sin(t) * 100;
                    z = Math.cos(t) * 65;
                    y = Math.sin(t * 2) * 2;
                    break;
                case 7: // Jungle Temple - smaller tighter oval
                    x = Math.sin(t) * 60;
                    z = Math.cos(t) * 50;
                    y = Math.sin(t * 2) * 1.5;
                    break;
                case 8: // Ice Lake - big wide flat oval
                    x = Math.sin(t) * 95;
                    z = Math.cos(t) * 70;
                    y = 0;
                    break;
                case 9: // Space Station - elevated oval
                    x = Math.sin(t) * 70;
                    z = Math.cos(t) * 55;
                    y = 35 + Math.sin(t * 2) * 2;
                    break;
            }
            raw.push({ x, y, z });
        }

        // Smooth 3 times
        let smoothed = raw;
        for (let pass = 0; pass < 3; pass++) {
            const next = [];
            for (let i = 0; i < smoothed.length; i++) {
                const prev = smoothed[(i - 1 + smoothed.length) % smoothed.length];
                const curr = smoothed[i];
                const nxt = smoothed[(i + 1) % smoothed.length];
                next.push({
                    x: prev.x * 0.25 + curr.x * 0.5 + nxt.x * 0.25,
                    y: prev.y * 0.25 + curr.y * 0.5 + nxt.y * 0.25,
                    z: prev.z * 0.25 + curr.z * 0.5 + nxt.z * 0.25
                });
            }
            smoothed = next;
        }

        return smoothed;
    }

    function buildTrack(trackDef, scene) {
        const waypoints = generateWaypoints(trackDef);
        const roadWidth = trackDef.roadWidth;
        const halfWidth = roadWidth / 2;

        // Road surface - use averaged normals so edges match at curves (no gaps!)
        // Add 10% extra width to eliminate any micro-gaps at sharp bends
        const renderHalfWidth = halfWidth * 1.1;
        const roadVertices = [];

        for (let i = 0; i < waypoints.length; i++) {
            const prev = waypoints[(i - 1 + waypoints.length) % waypoints.length];
            const curr = waypoints[i];
            const next = waypoints[(i + 1) % waypoints.length];

            // Direction from prev to next (averaged tangent)
            const tx = next.x - prev.x;
            const tz = next.z - prev.z;
            const tLen = Math.sqrt(tx * tx + tz * tz) || 1;

            // Normal is perpendicular to tangent
            const nx = -tz / tLen;
            const nz = tx / tLen;

            roadVertices.push(
                curr.x + nx * renderHalfWidth, curr.y + 0.01, curr.z + nz * renderHalfWidth,
                curr.x - nx * renderHalfWidth, curr.y + 0.01, curr.z - nz * renderHalfWidth
            );
        }

        const roadGeom = new THREE.BufferGeometry();
        const verts = new Float32Array(roadVertices);
        const indices = [];
        for (let i = 0; i < waypoints.length; i++) {
            const i0 = i * 2;
            const i1 = i * 2 + 1;
            const i2 = ((i + 1) % waypoints.length) * 2;
            const i3 = ((i + 1) % waypoints.length) * 2 + 1;
            indices.push(i0, i2, i1, i1, i2, i3);
        }
        roadGeom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        roadGeom.setIndex(indices);
        roadGeom.computeVertexNormals();

        // Road texture
        const roadCanvas = document.createElement('canvas');
        roadCanvas.width = 256; roadCanvas.height = 256;
        const rCtx = roadCanvas.getContext('2d');

        if (trackDef.theme === 'rainbow') {
            // Rainbow gradient road
            const gradient = rCtx.createLinearGradient(0, 0, 256, 0);
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(0.17, '#ff8800');
            gradient.addColorStop(0.33, '#ffff00');
            gradient.addColorStop(0.5, '#00ff00');
            gradient.addColorStop(0.67, '#0088ff');
            gradient.addColorStop(0.83, '#8800ff');
            gradient.addColorStop(1, '#ff0088');
            rCtx.fillStyle = gradient;
            rCtx.fillRect(0, 0, 256, 256);
        } else {
            rCtx.fillStyle = trackDef.roadColor;
            rCtx.fillRect(0, 0, 256, 256);
            // Center dashes
            rCtx.strokeStyle = '#ffffff44';
            rCtx.lineWidth = 2;
            rCtx.setLineDash([20, 20]);
            rCtx.beginPath();
            rCtx.moveTo(128, 0); rCtx.lineTo(128, 256);
            rCtx.stroke();
            // Edge lines
            rCtx.strokeStyle = '#ffffff22';
            rCtx.lineWidth = 3;
            rCtx.setLineDash([]);
            rCtx.beginPath(); rCtx.moveTo(10, 0); rCtx.lineTo(10, 256); rCtx.stroke();
            rCtx.beginPath(); rCtx.moveTo(246, 0); rCtx.lineTo(246, 256); rCtx.stroke();
        }

        const roadTex = new THREE.CanvasTexture(roadCanvas);
        roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
        roadTex.repeat.set(1, waypoints.length / 4);

        const roadMat = new THREE.MeshStandardMaterial({
            map: roadTex,
            roughness: trackDef.theme === 'snow' ? 0.4 : 0.7,
            metalness: trackDef.theme === 'neon' ? 0.3 : 0.1,
            color: 0xffffff,
            side: THREE.DoubleSide
        });

        const roadMesh = new THREE.Mesh(roadGeom, roadMat);
        roadMesh.receiveShadow = true;
        scene.add(roadMesh);

        // Curbs
        buildCurbs(waypoints, halfWidth, trackDef, scene);

        // Walls (not for Sky Highway or Rainbow Road)
        if (trackDef.theme !== 'sky' && trackDef.theme !== 'rainbow' && trackDef.theme !== 'space') {
            buildWalls(waypoints, halfWidth, trackDef, scene);
        }

        // Start/Finish line
        buildStartLine(waypoints, halfWidth, scene);

        // Ramps
        const ramps = buildRamps(waypoints, trackDef, scene);

        // Item boxes
        const itemBoxPositions = [];
        for (let i = 0; i < waypoints.length; i += Math.floor(waypoints.length / 10)) {
            itemBoxPositions.push({ x: waypoints[i].x, y: (waypoints[i].y || 0) + 1.5, z: waypoints[i].z });
        }

        // Ground plane
        buildGround(trackDef, scene);

        return { waypoints, ramps, itemBoxPositions, roadMesh };
    }

    function buildCurbs(waypoints, halfWidth, trackDef, scene) {
        const curbWidth = 1.5;
        const colors = trackDef.theme === 'neon' ?
            [0xff00ff, 0x00ffff] :
            trackDef.theme === 'snow' ?
            [0xddddff, 0x4466ff] :
            [0xcc2222, 0xffffff];

        for (let side = -1; side <= 1; side += 2) {
            const curbVerts = [];
            for (let i = 0; i < waypoints.length; i++) {
                const prev = waypoints[(i - 1 + waypoints.length) % waypoints.length];
                const curr = waypoints[i];
                const next = waypoints[(i + 1) % waypoints.length];
                const tx = next.x - prev.x;
                const tz = next.z - prev.z;
                const len = Math.sqrt(tx * tx + tz * tz) || 1;
                const nx = (-tz / len) * side;
                const nz = (tx / len) * side;

                curbVerts.push(
                    curr.x + nx * halfWidth, (curr.y || 0) + 0.02, curr.z + nz * halfWidth,
                    curr.x + nx * (halfWidth + curbWidth), (curr.y || 0) + 0.02, curr.z + nz * (halfWidth + curbWidth)
                );
            }

            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(curbVerts), 3));
            const idx = [];
            for (let i = 0; i < waypoints.length; i++) {
                const a = i * 2, b = i * 2 + 1;
                const c = ((i + 1) % waypoints.length) * 2;
                const d = ((i + 1) % waypoints.length) * 2 + 1;
                idx.push(a, c, b, b, c, d);
            }
            geom.setIndex(idx);
            geom.computeVertexNormals();

            // Alternating colors via vertex colors
            const colorAttr = new Float32Array(curbVerts.length);
            for (let i = 0; i < waypoints.length; i++) {
                const cIdx = Math.floor(i / 3) % 2;
                const color = new THREE.Color(colors[cIdx]);
                const base = i * 6;
                colorAttr[base] = colorAttr[base + 3] = color.r;
                colorAttr[base + 1] = colorAttr[base + 4] = color.g;
                colorAttr[base + 2] = colorAttr[base + 5] = color.b;
            }
            geom.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));

            const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.receiveShadow = true;
            scene.add(mesh);
        }
    }

    function buildWalls(waypoints, halfWidth, trackDef, scene) {
        const wallHeight = 2;
        const wallOffset = halfWidth + 2;
        const wallColor = trackDef.theme === 'neon' ? 0x333366 :
                          trackDef.theme === 'snow' ? 0x889999 :
                          trackDef.theme === 'volcano' ? 0x332211 : 0x666666;

        for (let side = -1; side <= 1; side += 2) {
            const verts = [];
            for (let i = 0; i < waypoints.length; i++) {
                const prev = waypoints[(i - 1 + waypoints.length) % waypoints.length];
                const curr = waypoints[i];
                const next = waypoints[(i + 1) % waypoints.length];
                const tx = next.x - prev.x;
                const tz = next.z - prev.z;
                const len = Math.sqrt(tx * tx + tz * tz) || 1;
                const nx = (-tz / len) * side;
                const nz = (tx / len) * side;
                const baseY = curr.y || 0;

                verts.push(
                    curr.x + nx * wallOffset, baseY, curr.z + nz * wallOffset,
                    curr.x + nx * wallOffset, baseY + wallHeight, curr.z + nz * wallOffset
                );
            }

            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
            const idx = [];
            for (let i = 0; i < waypoints.length; i++) {
                const a = i * 2, b = i * 2 + 1;
                const c = ((i + 1) % waypoints.length) * 2;
                const d = ((i + 1) % waypoints.length) * 2 + 1;
                idx.push(a, c, b, b, c, d);
            }
            geom.setIndex(idx);
            geom.computeVertexNormals();

            const mat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.8, metalness: 0.1 });
            if (trackDef.theme === 'neon') {
                mat.emissive = new THREE.Color(0x220044);
                mat.emissiveIntensity = 0.3;
            }
            const mesh = new THREE.Mesh(geom, mat);
            mesh.castShadow = true;
            scene.add(mesh);
        }
    }

    function buildStartLine(waypoints, halfWidth, scene) {
        const w = waypoints[0];
        const next = waypoints[1];
        const angle = Math.atan2(next.x - w.x, next.z - w.z);

        const startGeom = new THREE.PlaneGeometry(halfWidth * 2, 3);
        const startCanvas = document.createElement('canvas');
        startCanvas.width = 128; startCanvas.height = 32;
        const sCtx = startCanvas.getContext('2d');
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 16; c++) {
                sCtx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#111111';
                sCtx.fillRect(c * 8, r * 8, 8, 8);
            }
        }
        const startTex = new THREE.CanvasTexture(startCanvas);
        const startMat = new THREE.MeshStandardMaterial({ map: startTex, roughness: 0.5 });
        const startMesh = new THREE.Mesh(startGeom, startMat);
        startMesh.rotation.x = -Math.PI / 2;
        startMesh.position.set(w.x, (w.y || 0) + 0.03, w.z);
        startMesh.rotation.z = -angle;
        scene.add(startMesh);
    }

    function buildRamps(waypoints, trackDef, scene) {
        const ramps = [];
        const rampPositions = [Math.floor(waypoints.length * 0.25), Math.floor(waypoints.length * 0.6)];

        if (trackDef.theme === 'sky') {
            rampPositions.push(Math.floor(waypoints.length * 0.45));
        }

        rampPositions.forEach(idx => {
            const wp = waypoints[idx];
            const next = waypoints[(idx + 1) % waypoints.length];
            const angle = Math.atan2(next.x - wp.x, next.z - wp.z);

            const rampGeom = new THREE.BoxGeometry(8, 1, 6);
            const rampMat = new THREE.MeshStandardMaterial({
                color: trackDef.theme === 'neon' ? 0x6600cc : 0xff8800,
                roughness: 0.4,
                metalness: 0.3
            });
            if (trackDef.theme === 'neon') {
                rampMat.emissive = new THREE.Color(0x4400aa);
                rampMat.emissiveIntensity = 0.5;
            }
            const ramp = new THREE.Mesh(rampGeom, rampMat);
            ramp.position.set(wp.x, (wp.y || 0) + 0.3, wp.z);
            ramp.rotation.y = angle;
            ramp.rotation.x = -0.2;
            ramp.castShadow = true;
            scene.add(ramp);

            // Arrow on ramp
            const arrowGeom = new THREE.PlaneGeometry(3, 4);
            const arrowCanvas = document.createElement('canvas');
            arrowCanvas.width = 64; arrowCanvas.height = 64;
            const aCtx = arrowCanvas.getContext('2d');
            aCtx.fillStyle = '#ffaa0088';
            aCtx.beginPath();
            aCtx.moveTo(32, 5); aCtx.lineTo(55, 40); aCtx.lineTo(40, 40);
            aCtx.lineTo(40, 60); aCtx.lineTo(24, 60); aCtx.lineTo(24, 40);
            aCtx.lineTo(9, 40); aCtx.closePath(); aCtx.fill();
            const arrowTex = new THREE.CanvasTexture(arrowCanvas);
            const arrowMat = new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true });
            const arrow = new THREE.Mesh(arrowGeom, arrowMat);
            arrow.position.set(wp.x, (wp.y || 0) + 1, wp.z);
            arrow.rotation.x = -Math.PI / 2 + 0.1;
            arrow.rotation.z = -angle;
            scene.add(arrow);

            ramps.push({ x: wp.x, y: wp.y || 0, z: wp.z });
        });

        return ramps;
    }

    function buildGround(trackDef, scene) {
        const size = 500;

        if (trackDef.theme === 'sky' || trackDef.theme === 'rainbow' || trackDef.theme === 'space') {
            // No ground for sky/rainbow - just void
            return;
        }

        const groundCanvas = document.createElement('canvas');
        groundCanvas.width = 512; groundCanvas.height = 512;
        const gCtx = groundCanvas.getContext('2d');
        gCtx.fillStyle = trackDef.groundColor;
        gCtx.fillRect(0, 0, 512, 512);

        // Add noise
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const s = 1 + Math.random() * 3;
            const brightness = Math.random() * 30 - 15;
            gCtx.fillStyle = `rgba(${128 + brightness},${128 + brightness},${128 + brightness},0.1)`;
            gCtx.fillRect(x, y, s, s);
        }

        const groundTex = new THREE.CanvasTexture(groundCanvas);
        groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
        groundTex.repeat.set(20, 20);

        const groundGeom = new THREE.PlaneGeometry(size, size);
        const groundMat = new THREE.MeshStandardMaterial({
            map: groundTex,
            roughness: 0.9,
            metalness: 0
        });
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        scene.add(ground);
    }

    return { generateWaypoints, buildTrack };
})();
