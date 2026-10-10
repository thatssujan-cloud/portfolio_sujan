/* ==========================================================================
   GEO LABS — HERO BACKGROUND CANVAS
   Slowly folding strata ribbons behind the hero headline (subtle tectonic
   fold animation). Shares the GeoLabs master rAF loop and pauses off-screen.
   ========================================================================== */
'use strict';
(function () {
  const canvas = document.getElementById('hero-strata-canvas');
  if (!canvas || !window.GeoLabs) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const P = window.GeoLabs.PERF;
  let w = 0, h = 0, dpr = P.dpr;
  const HUES = ['#b6552e', '#c98d5f', '#7b4f36', '#41697a', '#e0a95f', '#7b8f6a'];

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function step(dt, t) {
    if (!w) resize();
    ctx.clearRect(0, 0, w, h);
    /* six folded bedding planes drifting across the lower hero */
    for (let k = 0; k < 6; k++) {
      const yBase = h * (0.52 + k * 0.085);
      const amp = 14 + k * 7 + Math.sin(t * 0.12 + k) * 5;   // breathing fold amplitude
      const phase = t * 0.05 * (k % 2 ? 1 : -1) + k * 1.3;
      ctx.beginPath();
      for (let x = -20; x <= w + 20; x += 12) {
        const y = yBase
          + Math.sin(x * 0.004 + phase) * amp                       // regional fold
          + Math.sin(x * 0.013 + phase * 2.2) * amp * 0.28          // parasitic wrinkle
          + Math.sin(x * 0.0007 + t * 0.03) * 18;                   // dome/swell
        x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = HUES[k];
      ctx.globalAlpha = 0.16 - k * 0.015;
      ctx.lineWidth = 2 + k * 0.7;
      ctx.stroke();
      /* thin echelon joint ticks on two beds */
      if (k === 1 || k === 3) {
        ctx.globalAlpha = 0.08;
        for (let x = ((t * 6) % 60); x < w; x += 60) {
          const y = yBase + Math.sin(x * 0.004 + phase) * amp;
          ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x + 10, y + 16); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    /* magma glow line at the very base of the hero */
    const mg = ctx.createLinearGradient(0, h - 30, 0, h);
    mg.addColorStop(0, 'rgba(217,126,74,0)');
    mg.addColorStop(1, `rgba(217,126,74,${0.16 + Math.sin(t * 0.8) * 0.05})`);
    ctx.fillStyle = mg; ctx.fillRect(0, h - 30, w, 30);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  /* mount into the shared loop via a lightweight instance push */
  document.addEventListener('DOMContentLoaded', () => {
    if (P.reduceMotion) { step(0.016, 4); return; }
    window.GeoLabs.attachCustom && window.GeoLabs.attachCustom(canvas, step);
  });
  if (document.readyState !== 'loading') {
    if (P.reduceMotion) step(0.016, 4);
    else window.GeoLabs.attachCustom && window.GeoLabs.attachCustom(canvas, step);
  }
})();
