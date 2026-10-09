/* ==========================================================================
   GEO LABS — MODULES 1–5 · TECTONICS & STRUCTURAL GEOLOGY
   01 Himalayan Orogeny (continental collision slider)
   02 Supercontinent Cycle (Pangea → modern → Amasia scrub globe-map)
   03 Fault Dynamics Simulator (strain gauge → stick-slip rupture + waves)
   04 Subduction Megathrust & Tsunami (locking, snap, wave propagation)
   05 Continental Rifting & Ocean Basin Formation (plume → rift → spreading)
   ========================================================================== */
'use strict';
(function () {
  const R = window.GeoLabs.register;

  /* shared helpers ------------------------------------------------------ */
  function skyGrad(ctx, w, h, top, bot) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top); g.addColorStop(1, bot); return g;
  }
  function rippleRing(ctx, x, y, r, a) {
    if (r <= 0 || a <= 0) return;
    ctx.strokeStyle = `rgba(224,169,95,${a})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  }

  /* =====================================================================
     01 · HIMALAYAN OROGENY — Indian plate thrusts under Eurasia in real time
     ===================================================================== */
  R({
    id: 'orogeny', num: 1, cat: 'TECTONICS', catLabel: 'Tectonics & Structural Geology',
    title: 'Himalayan Orogeny — Continental Collision',
    desc: 'Drag the slider to drive India ~50 mm/yr into Eurasia: crust shortens, thrust sheets stack, and the Himalaya rise.',
    overlay: 'Slider = convergence since 55 Ma',
    controls: [
      { type: 'range', label: 'Convergence', min: 0, max: 100, value: 35, unit: ' km', key: 'conv',
        format: v => Math.round(v * 20), onInput: (v, lab) => { lab.v.conv = v / 100; } },
      { type: 'readout', label: 'Peak elevation', key: 'elev' }
    ],
    init(canvas, ctx, lab, P) {
      const steps = []; // eroded heightfield of mountain "scrapes"
      let lastConv = -1;
      return {
        step(dt, t, w, h) {
          const c = lab.v.conv ?? 0.35;
          const base = h * 0.78;
          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = skyGrad(ctx, w, h, '#171219', '#2b1c14');
          ctx.fillRect(0, 0, w, h);

          /* Eurasian plate (right, overriding) */
          ctx.fillStyle = '#4a414e';
          ctx.beginPath();
          ctx.moveTo(w * 0.55, base - 6); ctx.lineTo(w, base - 14); ctx.lineTo(w, h); ctx.lineTo(w * 0.5, h); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#5a5060'; ctx.fillRect(w * 0.72, base - 26, w * 0.28, 14);

          /* Indian plate — subducting wedge, pushed left→right by convergence */
          const slide = c * w * 0.16;
          ctx.save(); ctx.translate(slide, 0);
          const dip = base + 40 + c * 40;
          ctx.fillStyle = '#8a5a3b';
          ctx.beginPath();
          ctx.moveTo(-w * 0.1, base); ctx.lineTo(w * 0.52, base - 4);
          ctx.quadraticCurveTo(w * 0.66, base + 10, w * 0.78, dip);
          ctx.lineTo(w * 0.7, h + 40); ctx.lineTo(-w * 0.1, h + 40); ctx.closePath(); ctx.fill();
          /* stratigraphic stripes on the Indian slab */
          ctx.strokeStyle = 'rgba(20,15,10,.35)'; ctx.lineWidth = 2;
          for (let i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-w * 0.1, base + i * 16);
            ctx.lineTo(w * 0.52, base - 4 + i * 15);
            ctx.stroke();
          }
          ctx.restore();

          /* accretionary wedge + Main Central / Main Frontal thrusts */
          ctx.strokeStyle = '#e0a95f'; ctx.lineWidth = 2;
          for (let k = 0; k < 3; k++) {
            const tx = w * (0.44 + k * 0.07) - slide * 0.4;
            ctx.beginPath();
            ctx.moveTo(tx, base + 8);
            ctx.quadraticCurveTo(tx + 24, base - 30 - c * 60 - k * 8, tx + 52, base - 60 - c * 90 - k * 14);
            ctx.stroke();
          }

          /* growing mountain prism — stacked thrust sheets */
          const peaks = 7;
          ctx.fillStyle = '#d3bd9c';
          ctx.beginPath();
          ctx.moveTo(w * 0.3, base);
          for (let i = 0; i <= peaks; i++) {
            const px = w * (0.32 + i * 0.055);
            const ph = (Math.sin(i * 1.7 + 1) * 0.5 + 0.5) * c * h * 0.5 + 6;
            ctx.lineTo(px, base - ph);
            ctx.lineTo(px + w * 0.027, base - ph * 0.55);
          }
          ctx.lineTo(w * 0.72, base); ctx.closePath(); ctx.fill();
          /* snow caps shimmer */
          ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.2 * Math.sin(t * 2)) + ')';
          for (let i = 0; i <= peaks; i += 2) {
            const px = w * (0.32 + i * 0.055);
            const ph = (Math.sin(i * 1.7 + 1) * 0.5 + 0.5) * c * h * 0.5 + 6;
            if (ph > 24) { ctx.beginPath(); ctx.moveTo(px - 6, base - ph + 10); ctx.lineTo(px, base - ph); ctx.lineTo(px + 6, base - ph + 10); ctx.closePath(); ctx.fill(); }
          }

          /* isostatic root deepens with mass */
          ctx.fillStyle = 'rgba(122,79,54,.5)';
          ctx.beginPath();
          ctx.moveTo(w * 0.35, base + 30); ctx.lineTo(w * 0.6, base + 30 + c * 70); ctx.lineTo(w * 0.72, base + 30); ctx.closePath(); ctx.fill();

          const elev = Math.round(c * 8848);
          if (lab.ro.elev) lab.ro.elev.textContent = elev.toLocaleString() + ' m';
          if (Math.abs((lab.v.conv ?? 0) - lastConv) > 0.004) { lastConv = lab.v.conv; lab.seismo(0.3 + c); }
        }
      };
    }
  });

  /* =====================================================================
     02 · SUPERCONTINENT CYCLE — scrub from Pangea (300 Ma) to Amasia (+250 Ma)
     ===================================================================== */
  R({
    id: 'supercont', num: 2, cat: 'TECTONICS', catLabel: 'Tectonics & Structural Geology',
    title: 'Supercontinent Cycle — Pangea → Amasia',
    desc: 'Scrub the time slider across the Wilson cycle: 300 Ma Pangea assembles, rifts through the Mesozoic, and re-forms as Amasia.',
    overlay: 'Drag time · continents drift on a micro-globe projection',
    controls: [
      { type: 'range', label: 'Time', min: -300, max: 250, value: -135, step: 1, key: 'time', unit: '',
        format: v => v === 0 ? 'Today' : (v < 0 ? (-v) + ' Ma' : '+' + v + ' Ma'),
        onInput: (v, lab) => { lab.v.time = v; } },
      { type: 'toggle', label: 'Auto-drift', key: 'auto', value: false, onChange: (on, lab) => { lab.v.auto = on; } }
    ],
    initState: { time: -135, auto: false },
    init(canvas, ctx, lab, P) {
      /* each continent: start (Pangea) pos, present pos, future (Amasia) pos — % coords */
      const CONT = [
        { n: 'NA', col: '#b6552e', a: [42, 34], b: [26, 30], c: [34, 26], s: 15, r: 1.1 },
        { n: 'SA', col: '#c98d5f', a: [52, 62], b: [34, 68], c: [40, 60], s: 11, r: 0.8 },
        { n: 'EU', col: '#7b8f6a', a: [55, 26], b: [52, 22], c: [50, 20], s: 9,  r: 0.9 },
        { n: 'AF', col: '#d97e4a', a: [55, 52], b: [54, 50], c: [52, 44], s: 13, r: 0.7 },
        { n: 'IN', col: '#e0a95f', a: [63, 66], b: [70, 40], c: [74, 30], s: 7,  r: 1.4 },
        { n: 'AU', col: '#41697a', a: [68, 68], b: [80, 66], c: [70, 52], s: 10, r: 0.6 },
        { n: 'AN', col: '#9aa7b5', a: [55, 82], b: [50, 90], c: [55, 84], s: 9,  r: 0.3 },
        { n: 'AS', col: '#8a5a3b', a: [66, 30], b: [76, 28], c: [66, 26], s: 17, r: 0.8 }
      ];
      const ease = x => x < 0 ? (x + 300) / 300 : x / 250; // 0 at -300 … 1 today … beyond
      let prev = null;
      return {
        step(dt, t, w, h) {
          if (lab.v.auto) { lab.v.time = ((lab.v.time + dt * 24) % 550) - 300; if (lab.ui && lab.ui.time) lab.ui.time.value = lab.v.time; }
          const T = lab.v.time;
          const f = T <= 0 ? ease(T) : 1 + ease(T) * 0.0; // piecewise below
          let p, q, mix;
          if (T <= 0) { p = 0; q = 1; mix = (T + 300) / 300; } else { p = 1; q = 2; mix = T / 250; }
          ctx.clearRect(0, 0, w, h);
          /* ocean sphere */
          const cx = w / 2, cy = h / 2, rad = Math.min(w, h) * 0.44;
          ctx.save();
          ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.clip();
          ctx.fillStyle = skyGrad(ctx, w, h, '#12222e', '#0b161f'); ctx.fillRect(0, 0, w, h);
          /* graticule */
          ctx.strokeStyle = 'rgba(106,174,230,.14)'; ctx.lineWidth = 1;
          const spin = t * 0.05;
          for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.ellipse(cx, cy, Math.abs(Math.cos(i / 3.4 + spin)) * rad, rad, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          for (let j = -2; j <= 2; j++) {
            ctx.beginPath();
            ctx.moveTo(cx - rad, cy + j * rad / 2.4);
            ctx.quadraticCurveTo(cx, cy + j * rad / 2.4 + Math.sin(spin) * 6, cx + rad, cy + j * rad / 2.4);
            ctx.stroke();
          }
          /* continents interpolate a→b→c with drift wobble */
          CONT.forEach(k => {
            const x = (k.a[0] * (1 - mix) + (p === 0 ? k.b[0] : k.c[0]) * mix);
            const y = (k.a[1] * (1 - mix) + (p === 0 ? k.b[1] : k.c[1]) * mix);
            const wob = Math.sin(t * 0.6 + k.s) * 1.2;
            const px = cx + (x / 100 - 0.5) * rad * 2 * 0.92 + wob;
            const py = cy + (y / 100 - 0.5) * rad * 1.7;
            ctx.fillStyle = k.col;
            ctx.beginPath();
            /* organic blob */
            for (let a = 0; a < 9; a++) {
              const ang = a / 9 * Math.PI * 2;
              const rr = k.s * (0.75 + 0.3 * Math.sin(a * 2.3 + k.r * 9));
              const vx = px + Math.cos(ang) * rr * 1.15, vy = py + Math.sin(ang) * rr * 0.85;
              a === 0 ? ctx.moveTo(vx, vy) : ctx.lineTo(vx, vy);
            }
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke();
          });
          /* ridge glow when rifting mid-cycle */
          const rift = Math.max(0, 1 - Math.abs(mix - 0.45) * 3);
          if (rift > 0.02) {
            ctx.strokeStyle = `rgba(217,126,74,${rift * 0.7})`; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(cx - rad * 0.2, cy - rad); ctx.quadraticCurveTo(cx + rad * 0.1, cy, cx - rad * 0.1, cy + rad); ctx.stroke();
          }
          ctx.restore();
          /* limb shading + label */
          const lg = ctx.createRadialGradient(cx - rad * 0.3, cy - rad * 0.3, rad * 0.2, cx, cy, rad);
          lg.addColorStop(0, 'rgba(255,255,255,.07)'); lg.addColorStop(1, 'rgba(0,0,0,.5)');
          ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(224,169,95,.4)'; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#ece3d4'; ctx.font = '600 13px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
          const name = T < -240 ? 'PANGAEA ASSEMBLING' : T < -180 ? 'PANGAEA' : T < -50 ? 'BREAKUP · PAN-THALASSA CLOSING' : T < 60 ? 'MODERN CONFIGURATION' : 'PROJECTED AMASIA';
          ctx.fillText(name, cx, cy + rad + 18);
          ctx.fillText(T === 0 ? '0 Ma · TODAY' : (T < 0 ? (-T) + ' Ma' : '+' + T + ' Ma'), cx, cy + rad + 34);
        }
      };
    }
  });

  /* =====================================================================
     03 · FAULT DYNAMICS SIMULATOR — elastic rebound until stick-slip rupture
     ===================================================================== */
  R({
    id: 'faultsim', num: 3, cat: 'TECTONICS', catLabel: 'Tectonics & Structural Geology',
    title: 'Fault Dynamics Simulator',
    desc: 'Pick a fault type and load the strain gauge. When shear stress exceeds friction the fault ruptures elastically — stick-slip, just like earthquakes.',
    overlay: 'Load builds while you drag · release triggers nothing — friction holds until it doesn’t',
    controls: [
      { type: 'seg', label: 'Fault type', index: 0, key: 'ftype',
        options: [{ label: 'Normal', value: 'normal' }, { label: 'Reverse', value: 'reverse' }, { label: 'Strike-slip', value: 'strike' }],
        onChange: (v, lab) => { lab.v.ftype = v; lab.v.strain = 0; } },
      { type: 'range', label: 'Strain load', min: 0, max: 100, value: 0, key: 'strain', unit: '%', fill: true,
        onInput: (v, lab) => { lab.v.strain = v; } },
      { type: 'readout', label: 'Magnitude', key: 'mag' }
    ],
    initState: { ftype: 'normal', strain: 0, slip: 0, waves: [], slipping: false },
    init(canvas, ctx, lab, P) {
      const THRESH = { normal: 72, reverse: 84, strike: 64 };
      return {
        step(dt, t, w, h) {
          const v = lab.v;
          const mid = w / 2, fk = h * 0.5;
          const thr = THRESH[v.ftype] || 72;
          /* auto-release after a rupture */
          if (v.slipping) {
            v.slip = Math.max(0, (v.slip || 0) - dt * 60);
            v.strain = Math.max(0, v.strain - dt * 55);
            if (lab.ui.strain) lab.ui.strain.value = v.strain;
            if (v.slip <= 0.5) v.slipping = false;
          }
          if (v.strain >= thr && !v.slipping) {
            v.slipping = true;
            v.slip = 26 + (v.strain - thr) * 1.4;
            const mag = (3.4 + (v.strain - thr) * 0.06).toFixed(1);
            if (lab.ro.mag) lab.ro.mag.textContent = 'M ' + mag;
            lab.seismo(1.6);
            for (let i = 0; i < 3; i++) v.waves.push({ r: 4 + i * 2, a: 0.9 });
          }
          v.waves.forEach(q => { q.r += dt * 240; q.a -= dt * 0.55; });
          v.waves = v.waves.filter(q => q.a > 0 && q.r < w * 1.2);

          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = skyGrad(ctx, w, h, '#141019', '#221a14'); ctx.fillRect(0, 0, w, h);

          const sh = v.slip;
          /* hanging wall / footwall blocks displaced per fault mechanics */
          const jitter = v.slipping ? Math.sin(t * 90) * 2 : 0;
          const drawBlock = (side) => {
            ctx.save();
            let dx = 0, dy = 0;
            if (v.ftype === 'normal')  { dx = side === 'hang' ? sh * 0.4 : 0; dy = side === 'hang' ? sh * 0.7 : 0; }
            if (v.ftype === 'reverse') { dx = side === 'hang' ? -sh * 0.5 : 0; dy = side === 'hang' ? -sh * 0.7 : 0; }
            if (v.ftype === 'strike')  { dx = 0; dy = 0; }
            const sdx = v.ftype === 'strike' ? (side === 'hang' ? sh + jitter : -sh - jitter) : 0;
            ctx.translate(dx + sdx, dy);
            ctx.fillStyle = side === 'hang' ? '#7b4f36' : '#8a5a3b';
            ctx.beginPath();
            if (side === 'hang') { ctx.moveTo(mid + 2, fk - 60); ctx.lineTo(w, fk - 60); ctx.lineTo(w, h); ctx.lineTo(mid + 2, h); }
            else { ctx.moveTo(0, fk - 60); ctx.lineTo(mid - 2, fk - 60); ctx.lineTo(mid - 2, h); ctx.lineTo(0, h); }
            ctx.closePath(); ctx.fill();
            /* strata stripes bend near the fault (drag folding) */
            ctx.strokeStyle = 'rgba(241,231,216,.28)'; ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
              const yy = fk - 40 + i * 26;
              ctx.beginPath();
              if (side === 'hang') { ctx.moveTo(mid + 8, yy + (v.ftype !== 'strike' ? (v.ftype === 'normal' ? 8 : -8) * (v.strain / thr) : 0)); ctx.lineTo(w, yy); }
              else { ctx.moveTo(0, yy); ctx.lineTo(mid - 8, yy + (v.ftype !== 'strike' ? (v.ftype === 'normal' ? 8 : -8) * -(v.strain / thr) : 0)); }
              ctx.stroke();
            }
            ctx.restore();
          };
          drawBlock('foot'); drawBlock('hang');

          /* fault plane glows with stored strain */
          const heat = v.strain / thr;
          ctx.strokeStyle = `rgba(${182 + 70 * heat},${85 - 40 * heat},${46 - 30 * heat},${0.5 + heat * 0.5})`;
          ctx.lineWidth = 3 + heat * 3;
          ctx.beginPath();
          if (v.ftype === 'strike') { ctx.moveTo(mid, fk - 60); ctx.lineTo(mid, h); }
          else if (v.ftype === 'normal') { ctx.moveTo(mid, fk - 60); ctx.lineTo(mid - 40, h); }
          else { ctx.moveTo(mid, h); ctx.lineTo(mid + 44, fk - 60); }
          ctx.stroke();

          /* seismic waves radiating on rupture */
          v.waves.forEach(q => rippleRing(ctx, mid, fk + 20, q.r, q.a));

          /* strain gauge arc */
          const gx = w - 54, gy = 54, gr = 30;
          ctx.strokeStyle = 'rgba(236,227,212,.25)'; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
          ctx.strokeStyle = heat > 0.85 ? '#e0563a' : '#e0a95f';
          ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * Math.min(1, heat)); ctx.stroke();
          ctx.fillStyle = '#ece3d4'; ctx.font = '600 11px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
          ctx.fillText(Math.round(v.strain) + '%', gx, gy + 4);
          if (!v.slipping && lab.ro.mag) lab.ro.mag.textContent = 'locked';
        }
      };
    }
  });

  /* =====================================================================
     04 · SUBDUCTION MEGATHRUST & TSUNAMI — lock, snap, wave propagation
     ===================================================================== */
  R({
    id: 'megathrust', num: 4, cat: 'TECTONICS', catLabel: 'Tectonics & Structural Geology',
    title: 'Subduction Zone Megathrust & Tsunami',
    desc: 'Oceanic crust drags under the continental plate. The megathrust locks and bends until it snaps upward — launching a tsunami across the ocean.',
    overlay: 'Press “Rupture” or wait for the strain to reach failure',
    controls: [
      { type: 'range', label: 'Convergence rate', min: 10, max: 90, value: 40, unit: ' mm/yr', key: 'rate',
        onInput: (v, lab) => { lab.v.rate = v; } },
      { type: 'toggle', label: '⚡ Force rupture', key: 'rupt', value: false,
        onChange: (on, lab) => { lab.v.force = true; } },
      { type: 'readout', label: 'Wave height', key: 'wave' }
    ],
    initState: { rate: 40, strain: 0, phase: 'lock', uplift: 0, waves: [], force: false },
    init(canvas, ctx, lab, P) {
      return {
        step(dt, t, w, h) {
          const v = lab.v;
          const sea = h * 0.42, contEdge = w * 0.62;
          if (v.phase === 'lock') {
            v.strain += dt * (v.rate / 40) * 14;
            if (v.strain > 100 || v.force) { v.phase = 'snap'; v.force = false; v.tSnap = 0; lab.seismo(1.8); }
          } else if (v.phase === 'snap') {
            v.tSnap += dt;
            v.uplift = Math.min(1, v.tSnap / 0.35);
            if (v.tSnap > 0.4) {
              v.phase = 'tsunami';
              v.waves = [{ x: contEdge - 30, dir: -1, amp: 26 }, { x: contEdge - 30, dir: 1, amp: 10 }];
              v.strain = 0; v.upliftT = 0;
            }
          } else { /* tsunami */
            v.upliftT = (v.upliftT || 1) - dt * 0.8; v.uplift = Math.max(0, v.upliftT);
            v.waves.forEach(q => { q.x += q.dir * dt * (q.dir < 0 ? 170 : 90); q.amp *= (q.dir < 0 ? 1.0006 : 0.995); });
            v.waves = v.waves.filter(q => q.x > -80 && q.x < w + 80);
            if (!v.waves.length) v.phase = 'lock';
          }

          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = skyGrad(ctx, w, h, '#101623', '#1b2433'); ctx.fillRect(0, 0, w, h);

          /* ocean water with tsunami displacement field */
          ctx.fillStyle = 'rgba(46,90,120,.85)';
          ctx.beginPath(); ctx.moveTo(0, sea);
          for (let x = 0; x <= contEdge; x += 6) {
            let y = sea;
            v.waves.forEach(q => {
              const d = Math.abs(x - q.x), L = 90;
              if (d < L) y -= q.amp * Math.pow(Math.cos((d / L) * Math.PI / 2), 2) * Math.sin(d * 0.05 - t * 3);
            });
            y += Math.sin(x * 0.05 + t * 1.4) * 1.5;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(contEdge, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

          /* subducting oceanic slab (bent down at the trench) */
          const bend = v.uplift * 8;
          ctx.fillStyle = '#3b4654';
          ctx.beginPath();
          ctx.moveTo(0, sea + 26); ctx.lineTo(contEdge - 6, sea + 30 - bend);
          ctx.quadraticCurveTo(contEdge + 40, sea + 60, contEdge + 130, h);
          ctx.lineTo(contEdge - 40, h); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(106,174,230,.35)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(0, sea + 34); ctx.lineTo(contEdge - 10, sea + 36 - bend);
          ctx.quadraticCurveTo(contEdge + 30, sea + 70, contEdge + 120, h); ctx.stroke();

          /* overriding continental plate — bulges up while locked, snaps up at rupture */
          const bulge = (v.phase === 'lock' ? v.strain / 100 : 0) * 5 + v.uplift * 14;
          ctx.fillStyle = '#6d5a4a';
          ctx.beginPath();
          ctx.moveTo(contEdge, sea + 28 - bulge);
          ctx.quadraticCurveTo(w * 0.8, sea - 12 - bulge, w, sea - 20 - bulge);
          ctx.lineTo(w, h); ctx.lineTo(contEdge + 60, h); ctx.closePath(); ctx.fill();
          /* coastal town silhouette on the block */
          ctx.fillStyle = '#241d17';
          for (let i = 0; i < 4; i++) {
            const bx = w * 0.72 + i * 22, bh = 12 + (i % 2) * 10;
            ctx.fillRect(bx, sea - 24 - bulge - bh, 14, bh);
          }

          /* locked-zone glow along the megathrust interface */
          const heat = v.phase === 'lock' ? v.strain / 100 : v.uplift;
          ctx.strokeStyle = `rgba(224,86,58,${0.35 + heat * 0.6})`;
          ctx.lineWidth = 3 + heat * 4;
          ctx.beginPath();
          ctx.moveTo(contEdge - 4, sea + 30 - bulge);
          ctx.quadraticCurveTo(contEdge + 20, sea + 55, contEdge + 60, sea + 100);
          ctx.stroke();
          /* focal point flash at snap */
          if (v.phase === 'snap') rippleRing(ctx, contEdge + 8, sea + 60, v.tSnap * 300, 1 - v.tSnap / 0.4);

          /* depth labels */
          ctx.fillStyle = 'rgba(236,227,212,.6)'; ctx.font = '11px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
          ctx.fillText('TRENCH', contEdge - 60, sea + 18);
          ctx.fillText('MEGATHRUST', contEdge + 12, sea + 90);
          ctx.fillText(v.phase.toUpperCase(), 12, 20);
          if (lab.ro.wave) lab.ro.wave.textContent = v.phase === 'lock' ? '—' : Math.round(v.waves[0] ? v.waves[0].amp * 1.4 : 0) + ' m';
        }
      };
    }
  });

  /* =====================================================================
     05 · CONTINENTAL RIFTING — plume → rift valley → sea flooding → MOR
     ===================================================================== */
  R({
    id: 'rifting', num: 5, cat: 'TECTONICS', catLabel: 'Tectonics & Structural Geology',
    title: 'Continental Rifting & Ocean Basin Birth',
    desc: 'A mantle plume domes and splits continental lithosphere: rift valley (East African Rift style), axial volcanoes, marine incursion, then seafloor spreading.',
    overlay: 'Scrub geological time from dome to mid-ocean ridge',
    controls: [
      { type: 'range', label: 'Rift stage', min: 0, max: 100, value: 20, key: 'stage',
        format: v => ['Dome & swell', 'Rift valley', 'Volcanism', 'Marine incursion', 'Mid-ocean ridge'][Math.min(4, Math.floor(v / 20))],
        onInput: (v, lab) => { lab.v.stage = v; } },
      { type: 'toggle', label: 'Animate advance', key: 'adv', value: true, onChange: (on, lab) => { lab.v.adv = on; } }
    ],
    initState: { stage: 20, adv: true },
    init(canvas, ctx, lab, P) {
      const lavas = [];
      return {
        step(dt, t, w, h) {
          const v = lab.v;
          if (v.adv) { v.stage = (v.stage + dt * 6) % 100; if (lab.ui.stage) lab.ui.stage.value = v.stage; }
          const s = v.stage / 100;                       // 0..1 evolution
          const base = h * 0.62;
          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = skyGrad(ctx, w, h, '#151119', '#241610'); ctx.fillRect(0, 0, w, h);

          /* mantle plume — grows with early stage */
          const plumeW = 26 + s * 30;
          const pg = ctx.createLinearGradient(0, h, 0, base);
          pg.addColorStop(0, 'rgba(217,126,74,.9)'); pg.addColorStop(1, 'rgba(182,85,46,.15)');
          ctx.fillStyle = pg;
          ctx.beginPath();
          ctx.moveTo(w / 2 - plumeW, h);
          ctx.quadraticCurveTo(w / 2 - plumeW * 0.4, base + 40, w / 2, base - 6 - s * 10);
          ctx.quadraticCurveTo(w / 2 + plumeW * 0.4, base + 40, w / 2 + plumeW, h);
          ctx.closePath(); ctx.fill();

          /* doming then splitting crust blocks */
          const gap = Math.max(0, (s - 0.35)) * w * 0.34;   // separation
          const drop = Math.max(0, (s - 0.2)) * 60;         // rift floor subsidence
          const dome = Math.sin(Math.min(1, s * 2.4) * Math.PI) * 26;
          const crust = (dir) => {
            ctx.save();
            ctx.translate(dir * gap / 2, 0);
            ctx.fillStyle = '#8a5a3b';
            ctx.beginPath();
            const inner = w / 2 + dir * 6;
            ctx.moveTo(dir > 0 ? inner : -40, base - dome);
            ctx.lineTo(dir > 0 ? w + 40 : inner, base - dome * (dir > 0 ? 1 : 1) + (dir > 0 ? 0 : 0));
            ctx.lineTo(dir > 0 ? w + 40 : -40, h);
            ctx.lineTo(inner, h);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(20,12,8,.4)'; ctx.lineWidth = 2;
            for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(inner, h - i * 26); ctx.lineTo(dir > 0 ? w : 0, h - i * 26 - dome * 0.3); ctx.stroke(); }
            /* border faults with tilted fault blocks */
            ctx.strokeStyle = '#e0a95f';
            ctx.beginPath(); ctx.moveTo(inner, base - dome); ctx.lineTo(inner - dir * 26, h); ctx.stroke();
            ctx.restore();
          };
          crust(-1); crust(1);

          /* rift floor */
          ctx.fillStyle = '#5d3f2c';
          ctx.fillRect(w / 2 - gap / 2 - 10, base - dome + drop, gap + 20, h);

          /* seawater floods once gap is wide enough */
          if (s > 0.6) {
            const wl = base - dome + drop - 8;
            ctx.fillStyle = 'rgba(46,110,140,.85)';
            ctx.fillRect(w / 2 - gap / 2 - 10, wl, gap + 20, h - wl);
          }
          /* axial volcanoes in early-mid stage */
          if (s > 0.25 && s < 0.75) {
            [-1, 1].forEach(d => {
              const vx = w / 2 + d * (gap / 2 + 14);
              ctx.fillStyle = '#3a2a20';
              ctx.beginPath(); ctx.moveTo(vx - 14, base - dome + drop); ctx.lineTo(vx, base - dome + drop - 26); ctx.lineTo(vx + 14, base - dome + drop); ctx.closePath(); ctx.fill();
              ctx.fillStyle = '#d97e4a';
              ctx.beginPath(); ctx.arc(vx, base - dome + drop - 26, 3 + Math.sin(t * 5 + d) * 1.5, 0, Math.PI * 2); ctx.fill();
            });
          }
          /* mid-ocean ridge: upwelling lava pulses in the axis */
          if (s > 0.62) {
            const pulse = (Math.sin(t * 4) + 1) / 2;
            ctx.fillStyle = `rgba(240,120,60,${0.5 + pulse * 0.5})`;
            ctx.fillRect(w / 2 - 3, base - dome + drop - 6, 6, h);
            if (Math.random() < 0.2 && lavas.length < P.p(40)) {
              lavas.push({ x: w / 2 + P.rand(-4, 4), y: base - dome + drop, vy: P.rand(-40, -14), life: 1 });
            }
          }
          for (let i = lavas.length - 1; i >= 0; i--) {
            const l = lavas[i];
            l.x += 0; l.y += l.vy * dt; l.vy += 60 * dt; l.life -= dt * 0.8;
            if (l.life <= 0) { lavas.splice(i, 1); continue; }
            ctx.fillStyle = `rgba(255,${140 + l.life * 80 | 0},60,${l.life})`;
            ctx.fillRect(l.x, l.y, 2.4, 2.4);
          }
          ctx.fillStyle = 'rgba(236,227,212,.7)'; ctx.font = '11px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
          ctx.fillText(['DOMING', 'RIFT VALLEY', 'AXIAL VOLCANISM', 'MARINE INCURSION', 'OCEAN SPREADING'][Math.min(4, Math.floor(s * 5))], w / 2, 18);
        }
      };
    }
  });
})();
