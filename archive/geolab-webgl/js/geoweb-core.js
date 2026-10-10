/* ==========================================================================
   GEOWEB — CORE FRAMEWORK FOR THE 3 WEBGL INSTRUMENT MODULES
   --------------------------------------------------------------------------
   Replaces the legacy 20-canvas GeoLabs registry for the #geolab section.

   Responsibilities:
     • window.GeoWeb.register({ id, init })   — module definitions plug in
     • boot(containerSel)                     — finds each .instrument card by
       data-module, wires generic UI (ranges / segmented buttons / readouts),
       and hands modules a ready-made API:
         api.card      — the <article> element
         api.canvas    — the <canvas class="gl-canvas">
         api.ro(key)   — numeric readout <b data-ro="key"> updater
         api.hud(html) — monospace HUD overlay innerHTML setter
         api.onRange(key, cb) / api.onSeg(key, cb) / api.onClick(key, cb)
         api.triggerSeismo(i)                — site seismograph spike
     • ONE shared requestAnimationFrame loop; every instrument's step(dt,t)
       runs ONLY while its card is inside the viewport (IntersectionObserver)
       and only while the tab is visible.
     • Device capability detection: renderer.capabilities.getMaxAnisotropy(),
       hardwareConcurrency and pointer type scale DPR resolution and decide
       whether shadow maps are enabled (disabled on mobile / low-power GPUs).
     • If THREE or WebGL are unavailable, the canvas is hidden and a smooth
       static SVG fallback image is shown instead (card gets .no-webgl).
   ========================================================================== */
'use strict';

window.GeoWeb = (function () {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const smallScreen = Math.min(screen.width, screen.height) < 700;
  const lowEnd = (coarse && smallScreen) || (navigator.hardwareConcurrency || 8) <= 4;

  const PERF = {
    reduceMotion,
    mobile: coarse,
    lowEnd,
    /* pixel-ratio budget: full 2 on desktop, 1.5 mid, 1 on weak devices */
    dpr: Math.min(window.devicePixelRatio || 1, lowEnd ? 1 : coarse ? 1.5 : 2),
    shadows: !coarse && !lowEnd,             // disable shadow maps on mobile GPUs
    anisoMax: 4,                             // refined after renderer creation
    p(n) { return Math.max(16, Math.round(n * (lowEnd ? 0.4 : coarse ? 0.65 : 1))); },
    clamp(v, a, b) { return v < a ? a : v > b ? b : v; },
    lerp(a, b, t) { return a + (b - a) * t; },
    rand(a, b) { return a + Math.random() * (b - a); },
    TAU: Math.PI * 2
  };

  const REGISTRY = [];
  const INSTANCES = [];
  let rafId = null, lastTs = 0;

  /* ---------- single shared render loop (visibility gated) ---------- */
  function loop(ts) {
    rafId = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    for (let i = 0; i < INSTANCES.length; i++) {
      const inst = INSTANCES[i];
      if (!inst.mounted || !inst.visible) continue;
      inst.t += dt;
      try { inst.mod.step && inst.mod.step(dt, inst.t, inst); }
      catch (e) { /* one failing instrument must not kill the others */ }
    }
  }
  function ensureLoop() {
    if (rafId === null) { lastTs = performance.now(); rafId = requestAnimationFrame(loop); }
  }

  document.addEventListener('visibilitychange', () => {
    INSTANCES.forEach(i => { i.visible = i._inView && !document.hidden; });
  });

  /* ---------- WebGL availability probe ---------- */
  function webglAvailable() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  function showFallback(card) {
    card.classList.add('no-webgl');
    const cv = card.querySelector('.gl-canvas');
    if (cv) cv.style.display = 'none';
  }

  /* ---------- generic UI wiring around the static markup ---------- */
  function wireUI(card) {
    const ranges = {}, segs = {}, clicks = {};
    const roEls = {}, hudEl = card.querySelector('[data-hud]');

    /* unit suffixes live in data-unit of the <output>; capture them now */
    card.querySelectorAll('output[data-out]').forEach(o => {
      o.dataset.unit = o.dataset.unit || '';
    });

    card.querySelectorAll('input[type="range"][data-ctl]').forEach(inp => {
      const key = inp.dataset.ctl;
      ranges[key] = { subs: [] };
      const fire = v => {
        ranges[key].subs.forEach(cb => { try { cb(v, inp); } catch (e) {} });
        const out = card.querySelector('output[data-out="' + key + '"]');
        if (out && !out.dataset.raw) {
          const dp = ((inp.step.split('.')[1] || '').length) | 0;
          out.textContent = v.toFixed(dp) + (out.dataset.unit || '');
        }
      };
      inp.addEventListener('input', () => fire(parseFloat(inp.value)));
      /* prime the initial display value from the markup defaults */
      fire(parseFloat(inp.value));
    });

    card.querySelectorAll('.geo-seg').forEach(grp => {
      grp.querySelectorAll('.geo-seg__btn').forEach(btn => {
        const key = btn.dataset.ctl;
        btn.addEventListener('click', () => {
          grp.querySelectorAll('.geo-seg__btn').forEach(x => {
            x.classList.remove('is-on'); x.setAttribute('aria-checked', 'false');
          });
          btn.classList.add('is-on'); btn.setAttribute('aria-checked', 'true');
          (segs[key] || []).forEach(cb => {
            try { cb(btn.dataset.value, btn); } catch (e) {}
          });
        });
      });
    });

    card.querySelectorAll('button[data-ctl]').forEach(btn => {
      if (btn.closest('.geo-seg')) return;    // segmented radios handled above
      const key = btn.dataset.ctl;
      btn.addEventListener('click', () => (clicks[key] || []).forEach(cb => {
        try { cb(btn); } catch (e) {}
      }));
    });

    card.querySelectorAll('[data-ro]').forEach(el => { roEls[el.dataset.ro] = el; });

    return {
      rangeValue(key) {
        const inp = card.querySelector('input[data-ctl="' + key + '"]');
        return inp ? parseFloat(inp.value) : 0;
      },
      setOutUnit(key, unit) {
        const out = card.querySelector('output[data-out="' + key + '"]');
        if (out) out.dataset.unit = unit;
      },
      onRange(key, cb) {
        const r = (ranges[key] = ranges[key] || { subs: [] });
        r.subs.push(cb);
        try { cb(this.rangeValue(key)); } catch (e) {}
      },
      onSeg(key, cb) { (segs[key] = segs[key] || []).push(cb); },
      onClick(key, cb) { (clicks[key] = clicks[key] || []).push(cb); },
      ro(key, text) { const el = roEls[key]; if (el) el.textContent = text; },
      hud(html) { if (hudEl) hudEl.innerHTML = html; },
      card
    };
  }

  /* ---------- mount one instrument card ---------- */
  function mountInstrument(card, def) {
    const canvas = card.querySelector('.gl-canvas');
    const ui = wireUI(card);
    const inst = {
      card, canvas, ui, mod: null, mounted: false, visible: false, _inView: false,
      t: 0, disposed: false
    };

    if (typeof THREE === 'undefined' || !webglAvailable()) {
      showFallback(card);                    // smooth static SVG preview instead
      return inst;
    }

    const doMount = () => {
      if (inst.mounted || inst.disposed) return;
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;     // retry when layout settles
      inst.mounted = true;
      try {
        inst.mod = def.init(canvas, ui, inst, PERF) || {};
      } catch (e) {
        inst.mounted = false;
        showFallback(card);                  // context loss / driver quirk → fallback
        console.warn('[GeoWeb] instrument failed to initialise:', card.id, e);
      }
    };

    /* IntersectionObserver gate — render loops run only when visible */
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        inst._inView = e.intersectionRatio > 0.03;
        if (inst._inView && !inst.mounted) doMount();
        inst.visible = inst._inView && !document.hidden;
      }), { threshold: [0, 0.03, 0.25], rootMargin: '160px' });
      io.observe(card);
      inst._io = io;
    } else {
      doMount(); inst.visible = true;
    }

    /* safety sweep for deep-links / browsers that delay IO callbacks */
    const sweep = () => { if (!inst.mounted) doMount(); };
    setTimeout(sweep, 500);
    ['scroll', 'touchstart', 'pointerdown'].forEach(ev =>
      window.addEventListener(ev, sweep, { passive: true, once: true }));

    ensureLoop();
    INSTANCES.push(inst);
    return inst;
  }

  /* ---------- public API ---------- */
  function register(def) { REGISTRY.push(def); }

  function boot(containerSel) {
    const root = document.querySelector(containerSel);
    if (!root) return;
    REGISTRY.forEach(def => {
      const card = root.querySelector('[data-module="' + def.id + '"]');
      if (card) mountInstrument(card, def);
    });
  }

  return { register, boot, PERF };
})();
