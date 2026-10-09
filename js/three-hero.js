/* ==========================================================================
   INTERACTIVE 3D MINERAL HERO — Three.js
   A faceted quartz/pyrite crystal cluster floating over a displaced terrain
   mesh. Responds to pointer hover (magnetic tilt + energy glow) and drag
   (spin with inertia). Fires seismograph micro-quakes on interaction.
   Graceful fallback: if WebGL is unavailable, the photo card simply stands
   alone — no console errors.
   ========================================================================== */
'use strict';

(function initCrystalHero() {
  const stage = document.getElementById('crystal-stage');
  if (!stage || typeof THREE === 'undefined') return;

  // WebGL capability check
  try {
    const test = document.createElement('canvas');
    if (!(test.getContext('webgl2') || test.getContext('webgl'))) throw 0;
  } catch (e) {
    stage.classList.add('no-webgl');
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scene / renderer ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(stage.clientWidth || 480, stage.clientHeight || 500);
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0c0b0e, 0.055);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  camera.position.set(0, 1.4, 7.6);
  camera.lookAt(0, 0.4, 0);

  function sizeStage() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  sizeStage();
  window.addEventListener('resize', () => requestAnimationFrame(sizeStage));

  /* ---------- Lights: warm mineral sun + cool basalt fill ---------- */
  scene.add(new THREE.AmbientLight(0x3a3230, 0.9));

  const keyLight = new THREE.DirectionalLight(0xf2c66d, 2.2);
  keyLight.position.set(4, 6, 4);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xb6552e, 1.4);
  rimLight.position.set(-5, 2, -4);
  scene.add(rimLight);

  const coreGlow = new THREE.PointLight(0xe0a95f, 6, 9, 2);
  coreGlow.position.set(0, 1.1, 0);
  scene.add(coreGlow);

  /* ---------- Crystal cluster group ---------- */
  const cluster = new THREE.Group();
  scene.add(cluster);

  // Procedural mineral texture — banded agate / growth-ring look for the main crystal
  function makeMineralTexture(base, band) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const c2 = cv.getContext('2d');
    c2.fillStyle = base;
    c2.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 14; i++) {
      c2.strokeStyle = band;
      c2.globalAlpha = 0.10 + Math.random() * 0.16;
      c2.lineWidth = 2 + Math.random() * 7;
      c2.beginPath();
      c2.moveTo(0, i * 18 + Math.random() * 10);
      c2.bezierCurveTo(80, i * 18 - 14, 170, i * 18 + 26, 256, i * 18 + 6);
      c2.stroke();
    }
    c2.globalAlpha = 0.08;
    for (let i = 0; i < 900; i++) {
      c2.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
      c2.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }
  const mineralTex = makeMineralTexture('#b3714a', '#e8c07a');

  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xc98d5f,
    map: mineralTex,
    metalness: 0.35,
    roughness: 0.18,
    clearcoat: 0.8,
    clearcoatRoughness: 0.25,
    emissive: 0x502008,
    emissiveIntensity: 0.35,
    flatShading: true
  });

  const shardMat = new THREE.MeshStandardMaterial({
    color: 0xd8b25f, metalness: 0.85, roughness: 0.3,
    emissive: 0x2a1505, emissiveIntensity: 0.4, flatShading: true
  });

  function addCrystal(geo, mat, pos, rot, scale) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.rotation.set(...rot);
    m.scale.setScalar(scale);
    cluster.add(m);
    return m;
  }

  // Central hexagonal prism terminated by a pyramid cap = classic quartz point
  const mainGeo = new THREE.CylinderGeometry(0.62, 0.78, 2.1, 6, 1, false);
  addCrystal(mainGeo, crystalMat, [0, 0.6, 0], [0, 0.4, 0], 1);
  const mainCap = new THREE.ConeGeometry(0.63, 0.85, 6);
  addCrystal(mainCap, crystalMat, [0, 2.05, 0], [0, 0.4, 0], 1);

  // Satellite shards (pyrite-like metallic points)
  const shardGeo = new THREE.CylinderGeometry(0.22, 0.32, 1.2, 6);
  const shardCap = new THREE.ConeGeometry(0.23, 0.5, 6);
  [[-1.15, 0.1, 0.45, -0.5], [1.2, 0.2, -0.3, 0.55], [0.35, 0.05, 1.05, -0.2]]
    .forEach(([x, y, z, rz]) => {
      addCrystal(shardGeo, shardMat, [x, y, z], [rz * 0.35, 0.6, rz], 1);
      addCrystal(shardCap, shardMat, [x - Math.sin(rz) * 0.8, y + 0.82, z + Math.cos(rz) * 0.1], [rz * 0.35, 0.6, rz], 1);
    });

  // Wireframe lattice shell around the cluster
  const lattice = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.7, 1)),
    new THREE.LineBasicMaterial({ color: 0xe0a95f, transparent: true, opacity: 0.16 })
  );
  lattice.position.y = 0.9;
  cluster.add(lattice);

  // Orbiting dust motes (sediment in suspension)
  const moteCount = 160;
  const motePos = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    const r = 2.6 + Math.random() * 2.2, t = Math.random() * Math.PI * 2;
    motePos[i * 3] = Math.cos(t) * r;
    motePos[i * 3 + 1] = Math.random() * 4 - 0.6;
    motePos[i * 3 + 2] = Math.sin(t) * r;
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
    color: 0xf2c66d, size: 0.035, transparent: true, opacity: 0.65, depthWrite: false
  }));
  scene.add(motes);

  /* ---------- Terrain mesh (Himalayan cross-section) ---------- */
  const terrGeo = new THREE.PlaneGeometry(16, 16, 48, 48);
  terrGeo.rotateX(-Math.PI / 2);
  const p = terrGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const ridge = Math.abs(Math.sin(x * 0.35 + z * 0.2)) * Math.exp(-Math.hypot(x, z) * 0.06);
    p.setY(i, ridge * 1.15 + Math.sin(x * 0.9) * Math.cos(z * 0.8) * 0.18 - 1.35);
  }
  terrGeo.computeVertexNormals();

  const terrain = new THREE.Mesh(terrGeo, new THREE.MeshStandardMaterial({
    color: 0x4a382c, metalness: 0.1, roughness: 0.95, flatShading: true
  }));
  scene.add(terrain);

  const contour = new THREE.LineSegments(
    new THREE.WireframeGeometry(terrGeo),
    new THREE.LineBasicMaterial({ color: 0xb6552e, transparent: true, opacity: 0.09 })
  );
  contour.position.y = 0.01;
  scene.add(contour);

  /* ---------- Interaction: hover magnetism + drag spin inertia ---------- */
  const state = {
    px: 0, py: 0,           // normalized pointer (-1..1)
    tx: 0, ty: 0,           // eased target rotation
    vx: 0,                  // angular velocity from dragging
    dragging: false,
    lastX: 0,
    energy: 0               // 0..1 → glow intensity
  };

  function pointerNorm(e) {
    const r = stage.getBoundingClientRect();
    state.px = ((e.clientX - r.left) / r.width) * 2 - 1;
    state.py = ((e.clientY - r.top) / r.height) * 2 - 1;
  }

  stage.addEventListener('pointermove', (e) => {
    pointerNorm(e);
    state.energy = Math.min(1, state.energy + 0.06);
    if (state.dragging) {
      const dx = e.clientX - state.lastX;
      state.vx += dx * 0.0009;
      state.lastX = e.clientX;
    } else {
      state.tx = state.px * 0.55;
      state.ty = state.py * 0.22;
    }
  }, { passive: true });

  stage.addEventListener('pointerdown', (e) => {
    state.dragging = true;
    state.lastX = e.clientX;
    stage.classList.add('dragging');
    stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
    if (window.Seismo) window.Seismo.trigger(0.8, e.clientX);
  });

  ['pointerup', 'pointercancel'].forEach(ev => stage.addEventListener(ev, () => {
    state.dragging = false;
    stage.classList.remove('dragging');
  }));

  stage.addEventListener('pointerleave', () => {
    state.tx = 0; state.ty = 0; state.dragging = false;
    stage.classList.remove('dragging');
  });

  /* ---------- Render loop ---------- */
  let time = 0, rafId = null, visible = true;

  function tick() {
    if (!visible) return;
    time += 0.016;

    // idle auto-rotation + drag inertia
    if (!state.dragging) state.vx *= 0.96;
    cluster.rotation.y += 0.0035 + state.vx;
    cluster.rotation.x += (state.ty - cluster.rotation.x) * 0.06;

    // magnetic hover tilt of whole group
    cluster.position.x += (state.px * 0.35 - cluster.position.x) * 0.05;
    cluster.position.y += (0.12 + Math.sin(time * 0.8) * 0.08 - cluster.position.y) * 0.04;

    // energy decay → glow feedback
    state.energy = Math.max(0, state.energy - 0.012);
    crystalMat.emissiveIntensity = 0.35 + state.energy * 1.1;
    shardMat.emissiveIntensity = 0.4 + state.energy * 1.2;
    coreGlow.intensity = 6 + state.energy * 9;
    lattice.material.opacity = 0.16 + state.energy * 0.25;

    motes.rotation.y = time * 0.05;
    terrain.rotation.y = time * 0.02;

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  }

  if (reduceMotion) { renderer.render(scene, camera); }
  else { tick(); }

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible && !reduceMotion) tick();
    else cancelAnimationFrame(rafId);
  });

  // Occasional ambient "micro-earthquake" jolts that ripple the seismograph
  if (!reduceMotion) {
    setInterval(() => {
      if (!document.hidden && window.Seismo && Math.random() > 0.55) {
        window.Seismo.trigger(0.25);
      }
    }, 5200);
  }
})();
