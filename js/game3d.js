// ============================================================
// CIRCUIT RACING 3 — Full Overhaul: Stylized Graphics + Gameplay
// ============================================================

// --- CONSTANTS ---
const CAR_COLORS = {
    dragon:    { body: 0xe74c3c, accent: 0xff2200, name: 'Fire Dragon' },
    thunder:   { body: 0x3498db, accent: 0x1a6dff, name: 'Thunder Bolt' },
    hulk:      { body: 0x2ecc71, accent: 0x00cc44, name: 'Hulk Smasher' },
    goldking:  { body: 0xf1c40f, accent: 0xffaa00, name: 'Gold King' },
    shadow:    { body: 0x2c3e50, accent: 0x1a1a2e, name: 'Shadow Ninja' },
    rocket:    { body: 0xff6b35, accent: 0xff4400, name: 'Rocket Blaster' },
    galaxy:    { body: 0x9b59b6, accent: 0x7d3c98, name: 'Galaxy Rider' },
    ice:       { body: 0x00d2ff, accent: 0x00aacc, name: 'Ice Breaker' },
    tiger:     { body: 0xff8c00, accent: 0xcc6600, name: 'Tiger Claw' },
    pink:      { body: 0xff69b4, accent: 0xcc5599, name: 'Pink Panther' }
};

// Family AI drivers - Mikhail's family!
const AI_DRIVERS = [
    { name: 'Ayzal', title: 'Speed Queen' },
    { name: 'Chachu', title: 'Drift Master' },
    { name: 'Dadi', title: 'The Legend' },
    { name: 'Dada', title: 'Road King' },
    { name: 'Mama', title: 'Turbo Star' },
    { name: 'Baba', title: 'The Champion' }
];

const PHYS = {
    maxSpeed: 140, accel: 55, brake: 70, reverseMax: 30,
    turnSpeed: 2.5, friction: 0.988, driftFriction: 0.93,
    driftTurnMult: 1.8, minTurnSpeed: 3, offTrackMult: 0.94,
    nitroBoost: 50, nitroDuration: 2.0, nitroCooldown: 8.0,
    wallSpeedLoss: 0.7, gravity: 30
};

const AI_DIFF = {
    easy:   { speedMult: 0.75, accuracy: 0.65, wpThresh: 20 },
    medium: { speedMult: 0.86, accuracy: 0.82, wpThresh: 15 },
    hard:   { speedMult: 0.95, accuracy: 0.93, wpThresh: 11 }
};

const RACE_LAPS = 3;
const TRACK_ROAD_W = 22;
const ITEMS = { BOOST: 'boost', SHIELD: 'shield', MISSILE: 'missile', OIL: 'oil' };
const ITEM_LIST = [ITEMS.BOOST, ITEMS.BOOST, ITEMS.SHIELD, ITEMS.MISSILE, ITEMS.MISSILE, ITEMS.OIL];
const TRACK_NAMES = ['Green Valley', 'Desert Circuit', 'Mountain Pass'];

// --- GLOBALS ---
let scene, camera, renderer, clock;
let gameState = 'menu';
let gameMode = 'vs_bots';
let playerColorKey = 'dragon';
let selectedTrack = 0;
let allCars = [], playerCars = [], aiCars = [];
let track = null;
let cameraMode = 0;
const cameraNames = ['Chase Cam', 'Cockpit', 'Overhead', 'Orbit'];
let orbitAngle = 0;
let raceStartTime = 0;
let keys = {};
let mobileInput = { up: false, down: false, left: false, right: false, drift: false, nitro: false, useItem: false };
let isMobile = false;
let tiltSteering = 0; // -1 to 1 from device orientation
let hasTilt = false;
let trackWalls = [];
let tutorialActive = false, tutorialStep = 0;
let minimapCtx = null;
let toonGradient = null;

// Optimized particle system
let particleSystem = null;
let particleData = [];
const MAX_PARTICLES = 600;

// Power-ups
let itemBoxes = [];
let projectiles = [];
let hazards = [];

// Clouds
let clouds = [];

// Moving obstacles
let movingObstacles = [];

// --- TOON GRADIENT ---
function createToonGradient() {
    const colors = new Uint8Array([40, 80, 160, 220]);
    const tex = new THREE.DataTexture(colors, 4, 1, THREE.LuminanceFormat);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    return tex;
}

// --- STYLIZED CAR MODEL ---
function createCarMesh(colorKey) {
    const c = CAR_COLORS[colorKey];
    const group = new THREE.Group();
    if (!toonGradient) toonGradient = createToonGradient();

    const bodyMat = new THREE.MeshToonMaterial({ color: c.body, gradientMap: toonGradient });
    const accentMat = new THREE.MeshToonMaterial({ color: c.accent, gradientMap: toonGradient });

    // Car body - smooth extruded shape with bevel
    const shape = new THREE.Shape();
    shape.moveTo(-2, 0);        // rear bottom
    shape.lineTo(2, 0);         // front bottom
    shape.quadraticCurveTo(2.3, 0, 2.3, 0.3); // front bumper curve
    shape.lineTo(2.1, 0.5);    // hood
    shape.lineTo(1.2, 0.5);    // hood to windshield
    shape.quadraticCurveTo(0.9, 1.0, 0.7, 1.1); // windshield curve
    shape.lineTo(-0.5, 1.1);   // roof
    shape.quadraticCurveTo(-1.0, 1.05, -1.3, 0.7); // rear window curve
    shape.lineTo(-1.8, 0.5);   // trunk
    shape.quadraticCurveTo(-2.2, 0.3, -2.2, 0.15); // rear bumper curve
    shape.lineTo(-2, 0);       // close

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

    // Wheels with hubs
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 16);
    const wheelMat = new THREE.MeshToonMaterial({ color: 0x1a1a1a, gradientMap: toonGradient });
    const hubGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.3, 8);
    const hubMat = new THREE.MeshToonMaterial({ color: 0x888888, gradientMap: toonGradient });
    const wheelPositions = [[-1.05, 0.38, 1.15], [1.05, 0.38, 1.15], [-1.05, 0.38, -1.15], [1.05, 0.38, -1.15]];
    wheelPositions.forEach(([x, y, z]) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(x, y, z);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        group.add(wheel);
        const hub = new THREE.Mesh(hubGeo, hubMat);
        hub.position.set(x, y, z);
        hub.rotation.z = Math.PI / 2;
        group.add(hub);
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

    // Headlights (emissive)
    const hlGeo = new THREE.SphereGeometry(0.14, 8, 6);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    [[-0.55, 0.55, 2.1], [0.55, 0.55, 2.1]].forEach(([x, y, z]) => {
        const hl = new THREE.Mesh(hlGeo, hlMat);
        hl.position.set(x, y, z);
        group.add(hl);
    });

    // Taillights
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    [[-0.55, 0.55, -2.1], [0.55, 0.55, -2.1]].forEach(([x, y, z]) => {
        const tl = new THREE.Mesh(hlGeo, tlMat);
        tl.position.set(x, y, z);
        group.add(tl);
    });

    // Outline (cel-shade edge) - clone body slightly scaled up with black backside
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

// --- TRACK WAYPOINTS ---
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
        } else {
            // Mountain Pass - long with switchbacks
            const rx = 90 + Math.sin(t * 3) * 25;
            const rz = 45 + Math.cos(t * 2) * 20;
            x = cx + Math.cos(t) * rx;
            z = cz + Math.sin(t) * rz;
            y = Math.sin(t * 2) * 5 + Math.cos(t * 4) * 2;
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
    // Lerp between neighbors
    const d1 = Math.sqrt((x - wp[pi].x) ** 2 + (z - wp[pi].z) ** 2);
    const d2 = Math.sqrt((x - wp[ni].x) ** 2 + (z - wp[ni].z) ** 2);
    const total = d1 + d2;
    if (total < 0.01) return wp[ci].y;
    return (wp[pi].y * d2 + wp[ni].y * d1) / total;
}

// --- TRACK BUILDER ---
function buildTrack() {
    const wp = getTrackWaypoints(selectedTrack);
    const roadW = TRACK_ROAD_W;
    trackWalls = [];

    // Ground
    const groundGeo = new THREE.PlaneGeometry(600, 400);
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 512; groundCanvas.height = 512;
    const gctx = groundCanvas.getContext('2d');
    gctx.fillStyle = '#2d5a1e';
    gctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 300; i++) {
        gctx.fillStyle = `rgba(${25 + Math.random() * 20|0},${60 + Math.random() * 30|0},${15 + Math.random() * 15|0},0.4)`;
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

        // Store wall edge data (simple: use current waypoint normal)
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

    // Road mesh
    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));
    roadGeo.setIndex(roadIdx);
    roadGeo.computeVertexNormals();
    // Procedural road texture
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 64; roadCanvas.height = 256;
    const rctx = roadCanvas.getContext('2d');
    rctx.fillStyle = '#3a3a3a';
    rctx.fillRect(0, 0, 64, 256);
    rctx.fillStyle = '#4a4a4a';
    rctx.fillRect(2, 0, 60, 256);
    // Edge lines
    rctx.fillStyle = '#ffffff';
    rctx.fillRect(0, 0, 2, 256);
    rctx.fillRect(62, 0, 2, 256);
    // Center dashes
    for (let y = 0; y < 256; y += 24) {
        rctx.fillStyle = 'rgba(255,255,255,0.5)';
        rctx.fillRect(30, y, 4, 12);
    }
    const roadTex = new THREE.CanvasTexture(roadCanvas);
    roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
    const roadMat = new THREE.MeshLambertMaterial({ map: roadTex });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // Curbs
    for (let i = 0; i < wp.length; i++) {
        const curr = wp[i], next = wp[(i + 1) % wp.length];
        const dir = new THREE.Vector3().subVectors(next, curr);
        const segLen = dir.length();
        dir.normalize();
        const norm = new THREE.Vector3(-dir.z, 0, dir.x);
        const angle = Math.atan2(dir.x, dir.z);
        const color = (Math.floor(i / 4) % 2 === 0) ? 0xff2200 : 0xffffff;
        const curbH = 0.3;

        for (const side of [-1, 1]) {
            const cOff = roadW / 2 + 0.75;
            const mid = curr.clone().add(next).multiplyScalar(0.5).add(norm.clone().multiplyScalar(side * cOff));
            const curb = new THREE.Mesh(
                new THREE.BoxGeometry(1.0, curbH, segLen + 0.05),
                new THREE.MeshToonMaterial({ color, gradientMap: toonGradient })
            );
            curb.position.set(mid.x, curr.y + curbH / 2, mid.z);
            curb.rotation.y = angle;
            scene.add(curb);
        }
    }

    // Walls
    const wallMat = new THREE.MeshToonMaterial({ color: 0xcccccc, gradientMap: toonGradient });
    const wallTopMat = new THREE.MeshToonMaterial({ color: 0xff6633, gradientMap: toonGradient });
    for (let i = 0; i < wp.length; i += 2) {
        const curr = wp[i], next = wp[(i + 1) % wp.length];
        const dir = new THREE.Vector3().subVectors(next, curr);
        const segLen = dir.length() * 2;
        dir.normalize();
        const norm = new THREE.Vector3(-dir.z, 0, dir.x);
        const angle = Math.atan2(dir.x, dir.z);
        const wallH = 1.3;

        for (const side of [-1, 1]) {
            const wOff = roadW / 2 + 1.8;
            const mid = curr.clone().add(next).multiplyScalar(0.5).add(norm.clone().multiplyScalar(side * wOff));
            const wall = new THREE.Mesh(new THREE.BoxGeometry(0.6, wallH, segLen + 0.2), wallMat);
            wall.position.set(mid.x, curr.y + wallH / 2, mid.z);
            wall.rotation.y = angle;
            wall.castShadow = true;
            scene.add(wall);
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, segLen + 0.2), wallTopMat);
            stripe.position.set(mid.x, curr.y + wallH + 0.1, mid.z);
            stripe.rotation.y = angle;
            scene.add(stripe);
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

    // Ramps
    const ramps = [];
    const rampIndices = [Math.floor(wp.length * 0.25), Math.floor(wp.length * 0.6)];
    rampIndices.forEach(ri => {
        const rp = wp[ri], rn = wp[(ri + 1) % wp.length];
        const rd = new THREE.Vector3().subVectors(rn, rp).normalize();
        const angle = Math.atan2(rd.x, rd.z);
        const rampGeo = new THREE.BoxGeometry(roadW * 0.4, 0.8, 6);
        const ramp = new THREE.Mesh(rampGeo, new THREE.MeshToonMaterial({ color: 0xffaa33, gradientMap: toonGradient }));
        ramp.position.set(rp.x, rp.y + 0.4, rp.z);
        ramp.rotation.y = angle;
        ramp.castShadow = true;
        scene.add(ramp);
        // Arrow on ramp
        const arrow = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 3), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
        arrow.position.set(rp.x, rp.y + 1.2, rp.z);
        arrow.rotation.x = -Math.PI / 2;
        arrow.rotation.z = -angle;
        scene.add(arrow);
        ramps.push({ pos: rp.clone(), radius: 8 });
    });

    // Moving obstacles
    movingObstacles = [];
    const obsIdx = Math.floor(wp.length * 0.45);
    const op = wp[obsIdx], on = wp[(obsIdx + 1) % wp.length];
    const od = new THREE.Vector3().subVectors(on, op).normalize();
    const oNorm = new THREE.Vector3(-od.z, 0, od.x);
    const obsGeo = new THREE.BoxGeometry(2, 2, 2);
    const obsMat = new THREE.MeshToonMaterial({ color: 0xff4444, gradientMap: toonGradient });
    const obs = new THREE.Mesh(obsGeo, obsMat);
    obs.position.set(op.x, op.y + 1, op.z);
    obs.castShadow = true;
    scene.add(obs);
    movingObstacles.push({ mesh: obs, center: op.clone(), norm: oNorm.clone(), range: roadW * 0.35, speed: 0.8, time: 0 });

    // Decorations
    addDecorations(wp, roadW);

    // Buildings
    addBuildings(wp, roadW);

    // Clouds
    addClouds();

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

    // Grandstand
    const gNorm = new THREE.Vector3(-sDir.z, 0, sDir.x);
    const gPos = p0.clone().add(gNorm.clone().multiplyScalar(roadW + 12));
    const stand = new THREE.Mesh(new THREE.BoxGeometry(16, 5, 6), new THREE.MeshToonMaterial({ color: 0x888888, gradientMap: toonGradient }));
    stand.position.set(gPos.x, p0.y + 2.5, gPos.z);
    stand.rotation.y = Math.atan2(sDir.x, sDir.z);
    stand.castShadow = true;
    scene.add(stand);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(17, 0.6, 7), new THREE.MeshToonMaterial({ color: 0xcc2222, gradientMap: toonGradient }));
    roof.position.set(gPos.x, p0.y + 5.5, gPos.z);
    roof.rotation.y = Math.atan2(sDir.x, sDir.z);
    scene.add(roof);

    return { waypoints: wp, checkpoints, startPositions, ramps };
}

function addDecorations(wp, roadW) {
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 3, 6);
    const trunkMat = new THREE.MeshToonMaterial({ color: 0x5d4e37, gradientMap: toonGradient });
    const greens = [0x1a7a1a, 0x228b22, 0x2d8b2d];

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
                // Layered tree
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                trunk.position.set(tx, ty + 1.5, tz);
                scene.add(trunk);
                const sizes = [2.8, 2.2, 1.5];
                const heights = [3.5, 5, 6.2];
                sizes.forEach((s, li) => {
                    const foliage = new THREE.Mesh(
                        new THREE.ConeGeometry(s, 2.2, 7),
                        new THREE.MeshToonMaterial({ color: greens[li], gradientMap: toonGradient })
                    );
                    foliage.position.set(tx, ty + heights[li], tz);
                    foliage.castShadow = true;
                    scene.add(foliage);
                });
            } else if (Math.random() < 0.5) {
                // Bush cluster
                for (let b = 0; b < 3; b++) {
                    const bx = tx + (Math.random() - 0.5) * 2;
                    const bz = tz + (Math.random() - 0.5) * 2;
                    const bush = new THREE.Mesh(
                        new THREE.SphereGeometry(0.8 + Math.random() * 0.6, 7, 5),
                        new THREE.MeshToonMaterial({ color: 0x3a7a2a, gradientMap: toonGradient })
                    );
                    bush.position.set(bx, ty + 0.6, bz);
                    bush.scale.y = 0.7;
                    scene.add(bush);
                }
            }
        }
    }
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
            new THREE.MeshToonMaterial({ color: bColors[bi], gradientMap: toonGradient })
        );
        base.position.set(bx, by + bh / 2, bz);
        base.castShadow = true;
        scene.add(base);

        // Roof
        const roofM = new THREE.Mesh(
            new THREE.BoxGeometry(9, 0.5, 7),
            new THREE.MeshToonMaterial({ color: 0x555555, gradientMap: toonGradient })
        );
        roofM.position.set(bx, by + bh + 0.25, bz);
        scene.add(roofM);
    });
}

function addClouds() {
    clouds = [];
    for (let i = 0; i < 10; i++) {
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

// --- POWER-UPS ---
function spawnItemBoxes(wp) {
    itemBoxes = [];
    for (let i = 0; i < wp.length; i += 12) {
        const p = wp[i];
        const group = new THREE.Group();
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 1.8, 1.8),
            new THREE.MeshToonMaterial({ color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 0.2, gradientMap: toonGradient })
        );
        group.add(box);
        // "?" on top
        const qGeo = new THREE.BoxGeometry(0.6, 0.1, 0.6);
        const q = new THREE.Mesh(qGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
        q.position.y = 1.1;
        group.add(q);
        group.position.set(p.x, p.y + 1.5, p.z);
        scene.add(group);
        itemBoxes.push({ mesh: group, pos: p.clone(), active: true, respawnTimer: 0, baseY: p.y + 1.5 });
    }
}

function updateItemBoxes(dt) {
    const t = performance.now() * 0.001;
    for (const ib of itemBoxes) {
        if (ib.active) {
            ib.mesh.rotation.y += dt * 2;
            ib.mesh.position.y = ib.baseY + Math.sin(t * 2 + ib.pos.x) * 0.5;
            ib.mesh.visible = true;
            // Check car collision
            for (const car of allCars) {
                if (car.heldItem) continue;
                const dx = car.x - ib.pos.x, dz = car.z - ib.pos.z;
                if (dx * dx + dz * dz < 9) {
                    car.heldItem = ITEM_LIST[Math.floor(Math.random() * ITEM_LIST.length)];
                    ib.active = false;
                    ib.mesh.visible = false;
                    ib.respawnTimer = 5;
                    // Flash effect
                    flashItemPickup();
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
        // Hit detection
        for (const car of allCars) {
            if (car === p.owner) continue;
            const dx = car.x - p.mesh.position.x, dz = car.z - p.mesh.position.z;
            if (dx * dx + dz * dz < 6) {
                if (car.shieldActive) {
                    car.shieldActive = false;
                    if (car.shieldMesh) { car.shieldMesh.visible = false; }
                } else {
                    car.speed *= 0.4;
                    car.driftAngle = 1.5;
                }
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
        for (const car of allCars) {
            if (car === h.owner) continue;
            const dx = car.x - h.mesh.position.x, dz = car.z - h.mesh.position.z;
            if (dx * dx + dz * dz < 6 && !car.oilCooldown) {
                if (car.shieldActive) {
                    car.shieldActive = false;
                    if (car.shieldMesh) car.shieldMesh.visible = false;
                } else {
                    car.angle += Math.PI * 0.5;
                    car.speed *= 0.4;
                    car.oilCooldown = 1.5;
                }
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
        // Car collision
        for (const car of allCars) {
            const dx = car.x - obs.mesh.position.x, dz = car.z - obs.mesh.position.z;
            if (dx * dx + dz * dz < 6) {
                car.speed *= -0.3;
                const pushDir = Math.atan2(dx, dz);
                car.x += Math.sin(pushDir) * 3;
                car.z += Math.cos(pushDir) * 3;
            }
        }
    }
}

// --- OPTIMIZED PARTICLE SYSTEM ---
function initParticleSystem() {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 3);
    const sizes = new Float32Array(MAX_PARTICLES);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    const mat = new THREE.PointsMaterial({
        size: 0.8, vertexColors: true, transparent: true, opacity: 0.6,
        sizeAttenuation: true, depthWrite: false
    });
    particleSystem = new THREE.Points(geo, mat);
    particleSystem.frustumCulled = false;
    scene.add(particleSystem);
    particleData = [];
}

function emitParticle(x, y, z, type) {
    // Skip most particles on mobile for performance
    if (isMobile && type !== 'boost' && Math.random() > 0.3) return;

    let r, g, b, life, vy, sz;
    if (type === 'smoke') { r = 0.8; g = 0.8; b = 0.8; life = 0.6; vy = 2; sz = 1.2; }
    else if (type === 'dust') { r = 0.55; g = 0.45; b = 0.33; life = 0.8; vy = 1; sz = 0.9; }
    else if (type === 'exhaust') { r = 0.5; g = 0.5; b = 0.5; life = 0.35; vy = 0.5; sz = 0.5; }
    else if (type === 'spark') { r = 1; g = 0.7; b = 0.2; life = 0.3; vy = 3; sz = 0.4; }
    else if (type === 'boost') { r = 0.2; g = 0.5; b = 1; life = 0.4; vy = 1.5; sz = 0.8; }
    else return;

    const maxP = isMobile ? 200 : MAX_PARTICLES;
    if (particleData.length >= maxP) particleData.shift();
    particleData.push({
        x: x + (Math.random() - 0.5) * 0.5, y: y + 0.3, z: z + (Math.random() - 0.5) * 0.5,
        vx: (Math.random() - 0.5) * 2, vy, vz: (Math.random() - 0.5) * 2,
        r, g, b, life, maxLife: life, sz
    });
}

function updateParticles(dt) {
    if (!particleSystem) return;
    const pos = particleSystem.geometry.attributes.position.array;
    const col = particleSystem.geometry.attributes.color.array;
    const siz = particleSystem.geometry.attributes.size.array;

    for (let i = particleData.length - 1; i >= 0; i--) {
        const p = particleData[i];
        p.life -= dt;
        if (p.life <= 0) { particleData.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        p.vx *= 0.95; p.vy *= 0.93; p.vz *= 0.95;
    }

    for (let i = 0; i < MAX_PARTICLES; i++) {
        if (i < particleData.length) {
            const p = particleData[i];
            const t = 1 - p.life / p.maxLife;
            pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
            col[i * 3] = p.r; col[i * 3 + 1] = p.g; col[i * 3 + 2] = p.b;
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

// --- CAR CLASS ---
class GameCar {
    constructor(x, z, angle, colorKey, playerIdx) {
        this.colorKey = colorKey;
        this.playerIndex = playerIdx;
        this.mesh = createCarMesh(colorKey);
        this.mesh.position.set(x, 0, z);
        this.mesh.rotation.y = angle;
        scene.add(this.mesh);

        this.x = x; this.z = z; this.angle = angle;
        this.speed = 0; this.vx = 0; this.vz = 0;
        this.vy = 0; this.airTime = 0; this.isAirborne = false;
        this.isDrifting = false; this.driftAngle = 0; this.driftCharge = 0;

        this.lap = 0; this.checkpoint = 0; this.finished = false;
        this.finishTime = 0; this.lapTimes = []; this.lapStartTime = 0; this.raceProgress = 0;

        this.nitroActive = false; this.nitroTimer = 0; this.nitroCooldownTimer = 0;
        this.heldItem = null; this.shieldActive = false; this.shieldMesh = null;
        this.oilCooldown = 0;
        this.lastPos = 0;
        this.driverName = '';
        this.driverTitle = '';
    }

    update(dt, input) {
        if (this.finished) { this.speed *= 0.95; this.applyPosition(dt); return; }
        if (this.oilCooldown > 0) this.oilCooldown -= dt;

        const effectiveMax = this.nitroActive ? PHYS.maxSpeed + PHYS.nitroBoost : PHYS.maxSpeed;
        const effectiveAccel = this.nitroActive ? PHYS.accel * 1.5 : PHYS.accel;

        // Accel/brake
        if (input.up) this.speed += effectiveAccel * dt;
        else if (input.down) {
            if (this.speed > 2) this.speed -= PHYS.brake * dt;
            else this.speed -= PHYS.accel * 0.5 * dt;
        } else {
            this.speed *= PHYS.friction;
        }
        this.speed = Math.max(-PHYS.reverseMax, Math.min(effectiveMax, this.speed));

        // Off-track slowdown
        if (track && !this.isOnTrack()) this.speed *= PHYS.offTrackMult;

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
        } else {
            // Drift boost on release
            if (wasDrifting && this.driftCharge > 0.5) {
                this.speed += this.driftCharge * 15;
                for (let i = 0; i < 5; i++) emitParticle(this.x, this.mesh.position.y, this.z, 'boost');
            }
            this.driftCharge = 0;
            this.driftAngle *= 0.85;
        }

        // Nitro
        if (input.nitro && this.nitroCooldownTimer <= 0 && !this.nitroActive) {
            this.nitroActive = true;
            this.nitroTimer = PHYS.nitroDuration;
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

        if (Math.abs(this.speed) < 0.3 && !input.up && !input.down) this.speed = 0;

        this.applyPosition(dt);
        this.updateCheckpoints();
    }

    activateItem() {
        const item = this.heldItem;
        this.heldItem = null;

        if (item === ITEMS.BOOST) {
            this.speed += 40;
            for (let i = 0; i < 8; i++) emitParticle(this.x, this.mesh.position.y, this.z, 'boost');
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
        } else if (item === ITEMS.OIL) {
            const oil = new THREE.Mesh(
                new THREE.CircleGeometry(2, 12),
                new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
            );
            oil.rotation.x = -Math.PI / 2;
            oil.position.set(this.x - Math.sin(this.angle) * 4, this.mesh.position.y + 0.05, this.z - Math.cos(this.angle) * 4);
            scene.add(oil);
            hazards.push({ mesh: oil, owner: this, life: 8 });
        }
    }

    applyPosition(dt) {
        this.vx = Math.sin(this.angle) * this.speed;
        this.vz = Math.cos(this.angle) * this.speed;
        let newX = this.x + this.vx * dt;
        let newZ = this.z + this.vz * dt;

        // Wall collision
        let blocked = false;
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
                this.speed *= PHYS.wallSpeedLoss;
                blocked = true;
                break;
            }
        }
        this.x = newX; this.z = newZ;

        // Hard track clamp — if car is beyond wall boundary, push back to track edge
        if (track) {
            let minD = Infinity, closestIdx = 0;
            for (let i = 0; i < track.waypoints.length; i++) {
                const dx = this.x - track.waypoints[i].x, dz = this.z - track.waypoints[i].z;
                const d = dx * dx + dz * dz;
                if (d < minD) { minD = d; closestIdx = i; }
            }
            const distFromCenter = Math.sqrt(minD);
            const maxDist = TRACK_ROAD_W / 2 + 1.2; // wall inner edge
            if (distFromCenter > maxDist) {
                // Push car back toward the closest waypoint
                const wp = track.waypoints[closestIdx];
                const dx = this.x - wp.x, dz = this.z - wp.z;
                const len = Math.sqrt(dx * dx + dz * dz);
                if (len > 0.01) {
                    this.x = wp.x + (dx / len) * maxDist;
                    this.z = wp.z + (dz / len) * maxDist;
                    this.speed *= 0.6; // penalty for hitting wall
                }
            }
        }

        // Elevation + airborne
        const trackY = track ? getTrackHeight(this.x, this.z, track.waypoints) : 0;

        // Check ramps
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
                if (this.lap > 0) { this.lapTimes.push(performance.now() - this.lapStartTime); this.lapStartTime = performance.now(); }
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

// --- AI CAR ---
class AICar extends GameCar {
    constructor(x, z, angle, colorKey, difficulty) {
        super(x, z, angle, colorKey, -1);
        this.diff = AI_DIFF[difficulty] || AI_DIFF.medium;
        this.currentWP = 0;
        this.steerNoise = (Math.random() - 0.5) * 0.3;
        this.speedVar = 0.95 + Math.random() * 0.1;
        this.itemUseTimer = 2 + Math.random() * 3;
    }

    updateAI(dt) {
        if (!track) return;
        const wp = track.waypoints[this.currentWP];
        const dx = wp.x - this.x, dz = wp.z - this.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < this.diff.wpThresh) this.currentWP = (this.currentWP + 1) % track.waypoints.length;

        const targetAngle = Math.atan2(dx, dz);
        let angleDiff = targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const input = { up: true, down: false, left: false, right: false, drift: false, nitro: false, useItem: false };
        const combined = angleDiff + this.steerNoise * (1 - this.diff.accuracy);
        if (combined > 0.05) input.left = true;
        else if (combined < -0.05) input.right = true;
        if (Math.abs(angleDiff) > 0.5 && this.speed > 50) { input.up = false; input.down = true; }

        // AI nitro usage
        if (Math.abs(angleDiff) < 0.2 && this.speed > 60 && this.nitroCooldownTimer <= 0) input.nitro = true;

        // AI item usage
        if (this.heldItem) {
            this.itemUseTimer -= dt;
            if (this.itemUseTimer <= 0) {
                input.useItem = true;
                this.itemUseTimer = 3 + Math.random() * 4;
            }
        }

        this.update(dt, input);
        this.speed = Math.min(this.speed, PHYS.maxSpeed * this.diff.speedMult * this.speedVar);

        if (Math.random() < 0.02) this.steerNoise = (Math.random() - 0.5) * 0.3;
        if (Math.random() < 0.005) this.speedVar = 0.93 + Math.random() * 0.14;
    }
}

// --- CAMERA ---
function updateCamera(dt) {
    const p = playerCars[0];
    if (!p) return;
    const targetFOV = p.nitroActive ? 78 : 60;
    camera.fov += (targetFOV - camera.fov) * 0.08;
    camera.updateProjectionMatrix();

    if (cameraMode === 0) {
        const dist = isMobile ? 18 : 14, height = isMobile ? 11 : 7;
        const lookAhead = isMobile ? 12 : 6;
        const smoothing = isMobile ? 0.06 : 0.08;
        const cx = p.x - Math.sin(p.angle) * dist;
        const cz = p.z - Math.cos(p.angle) * dist;
        camera.position.lerp(new THREE.Vector3(cx, p.mesh.position.y + height, cz), smoothing);
        camera.lookAt(new THREE.Vector3(p.x + Math.sin(p.angle) * lookAhead, p.mesh.position.y + 1, p.z + Math.cos(p.angle) * lookAhead));
    } else if (cameraMode === 1) {
        camera.position.set(p.x + Math.sin(p.angle) * 0.5, p.mesh.position.y + 1.8, p.z + Math.cos(p.angle) * 0.5);
        camera.lookAt(p.x + Math.sin(p.angle) * 20, p.mesh.position.y + 1, p.z + Math.cos(p.angle) * 20);
    } else if (cameraMode === 2) {
        camera.position.lerp(new THREE.Vector3(p.x, p.mesh.position.y + 55, p.z + 10), 0.06);
        camera.lookAt(p.x, p.mesh.position.y, p.z);
    } else {
        orbitAngle += dt * 0.3;
        camera.position.lerp(new THREE.Vector3(p.x + Math.cos(orbitAngle) * 60, p.mesh.position.y + 40, p.z + Math.sin(orbitAngle) * 60), 0.05);
        camera.lookAt(p.x, p.mesh.position.y + 1, p.z);
    }

    // Nitro camera shake
    if (p.nitroActive) {
        camera.position.x += Math.sin(performance.now() * 0.03) * 0.12;
        camera.position.y += Math.cos(performance.now() * 0.025) * 0.08;
    }
}

// --- HUD ---
function updateHUD() {
    const p = playerCars[0];
    if (!p) return;

    document.getElementById('speed-value').textContent = p.getSpeedKPH();
    const ratio = Math.abs(p.speed) / PHYS.maxSpeed;
    const bar = document.getElementById('speed-bar');
    bar.style.width = Math.min(ratio * 100, 100) + '%';
    bar.style.backgroundColor = ratio > 0.9 ? '#e74c3c' : ratio > 0.5 ? '#f1c40f' : '#2ecc71';

    const lap = Math.max(1, Math.min(p.lap, RACE_LAPS));
    document.getElementById('lap-text').textContent = `LAP ${lap}/${RACE_LAPS}`;
    if (p.lapStartTime > 0 && !p.finished) {
        document.getElementById('lap-time').textContent = formatTime(performance.now() - p.lapStartTime);
    }

    // Position
    const sorted = [...allCars].sort((a, b) => b.raceProgress - a.raceProgress);
    const pos = sorted.indexOf(p) + 1;
    document.getElementById('position-value').textContent = pos;
    const suffix = pos === 1 ? 'ST' : pos === 2 ? 'ND' : pos === 3 ? 'RD' : 'TH';
    document.getElementById('position-suffix').textContent = suffix;
    const posColor = { 1: '#f1c40f', 2: '#bdc3c7', 3: '#cd7f32' }[pos] || '#aaa';
    document.getElementById('position-value').style.color = posColor;
    document.getElementById('position-suffix').style.color = posColor;

    // Position change
    if (p.lastPos && p.lastPos !== pos) {
        const change = document.getElementById('position-change');
        change.textContent = pos < p.lastPos ? `+${p.lastPos - pos}` : `-${pos - p.lastPos}`;
        change.style.color = pos < p.lastPos ? '#2ecc71' : '#e74c3c';
        change.style.display = 'block';
        change.style.animation = 'none';
        void change.offsetHeight;
        change.style.animation = 'posChange 1s ease-out forwards';
    }
    p.lastPos = pos;

    // Item
    const itemIcon = document.getElementById('item-icon');
    const itemName = document.getElementById('item-name');
    if (p.heldItem) {
        const icons = { boost: '⚡', shield: '🛡', missile: '🚀', oil: '🛢' };
        const names = { boost: 'BOOST', shield: 'SHIELD', missile: 'MISSILE', oil: 'OIL' };
        itemIcon.textContent = icons[p.heldItem] || '?';
        itemName.textContent = names[p.heldItem] || '';
        document.getElementById('item-panel').style.borderColor = 'rgba(255,200,0,0.8)';
    } else {
        itemIcon.textContent = '-';
        itemName.textContent = '';
        document.getElementById('item-panel').style.borderColor = 'rgba(255,107,53,0.3)';
    }

    // Nitro bar
    const nitroBar = document.getElementById('nitro-bar');
    if (p.nitroActive) {
        nitroBar.style.width = (p.nitroTimer / PHYS.nitroDuration * 100) + '%';
        nitroBar.style.backgroundColor = '#00aaff';
    } else if (p.nitroCooldownTimer > 0) {
        nitroBar.style.width = ((1 - p.nitroCooldownTimer / PHYS.nitroCooldown) * 100) + '%';
        nitroBar.style.backgroundColor = '#666';
    } else {
        nitroBar.style.width = '100%';
        nitroBar.style.backgroundColor = '#00aaff';
    }

    updateMinimap();
}

function updateMinimap() {
    if (!minimapCtx || !track) return;
    const ctx = minimapCtx;
    ctx.clearRect(0, 0, 160, 160);
    const wp = track.waypoints;
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    for (const p of wp) { minX = Math.min(minX, p.x); minZ = Math.min(minZ, p.z); maxX = Math.max(maxX, p.x); maxZ = Math.max(maxZ, p.z); }
    const pad = 15, sx = (130) / (maxX - minX), sz = (130) / (maxZ - minZ);
    const scale = Math.min(sx, sz);
    const ox = pad + (130 - (maxX - minX) * scale) / 2;
    const oz = pad + (130 - (maxZ - minZ) * scale) / 2;
    ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i < wp.length; i++) {
        const x = ox + (wp[i].x - minX) * scale, y = oz + (wp[i].z - minZ) * scale;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
    for (const car of allCars) {
        const x = ox + (car.x - minX) * scale, y = oz + (car.z - minZ) * scale;
        const hex = '#' + CAR_COLORS[car.colorKey].body.toString(16).padStart(6, '0');
        if (car.playerIndex >= 0) { ctx.fillStyle = hex; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
        ctx.fillStyle = hex; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    }
}

function flashItemPickup() {
    const panel = document.getElementById('item-panel');
    panel.style.animation = 'none';
    void panel.offsetHeight;
    panel.style.animation = 'itemFlash 0.4s ease-out';
}

// --- MENU ---
function selectMode(el) {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    gameMode = el.dataset.mode;
    document.getElementById('controls-help').textContent = gameMode === 'vs_bots'
        ? 'WASD/Arrows: Drive | Space/Shift: Drift | E: Nitro | F: Use Item | C: Camera'
        : 'P1: WASD+Space+E+F | P2: Arrows+Shift | C: Camera';
}
function selectCar(el) {
    document.querySelectorAll('.car-option').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    playerColorKey = el.dataset.color;
}
function selectTrackOption(el) {
    document.querySelectorAll('.track-option').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    selectedTrack = parseInt(el.dataset.track);
}

function rebuildScene() {
    // Clear entire scene except lights
    const toRemove = [];
    scene.traverse(obj => { if (obj !== scene && !(obj instanceof THREE.Light) && !(obj instanceof THREE.Camera)) toRemove.push(obj); });
    toRemove.forEach(obj => { scene.remove(obj); if (obj.geometry) obj.geometry.dispose(); if (obj.material) { if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose()); else obj.material.dispose(); } });
    particleData = [];
    itemBoxes = []; projectiles = []; hazards = []; movingObstacles = []; clouds = [];
    track = buildTrack();
    initParticleSystem();
}

function startRace() {
    document.getElementById('menu-overlay').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('result-overlay').style.display = 'none';

    allCars.forEach(c => c.destroy());
    allCars = []; playerCars = []; aiCars = [];

    rebuildScene();

    const sp = track.startPositions;
    const availColors = Object.keys(CAR_COLORS).filter(c => c !== playerColorKey);
    // Shuffle available colors for variety
    for (let i = availColors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availColors[i], availColors[j]] = [availColors[j], availColors[i]];
    }

    if (gameMode === 'vs_bots') {
        // Mikhail's car
        const p1 = new GameCar(sp[0].pos.x, sp[0].pos.z, sp[0].angle, playerColorKey, 0);
        p1.driverName = 'Mikhail';
        playerCars.push(p1);
        allCars.push(p1);
        // 5 family AI drivers
        const difficulties = ['easy', 'easy', 'medium', 'medium', 'hard'];
        const numAI = Math.min(5, sp.length - 1, availColors.length);
        for (let i = 0; i < numAI; i++) {
            const ai = new AICar(sp[i + 1].pos.x, sp[i + 1].pos.z, sp[i + 1].angle, availColors[i], difficulties[i]);
            ai.driverName = AI_DRIVERS[i].name;
            ai.driverTitle = AI_DRIVERS[i].title;
            aiCars.push(ai); allCars.push(ai);
        }
    } else {
        const p1 = new GameCar(sp[0].pos.x, sp[0].pos.z, sp[0].angle, playerColorKey, 0);
        p1.driverName = 'Mikhail';
        playerCars.push(p1);
        const p2 = new GameCar(sp[1].pos.x, sp[1].pos.z, sp[1].angle, availColors[0], 1);
        p2.driverName = 'Ayzal';
        playerCars.push(p2);
        allCars.push(p1, p2);
        const difficulties = ['easy', 'medium', 'medium', 'hard'];
        const numAI = Math.min(4, sp.length - 2, availColors.length - 1);
        for (let i = 0; i < numAI; i++) {
            const ai = new AICar(sp[i + 2].pos.x, sp[i + 2].pos.z, sp[i + 2].angle, availColors[i + 1], difficulties[i]);
            ai.driverName = AI_DRIVERS[i + 1].name; // Skip Ayzal, she's P2
            ai.driverTitle = AI_DRIVERS[i + 1].title;
            aiCars.push(ai); allCars.push(ai);
        }
    }

    if (!localStorage.getItem('turboRacersTutorialDone')) {
        gameState = 'tutorial';
        startTutorial();
        localStorage.setItem('turboRacersTutorialDone', '1');
    } else {
        gameState = 'countdown';
        runCountdown();
    }
}

function startRaceWithTutorial() { localStorage.removeItem('turboRacersTutorialDone'); startRace(); }

function runCountdown() {
    const el = document.getElementById('countdown');
    el.style.display = 'block';
    let count = 3;
    function tick() {
        if (count > 0) {
            el.textContent = count;
            el.style.color = count === 3 ? '#fff' : count === 2 ? '#f1c40f' : '#e74c3c';
            el.style.animation = 'none'; void el.offsetHeight; el.style.animation = 'countPop 0.4s ease-out';
            count--; setTimeout(tick, 1000);
        } else {
            el.textContent = 'GO MIKHAIL!'; el.style.color = '#2ecc71'; el.style.fontSize = '70px';
            el.style.animation = 'none'; void el.offsetHeight; el.style.animation = 'countPop 0.4s ease-out';
            gameState = 'racing'; raceStartTime = performance.now();
            allCars.forEach(c => { c.lapStartTime = performance.now(); c.lap = 1; });
            setTimeout(() => { el.style.display = 'none'; }, 500);
        }
    }
    tick();
}

function checkRaceFinish() {
    if (gameState !== 'racing') return;
    if (playerCars.every(c => c.finished)) {
        gameState = 'finished';
        allCars.forEach(c => { if (!c.finished) { c.finished = true; c.finishTime = performance.now(); } });
        setTimeout(showResults, 1500);
    }
}

function showResults() {
    const sorted = [...allCars].sort((a, b) => a.finishTime - b.finishTime);
    const isWinner = sorted[0].playerIndex >= 0;
    const overlay = document.getElementById('result-overlay');
    overlay.style.display = 'flex';
    const winnerName = sorted[0].driverName || CAR_COLORS[sorted[0].colorKey].name;
    if (isWinner) {
        document.getElementById('result-title').textContent = 'MIKHAIL WINS!!! 🏆';
        document.getElementById('result-title').style.color = '#f1c40f';
    } else {
        document.getElementById('result-title').textContent = `${winnerName} Wins!`;
        document.getElementById('result-title').style.color = '#ff6b35';
    }
    const table = document.getElementById('result-table');
    table.innerHTML = '';
    const posColors = { 1: '#f1c40f', 2: '#bdc3c7', 3: '#cd7f32', 4: '#888', 5: '#888', 6: '#888' };
    const suffixes = { 1: 'ST', 2: 'ND', 3: 'RD' };
    sorted.forEach((car, i) => {
        const pos = i + 1, c = CAR_COLORS[car.colorKey], isP = car.playerIndex >= 0;
        const driverLabel = car.driverName || c.name;
        const titleLabel = car.driverTitle ? ` "${car.driverTitle}"` : '';
        const row = document.createElement('div');
        row.className = 'result-row' + (isP ? ' player' : '');
        row.innerHTML = `<span class="result-pos" style="color:${posColors[pos] || '#888'}">${pos}<small>${suffixes[pos] || 'TH'}</small></span><span class="result-car-preview" style="background:#${c.body.toString(16).padStart(6, '0')}"></span><span class="result-name" style="color:${isP ? '#ff6b35' : '#ccc'}">${driverLabel}${titleLabel}</span><span class="result-time">${formatTime(car.finishTime - raceStartTime)}</span>`;
        table.appendChild(row);
    });
}

function restartRace() { document.getElementById('result-overlay').style.display = 'none'; startRace(); }
function backToMenu() {
    document.getElementById('result-overlay').style.display = 'none';
    document.getElementById('hud').style.display = 'none';
    document.getElementById('menu-overlay').style.display = 'flex';
    gameState = 'menu';
    allCars.forEach(c => c.destroy());
    allCars = []; playerCars = []; aiCars = [];
}

function formatTime(ms) { const s = ms / 1000; return `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}.${Math.floor((s * 10) % 10)}`; }

// --- INPUT ---
function getP1Input() {
    if (gameMode === 'vs_bots') {
        return { up: keys['ArrowUp'] || keys['KeyW'] || mobileInput.up, down: keys['ArrowDown'] || keys['KeyS'] || mobileInput.down,
            left: keys['ArrowLeft'] || keys['KeyA'] || mobileInput.left, right: keys['ArrowRight'] || keys['KeyD'] || mobileInput.right,
            drift: keys['ShiftLeft'] || keys['ShiftRight'] || keys['Space'] || mobileInput.drift,
            nitro: keys['KeyE'] || mobileInput.nitro, useItem: keys['KeyF'] || mobileInput.useItem };
    }
    return { up: keys['KeyW'] || mobileInput.up, down: keys['KeyS'] || mobileInput.down,
        left: keys['KeyA'] || mobileInput.left, right: keys['KeyD'] || mobileInput.right,
        drift: keys['Space'] || mobileInput.drift, nitro: keys['KeyE'] || mobileInput.nitro, useItem: keys['KeyF'] || mobileInput.useItem };
}
function getP2Input() {
    return { up: keys['ArrowUp'], down: keys['ArrowDown'], left: keys['ArrowLeft'], right: keys['ArrowRight'],
        drift: keys['ShiftLeft'] || keys['ShiftRight'], nitro: false, useItem: false };
}

// --- TUTORIAL ---
const TUTORIAL_STEPS = [
    { title: 'Hey Mikhail! Welcome!', text: 'This is YOUR racing game! Race against Ayzal, Chachu, Dadi, Dada & Mama! Let\'s learn how to drive!', keys: [], highlight: null },
    { title: 'Accelerate & Brake', text: 'Hold gas to speed up, brake to slow down.', keys: [{ key: 'W / UP', label: 'Gas' }, { key: 'S / DOWN', label: 'Brake' }], highlight: 'speed-panel' },
    { title: 'Steering', text: 'Turn left and right to follow the track.', keys: [{ key: 'A / LEFT', label: 'Left' }, { key: 'D / RIGHT', label: 'Right' }], highlight: null },
    { title: 'Drifting', text: 'Hold drift while turning for sharp corners. Release after charging for a speed boost!', keys: [{ key: 'SPACE / SHIFT', label: 'Drift' }], highlight: null },
    { title: 'Nitro Boost', text: 'Press E for a powerful speed boost! 8 second cooldown.', keys: [{ key: 'E', label: 'Nitro' }], highlight: 'nitro-panel' },
    { title: 'Power-Ups', text: 'Drive through gold boxes to collect items. Press F to use them!', keys: [{ key: 'F', label: 'Use Item' }], highlight: 'item-panel' },
    { title: 'Camera & Track', text: 'Switch camera views. Watch for ramps, moving obstacles, and walls!', keys: [{ key: 'C', label: 'Camera' }], highlight: 'camera-info' },
    { title: 'Ready to Race!', text: 'Complete 3 laps to win! Can you beat Chachu and Dada? Let\'s find out! Good luck Mikhail!', keys: [], highlight: null, isFinal: true }
];

function startTutorial() { tutorialActive = true; tutorialStep = 0; document.getElementById('tutorial-overlay').style.display = 'flex'; showTutorialStep(); }
function showTutorialStep() {
    const step = TUTORIAL_STEPS[tutorialStep], total = TUTORIAL_STEPS.length;
    const ind = document.getElementById('tutorial-step-indicator');
    ind.innerHTML = '';
    for (let i = 0; i < total; i++) { const d = document.createElement('div'); d.className = 'dot' + (i === tutorialStep ? ' active' : i < tutorialStep ? ' done' : ''); ind.appendChild(d); }
    document.getElementById('tutorial-title').textContent = step.title;
    document.getElementById('tutorial-text').textContent = step.text;
    const keysDiv = document.getElementById('tutorial-keys');
    keysDiv.innerHTML = '';
    step.keys.forEach(k => { const b = document.createElement('div'); b.className = 'key-badge'; b.innerHTML = `${k.key}<span class="key-label">${k.label}</span>`; keysDiv.appendChild(b); });
    document.getElementById('tutorial-next').textContent = step.isFinal ? 'Start Race!' : 'Next';
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    if (step.highlight) { const el = document.getElementById(step.highlight); if (el) el.classList.add('tutorial-highlight'); }
    const box = document.getElementById('tutorial-box');
    box.style.animation = 'none'; void box.offsetHeight; box.style.animation = 'tutorialSlideUp 0.4s ease-out';
}
function nextTutorialStep() { tutorialStep++; if (tutorialStep >= TUTORIAL_STEPS.length) endTutorial(); else showTutorialStep(); }
function skipTutorial() { endTutorial(); }
function endTutorial() { tutorialActive = false; document.getElementById('tutorial-overlay').style.display = 'none'; document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight')); gameState = 'countdown'; runCountdown(); }

// --- MOBILE CONTROLS ---
function setupMobileControls() {
    isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (!isMobile) return;

    document.body.classList.add('is-mobile');

    // Mobile auto-accelerates — no need to hold gas!
    mobileInput.up = true;

    // --- TILT STEERING (gyroscope) ---
    function handleOrientation(e) {
        if (e.gamma !== null) {
            hasTilt = true;
            // gamma: -90 to 90 degrees (left/right tilt)
            // Normalize to -1..1 with dead zone
            let tilt = e.gamma / 30; // 30 degrees = full turn
            tilt = Math.max(-1, Math.min(1, tilt));
            // Dead zone
            if (Math.abs(tilt) < 0.08) tilt = 0;
            tiltSteering = tilt;
            mobileInput.left = tilt < -0.15;
            mobileInput.right = tilt > 0.15;
            // Auto-drift on sharp tilt
            mobileInput.drift = Math.abs(tilt) > 0.6;
        }
    }

    // Request permission for tilt (iOS requires this)
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ — will request on first touch
        document.addEventListener('touchstart', function requestTilt() {
            DeviceOrientationEvent.requestPermission().then(function(permission) {
                if (permission === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                }
            }).catch(function() {});
            document.removeEventListener('touchstart', requestTilt);
        }, { once: true });
    } else {
        window.addEventListener('deviceorientation', handleOrientation);
    }

    // --- TAP STEERING (fallback + supplement to tilt) ---
    const steerLeft = document.getElementById('steer-left');
    const steerRight = document.getElementById('steer-right');

    function setupSteerBtn(btn, dir) {
        btn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            btn.classList.add('pressed');
            mobileInput[dir] = true;
        }, { passive: false });
        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            btn.classList.remove('pressed');
            mobileInput[dir] = false;
        }, { passive: false });
        btn.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            btn.classList.remove('pressed');
            mobileInput[dir] = false;
        }, { passive: false });
    }
    setupSteerBtn(steerLeft, 'left');
    setupSteerBtn(steerRight, 'right');

    // --- BRAKE button ---
    const brakeBtn = document.getElementById('brake-btn');
    brakeBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        brakeBtn.classList.add('pressed');
        mobileInput.down = true;
        mobileInput.up = false; // Stop auto-gas while braking
    }, { passive: false });
    brakeBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        brakeBtn.classList.remove('pressed');
        mobileInput.down = false;
        mobileInput.up = true; // Resume auto-gas
    }, { passive: false });
    brakeBtn.addEventListener('touchcancel', function(e) {
        e.preventDefault();
        brakeBtn.classList.remove('pressed');
        mobileInput.down = false;
        mobileInput.up = true;
    }, { passive: false });

    // --- Nitro & Item buttons ---
    function setupActionBtn(id, inputKey) {
        const btn = document.getElementById(id);
        btn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            btn.classList.add('pressed');
            mobileInput[inputKey] = true;
            setTimeout(function() { mobileInput[inputKey] = false; }, 150);
        }, { passive: false });
        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            btn.classList.remove('pressed');
        }, { passive: false });
        btn.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            btn.classList.remove('pressed');
        }, { passive: false });
    }
    setupActionBtn('btn-nitro', 'nitro');
    setupActionBtn('btn-item', 'useItem');

    // --- AUTO-USE ITEMS on mobile (use items automatically after 2 seconds) ---
    setInterval(function() {
        if (gameState === 'racing' && playerCars[0] && playerCars[0].heldItem) {
            mobileInput.useItem = true;
            setTimeout(function() { mobileInput.useItem = false; }, 150);
        }
    }, 2000);

    // Show tilt indicator briefly
    const tiltInd = document.getElementById('tilt-indicator');
    if (tiltInd) tiltInd.style.display = 'block';

    // --- Prevent all zooming/scrolling on the game ---
    document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
    document.addEventListener('gesturestart', function(e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('gesturechange', function(e) { e.preventDefault(); }, { passive: false });

    // --- MOBILE PERFORMANCE OPTIMIZATIONS ---
    if (renderer) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        // Disable shadows on mobile — huge performance win
        renderer.shadowMap.enabled = false;
    }
    if (scene && scene.fog) {
        scene.fog.near = 50;
        scene.fog.far = 160;
    }

    // Make physics more forgiving on mobile
    PHYS.turnSpeed = 3.2;       // Faster turning
    PHYS.friction = 0.992;      // Less friction = easier to keep speed
    PHYS.offTrackMult = 0.97;   // Less penalty for going off
    PHYS.wallSpeedLoss = 0.85;  // Less wall bounce penalty

    // Force chase cam (best for mobile)
    cameraMode = 0;
}

// --- INIT ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7ec8e3);
    scene.fog = new THREE.Fog(0x7ec8e3, 100, 300);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 30, 50);

    const earlyMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    renderer = new THREE.WebGLRenderer({ antialias: !earlyMobile, powerPreference: earlyMobile ? 'low-power' : 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, earlyMobile ? 1.5 : 2));
    renderer.shadowMap.enabled = !earlyMobile;
    if (!earlyMobile) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').insertBefore(renderer.domElement, document.getElementById('menu-overlay'));

    // Lighting
    scene.add(new THREE.AmbientLight(0x505070, 0.6));
    const sun = new THREE.DirectionalLight(0xffeedd, 1.1);
    sun.position.set(50, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width = sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = sun.shadow.camera.bottom = -130;
    sun.shadow.camera.right = sun.shadow.camera.top = 130;
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x7ec8e3, 0x2d5a1e, 0.5));
    // Warm fill
    const fill = new THREE.PointLight(0xffaa44, 0.4, 80);
    fill.position.set(0, 10, 0);
    scene.add(fill);

    toonGradient = createToonGradient();
    track = buildTrack();
    initParticleSystem();

    minimapCtx = document.getElementById('minimap-canvas').getContext('2d');
    clock = new THREE.Clock();

    window.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (e.code === 'KeyC') {
            cameraMode = (cameraMode + 1) % cameraNames.length;
            document.getElementById('camera-info').innerHTML = `<kbd>C</kbd> ${cameraNames[cameraMode]}`;
        }
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });
    window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });

    animate();
    setupMobileControls();
}

// --- GAME LOOP ---
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    // Clouds drift
    for (const c of clouds) { c.mesh.position.x += c.speed * dt; if (c.mesh.position.x > 200) c.mesh.position.x = -200; }

    if (gameState === 'racing' || gameState === 'finished') {
        if (playerCars[0]) playerCars[0].update(dt, getP1Input());
        if (playerCars[1]) playerCars[1].update(dt, getP2Input());
        for (const ai of aiCars) ai.updateAI(dt);

        // Effects
        for (const car of allCars) {
            const spd = Math.abs(car.speed);
            if (car.isDrifting && spd > 15) {
                const bx = car.x - Math.sin(car.angle) * 2.5, bz = car.z - Math.cos(car.angle) * 2.5;
                emitParticle(bx, car.mesh.position.y, bz, 'smoke');
                if (car.driftCharge > 0.8) emitParticle(bx, car.mesh.position.y, bz, 'spark');
            }
            if (spd > 5 && Math.random() < 0.12) emitParticle(car.x - Math.sin(car.angle) * 2.5, car.mesh.position.y, car.z - Math.cos(car.angle) * 2.5, 'exhaust');
            if (spd > 8 && !car.isOnTrack()) emitParticle(car.x, car.mesh.position.y, car.z, 'dust');
            if (car.nitroActive) { emitParticle(car.x - Math.sin(car.angle) * 2.5, car.mesh.position.y, car.z - Math.cos(car.angle) * 2.5, 'boost'); }
        }

        updateParticles(dt);
        updateItemBoxes(dt);
        updateProjectiles(dt);
        updateHazards(dt);
        updateMovingObstacles(dt);
        updateHUD();
        checkRaceFinish();
    }

    if (gameState !== 'menu') updateCamera(dt);
    renderer.render(scene, camera);
}

init();
