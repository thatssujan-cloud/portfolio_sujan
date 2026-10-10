/* ==========================================================================
   GEOWEB MODULE 03 — ACTIVE SLOPE FAILURE & SEISMIC RUPTURE DYNAMICS
   --------------------------------------------------------------------------
   Himalayan rock-slope (planar failure along a relict joint) rendered with
   Three.js. Terrain slice built from a procedural heightmap with gneiss PBR
   texture; the unstable prism above the joint plane is a separate mesh whose
   dip follows the β slider. On rupture, the prism dissolves into a GPU
   particle debris flow (THREE.Points + custom GLSL point shader) that runs
   down the shear plane and deposits at the toe.

   Physics — pseudo-static planar slide Factor of Safety (kPa, SI):
       FoS = [ c + (cosβ − u/γz − kh·sinβ)·tanφ ] / [ sinβ + kh·cosβ ]
     where kh = PGA/g horizontal seismic coefficient, β joint dip,
     c cohesion, φ friction angle, u pore pressure, γ unit weight, z depth.
   UI: PGA 0–0.6 g, Trigger Rupture (fires only when FoS < 1.0), colour-coded
   FoS meter (green >1.5 · yellow 1.0–1.5 · red <1.0). Seismograph spikes on
   failure. Shadows/DPR/particle counts scale with device capability.
   ========================================================================== */
'use strict';

(function () {
  if (!window.GeoWeb) return;

  /* deterministic hash noise for the terrain */
  function h2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return h2(xi, yi) * (1 - u) * (1 - v) + h2(xi + 1, yi) * u * (1 - v) +
           h2(xi, yi + 1) * (1 - u) * v + h2(xi + 1, yi + 1) * u * v;
  }
  function fbm(x, y, oct) {
    let s = 0, a = 0.5, fx = x, fy = y;
    for (let i = 0; i < oct; i++) { s += a * vnoise(fx, fy); fx = fx * 2.07 + 1.3; fy = fy * 2.07 + 7.1; a *= 0.5; }
    return s;
  }

  /* gneiss-ish slope texture */
  function makeGneiss(size) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'); const img = g.createImageData(size, size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = x / size * 5, ny = y / size * 5;
      const fold = fbm(nx * 1.4, ny * 1.4, 4);
      const band = 0.5 + 0.5 * Math.sin((nx * 6 + ny * 9 + fold * 10) * Math.PI);
      const r = 88 + 96 * band, gg = 86 + 92 * band, b = 82 + 84 * band;
      const sp = vnoise(x * 0.7, y * 0.7) > 0.8 ? 26 : 0;
      img.data[i] = r + sp; img.data[i + 1] = gg + sp; img.data[i + 2] = b + sp * 0.7; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0); return c;
  }

  /* particle vertex shader: per-particle size attenuation + life fade */
  const PART_VERT = `
    attribute float aSize;
    attribute float aLife;
    attribute vec3 aColor;
    varying float vLife;
    varying vec3 vCol;
    void main() {
      vLife = aLife;
      vCol = aColor;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * (240.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }`;
  const PART_FRAG = `
    precision mediump float;
    varying float vLife;
    varying vec3 vCol;
    void main() {
      vec2 d = gl_PointCoord - 0.5;
      float m = smoothstep(0.5, 0.32, length(d));       /* soft round clast */
      if (m <= 0.0 || vLife <= 0.0) discard;
      gl_FragColor = vec4(vCol * (0.7 + 0.3 * vLife), m * min(vLife * 2.0, 1.0));
    }`;

  window.GeoWeb.register({
    id: 'slope',
    init(canvas, ui, inst, P) {
      const rect = canvas.getBoundingClientRect();

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: !P.lowEnd });
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      P.anisoMax = maxAniso;
      renderer.setPixelRatio(P.dpr);
      renderer.setSize(rect.width, rect.height, false);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.shadowMap.enabled = P.shadows;                 // off on mobile GPUs
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0e0c12);
      scene.fog = new THREE.FogExp2(0x0e0c12, 0.016);

      const camera = new THREE.PerspectiveCamera(42, rect.width / rect.height, 0.1, 160);

      /* lights: cold alpine key + warm bounce */
      scene.add(new THREE.HemisphereLight(0xa8c4de, 0x2a2018, 0.6));
      const sun = new THREE.DirectionalLight(0xffdfae, 1.3);
      sun.position.set(18, 26, 12);
      if (P.shadows) {
        sun.castShadow = true;
        sun.shadow.mapSize.set(P.lowEnd ? 512 : 1024, P.lowEnd ? 512 : 1024);
        const sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22;
      }
      scene.add(sun);

      /* ---------------- stable terrain: mountain mass with planar notch --
         Height field: rolling valley + big peak behind the slope. Along the
         failure corridor (x ∈ [−3, 6]) the surface is carved down onto the
         relict joint plane so the prism geometry matches the scar visually. */
      const betaRef = 34;                                      // initial joint dip
      const TOE_Z0 = 2.0;                                      // slip-plane toe line (world z)
      const CROWN_Z0 = TOE_Z0 + 8.6 / Math.tan(betaRef * Math.PI / 180);
      const Ws = 26, Ds = 26, SEG = P.lowEnd ? 72 : 120;
      const terrGeo = new THREE.PlaneGeometry(Ws, Ds, SEG, SEG);
      terrGeo.rotateX(-Math.PI / 2);
      {
        const pos = terrGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), z = pos.getZ(i);
          let y = fbm(x * 0.06 + 3, z * 0.06 + 8, 4) * 9 - 3;   // rolling valley floor
          /* big peak behind the slope */
          y += 15 * Math.exp(-(Math.pow((x + 7) / 11, 2) + Math.pow((z - 10.5) / 9, 2)));
          /* general hillside rising toward +z behind the crown */
          const backRamp = Math.max(0, Math.min(1, (z - CROWN_Z0) / 6));
          y += backRamp * 9 + Math.max(0, Math.min(1, (z - TOE_Z0) / 3)) * 2.5;
          /* carve the planar scar where the prism sits (β = ref) */
          const inCorridor = Math.max(0, 1 - Math.abs(x - 1.5) / 5.5);
          const along = Math.max(0, Math.min(1, (z - TOE_Z0) / (CROWN_Z0 - TOE_Z0)));
          const planeY = (z - TOE_Z0) * Math.tan(betaRef * Math.PI / 180) + 0.1;
          const w = inCorridor * along;
          if (w > 0 && y > planeY) y = y * (1 - w) + planeY * w;
          pos.setY(i, y);
        }
        terrGeo.computeVertexNormals();
      }
      const gneissTex = new THREE.CanvasTexture(makeGneiss(P.lowEnd ? 256 : 512));
      gneissTex.wrapS = gneissTex.wrapT = THREE.RepeatWrapping;
      gneissTex.repeat.set(4, 4);
      gneissTex.anisotropy = Math.min(8, maxAniso);
      const terrMat = new THREE.MeshStandardMaterial({ map: gneissTex, roughness: 0.92, metalness: 0.06 });
      const terrain = new THREE.Mesh(terrGeo, terrMat);
      terrain.receiveShadow = P.shadows; terrain.castShadow = P.shadows;
      scene.add(terrain);

      /* ---------------- unstable prism (wedge above the joint plane) -----
         Triangular profile in local (u = down-dip horizontal run, v = height):
           toe (0,0) → crown foot (run,0) → scarp top (run,H). Extruded along
           the strike. After rotation.y=90°, local +u maps to world −z so the
           dip descends toward the valley at z≈TOE_Z. */
      const TOE_Z = 2.0;                                       // slip-plane toe line (world z)
      const PRISM_H = 8.6;                                     // relief toe→crown (m)
      const prismGroup = new THREE.Group();
      scene.add(prismGroup);
      const prismMat = new THREE.MeshStandardMaterial({ map: gneissTex.clone(), roughness: 0.9, metalness: 0.06 });
      prismMat.map.repeat.set(2, 2);
      let prism = null;
      function buildPrism(betaDeg) {
        if (prism) { prismGroup.remove(prism); prism.geometry.dispose(); }
        const b = betaDeg * Math.PI / 180;
        const run = PRISM_H / Math.tan(b);                      // horizontal extent of the slip plane
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(run, 0);
        shape.lineTo(run, PRISM_H);
        shape.closePath();
        const geo = new THREE.ExtrudeGeometry(shape, { depth: 9, bevelEnabled: false, curveSegments: 1 });
        geo.rotateY(Math.PI / 2);                               // local x → world −z
        geo.translate(1.5, 0.15, TOE_Z);                        // sit on the scar, centred on x
        prism = new THREE.Mesh(geo, prismMat);
        prism.castShadow = P.shadows; prism.receiveShadow = P.shadows;
        prismGroup.add(prism);
        prism.userData.beta = betaDeg;
        prism.userData.crownZ = TOE_Z + run;                    // upslope edge (larger z)
        prism.userData.H = PRISM_H;
      }
      buildPrism(betaRef);

      /* shear-plane highlight strip lying on the dip surface */
      const planeMat = new THREE.MeshBasicMaterial({ color: 0xd97e4a, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
      let shearPlane = null;
      function buildShearPlane(betaDeg) {
        if (shearPlane) { scene.remove(shearPlane); shearPlane.geometry.dispose(); }
        const b = betaDeg * Math.PI / 180;
        const len = PRISM_H / Math.sin(b);                      // slope length toe→crown
        shearPlane = new THREE.Mesh(new THREE.PlaneGeometry(9.4, len), planeMat);
        shearPlane.rotation.x = Math.PI / 2 - b;                // tilt a vertical-facing plane onto the dip
        shearPlane.position.set(1.5, 0.15 + len / 2 * Math.sin(b), TOE_Z + len / 2 * Math.cos(b));
        scene.add(shearPlane);
      }
      buildShearPlane(betaRef);

      /* ---------------- debris particle system --------------------------- */
      const NP = P.p(2600);
      const pPos = new Float32Array(NP * 3);
      const pVel = new Float32Array(NP * 3);
      const pSize = new Float32Array(NP);
      const pLife = new Float32Array(NP);
      const pCol = new Float32Array(NP * 3);
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSize, 1));
      pGeo.setAttribute('aLife', new THREE.BufferAttribute(pLife, 1));
      pGeo.setAttribute('aColor', new THREE.BufferAttribute(pCol, 3));
      const pMat = new THREE.ShaderMaterial({
        vertexShader: PART_VERT, fragmentShader: PART_FRAG,
        transparent: true, depthWrite: false
      });
      const points = new THREE.Points(pGeo, pMat);
      points.frustumCulled = false;
      scene.add(points);

      let live = 0;                                            // active particles
      const groundY = (x, z) => {                              // valley floor away from the scar
        let y = fbm(x * 0.06 + 3, z * 0.06 + 8, 4) * 9 - 3;
        y += 15 * Math.exp(-(Math.pow((x + 7) / 11, 2) + Math.pow((z - 10.5) / 9, 2)));
        y += Math.max(0, Math.min(1, (z - CROWN_Z0) / 6)) * 9 + Math.max(0, Math.min(1, (z - TOE_Z0) / 3)) * 2.5;
        return y;
      };
      function spawnDebris(betaDeg) {
        const b = betaDeg * Math.PI / 180;
        const crownZ = TOE_Z0 + PRISM_H / Math.tan(b);
        for (let i = 0; i < NP; i++) {
          const f = Math.random();                             // 0 crown → 1 toe along plane
          const z = crownZ - f * (crownZ - TOE_Z0) + (Math.random() - 0.5) * 1.2;
          const y = Math.max(TOE_Z0 ? (z - TOE_Z0) * Math.tan(b) : 0, groundY(1.5, z)) + Math.random() * 2.2 + 0.4;
          const x = 1.5 + (Math.random() - 0.5) * 8.4;
          pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z;
          const v = 4 + Math.random() * 7;
          pVel[i * 3] = (Math.random() - 0.5) * 2.2;
          pVel[i * 3 + 1] = Math.random() * 1.5;
          pVel[i * 3 + 2] = -v;                                // downslope = −z
          pSize[i] = 0.7 + Math.random() * 1.6;
          pLife[i] = 1 + Math.random() * 0.4;
          const grey = 0.32 + Math.random() * 0.22;
          const rust = Math.random() < 0.18 ? 1 : 0;
          pCol[i * 3] = grey + rust * 0.35; pCol[i * 3 + 1] = grey * (rust ? 0.6 : 1); pCol[i * 3 + 2] = grey * (rust ? 0.4 : 1);
        }
        live = NP;
        pGeo.attributes.position.needsUpdate = true;
        pGeo.attributes.aSize.needsUpdate = true;
        pGeo.attributes.aLife.needsUpdate = true;
        pGeo.attributes.aColor.needsUpdate = true;
      }

      function stepParticles(dt) {
        if (live <= 0) return;
        let still = 0;
        const g = 9.81 * 2.2;                                  // visual gravity scale
        const tanb = Math.tan((prism ? prism.userData.beta : betaRef) * Math.PI / 180);
        for (let i = 0; i < NP; i++) {
          if (pLife[i] <= 0) { still++; continue; }
          const ix = i * 3;
          pVel[ix + 1] -= g * dt;
          /* integrate then resolve against the shear plane and the terrain */
          let nx = pPos[ix] + pVel[ix] * dt,
              ny = pPos[ix + 1] + pVel[ix + 1] * dt,
              nz = pPos[ix + 2] + pVel[ix + 2] * dt;
          /* slip surface: descends toward −z, outcrops at the toe line */
          const planeY = nz > TOE_Z0 ? (nz - TOE_Z0) * tanb + 0.1 : -1.2;
          if (ny < planeY && nz > TOE_Z0 - 4) {                // ride the dip plane with basal friction
            ny = planeY;
            pVel[ix + 1] *= -0.05;                              // kill normal velocity
            pVel[ix + 2] *= (1 - 0.35 * dt);                    // frictional decay along strike of travel
            pVel[ix] *= (1 - 0.6 * dt);
        }
          const gy = groundY(nx, nz);
          if (ny < gy) {                                        // valley-floor runout & deposition
            ny = gy; pVel[ix + 1] *= -0.18; pVel[ix] *= 0.7; pVel[ix + 2] *= 0.55;
            pLife[i] -= dt * 2.4;                               // settle out faster once resting
          }
          pPos[ix] = nx; pPos[ix + 1] = ny; pPos[ix + 2] = nz;
          pLife[i] -= dt * 0.22;
        }
        pGeo.attributes.position.needsUpdate = true;
        pGeo.attributes.aLife.needsUpdate = true;
        if (still === NP) live = 0;
      }

      /* ---------------- orbit camera ------------------------------------- */
      (() => {
        let theta = 2.35, phi = 1.25, dist = 34, dragging = false, px = 0, py = 0;
        const target = new THREE.Vector3(1.5, 4.5, 4.5);
        function apply() {
          phi = P.clamp(phi, 0.5, 1.45); dist = P.clamp(dist, 16, 60);
          camera.position.set(target.x + dist * Math.sin(phi) * Math.sin(theta),
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

      /* ---------------- FoS physics + meter ------------------------------ */
      const GAMMA = 26.5;                                       // kN/m³ gneiss
      let pga = 0.10, beta = 34, coh = 120, phiA = 32;
      let foState = 'STANDBY', sliding = false, slideProgress = 0, shake = 0;

      function fos(pga_g, bDeg, cKPa, phiDeg, uKPa, zM) {
        /* pseudo-static planar slide, per-unit-area form:
           FoS = [c + (cosβ − kh·sinβ − u/γz)·γz·tanφ] / [(sinβ + kh·cosβ)·γz] */
        const b = bDeg * Math.PI / 180;
        const sigmaN = Math.max(0.05, Math.cos(b) - pga_g * Math.sin(b)) * GAMMA * zM - uKPa;
        const num = cKPa + sigmaN * Math.tan(phiDeg * Math.PI / 180);
        const den = (Math.sin(b) + pga_g * Math.cos(b)) * GAMMA * zM;
        return P.clamp(num / den, 0.2, 4.5);
      }

      function updateFoS() {
        const z = 6.5;                                           // mean slip-plane depth (m)
        const F = fos(pga, beta, coh, phiA, 0, z);
        const bar = ui.card.querySelector('[data-fo-bar]');
        const meter = ui.card.querySelector('[data-fo]');
        ui.ro('fo', F.toFixed(2));
        let col, state;
        if (F > 1.5) { col = '#5fbf77'; state = 'STABLE'; }
        else if (F >= 1.0) { col = '#e8c34a'; state = 'MARGINAL'; }
        else { col = '#e0503c'; state = 'UNSTABLE — FoS < 1.0'; }
        ui.ro('fostate', sliding ? 'RUPTURING' : state);
        if (bar) {
          bar.style.setProperty('--fo-color', col);
          bar.style.width = P.clamp(F / 2.5, 0.04, 1) * 100 + '%';
        }
        if (meter) meter.style.color = col;
        foState = state;
        ui.hud(
          '<div class="hud-row"><span>PSEUDO-STATIC PLANAR SLIDE · FoS</span></div>' +
          '<div class="hud-row"><span>k<sub>h</sub></span><b>' + pga.toFixed(2) + ' g</b><span>β ' + beta.toFixed(0) +
            '° · φ ' + phiA.toFixed(0) + '° · c ' + coh.toFixed(0) + ' kPa</span></div>' +
          '<div class="hud-row"><span>FoS = [c + σ′ₙ·tanφ] / [γz(sinβ + k<sub>h</sub>cosβ)] = </span><b style="color:' + col + '">' + F.toFixed(2) + '</b></div>' +
          '<div class="hud-row"><span>' + (sliding ? '⚠ DEBRIS AVALANCHE PROPAGATING' : state) + ' · γ 26.5 kN/m³ · z̄ 6.5 m</span></div>'
        );
        return F;
      }

      ui.setOutUnit('pga', ' g');
      ui.setOutUnit('beta', '°');
      ui.setOutUnit('coh', ' kPa');
      ui.setOutUnit('phi', '°');
      ui.onRange('pga', v => { pga = v; const F = updateFoS(); if (F < 1 && !sliding) shake = Math.min(0.5, shake + 0.2); });
      ui.onRange('beta', v => { beta = v; buildPrism(v); buildShearPlane(v); updateFoS(); });
      ui.onRange('coh', v => { coh = v; updateFoS(); });
      ui.onRange('phi', v => { phiA = v; updateFoS(); });

      ui.onClick('rupture', () => {
        const F = updateFoS();
        if (sliding) return;
        if (F < 1.0) {
          sliding = true; slideProgress = 0;
          spawnDebris(beta);
          shake = 1.0;
          if (window.Seismo) window.Seismo.trigger(1.0);
        } else {
          /* refusal feedback: brief shake + message, no collapse */
          shake = 0.25;
          ui.ro('fostate', 'RUPTURE REFUSED — FoS ≥ 1.0');
        }
      });
      ui.onClick('reset', () => {
        sliding = false; slideProgress = 0; live = 0;
        for (let i = 0; i < NP; i++) pLife[i] = 0;
        pGeo.attributes.aLife.needsUpdate = true;
        buildPrism(beta);                                       // restore the intact prism
        if (shearPlane) shearPlane.material.opacity = 0.35;
        updateFoS();
      });

      updateFoS();

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
          if (first) { resize(); first = false; }

          /* seismic micro-tremor while PGA high or during rupture */
          const tremor = (pga > 0.35 ? 0.06 : 0.02) * pga + shake * 0.14;
          if (tremor > 0.001) {
            camera.position.x += Math.sin(t * 41) * tremor * 0.1;
            camera.position.y += Math.cos(t * 37) * tremor * 0.08;
          }
          shake = Math.max(0, shake - dt * 0.7);

          if (sliding && sliding !== 'settled' && prism) {
            slideProgress += dt * 0.55;
            const b = beta * Math.PI / 180;
            /* translate + rotate the prism down the dip, then hand it to particles */
            const s = Math.min(slideProgress, 1);
            const ease = s * s;
            prism.position.z = -ease * 7.5 * Math.cos(b);       // geometry pre-translated to world
            prism.position.y = -ease * 7.5 * Math.sin(b) * 0.9;
            prism.rotation.x = -ease * b * 0.4;
            prism.rotation.z = ease * 0.12 * Math.sin(t * 9);
            if (s >= 1) {
              prism.visible = false;                            // fully converted to debris
              spawnDebris(beta);                                // final burst
              sliding = 'settled';
            }
          }
          if (sliding === 'settled') {
            /* keep meter red until reset */
            ui.ro('fostate', 'FAILED — RESET TO RESTORE');
          }
          stepParticles(dt);
          renderer.render(scene, camera);
        },
        dispose() { renderer.dispose(); }
      };
    }
  });
})();
