// ===== CIRCUIT RACING 4 - CAMERA =====

const Camera = (() => {
    let mode = 0; // 0=chase, 1=cockpit, 2=overhead, 3=orbit
    let orbitAngle = 0;
    let shakeX = 0, shakeY = 0;
    const MODES = ['Chase', 'Cockpit', 'Overhead', 'Orbit'];

    const settings = {
        chase: { dist: 14, height: 7, lookAhead: 6, lerp: 0.08 },
        cockpit: { offset: { x: 0, y: 1.5, z: 0.5 }, lookDist: 20 },
        overhead: { height: 55, offset: 10 },
        orbit: { radius: 60, height: 40, speed: 0.3 }
    };

    function update(dt, camera, car) {
        if (!car) return;

        // Camera shake (nitro)
        shakeX *= 0.9;
        shakeY *= 0.9;
        if (car.nitroActive && GAME.shakeEnabled) {
            shakeX = (Math.random() - 0.5) * 0.15;
            shakeY = (Math.random() - 0.5) * 0.1;
        }

        // FOV
        const targetFOV = car.nitroActive ? 78 : (car.slipstreamActive ? 72 : 60);
        camera.fov += (targetFOV - camera.fov) * 0.05;
        camera.updateProjectionMatrix();

        switch (mode) {
            case 0: updateChase(dt, camera, car); break;
            case 1: updateCockpit(dt, camera, car); break;
            case 2: updateOverhead(dt, camera, car); break;
            case 3: updateOrbit(dt, camera, car); break;
        }

        camera.position.x += shakeX;
        camera.position.y += shakeY;
    }

    function updateChase(dt, camera, car) {
        const s = settings.chase;
        const mobileExtra = GAME.isMobile ? 4 : 0;

        const idealX = car.x - Math.sin(car.angle) * (s.dist + mobileExtra);
        const idealY = car.y + s.height + mobileExtra * 0.5;
        const idealZ = car.z - Math.cos(car.angle) * (s.dist + mobileExtra);

        camera.position.x += (idealX - camera.position.x) * s.lerp;
        camera.position.y += (idealY - camera.position.y) * s.lerp;
        camera.position.z += (idealZ - camera.position.z) * s.lerp;

        const lookX = car.x + Math.sin(car.angle) * s.lookAhead;
        const lookY = car.y + 1;
        const lookZ = car.z + Math.cos(car.angle) * s.lookAhead;
        camera.lookAt(lookX, lookY, lookZ);
    }

    function updateCockpit(dt, camera, car) {
        const s = settings.cockpit;
        camera.position.set(
            car.x + Math.cos(car.angle) * s.offset.x,
            car.y + s.offset.y,
            car.z + Math.sin(car.angle) * s.offset.x
        );
        const lookX = car.x + Math.sin(car.angle) * s.lookDist;
        const lookY = car.y + 1;
        const lookZ = car.z + Math.cos(car.angle) * s.lookDist;
        camera.lookAt(lookX, lookY, lookZ);
    }

    function updateOverhead(dt, camera, car) {
        const s = settings.overhead;
        camera.position.set(car.x, car.y + s.height, car.z + s.offset);
        camera.lookAt(car.x, car.y, car.z);
    }

    function updateOrbit(dt, camera, car) {
        const s = settings.orbit;
        orbitAngle += s.speed * dt;
        camera.position.set(
            car.x + Math.cos(orbitAngle) * s.radius,
            car.y + s.height,
            car.z + Math.sin(orbitAngle) * s.radius
        );
        camera.lookAt(car.x, car.y + 2, car.z);
    }

    function nextMode() {
        mode = (mode + 1) % MODES.length;
        return MODES[mode];
    }

    function getModeName() { return MODES[mode]; }

    function reset() {
        mode = 0;
        orbitAngle = 0;
        shakeX = shakeY = 0;
    }

    return { update, nextMode, getModeName, reset };
})();
