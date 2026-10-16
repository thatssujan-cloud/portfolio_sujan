/* ==========================================================================
   STRATA MAIN — ENHANCEMENT LAYER ONLY
   All essential content (biography, qualifications, skills, experience,
   projects, research, education, field sites, contact) is pre-rendered as
   static HTML in index.html. This script never blocks recruiters from
   reading it: if data.js, GSAP, Three.js or Leaflet fail to load, the page
   still works. Here we only ADD interactivity:
     · mobile navigation (aria-expanded, Escape, close on select)
     · scroll-reveal + active-nav highlighting
     · accordion behaviour for the statically rendered project/research cards
     · gallery rendering + accessible lightbox (focus trap, Esc, arrows)
     · mentor photos + testimonials + map legend (decorative enrichment)
     · Leaflet map initialised ON DEMAND (when its <details> is opened)
     · copy buttons for email/phone
   ========================================================================== */
'use strict';

const D = window.STRATA_DATA || null;

/* ---------- tiny DOM helpers ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* Safe element factory: plain text via textContent, structure via child
   elements. Never interpolates untrusted strings into innerHTML. */
function make(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = text;
  return n;
}
function makeLink(href, text, opts = {}) {
  const a = make('a', opts.cls, text);
  a.href = href;
  if (opts.download) a.setAttribute('download', '');
  if (opts.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  return a;
}
function makeImg(src, alt, w, h, lazy = true) {
  const img = make('img');
  img.src = src;
  img.alt = alt || '';
  if (w) img.width = w;
  if (h) img.height = h;
  if (lazy) { img.loading = 'lazy'; } else { img.loading = 'eager'; }
  img.decoding = 'async';
  return img;
}
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ==========================================================================
   1. MOBILE NAVIGATION — open/close, aria-expanded, Escape, close on select
   ========================================================================== */
function initNav() {
  const header = $('.site-header');
  const links = $$('.primary-nav a');
  const sections = $$('main section[id]');

  // Header state + active link (throttled with rAF)
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('scrolled', window.scrollY > 30);
      let current = '';
      sections.forEach(s => { if (window.scrollY >= s.offsetTop - 140) current = s.id; });
      links.forEach(l => {
        const active = l.getAttribute('href') === `#${current}`;
        l.classList.toggle('active', active);
        active ? l.setAttribute('aria-current', 'location') : l.removeAttribute('aria-current');
      });
      ticking = false;
    });
  }, { passive: true });

  const toggle = $('.nav-toggle'), nav = $('#primary-nav');
  if (!toggle || !nav) return;
  const setMenu = open => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    if (open) {
      const first = $('a', nav);
      if (first) setTimeout(() => first.focus(), 60);
    }
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setMenu(false);
      toggle.focus();
    }
  });
}

/* ==========================================================================
   2. SCROLL REVEALS (all content visible without JS / reduced motion)
   ========================================================================== */
function initReveals() {
  const targets = $$('.reveal, .reveal-shift');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    targets.forEach(t => t.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });
  targets.forEach(t => io.observe(t));
}

/* ==========================================================================
   3. ACCORDION — statically rendered project & research case-study cards
   ========================================================================== */
function initCores() {
  $$('.core-sample').forEach(sample => {
    const triggers = $$('.core-trigger:not([hidden]), .core-summary', sample);
    const detail = $('.core-detail', sample);
    if (detail) detail.setAttribute('role', 'region');

    const setOpen = open => {
      sample.classList.toggle('is-open', open);
      triggers.forEach(t => t.setAttribute('aria-expanded', String(open)));
      if (window.Seismo) window.Seismo.trigger(open ? 1.2 : 0.5);
    };
    triggers.forEach(t => t.addEventListener('click', () => {
      const willOpen = !sample.classList.contains('is-open');
      $$('.core-sample.is-open').forEach(o => {
        if (o !== sample) {
          o.classList.remove('is-open');
          $$('.core-trigger, .core-summary', o).forEach(x => x.setAttribute('aria-expanded', 'false'));
        }
      });
      setOpen(willOpen);
    }));
  });
}

/* ==========================================================================
   4. GALLERY + LIGHTBOX (rendered here because the lightbox needs a JS-managed
   focus trap; static equivalents exist as captions inside each figure)
   ========================================================================== */
const GALLERY = D ? D.gallery : [];

function renderGallery() {
  const grid = $('#gallery-grid');
  if (!grid || !GALLERY.length) return;
  GALLERY.forEach((g, i) => {
    const fig = make('figure', 'gallery-item reveal');
    const btn = make('button', 'gallery-trigger');
    btn.type = 'button';
    btn.dataset.index = String(i);
    btn.setAttribute('aria-label', `View larger image: ${g.alt}`);
    btn.appendChild(makeImg(g.src, g.alt, 800, 600, true));
    const cap = make('figcaption', null, g.caption);
    fig.appendChild(btn);
    fig.appendChild(cap);
    grid.appendChild(fig);
  });
}

function initLightbox() {
  const box = $('#lightbox'), img = $('#lightbox-img'), cap = $('#lightbox-caption');
  if (!box || !GALLERY.length) return;
  let idx = -1, lastFocus = null;

  const focusables = () => $$('button, [href], input, [tabindex]:not([tabindex="-1"])', box)
    .filter(el => el.offsetParent !== null);

  function open(i) {
    const g = GALLERY[i];
    if (!g) return;
    lastFocus = document.activeElement;
    idx = i;
    img.src = g.src; img.alt = g.alt;
    cap.textContent = g.caption;
    box.removeAttribute('hidden');
    requestAnimationFrame(() => box.classList.add('open'));
    document.body.style.overflow = 'hidden';
    setTimeout(() => { const c = $('.lightbox-close', box); if (c) c.focus(); }, 80);
    if (window.Seismo) window.Seismo.trigger(0.9);
  }
  function close() {
    if (box.classList.contains('open')) {
      box.classList.remove('open');
      setTimeout(() => box.setAttribute('hidden', ''), 350);
    } else {
      box.setAttribute('hidden', '');
    }
    document.body.style.overflow = '';
    idx = -1;
    if (lastFocus && lastFocus.isConnected) lastFocus.focus();
  }
  function nav(dir) {
    if (idx < 0) return;
    open((idx + dir + GALLERY.length) % GALLERY.length);
  }

  document.addEventListener('click', e => {
    const trigger = e.target.closest && e.target.closest('.gallery-trigger');
    if (trigger && trigger.dataset.index !== undefined) {
      open(parseInt(trigger.dataset.index, 10));
    }
  });
  $('.lightbox-close', box).addEventListener('click', close);
  $('.lightbox-prev', box).addEventListener('click', () => nav(-1));
  $('.lightbox-next', box).addEventListener('click', () => nav(1));
  box.addEventListener('click', e => { if (e.target === box) close(); });

  document.addEventListener('keydown', e => {
    if (box.hasAttribute('hidden')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); nav(-1); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); nav(1); return; }
    if (e.key === 'Tab') {
      // Focus trap: keep Tab cycling within the dialog only
      const f = focusables();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });
}

/* ==========================================================================
   5. MENTOR PHOTOS + TESTIMONIALS + MAP LEGEND (enrichment from data.js)
   ========================================================================== */
function renderEnrichments() {
  if (!D) return;

  /* Mentors strip */
  const strip = $('#mentor-strip');
  if (strip) {
    (D.mentors?.photos || []).forEach(p => {
      const fig = make('figure', 'mentor-photo reveal');
      fig.appendChild(makeImg(p.src, p.alt, 600, 450, true));
      fig.appendChild(make('figcaption', null, p.caption));
      strip.appendChild(fig);
    });
  }

  /* Testimonials */
  const tgrid = $('#testimonials-grid');
  if (tgrid) {
    (D.testimonials || []).forEach(t => {
      const card = make('article', 'testimonial-card reveal');
      card.appendChild(make('span', 'testimonial-badge', t.badge));
      const bq = make('blockquote', 'testimonial-content');
      bq.appendChild(make('p', 'testimonial-text', `“${t.text}”`));
      card.appendChild(bq);
      const footer = make('footer', 'testimonial-author');
      const avatar = make('span', 'author-avatar', t.initials);
      avatar.setAttribute('aria-hidden', 'true');
      const info = make('span', 'author-info');
      info.appendChild(make('span', 'author-name', t.name));
      info.appendChild(make('span', 'author-role', t.role));
      footer.appendChild(avatar);
      footer.appendChild(info);
      card.appendChild(footer);
      tgrid.appendChild(card);
    });
  }

  /* Map legend buttons */
  const legendList = $('#map-legend-list');
  if (legendList) {
    (D.mapSites || []).forEach(s => {
      const li = make('li');
      const btn = make('button', 'map-legend-item');
      btn.type = 'button';
      btn.dataset.site = s.id;
      btn.setAttribute('aria-pressed', 'false');
      const dot = make('span', `legend-dot legend-dot--${s.type}`);
      dot.setAttribute('aria-hidden', 'true');
      const txt = make('span', 'legend-text');
      txt.appendChild(make('strong', null, s.name));
      txt.appendChild(make('em', null, s.org));
      btn.appendChild(dot);
      btn.appendChild(txt);
      li.appendChild(btn);
      legendList.appendChild(li);
    });
  }
}

/* ==========================================================================
   6. FIELD MAP (Leaflet) — initialised ON DEMAND when the <details> opens,
   and only if Leaflet loaded. Text list of sites is already in the HTML.
   ========================================================================== */
let mapInited = false, mapInstance = null;

function initMap() {
  const mapEl = $('#travelMap');
  if (!mapEl || mapInited || typeof L === 'undefined' || !D) return;
  mapInited = true;

  const PIN_COLORS = { work: '#c98d5f', research: '#6aaee6', study: '#d8b25f' };
  try {
    mapInstance = L.map(mapEl, {
      center: [28.3949, 84.124], zoom: 7, minZoom: 6, maxZoom: 17,
      scrollWheelZoom: false, keyboard: true, zoomControl: true
    });
  } catch (e) { mapInited = false; return; }

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(mapInstance);

  const markers = {};
  const legendBtns = $$('.map-legend-item');
  const setActive = id => legendBtns.forEach(b => {
    const on = b.dataset.site === id;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', String(on));
  });

  (D.mapSites || []).forEach(site => {
    const pinSpan = document.createElement('span');
    pinSpan.style.color = PIN_COLORS[site.type] || PIN_COLORS.work;
    pinSpan.style.fontSize = '30px';
    pinSpan.style.lineHeight = '1';
    pinSpan.setAttribute('aria-hidden', 'true');
    pinSpan.textContent = '📍';
    const icon = L.divIcon({
      html: pinSpan.outerHTML,
      className: 'custom-map-pin',
      iconSize: [34, 34], iconAnchor: [17, 30], popupAnchor: [0, -28]
    });
    const m = L.marker(site.coords, {
      icon, title: site.name, alt: `${site.name} — ${site.org}`, riseOnHover: true, keyboard: true
    }).addTo(mapInstance);

    // Accessible popup built with explicit DOM nodes (no innerHTML interpolation)
    const pop = document.createElement('div');
    pop.className = 'map-popup';
    const role = document.createElement('span'); role.className = 'map-popup-role'; role.textContent = site.role;
    const name = document.createElement('strong'); name.className = 'map-popup-title'; name.textContent = site.name;
    const org = document.createElement('span'); org.className = 'map-popup-org'; org.textContent = site.org;
    pop.append(role, name, org);
    m.bindPopup(pop);

    m.on('click', () => setActive(site.id));
    markers[site.id] = m;
  });

  legendBtns.forEach(btn => btn.addEventListener('click', () => {
    const site = (D.mapSites || []).find(s => s.id === btn.dataset.site);
    if (!site || !markers[site.id]) return;
    mapInstance.flyTo(site.coords, site.zoom, { duration: reduceMotion ? 0 : 0.9 });
    markers[site.id].openPopup();
    setActive(site.id);
    if (window.Seismo) window.Seismo.trigger(0.6);
  }));

  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => mapInstance && mapInstance.invalidateSize(), 250);
  });
}

function initMapOnDemand() {
  const details = $('.map-details');
  if (!details) return;
  details.addEventListener('toggle', () => {
    if (details.open) {
      initMap();
      if (mapInstance) setTimeout(() => mapInstance.invalidateSize(), 60);
    }
  });
}

/* ==========================================================================
   7. COPY BUTTONS for email / phone (accessible feedback)
   ========================================================================== */
function initCopyButtons() {
  $$('#contact-details a[href^="mailto:"], #contact-details a[href^="tel:"]').forEach(link => {
    if (link.nextElementSibling && link.nextElementSibling.classList.contains('copy-btn')) return;
    const value = link.textContent.trim();
    const btn = make('button', 'copy-btn', 'Copy');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Copy ${value} to clipboard`);
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(value);
        btn.textContent = 'Copied ✓';
        const live = make('span', 'sr-only', `Copied ${value} to clipboard`);
        live.setAttribute('role', 'status');
        live.setAttribute('aria-live', 'polite');
        btn.appendChild(live);
      } catch (e) { btn.textContent = 'Ctrl+C'; }
      setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
    });
    link.insertAdjacentElement('afterend', btn);
  });
}

/* ==========================================================================
   BOOT — enhancement only; wrapped so one failure cannot break the rest
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  [initNav, initReveals, initCores, renderGallery, initLightbox,
   renderEnrichments, initMapOnDemand, initCopyButtons]
    .forEach(fn => { try { fn(); } catch (err) { console.warn('Optional enhancement skipped:', fn.name, err); } });
});
