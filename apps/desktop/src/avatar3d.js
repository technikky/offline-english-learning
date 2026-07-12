// 3D conversation avatar (Chinese-support feature).
//
// Replaces the flat SVG avatar in free-conversation mode with a real-time
// Three.js 3D head that gently idles and lip-syncs (jaw opens/closes) while the
// AI speaks. Two variants — "female" and "male" — mirror the two Piper voices.
//
// This is a stylized, fully-offline procedural model (no external assets, works
// under the app's strict local-file loading). It uses the standard glTF-capable
// Three.js core, so a photorealistic rigged .glb head can be dropped in later by
// swapping buildHead() for a GLTFLoader load without touching the callers.

const Avatar3D = (function () {
  let renderer, scene, camera, headGroup, mouth, rafId;
  let speaking = false;
  let mounted = false;
  let clock;

  function skinMaterial() {
    return new THREE.MeshStandardMaterial({ color: 0xf1c9a5, roughness: 0.75, metalness: 0.05 });
  }

  function buildHead(voice) {
    const group = new THREE.Group();
    const female = voice !== "male";

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 48), skinMaterial());
    head.scale.set(1, 1.18, 1);
    group.add(head);

    // Neck
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 0.6, 24),
      skinMaterial(),
    );
    neck.position.y = -1.25;
    group.add(neck);

    // Eyes (white + iris)
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const irisMat = new THREE.MeshStandardMaterial({ color: 0x4a2c15, roughness: 0.2 });
    for (const sx of [-1, 1]) {
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 24), eyeWhiteMat);
      white.position.set(0.35 * sx, 0.2, 0.85);
      white.scale.set(1, 0.75, 0.6);
      group.add(white);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 20), irisMat);
      iris.position.set(0.35 * sx, 0.2, 0.98);
      group.add(iris);
    }

    // Eyebrows
    const browMat = new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.9 });
    for (const sx of [-1, 1]) {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.08), browMat);
      brow.position.set(0.35 * sx, 0.45, 0.92);
      group.add(brow);
    }

    // Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 16), skinMaterial());
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.02, 1.02);
    group.add(nose);

    // Mouth — a flattened box whose vertical scale is driven while speaking to
    // fake a jaw opening/closing (lip-sync).
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0x8a3b3b, roughness: 0.5 });
    mouth = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.12), mouthMat);
    mouth.position.set(0, -0.45, 0.92);
    group.add(mouth);

    // Hair — a cap; female variant adds side volume for a longer style.
    const hairColor = female ? 0x2b1a12 : 0x1c1712;
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.95 });
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(1.06, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat,
    );
    cap.scale.set(1, 1.18, 1);
    cap.position.y = 0.06;
    group.add(cap);
    if (female) {
      // Long side hair — a rounded cylinder each side (CapsuleGeometry isn't in
      // this Three.js build, so a cylinder + sphere caps stands in).
      for (const sx of [-1, 1]) {
        const side = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 1.3, 16), hairMat);
        side.position.set(0.9 * sx, -0.35, 0.1);
        group.add(side);
        const capBottom = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), hairMat);
        capBottom.position.set(0.9 * sx, -1.0, 0.1);
        group.add(capBottom);
      }
    } else {
      // Short back/side trim for the male variant.
      const trim = new THREE.Mesh(
        new THREE.SphereGeometry(1.08, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.42),
        hairMat,
      );
      trim.scale.set(1.02, 1.18, 1.04);
      trim.position.y = 0.12;
      trim.position.z = -0.08;
      group.add(trim);
    }

    return group;
  }

  function animate() {
    rafId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if (headGroup) {
      // Gentle idle: subtle sway + breathing bob.
      headGroup.rotation.y = Math.sin(t * 0.6) * 0.18;
      headGroup.rotation.x = Math.sin(t * 0.9) * 0.05;
      headGroup.position.y = Math.sin(t * 1.5) * 0.03;
    }
    if (mouth) {
      // Lip-sync: open/close rapidly while speaking, closed otherwise.
      const open = speaking ? 1 + Math.abs(Math.sin(t * 12)) * 6 : 1;
      mouth.scale.y = open;
    }
    renderer.render(scene, camera);
  }

  // Mount the 3D avatar into `holder` (an element). Safe to call repeatedly;
  // returns false if WebGL/THREE is unavailable so the caller can keep the SVG.
  function mount(holder, voice) {
    if (typeof THREE === "undefined") return false;
    try {
      unmount();
      const size = 168;
      holder.style.width = size + "px";
      holder.style.height = size + "px";
      holder.innerHTML = "";

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 0, 6.2);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.setSize(size, size);
      holder.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const key = new THREE.DirectionalLight(0xffffff, 0.9);
      key.position.set(2, 3, 4);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x88aaff, 0.4);
      rim.position.set(-3, 1, -2);
      scene.add(rim);

      headGroup = buildHead(voice);
      scene.add(headGroup);

      clock = new THREE.Clock();
      mounted = true;
      animate();
      return true;
    } catch (err) {
      return false;
    }
  }

  function setVoice(voice) {
    if (!mounted || !scene) return;
    if (headGroup) scene.remove(headGroup);
    headGroup = buildHead(voice);
    scene.add(headGroup);
  }

  function setSpeaking(on) {
    speaking = !!on;
  }

  function unmount() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    }
    renderer = scene = camera = headGroup = mouth = null;
    mounted = false;
  }

  return { mount, setVoice, setSpeaking, unmount, isMounted: () => mounted };
})();

window.Avatar3D = Avatar3D;
