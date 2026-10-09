/* ==========================================================================
   GEO LABS — CORE FRAMEWORK
   Registry + lifecycle manager for the 20 interactive geological modules.

   Each module is registered with window.GeoLabs.register({id, title, cat,
   desc, controls, init}). The framework:
     • builds a consistent .geo-lab card shell (canvas + control bar + readout)
     • lazy-mounts each lab only while it is near/inside the viewport
       (IntersectionObserver) — everything off-screen costs zero CPU
     • runs ONE shared requestAnimationFrame loop for all live labs (60fps)
     • halves particle counts / DPR on low-end or mobile devices
     • respects prefers-reduced-motion (static frame instead of animation)
     • fires window.Seismo.trigger() so the site seismograph reacts to quakes

   Module contract returned by init(canvas, ctx, lab, core):
     { step(dt, t, w, h), [controls], [onResize(w,h)], [dispose()] }
   `lab.v` is the reactive state object; `lab.ui` holds created widgets.
   ========================================================================== */
'use strict';

window.GeoLabs = (function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const smallScreen = Math.min(screen.width, screen.height) < 700;
  const lowEnd = coarse && smallScreen || (navigator.hardwareConcurrency || 8) <= 4;

  const PERF = {
    reduceMotion,
    mobile: coarse,
    lowEnd,
    dpr: Math.min(window.devicePixelRatio || 1, lowEnd ? 1 : 2),
    /* scale a "full" particle count down for weak devices */
    p(n) { return Math.max(8, Math.round(n * (lowEnd ? 0.35 : coarse ? 0.6 : 1))); },
    clamp(v, a, b) { return v < a ? a : v > b ? b : v; },
    lerp(a, b, t) { return a + (b - a) * t; },
    rand(a, b) { return a + Math.random() * (b - a); },
    TAU: Math.PI * 2
  };

  const REGISTRY = [];      // module definitions
  const INSTANCES = [];     // live lab instances
  let rafId = null, lastTs = 0;

  /* ---------- shared master loop ---------- */
  function loop(ts) {
    rafId = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    for (let i = 0; i < INSTANCES.length; i++) {
      const inst = INSTANCES[i];
      if (!inst.mounted || !inst.visible || inst._hidden) continue;
      inst.t += dt;
      try { inst.mod.step && inst.mod.step(dt, inst.t, inst.w, inst.h, inst); }
      catch (e) { /* a misbehaving lab must not kill the loop */ }
    }
  }
  function ensureLoop() { if (rafId === null) { lastTs = performance.now(); rafId = requestAnimationFrame(loop); } }

  /* ---------- pause when tab hidden ---------- */
  document.addEventListener('visibilitychange', () => {
    INSTANCES.forEach(i => { i._hidden = document.hidden; if (!document.hidden) i.lastTs = 0; });
  });

  /* ---------- attachCustom: run an arbitrary canvas through the same loop
     (used by the hero strata background). Visibility-gated like labs. ------ */
  function attachCustom(canvas, stepFn) {
    const inst = { mod: { step: (dt, t, w, h) => stepFn(dt, t, w, h) }, mounted: true,
                   visible: false, _hidden: false, _inView: false, t: 0, w: 0, h: 0, dpr: PERF.dpr };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      inst.w = r.width; inst.h = r.height;
      canvas.width = Math.round(r.width * inst.dpr);
      canvas.height = Math.round(r.height * inst.dpr);
      const c = canvas.getContext('2d');
      c && c.setTransform(inst.dpr, 0, 0, inst.dpr, 0, 0);
    };
    window.addEventListener('resize', resize, { passive: true });
    resize();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => es.forEach(e => {
        inst._inView = e.intersectionRatio > 0.02;
        inst.visible = inst._inView && !inst._hidden;
      }), { threshold: [0, 0.02] }).observe(canvas);
    } else { inst.visible = true; }
    INSTANCES.push(inst);
    ensureLoop();
  }

  /* ---------- widget factory ---------- */
  function makeControl(lab, def) {
    const wrap = document.createElement('label');
    wrap.className = 'geo-ctl geo-ctl--' + def.type;

    if (def.type === 'range') {
      const name = document.createElement('span');
      name.className = 'geo-ctl__name'; name.textContent = def.label;
      const val = document.createElement('output');
      val.className = 'geo-ctl__val';
      const input = document.createElement('input');
      input.type = 'range';
      input.min = def.min ?? 0; input.max = def.max ?? 100;
      input.step = def.step ?? 1; input.value = def.value ?? 50;
      input.setAttribute('aria-label', def.label);
      const sync = () => {
        const v = parseFloat(input.value);
        val.textContent = (def.format ? def.format(v) : v) + (def.unit || '');
        def.onInput && def.onInput(v, lab);
      };
      input.addEventListener('input', sync);
      wrap.append(name, input, val);
      lab.ui[def.key || def.label] = input;
      requestAnimationFrame(sync);           // prime initial value
      if (def.fill) {                        // strain-gauge style: JS drives value
        lab.set = v => { input.value = v; sync(); };
      }
    } else if (def.type === 'seg') {         // segmented radio buttons
      const name = document.createElement('span');
      name.className = 'geo-ctl__name'; name.textContent = def.label;
      const grp = document.createElement('span');
      grp.className = 'geo-seg'; grp.setAttribute('role', 'radiogroup');
      grp.setAttribute('aria-label', def.label);
      def.options.forEach((o, idx) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'geo-seg__btn'; b.textContent = o.label;
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(idx === (def.index || 0)));
        if (idx === (def.index || 0)) b.classList.add('is-on');
        b.addEventListener('click', () => {
          grp.querySelectorAll('.geo-seg__btn').forEach(x => { x.classList.remove('is-on'); x.setAttribute('aria-checked', 'false'); });
          b.classList.add('is-on'); b.setAttribute('aria-checked', 'true');
          def.onChange && def.onChange(o.value !== undefined ? o.value : idx, lab);
        });
        grp.appendChild(b);
      });
      wrap.append(name, grp);
    } else if (def.type === 'toggle') {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'geo-toggle'; b.textContent = def.label;
      b.setAttribute('aria-pressed', String(!!def.value));
      const flip = () => {
        const on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(on));
        def.onChange && def.onChange(on, lab);
      };
      b.addEventListener('click', flip);
      wrap.appendChild(b);
      lab.ui[def.key || def.label] = b;
    } else if (def.type === 'readout') {     // live numeric display (updated by module)
      const span = document.createElement('span');
      span.className = 'geo-readout';
      span.innerHTML = `<em>${def.label}</em><b data-ro="${def.key}">—</b>`;
      wrap.appendChild(span);
      lab.ro = lab.ro || {};
      lab.ro[def.key] = span.querySelector('b');
    }
    return wrap;
  }

  /* ---------- build one lab card ---------- */
  function buildCard(def) {
    const card = document.createElement('article');
    card.className = 'geo-lab reveal';
    card.id = 'geolab-' + def.id;
    card.dataset.cat = def.cat;

    const head = document.createElement('div');
    head.className = 'geo-lab__head';
    head.innerHTML =
      `<span class="geo-lab__num">${String(def.num).padStart(2, '0')}</span>
       <div><h4 class="geo-lab__title">${def.title}</h4>
       <p class="geo-lab__desc">${def.desc}</p></div>
       <span class="geo-lab__cat">${def.catLabel}</span>`;

    const stage = document.createElement('div');
    stage.className = 'geo-lab__stage';
    const canvas = document.createElement('canvas');
    canvas.className = 'geo-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', def.title + ' — interactive animation');
    stage.appendChild(canvas);
    if (def.overlay) {
      const ov = document.createElement('p');
      ov.className = 'geo-hint'; ov.textContent = def.overlay;
      stage.appendChild(ov);
    }

    const bar = document.createElement('div');
    bar.className = 'geo-lab__bar';

    card.append(head, stage, bar);
    return { card, canvas, bar, stage };
  }

  function staticFrame(inst) {
    /* prefers-reduced-motion: draw a single frame, never animate */
    try {
      inst.mod.step && inst.mod.step(0.016, 3, inst.w, inst.h, inst);
      inst.mod.step && inst.mod.step(0.016, 6.1, inst.w, inst.h, inst);
    } catch (e) {}
  }

  function mount(inst) {
    if (inst.mounted) return;
    inst.mounted = true;
    const { def, canvas, lab } = inst;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;                       // no 2D context → skip this lab
    lab.ctx = ctx;
    lab.v = def.initState ? JSON.parse(JSON.stringify(def.initState)) : {};
    lab.seismo = i => window.Seismo && window.Seismo.trigger(i);
    inst.mod = def.init(canvas, ctx, lab, PERF) || {};
    inst.mod.ctx = ctx;
    inst.resize();
    if (PERF.reduceMotion) { staticFrame(inst); return; }
    ensureLoop();
  }

  /* ---------- public: register & render ---------- */
  function register(def) { REGISTRY.push(def); }

  function renderInto(containerSel) {
    const container = document.querySelector(containerSel);
    if (!container) return;
    const groups = {};
    REGISTRY.forEach(d => (groups[d.cat] = groups[d.cat] || []).push(d));

    Object.keys(groups).forEach(cat => {
      let sec = container.querySelector('[data-geo-cat="' + cat + '"]');
      if (!sec) {
        sec = document.createElement('div');
        sec.className = 'geo-cat';
        sec.dataset.geoCat = cat;
        const h = document.createElement('h3');
        h.className = 'geo-cat__title reveal';
        h.textContent = groups[cat][0].catLabel.toUpperCase();
        const grid = document.createElement('div');
        grid.className = 'geo-lab-grid';
        sec.append(h, grid);
        container.appendChild(sec);
      }
      const gridEl = sec.querySelector('.geo-lab-grid') || sec;
      groups[cat].forEach(def => {
        const { card, canvas, bar } = buildCard(def);
        gridEl.appendChild(card);

        /* the lab object: controls are bound to it, modules read/write lab.v */
        const lab = { card, canvas, ui: {}, ro: {}, v: {}, seismo: () => {} };
        (def.controls || []).forEach(c => bar.appendChild(makeControl(lab, c)));

        const inst = { def, card, canvas, lab, mod: null, mounted: false, visible: false,
                       _hidden: false, _inView: false, t: 0, w: 0, h: 0, dpr: PERF.dpr };
        lab.inst = inst;

        inst.resize = () => {
          const r = canvas.getBoundingClientRect();
          if (!r.width) return;
          const same = Math.abs(r.width - inst.w) < 1 && Math.abs(r.height - inst.h) < 1;
          inst.w = r.width; inst.h = r.height;
          canvas.width = Math.round(r.width * inst.dpr);
          canvas.height = Math.round(r.height * inst.dpr);
          if (inst.mounted) {
            inst.mod.ctx && inst.mod.ctx.setTransform(inst.dpr, 0, 0, inst.dpr, 0, 0);
            if (!same) { inst.mod.onResize && inst.mod.onResize(r.width, r.height, inst); }
            if (PERF.reduceMotion) staticFrame(inst);
          }
        };

        /* lazy mount + visibility gating (single authoritative observer) */
        if ('IntersectionObserver' in window) {
          const io = new IntersectionObserver(es => es.forEach(e => {
            inst._inView = e.intersectionRatio > 0.06;
            if (inst._inView && !inst.mounted) mount(inst);
            inst.visible = inst._inView && !inst._hidden;
          }), { threshold: [0, 0.06, 0.3], rootMargin: '140px' });
          io.observe(card);
        } else {
          mount(inst); inst.visible = true;
        }

        window.addEventListener('resize', () => inst.resize(), { passive: true });
        INSTANCES.push(inst);
      });
    });
  }

  return { register, renderInto, attachCustom, PERF, reduceMotion };
})();
