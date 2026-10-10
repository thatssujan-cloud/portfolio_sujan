/* ==========================================================================
   GEO LABS — MODULE 20 · PLANETARY GEOLOGY & IMPACT METEORITICS
   20 Meteorite Impact Crater Formation (size/velocity → shock, ejecta, peak)
   ========================================================================== */
'use strict';
(function () {
  const R = window.GeoLabs.register;
  const grad = (ctx, x0, y0, x1, y1, a, b) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };

  R({
    id: 'impact', num: 20, cat: 'PLANETARY', catLabel: 'Planetary Geology & Impact Meteoritics',
    title: 'Meteorite Impact Crater Formation',
    desc: 'Configure the projectile and fire. A supersonic strike excavates a transient crater, blankets the terrain with ballistic ejecta, and rebounds a central peak — simple to complex crater genesis.',
    overlay: 'Press “Strike” — energy scales with mass × velocity²',
    controls: [
      { type: 'range', label: 'Impactor diameter', min: 5, max: 100, value: 30, unit: ' m', key: 'size',
        onInput: (vv, lab) => { lab.v.size = vv; } },
      { type: 'range', label: 'Velocity', min: 5, max: 72, value: 20, unit: ' km/s', key: 'vel',
        onInput: (vv, lab) => { lab.v.vel = vv; } },
      { type: 'toggle', label: '☄ Strike!', key: 'fire', value: false,
        onChange: (on, lab) => { if (on) lab.v.fireReq = true; } },
      { type: 'readout', label: 'Crater Ø', key: 'dia' }
    ],
    initState: { size: 30, vel: 20, fireReq: false },
    init(canvas, ctx, lab, P) {
      let phase = 'idle', proj = null, ejecta = [], shock = [], ground = null, finalR = 0, peak = 0, flash = 0, gcx = 0;
      function makeGround(w, h) {
        const n = 90; ground = new Float32Array(n);
        for (let i = 0; i < n; i++) ground[i] = Math.sin(i * 0.35) * 3 + Math.sin(i * 0.13) * 5;
      }
      function reshape(cx, r, w, h) {
        const n = ground.length, step = w / (n - 1);
        for (let i = 0; i < n; i++) {
          const x = i * step, d = Math.abs(x - cx), base = h * 0.68;
          if (d < r) {
            const u = d / r;
            /* bowl for transient cavity, rim uplift outside */
            const depth = r * 0.42 * Math.cos(u * Math.PI / 2);
            const rim = u > 0.8 ? r * 0.16 * Math.exp(-(u - 0.8) * 8) : 0;
            ground[i] = -(depth - rim) + (ground[i] || 0) * 0.2;
          } else if (d < r * 1.6) {
            ground[i] += r * 0.1 * Math.exp(-Math.pow((d - r) / (r * 0.3), 2)) * 0.4;
          }
        }
      }
      return {
        onResize: (w, h) => makeGround(w, h),
        step(dt, t, w, h) {
          const v = lab.v;
          if (!ground) makeGround(w, h);
          const base = h * 0.68;
          const energy = Math.pow(v.size, 3) * Math.pow(v.vel, 2) / 4e6;   // arbitrary scaled units
          finalR = Math.min(w * 0.32, 22 + Math.sqrt(energy) * 26);

          /* --- state machine --- */
          if (v.fireReq && phase === 'idle') {
            v.fireReq = false;
            if (lab.ui.fire) lab.ui.fire.setAttribute('aria-pressed', 'false');
            phase = 'incoming';
            gcx = w * 0.5;
            proj = { x: gcx + h * 0.5, y: -30, vx: -320, vy: 320 * (v.vel / 20) };
          }
          if (phase === 'incoming' && proj) {
            proj.x += proj.vx * dt * (v.vel / 20); proj.y += proj.vy * dt * (v.vel / 20);
            if (proj.y >= base - 4) {
              phase = 'excavate'; tExc = 0; flash = 1;
              lab.seismo(Math.min(2.2, 0.8 + energy * 0.1));
              shock.push({ r: 6, a: 1 }); shock.push({ r: 2, a: 0.8 });
              for (let i = 0; i < P.p(140); i++) {
                const an = P.rand(-Math.PI * 0.95, -Math.PI * 0.05);
                const sp = P.rand(60, 260) * (0.5 + v.vel / 40);
                ejecta.push({ x: gcx, y: base - 6, vx: Math.cos(an) * sp * (Math.random() < 0.5 ? -1 : 1) * Math.random(), vy: Math.sin(an) * sp, life: 1, big: Math.random() < 0.2 });
              }
            }
          }
          var tExc;
          if (phase === 'excavate') {
            tExc = (tExc || 0) + dt;
            reshape(gcx, finalR * Math.min(1, tExc / 0.8), w, h);
            if (tExc > 1.1) { phase = 'modification'; tMod = 0; }
          }
          var tMod;
          if (phase === 'modification') {
            tMod += dt;
            /* central peak uplift for complex craters (enough energy) */
            if (finalR > 55) {
              peak = Math.min(finalR * 0.22, peak + dt * finalR * 0.18);
              const n = ground.length, step = w / (n - 1);
              for (let i = 0; i < n; i++) {
                const d = Math.abs(i * step - gcx);
                if (d < finalR * 0.35) ground[i] -= peak * Math.cos((d / (finalR * 0.35)) * Math.PI / 2) * 0.06;
              }
            }
            if (tMod > 2.6) phase = 'settled';
          }
          if (phase === 'settled' && lab.v.fireReq !== undefined && lab.ui.fire) {
            /* allow re-strike: reset topography gently */
          }
          if ((phase === 'settled' || phase === 'idle') && v.fireReq) { phase = 'idle'; }
          if (phase === 'idle' && v.fireReq) { v.fireReq = false; phase = 'arming'; }
          if (phase === 'arming') { makeGround(w, h); peak = 0; ejecta = []; shock = []; phase = 'idle'; }

          /* --- render --- */
          ctx.clearRect(0, 0, w, h);
          /* alien sky */
          ctx.fillStyle = grad(ctx, 0, 0, 0, h, '#1b1220', '#33181c'); ctx.fillRect(0, 0, w, h);
          /* distant stars + a pale moon */
          ctx.fillStyle = 'rgba(236,227,212,.5)';
          for (let i = 0; i < 26; i++) { const sx = (i * 137 % w), sy = (i * 61 % (h * 0.4)); ctx.fillRect(sx, sy, 1.4, 1.4); }
          ctx.fillStyle = '#d3bd9c'; ctx.beginPath(); ctx.arc(w * 0.14, h * 0.16, 14, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.arc(w * 0.15, h * 0.15, 11, 0, Math.PI * 2); ctx.fill();

          /* impact flash */
          if (flash > 0) {
            flash -= dt * 2.2;
            const fg = ctx.createRadialGradient(gcx, base, 4, gcx, base, finalR * 3 * flash + 40);
            fg.addColorStop(0, `rgba(255,240,200,${flash})`); fg.addColorStop(1, 'rgba(255,240,200,0)');
            ctx.fillStyle = fg; ctx.fillRect(0, 0, w, h);
          }
          /* ground profile */
          const step = w / (ground.length - 1);
          ctx.fillStyle = '#6b4636';
          ctx.beginPath(); ctx.moveTo(0, h);
          for (let i = 0; i < ground.length; i++) ctx.lineTo(i * step, base + ground[i]);
          ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
          /* regolith crust line */
          ctx.strokeStyle = '#d3bd9c'; ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i < ground.length; i++) i ? ctx.lineTo(i * step, base + ground[i]) : ctx.moveTo(0, base + ground[0]);
          ctx.stroke();
          /* subsurface strata deformed by the crater */
          ctx.strokeStyle = 'rgba(20,10,6,.3)'; ctx.lineWidth = 2;
          for (let k = 1; k <= 4; k++) {
            ctx.beginPath();
            for (let i = 0; i < ground.length; i++) {
              const x = i * step, d = Math.abs(x - gcx);
              const dish = d < finalR * 1.3 ? Math.max(0, 1 - d / (finalR * 1.3)) : 0;
              const yy = base + ground[i] + k * 22 - dish * finalR * 0.3;
              i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
            }
            ctx.stroke();
          }
          /* central peak */
          if (peak > 2) {
            ctx.fillStyle = '#7d5240';
            ctx.beginPath();
            ctx.moveTo(gcx - finalR * 0.3, base + 4);
            ctx.quadraticCurveTo(gcx, base - peak * 2.4, gcx + finalR * 0.3, base + 4);
            ctx.closePath(); ctx.fill();
          }
          /* incoming bolide with plasma trail */
          if (phase === 'incoming' && proj) {
            ctx.strokeStyle = 'rgba(255,180,80,.8)'; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.moveTo(proj.x + 90, proj.y - 90); ctx.lineTo(proj.x, proj.y); ctx.stroke();
            ctx.fillStyle = '#2b2118';
            ctx.beginPath(); ctx.arc(proj.x, proj.y, Math.max(3, v.size * 0.12), 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ff8c3a';
            ctx.beginPath(); ctx.arc(proj.x - 2, proj.y - 2, Math.max(1.5, v.size * 0.05), 0, Math.PI * 2); ctx.fill();
          }
          /* ejecta ballistics */
          for (let i = ejecta.length - 1; i >= 0; i--) {
            const e = ejecta[i];
            e.vy += 210 * dt; e.x += e.vx * dt; e.y += e.vy * dt; e.life -= dt * 0.16;
            if (e.life <= 0 || e.x < -20 || e.x > w + 20) { ejecta.splice(i, 1); continue; }
            if (e.y > base + 2) { e.y = base + 2; e.vy = 0; e.vx *= 0.6; e.life -= dt * 1.2; } // landing builds blanket
            ctx.fillStyle = e.big ? 'rgba(122,79,54,.9)' : 'rgba(201,141,95,.8)';
            ctx.fillRect(e.x, e.y, e.big ? 4 : 2.4, e.big ? 4 : 2.4);
          }
          /* shock rings through rock + air blast */
          for (let i = shock.length - 1; i >= 0; i--) {
            const s = shock[i];
            s.r += dt * 340; s.a -= dt * 0.7;
            if (s.a <= 0) { shock.splice(i, 1); continue; }
            ctx.save();
            ctx.beginPath(); ctx.rect(0, base - 2, w, h - base + 2); ctx.clip();
            ctx.strokeStyle = `rgba(255,140,60,${s.a * 0.5})`; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.ellipse(gcx, base, s.r, s.r * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
            ctx.strokeStyle = `rgba(236,227,212,${s.a * 0.35})`;
            ctx.beginPath(); ctx.ellipse(gcx, base - 4, s.r, s.r * 0.55, 0, Math.PI, 0); ctx.stroke();
          }
          /* labels */
          ctx.fillStyle = 'rgba(236,227,212,.7)'; ctx.font = '11px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
          ctx.fillText(phase === 'idle' ? 'PROJECTILE ARMED · SET SIZE & VELOCITY' :
                       phase === 'incoming' ? 'SUPERSONIC ENTRY · ' + v.vel + ' KM/S · ' + (v.vel / 17).toFixed(1) + ' Mach' :
                       phase === 'excavate' ? 'EXCAVATION FLOW-FIELD' :
                       phase === 'modification' ? 'MODIFICATION · CENTRAL PEAK REBOUND' : 'COMPLEX CRATER · EJECTA BLANKET', 12, 18);
          if (lab.ro.dia) lab.ro.dia.textContent = phase === 'idle' || phase === 'incoming' ? '—' : Math.round(finalR * 2 * (v.size / 10)) + ' m';
        }
      };
    }
  });
})();
