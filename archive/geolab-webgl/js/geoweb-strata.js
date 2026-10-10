/* ==========================================================================
   GEOWEB MODULE 02 — SUBSURFACE STRATA & GEOTECHNICAL LOAD STRESS TENSOR
   --------------------------------------------------------------------------
   Photorealistic 3D terrain block (Regolith → Schist → Bedrock) cut away so
   the subsurface is visible, loaded by a foundation pad. Rendered with
   Three.js: procedural heightmap + normal-map rock textures generated on
   canvas (fbm elevation, schist foliation, gneiss banded PBR look), anisotropic
   filtering scaled by renderer.capabilities.getMaxAnisotropy(), ACES
   tone-mapped MeshStandardMaterial lighting with shadow maps on capable GPUs.

   Stress physics (computed in JS, injected into a custom GLSL overlay that
   shades the cut faces and a translucent stress bulb):
     • Boussinesq point-load vertical stress beneath the pad centre:
         σz = 3Q z³ / (2π R⁵)   [kPa], R = √(r²+z²)
     • Mohr-Coulomb shear utilisation from principal stresses:
         τmax ≈ (σ1 − σ3)/2 ,  f = (τ + c·cotφ′) / (c·cotφ′ + σ′n)
     • Effective stress:  σ′ = σ − u  (pore pressure slider raises water table)
   Display modes: Photoreal Rock Surface | Stress Vector Wireframe | Shear
   Stress Heatmap. Readouts: σz @3 m, τmax, σ′ effective.
   ========================================================================== */
'use strict';

(function () {
  if (!window.GeoWeb) return;

  /* ================= procedural PBR-ish rock textures ==================== */
  function fbm2(x, y, oct) {
    let v = 0, a = 0.5, fx = x, fy = y;
    for (let i = 0; i < oct; i++) {
      const xi = Math.floor(fx), yi = Math.floor(fy);
      const xf = fx - xi, yf = fy - yi;
      const h = (X, Y) => {
        const s = Math.sin(X * 127.1 + Y * 311.7 + i * 74.7) * 43758.5453;
        return s - Math.floor(s);
      };
      const u = xf * xf * (3 - 2 * xf), vv = yf * yf * (3 - 2 * yf);
      v += a * (h(xi, yi) * (1 - u) * (1 - vv) + h(xi + 1, yi) * u * (1 - vv) +
                h(xi, yi + 1) * (1 - u) * vv + h(xi + 1, yi + 1) * u * vv);
      fx = fx * 2.13 + 1.7; fy = fy * 2.13 + 9.2; a *= 0.5;
    }
    return v;
  }

  function makeRockTexture(kind, size) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d');
    const img = g.createImageData(size, size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = x / size * 6, ny = y / size * 6;
      let r = 120, gg = 110, b = 100;
      const grain = fbm2(nx * 8, ny * 8, 3);
      if (kind === 'regolith') {                    // sandy weathered cover
        const n = fbm2(nx * 2.2, ny * 2.2, 4);
        const base = 0.55 + 0.45 * n;
        r = 168 * base + grain * 26; gg = 138 * base + grain * 20; b = 96 * base + grain * 12;
      } else if (kind === 'schist') {               // foliated bands
        const band = Math.sin((ny * 14 + fbm2(nx, ny, 3) * 5) * Math.PI);
        const t = 0.5 + 0.5 * band;
        r = 92 + 40 * t + grain * 22; gg = 98 + 34 * t + grain * 20; b = 96 + 30 * t + grain * 18;
        const fleck = grain > 0.78 ? 60 : 0;        // mica glints
        r += fleck; gg += fleck; b += fleck * 0.6;
      } else {                                      // gneiss bedrock: pale/dark lenses
        const fold = fbm2(nx * 1.3, ny * 1.3, 4);
        const band = Math.sin((nx * 7 + ny * 4 + fold * 9) * Math.PI);
        const t = 0.5 + 0.5 * band;
        r = 74 + 110 * t + grain * 18; gg = 72 + 106 * t + grain * 16; b = 70 + 96 * t + grain * 14;
      }
      img.data[i] = Math.min(255, r); img.data[i + 1] = Math.min(255, gg);
      img.data[i + 2] = Math.min(255, b); img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  /* derive a normal map canvas from a height/albedo canvas (sobel) */
  function makeNormalMap(src, strength) {
    const size = src.width;
    const sg = src.getContext('2d');
    const d = sg.getImageData(0, 0, size, size).data;
    const out = document.createElement('canvas'); out.width = out.height = size;
    const og = out.getContext('2d');
    const o = og.createImageData(size, size);
    const H = (x, y) => {
      x = (x + size) % size; y = (y + size) % size;
      const i = (y * size + x) * 4;
      return (d[i] + d[i + 1] + d[i + 2]) / 765;
    };
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const dx = (H(x + 1, y) - H(x - 1, y)) * strength;
      const dy = (H(x, y + 1) - H(x, y - 1)) * strength;
      const l = Math.sqrt(dx * dx + dy * dy + 1);
      const i = (y * size + x) * 4;
      o.data[i] = ((-dx / l) * 0.5 + 0.5) * 255;
      o.data[i + 1] = ((-dy / l) * 0.5 + 0.5) * 255;
      o.data[i + 2] = ((1 / l) * 0.5 + 0.5) * 255;
      o.data[i + 3] = 255;
    }
    og.putImageData(o, 0, 0);
    return out;
  }

  /* ================= Boussinesq / Mohr-Coulomb core ===================== */
  const PAD = { B: 2.0 };                          // 2 m × 2 m square pad
  function boussinesq(QkN, rM, zM) {               // equivalent point load approximation
    const R = Math.sqrt(rM * rM + zM * zM);
    if (R < 0.35) return 3 * QkN / (2 * Math.PI * 0.02); // bounded near source
    return 3 * QkN * zM * zM * zM / (2 * Math.PI * Math.pow(R, 5));
  }
  function overburden(zM) { return 18.5 * zM; }    // γ ≈ 18.5 kN/m³ total vertical
  function stressAt(Q, u_kPa, zM, rM, phiDeg, cKPa) {
    const sz = overburden(zM) + boussinesq(Q, rM, zM);       // σ1 ≈ vertical
    const sx = sz * 0.45;                                     // at-rest-ish σ3
    const tau = Math.abs(sz - sx) / 2;                        // τmax (Mohr circle)
    const seff = Math.max(0, sz - u_kPa);                     // σ' = σ − u
    const phi = phiDeg * Math.PI / 180;
    const cc = cKPa / Math.tan(phi) + 1e-6;
    const util = (tau + seff * Math.sin(phi)) / (cc + seff); // Mohr-Coulomb utilisation proxy
    return { sz, sx, tau, seff, util: Math.min(util, 1.6) };
  }

  /* ================= GLSL overlay for cut faces + bulb ================== */
  const FIELD_VERT = `
    varying vec3 vWorld;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorld = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;
  const FIELD_FRAG = `
    precision highp float;
    varying vec3 vWorld;
    uniform float uQ, uU, uCphi, uMode, uTime, uZTop;
    uniform vec2 uLoadXZ;                     /* plan position of the load */
    /* analytic Boussinesq field mirrored here for per-pixel colouring */
    float sigmaZ(float r, float z) {
      float R = sqrt(r*r + z*z);
      R = max(R, 0.35);
      return 3.0*uQ*z*z*z / (6.28318*2.0*pow(R,5.0)) * 2.0; /* 3Q z³/(2πR⁵) */
    }
    void main() {
      float depth = uZTop - vWorld.y;               /* metres below ground surface */
      depth = clamp(depth, 0.0, 12.0);
      float r = length(vWorld.xz - uLoadXZ);        /* radial distance under pad */
      float sz = 18.5*depth + sigmaZ(max(r,0.4), max(depth,0.4));
      float sx = sz*0.45;
      float tau = abs(sz-sx)*0.5;
      float seff = max(sz-uU, 0.0);
      float util = (tau + seff*uCphi) / (uCphi + seff + 1.0);
      vec3 col;
      if (uMode < 0.5) {
        col = vec3(0.0); discard;                   /* photoreal mode handled by base material */
      } else if (uMode < 1.5) {
        /* heatmap: turbo-like ramp of shear utilisation */
        float t = clamp(util, 0.0, 1.0);
        vec3 cold = vec3(0.05,0.15,0.45), mid = vec3(0.95,0.75,0.15), hot = vec3(0.85,0.12,0.08);
        col = t < 0.5 ? mix(cold, mid, t*2.0) : mix(mid, hot, (t-0.5)*2.0);
        float pulse = 0.85 + 0.15*sin(uTime*2.0 + depth*1.7);
        col *= pulse;
        col.a = 0.88;
      } else {
        /* wireframe-ish isocontours of σz (kPa) */
        float iso = fract(sz/90.0);
        float line = smoothstep(0.06,0.0,min(iso,1.0-iso));
        col = mix(vec3(0.02,0.05,0.07), vec3(0.15,0.95,0.75), line);
        col += vec3(0.9,0.4,0.1) * smoothstep(0.75,1.0,util) * 0.8; /* yielding zones glow */
        col.a = 0.85;
      }
      gl_FragColor = vec4(col, 0.9);
    }`;

  window.GeoWeb.register({
    id: 'strata',
    init(canvas, ui, inst, P) {
      const rect = canvas.getBoundingClientRect();

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: !P.lowEnd });
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      P.anisoMax = maxAniso;
      renderer.setPixelRatio(P.dpr);
      renderer.setSize(rect.width, rect.height, false);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      /* shadow maps only on capable devices (mobile/low-power GPUs skip them) */
      renderer.shadowMap.enabled = P.shadows;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0d0b0e);
      scene.fog = new THREE.FogExp2(0x0d0b0e, 0.028);

      const camera = new THREE.PerspectiveCamera(40, rect.width / rect.height, 0.1, 120);

      /* ---------------- lights ---------------- */
      const hemi = new THREE.HemisphereLight(0xbfd4e8, 0x3a2c1e, 0.55);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xffe3b8, 1.25);
      sun.position.set(14, 20, 10);
      if (P.shadows) {
        sun.castShadow = true;
        sun.shadow.mapSize.set(P.lowEnd ? 512 : 1024, P.lowEnd ? 512 : 1024);
        sun.shadow.camera.left = -14; sun.shadow.camera.right = 14;
        sun.shadow.camera.top = 14; sun.shadow.camera.bottom = -14;
      }
      scene.add(sun);
      const rim = new THREE.DirectionalLight(0x6a86a8, 0.4);
      rim.position.set(-12, 8, -14); scene.add(rim);

      /* ---------------- strata block geometry --------------------------- */
      const W = 16, D = 12, TH = { reg: 2.2, sch: 3.4, bed: 5.0 };  // layer thicknesses (m)
      const ZTOP = 0;                                               // ground surface plane y=0
      const texSize = P.lowEnd ? 256 : 512;
      function rockMat(kind, rough, metal) {
        const src = makeRockTexture(kind, texSize);
        const map = new THREE.CanvasTexture(src);
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = Math.min(8, maxAniso);
        const nrm = new THREE.CanvasTexture(makeNormalMap(src, kind === 'bedrock' ? 2.6 : 1.8));
        nrm.wrapS = nrm.wrapT = THREE.RepeatWrapping;
        return new THREE.MeshStandardMaterial({
          map, normalMap: nrm, normalScale: new THREE.Vector2(0.9, 0.9),
          roughness: rough, metalness: metal
        });
      }
      const matReg = rockMat('regolith', 0.96, 0.0);
      const matSch = rockMat('schist', 0.82, 0.05);
      const matBed = rockMat('bedrock', 0.68, 0.12);
      [matReg, matSch, matBed].forEach(m => { m.map.repeat.set(3, 2); m.normalMap.repeat.set(3, 2); });

      const blockGroup = new THREE.Group();
      scene.add(blockGroup);

      /* wavy top of regolith via displaced plane; layers as boxes */
      function layerMesh(thick, yMid, mat, dispAmp) {
        const geo = new THREE.BoxGeometry(W, thick, D, 48, 2, 36);
        if (dispAmp) {
          const pos = geo.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
            if (Math.abs(y - thick / 2) < 1e-4 && Math.abs(x) < W / 2 - 1e-3 && Math.abs(z) < D / 2 - 1e-3) {
              pos.setY(i, y + (fbm2(x * 0.22 + 5, z * 0.22 + 9, 3) - 0.5) * dispAmp);
            }
          }
          geo.computeVertexNormals();
        }
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = yMid;
        mesh.receiveShadow = P.shadows; mesh.castShadow = P.shadows;
        return mesh;
      }
      const yBed = -(TH.bed / 2);
      const ySch = -TH.bed - TH.sch / 2;
      const yReg = -TH.bed - TH.sch - TH.reg / 2 + 0.6;   // regolith crest carries surface
      /* Open cross-section: the block is cut at x=0 — it occupies
         x ∈ [−W/2, 0] and z ∈ [−D/4, D/4]. The exposed faces (x≈0 plane and
         the front face) are where the GLSL stress-field overlay shades
         σz isocontours / shear utilisation live. */
      const HW = W / 2, HD = D / 2;
      function layerMesh(thick, yMid, mat, dispAmp) {
        const geo = new THREE.BoxGeometry(HW, thick, HD, 32, 2, 24);
        if (dispAmp) {
          const pos = geo.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
            if (Math.abs(y - thick / 2) < 1e-4 && Math.abs(x) < HW / 2 - 1e-3 && Math.abs(z) < HD / 2 - 1e-3) {
              pos.setY(i, y + (fbm2(x * 0.22 + 5, z * 0.22 + 9, 3) - 0.5) * dispAmp);
            }
          }
          geo.computeVertexNormals();
        }
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(-HW / 2, yMid, 0);              // occupies x ∈ [−HW, 0]
        mesh.receiveShadow = P.shadows; mesh.castShadow = P.shadows;
        return mesh;
      }
      blockGroup.add(layerMesh(TH.bed, yBed, matBed, 0));
      blockGroup.add(layerMesh(TH.sch, ySch, matSch, 0.35));
      blockGroup.add(layerMesh(TH.reg, yReg, matReg, 0.55));
      const SURF_Y = yReg + TH.reg / 2 + 0.25;

      /* ---------------- foundation pad + column ------------------------- */
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(PAD.B, 0.35, PAD.B),
        new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.6, metalness: 0.35 })
      );
      pad.position.set(-PAD.B / 2 - 0.4, SURF_Y + 0.18, 0);   // overhung to show the bulb
      pad.castShadow = P.shadows; pad.receiveShadow = P.shadows;
      scene.add(pad);
      const column = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.42, 2.4, 20),
        new THREE.MeshStandardMaterial({ color: 0xb6552e, roughness: 0.5, metalness: 0.4 })
      );
      column.position.set(-PAD.B / 2 - 0.4, SURF_Y + 1.55, 0);
      column.castShadow = P.shadows;
      scene.add(column);
      const LOAD_XZ = [-PAD.B / 2 - 0.4, 0];                   // load centre used by all overlays

      /* ---------------- stress field shader overlays -------------------- */
      const C_PHI = 30;                                   // φ = 30°, c folded into proxy term
      const fieldUniforms = {
        uQ: { value: 450 }, uU: { value: 0 },
        uCphi: { value: C_PHI * 0.0175 },                 // tan-ish coupling for the shader util
        uMode: { value: 0 }, uTime: { value: 0 }, uZTop: { value: SURF_Y },
        uLoadXZ: { value: new THREE.Vector2(LOAD_XZ[0], LOAD_XZ[1]) }
      };
      const fieldMat = new THREE.ShaderMaterial({
        vertexShader: FIELD_VERT, fragmentShader: FIELD_FRAG, uniforms: fieldUniforms,
        transparent: true, side: THREE.DoubleSide, depthWrite: false
      });
      /* Cut-face overlay: a vertical plane standing exactly on the exposed
         x≈0 section of the block — σz isocontours / shear heatmap live there. */
      const cutH = SURF_Y - (yBed - TH.bed / 2);
      const cutPlane = new THREE.Mesh(new THREE.PlaneGeometry(HD * 2 - 0.1, cutH), fieldMat);
      cutPlane.rotation.y = Math.PI / 2;                  // face normal → +x, visible from the open side
      cutPlane.position.set(0.06, SURF_Y - cutH / 2, 0);
      scene.add(cutPlane);

      /* translucent stress bulb under the pad (same GLSL field, hollow shell) */
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), fieldMat.clone());
      bulb.material.uniforms = fieldUniforms;              // share uniforms
      bulb.position.set(LOAD_XZ[0], SURF_Y - 3.2, LOAD_XZ[1]);
      bulb.scale.set(3.4, 3.4, 3.4);
      scene.add(bulb);

      /* ---------------- stress vector arrows (wireframe mode) ----------- */
      const arrowGroup = new THREE.Group();
      scene.add(arrowGroup);
      const NAR = 7;
      const arrows = [];
      for (let ix = 0; ix < NAR; ix++) for (let iz = 0; iz < 4; iz++) {
        const dir = new THREE.Vector3(0, -1, 0);
        const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(), 1, 0xe0a95f, 0.34, 0.18);
        arrow.line.material.transparent = true; arrow.cone.material.transparent = true;
        arrows.push({
          arrow,
          gx: LOAD_XZ[0] + (ix / (NAR - 1) - 0.5) * 9,
          gz: LOAD_XZ[1] + (iz / 3 - 0.5) * 6,
          dz: iz
        });
        arrowGroup.add(arrow);
      }
      arrowGroup.visible = false;

      /* ---------------- water table plane (pore pressure) --------------- */
      const wtGeo = new THREE.PlaneGeometry(W, D);
      const wtMat = new THREE.MeshBasicMaterial({
        color: 0x3f7fae, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false
      });
      const waterTable = new THREE.Mesh(wtGeo, wtMat);
      waterTable.rotation.x = Math.PI / 2;
      waterTable.position.set(-W / 4, SURF_Y, 0);
      scene.add(waterTable);

      /* ---------------- orbit controls (minimal built-in) --------------- */
      (() => {
        let theta = 1.05, phi = 1.22, dist = 26, dragging = false, px = 0, py = 0;
        const target = new THREE.Vector3(-W / 5, SURF_Y - 4.5, 0);
        function apply() {
          phi = P.clamp(phi, 0.35, 1.48); dist = P.clamp(dist, 12, 46);
          camera.position.set(
            target.x + dist * Math.sin(phi) * Math.sin(theta),
            target.y + dist * Math.cos(phi),
            target.z + dist * Math.sin(phi) * Math.cos(theta));
          camera.lookAt(target);
        }
        canvas.addEventListener('pointerdown', e => { dragging = true; px = e.clientX; py = e.clientY; canvas.setPointerCapture(e.pointerId); });
        canvas.addEventListener('pointermove', e => {
          if (!dragging) return;
          theta -= (e.clientX - px) * 0.005; phi -= (e.clientY - py) * 0.004; px = e.clientX; py = e.clientY; apply();
        });
        ['pointerup', 'pointercancel'].forEach(ev => canvas.addEventListener(ev, () => dragging = false));
        canvas.addEventListener('wheel', e => { e.preventDefault(); dist *= (1 + Math.sign(e.deltaY) * 0.08); apply(); }, { passive: false });
        apply();
      })();

      /* ---------------- UI wiring -------------------------------------- */
      let Q = 450, U = 0, mode = 'photo';
      ui.setOutUnit('load', ' kN');
      ui.setOutUnit('u', ' kPa');
      ui.onRange('load', v => { Q = v; refreshPhysics(); });
      ui.onRange('u', v => { U = v; refreshPhysics(); });
      ui.onSeg('mode', val => {
        mode = val;
        const photo = mode === 'photo';
        matReg.wireframe = matSch.wireframe = matBed.wireframe = (mode === 'wire');
        [matReg, matSch, matBed].forEach(m => { m.opacity = photo ? 1 : 0.35; m.transparent = !photo; });
        cutPlane.visible = !photo;
        bulb.visible = !photo;
        arrowGroup.visible = mode === 'wire';
        pad.material.wireframe = (mode === 'wire');
        refreshPhysics();
      });

      function refreshPhysics() {
        fieldUniforms.uQ.value = Q;
        fieldUniforms.uU.value = U;
        fieldUniforms.uMode.value = mode === 'heat' ? 1 : mode === 'wire' ? 2 : 0;
        /* water table rises with u: u(kPa) ≈ γw·depth → depth below surface = u/9.81 */
        const rise = Math.min(U / 9.81, 9.5);
        waterTable.position.y = SURF_Y - 9.5 + rise;
        waterTable.visible = U > 1;

        /* numeric readouts at reference point: 3 m depth, 1 m offset */
        const s = stressAt(Q, U, 3.0, 1.0, 30, 15);
        ui.ro('sz', Math.round(s.sz) + ' kPa');
        ui.ro('tau', Math.round(s.tau) + ' kPa');
        ui.ro('se', Math.round(s.seff) + ' kPa');
        ui.hud(
          '<div class="hud-row"><span>BOUSSINESQ σz · MOHR-COULOMB τ</span></div>' +
          '<div class="hud-row"><span>Q</span><b>' + Q.toFixed(0) + ' kN</b><span>u ' + U.toFixed(0) + ' kPa</span></div>' +
          '<div class="hud-row"><span>σ₁ ' + Math.round(s.sz) + ' kPa · σ₃ ' + Math.round(s.sx) +
            ' kPa · util ' + s.util.toFixed(2) + '</span></div>' +
          '<div class="hud-row"><span>' + (mode === 'photo' ? 'PHOTOREAL PBR' : mode === 'wire' ? 'STRESS VECTOR WIREFRAME' : 'SHEAR HEATMAP') +
            ' · PAD 2×2 m · γ 18.5 kN/m³</span></div>'
        );
        /* update arrows lengths from analytic field (radial dist from pad centre) */
        arrows.forEach(a => {
          const rr = Math.hypot(a.gx - LOAD_XZ[0], a.gz - LOAD_XZ[1]);
          const st = stressAt(Q, U, 2 + a.dz * 2.2, rr, 30, 15);
          const len = P.clamp(st.sz / 55, 0.25, 3.2);
          a.arrow.setLength(len, 0.34, 0.18);
          a.arrow.position.set(a.gx, SURF_Y - 1.2 - a.dz * 2.2, a.gz);
          const tilt = (st.util - 0.5) * 0.5;
          const outward = new THREE.Vector3(a.gx - LOAD_XZ[0], 0, a.gz - LOAD_XZ[1]).multiplyScalar(0.06);
          a.arrow.setDirection(new THREE.Vector3(outward.x, -1 + tilt * 0.2, outward.z).normalize());
          a.arrow.setColor(new THREE.Color().setHSL(0.12 - P.clamp(st.util, 0, 1) * 0.12, 0.9, 0.55));
        });
        /* bulb grows with load, reddens with pore pressure (effective stress loss) */
        const bs = 1.6 + Q / 320;
        bulb.scale.set(bs, bs * 0.82, bs);
      }
      refreshPhysics();

      /* ---------------- resize ------------------------------------------- */
      function resize() {
        const r = canvas.getBoundingClientRect();
        if (!r.width || !r.height) return;
        renderer.setSize(r.width, r.height, false);
        camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
      }
      window.addEventListener('resize', resize, { passive: true });

      /* ---------------- step --------------------------------------------- */
      let first = true;
      return {
        step(dt, t) {
          fieldUniforms.uTime.value = t;
          if (first) { resize(); first = false; }
          renderer.render(scene, camera);
        },
        dispose() { renderer.dispose(); }
      };
    }
  });
})();
