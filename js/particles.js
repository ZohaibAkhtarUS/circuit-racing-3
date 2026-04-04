// ============================================================
// CIRCUIT RACING 1 — Enhanced Particle System
// ============================================================

function initParticleSystem() {
    const maxP = currentGfx.particles;
    const positions = new Float32Array(maxP * 3);
    const colors = new Float32Array(maxP * 3);
    const sizes = new Float32Array(maxP);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    const mat = new THREE.PointsMaterial({
        size: 0.8, vertexColors: true, transparent: true, opacity: 0.7,
        sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    particleSystem = new THREE.Points(geo, mat);
    particleSystem.frustumCulled = false;
    scene.add(particleSystem);
    particleData = [];
}

function emitParticle(x, y, z, type, count) {
    const n = count || 1;
    for (let k = 0; k < n; k++) {
        let r, g, b, life, vy, sz, vx = 0, vz = 0;

        if (type === 'smoke')       { r = 0.85; g = 0.85; b = 0.85; life = 0.7; vy = 2.5; sz = 1.4; }
        else if (type === 'dust')   { r = 0.55; g = 0.45; b = 0.33; life = 0.9; vy = 1.2; sz = 1.0; }
        else if (type === 'exhaust'){ r = 0.45; g = 0.45; b = 0.5;  life = 0.4; vy = 0.6; sz = 0.5; }
        else if (type === 'spark')  { r = 1; g = 0.8; b = 0.2; life = 0.35; vy = 4; sz = 0.35; }
        else if (type === 'boost')  { r = 0.2; g = 0.6; b = 1; life = 0.5; vy = 2; sz = 0.9; }
        else if (type === 'fire')   { r = 1; g = 0.5 + Math.random() * 0.3; b = 0.1; life = 0.4; vy = 3; sz = 0.7; }
        else if (type === 'confetti') {
            const hue = Math.random();
            const rgb = hslToRgb(hue, 1, 0.6);
            r = rgb[0]; g = rgb[1]; b = rgb[2];
            life = 2 + Math.random() * 2; vy = 8 + Math.random() * 6; sz = 0.6;
            vx = (Math.random() - 0.5) * 10;
            vz = (Math.random() - 0.5) * 10;
        }
        else if (type === 'firework') {
            const hue = Math.random();
            const rgb = hslToRgb(hue, 1, 0.7);
            r = rgb[0]; g = rgb[1]; b = rgb[2];
            life = 1.2; vy = (Math.random() - 0.5) * 12;
            vx = (Math.random() - 0.5) * 12;
            vz = (Math.random() - 0.5) * 12;
            sz = 0.5;
        }
        else if (type === 'star') {
            r = 1; g = 1; b = 0.4; life = 0.6; vy = 2; sz = 0.5;
            vx = (Math.random() - 0.5) * 3;
            vz = (Math.random() - 0.5) * 3;
        }
        else if (type === 'lightning_spark') {
            r = 0.8; g = 0.8; b = 1; life = 0.3; vy = 5; sz = 0.4;
            vx = (Math.random() - 0.5) * 6;
            vz = (Math.random() - 0.5) * 6;
        }
        else return;

        if (particleData.length >= currentGfx.particles) particleData.shift();
        particleData.push({
            x: x + (Math.random() - 0.5) * 0.5, y: y + 0.3, z: z + (Math.random() - 0.5) * 0.5,
            vx: vx || (Math.random() - 0.5) * 2, vy, vz: vz || (Math.random() - 0.5) * 2,
            r, g, b, life, maxLife: life, sz, gravity: (type === 'confetti' || type === 'firework') ? 6 : 0
        });
    }
}

function updateParticles(dt) {
    if (!particleSystem) return;
    const maxP = currentGfx.particles;
    const pos = particleSystem.geometry.attributes.position.array;
    const col = particleSystem.geometry.attributes.color.array;
    const siz = particleSystem.geometry.attributes.size.array;

    for (let i = particleData.length - 1; i >= 0; i--) {
        const p = particleData[i];
        p.life -= dt;
        if (p.life <= 0) { particleData.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        p.vx *= 0.95; p.vy -= p.gravity * dt; p.vy *= 0.96; p.vz *= 0.95;
    }

    for (let i = 0; i < maxP; i++) {
        if (i < particleData.length) {
            const p = particleData[i];
            const t = 1 - p.life / p.maxLife;
            pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
            const fade = 1 - t * 0.3;
            col[i * 3] = p.r * fade; col[i * 3 + 1] = p.g * fade; col[i * 3 + 2] = p.b * fade;
            siz[i] = p.sz * (1 + t * 1.5) * (1 - t * 0.5);
        } else {
            pos[i * 3] = 0; pos[i * 3 + 1] = -100; pos[i * 3 + 2] = 0;
            siz[i] = 0;
        }
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;
    particleSystem.geometry.attributes.color.needsUpdate = true;
    particleSystem.geometry.attributes.size.needsUpdate = true;
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
