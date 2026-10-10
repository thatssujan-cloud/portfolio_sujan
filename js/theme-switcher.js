/* ==========================================================================
   THEME SWITCHER — light / dark "Sunlit Plateau vs. Dusk Basin"
   Runs early (deferred, before main.js) and:
     · restores the saved theme (localStorage) or follows prefers-color-scheme
     · toggles [data-theme] on <html>, updates aria state + meta theme-color
     · fires document event 'strata:themechange' so canvas modules (the
       seismograph ink, hero crystal fog) can re-read CSS variables
     · adds a temporary .theming class for a smooth cross-fade of all colors
   ========================================================================== */
'use strict';

(function initThemeSwitcher() {
  const root = document.documentElement;
  const KEY = 'strata-theme';

  function preferred() {
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light' : 'dark';
  }

  function apply(theme, animate) {
    if (animate) {
      root.classList.add('theming');
      clearTimeout(apply._t);
      apply._t = setTimeout(() => root.classList.remove('theming'), 520);
    }
    root.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f7f2e8' : '#17151f');
    document.dispatchEvent(new CustomEvent('strata:themechange', { detail: { theme } }));
  }

  // Apply stored/system theme immediately to avoid a flash of the wrong palette.
  let current = preferred();
  apply(current, false);

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    const syncBtn = theme => {
      const toLight = theme === 'dark';
      btn.setAttribute('aria-pressed', String(theme === 'light'));
      btn.setAttribute('aria-label', toLight ? 'Switch to light mode' : 'Switch to dark mode');
      btn.title = toLight ? 'Switch to light mode' : 'Switch to dark mode';
    };
    syncBtn(current);

    btn.addEventListener('click', () => {
      current = current === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(KEY, current); } catch (e) { /* ignore */ }
      apply(current, true);
      syncBtn(current);
      if (window.Seismo) window.Seismo.trigger(0.8); // little quake when the sun rises
    });

    // Follow OS changes only while the user has not chosen explicitly.
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
        let saved = null;
        try { saved = localStorage.getItem(KEY); } catch (err) { /* ignore */ }
        if (saved) return;
        current = e.matches ? 'light' : 'dark';
        apply(current, true);
        syncBtn(current);
      });
    }
  });
})();
