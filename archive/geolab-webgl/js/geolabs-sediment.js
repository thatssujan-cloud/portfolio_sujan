/* ==========================================================================
   GEO LABS — MODULES 14–16 · SEDIMENTOLOGY, STRATIGRAPHY & GROUNDWATER
   14 Cross-Bedding & Sand Dune Migration (saltation particle transport)
   15 Groundwater Aquifer & Contaminant Plume (click to rain/pollute/pump)
   16 Fossilization & Stratigraphic Core Drilling (drill through the eras)
   ========================================================================== */
'use strict';
(function () {
  const R = window.GeoLabs.register;
  const grad = (ctx, x0, y0, x1, y1, a, b) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };

  /* =====================================================================
     14 · SAND DUNES & CROSS-BEDDING — wind saltation builds migrating dunes
     ===================================================================== */
  R({
    id: 'dunes', num: 14, cat: 'SEDIMENTOLOGY', catLabel: 'Sedimentology & Stratigraphy',
    title: 'Cross-Bedding & Sand Dune Migration',
    desc: 'Wind drives grains up the stoss slope in saltation bursts; they avalanche down the lee face at the angle of repose, painting inclined foresets preserved as cross-beds.',
    overlay: 'Watch the preserved stratigraphy accumulate below the migrating dune',
    controls: [
      { type: 'range', label: 'Wind speed', min: 0, max: 100, value: 60, unit: ' m/s', key: 'wind',
        format: v => (v / 10).toFixed(1), onInput: (vv, lab) => { lab.v.wind = vv / 100; } },
      { type: 'seg', label: 'Wind direction', index: 0, key: 'dir',
        options: [{ label: '→', value: 1 }, { label: '←', value: -1 }],
        onChange: (vv, lab) => { lab.v.dir = vv; } },
      { type: 'readout', label: 'Migration', key: 'mig' }
    ],
    initState: { wind: 0.6, dir: 1 },
    init(canvas, ctx, lab, P) {
      let H = null, bed = null, grains = [], off = 0, mig = 0;
      const COLS = 120;
      function surface(xn) { // two overlapping dunes + gentle sand sheet
        return Math.max(0.18,
          0.30 * Math.exp(-Math.pow((xn - 0.3) / 0.22, 2)) +
          0.26 * Math.exp(-Math.pow((xn - 0.75) / 0.2, 2)) + 0.08);
      }
      return {
        step(dt, t, w, h) {
          const v = lab.v;
          if (!bed) { bed = new Float32Array(COLS); for (let i = 0; i < COLS; i++) bed[i] = 0.1; }
          const base = h * 0.92, amp = h * 0.5;
          const heightAt = xn => base - surface(((xn + off) % 1 + 1) % 1) * amp;

          /* migration: dune field translates ∝ above-threshold wind */
          const thr = 0.15;
          const rate = Math.max(0, v.wind - thr) * 0.09 * v.dir;
          off += rate * dt; mig += Math.abs(rate * dt) * 100;
          if (lab.ro.mig) lab.ro.mig.textContent = Math.round(mig) + ' m';

          /* saltating grains */
          if (Math.random() < v.wind * 1.4 && grains.length < P.p(160)) {
            const xn = v.dir > 0 ? P.rand(-0.05, 0.2) : P.rand(0.8, 1.05);
            grains.push({ x: xn * w, y: heightAt(xn % 1) - 2, vx: v.dir * P.rand(40, 120) * v.wind, vy: P.rand(-70, -20), r: P.rand(1, 2) });
          }
          for (let i = grains.length - 1; i >= 0; i--) {
            const g = grains[i];
            g.vy += 260 * dt; g.x += g.vx * dt; g.y += g.vy * dt;
            const gx = ((g.x / w) % 1 + 1) % 1;
            if (g.y >= heightAt(gx)) {
              /* deposit into bed record on the lee side (foreset accretion) */
              const bi = Math.floor(gx * COLS);
              bed[bi] = Math.min(0.95, bed[bi] + 0.004 * (v.wind > 0.4 ? 1 : 0.3));
              grains.splice(i, 1);
            } else if (g.x < -20 || g.x > w + 20) grains.splice(i, 1);
          }

          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = grad(ctx, 0, 0, 0, h, '#1c1620', '#33201a'); ctx.fillRect(0, 0, w, h);
          /* sky heat shimmer lines */
          ctx.strokeStyle = 'rgba(224,169,95,.12)';
          for (let k = 0; k < 4; k++) {
            const yy = h * 0.12 + k * 10;
            ctx.beginPath();
            for (let x = 0; x <= w; x += 10) ctx.lineTo(x, yy + Math.sin(x * 0.03 + t * 2 + k) * 2 * v.wind);
            ctx.stroke();
          }
          /* preserved stratigraphy: horizontal grid with per-column bed thickness */
          const strataTop = h * 0.66;
          ctx.save();
          ctx.beginPath(); ctx.rect(0, strataTop, w, base - strataTop); ctx.clip();
          ctx.fillStyle = '#c98d5f'; ctx.fillRect(0, strataTop, w, base - strataTop);
          /* buried cross-beds drift opposite to migration to fake preservation */
          ctx.strokeStyle = 'rgba(122,79,54,.55)'; ctx.lineWidth = 1.4;
          for (let k = 0; k < 14; k++) {
            const yy = strataTop + 8 + k * 12;
            ctx.beginPath();
            for (let x = 0; x <= w; x += 8) {
              const ph = ((x / w * 3 + (off * 2 + k * 0.3)) % 1);
              const saw = ph < 0.7 ? ph / 0.7 : 1 - (ph - 0.7) / 0.3;
              ctx.lineTo(x, yy + saw * 7 * v.dir * 0 + (v.dir > 0 ? saw * 7 : -saw * 7));
            }
            ctx.stroke();
          }
          ctx.restore();
          /* active dune surface */
          ctx.fillStyle = '#e3c493';
          ctx.beginPath(); ctx.moveTo(0, base);
          for (let x = 0; x <= w; x += 4) ctx.lineTo(x, heightAt(((x / w) % 1 + 1) % 1));
          ctx.lineTo(w, base); ctx.closePath(); ctx.fill();
          /* stoss/lee shading */
          ctx.strokeStyle = 'rgba(122,79,54,.4)'; ctx.lineWidth = 2;
          ctx.beginPath();
          for (let x = 0; x <= w; x += 4) ctx.lineTo(x, heightAt(((x / w) % 1 + 1) % 1));
          ctx.stroke();
          /* grains */
          ctx.fillStyle = '#f2e0b6';
          grains.forEach(g => ctx.fillRect(g.x, g.y, g.r * 2, g.r * 2));
          /* wind arrow */
          ctx.strokeStyle = 'rgba(236,227,212,.5)'; ctx.lineWidth = 2;
          const ax = w * 0.1, ay = h * 0.1;
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + 40 * v.dir, ay);
          ctx.lineTo(ax + 32 * v.dir, ay - 5); ctx.moveTo(ax + 40 * v.dir, ay); ctx.lineTo(ax + 32 * v.dir, ay + 5);
          ctx.stroke();
        }
      };
    }
  });

  /* =====================================================================
     15 · AQUIFER — water table, rainfall recharge, pumping cones, plumes
     ===================================================================== */
  R({
    id: 'aquifer', num: 15, cat: 'SEDIMENTOLOGY', catLabel: 'Sedimentology & Stratigraphy',
    title: 'Groundwater Aquifer & Contaminant Plume',
    desc: 'Click the surface to add rainfall recharge or a pollutant spill. Wells draw cones of depression; contaminants advect and disperse with the groundwater flow field.',
    overlay: 'Click mode: 💧 Rain · ☠ Spill · ⛭ Well — pick below, then click the section',
    controls: [
      { type: 'seg', label: 'Click tool', index: 0, key: 'tool',
        options: [{ label: '💧 Rain', value: 'rain' }, { label: '☠ Pollutant', value: 'pollute' }, { label: '⛭ Pump well', value: 'well' }],
        onChange: (vv, lab) => { lab.v.tool = vv; } },
      { type: 'range', label: 'Hydraulic conductivity', min: 5, max: 100, value: 50, unit: ' mD', key: 'k',
        onInput: (vv, lab) => { lab.v.k = vv / 100; } },
      { type: 'readout', label: 'Contamination', key: 'cont' }
    ],
    initState: { tool: 'rain', k: 0.5 },
    init(canvas, ctx, lab, P) {
      let wt = 0.34, wells = [], plumes = [], drops = [], pulses = [];
      lab.canvas.addEventListener('pointerdown', e => {
        const r = lab.canvas.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        const tool = lab.v.tool;
        if (tool === 'rain') { drops.push({ x, n: 14 }); pulses.push({ x, y: wt, a: 0.6, r: 2 }); }
        if (tool === 'pollute') { for (let i = 0; i < P.p(50); i++) plumes.push({ x: x + P.rand(-0.02, 0.02), y: Math.max(y, wt + 0.02), c: 1, vx: 0, vy: 0 }); }
        if (tool === 'well' && wells.length < 5) wells.push({ x, depth: Math.min(0.9, y + 0.15) });
      });
      return {
        step(dt, t, w, h) {
          const v = lab.v;
          /* rainfall pulses raise the water table gently */
          drops = drops.filter(d => { d.n -= dt * 30; if (d.n > 0) wt = Math.max(0.2, wt - dt * 0.02); return d.n > -1; });
          wt = Math.min(0.42, wt + dt * 0.004); // slow natural drain

          /* well drawdown profile: superposed cones of depression */
          const tableAt = x => {
            let y = wt;
            wells.forEach(wl => { const d = Math.abs(x - wl.x); y += Math.min(0.12, 0.028 / (d + 0.05)) - 0.028 / (d + 0.35); });
            return Math.min(0.9, y);
          };

          /* contaminant advection: flow follows gradient of depressed table (left→right bias) */
          let inGround = 0;
          for (let i = plumes.length - 1; i >= 0; i--) {
            const p = plumes[i];
            const g = tableAt(p.x + 0.02) - tableAt(p.x - 0.02);
            p.vx = P.lerp(p.vx, -g * v.k * 6 + v.k * 0.012, dt * 2);
            p.vy = P.lerp(p.vy, (tableAt(p.x) - p.y) * 0.02 + 0.004, dt * 2);
            p.x += p.vx * dt + P.rand(-1, 1) * dt * 0.004 * v.k;  // mechanical dispersion
            p.y += p.vy * dt;
            p.c -= dt * 0.02;                                       // attenuation
            if (p.y > 0.94) p.y = 0.94;
            if (p.c <= 0 || p.x < -0.05 || p.x > 1.05) { plumes.splice(i, 1); continue; }
            inGround++;
          }
          if (plumes.length > P.p(320)) plumes.splice(0, plumes.length - P.p(320));

          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = grad(ctx, 0, 0, 0, h, '#131a22', '#1d2430'); ctx.fillRect(0, 0, w, h);
          /* vadose zone soil */
          ctx.fillStyle = '#54402e'; ctx.fillRect(0, 0, w, h);
          /* ground surface line */
          ctx.strokeStyle = '#6d5a44'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(0, h * 0.12); ctx.lineTo(w, h * 0.12); ctx.stroke();
          /* saturated zone under the water table */
          ctx.fillStyle = 'rgba(64,125,155,.55)';
          ctx.beginPath(); ctx.moveTo(0, tableAt(0) * h);
          for (let x = 0; x <= w; x += 6) ctx.lineTo(x, tableAt(x / w) * h);
          ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
          /* water table dashed line */
          ctx.setLineDash([6, 5]); ctx.strokeStyle = '#6aaee6'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(0, tableAt(0) * h);
          for (let x = 0; x <= w; x += 6) ctx.lineTo(x, tableAt(x / w) * h);
          ctx.stroke(); ctx.setLineDash([]);
          /* impermeable basement */
          ctx.fillStyle = '#2b2320'; ctx.fillRect(0, h * 0.94, w, h * 0.06);

          /* flow arrows */
          ctx.strokeStyle = 'rgba(150,200,230,.35)'; ctx.lineWidth = 1.4;
          for (let fx = 0.06; fx < 0.96; fx += 0.12) {
            const fy = Math.min(0.9, tableAt(fx) + 0.1);
            const g = tableAt(fx + 0.02) - tableAt(fx - 0.02);
            const ang = Math.atan2(g, -0.02) + Math.PI;
            const len = 10 + v.k * 14;
            const ox = Math.cos(ang) * len, oy = Math.sin(ang) * len;
            const wob = Math.sin(t * 2 + fx * 20) * 2;
            ctx.beginPath(); ctx.moveTo(fx * w - ox / 2 + wob, fy * h); ctx.lineTo(fx * w + ox / 2 + wob, fy * h + oy * 0.4); ctx.stroke();
          }
          /* wells */
          wells.forEach(wl => {
            ctx.fillStyle = '#8a8f98'; ctx.fillRect(wl.x * w - 3, h * 0.06, 6, (wl.depth - 0.06) * h);
            ctx.fillStyle = '#3c424b'; ctx.fillRect(wl.x * w - 8, h * 0.04, 16, 8);
            /* pump pulse */
            const pu = (t * 2 + wl.x * 7) % 1;
            ctx.strokeStyle = `rgba(106,174,230,${0.5 - pu * 0.4})`;
            ctx.beginPath(); ctx.arc(wl.x * w, tableAt(wl.x) * h, 6 + pu * 26, 0, Math.PI * 2); ctx.stroke();
          });
          /* rain drops */
          drops.forEach(d => {
            ctx.strokeStyle = 'rgba(120,180,220,.8)'; ctx.lineWidth = 1.6;
            for (let i = 0; i < 6; i++) {
              const rx = (d.x + P.rand(-0.03, 0.03)) * w, ry = h * 0.12 + ((t * 300 + i * 40) % (d.n * 4));
              ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 1, ry + 7); ctx.stroke();
            }
          });
          /* plume particles */
          plumes.forEach(p => {
            ctx.fillStyle = `rgba(140,60,160,${p.c * 0.55})`;
            ctx.beginPath(); ctx.arc(p.x * w, p.y * h, 2.6, 0, Math.PI * 2); ctx.fill();
          });
          ctx.fillStyle = 'rgba(236,227,212,.7)'; ctx.font = '11px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
          ctx.fillText('UNCONFINED AQUIFER · K = ' + Math.round(v.k * 90) + ' m/day', 12, 18);
          if (lab.ro.cont) lab.ro.cont.textContent = Math.min(100, Math.round(inGround / P.p(320) * 130)) + '%';
        }
      };
    }
  });

  /* =====================================================================
     16 · CORE DRILLING — drill through stratigraphy, reveal index fossils
     ===================================================================== */
  R({
    id: 'fossilcore', num: 16, cat: 'SEDIMENTOLOGY', catLabel: 'Sedimentology & Stratigraphy',
    title: 'Fossilization & Stratigraphic Excavation',
    desc: 'Drive the core barrel down through the layers of deep time. Each formation yields its index fossil — trilobites, ammonites, then dinosaurs — dating the strata like clockwork.',
    overlay: 'Hold “Drill” to advance the bit · drag back up to retrieve the core',
    controls: [
      { type: 'toggle', label: '🔩 Drill', key: 'drill', value: false, onChange: (on, lab) => { lab.v.drilling = on; } },
      { type: 'readout', label: 'Depth', key: 'depth' },
      { type: 'readout', label: 'Period', key: 'period' }
    ],
    initState: { drilling: false },
    init(canvas, ctx, lab, P) {
      const BEDS = [
        { name: 'Holocene alluvium', col: '#c98d5f', from: 0, to: 0.16, fossil: null, period: 'Quaternary' },
        { name: 'Siwalik molasse', col: '#b6552e', from: 0.16, to: 0.34, fossil: 'mammal', period: 'Neogene' },
        { name: 'Mahakala limestones', col: '#d3bd9c', from: 0.34, to: 0.52, fossil: 'ammonite', period: 'Mesozoic · Cretaceous' },
        { name: 'Tethyan shales', col: '#41697a', from: 0.52, to: 0.72, fossil: 'trilobite', period: 'Paleozoic · Cambrian' },
        { name: 'Himalayan gneiss basement', col: '#5b5148', from: 0.72, to: 1, fossil: null, period: 'Precambrian' }
      ];
      let depth = 0.02, chips = [], found = {}, shake = 0;
      function drawFossil(ctx2, kind, x, y, s, alpha) {
        ctx2.save(); ctx2.translate(x, y); ctx2.globalAlpha = alpha;
        ctx2.strokeStyle = '#f2c66d'; ctx2.lineWidth = 1.6; ctx2.fillStyle = 'rgba(242,198,109,.25)';
        if (kind === 'trilobite') {
          ctx2.beginPath(); ctx2.ellipse(0, 0, s * 0.6, s, 0, 0, Math.PI * 2); ctx2.fill(); ctx2.stroke();
          for (let i = -2; i <= 2; i++) { ctx2.beginPath(); ctx2.moveTo(-s * 0.55, i * s * 0.28); ctx2.lineTo(s * 0.55, i * s * 0.28); ctx2.stroke(); }
          ctx2.beginPath(); ctx2.arc(0, -s * 0.7, s * 0.3, 0, Math.PI * 2); ctx2.stroke();
        } else if (kind === 'ammonite') {
          for (let k = 0; k < 3; k++) { ctx2.beginPath(); ctx2.arc(0, 0, s * (0.9 - k * 0.28), 0.4, Math.PI * 1.8); ctx2.stroke(); }
          for (let a = 0; a < 8; a++) { const an = a / 8 * Math.PI * 2; ctx2.beginPath(); ctx2.moveTo(Math.cos(an) * s * 0.4, Math.sin(an) * s * 0.4); ctx2.lineTo(Math.cos(an) * s * 0.9, Math.sin(an) * s * 0.9); ctx2.stroke(); }
        } else if (kind === 'mammal') { /* tooth */
          ctx2.beginPath(); ctx2.moveTo(-s * 0.5, -s * 0.6); ctx2.quadraticCurveTo(0, s, s * 0.5, -s * 0.6); ctx2.closePath(); ctx2.fill(); ctx2.stroke();
        } else if (kind === 'bone') {
          ctx2.beginPath(); ctx2.moveTo(-s, 0); ctx2.lineTo(s, 0); ctx2.stroke();
          [-1, 1].forEach(d => { ctx2.beginPath(); ctx2.arc(d * s, -s * 0.25, s * 0.28, 0, Math.PI * 2); ctx2.stroke(); ctx2.beginPath(); ctx2.arc(d * s, s * 0.25, s * 0.28, 0, Math.PI * 2); ctx2.stroke(); });
        }
        ctx2.restore();
      }
      return {
        step(dt, t, w, h) {
          const v = lab.v;
          const top = h * 0.14, span = h * 0.82;
          if (v.drilling) {
            depth = Math.min(1, depth + dt * 0.09);
            shake = Math.sin(t * 60) * 1.5;
            if (Math.random() < 0.6 && chips.length < P.p(90)) {
              const bed = BEDS.find(b => depth >= b.from && depth < b.to) || BEDS[4];
              chips.push({ x: w * 0.5 + P.rand(-14, 14), y: top + depth * span, vx: P.rand(-40, 40), vy: P.rand(-90, -30), col: bed.col, life: 1 });
            }
          } else {
            depth = Math.max(0.02, depth - dt * 0.12); // retrieve core
            shake *= 0.8;
          }
          chips.forEach(c => { c.vy += 240 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.life -= dt * 1.2; });
          chips = chips.filter(c => c.life > 0 && c.y < h);

          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = grad(ctx, 0, 0, 0, h, '#141018', '#1e1712'); ctx.fillRect(0, 0, w, h);
          /* strata columns left & right of the borehole */
          BEDS.forEach(b => {
            ctx.fillStyle = b.col;
            const y0 = top + b.from * span, hh = (b.to - b.from) * span;
            ctx.fillRect(0, y0, w * 0.38, hh); ctx.fillRect(w * 0.62, y0, w * 0.38, hh);
            ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.strokeRect(0, y0, w * 0.38, hh); ctx.strokeRect(w * 0.62, y0, w * 0.38, hh);
            /* sediment texture dashes */
            ctx.fillStyle = 'rgba(0,0,0,.15)';
            for (let i = 0; i < hh / 6; i++) {
              ctx.fillRect(P.rand(4, w * 0.36), y0 + i * 6, 8, 1.4);
              ctx.fillRect(P.rand(w * 0.64, w * 0.96), y0 + i * 6, 8, 1.4);
            }
            /* embedded fossils revealed once drilled past */
            if (b.fossil) {
              const fy = y0 + hh * 0.5;
              const revealed = depth * span + top > fy;
              if (revealed && !found[b.name]) { found[b.name] = true; lab.seismo(1.1); }
              drawFossil(ctx, b.fossil, w * 0.2, fy, 14, revealed ? 1 : 0.12);
              drawFossil(ctx, b.fossil === 'bone' ? 'tooth' : b.fossil, w * 0.8, fy * 0.92 + top * 0.08, 11, revealed ? 0.8 : 0.1);
              if (revealed) {
                ctx.fillStyle = '#f2c66d'; ctx.font = '600 11px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
                ctx.fillText('★ INDEX FOSSIL: ' + b.fossil.toUpperCase(), w * 0.31, fy + 4);
              }
            }
            ctx.fillStyle = 'rgba(20,14,8,.85)'; ctx.font = '10px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
            ctx.fillText(b.period, 6, y0 + 12);
          });
          /* borehole */
          ctx.fillStyle = '#0d0a08';
          ctx.fillRect(w * 0.38, top, w * 0.24, Math.max(0, depth * span));
          /* core sample inside hole */
          const cb = BEDS.find(b => depth >= b.from && depth < b.to) || BEDS[4];
          ctx.fillStyle = cb.col;
          ctx.fillRect(w * 0.44, top, w * 0.12, Math.max(0, depth * span - 8));
          /* drill rod + bit */
          ctx.fillStyle = '#9aa0ab';
          ctx.fillRect(w * 0.485 + shake, 0, 6, top + depth * span);
          ctx.fillStyle = '#cfd4db';
          ctx.beginPath();
          ctx.moveTo(w * 0.47 + shake, top + depth * span);
          ctx.lineTo(w * 0.53 + shake, top + depth * span);
          ctx.lineTo(w * 0.5 + shake, top + depth * span + 12);
          ctx.closePath(); ctx.fill();
          if (v.drilling) {
            ctx.strokeStyle = 'rgba(242,198,109,.6)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(w * 0.5, top + depth * span + 6, 10 + Math.sin(t * 30) * 3, 0, Math.PI * 2); ctx.stroke();
          }
          chips.forEach(c => { ctx.fillStyle = c.col; ctx.globalAlpha = c.life; ctx.fillRect(c.x, c.y, 3, 3); ctx.globalAlpha = 1; });
          if (lab.ro.depth) lab.ro.depth.textContent = Math.round(depth * 120) + ' m';
          if (lab.ro.period) lab.ro.period.textContent = cb.period;
        }
      };
    }
  });
})();
