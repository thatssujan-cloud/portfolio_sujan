/* ==========================================================================
   GEO LABS — MODULES 10–13 · GEOMORPHOLOGY & SURFACE PROCESSES
   10 Glacial Carving & U-Shaped Valley (advance/retreat slider)
   11 River Delta Formation & Avulsion (distributary growth + progradation)
   12 Karst Topography & Cave Collapse (groundwater acidity dissolution)
   13 Coastal Wave Erosion: sea cave → arch → sea stack
   ========================================================================== */
'use strict';
(function () {
  const R = window.GeoLabs.register;
  const grad = (ctx, x0, y0, x1, y1, a, b) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };

  /* =====================================================================
     10 · GLACIAL CARVING — V-valley to U-valley with moraines
     ===================================================================== */
  R({
    id: 'glacier', num: 10, cat: 'GEOMORPHOLOGY', catLabel: 'Geomorphology & Surface Processes',
    title: 'Glacial Carving & U-Shaped Valley',
    desc: 'Advance the ice and watch abrasion pluck the V-shaped river profile into a glacial U-trough; retreat drops terminal and lateral moraines in its wake.',
    overlay: 'Slider drives glacial advance ↔ retreat across ~40 ka',
    controls: [
      { type: 'range', label: 'Ice extent', min: 0, max: 100, value: 70, unit: '%', key: 'ice',
        onInput: (v, lab) => { lab.v.ice = v / 100; } },
      { type: 'readout', label: 'Valley form', key: 'form' }
    ],
    initState: { ice: 0.7, carved: 0.15 },
    init(canvas, ctx, lab, P) {
      return {
        step(dt, t, w, h) {
          const v = lab.v;
          /* erosion state relaxes toward target shaped by ice load (irreversible-ish carving) */
          const target = 0.1 + v.ice * 0.9;
          if (target > v.carved) v.carved = Math.min(1, v.carved + dt * 0.25 * v.ice);
          const c = v.carved;
          const baseY = h * 0.86, mid = w / 2;

          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = grad(ctx, 0, 0, 0, h, '#141a24', '#1e2630'); ctx.fillRect(0, 0, w, h);

          /* valley cross-section profile: interpolates V→U */
          const floor = baseY - 10 - c * 4;
          const wallX = (yy) => {
            // V: sharp point at centre; U: flat floor + steep sides
            const depthFrac = (baseY - yy) / (baseY - h * 0.18);
            const vHalf = 14 + depthFrac * w * 0.42;
            const uHalf = w * 0.30 + Math.max(0, depthFrac - 0.35) * w * 0.22;
            return P.lerp(vHalf, uHalf, c);
          };
          ctx.fillStyle = '#5d5347';
          ctx.beginPath();
          ctx.moveTo(0, h * 0.1); ctx.lineTo(mid - wallX(h * 0.16), h * 0.16);
          for (let yy = h * 0.16; yy <= floor; yy += 8) ctx.lineTo(mid - wallX(yy), yy);
          ctx.lineTo(mid + wallX(floor), floor);
          for (let yy = floor; yy >= h * 0.16; yy -= 8) ctx.lineTo(mid + wallX(yy), yy);
          ctx.lineTo(w, h * 0.1); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
          /* rock striations on walls when heavily carved */
          ctx.strokeStyle = `rgba(241,231,216,${0.1 + c * 0.15})`; ctx.lineWidth = 1.5;
          for (let i = 0; i < 6; i++) {
            const yy = h * 0.3 + i * 26;
            [-1, 1].forEach(d => { ctx.beginPath(); ctx.moveTo(mid + d * (wallX(yy) - 4), yy); ctx.lineTo(mid + d * wallX(yy - 10), yy - 10); ctx.stroke(); });
          }

          /* glacier ice body fills the trough proportional to extent */
          const iceTop = h * 0.2 + (1 - v.ice) * h * 0.5;
          if (v.ice > 0.04) {
            ctx.fillStyle = 'rgba(190,220,235,.85)';
            ctx.beginPath();
            ctx.moveTo(mid - wallX(iceTop), iceTop);
            for (let yy = iceTop; yy <= floor; yy += 8) ctx.lineTo(mid - wallX(Math.min(floor, yy)) , yy);
            ctx.lineTo(mid + wallX(floor), floor);
            for (let yy = floor; yy >= iceTop; yy -= 8) ctx.lineTo(mid + wallX(Math.min(floor, yy)), yy);
            ctx.closePath(); ctx.fill();
            /* flow bands + crevasses animate downstream */
            ctx.strokeStyle = 'rgba(120,160,190,.5)';
            for (let i = 1; i < 5; i++) {
              const yy = iceTop + ((floor - iceTop) * i) / 5;
              ctx.beginPath();
              ctx.moveTo(mid - wallX(yy) + 6, yy + Math.sin(t * 1.5 + i) * 2);
              ctx.lineTo(mid + wallX(yy) - 6, yy - Math.sin(t * 1.5 + i) * 2);
              ctx.stroke();
            }
          }

          /* meltwater river returns when ice retreats */
          if (v.ice < 0.4) {
            ctx.fillStyle = 'rgba(80,140,180,.9)';
            ctx.fillRect(mid - 8, floor - 3, 16, 4);
          }
          /* moraine deposits at the ice terminus on retreat */
          const termY = iceTop + (floor - iceTop) * 0.9;
          if (v.ice < 0.85 && c > 0.4) {
            ctx.fillStyle = '#8a7a63';
            [-1, 1].forEach(d => {
              ctx.beginPath();
              ctx.ellipse(mid + d * (wallX(termY) - 12), termY, 22, 7, 0, 0, Math.PI * 2);
              ctx.fill();
            });
            ctx.beginPath(); ctx.ellipse(mid, floor - 2, wallX(floor) * 0.8, 8, 0, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = 'rgba(236,227,212,.7)'; ctx.font = '11px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
          ctx.fillText(v.ice > 0.55 ? 'GLACIAL MAXIMUM — ABRASION & PLUCKING' : 'DEGLACIATION — MORAINE DEPOSITION', mid, 18);
          if (lab.ro.form) lab.ro.form.textContent = c < 0.4 ? 'V-profile' : c < 0.75 ? 'transitioning' : 'U-trough';
        }
      };
    }
  });

  /* =====================================================================
     11 · RIVER DELTA — sediment build-up, distributaries, avulsion events
     ===================================================================== */
  R({
    id: 'delta', num: 11, cat: 'GEOMORPHOLOGY', catLabel: 'Geomorphology & Surface Processes',
    title: 'River Delta Formation & Avulsion',
    desc: 'Sediment-charged river meets standing water: mouth bars weld out, channels split into distributaries, and the delta progrades — until one day the river avulses down a new path.',
    overlay: 'Click the delta surface to force an avulsion',
    controls: [
      { type: 'range', label: 'Sediment load', min: 5, max: 100, value: 55, unit: '%', key: 'load',
        onInput: (vv, lab) => { lab.v.load = vv / 100; } },
      { type: 'range', label: 'Sea level', min: 0, max: 100, value: 50, key: 'sea',
        format: v => (v - 50) * 0.04 > 0 ? '+' : '', unit: ' m',
        onInput: (vv, lab) => { lab.v.sea = vv / 100; } },
      { type: 'readout', label: 'Delta age', key: 'age' }
    ],
    initState: { load: 0.55, sea: 0.5, age: 0 },
    init(canvas, ctx, lab, P) {
      let chans = [], grains = [], lobes = [];
      function seedChannels() {
        chans = [{ a: -0.5, len: 0.2 }, { a: -0.15, len: 0.2 }, { a: 0.2, len: 0.2 }, { a: 0.55, len: 0.2 }];
      }
      seedChannels();
      lab.canvas.addEventListener('pointerdown', e => {
        const r = lab.canvas.getBoundingClientRect();
        const ang = Math.atan2(e.clientY - r.top - r.height * 0.42, e.clientX - r.left - r.width * 0.5);
        chans.forEach(c => { c.a = c.a * 0.4 + ang * 0.6 - P.rand(-0.2, 0.2); c.len *= 0.6; });
        lab.seismo(0.7);
      });
      return {
        step(dt, t, w, h) {
          const v = lab.v;
          v.age += dt * 400;
          const src = { x: w * 0.5, y: h * 0.42 };
          const seaY = h * (0.36 + (v.sea - 0.5) * 0.14);
          /* grow channels; spawn new distributaries; random avulsion resets lengths */
          chans.forEach(c => { c.len = Math.min(0.85, c.len + dt * 0.05 * v.load * (1 - (v.sea - 0.5))); });
          if (chans.length < 9 && Math.random() < dt * 0.25 * v.load) {
            const parent = chans[Math.floor(Math.random() * chans.length)];
            chans.push({ a: parent.a + P.rand(-0.35, 0.35), len: parent.len * 0.5 });
          }
          if (Math.random() < dt * 0.02) { // natural avulsion
            const pick = chans[Math.floor(Math.random() * chans.length)];
            pick.a += P.rand(-0.5, 0.5); pick.len *= 0.5; lab.seismo(0.9);
          }
          /* sediment grains deposit at channel mouths building lobes */
          chans.forEach(c => {
            if (Math.random() < v.load * 0.8) {
              const ex = src.x + Math.cos(c.a) * c.len * w * 0.5, ey = src.y + Math.sin(c.a * 0.6 + 0.4) * c.len * h * 0.5;
              lobes.push({ x: ex, y: ey, r: P.rand(3, 7) * (0.5 + v.load) });
            }
          });
          if (lobes.length > P.p(500)) lobes.splice(0, lobes.length - P.p(500));
          lobes.forEach(l => l.r = Math.min(14, l.r + dt * 2.2 * v.load));

          ctx.clearRect(0, 0, w, h);
          /* land */
          ctx.fillStyle = '#3f4a33'; ctx.fillRect(0, 0, w, seaY);
          /* ocean */
          ctx.fillStyle = grad(ctx, 0, seaY, 0, h, '#2a5a72', '#16333f'); ctx.fillRect(0, seaY, w, h - seaY);
          /* delta lobes (submerged sand) */
          lobes.forEach(l => {
            ctx.fillStyle = l.y > seaY ? 'rgba(201,141,95,.5)' : 'rgba(201,141,95,.85)';
            ctx.beginPath(); ctx.arc(l.x, Math.max(l.y, seaY - 2), l.r, 0, Math.PI * 2); ctx.fill();
          });
          /* river trunk + distributary network */
          ctx.strokeStyle = '#6aaee6'; ctx.lineCap = 'round';
          ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(w * 0.5, 0); ctx.lineTo(src.x, src.y); ctx.stroke();
          chans.forEach(c => {
            const ex = src.x + Math.cos(c.a) * c.len * w * 0.5, ey = src.y + Math.sin(c.a * 0.6 + 0.4) * c.len * h * 0.5;
            ctx.lineWidth = Math.max(1.5, 6 - c.len * 4);
            ctx.beginPath(); ctx.moveTo(src.x, src.y);
            ctx.quadraticCurveTo((src.x + ex) / 2 + Math.sin(c.a) * 20, (src.y + ey) / 2, ex, ey);
            ctx.stroke();
          });
          /* shoreline shimmer */
          ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let x = 0; x <= w; x += 8) ctx.lineTo(x, seaY + Math.sin(x * 0.05 + t * 2) * 1.6);
          ctx.stroke();
          ctx.fillStyle = 'rgba(236,227,212,.7)'; ctx.font = '11px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
          ctx.fillText('PROGRADING DELTA · ' + Math.round(v.load * 100) + '% SUSPENDED LOAD', 12, 18);
          if (lab.ro.age) lab.ro.age.textContent = Math.round(v.age).toLocaleString() + ' yr';
        }
      };
    }
  });

  /* =====================================================================
     12 · KARST — dissolving limestone, sinkholes, speleothems, collapse
     ===================================================================== */
  R({
    id: 'karst', num: 12, cat: 'GEOMORPHOLOGY', catLabel: 'Geomorphology & Surface Processes',
    title: 'Karst Topography & Cave Collapse',
    desc: 'Carbonic acid eats limestone along joints: conduits widen into caverns, the water table drops, sinkholes open at the surface, and stalactites regrow the roof.',
    overlay: 'Click the surface above a cavern to trigger a roof collapse',
    controls: [
      { type: 'range', label: 'Groundwater acidity', min: 0, max: 100, value: 45, unit: ' pHΔ', key: 'acid',
        onInput: (vv, lab) => { lab.v.acid = vv / 100; } },
      { type: 'range', label: 'Rainfall / recharge', min: 0, max: 100, value: 55, key: 'rain', unit: ' mm',
        onInput: (vv, lab) => { lab.v.rain = vv / 100; } },
      { type: 'readout', label: 'Cave volume', key: 'vol' }
    ],
    initState: { acid: 0.45, rain: 0.55 },
    init(canvas, ctx, lab, P) {
      /* cellular limestone mask: 1 = rock, 0 = void */
      let GW = 0, GH = 0, grid = null, wt = 0.62, speleo = [], drops = [], collapsed = false;
      function layout(w, h) {
        GW = Math.max(40, Math.floor(w / 6)); GH = Math.max(24, Math.floor(h / 6));
        grid = new Uint8Array(GW * GH).fill(1);
        /* pre-existing joints */
        for (let k = 0; k < 5; k++) {
          let x = P.rand(4, GW - 4), y = Math.floor(GH * wt);
          for (let s = 0; s < GH * 0.5; s++) { grid[y * GW + x] = 0; x += Math.round(P.rand(-1, 1)); y = Math.min(GH - 1, y + (Math.random() < 0.8 ? 1 : 0)); }
        }
        collapsed = false; speleo = [];
      }
      lab.canvas.addEventListener('pointerdown', e => {
        const r = lab.canvas.getBoundingClientRect();
        const gx = Math.floor((e.clientX - r.left) / r.width * GW);
        const gy = Math.floor((e.clientY - r.top) / r.height * GH);
        /* find void below click within reach → collapse roof */
        for (let y = gy; y < Math.min(GH, gy + 12); y++) {
          if (grid[y * GW + gx] === 0) {
            for (let x = gx - 3; x < gx + 3; x++) for (let yy = Math.max(2, y - 6); yy < y; yy++)
              if (Math.random() < 0.8) grid[yy * GW + x] = 0;
            collapsed = true; lab.seismo(1.3);
            break;
          }
        }
      });
      return {
        onResize: layout,
        step(dt, t, w, h) {
          if (!grid) layout(w, h);
          const v = lab.v;
          const cell = w / GW, cellY = h / GH;
          wt = P.lerp(wt, 0.45 + (1 - v.rain) * 0.25, dt * 0.2);
          const wy = Math.floor(GH * wt);
          /* dissolution: water-saturated rock adjacent to void dissolves ∝ acidity */
          const rate = v.acid * v.rain;
          const budget = Math.max(1, Math.round(rate * 60 * dt * 10));
          for (let n = 0; n < budget; n++) {
            const x = 1 + Math.floor(Math.random() * (GW - 2)), y = wy + Math.floor(Math.random() * (GH - wy - 1));
            if (grid[y * GW + x]) {
              const nearVoid = grid[(y - 1) * GW + x] === 0 || grid[(y + 1) * GW + x] === 0 || grid[y * GW + x - 1] === 0 || grid[y * GW + x + 1] === 0;
              if (nearVoid) grid[y * GW + x] = 0;
            }
          }
          /* vadose drips feed speleothem growth under active ceilings */
          if (Math.random() < v.rain * 0.3 && speleo.length < P.p(60)) {
            const x = Math.floor(Math.random() * GW), y = Math.floor(Math.random() * (wy - 4)) + 2;
            if (grid[y * GW + x] === 1 && grid[(y + 1) * GW + x] === 0)
              speleo.push({ x, y, len: 0, max: P.rand(2, 7) });
          }
          speleo.forEach(s => s.len = Math.min(s.max, s.len + dt * 0.4));

          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = grad(ctx, 0, 0, 0, h, '#1a2028', '#232a20'); ctx.fillRect(0, 0, w, h);
          /* soil + vegetation line */
          ctx.fillStyle = '#4a3b2a'; ctx.fillRect(0, 0, w, h * 0.1);
          /* limestone block */
          for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
            if (grid[y * GW + x]) {
              const submerged = y > wy;
              ctx.fillStyle = submerged ? 'rgba(168,178,168,.75)' : 'rgba(211,189,156,.9)';
              ctx.fillRect(x * cell, y * cellY, cell + 0.5, cellY + 0.5);
            }
          }
          /* water table sheen */
          ctx.fillStyle = 'rgba(80,140,180,.35)';
          ctx.fillRect(0, wy * cellY, w, 3);
          /* phreatic zone tint */
          ctx.fillStyle = 'rgba(46,110,140,.25)';
          ctx.fillRect(0, wy * cellY, w, h - wy * cellY);
          /* stalactites/stalagmites */
          ctx.fillStyle = '#e3d3ba';
          speleo.forEach(s => {
            ctx.beginPath();
            ctx.moveTo(s.x * cell, s.y * cellY);
            ctx.lineTo(s.x * cell + cell / 2, s.y * cellY + s.len * cellY);
            ctx.lineTo(s.x * cell + cell, s.y * cellY);
            ctx.closePath(); ctx.fill();
          });
          /* infiltration drops */
          if (Math.random() < v.rain * 0.4 && drops.length < P.p(40)) drops.push({ x: P.rand(0, w), y: h * 0.1, v: 0 });
          for (let i = drops.length - 1; i >= 0; i--) {
            const d = drops[i]; d.v += 300 * dt; d.y += d.v * dt;
            const gx = Math.floor(d.x / cell), gy = Math.floor(d.y / cellY);
            if (gy >= 0 && gy < GH && gx >= 0 && gx < GW && grid[gy * GW + gx] === 0) {
              ctx.fillStyle = 'rgba(150,200,230,.8)'; ctx.fillRect(d.x, d.y, 1.6, 5);
            } else { d.life = (d.life || 0) + dt; if (d.life > 0.2 || d.y > h) drops.splice(i, 1); }
          }
          /* sinkhole hint after collapse */
          if (collapsed) {
            ctx.fillStyle = 'rgba(236,227,212,.7)'; ctx.font = '11px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
            ctx.fillText('ROOF COLLAPSE — SUBSIDENCE SINKHOLE', w / 2, 18);
          }
          let voids = 0; for (let i = 0; i < grid.length; i++) if (!grid[i]) voids++;
          if (lab.ro.vol) lab.ro.vol.textContent = Math.round(voids / grid.length * 100) + '% karsted';
        }
      };
    }
  });

  /* =====================================================================
     13 · COASTAL EROSION — cliff → cave → arch → stack → stump
     ===================================================================== */
  R({
    id: 'coast', num: 13, cat: 'GEOMORPHOLOGY', catLabel: 'Geomorphology & Surface Processes',
    title: 'Coastal Wave Erosion & Sea Stacks',
    desc: 'Wave refraction concentrates energy at headland weaknesses. Hydraulic action and abrasion undercut a cave, punch it through as an arch, and leave an isolated sea stack.',
    overlay: 'Geological time runs automatically · press to add a storm surge',
    controls: [
      { type: 'range', label: 'Wave energy', min: 0, max: 100, value: 55, unit: '%', key: 'wv',
        onInput: (vv, lab) => { lab.v.wv = vv / 100; } },
      { type: 'toggle', label: '⛈ Storm surge', key: 'storm', value: false,
        onChange: (on, lab) => { lab.v.stormUntil = on ? lab._t + 4 : 0; lab.seismo(on ? 1.4 : 0.3); } },
      { type: 'readout', label: 'Stage', key: 'stage' }
    ],
    initState: { wv: 0.55, ero: 0 },
    init(canvas, ctx, lab, P) {
      let foam = [];
      return {
        step(dt, t, w, h) {
          const v = lab.v;
          lab._t = t;
          const storm = (v.stormUntil && t < v.stormUntil) ? 2.4 : 1;
          v.ero = Math.min(1, v.ero + dt * 0.02 * (0.2 + v.wv) * storm);
          const e = v.ero;
          const seaY = h * 0.62 + (storm > 1 ? -6 : 0);
          const cliffX = w * 0.72 - e * w * 0.22;           // cliff face retreats landward
          const notch = 8 + e * 26;                          // wave-cut notch deepens

          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = grad(ctx, 0, 0, 0, h, storm > 1 ? '#242028' : '#1c2430', '#2c3038'); ctx.fillRect(0, 0, w, h);

          /* headland cliff profile with cave/arch/stack evolution */
          ctx.fillStyle = '#6d5a44';
          ctx.beginPath();
          ctx.moveTo(cliffX, h);
          ctx.lineTo(cliffX, seaY - h * 0.28);
          ctx.lineTo(w, seaY - h * 0.3); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
          /* horizontal strata on cliff */
          ctx.save(); ctx.clip();
          ctx.strokeStyle = 'rgba(20,12,8,.3)'; ctx.lineWidth = 2;
          for (let i = 1; i < 7; i++) { ctx.beginPath(); ctx.moveTo(cliffX, seaY - h * 0.3 + i * 18); ctx.lineTo(w, seaY - h * 0.3 + i * 18); ctx.stroke(); }
          ctx.restore();

          /* sea cave punched into the toe of the cliff */
          const caveR = Math.max(0, (e - 0.15)) * w * 0.16;
          const caveX = cliffX + caveR * 0.35, caveY = seaY + 4;
          if (caveR > 3) { ctx.fillStyle = '#12100e'; ctx.beginPath(); ctx.arc(caveX, caveY, caveR, Math.PI, 0); ctx.fill(); }
          /* arch breakthrough */
          const arch = Math.max(0, (e - 0.45)) * w * 0.12;
          if (arch > 4) {
            ctx.fillStyle = skyGradFill();
            ctx.beginPath(); ctx.arc(caveX + arch * 0.7, caveY, arch, Math.PI, 0); ctx.fill();
          }
          function skyGradFill() { const g = ctx.createLinearGradient(0, seaY - 40, 0, seaY + 20); g.addColorStop(0, '#1c2430'); g.addColorStop(1, '#2c3038'); return g; }
          /* stack pillar detaches */
          const st = Math.max(0, (e - 0.7)) * 90;
          if (st > 6) {
            const sx = cliffX - st - 26;
            ctx.fillStyle = '#6d5a44';
            ctx.beginPath();
            ctx.moveTo(sx, seaY + 10); ctx.lineTo(sx + 4, seaY - h * 0.2 + st * 0.1);
            ctx.lineTo(sx + 22, seaY - h * 0.22 + st * 0.12); ctx.lineTo(sx + 26, seaY + 10);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(20,12,8,.3)';
            for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(sx + 2, seaY - i * 14 + st * 0.1); ctx.lineTo(sx + 25, seaY - i * 14 + st * 0.1); ctx.stroke(); }
          }

          /* ocean + dynamic waves hitting cliff */
          ctx.fillStyle = 'rgba(46,110,140,.9)';
          ctx.beginPath(); ctx.moveTo(0, seaY);
          for (let x = 0; x <= cliffX + 6; x += 6) {
            const amp = (2 + v.wv * 8) * storm;
            ctx.lineTo(x, seaY + Math.sin(x * 0.045 - t * (2 + v.wv * 3)) * amp * (0.4 + 0.6 * Math.sin(x * 0.01 + t)));
          }
          ctx.lineTo(cliffX + 6, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
          /* splash foam at impact point */
          if (Math.random() < v.wv * storm) {
            foam.push({ x: cliffX + P.rand(-8, 4), y: seaY + P.rand(-6, 6), r: P.rand(2, 6), life: 1 });
          }
          for (let i = foam.length - 1; i >= 0; i--) {
            const f = foam[i]; f.life -= dt * 1.6; f.y -= dt * 24; f.x -= dt * 8;
            if (f.life <= 0) { foam.splice(i, 1); continue; }
            ctx.fillStyle = `rgba(240,246,248,${f.life * 0.7})`;
            ctx.beginPath(); ctx.arc(f.x, f.y, f.r * f.life, 0, Math.PI * 2); ctx.fill();
          }
          /* wave-cut platform at cliff base */
          ctx.fillStyle = '#4a3f33';
          ctx.fillRect(cliffX - 30, seaY + 8, 34, 6);

          const stage = e < 0.15 ? 'Cliff & notch' : e < 0.45 ? 'Sea cave' : e < 0.7 ? 'Sea arch' : e < 0.92 ? 'Sea stack' : 'Stump';
          ctx.fillStyle = 'rgba(236,227,212,.7)'; ctx.font = '11px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
          ctx.fillText('HYDRAULIC ACTION · ABRASION · ' + Math.round(e * 100) + '% HEADLAND CONSUMED', 12, 18);
          if (lab.ro.stage) lab.ro.stage.textContent = stage;
        }
      };
    }
  });
})();
