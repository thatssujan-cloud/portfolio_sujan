/* ==========================================================================
   REACTIVE SEISMOGRAPH — Canvas background line
   A continuous seismic trace that spikes on clicks, hovers over interactive
   elements, and drifts gently with scroll. Runs at 60fps via rAF, pauses
   when the tab is hidden, and respects prefers-reduced-motion.
   Exposes window.Seismo.trigger(intensity) so other modules can fire quakes.
   ========================================================================== */
'use strict';

(function initSeismograph() {
  const canvas = document.getElementById('seismo-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
  let samples = [];          // rolling amplitude buffer
  let impulses = [];         // active earthquake spikes {pos, amp, decay}
  let scrollEnergy = 0;      // injected by scroll velocity
  let rafId = null;
  let running = true;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const target = Math.max(180, Math.floor(W / 4));
    while (samples.length < target) samples.push(0);
    samples.length = target;
  }

  /* ---- Event-driven quakes ---- */
  function trigger(intensity = 1, x = null) {
    const pos = x === null
      ? samples.length - 1
      : Math.min(samples.length - 1, Math.max(0, Math.floor((x / W) * samples.length)));
    impulses.push({ pos, amp: Math.min(1.6, intensity), age: 0 });
    if (impulses.length > 24) impulses.shift();
  }
  window.Seismo = { trigger };

  document.addEventListener('pointerdown', () => trigger(1.15), { passive: true });
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') trigger(0.7); }, { passive: true });

  // Spike when hovering interactive elements
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest && e.target.closest('a, button, .core-sample, .gallery-trigger, .strat-unit, .exp-card, .testimonial-card');
    if (t) trigger(0.45, e.clientX);
  }, { passive: true });

  // Scroll velocity feeds micro-tremor energy
  let lastY = window.scrollY, lastT = performance.now();
  window.addEventListener('scroll', () => {
    const now = performance.now();
    const dt = Math.max(8, now - lastT);
    const v = Math.abs(window.scrollY - lastY) / dt; // px per ms
    scrollEnergy = Math.min(1, scrollEnergy + v * 0.03);
    lastY = window.scrollY; lastT = now;
  }, { passive: true });

  /* ---- Simulation loop ---- */
  let phase = 0;
  function step() {
    phase += 0.045;
    scrollEnergy *= 0.94;

    // ambient micro-seismic noise
    let base =
      Math.sin(phase) * 0.04 +
      Math.sin(phase * 2.7 + 1.3) * 0.025 +
      (Math.random() - 0.5) * 0.03 * (1 + scrollEnergy * 4);

    // propagate impulses as damped wavelets
    let spike = 0;
    for (let i = impulses.length - 1; i >= 0; i--) {
      const im = impulses[i];
      im.age++;
      const travel = im.age * 1.4;
      const d = Math.abs(samples.length - 1 - im.pos - travel * 0.35);
      const env = Math.exp(-im.age * 0.055) * Math.cos(d * 0.9);
      spike += im.amp * env * 0.9;
      if (im.age > 120 || Math.abs(im.amp * Math.exp(-im.age * 0.055)) < 0.004) impulses.splice(i, 1);
    }

    samples.push(base + spike + scrollEnergy * (Math.random() - 0.5) * 0.5);
    samples.shift();
  }

  /* ---- Theme-aware ink colours (refreshed soft palette + light/dark switch) ---- */
  const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const INK = { a: '', b: '', c: '', grid: '', glow: '', pen: '' };
  function refreshInk() {
    INK.a    = cssVar('--seismo-a')    || 'rgba(192,106,74,0.55)';
    INK.b    = cssVar('--seismo-b')    || 'rgba(230,184,119,0.75)';
    INK.c    = cssVar('--seismo-c')    || 'rgba(221,139,98,0.55)';
    INK.grid = cssVar('--seismo-grid') || 'rgba(230,184,119,0.05)';
    INK.glow = cssVar('--seismo-glow') || 'rgba(230,184,119,0.5)';
    INK.pen  = cssVar('--seismo-pen')  || '#f4d08f';
  }
  refreshInk();
  document.addEventListener('strata:themechange', refreshInk);

  /* ---- Render ---- */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    const midY = H * 0.5;
    const span = H * 0.16;
    const dx = W / (samples.length - 1);

    // faint grid ticks like a drum seismograph
    ctx.strokeStyle = INK.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = 0; gx < W; gx += 90) { ctx.moveTo(gx, midY - span - 18); ctx.lineTo(gx, midY + span + 18); }
    ctx.stroke();

    // main trace with glow gradient
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, INK.a);
    grad.addColorStop(0.5, INK.b);
    grad.addColorStop(1, INK.c);

    ctx.lineJoin = 'round';
    ctx.shadowColor = INK.glow;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < samples.length; i++) {
      const x = i * dx;
      const y = midY - samples[i] * span * 2.2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // leading stylus dot
    const ly = midY - samples[samples.length - 1] * span * 2.2;
    ctx.fillStyle = INK.pen;
    ctx.beginPath();
    ctx.arc(W - 2, ly, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop() {
    if (!running) return;
    step();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (reduceMotion) { // static quiet trace
      for (let i = 0; i < samples.length; i++) samples[i] = Math.sin(i * 0.05) * 0.03;
      draw();
      return;
    }
    if (rafId === null) { running = true; loop(); }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { running = false; cancelAnimationFrame(rafId); rafId = null; }
    else start();
  });

  let rT;
  window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(resize, 150); });

  resize();
  start();
})();
