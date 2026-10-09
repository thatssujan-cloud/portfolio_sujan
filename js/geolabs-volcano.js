/* ==========================================================================
   GEO LABS — MODULES 6–9 · VOLCANOLOGY & IGNEOUS PROCESSES
   06 Dynamic Volcanic Eruption & Pyroclastic Cloud (particle system)
   07 Mid-Ocean Ridge Hydrothermal Vent / Black Smoker
   08 Magma Chamber Convection & Fractional Crystallization
   09 Caldera Collapse & Supervolcano (subsidence → crater lake)
   ========================================================================== */
'use strict';
(function () {
  const R = window.GeoLabs.register;
  const grad = (ctx, x0, y0, x1, y1, a, b) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };

  /* =====================================================================
     06 · VOLCANIC ERUPTION — pressure, viscosity, ash plume, lava style
     ===================================================================== */
  R({
    id: 'eruption', num: 6, cat: 'VOLCANOLOGY', catLabel: 'Volcanology & Igneous Processes',
    title: 'Dynamic Volcanic Eruption & Pyroclastic Cloud',
    desc: 'Pressurise the magma chamber and pick a melt composition. Basalt feeds fluid fountaining lava; rhyolite locks gases in until the column goes explosive.',
    overlay: 'Click the cone to vent a pulse of pressure',
    controls: [
      { type: 'range', label: 'Chamber pressure', min: 0, max: 100, value: 45, unit: '%', key: 'press',
        onInput: (v, lab) => { lab.v.press = v; } },
      { type: 'seg', label: 'Melt viscosity', index: 0, key: 'visc',
        options: [{ label: 'Basaltic', value: 'basalt' }, { label: 'Andesitic', value: 'andesite' }, { label: 'Rhyolitic', value: 'rhyolite' }],
        onChange: (val, lab) => { lab.v.visc = val; } },
      { type: 'readout', label: 'VEI estimate', key: 'vei' }
    ],
    initState: { press: 45, visc: 'basalt' },
    init(canvas, ctx, lab, P) {
      let parts = [];
      const VISC = { basalt: { e: 0.25, col: ['#ff8c3a', '#ffb347'], gas: 0.35, vei: [1, 2] },
                     andesite: { e: 0.55, col: ['#d97e4a', '#8a5a3b'], gas: 0.65, vei: [3, 4] },
                     rhyolite: { e: 1.0, col: ['#b3a795', '#6b6258'], gas: 1.0, vei: [5, 7] } };
      function emit(w, h, n, burst) {
        const vc = VISC[lab.v.visc] || VISC.basalt;
        const cr = w * 0.5, ck = h * 0.42;
        for (let i = 0; i < n; i++) {
          const explosive = vc.gas * (lab.v.press / 100);
          parts.push({
            x: cr + P.rand(-6, 6), y: ck,
            vx: P.rand(-1, 1) * (20 + explosive * 60),
            vy: -(40 + Math.random() * 160 * (0.4 + explosive)),
            r: P.rand(1.4, 3.2) + explosive * 2,
            life: 1, hot: Math.random() < (1 - explosive * 0.7),
            buoy: explosive > 0.5 ? P.rand(8, 26) : 0,
            burst
          });
        }
        if (parts.length > P.p(420)) parts.splice(0, parts.length - P.p(420));
      }
      lab.canvas.addEventListener('pointerdown', e => {
        const r = lab.canvas.getBoundingClientRect();
        if (Math.abs(e.clientX - r.left - r.width / 2) < r.width * 0.2 && e.clientY - r.top < r.height * 0.6) {
          emit(r.width, r.height, P.p(60), true); lab.seismo(1.2);
        }
      });
      return {
        step(dt, t, w, h) {
          const v = lab.v, vc = VISC[v.visc] || VISC.basalt;
          const rate = (v.press / 100) * (0.4 + vc.e);
          if (Math.random() < rate * 0.9) emit(w, h, Math.round(2 + rate * 8), false);

          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = grad(ctx, 0, 0, 0, h, '#171019', '#2a1410'); ctx.fillRect(0, 0, w, h);

          /* edifice with glowing conduit */
          const cr = w * 0.5, ck = h * 0.42, base = h * 0.92;
          ctx.fillStyle = '#2b2118';
          ctx.beginPath();
          ctx.moveTo(cr - w * 0.3, base); ctx.lineTo(cr - 14, ck); ctx.lineTo(cr + 14, ck); ctx.lineTo(cr + w * 0.3, base); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = `rgba(255,120,50,${0.25 + (v.press / 100) * 0.6})`; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(cr, base); ctx.lineTo(cr, ck); ctx.stroke();
          /* glow at crater proportional to pressure */
          const gl = ctx.createRadialGradient(cr, ck, 2, cr, ck, 30 + v.press * 0.6);
          gl.addColorStop(0, `rgba(255,150,60,${0.5 + v.press / 200})`); gl.addColorStop(1, 'rgba(255,150,60,0)');
          ctx.fillStyle = gl; ctx.fillRect(cr - 80, ck - 80, 160, 160);

          /* particles: hot clasts fall as lava, ash is buoyant and spreads */
          for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            p.life -= dt * (p.hot ? 0.5 : 0.22);
            if (p.life <= 0) { parts.splice(i, 1); continue; }
            p.vy += (p.hot ? 150 : -p.buoy * (1 - p.life) - 20) * dt;   // ash rises into umbrella cloud
            p.vx *= (1 - dt * (p.hot ? 0.2 : 0.6));
            p.x += p.vx * dt; p.y += p.vy * dt;
            if (p.hot) {
              if (p.y > base - 4) { p.vy = 0; p.vx *= 0.86; p.y = base - 4; p.life -= dt * 0.6; } // lava pools & flattens
              ctx.fillStyle = p.life > 0.5 ? vc.col[0] : vc.col[1];
              ctx.globalAlpha = Math.min(1, p.life + 0.3);
              ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (p.y > base - 6 ? 2.2 : 1), 0, Math.PI * 2); ctx.fill();
              ctx.globalAlpha = 1;
            } else {
              ctx.fillStyle = `rgba(${120 + p.life * 60 | 0},${112 + p.life * 50 | 0},${106 + p.life * 40 | 0},${p.life * 0.5})`;
              ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (2.4 - p.life), 0, Math.PI * 2); ctx.fill();
            }
          }
          /* pyroclastic density current when very explosive */
          if (vc.gas > 0.6 && v.press > 70) {
            ctx.fillStyle = 'rgba(90,80,74,.35)';
            const spread = ((t * 90) % (w * 0.6));
            [-1, 1].forEach(d => {
              ctx.beginPath();
              ctx.ellipse(cr + d * (20 + spread), base - 8, 40 + spread * 0.5, 10, 0, 0, Math.PI * 2);
              ctx.fill();
            });
          }
          if (lab.ro.vei) lab.ro.vei.textContent = 'VEI ' + Math.round(vc.vei[0] + (v.press / 100) * (vc.vei[1] - vc.vei[0]));
        }
      };
    }
  });

  /* =====================================================================
     07 · BLACK SMOKER HYDROTHERMAL VENT
     ===================================================================== */
  R({
    id: 'blacksmoker', num: 7, cat: 'VOLCANOLOGY', catLabel: 'Volcanology & Igneous Processes',
    title: 'Mid-Ocean Ridge Hydrothermal Vent',
    desc: 'Seawater superheated by the crust erupts from a sulfide chimney, precipitating mineral smoke. Raise the vent temperature to drive stronger convection.',
    overlay: 'Deep-sea environment · particle-driven mineral plume',
    controls: [
      { type: 'range', label: 'Vent temperature', min: 60, max: 400, value: 350, unit: ' °C', key: 'temp',
        onInput: (v, lab) => { lab.v.temp = v; } },
      { type: 'seg', label: 'Mineral load', index: 1, key: 'min',
        options: [{ label: 'Clear', value: 0.2 }, { label: 'Iron-rich', value: 0.7 }, { label: 'Sulfide-rich', value: 1 }],
        onChange: (val, lab) => { lab.v.min = val; } },
      { type: 'readout', label: 'Plume height', key: 'ph' }
    ],
    initState: { temp: 350, min: 0.7 },
    init(canvas, ctx, lab, P) {
      let sm = [], snow = [];
      for (let i = 0; i < P.p(50); i++) snow.push({ x: P.rand(0, 1), y: P.rand(0, 1), s: P.rand(0.4, 1.4), v: P.rand(4, 12) });
      return {
        step(dt, t, w, h) {
          const v = lab.v, heat = (v.temp - 60) / 340;
          const dx = w * 0.5, dy = h * 0.78;
          if (Math.random() < 0.5 + heat) {
            sm.push({ x: dx + P.rand(-3, 3), y: dy, vx: P.rand(-6, 6), vy: -(20 + heat * 90) * P.rand(0.6, 1.2),
                      r: P.rand(2, 5), life: 1, hue: v.min > 0.5 ? P.rand(20, 40) : P.rand(30, 50) });
          }
          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = grad(ctx, 0, 0, 0, h, '#050a12', '#0b141f'); ctx.fillRect(0, 0, w, h);

          /* marine snow drifting down (deep-sea ambience) */
          ctx.fillStyle = 'rgba(200,210,220,.25)';
          snow.forEach(s => { s.y += s.v * dt / h; s.x += Math.sin(t + s.y * 9) * 0.0004; if (s.y > 1) s.y = 0; ctx.fillRect(s.x * w, s.y * h, s.s, s.s); });

          /* pillow basalt mound + sulfide chimney */
          ctx.fillStyle = '#1c1a1e';
          ctx.beginPath(); ctx.ellipse(dx, h * 0.86, w * 0.3, h * 0.12, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#3a3026';
          ctx.beginPath();
          ctx.moveTo(dx - 16, dy + 6); ctx.lineTo(dx - 7, dy - h * 0.2); ctx.lineTo(dx + 7, dy - h * 0.2); ctx.lineTo(dx + 16, dy + 6);
          ctx.closePath(); ctx.fill();
          /* chimney mineral banding */
          ctx.strokeStyle = 'rgba(216,178,95,.35)';
          for (let i = 1; i < 5; i++) { const yy = dy - i * h * 0.04; ctx.beginPath(); ctx.moveTo(dx - 12 + i, yy); ctx.lineTo(dx + 12 - i, yy); ctx.stroke(); }
          /* orifice shimmer */
          ctx.fillStyle = `rgba(255,120,60,${0.3 + heat * 0.5})`;
          ctx.beginPath(); ctx.arc(dx, dy - h * 0.2, 4 + heat * 3, 0, Math.PI * 2); ctx.fill();

          /* smoke particles: rise, cool, spread, sink slightly */
          for (let i = sm.length - 1; i >= 0; i--) {
            const p = sm[i];
            p.life -= dt * 0.35;
            if (p.life <= 0) { sm.splice(i, 1); continue; }
            p.vy += (p.life < 0.4 ? 14 : -8 * heat) * dt;
            p.vx += Math.sin(t * 2 + p.y * 0.05) * 6 * dt;
            p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 14;
            const dark = v.min * p.life;
            ctx.fillStyle = `rgba(${40 + (1 - dark) * 120 | 0},${36 + (1 - dark) * 110 | 0},${34 + (1 - dark) * 100 | 0},${p.life * 0.4 * (0.4 + v.min)})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
          }
          /* temperature halo */
          const hg = ctx.createRadialGradient(dx, dy - h * 0.2, 2, dx, dy - h * 0.2, 40 + heat * 50);
          hg.addColorStop(0, `rgba(255,90,40,${heat * 0.25})`); hg.addColorStop(1, 'rgba(255,90,40,0)');
          ctx.fillStyle = hg; ctx.fillRect(dx - 100, dy - h * 0.2 - 100, 200, 200);
          /* tube-worm colony near the vent */
          ctx.strokeStyle = '#b6552e'; ctx.lineWidth = 1.6;
          for (let i = 0; i < 8; i++) {
            const bx = dx + 26 + i * 5, sway = Math.sin(t * 2 + i) * 2;
            ctx.beginPath(); ctx.moveTo(bx, dy + 8); ctx.quadraticCurveTo(bx + sway, dy - 8, bx + sway, dy - 16); ctx.stroke();
            ctx.fillStyle = '#d97e4a'; ctx.beginPath(); ctx.arc(bx + sway, dy - 16, 2, 0, Math.PI * 2); ctx.fill();
          }
          if (lab.ro.ph) lab.ro.ph.textContent = Math.round(heat * 320) + ' m';
        }
      };
    }
  });

  /* =====================================================================
     08 · MAGMA CHAMBER CONVECTION & FRACTIONAL CRYSTALLIZATION
     ===================================================================== */
  R({
    id: 'fraction', num: 8, cat: 'VOLCANOLOGY', catLabel: 'Volcanology & Igneous Processes',
    title: 'Magma Chamber Convection & Fractional Crystallization',
    desc: 'Cool the basaltic melt: olivine crystals nucleate first and settle to the floor (Bowen’s reaction series), leaving a more silicic residual liquid.',
    overlay: 'Crystals settle · melt composition drifts toward andesite/rhyolite',
    controls: [
      { type: 'range', label: 'Cooling rate', min: 0, max: 100, value: 35, unit: '%', key: 'cool',
        onInput: (vv, lab) => { lab.v.cool = vv; } },
      { type: 'toggle', label: 'Recharge hot melt', key: 'recharge', value: false,
        onChange: (on, lab) => { if (on) { lab.v.T = 1; lab.v.silica = 0.5; lab.crysts.length = 0; } } },
      { type: 'readout', label: 'Melt SiO₂', key: 'si' }
    ],
    initState: { cool: 35, T: 1, silica: 0.5 },
    init(canvas, ctx, lab, P) {
      lab.crysts = [];
      let flow = [];
      for (let i = 0; i < P.p(70); i++) flow.push({ x: P.rand(0, 1), y: P.rand(0, 1) });
      return {
        step(dt, t, w, h) {
          const v = lab.v;
          const chill = v.cool / 100;
          v.T = Math.max(0, v.T - dt * chill * 0.06);
          const px = w * 0.12, py = h * 0.14, pw = w * 0.76, ph = h * 0.74;

          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = grad(ctx, 0, 0, 0, h, '#141018', '#20140f'); ctx.fillRect(0, 0, w, h);
          /* chamber walls */
          ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 6;
          ctx.strokeRect(px, py, pw, ph);
          /* melt colour interpolates basalt→silicic as it differentiates */
          const s = v.silica;
          const heat = v.T;
          const cA = [200, 60 + s * 120, 20];                    // hot mafic orange-red
          const cB = [230 - s * 60, 190 - s * 60, 120 * s + 30]; // cool felsic pale
          const mix = cA.map((a, i) => Math.round(a * heat + cB[i] * (1 - heat)));
          ctx.save();
          ctx.beginPath(); ctx.rect(px + 3, py + 3, pw - 6, ph - 6); ctx.clip();
          ctx.fillStyle = `rgb(${mix[0]},${mix[1]},${mix[2]})`;
          ctx.globalAlpha = 0.85; ctx.fillRect(px, py, pw, ph); ctx.globalAlpha = 1;

          /* convection cells — two counter-rotating rolls, speed ∝ thermal energy */
          ctx.strokeStyle = 'rgba(20,10,5,.35)'; ctx.lineWidth = 1.6;
          const spd = (0.25 + heat) * 0.6;
          flow.forEach(f => {
            const cxn = f.x < 0.5 ? 0.25 : 0.75;
            const ang = Math.atan2(f.y - 0.5, (f.x - cxn)) + Math.PI / 2 * (f.x < cxn ? -1 : 1);
            f.x += Math.cos(ang) * dt * spd * (f.x < cxn === (f.y < 0.5) ? -1 : 1) * 0.4;
            f.y += Math.sin(ang) * dt * spd * 0.3;
            if (f.x < 0 || f.x > 1 || f.y < 0 || f.y > 1) { f.x = P.rand(0.05, 0.95); f.y = P.rand(0.05, 0.95); }
            ctx.beginPath(); ctx.arc(px + f.x * pw, py + f.y * ph, 1.6, 0, Math.PI * 2); ctx.stroke();
          });

          /* nucleation when T drops below olivine stability (~0.75) */
          if (v.T < 0.75 && lab.crysts.length < P.p(90) && Math.random() < chill * 0.5 + 0.1) {
            lab.crysts.push({ x: px + P.rand(0.1, 0.9) * pw, y: py + P.rand(0.1, 0.5) * ph, vy: 0, r: P.rand(2, 4.5), settled: false });
            v.silica = Math.min(1, v.silica + 0.004); // removing Mg-Fe olivine enriches silica
          }
          /* crystals sink (settling velocity ∝ size, Stokes-ish) */
          lab.crysts.forEach(c => {
            if (!c.settled) {
              c.vy += dt * 26 * (c.r / 4);
              c.y += c.vy * dt;
              c.x += Math.sin(t * 2 + c.y) * 0.2;
              if (c.y > py + ph - 8 - Math.random() * 6) { c.settled = true; c.y = py + ph - 6 - P.rand(0, 4); }
            }
            ctx.fillStyle = '#7fae6a';                       // olivine green
            ctx.beginPath();
            ctx.moveTo(c.x, c.y - c.r); ctx.lineTo(c.x + c.r, c.y); ctx.lineTo(c.x, c.y + c.r); ctx.lineTo(c.x - c.r, c.y);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(20,40,15,.6)'; ctx.stroke();
          });
          /* cumulate pile label */
          const settledN = lab.crysts.filter(c => c.settled).length;
          ctx.fillStyle = 'rgba(20,12,6,.9)';
          ctx.fillRect(px + 3, py + ph - 6 - settledN * 0.6, pw - 6, 3 + settledN * 0.6);
          ctx.restore();

          /* thermometers */
          ctx.fillStyle = '#ece3d4'; ctx.font = '11px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
          ctx.fillText('T ≈ ' + Math.round(700 + v.T * 600) + ' °C', px, py - 8);
          ctx.textAlign = 'right';
          ctx.fillText('cumulates: ' + settledN, px + pw, py - 8);
          ctx.textAlign = 'center';
          ctx.fillText(v.silica < 0.58 ? 'BASALTIC MELT' : v.silica < 0.66 ? 'ANDESITIC RESIDUE' : 'DACITIC → RHYOLITIC', w / 2, py + ph + 22);
          if (lab.ro.si) lab.ro.si.textContent = (48 + v.silica * 26).toFixed(1) + ' wt%';
        }
      };
    }
  });

  /* =====================================================================
     09 · CALDERA COLLAPSE & SUPERVOLCANO
     ===================================================================== */
  R({
    id: 'caldera', num: 9, cat: 'VOLCANOLOGY', catLabel: 'Volcanology & Igneous Processes',
    title: 'Caldera Collapse & Supervolcano',
    desc: 'Tap the roof blocks to vent chamber pressure. When the magma drains out, the roof founders in catastrophic block collapse — then rain fills the scar.',
    overlay: 'Tap blocks to trigger ring-fault subsidence · watch the crater lake form',
    controls: [
      { type: 'range', label: 'Chamber inflation', min: 0, max: 100, value: 60, unit: '%', key: 'inf',
        onInput: (vv, lab) => { lab.v.inf = vv; } },
      { type: 'toggle', label: 'Erupt & drain chamber', key: 'drain', value: false,
        onChange: (on, lab) => { lab.v.erupting = on; if (on) lab.seismo(1.9); } },
      { type: 'readout', label: 'Subsidence', key: 'sub' }
    ],
    initState: { inf: 60, erupting: false },
    init(canvas, ctx, lab, P) {
      const N = 7;
      let blocks = [], ash = [], lake = 0, drained = 0, sub = 0;
      function layout(w, h) {
        blocks = [];
        const bw = w * 0.52 / N, top = h * 0.34;
        for (let i = 0; i < N; i++) blocks.push({ x: w * 0.24 + i * bw, w: bw, y: top, drop: 0, tilt: 0 });
      }
      lab.canvas.addEventListener('pointerdown', e => {
        const r = lab.canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
        blocks.forEach(b => {
          if (mx > b.x && mx < b.x + b.w && my < b.y + 30 && drained > 0.25 && b.drop < r.height * 0.3) {
            b.drop += r.height * 0.06; b.tilt = P.rand(-0.08, 0.08); lab.seismo(1.0);
            sub = blocks.reduce((a, q) => a + q.drop, 0) / N;
          }
        });
      });
      return {
        onResize: layout,
        step(dt, t, w, h) {
          if (!blocks.length) layout(w, h);
          const v = lab.v;
          if (v.erupting) drained = Math.min(1, drained + dt * 0.12);
          else drained = Math.max(0, drained - dt * 0.02);
          /* pressure eruption column while draining */
          if (v.erupting && drained < 0.95 && Math.random() < 0.7) {
            ash.push({ x: w / 2 + P.rand(-20, 20), y: h * 0.3, vx: P.rand(-30, 30), vy: P.rand(-160, -60), r: P.rand(4, 12), life: 1 });
          }
          /* block collapse once chamber largely empty */
          if (drained > 0.25) {
            blocks.forEach((b, i) => {
              const target = drained * h * 0.24 * (1 - Math.abs(i - 3) * 0.09);
              if (b.drop < target) b.drop += dt * 22 * (target - b.drop > 4 ? 3 : 0.4);
            });
            sub = blocks.reduce((a, q) => a + q.drop, 0) / N;
          }
          /* lake refills after eruption stops */
          if (!v.erupting && drained > 0.4) lake = Math.min(1, lake + dt * 0.08);

          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = grad(ctx, 0, 0, 0, h, '#161018', '#241511'); ctx.fillRect(0, 0, w, h);

          /* crust surface outside caldera */
          ctx.fillStyle = '#4a3a2c'; ctx.fillRect(0, h * 0.34, w, h);
          /* collapsing roof blocks */
          blocks.forEach(b => {
            ctx.save();
            ctx.translate(b.x + b.w / 2, b.y + b.drop);
            ctx.rotate(b.tilt * drained);
            ctx.fillStyle = '#6d5a44';
            ctx.fillRect(-b.w / 2, 0, b.w - 1.5, h * 0.3);
            ctx.strokeStyle = 'rgba(20,12,8,.5)'; ctx.strokeRect(-b.w / 2, 0, b.w - 1.5, h * 0.3);
            ctx.restore();
          });
          /* ring faults glow */
          ctx.strokeStyle = `rgba(224,86,58,${0.25 + drained * 0.5})`; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(w * 0.24, h * 0.34); ctx.lineTo(w * 0.22, h); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(w * 0.76, h * 0.34); ctx.lineTo(w * 0.78, h); ctx.stroke();

          /* magma chamber below — deflating */
          const chY = h * 0.78, chH = h * 0.16 * (1 - drained * 0.75);
          const mg = grad(ctx, 0, chY - chH, 0, chY + chH, '#d97e4a', '#8f3f22');
          ctx.fillStyle = mg;
          ctx.beginPath(); ctx.ellipse(w / 2, chY, w * 0.3, chH, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(255,160,80,.5)'; ctx.stroke();
          /* conduit */
          ctx.fillStyle = drained > 0.02 && v.erupting ? '#ff8c3a' : '#5d3f2c';
          ctx.fillRect(w / 2 - 5, h * 0.34 - sub, 10, chY - h * 0.34);

          /* ash column */
          for (let i = ash.length - 1; i >= 0; i--) {
            const a = ash[i];
            a.life -= dt * 0.3; if (a.life <= 0) { ash.splice(i, 1); continue; }
            a.x += a.vx * dt; a.y += a.vy * dt; a.vy += 12 * dt; a.r += dt * 12;
            ctx.fillStyle = `rgba(140,132,124,${a.life * 0.5})`;
            ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
          }
          /* crater lake */
          if (lake > 0.02 && sub > 4) {
            const ly = h * 0.34 + sub * 0.75;
            ctx.fillStyle = `rgba(70,130,170,${0.35 + lake * 0.5})`;
            ctx.beginPath(); ctx.ellipse(w / 2, ly + 6, w * 0.24 * lake, 8 * lake + 2, 0, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = 'rgba(236,227,212,.65)'; ctx.font = '11px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
          ctx.fillText(drained > 0.6 ? 'CALDERA — ROOF FOUNDERS' : v.erupting ? 'ERUPTION COLUMN' : lake > 0.5 ? 'CRATER LAKE FORMING' : 'INFLATED CHAMBER', w / 2, 18);
          if (lab.ro.sub) lab.ro.sub.textContent = Math.round(sub * 14) + ' m';
        }
      };
    }
  });
})();
