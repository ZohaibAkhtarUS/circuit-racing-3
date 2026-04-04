// ===== CIRCUIT RACING 4 - PARTICLES =====

const Particles = (() => {
    let geometry, material, points;
    let particles = [];
    let maxParticles = 600;
    let tireMarks = [];
    const MAX_TIRE_MARKS = 200;

    function init(scene) {
        maxParticles = GAME.gfx.particles || 600;
        const positions = new Float32Array(maxParticles * 3);
        const colors = new Float32Array(maxParticles * 3);
        const sizes = new Float32Array(maxParticles);

        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        material = new THREE.PointsMaterial({
            size: 0.6,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        points = new THREE.Points(geometry, material);
        points.frustumCulled = false;
        scene.add(points);

        particles = [];
    }

    function emit(x, y, z, type, count = 1) {
        for (let i = 0; i < count; i++) {
            if (particles.length >= maxParticles) {
                // Reuse oldest
                particles.shift();
            }
            const p = createParticle(x, y, z, type);
            particles.push(p);
        }
    }

    function createParticle(x, y, z, type) {
        const p = { x, y, z, vx: 0, vy: 0, vz: 0, life: 1, maxLife: 1, r: 1, g: 1, b: 1, size: 0.5 };

        switch (type) {
            case 'smoke':
                p.vx = (Math.random() - 0.5) * 2;
                p.vy = 1.5 + Math.random();
                p.vz = (Math.random() - 0.5) * 2;
                p.maxLife = p.life = 0.6 + Math.random() * 0.3;
                p.r = 0.5; p.g = 0.5; p.b = 0.55;
                p.size = 0.8;
                break;
            case 'dust':
                p.vx = (Math.random() - 0.5) * 3;
                p.vy = 0.5 + Math.random();
                p.vz = (Math.random() - 0.5) * 3;
                p.maxLife = p.life = 0.4 + Math.random() * 0.3;
                p.r = 0.7; p.g = 0.6; p.b = 0.4;
                p.size = 0.6;
                break;
            case 'spark':
                p.vx = (Math.random() - 0.5) * 8;
                p.vy = 2 + Math.random() * 4;
                p.vz = (Math.random() - 0.5) * 8;
                p.maxLife = p.life = 0.2 + Math.random() * 0.2;
                p.r = 1; p.g = 0.7 + Math.random() * 0.3; p.b = 0.2;
                p.size = 0.3;
                break;
            case 'boost':
                p.vx = (Math.random() - 0.5) * 2;
                p.vy = Math.random();
                p.vz = (Math.random() - 0.5) * 2;
                p.maxLife = p.life = 0.4 + Math.random() * 0.2;
                p.r = 0.2; p.g = 0.5; p.b = 1;
                p.size = 0.7;
                break;
            case 'nitro':
                p.vx = (Math.random() - 0.5) * 3;
                p.vy = 0.5 + Math.random();
                p.vz = (Math.random() - 0.5) * 3;
                p.maxLife = p.life = 0.3 + Math.random() * 0.2;
                p.r = 0; p.g = 0.8; p.b = 1;
                p.size = 0.9;
                break;
            case 'fire':
                p.vx = (Math.random() - 0.5) * 2;
                p.vy = 2 + Math.random() * 2;
                p.vz = (Math.random() - 0.5) * 2;
                p.maxLife = p.life = 0.3 + Math.random() * 0.2;
                p.r = 1; p.g = 0.3 + Math.random() * 0.4; p.b = 0;
                p.size = 0.6;
                break;
            case 'confetti':
                p.vx = (Math.random() - 0.5) * 15;
                p.vy = 8 + Math.random() * 8;
                p.vz = (Math.random() - 0.5) * 15;
                p.maxLife = p.life = 3 + Math.random() * 2;
                const hue = Math.random();
                const rgb = hslToRgb(hue, 1, 0.6);
                p.r = rgb[0]; p.g = rgb[1]; p.b = rgb[2];
                p.size = 0.8;
                break;
            case 'firework':
                const angle = Math.random() * Math.PI * 2;
                const elevation = Math.random() * Math.PI - Math.PI / 2;
                const speed = 5 + Math.random() * 10;
                p.vx = Math.cos(angle) * Math.cos(elevation) * speed;
                p.vy = Math.sin(elevation) * speed + 3;
                p.vz = Math.sin(angle) * Math.cos(elevation) * speed;
                p.maxLife = p.life = 0.8 + Math.random() * 0.5;
                const fhue = Math.random();
                const frgb = hslToRgb(fhue, 1, 0.7);
                p.r = frgb[0]; p.g = frgb[1]; p.b = frgb[2];
                p.size = 0.5;
                break;
            case 'rain':
                p.vx = -1;
                p.vy = -20 - Math.random() * 10;
                p.vz = 0;
                p.maxLife = p.life = 0.5 + Math.random() * 0.3;
                p.r = 0.6; p.g = 0.7; p.b = 0.9;
                p.size = 0.2;
                break;
            case 'snow':
                p.vx = (Math.random() - 0.5) * 2;
                p.vy = -2 - Math.random() * 2;
                p.vz = (Math.random() - 0.5) * 2;
                p.maxLife = p.life = 3 + Math.random() * 2;
                p.r = 0.95; p.g = 0.95; p.b = 1;
                p.size = 0.4;
                break;
            case 'slipstream':
                p.vx = (Math.random() - 0.5);
                p.vy = (Math.random() - 0.5);
                p.vz = (Math.random() - 0.5);
                p.maxLife = p.life = 0.3;
                p.r = 0; p.g = 0.7; p.b = 1;
                p.size = 0.4;
                break;
            case 'star':
                p.vx = (Math.random() - 0.5) * 6;
                p.vy = 2 + Math.random() * 3;
                p.vz = (Math.random() - 0.5) * 6;
                p.maxLife = p.life = 0.5;
                p.r = 1; p.g = 1; p.b = 0.3;
                p.size = 0.7;
                break;
            case 'lava':
                p.vx = (Math.random() - 0.5) * 2;
                p.vy = 3 + Math.random() * 3;
                p.vz = (Math.random() - 0.5) * 2;
                p.maxLife = p.life = 0.6;
                p.r = 1; p.g = 0.3; p.b = 0;
                p.size = 0.5;
                break;
        }
        return p;
    }

    function update(dt) {
        if (!points) return;

        const positions = geometry.attributes.position.array;
        const colors = geometry.attributes.color.array;
        const sizes = geometry.attributes.size.array;

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;

            // Gravity for confetti and fireworks
            if (p.maxLife > 1) p.vy -= 9.8 * dt;
        }

        // Write to buffers
        for (let i = 0; i < maxParticles; i++) {
            const idx3 = i * 3;
            if (i < particles.length) {
                const p = particles[i];
                const alpha = p.life / p.maxLife;
                positions[idx3] = p.x;
                positions[idx3 + 1] = p.y;
                positions[idx3 + 2] = p.z;
                colors[idx3] = p.r * alpha;
                colors[idx3 + 1] = p.g * alpha;
                colors[idx3 + 2] = p.b * alpha;
                sizes[i] = p.size * alpha;
            } else {
                positions[idx3] = 0;
                positions[idx3 + 1] = -1000;
                positions[idx3 + 2] = 0;
                sizes[i] = 0;
            }
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;
        geometry.attributes.size.needsUpdate = true;
    }

    // Tire marks
    function addTireMark(x, y, z, angle, scene) {
        if (!GAME.gfx.tireMarks) return;

        let mark;
        if (tireMarks.length >= MAX_TIRE_MARKS) {
            mark = tireMarks.shift();
        } else {
            const geom = new THREE.PlaneGeometry(0.3, 1.5);
            const mat = new THREE.MeshBasicMaterial({
                color: 0x111111,
                transparent: true,
                opacity: 0.6,
                depthWrite: false
            });
            mark = new THREE.Mesh(geom, mat);
            mark.rotation.x = -Math.PI / 2;
            scene.add(mark);
        }
        mark.position.set(x, y + 0.02, z);
        mark.rotation.z = -angle;
        mark.material.opacity = 0.6;
        mark.userData.age = 0;
        tireMarks.push(mark);
    }

    function updateTireMarks(dt) {
        for (let i = tireMarks.length - 1; i >= 0; i--) {
            const m = tireMarks[i];
            m.userData.age += dt;
            m.material.opacity = Math.max(0, 0.6 - m.userData.age * 0.05);
        }
    }

    function cleanup(scene) {
        if (points) scene.remove(points);
        tireMarks.forEach(m => scene.remove(m));
        tireMarks = [];
        particles = [];
    }

    function hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) { r = g = b = l; }
        else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1; if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [r, g, b];
    }

    return { init, emit, update, addTireMark, updateTireMarks, cleanup };
})();
