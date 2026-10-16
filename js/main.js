/* ==========================================================================
   STRATA MAIN — ENHANCEMENT LAYER + STATIC FALLBACKS
   Essential content (biography, qualifications, skills, experience,
   projects, research, education, places, mentors, testimonials, contact)
   is pre-rendered as static HTML in index.html. The gallery, mentor photos,
   testimonials and map legend are ALSO rendered statically inside
   <noscript>, so they remain visible even if JavaScript is disabled or a
   CDN script fails. When JS runs normally this script renders the richer,
   interactive versions from data.js into the same containers:
     · mobile navigation (aria-expanded, Escape, close on select)
     · scroll-reveal + active-nav highlighting (with safety sweep)
     · accordion behaviour for the statically rendered project/research cards
     · gallery rendering + accessible lightbox (focus trap, Esc, arrows)
     · mentor photos + testimonials + map legend (decorative enrichment)
     · Leaflet map initialised on load, with retry if the CDN script is still loading
     · copy buttons for email/phone
   ========================================================================== */
'use strict';

/* If data.js failed to load, keep going anyway — every other enhancement
   must still work instead of throwing at parse time. */
const D = window.STRATA_DATA || { gallery: [], testimonials: [], mentors: { photos: [] }, mapSites: [] };

/* ---------- tiny DOM helpers ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* Safe element factory: plain text via textContent, structure via child
   elements. Never interpolates untrusted strings into innerHTML. Accepts a
   string OR an already-built Element as the third argument. */
function make(tag, cls, content) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (content instanceof Node) n.appendChild(content);
  else if (content !== undefined && content !== null) n.textContent = content;
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
  const revealAll = () => $$('.reveal:not(.visible), .reveal-shift:not(.visible)')
    .forEach(t => t.classList.add('visible'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealAll();
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, .reveal-shift').forEach(t => io.observe(t));

  /* Safety sweep: anything still hidden after load (e.g. elements that were
     inside a collapsed container when first observed, or missed by the
     observer on fast scrolls) is revealed once the page has settled. This
     guarantees no section can stay blank. */
  window.addEventListener('load', () => {
    requestAnimationFrame(() => {
      $$('.reveal:not(.visible), .reveal-shift:not(.visible)').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 1.2) el.classList.add('visible');
      });
    });
  });
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
const GALLERY = D.gallery || [];

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
   Shared builders are also reused for the <noscript> static fallbacks in
   index.html so both versions look identical.
   ========================================================================== */
function buildTestimonialCard(t) {
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
  footer.append(avatar, info);
  card.appendChild(footer);
  return card;
}

function buildMentorFigure(p) {
  const fig = make('figure', 'mentor-photo reveal');
  fig.appendChild(makeImg(p.src, p.alt, 600, 450, true));
  fig.appendChild(make('figcaption', null, p.caption));
  return fig;
}

function buildLegendItem(s) {
  const li = document.createElement('li');
  const btn = make('button', 'map-legend-item');
  btn.type = 'button';
  btn.dataset.site = s.id;
  btn.setAttribute('aria-pressed', 'false');
  const dot = make('span', `legend-dot legend-dot--${s.type}`);
  dot.setAttribute('aria-hidden', 'true');
  const txt = make('span', 'legend-text');
  txt.appendChild(make('strong', null, s.name));
  txt.appendChild(make('em', null, s.org));
  btn.append(dot, txt);
  li.appendChild(btn);
  return li;
}

function renderEnrichments() {
  if (!window.STRATA_DATA) return;

  /* Mentors strip */
  const strip = $('#mentor-strip');
  if (strip) {
    (D.mentors?.photos || []).forEach(p => strip.appendChild(buildMentorFigure(p)));
  }

  /* Testimonials */
  const tgrid = $('#testimonials-grid');
  if (tgrid) {
    (D.testimonials || []).forEach(t => tgrid.appendChild(buildTestimonialCard(t)));
  }

  /* Map legend buttons */
  const legendList = $('#map-legend-list');
  if (legendList) {
    (D.mapSites || []).forEach(s => legendList.appendChild(buildLegendItem(s)));
  }
}

/* ==========================================================================
   6. NEPAL MAP (Leaflet) — the "Places I've Travelled" map is shown inline;
   initialised once Leaflet is available, and fits itself to Nepal's extent.
   Text list of places is in the HTML.
   ========================================================================== */
let mapInited = false, mapInstance = null;

function initMap() {
  const mapEl = $('#travelMap');
  if (!mapEl || mapInited || !window.STRATA_DATA) return;
  // Leaflet may still be loading (CDN script) or blocked (offline/ad-block) —
  // retry briefly, then show a graceful message instead of an empty grey box.
  if (typeof L === 'undefined') {
    if (!(initMap._tries > 20)) {
      initMap._tries = (initMap._tries || 0) + 1;
      setTimeout(initMap, 250);
    } else if (mapEl && !mapEl.dataset.mapUnavailable) {
      mapEl.dataset.mapUnavailable = 'true';
      mapEl.classList.add('map-unavailable');
      mapEl.textContent = 'The interactive map could not load (no network connection). All places are listed above with their coordinates.';
    }
    return;
  }
  mapInited = true;

  // Pin colours match the legend dots in css/strata.css
  const PIN_COLORS = { work: '#52b788', research: '#6aaee6', study: '#d8b25f' };
  try {
    mapInstance = L.map(mapEl, {
      center: [28.3949, 83.9], zoom: 7, minZoom: 5, maxZoom: 17,
      scrollWheelZoom: false, keyboard: true, zoomControl: true
    });
  } catch (e) { mapInited = false; return; }

  // Tile layer with two CDN fallbacks so the map still works if one host fails
  const TILE_SOURCES = [
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
  ];
  let tileIndex = 0, tilesFailed = 0;
  function addTileLayer(url) {
    L.tileLayer(url, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    })
      .on('tileerror', function () {
        tilesFailed += 1;
        // Switch source only if this layer keeps failing (avoid flapping on
        // the occasional single missing tile)
        if (tileIndex < TILE_SOURCES.length - 1 && tilesFailed >= 6) {
          tileIndex += 1;
          tilesFailed = 0;
          mapInstance.removeLayer(this);
          addTileLayer(TILE_SOURCES[tileIndex]);
        }
      })
      .addTo(mapInstance);
  }
  addTileLayer(TILE_SOURCES[0]);

  /* Nepal country boundary — bundled locally (no network dependency), drawn
     as a warm ochre outline that matches the site palette, with a soft fill
     inside the border so the shape clearly reads as "the map of Nepal".
     The map view is then fitted exactly to the country's extent. */
  try {
    fetch('nepal.geojson')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('boundary unavailable'))))
      .then(geo => {
        if (!mapInstance) return;
        const boundary = L.geoJSON(geo, {
          style: { color: '#cf9768', weight: 3, opacity: 0.95, fillColor: '#cf9768', fillOpacity: 0.10 },
          interactive: false
        }).addTo(mapInstance);
        boundary.bringToBack();
        // Fit the whole of Nepal into view (with room for the pins)
        mapInstance.fitBounds(boundary.getBounds().pad(0.06));
      })
      .catch(() => { /* boundary is decorative — tiles already show Nepal */ });
  } catch (e) { /* fetch unsupported — ignore */ }

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
  // Map is displayed inline (no <details> toggle any more) — initialise directly.
  initMap();
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
