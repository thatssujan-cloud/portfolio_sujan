/* ==========================================================================
   GEO LABS — MODULES 17–19 · PETROLOGY & MINERALOGY
   17 Petrographic Thin-Section Viewer (XPL interference colours, stage rotation)
   18 Interactive 3D Crystal Lattice & Cleavage Planes (halite / calcite / mica)
   19 Rock Cycle Transformation Matrix (heat · pressure · weathering agent pad)
   ========================================================================== */
'use strict';
(function () {
  const R = window.GeoLabs.register;
  const grad = (ctx, x0, y0, x1, y1, a, b) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };

  /* =====================================================================
     17 · THIN SECTION — cross-polarised light microscope view
     ===================================================================== */
  R({
    id: 'thinsection', num: 17, cat: 'PETROLOGY', catLabel: 'Petrology & Mineralogy',
    title: 'Petrographic Thin-Section Viewer',
    desc: 'A 30 µm slice of rock under crossed polars. Rotate the stage: each grain’s birefringence flashes its Michel-Lévy interference colour — quartz grey, feldspar white, biotite chocolate.',
    overlay: 'Drag inside the field of view to rotate the microscope stage',
    controls: [
      { type: 'seg', label: 'Light', index: 1, key: 'pol',
        options: [{ label: 'PPL', value: 'ppl' }, { label: 'XPL', value: 'xpl' }],
        onChange: (vv, lab) => { lab.v.pol = vv; } },
      { type: 'range', label: 'Stage rotation', min: 0, max: 360, value: 0, unit: '°', key: 'rot', fill: true,
        onInput: (vv, lab) => { lab.v.rot = vv; } },
      { type: 'readout', label: 'Extinction', key: 'ext' }
    ],
    initState: { pol: 'xpl', rot: 0 },
    init(canvas, ctx, lab, P) {
      /* grain fabric: generate once in normalized coords */
      const grains = [];
      let seed = 7;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const KINDS = [
        { name: 'quartz', dR: 0.009, base: '#cfd8dc', ext: 4 },
        { name: 'plagioclase', dR: 0.008, base: '#e8eaf0', ext: 3, twinned: true },
        { name: 'K-feldspar', dR: 0.012, base: '#f0ece2', ext: 5, tartan: true },
        { name: 'biotite', dR: 0.05, base: '#6d4c2f', ext: 14, pleo: true },
        { name: 'hornblende', dR: 0.018, base: '#4a5d3a', ext: 8 }
      ];
      for (let i = 0; i < 26; i++) {
        const k = KINDS[Math.floor(rnd() * KINDS.length)];
        grains.push({
          x: rnd(), y: rnd(), r: 0.05 + rnd() * 0.09, ang: rnd() * Math.PI,
          elong: 0.7 + rnd() * 0.9, kind: k, phase: rnd() * Math.PI * 2
        });
      }
      /* Michel-Lévy-ish palette by retardance band */
      function intColor(dR, theta) {
        const ex = Math.pow(Math.sin(theta * 2), 2);    // extinction every 90°
        const delta = dR * 540 * ex;                    // nm retardation
        if (delta < 180) return `rgba(${20 + delta},${20 + delta * 0.8},${24 + delta * 0.6},${0.15 + ex})`;
        if (delta < 400) return `rgba(${120 + delta * 0.3},${90 + delta * 0.2},${40},${0.5 + ex * 0.4})`;   // I yellow-white
        if (delta < 700) return `rgba(${200},${80 + (delta - 400) * 0.3},${60},${0.6 + ex * 0.3})`;         // II orange-red
        if (delta < 1000) return `rgba(${120},${60},${180 - (delta - 700) * 0.2},${0.7})`;                  // III violet-blue
        return `rgba(${90},${40},${30},0.9)`;                                                            // high-order brown
      }
      let dragging = false, lastX = 0;
      lab.canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; });
      window.addEventListener('pointerup', () => dragging = false);
      lab.canvas.addEventListener('pointermove', e => {
        if (!dragging) return;
        lab.v.rot = ((lab.v.rot + (e.clientX - lastX) * 0.8) % 360 + 360) % 360;
        lastX = e.clientX;
        if (lab.ui.rot) lab.ui.rot.value = lab.v.rot;
      });
      return {
        step(dt, t, w, h) {
          const v = lab.v;
          const rad = Math.min(w, h) * 0.46, cx = w / 2, cy = h / 2;
          const th = v.rot * Math.PI / 180;
          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = '#0b0a0d'; ctx.fillRect(0, 0, w, h);
          ctx.save();
          ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.clip();
          /* dark field background */
          ctx.fillStyle = v.pol === 'xpl' ? '#050505' : '#d9d2c2';
          ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
          grains.forEach(g => {
            const gx = cx + (g.x - 0.5) * rad * 1.9, gy = cy + (g.y - 0.5) * rad * 1.9;
            const theta = th + g.ang;
            ctx.save(); ctx.translate(gx, gy); ctx.rotate(g.ang);
            if (v.pol === 'ppl') {
              ctx.fillStyle = g.kind.base; ctx.globalAlpha = g.kind.pleo ? 0.85 : 0.7;
            } else {
              ctx.fillStyle = intColor(g.kind.dR, theta); ctx.globalAlpha = 1;
            }
            ctx.beginPath();
            ctx.ellipse(0, 0, g.r * rad, g.r * rad * g.elong, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1; ctx.stroke();
            if (g.kind.twinned && v.pol === 'ppl') { /* albite twin lamellae */
              ctx.strokeStyle = 'rgba(90,100,120,.6)';
              for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 6 - 10, -g.r * rad); ctx.lineTo(k * 6 + 10, g.r * rad); ctx.stroke(); }
            }
            if (g.kind.tartan && v.pol === 'ppl') {
              ctx.strokeStyle = 'rgba(120,110,90,.5)';
              for (let k = -2; k <= 2; k++) {
                ctx.beginPath(); ctx.moveTo(-g.r * rad, k * 7); ctx.lineTo(g.r * rad, k * 7); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(k * 7, -g.r * rad * g.elong); ctx.lineTo(k * 7, g.r * rad * g.elong); ctx.stroke();
              }
            }
            if (g.kind.pleo && v.pol === 'ppl') { /* biotite pleochroic bands */
              ctx.strokeStyle = 'rgba(60,30,10,.6)';
              for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(-g.r * rad, k * 4); ctx.lineTo(g.r * rad, k * 4); ctx.stroke(); }
            }
            ctx.restore();
          });
          /* relict olivine rim glow for texture */
          ctx.restore();
          /* microscope reticle + polarizer direction indicators */
          ctx.strokeStyle = 'rgba(236,227,212,.35)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx - rad, cy); ctx.lineTo(cx + rad, cy); ctx.moveTo(cx, cy - rad); ctx.lineTo(cx, cy + rad); ctx.stroke();
          /* rotating crosshair arms show stage orientation */
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(th);
          ctx.strokeStyle = '#e0a95f'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-rad - 8, 0); ctx.lineTo(rad + 8, 0); ctx.stroke();
          ctx.restore();
          /* insertion flag */
          ctx.fillStyle = v.pol === 'xpl' ? '#e0a95f' : '#5b5148';
          ctx.font = '600 11px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
          ctx.fillText(v.pol === 'xpl' ? 'ANALYZER ⊕ INSERTED' : 'ANALYZER OUT (PPL)', 12, 18);
          ctx.textAlign = 'right';
          ctx.fillText('SCALE BAR ─ 0.5 mm', w - 12, 18);
          const nExt = grains.filter(g => Math.abs(Math.sin((th + g.ang) * 2)) < 0.12).length;
          if (lab.ro.ext) lab.ro.ext.textContent = nExt + ' grains';
        }
      };
    }
  });

  /* =====================================================================
     18 · CRYSTAL LATTICE & CLEAVAGE — 3D projection with strike interaction
     ===================================================================== */
  R({
    id: 'crystal', num: 18, cat: 'PETROLOGY', catLabel: 'Petrology & Mineralogy',
    title: 'Interactive 3D Crystal Lattice & Cleavage',
    desc: 'Inspect the atomic architecture of halite, calcite or muscovite. Drag to rotate along the crystallographic axes, then strike the model to fracture it along its true cleavage planes.',
    overlay: 'Drag to rotate · click to strike cleavage fractures',
    controls: [
      { type: 'seg', label: 'Mineral', index: 0, key: 'min',
        options: [{ label: 'Halite', value: 'halite' }, { label: 'Calcite', value: 'calcite' }, { label: 'Muscovite', value: 'mica' }],
        onChange: (vv, lab) => { lab.v.mineral = vv; lab.v.frags = null; } },
      { type: 'toggle', label: 'Show bonds', key: 'bonds', value: true, onChange: (on, lab) => { lab.v.bonds = on; } },
      { type: 'readout', label: 'Cleavage', key: 'clv' }
    ],
    initState: { mineral: 'halite', bonds: true, rx: 0.5, ry: 0.7 },
    init(canvas, ctx, lab, P) {
      const SPEC = {
        halite: { clv: '{100} ×3 at 90°', pts: () => { const a = []; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) { a.push({ p: [i, j, k], t: (i + j + k) % 2 === 0 ? 0 : 1 }); } return a; }, planes: [[[1, 0, 0]], [[0, 1, 0]], [[0, 0, 1]]] },
        calcite: { clv: '{10̄14} ×3 at 74°/106°', pts: () => { const a = []; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) a.push({ p: [i + 0.3 * k, j + 0.3 * k, k * 0.8], t: (i + j) % 2 === 0 ? 0 : 1 }); return a; }, planes: [[[0.8, 0.4, -0.5]], [[-0.8, 0.4, -0.5]], [[0, -0.9, -0.4]]] },
        mica: { clv: '{001} ×1 perfect basal', pts: () => { const a = []; for (let s = -1; s <= 1; s++) for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) a.push({ p: [i * 1.1 + s * 0.1, j * 1.1 + s * 0.1, s * 0.35], t: s === 0 ? 2 : (i + j) % 2 === 0 ? 0 : 1 }); return a; }, planes: [[[0, 0, 1]]] }
      };
      const COLS = ['#6aaee6', '#e0a95f', '#d3bd9c'];
      let dragging = false, last = null, frags = null, spin = 0;
      const getRot = () => ({ rx: lab.v.rx, ry: lab.v.ry });
      lab.canvas.addEventListener('pointerdown', e => { dragging = true; last = { x: e.clientX, y: e.clientY }; });
      window.addEventListener('pointerup', () => dragging = false);
      lab.canvas.addEventListener('pointermove', e => {
        if (!dragging || !last) return;
        lab.v.ry += (e.clientX - last.x) * 0.008;
        lab.v.rx += (e.clientY - last.y) * 0.008;
        last = { x: e.clientX, y: e.clientY };
      });
      lab.canvas.addEventListener('click', e => {
        if (Math.abs(e.movementX || 0) > 4) return; // ignore drag-end clicks
        const spec = SPEC[lab.v.mineral];
        frags = spec.planes.map(pl => ({ n: pl[0], off: P.rand(-0.3, 0.3), vx: P.rand(-1, 1) * 30, vy: P.rand(-1, 1) * 30, vz: P.rand(10, 40), age: 0 }));
        lab.seismo(0.8);
      });
      function proj(p, rx, ry, scale, cx, cy) {
        let [x, y, z] = p;
        let y1 = y * Math.cos(rx) - z * Math.sin(rx), z1 = y * Math.sin(rx) + z * Math.cos(rx);
        let x2 = x * Math.cos(ry) + z1 * Math.sin(ry), z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
        const persp = 4 / (4 + z2);
        return { x: cx + x2 * scale * persp, y: cy + y1 * scale * persp, z: z2, s: persp };
      }
      return {
        step(dt, t, w, h) {
          const v = lab.v, spec = SPEC[v.mineral] || SPEC.halite;
          if (!dragging) v.ry += dt * 0.25;
          spin += dt;
          const cx = w / 2, cy = h / 2, sc = Math.min(w, h) * 0.16;
          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = grad(ctx, 0, 0, 0, h, '#101318', '#181318'); ctx.fillRect(0, 0, w, h);
          /* crystallographic axis tripod */
          const axes = [['a', [2.2, 0, 0], '#e0563a'], ['b', [0, 2.2, 0], '#7fae6a'], ['c', [0, 0, 2.2], '#6aaee6']];
          axes.forEach(([nm, vec, col]) => {
            const o = proj([0, 0, 0], v.rx, v.ry, sc, cx, cy), e2 = proj(vec, v.rx, v.ry, sc, cx, cy);
            ctx.strokeStyle = col; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(e2.x, e2.y); ctx.stroke();
            ctx.fillStyle = col; ctx.font = 'italic 600 13px Fraunces, serif'; ctx.textAlign = 'center';
            ctx.fillText(nm, e2.x, e2.y - 6);
          });
          /* lattice atoms sorted back-to-front */
          const pts = spec.pts().map(q => ({ ...q, pr: proj(q.p, v.rx, v.ry, sc, cx, cy) })).sort((a, b) => b.pr.z - a.pr.z);
          if (v.bonds) {
            ctx.strokeStyle = 'rgba(236,227,212,.18)'; ctx.lineWidth = 1;
            for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
              const dx = pts[i].p[0] - pts[j].p[0], dy = pts[i].p[1] - pts[j].p[1], dz = pts[i].p[2] - pts[j].p[2];
              if (dx * dx + dy * dy + dz * dz < 1.35) { ctx.beginPath(); ctx.moveTo(pts[i].pr.x, pts[i].pr.y); ctx.lineTo(pts[j].pr.x, pts[j].pr.y); ctx.stroke(); }
            }
          }
          pts.forEach(q => {
            ctx.fillStyle = COLS[q.t];
            ctx.globalAlpha = 0.45 + q.pr.s * 0.4;
            ctx.beginPath(); ctx.arc(q.pr.x, q.pr.y, 4.4 * q.pr.s, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
          });
          /* cleavage fragments drifting apart after a strike */
          if (frags) {
            frags.forEach(f => {
              f.age += dt;
              const shift = f.vz * f.age * 0.4;
              const n = f.n, dot = (n[0] * shift * 0.01);
              ctx.strokeStyle = `rgba(242,198,109,${Math.max(0, 0.9 - f.age * 0.25)})`;
              ctx.lineWidth = 1.6;
              /* draw the cleavage plane as a parallelogram through the cell */
              const u = [n[1], -n[0], 0], wv = [0, n[2], -n[1]];
              const cOr = proj([0, 0, 0], v.rx, v.ry, sc, cx, cy);
              const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([uu, ww]) => {
                const px = n[0] * shift * 0.02 + u[0] * uu + wv[0] * ww;
                const py = n[1] * shift * 0.02 + u[1] * uu + wv[1] * ww;
                const pz = n[2] * shift * 0.02 + u[2] * uu + wv[2] * ww;
                return proj([px, py, pz], v.rx, v.ry, sc, cx, cy);
              });
              ctx.beginPath();
              corners.forEach((c, i) => i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y));
              ctx.closePath(); ctx.stroke();
              ctx.fillStyle = `rgba(242,198,109,${Math.max(0, 0.12 - f.age * 0.03)})`; ctx.fill();
            });
            if (frags[0].age > 4) frags = null;
          }
          ctx.fillStyle = 'rgba(236,227,212,.7)'; ctx.font = '11px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
          ctx.fillText(lab.v.mineral.toUpperCase() + ' — ISOMETRIC/RHOMB/BASAL SYSTEM', 12, 18);
          if (lab.ro.clv) lab.ro.clv.textContent = spec.clv;
        }
      };
    }
  });

  /* =====================================================================
     19 · ROCK CYCLE TRANSFORMATION MATRIX — agent pad drives node graph
     ===================================================================== */
  R({
    id: 'rockcycle', num: 19, cat: 'PETROLOGY', catLabel: 'Petrology & Mineralogy',
    title: 'Rock Cycle Transformation Matrix',
    desc: 'Set the agents — heat, pressure and weathering — and watch matter obey them: igneous melts, sediment lithifies, carbonate and silicate recrystallise into metamorphic fabrics.',
    overlay: 'Particles migrate along active transformation paths in real time',
    controls: [
      { type: 'range', label: 'Heat', min: 0, max: 100, value: 40, unit: '%', key: 'heat', onInput: (vv, lab) => { lab.v.heat = vv / 100; } },
      { type: 'range', label: 'Pressure', min: 0, max: 100, value: 35, unit: '%', key: 'pres', onInput: (vv, lab) => { lab.v.pres = vv / 100; } },
      { type: 'range', label: 'Weathering', min: 0, max: 100, value: 30, unit: '%', key: 'weath', onInput: (vv, lab) => { lab.v.weath = vv / 100; } }
    ],
    initState: { heat: 0.4, pres: 0.35, weath: 0.3 },
    init(canvas, ctx, lab, P) {
      const NODES = {
        MAGMA: { x: 0.5, y: 0.14, col: '#ff8c3a' },
        IGNEOUS: { x: 0.16, y: 0.46, col: '#b6552e' },
        SEDIMENT: { x: 0.84, y: 0.46, col: '#d3bd9c' },
        SED_ROCK: { x: 0.72, y: 0.8, col: '#c98d5f' },
        METAMORPH: { x: 0.28, y: 0.8, col: '#7b8f9a' }
      };
      const EDGES = [
        { from: 'MAGMA', to: 'IGNEOUS', agent: 'cool', gain: 0.4, label: 'cooling & crystallisation' },
        { from: 'IGNEOUS', to: 'SEDIMENT', agent: 'weath', label: 'weathering & erosion' },
        { from: 'SED_ROCK', to: 'SEDIMENT', agent: 'weath', label: 'recycling' },
        { from: 'SEDIMENT', to: 'SED_ROCK', agent: 'lith', gain: 0.35, label: 'lithification' },
        { from: 'IGNEOUS', to: 'METAMORPH', agent: 'pres', label: 'contact metamorphism' },
        { from: 'SED_ROCK', to: 'METAMORPH', agent: 'heat', label: 'regional metamorphism' },
        { from: 'METAMORPH', to: 'MAGMA', agent: 'heat', thr: 0.6, label: 'anatexis / melting' },
        { from: 'SED_ROCK', to: 'MAGMA', agent: 'heat', thr: 0.75, label: 'subduction melting' }
      ];
      let parts = {};
      EDGES.forEach((e, i) => parts[i] = []);
      function strength(e, v) {
        if (e.agent === 'heat') return v.heat;
        if (e.agent === 'pres') return v.pres;
        if (e.agent === 'weath') return v.weath;
        if (e.agent === 'cool') return 1 - v.heat;
        if (e.agent === 'lith') return 1 - v.weath * 0.5;
        return 0;
      }
      return {
        step(dt, t, w, h) {
          const v = lab.v;
          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = grad(ctx, 0, 0, 0, h, '#121016', '#1a1410'); ctx.fillRect(0, 0, w, h);
          const pos = n => ({ x: NODES[n].x * w, y: NODES[n].y * h });

          /* edges + flowing particles ∝ agent strength */
          EDGES.forEach((e, i) => {
            const A = pos(e.from), B = pos(e.to);
            const s = strength(e, v);
            const active = s > (e.thr || 0.12);
            ctx.strokeStyle = active ? `rgba(224,169,95,${0.15 + s * 0.5})` : 'rgba(236,227,212,.08)';
            ctx.lineWidth = active ? 1 + s * 2.4 : 1;
            ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
            if (active) {
              const want = Math.round(s * P.p(14));
              while (parts[i].length < want) parts[i].push({ u: Math.random() });
              if (parts[i].length > want) parts[i].length = want;
              parts[i].forEach(pt => {
                pt.u += dt * (0.15 + s * 0.4); if (pt.u > 1) pt.u -= 1;
                const px = A.x + (B.x - A.x) * pt.u, py = A.y + (B.y - A.y) * pt.u;
                ctx.fillStyle = NODES[e.from].col;
                ctx.beginPath(); ctx.arc(px, py, 2.6, 0, Math.PI * 2); ctx.fill();
              });
              /* label near midpoint */
              ctx.fillStyle = `rgba(236,227,212,${0.25 + s * 0.4})`;
              ctx.font = '9px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
              ctx.fillText(e.label, (A.x + B.x) / 2, (A.y + B.y) / 2 - 5);
            }
          });

          /* nodes pulse when their state is threatened/produced */
          Object.entries(NODES).forEach(([name, nd]) => {
            const { x, y } = pos(name);
            let pulse = 0;
            if (name === 'MAGMA') pulse = Math.max(v.heat - 0.5, 0) * 2;
            if (name === 'METAMORPH') pulse = v.pres * 0.7 + v.heat * 0.4;
            if (name === 'SED_ROCK') pulse = (1 - v.heat) * v.weath;
            if (name === 'IGNEOUS') pulse = (1 - v.heat) * 0.5;
            const rr = 16 + Math.sin(t * 3 + x) * 1.5 + pulse * 8;
            const gg = ctx.createRadialGradient(x, y, 2, x, y, rr + 14);
            gg.addColorStop(0, nd.col); gg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, rr + 14, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#0e0c10'; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = nd.col; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#ece3d4'; ctx.font = '600 10px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
            ctx.fillText(name.replace('_', ' '), x, y + rr + 14);
          });

          /* status line */
          const fate = v.heat > 0.7 ? 'PARTIAL MELTING → MAGMA' :
                       v.pres > 0.7 ? 'HIGH-P METAMORPHISM (ECLOGITE FACIES)' :
                       v.weath > 0.7 ? 'INTENSE WEATHERING → SOIL & SAND' : 'STEADY-STATE CYCLING';
          ctx.fillStyle = 'rgba(224,169,95,.85)'; ctx.font = '600 11px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
          ctx.fillText(fate, 12, h - 12);
        }
      };
    }
  });
})();
