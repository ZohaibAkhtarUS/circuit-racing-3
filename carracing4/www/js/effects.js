// ===== CIRCUIT RACING 4 - EFFECTS =====

const Effects = (() => {
    let composer = null;
    let bloomPass = null;
    let envMap = null;

    function setupPostProcessing(renderer, scene, camera) {
        if (!GAME.gfx.bloom) return null;

        // Check if Three.js addons are available
        if (!THREE.EffectComposer) {
            console.log('Post-processing addons not loaded, skipping bloom');
            return null;
        }

        try {
            composer = new THREE.EffectComposer(renderer);
            const renderPass = new THREE.RenderPass(scene, camera);
            composer.addPass(renderPass);

            bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.35, // strength
                0.4,  // radius
                0.85  // threshold
            );
            composer.addPass(bloomPass);

            return composer;
        } catch (e) {
            console.log('Post-processing setup failed:', e.message);
            return null;
        }
    }

    function createEnvironmentMap(scene) {
        if (!GAME.gfx.reflections) return null;

        try {
            // Create a simple procedural env map
            const size = 128;
            const pmremGenerator = new THREE.PMREMGenerator(GAME.renderer);
            pmremGenerator.compileEquirectangularShader();

            // Create a simple env scene
            const envScene = new THREE.Scene();
            const trackDef = GAME.trackDef || TRACK_DEFS[0];

            // Sky color
            const skyColors = trackDef.skyColors;
            envScene.background = new THREE.Color(skyColors[1]);

            // Add hemisphere light
            const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
            envScene.add(hemi);

            envMap = pmremGenerator.fromScene(envScene, 0.04).texture;
            pmremGenerator.dispose();

            return envMap;
        } catch (e) {
            console.log('Env map creation failed:', e.message);
            return null;
        }
    }

    function resize(width, height) {
        if (composer) {
            composer.setSize(width, height);
        }
    }

    function render() {
        if (composer) {
            composer.render();
            return true;
        }
        return false;
    }

    function cleanup() {
        if (composer) composer.dispose();
        composer = null;
        envMap = null;
    }

    return { setupPostProcessing, createEnvironmentMap, resize, render, cleanup };
})();
