// ===== CIRCUIT RACING 4 - ENVIRONMENT =====

const Environment = (() => {
    let weatherParticles = null;
    let clouds = [];
    let decorations = [];

    function build(trackDef, waypoints, scene) {
        cleanup(scene);

        buildSky(trackDef, scene);
        buildLighting(trackDef, scene);
        buildDecorations(trackDef, waypoints, scene);

        if (GAME.gfx.weather) {
            buildWeather(trackDef, scene);
        }
    }

    function buildSky(trackDef, scene) {
        const skyGeom = new THREE.SphereGeometry(400, 32, 16);
        const skyCanvas = document.createElement('canvas');
        skyCanvas.width = 512; skyCanvas.height = 256;
        const ctx = skyCanvas.getContext('2d');
        const colors = trackDef.skyColors;

        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(0.33, colors[1]);
        gradient.addColorStop(0.66, colors[2]);
        gradient.addColorStop(1, colors[3]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 256);

        // Morning sun for all tracks
        ctx.fillStyle = '#ffee88';
        ctx.beginPath(); ctx.arc(380, 180, 25, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,238,136,0.25)';
        ctx.beginPath(); ctx.arc(380, 180, 45, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,238,136,0.1)';
        ctx.beginPath(); ctx.arc(380, 180, 70, 0, Math.PI * 2); ctx.fill();

        const skyTex = new THREE.CanvasTexture(skyCanvas);
        const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide });
        const sky = new THREE.Mesh(skyGeom, skyMat);
        sky.userData.isSky = true;
        scene.add(sky);

        // Clouds for morning sky (all tracks)
        if (true) {
            for (let i = 0; i < 15; i++) {
                const cloudGroup = new THREE.Group();
                const numBlobs = 3 + Math.floor(Math.random() * 4);
                for (let j = 0; j < numBlobs; j++) {
                    const cGeom = new THREE.SphereGeometry(5 + Math.random() * 8, 8, 6);
                    const cMat = new THREE.MeshStandardMaterial({
                        color: trackDef.theme === 'snow' ? 0x99aabb : 0xffffff,
                        roughness: 1, metalness: 0, transparent: true, opacity: 0.85
                    });
                    const blob = new THREE.Mesh(cGeom, cMat);
                    blob.position.set(j * 6 - numBlobs * 3, Math.random() * 3, Math.random() * 4 - 2);
                    blob.scale.y = 0.5;
                    cloudGroup.add(blob);
                }
                cloudGroup.position.set(
                    Math.random() * 300 - 150,
                    50 + Math.random() * 30,
                    Math.random() * 300 - 150
                );
                cloudGroup.userData.speed = 0.5 + Math.random() * 1;
                scene.add(cloudGroup);
                clouds.push(cloudGroup);
            }
        }

        // Cloud floor for Sky Highway
        if (trackDef.theme === 'sky') {
            for (let i = 0; i < 40; i++) {
                const cGeom = new THREE.SphereGeometry(15 + Math.random() * 20, 8, 6);
                const cMat = new THREE.MeshStandardMaterial({ color: 0xeeeeff, roughness: 1, transparent: true, opacity: 0.7 });
                const cloud = new THREE.Mesh(cGeom, cMat);
                cloud.position.set(Math.random() * 400 - 200, Math.random() * 10 - 5, Math.random() * 400 - 200);
                cloud.scale.y = 0.3;
                scene.add(cloud);
                decorations.push(cloud);
            }
        }
    }

    function buildLighting(trackDef, scene) {
        // Hemisphere light - bright morning for all tracks
        const hemiColors = {
            beach: [0xaaddff, 0x88aa66],
            neon: [0x99ccff, 0x668855],
            snow: [0xccddff, 0x889999],
            volcano: [0x99bbdd, 0x666644],
            sky: [0x88bbff, 0x6699aa],
            rainbow: [0xaaccff, 0x7799aa]
        };
        const [skyCol, groundCol] = hemiColors[trackDef.theme] || [0xaaddff, 0x88aa66];
        const hemi = new THREE.HemisphereLight(skyCol, groundCol, 0.7);
        scene.add(hemi);

        // Directional sun - bright morning sunlight for all tracks
        const sun = new THREE.DirectionalLight(0xffffff, 0.9);
        sun.position.set(50, 80, 30);
        if (GAME.gfx.shadows) {
            sun.castShadow = true;
            sun.shadow.mapSize.width = GAME.gfx.shadowRes;
            sun.shadow.mapSize.height = GAME.gfx.shadowRes;
            sun.shadow.camera.left = -60;
            sun.shadow.camera.right = 60;
            sun.shadow.camera.top = 60;
            sun.shadow.camera.bottom = -60;
            sun.shadow.camera.near = 1;
            sun.shadow.camera.far = 200;
        }
        scene.add(sun);
        scene.userData.sunLight = sun;

        // City lights for Neon City (visible even in morning)
        if (trackDef.theme === 'neon') {
            const cityColors = [0x88aaff, 0xaaccff, 0xffcc88, 0x88ffaa, 0xffaa88];
            for (let i = 0; i < 8; i++) {
                const light = new THREE.PointLight(cityColors[i % cityColors.length], 0.8, 40);
                const angle = (i / 8) * Math.PI * 2;
                light.position.set(Math.sin(angle) * 60, 8, Math.cos(angle) * 55);
                scene.add(light);
            }
        }

        // Volcano glow
        if (trackDef.theme === 'volcano') {
            const lavaLight = new THREE.PointLight(0xff4400, 2, 80);
            lavaLight.position.set(0, 10, 0);
            scene.add(lavaLight);
        }

        // Fog
        scene.fog = new THREE.FogExp2(trackDef.fogColor, trackDef.fogDensity);
    }

    function buildDecorations(trackDef, waypoints, scene) {
        const builders = {
            beach: buildBeachDecos,
            neon: buildNeonDecos,
            snow: buildSnowDecos,
            volcano: buildVolcanoDecos,
            sky: buildSkyDecos,
            rainbow: buildRainbowDecos
        };
        if (builders[trackDef.theme]) builders[trackDef.theme](waypoints, scene);

        // Grandstand near start
        buildGrandstand(waypoints[0], waypoints[1], scene, trackDef);
    }

    function buildBeachDecos(waypoints, scene) {
        // Palm trees
        for (let i = 0; i < 30; i++) {
            const pos = getRandomOutsideTrack(waypoints, 25, 80);
            buildPalmTree(pos.x, pos.y, pos.z, scene);
        }
        // Water plane
        const waterGeom = new THREE.PlaneGeometry(500, 500);
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x2288cc,
            transparent: true,
            opacity: 0.7,
            roughness: 0.1,
            metalness: 0.5
        });
        const water = new THREE.Mesh(waterGeom, waterMat);
        water.rotation.x = -Math.PI / 2;
        water.position.set(0, -1, 80);
        scene.add(water);
        decorations.push(water);
        // Beach umbrellas
        for (let i = 0; i < 8; i++) {
            const ux = Math.random() * 100 - 50;
            const uz = 60 + Math.random() * 30;
            buildUmbrella(ux, -0.5, uz, scene);
        }
    }

    function buildNeonDecos(waypoints, scene) {
        // Buildings
        for (let i = 0; i < 25; i++) {
            const pos = getRandomOutsideTrack(waypoints, 20, 70);
            buildNeonBuilding(pos.x, pos.y, pos.z, scene);
        }
        // Street lamps
        for (let i = 0; i < waypoints.length; i += 8) {
            const wp = waypoints[i];
            buildStreetLamp(wp.x + 14, wp.y || 0, wp.z, scene);
            buildStreetLamp(wp.x - 14, wp.y || 0, wp.z, scene);
        }
    }

    function buildSnowDecos(waypoints, scene) {
        // Pine trees
        for (let i = 0; i < 40; i++) {
            const pos = getRandomOutsideTrack(waypoints, 20, 60);
            buildPineTree(pos.x, pos.y, pos.z, scene, true);
        }
        // Rocks
        for (let i = 0; i < 15; i++) {
            const pos = getRandomOutsideTrack(waypoints, 18, 50);
            buildRock(pos.x, pos.y, pos.z, scene, 0xaabbcc);
        }
    }

    function buildVolcanoDecos(waypoints, scene) {
        // Volcano in center
        const volcGeom = new THREE.ConeGeometry(30, 40, 12);
        const volcMat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.9 });
        const volc = new THREE.Mesh(volcGeom, volcMat);
        volc.position.set(0, 15, 0);
        scene.add(volc); decorations.push(volc);

        // Lava top glow
        const lavaGeom = new THREE.SphereGeometry(5, 8, 8);
        const lavaMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
        const lava = new THREE.Mesh(lavaGeom, lavaMat);
        lava.position.set(0, 36, 0);
        scene.add(lava); decorations.push(lava);

        // Dark rocks
        for (let i = 0; i < 20; i++) {
            const pos = getRandomOutsideTrack(waypoints, 20, 50);
            buildRock(pos.x, pos.y, pos.z, scene, 0x221100);
        }
        // Dead trees
        for (let i = 0; i < 10; i++) {
            const pos = getRandomOutsideTrack(waypoints, 18, 40);
            buildDeadTree(pos.x, pos.y, pos.z, scene);
        }
    }

    function buildSkyDecos(waypoints, scene) {
        // Support pillars
        for (let i = 0; i < waypoints.length; i += 15) {
            const wp = waypoints[i];
            const pillarGeom = new THREE.CylinderGeometry(1.5, 2, wp.y || 30, 8);
            const pillarMat = new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.5, roughness: 0.3 });
            const pillar = new THREE.Mesh(pillarGeom, pillarMat);
            pillar.position.set(wp.x, (wp.y || 30) / 2, wp.z);
            pillar.castShadow = true;
            scene.add(pillar);
            decorations.push(pillar);
        }
        // Floating rings
        for (let i = 0; i < 6; i++) {
            const idx = Math.floor(waypoints.length * (i / 6));
            const wp = waypoints[idx];
            const ringGeom = new THREE.TorusGeometry(4, 0.5, 8, 16);
            const ringMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0.3 });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.position.set(wp.x, (wp.y || 30) + 5, wp.z);
            ring.rotation.x = Math.PI / 2;
            scene.add(ring);
            decorations.push(ring);
        }
    }

    function buildRainbowDecos(waypoints, scene) {
        // Star field
        const starCount = 500;
        const starPositions = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            starPositions[i * 3] = (Math.random() - 0.5) * 350;
            starPositions[i * 3 + 1] = Math.random() * 100 - 20;
            starPositions[i * 3 + 2] = (Math.random() - 0.5) * 350;
            const h = Math.random();
            const rgb = hslToRgb(h, 0.5, 0.8);
            starColors[i * 3] = rgb[0]; starColors[i * 3 + 1] = rgb[1]; starColors[i * 3 + 2] = rgb[2];
        }
        const starGeom = new THREE.BufferGeometry();
        starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
        const starMat = new THREE.PointsMaterial({ size: 1.5, vertexColors: true, blending: THREE.AdditiveBlending });
        const stars = new THREE.Points(starGeom, starMat);
        scene.add(stars);
        decorations.push(stars);

        // Floating geometric shapes
        const shapes = [
            new THREE.OctahedronGeometry(3), new THREE.TetrahedronGeometry(3),
            new THREE.IcosahedronGeometry(2), new THREE.DodecahedronGeometry(2)
        ];
        for (let i = 0; i < 20; i++) {
            const geom = shapes[i % shapes.length];
            const hue = i / 20;
            const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
            const mat = new THREE.MeshStandardMaterial({
                color, emissive: color, emissiveIntensity: 0.3,
                metalness: 0.5, roughness: 0.3
            });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(
                (Math.random() - 0.5) * 200,
                10 + Math.random() * 40,
                (Math.random() - 0.5) * 200
            );
            mesh.userData.rotSpeed = { x: Math.random() * 0.5, y: Math.random() * 0.5 };
            scene.add(mesh);
            decorations.push(mesh);
        }
    }

    function buildGrandstand(start, next, scene, trackDef) {
        const angle = Math.atan2(next.x - start.x, next.z - start.z);
        const perpX = Math.cos(angle);
        const perpZ = -Math.sin(angle);

        const standGeom = new THREE.BoxGeometry(20, 6, 8);
        const standMat = new THREE.MeshStandardMaterial({
            color: trackDef.theme === 'neon' ? 0x222244 : 0x888888,
            roughness: 0.7
        });
        const stand = new THREE.Mesh(standGeom, standMat);
        stand.position.set(start.x + perpX * 25, (start.y || 0) + 3, start.z + perpZ * 25);
        stand.rotation.y = angle;
        stand.castShadow = true;
        scene.add(stand);
        decorations.push(stand);

        // Crowd (colored dots)
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 8; c++) {
                const dotGeom = new THREE.SphereGeometry(0.4, 6, 6);
                const dotMat = new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5)
                });
                const dot = new THREE.Mesh(dotGeom, dotMat);
                const ox = (c - 4) * 2;
                const oy = r * 2 + 1;
                dot.position.set(
                    start.x + perpX * 25 + Math.sin(angle) * ox,
                    (start.y || 0) + oy,
                    start.z + perpZ * 25 + Math.cos(angle) * ox
                );
                scene.add(dot);
                decorations.push(dot);
            }
        }
    }

    // Helper decoration builders
    function buildPalmTree(x, y, z, scene) {
        const trunkGeom = new THREE.CylinderGeometry(0.3, 0.5, 6, 6);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x886633, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.set(x, y + 3, z);
        trunk.castShadow = true;
        scene.add(trunk); decorations.push(trunk);

        for (let i = 0; i < 5; i++) {
            const leafGeom = new THREE.PlaneGeometry(4, 1);
            const leafMat = new THREE.MeshStandardMaterial({ color: 0x228833, side: THREE.DoubleSide, roughness: 0.8 });
            const leaf = new THREE.Mesh(leafGeom, leafMat);
            const lAngle = (i / 5) * Math.PI * 2;
            leaf.position.set(x + Math.cos(lAngle) * 2, y + 6.5, z + Math.sin(lAngle) * 2);
            leaf.rotation.y = lAngle;
            leaf.rotation.z = 0.5;
            scene.add(leaf); decorations.push(leaf);
        }
    }

    function buildUmbrella(x, y, z, scene) {
        const poleGeom = new THREE.CylinderGeometry(0.1, 0.1, 3, 6);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const pole = new THREE.Mesh(poleGeom, poleMat);
        pole.position.set(x, y + 1.5, z);
        scene.add(pole); decorations.push(pole);

        const topGeom = new THREE.ConeGeometry(2, 1, 8);
        const topMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5), roughness: 0.6
        });
        const top = new THREE.Mesh(topGeom, topMat);
        top.position.set(x, y + 3.2, z);
        scene.add(top); decorations.push(top);
    }

    function buildNeonBuilding(x, y, z, scene) {
        const h = 10 + Math.random() * 30;
        const w = 5 + Math.random() * 8;
        const d = 5 + Math.random() * 8;
        const geom = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x111122, roughness: 0.3, metalness: 0.5
        });
        const building = new THREE.Mesh(geom, mat);
        building.position.set(x, y + h / 2, z);
        building.castShadow = true;
        scene.add(building); decorations.push(building);

        // Neon windows
        const windowCount = Math.floor(h / 3);
        const neonColors = [0xff00ff, 0x00ffff, 0xffff00, 0xff4400, 0x00ff44];
        for (let wi = 0; wi < windowCount; wi++) {
            for (let wj = 0; wj < 2; wj++) {
                if (Math.random() > 0.6) continue;
                const wGeom = new THREE.PlaneGeometry(w * 0.3, 1.5);
                const wMat = new THREE.MeshBasicMaterial({
                    color: neonColors[Math.floor(Math.random() * neonColors.length)],
                    transparent: true, opacity: 0.8
                });
                const win = new THREE.Mesh(wGeom, wMat);
                win.position.set(
                    x + (wj === 0 ? -d / 2 - 0.01 : d / 2 + 0.01),
                    y + wi * 3 + 2, z
                );
                win.rotation.y = wj === 0 ? Math.PI / 2 : -Math.PI / 2;
                scene.add(win); decorations.push(win);
            }
        }
    }

    function buildStreetLamp(x, y, z, scene) {
        const poleGeom = new THREE.CylinderGeometry(0.15, 0.15, 5, 6);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const pole = new THREE.Mesh(poleGeom, poleMat);
        pole.position.set(x, y + 2.5, z);
        scene.add(pole); decorations.push(pole);

        const lightGeom = new THREE.SphereGeometry(0.5, 8, 8);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
        const light = new THREE.Mesh(lightGeom, lightMat);
        light.position.set(x, y + 5.2, z);
        scene.add(light); decorations.push(light);
    }

    function buildPineTree(x, y, z, scene, snowy = false) {
        const trunkGeom = new THREE.CylinderGeometry(0.3, 0.4, 3, 6);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x553311, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.set(x, y + 1.5, z);
        trunk.castShadow = true;
        scene.add(trunk); decorations.push(trunk);

        for (let i = 0; i < 3; i++) {
            const s = 1 - i * 0.25;
            const coneGeom = new THREE.ConeGeometry(2.5 * s, 3, 6);
            const coneMat = new THREE.MeshStandardMaterial({
                color: snowy ? 0xddddff : 0x225522, roughness: 0.8
            });
            const cone = new THREE.Mesh(coneGeom, coneMat);
            cone.position.set(x, y + 3.5 + i * 2, z);
            cone.castShadow = true;
            scene.add(cone); decorations.push(cone);
        }
    }

    function buildRock(x, y, z, scene, color) {
        const s = 1 + Math.random() * 3;
        const geom = new THREE.DodecahedronGeometry(s, 0);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
        const rock = new THREE.Mesh(geom, mat);
        rock.position.set(x, y + s * 0.5, z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        scene.add(rock); decorations.push(rock);
    }

    function buildDeadTree(x, y, z, scene) {
        const geom = new THREE.CylinderGeometry(0.15, 0.3, 4, 5);
        const mat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.9 });
        const trunk = new THREE.Mesh(geom, mat);
        trunk.position.set(x, y + 2, z);
        trunk.rotation.z = (Math.random() - 0.5) * 0.3;
        scene.add(trunk); decorations.push(trunk);
    }

    function buildWeather(trackDef, scene) {
        if (trackDef.weather === 'clear') return;

        // Weather handled by spawning particles each frame in update()
    }

    function getRandomOutsideTrack(waypoints, minDist, maxDist) {
        const idx = Math.floor(Math.random() * waypoints.length);
        const wp = waypoints[idx];
        const angle = Math.random() * Math.PI * 2;
        const dist = minDist + Math.random() * (maxDist - minDist);
        return {
            x: wp.x + Math.cos(angle) * dist,
            y: wp.y || 0,
            z: wp.z + Math.sin(angle) * dist
        };
    }

    function update(dt) {
        // Animate clouds
        clouds.forEach(c => {
            c.position.x += c.userData.speed * dt;
            if (c.position.x > 200) c.position.x = -200;
        });

        // Animate rainbow decorations
        decorations.forEach(d => {
            if (d.userData.rotSpeed) {
                d.rotation.x += d.userData.rotSpeed.x * dt;
                d.rotation.y += d.userData.rotSpeed.y * dt;
            }
        });

        // Weather particles
        if (GAME.gfx.weather && GAME.trackDef) {
            if (GAME.trackDef.weather === 'rain') {
                if (GAME.playerCar) {
                    for (let i = 0; i < 5; i++) {
                        Particles.emit(
                            GAME.playerCar.x + (Math.random() - 0.5) * 40,
                            GAME.playerCar.y + 15 + Math.random() * 10,
                            GAME.playerCar.z + (Math.random() - 0.5) * 40,
                            'rain', 1
                        );
                    }
                }
            } else if (GAME.trackDef.weather === 'snow') {
                if (GAME.playerCar) {
                    for (let i = 0; i < 2; i++) {
                        Particles.emit(
                            GAME.playerCar.x + (Math.random() - 0.5) * 50,
                            GAME.playerCar.y + 20 + Math.random() * 10,
                            GAME.playerCar.z + (Math.random() - 0.5) * 50,
                            'snow', 1
                        );
                    }
                }
            }
        }
    }

    function cleanup(scene) {
        clouds.forEach(c => scene.remove(c));
        decorations.forEach(d => scene.remove(d));
        clouds = [];
        decorations = [];
        // Remove sky, lights, fog
        scene.children.filter(c => c.userData.isSky || c.isLight).forEach(c => scene.remove(c));
        scene.fog = null;
    }

    function hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) { r = g = b = l; }
        else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1; if (t > 1) t -= 1;
                if (t < 1/6) return p + (q-p)*6*t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q-p)*(2/3-t)*6;
                return p;
            };
            const q = l < 0.5 ? l*(1+s) : l+s-l*s;
            const p = 2*l - q;
            r = hue2rgb(p, q, h+1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h-1/3);
        }
        return [r, g, b];
    }

    return { build, update, cleanup };
})();
