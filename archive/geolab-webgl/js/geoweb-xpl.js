/* ==========================================================================
   GEOWEB MODULE 01 — OPTICAL PETROGRAPHIC THIN SECTION (XPL)
   --------------------------------------------------------------------------
   Photorealistic petrographic-microscope view of a 30 µm granitic thin
   section rendered with Three.js + a custom GLSL fragment shader.

   Physics implemented per-pixel in the fragment shader:
     • Grain fabric from Worley/cell noise → quartz, plagioclase (polysynthetic
       albite twinning), biotite and olivine, each with its real birefringence:
         Δn quartz ≈ 0.009 | plagioclase ≈ 0.008–0.012 | biotite ≈ 0.043–0.07
         olivine ≈ 0.035–0.04
     • Retardance  Γ = Δn · t · sin²(2·(θgrain − θpolarizer)) · 1e6 [nm]
       with t = 30 µm — extinction every 90° of stage rotation.
     • Interference colour = Michel-Lévy chart approximation: Γ mapped through
       the visible spectrum (Newton series order I → IV).
     • PPL mode: relief + pleochroism (biotite chocolate in plane polarized
       light), no interference colours.
   UI: Stage angle dial 0–360°, magnification 10×/20×/40× with live µm scale
   bar overlay, PPL/XPL toggle, retardance & extinction readouts.
   ========================================================================== */
'use strict';

(function () {
  if (!window.GeoWeb) return;

  const VERT = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;

  const FRAG = `
    precision highp float;
    varying vec2 vUv;

    uniform float uTime;
    uniform float uAngleDeg;    // rotatable polarizer / stage angle, degrees
    uniform float uMagScale;    // grain density multiplier from magnification
    uniform float uXpl;         // 1.0 = cross polars, 0.0 = plane polarized
    uniform float uAspect;
    uniform float uFieldRadius; // circular microscope field radius (uv units)

    /* ---------- hashes & 2D cell (Worley) noise for the grain fabric ------ */
    vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return fract(sin(p) * 43758.5453123);
    }
    float hash1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 261.7))) * 43127.113); }

    /* worley: returns cell id + distance to feature point */
    vec3 worley(vec2 p) {
      vec2 n = floor(p);
      vec2 f = fract(p);
      float d1 = 8.0; float id = 0.0; vec2 fp = vec2(0.0);
      for (int j = -1; j <= 1; j++)
      for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = hash2(n + g);
        o = 0.5 + 0.5 * sin(uTime * 0.02 + 6.2831 * o);   // near-static jitter
        vec2 r = g + o - f;
        float d = dot(r, r);
        if (d < d1) { d1 = d; id = hash1(n + g); fp = n + g + o; }
      }
      return vec3(sqrt(d1), id, hash1(fp * 1.7));
    }

    /* fine fbm for surface dirt / inclusion texture */
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * (0.5 + 0.5 * sin(p.x * 3.1 + p.y * 1.7));
        p = p * 2.13 + vec2(1.7, 9.2); a *= 0.5;
      }
      return v;
    }

    /* wavelength λ(nm) → sRGB approximation (visible 380–720 nm) */
    vec3 wavelengthRGB(float wl) {
      vec3 c = vec3(0.0);
      if (wl < 440.0)      c = vec3((440.0 - wl) / 60.0, 0.0, 1.0);
      else if (wl < 490.0) c = vec3(0.0, (wl - 440.0) / 50.0, 1.0);
      else if (wl < 510.0) c = vec3(0.0, 1.0, (510.0 - wl) / 20.0);
      else if (wl < 580.0) c = vec3((wl - 510.0) / 70.0, 1.0, 0.0);
      else if (wl < 645.0) c = vec3(1.0, (645.0 - wl) / 65.0, 0.0);
      else                 c = vec3(1.0, 0.0, 0.0);
      float i = 1.0;
      if (wl < 420.0)      i = 0.5 + 0.5 * (wl - 380.0) / 40.0;
      else if (wl > 680.0) i = 0.5 + 0.5 * (720.0 - wl) / 40.0;
      return c * clamp(i, 0.0, 1.0);
    }

    /* Michel-Lévy order I..IV interference colour from retardance Γ [nm].
       First-order grey starts ~130 nm; white at ~560; yellow ~700; red ~850;
       violet-blue ~1150; II green ~1450; II red ~1900; III … IV pale.      */
    vec3 interferenceColor(float gamma) {
      if (gamma < 130.0) {
        float k = gamma / 130.0;                        // first-order grey/black
        return mix(vec3(0.02), vec3(0.28, 0.30, 0.34), k);
      }
      /* map Γ onto an effective wavelength sweeping the Newton series twice */
      float phase = fract(gamma / 1120.0);              // one full colour order
      float wl = mix(700.0, 395.0, phase);              // red → violet sweep
      vec3 col = wavelengthRGB(wl);
      float sat = 1.0 - smoothstep(0.0, 1.0, gamma / 2600.0) * 0.55; // higher orders pale out
      col = mix(vec3(dot(col, vec3(0.33))), col, sat);
      float bright = mix(0.55, 1.0, sin(phase * 3.14159));
      if (gamma > 2400.0) col = mix(col, vec3(0.55, 0.42, 0.28), smoothstep(2400.0, 3600.0, gamma)); // brownish high orders
      return col * bright;
    }

    void main() {
      /* normalised, aspect-corrected coordinates centred on the field */
      vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);

      /* ---- circular microscope field of view ---- */
      float fieldMask = smoothstep(uFieldRadius, uFieldRadius - 0.012, length(p));
      if (fieldMask <= 0.001) {
        gl_FragColor = vec4(0.015, 0.014, 0.017, 1.0);   // black vignette surround
        return;
      }

      /* ---- grain fabric ---- */
      vec2 gp = p * (14.0 * uMagScale);                   // more grains per view at 40x? (fewer µm each)
      vec3 w = worley(gp);
      float id = w.y;
      int kind = int(mod(id * 7.0, 4.0));

      float dR = 0.009; vec3 ppl = vec3(0.82, 0.84, 0.86);
      float pleo = 0.0; float relief = 0.05;
      if (kind == 0) {                                    /* QUARTZ */
        dR = 0.009; ppl = vec3(0.86, 0.88, 0.90); relief = 0.04;
      } else if (kind == 1) {                             /* PLAGIOCLASE — twinned */
        dR = 0.010; ppl = vec3(0.88, 0.88, 0.92); relief = 0.03;
      } else if (kind == 2) {                             /* BIOTITE — strong pleochroism */
        dR = 0.052; ppl = vec3(0.55, 0.36, 0.18); pleo = 1.0; relief = 0.09;
      } else {                                            /* OLIVINE — high relief, fractures */
        dR = 0.038; ppl = vec3(0.72, 0.78, 0.66); relief = 0.14;
      }

      /* orientation of each grain's optic axis */
      float orient = hash1(vec2(id * 13.7, 4.1)) * 3.14159;

      /* sub-grain details -------------------------------------------------
         plagioclase: polysynthetic albite twins flip dR slightly           */
      if (kind == 1) {
        vec2 lp = w.z * 6.283 + gp;                       // per-grain phase
        float twin = step(0.5, fract(dot(vec2(cos(orient + 1.57), sin(orient + 1.57)), gp) * 1.6 + hash1(vec2(id, 3.3))));
        dR *= mix(0.86, 1.12, twin);
      }
      /* biotite: cleavage lines */
      float cleav = 1.0;
      if (kind == 2) {
        float ln = abs(fract(dot(p, vec2(cos(orient + 1.57), sin(orient + 1.57))) * 26.0) - 0.5);
        cleav = 1.0 - 0.22 * smoothstep(0.42, 0.5, ln);
      }
      /* olivine: irregular fracture mesh */
      if (kind == 3) {
        float fr = fbm(gp * 3.0 + id);
        ppl *= mix(0.9, 1.05, fr);
      }

      /* grain boundary (dark line in both lighting modes) */
      float bw = 0.06 + 0.02 * hash1(vec2(id, 9.0));
      float boundary = smoothstep(bw, bw * 0.35, w.x);

      /* ---- polarizer physics ---- */
      float thetaP = radians(uAngleDeg);                  // rotatable polarizer/stage
      float chi = 2.0 * (orient - thetaP);
      float ext = pow(sin(chi), 2.0);                     // Malus-style extinction factor

      /* retardance: Γ[nm] = Δn · t(µm) · 1000 · sin²(2χ') ; t = 30 µm */
      float gamma = dR * 30.0 * 1000.0 * ext;

      vec3 col;
      if (uXpl > 0.5) {
        /* CROSS POLARS: dark background + interference colours */
        col = interferenceColor(gamma);
        /* brightness also modulated by extinction so grains blink black at 90° */
        col *= 0.25 + 0.75 * ext;
        /* anomalous interference tint for biotite (deep reddish-brown) */
        if (kind == 2) col = mix(col, col * vec3(1.15, 0.72, 0.5), 0.55);
      } else {
        /* PLANE POLARIZED LIGHT: greys with relief edges + pleochroism.
           Biotite changes tone as the polarizer rotates (single-refraction
           absorption parallel to χ). */
          float shade = 0.72 + 0.28 * fbm(gp * 2.0);
        col = ppl * shade;
        if (pleo > 0.5) {
          float ab = 0.5 + 0.5 * cos(2.0 * (orient - thetaP));
          col = mix(col * 0.55, col * 1.12, ab);          // pleochroic halo
        }
        /* high relief: bright rim ( Beck line ) */
        col += relief * boundary * vec3(0.9, 0.88, 0.82);
      }

      /* crackle across the section + slight chromatic scatter of the objective */
      float dirt = fbm(p * 90.0);
      col *= 0.92 + 0.12 * dirt;

      /* grain boundaries darken */
      col = mix(col, vec3(0.03, 0.03, 0.04), (1.0 - boundary) * 0.75);

      /* microscope vignette + lens circle glow */
      float r = length(p) / uFieldRadius;
      col *= 1.0 - 0.35 * pow(r, 3.0);

      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`;

  window.GeoWeb.register({
    id: 'xpl',
    init(canvas, ui, inst, P) {
      const rect = canvas.getBoundingClientRect();

      /* ---------- renderer with device-capability scaling ---------- */
      const renderer = new THREE.WebGLRenderer({
        canvas, antialias: !P.lowEnd, alpha: false, powerPreference: 'high-performance'
      });
      const aniso = renderer.capabilities.getMaxAnisotropy();   // documented capability probe
      P.anisoMax = aniso;
      renderer.setPixelRatio(P.dpr);
      renderer.setSize(rect.width, rect.height, false);
      renderer.shadowMap.enabled = false;                        // flat-field scope: no shadows needed
      renderer.outputEncoding = THREE.sRGBEncoding;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      /* ---------- uniforms + fullscreen shader quad ---------- */
      const MAGS = { 10: 1.0, 20: 1.9, 40: 3.4 };               // field scale factors
      const FOV_UM = { 10: 2000, 20: 1050, 40: 520 };           // µm across the field
      const uniforms = {
        uTime:       { value: 0 },
        uAngleDeg:   { value: 0 },
        uMagScale:   { value: 1 },
        uXpl:        { value: 1 },
        uAspect:     { value: Math.max(rect.width / rect.height, 1) },
        uFieldRadius:{ value: 0.46 }
      };
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG, uniforms, depthTest: false
      });
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
      scene.add(quad);

      /* ---------- state driven by the sidebar controls ---------- */
      let mag = 10, xpl = true, angle = 0;

      ui.onRange('angle', v => {
        angle = v; uniforms.uAngleDeg.value = v;
        ui.hud(hudHTML(v, mag, xpl));
        updateReadouts(v);
      });
      ui.onSeg('zoom', val => {
        mag = parseInt(val, 10);
        animateMag(MAGS[mag]);
        ui.hud(hudHTML(angle, mag, xpl));
      });
      ui.onSeg('pol', val => {
        xpl = (val === 'xpl');
        uniforms.uXpl.value = xpl ? 1 : 0;
        ui.hud(hudHTML(angle, mag, xpl));
        updateReadouts(angle);
      });

      /* smooth magnification transition (interpolate grain density) */
      let magTarget = 1;
      function animateMag(t) { magTarget = t; }

      /* drag inside the field of view = rotate the stage */
      let dragging = false, lastX = 0;
      canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
      canvas.addEventListener('pointermove', e => {
        if (!dragging) return;
        angle = ((angle + (e.clientX - lastX) * 0.75) % 360 + 360) % 360;
        lastX = e.clientX;
        uniforms.uAngleDeg.value = angle;
        const inp = ui.card.querySelector('input[data-ctl="angle"]');
        if (inp) inp.value = String(Math.round(angle));
        ui.hud(hudHTML(angle, mag, xpl));
        updateReadouts(angle);
      });
      ['pointerup', 'pointercancel'].forEach(ev =>
        canvas.addEventListener(ev, () => { dragging = false; }));

      /* ---------- scientific readouts ---------- */
      function updateReadouts(a) {
        const chi = 2 * (Math.PI / 4 - a * Math.PI / 180);      // reference grain at 45°
        const ext = Math.pow(Math.sin(chi), 2);
        const gamma = 0.009 * 30 * 1000 * ext;                  // quartz Γ max 270 nm
        ui.ro('ret', Math.round(gamma) + ' nm');
        const near = Math.abs(ext) < 0.05;
        ui.ro('ext', near ? 'AT EXTINCTION' : (ext > 0.9 ? 'MAX BRIGHT' : 'PARTIAL'));
      }
      function hudHTML(a, m, isXpl) {
        const fovUm = FOV_UM[m];
        return (
          '<div class="hud-row"><span>' + (isXpl ? 'XPL ⚡ CROSSED POLARS' : 'PPL ○ SINGLE POLAR') + '</span></div>' +
          '<div class="hud-row"><span>OBJ</span><b>' + m + '×</b><span>λ 550nm · t 30µm</span></div>' +
          '<div class="hud-row"><span>STAGE</span><b>' + a.toFixed(1) + '°</b><span>FOV ' + fovUm + ' µm</span></div>' +
          '<div class="scalebar" data-len="' + Math.round(scalePx(fovUm)) + '">' +
            '<i></i><em>' + niceBarLabel(fovUm) + '</em></div>'
        );
      }
      /* scale bar length in px relative to stage width (≈ square field) */
      function scalePx(fovUm) {
        const um = niceBarUm(fovUm);
        return (um / fovUm) * 240;                              // 240px ≈ field diameter
      }
      function niceBarUm(fovUm) {
        const cand = [1000, 500, 200, 100, 50];
        for (const c of cand) if (c <= fovUm * 0.45) return c;
        return 50;
      }
      function niceBarLabel(fovUm) {
        const um = niceBarUm(fovUm);
        return um >= 1000 ? (um / 1000) + ' mm' : um + ' µm';
      }
      updateReadouts(0);
      ui.hud(hudHTML(0, mag, xpl));

      /* ---------- resize ---------- */
      function resize() {
        const r = canvas.getBoundingClientRect();
        if (!r.width || !r.height) return;
        renderer.setSize(r.width, r.height, false);
        uniforms.uAspect.value = Math.max(r.width / r.height, 1);
      }
      window.addEventListener('resize', resize, { passive: true });

      /* ---------- render step (only called while in viewport) ---------- */
      return {
        step(dt, t) {
          uniforms.uTime.value = t;
          uniforms.uMagScale.value += (magTarget - uniforms.uMagScale.value) * Math.min(1, dt * 6);
          renderer.render(scene, camera);
        },
        dispose() {
          renderer.dispose(); mat.dispose(); quad.geometry.dispose();
        }
      };
    }
  });
})();
