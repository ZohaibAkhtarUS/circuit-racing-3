// ============================================================
// CIRCUIT RACING 1 — Camera System
// ============================================================

function updateCamera(dt) {
    const p = playerCars[0];
    if (!p) return;
    const targetFOV = p.nitroActive || p.starActive ? 78 : 60;
    camera.fov += (targetFOV - camera.fov) * 0.08;
    camera.updateProjectionMatrix();

    if (cameraMode === 0) {
        // Chase cam
        const dist = 14, height = 7;
        const cx = p.x - Math.sin(p.angle) * dist;
        const cz = p.z - Math.cos(p.angle) * dist;
        camera.position.lerp(new THREE.Vector3(cx, p.mesh.position.y + height, cz), 0.08);
        camera.lookAt(new THREE.Vector3(p.x + Math.sin(p.angle) * 6, p.mesh.position.y + 1, p.z + Math.cos(p.angle) * 6));
    } else if (cameraMode === 1) {
        // Cockpit
        camera.position.set(p.x + Math.sin(p.angle) * 0.5, p.mesh.position.y + 1.8, p.z + Math.cos(p.angle) * 0.5);
        camera.lookAt(p.x + Math.sin(p.angle) * 20, p.mesh.position.y + 1, p.z + Math.cos(p.angle) * 20);
    } else if (cameraMode === 2) {
        // Overhead
        camera.position.lerp(new THREE.Vector3(p.x, p.mesh.position.y + 55, p.z + 10), 0.06);
        camera.lookAt(p.x, p.mesh.position.y, p.z);
    } else {
        // Orbit
        orbitAngle += dt * 0.3;
        camera.position.lerp(new THREE.Vector3(p.x + Math.cos(orbitAngle) * 60, p.mesh.position.y + 40, p.z + Math.sin(orbitAngle) * 60), 0.05);
        camera.lookAt(p.x, p.mesh.position.y + 1, p.z);
    }

    // Camera shake for nitro/star
    if (p.nitroActive || p.starActive) {
        camera.position.x += Math.sin(performance.now() * 0.03) * 0.12;
        camera.position.y += Math.cos(performance.now() * 0.025) * 0.08;
    }
}
