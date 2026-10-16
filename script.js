/* ==========================================================================
   SUJAN PAUDYAL PORTFOLIO — LEGACY SCRIPT (kept for reference only)

   NOTE: index.html no longer loads this file. All essential content is
   pre-rendered as static HTML, and interactivity lives in js/main.js
   (enhancement-only). This legacy script previously:
     · typewrote the hero headline (removed — metaphor-heavy, JS-dependent),
     · rendered <span> elements directly inside <ul> containers (invalid —
       replaced by proper <li> elements in js/main.js and CSS selectors
       updated to target li),
     · initialised Leaflet immediately (now on-demand via <details>).

   It is retained so nothing breaks if an older cached page still references
   it, but every module below now checks for its target element first and
   exits harmlessly when that element is absent from the static markup.
   ========================================================================== */

'use strict';

/* ---- 1. Typewriter: DISABLED. The hero heading is real text in HTML. ---- */

/* ---- 2. Page features ---- */
document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll reveal — only affects elements explicitly marked .reveal-on-scroll */
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if (revealElements.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach(el => el.classList.add('visible'));
    } else {
      const obs = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
        });
      }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
      revealElements.forEach(el => { el.classList.add('reveal'); obs.observe(el); });
    }
  }

  /* Mobile navigation guard — js/main.js owns the current nav markup.
     If both scripts ever load, main.js's handlers are identical/idempotent. */

  /* Lightbox: managed by js/main.js with a proper focus trap. Nothing here. */

  /* Copy buttons: managed by js/main.js. Nothing here. */
});

/* ---- 3. Field map: handled on-demand by js/main.js (Leaflet optional). ---- */

/* ---- 4. Smooth scroll: native CSS scroll-behavior with reduced-motion
       override already exists in css/strata.css. No polyfill needed. ---- */

/* ---- 5. Lazy images: native loading="lazy" attributes used throughout. ---- */

/* ---- 6. Global error reporter (sandbox environments only) ---- */
(function setupErrorReporting() {
  if (window.self === window.top) return;
  const reported = new Set();
  window.addEventListener('error', (event) => {
    if (!event || !event.message) return;
    const key = `${event.message}|${event.filename || ''}|${event.lineno || 0}`;
    if (reported.has(key)) return;
    reported.add(key);
    try {
      window.parent.postMessage({
        type: 'sandbox-runtime-error',
        payload: {
          message: String(event.message).slice(0, 500),
          filename: event.filename || '',
          lineno: event.lineno || 0,
          colno: event.colno || 0,
          stack: event.error && event.error.stack ? String(event.error.stack).slice(0, 2000) : ''
        }
      }, '*');
    } catch (e) { /* silently fail */ }
  });
})();
