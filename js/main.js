/* ==========================================================================
   STRATA MAIN — renders all sections from js/data.js and wires interactivity:
   typewriter headline, tectonic fault parallax, scroll reveals, core-sample
   accordion, lightbox, Leaflet field map, copy buttons, mobile nav.
   GSAP (CDN) drives the fault/strata parallax; IntersectionObserver handles
   reveals. Everything degrades gracefully without JS libraries.
   ========================================================================== */
'use strict';

const D = window.STRATA_DATA;

/* ---------- tiny DOM helpers ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ==========================================================================
   1. RENDER — build every section from data
   ========================================================================== */

/* Avatar images are optional: if a photo file is missing, the initials tile
   remains (onerror removes the <img>). Point `avatar` at a real file in
   js/data.js whenever headshots are available. */
const avatarHTML = t => t.avatar
  ? `${t.initials}<img src="${t.avatar}" alt="" width="48" height="48" loading="lazy" onerror="this.remove()">`
  : t.initials;

function render() {
  /* ---- Hero ---- */
  $('#hero-eyebrow').textContent = D.meta.eyebrow;
  $('#typing-text').textContent = D.meta.tagline;
  $('#hero-lead').textContent = D.hero.lead;
  const actions = $('#hero-actions');
  D.hero.actions.forEach(a => {
    const btn = el('a', `btn btn-${a.style}`, a.label + (a.download ? ' <span aria-hidden="true">↓</span>' : ''));
    btn.href = a.href;
    if (a.download) btn.setAttribute('download', '');
    if (a.target) { btn.target = a.target; btn.rel = 'noopener noreferrer'; }
    actions.appendChild(btn);
  });
  $('#credential').innerHTML = `<span aria-hidden="true">🎓</span> ${D.hero.credential}`;
  const heroImg = $('#hero-photo img');
  heroImg.src = D.hero.photo; heroImg.alt = D.hero.photoAlt;

  /* ---- About ---- */
  $('#about-tagline').textContent = D.about.tagline;
  const paras = $('#about-paras');
  D.about.paragraphs.forEach(p => paras.appendChild(el('p', 'about-lede reveal', p)));
  $('#about-photo img').src = D.about.photo;
  $('#about-photo img').alt = D.about.photoAlt;
  const skills = $('#skill-list');
  D.about.skills.forEach(s => skills.appendChild(el('li', null, s)));
  const stats = $('#about-stats');
  D.about.stats.forEach(st => {
    const row = el('div', 'stat-row reveal');
    row.setAttribute('role', 'listitem');
    row.innerHTML = `
      <span class="stat-layer" data-layer="${st.layer}" aria-hidden="true"></span>
      <span><span class="stat-label">${st.label}</span><span class="stat-value">${st.value}</span></span>
      <span class="badge">${st.badge}</span>`;
    stats.appendChild(row);
  });

  /* ---- Stratigraphic education column ---- */
  const col = $('#edu-column');
  const lithos = [
    'repeating-linear-gradient(0deg, var(--ochre) 0 5px, var(--clay) 5px 10px)',
    'repeating-linear-gradient(45deg, var(--slate-green) 0 6px, #2f4d57 6px 12px)',
    'repeating-linear-gradient(0deg, var(--terracotta) 0 4px, #8f3f22 4px 9px)'
  ];
  D.education.forEach((u, i) => {
    const unit = el('div', 'strat-unit reveal-shift');
    unit.innerHTML = `
      <div class="unit-era">${u.era}<small>Educational Formation</small></div>
      <div class="unit-spine"><span class="unit-node" aria-hidden="true"></span></div>
      <div class="unit-body" style="--litho:${lithos[i % lithos.length]}">
        <h4>${u.degree}</h4>
        <span class="unit-meta">${u.institution} <span class="loc">· ${u.location}</span></span>
        <p>${u.text}</p>
      </div>`;
    col.appendChild(unit);
  });

  /* ---- Experience ---- */
  const expWrap = $('#exp-units');
  D.jobs.forEach(j => {
    const card = el('article', 'exp-card reveal');
    card.innerHTML = `
      <h3>${j.role}</h3>
      <p class="exp-org">${j.org} <span aria-hidden="true">·</span> ${j.project}</p>
      <span class="exp-duration">${j.duration}</span>
      <ul class="exp-list">${j.points.map(p => `<li>${p}</li>`).join('')}</ul>`;
    expWrap.appendChild(card);
  });

  const era1 = el('div', 'era-marker reveal');
  era1.innerHTML = '<span class="chip">Holocene · Field Practice</span><span class="rule"></span><span class="depth">−25 m</span>';
  expWrap.appendChild(era1);
  const grid1 = el('div', 'exp-grid');
  D.internships.forEach(it => {
    const card = el('article', 'exp-card reveal');
    card.innerHTML = `
      <h4>${it.title}</h4>
      <p class="exp-org">${it.org}</p>
      <ul class="exp-list">${it.points.map(p => `<li>${p}</li>`).join('')}</ul>`;
    grid1.appendChild(card);
  });
  expWrap.appendChild(grid1);

  const era2 = el('div', 'era-marker reveal');
  era2.innerHTML = '<span class="chip">Pleistocene · Community Work</span><span class="rule"></span><span class="depth">−60 m</span>';
  expWrap.appendChild(era2);
  const vlist = el('ul', 'volunteer-list reveal');
  D.volunteer.forEach(v => {
    vlist.appendChild(el('li', null, `<strong>${v.name}</strong><span>${v.desc}</span>`));
  });
  expWrap.appendChild(vlist);

  /* ---- Mentors ---- */
  $('#mentors-lead').textContent = D.mentors.lead;
  const strip = $('#mentor-strip');
  D.mentors.photos.forEach(p => {
    const fig = el('figure', 'mentor-photo reveal');
    fig.innerHTML = `
      <img src="${p.src}" alt="${p.alt}" width="600" height="450" loading="lazy" decoding="async">
      <figcaption>${p.caption}</figcaption>`;
    strip.appendChild(fig);
  });

  /* ---- Core samples (projects) ---- */
  const rack = $('#core-rack');
  D.cores.forEach((c, i) => {
    const sample = el('article', 'core-sample reveal');
    sample.id = `core-${c.id}`;
    // lithologic band heights derived deterministically from the core index
    const weights = [26, 18, 30, 14, 12].map(w => w + ((i * 7 + w) % 9));
    const total = weights.reduce((a, b) => a + b, 0);
    const equalBands = c.bands.map((b, k) =>
      `<div class="core-band" style="flex:${weights[k] / total};background:${b}"></div>`
    ).join('');
    sample.innerHTML = `
      <button type="button" class="core-trigger" aria-expanded="false" aria-controls="detail-${c.id}">
        <span class="core-depth-scale" aria-hidden="true"></span>
        <span class="core-tube" style="display:flex;flex-direction:column" aria-hidden="true">${equalBands}</span>
        <span class="sr-only">Drill into ${c.title}</span>
      </button>
      <button type="button" class="core-summary" aria-expanded="false" aria-controls="detail-${c.id}">
        <span class="core-kicker"><span>${c.depth}</span><span class="litho">${c.icon} ${c.lithology}</span></span>
        <h3>${c.title}</h3>
        <p class="tease">${c.meta}</p>
        <span class="core-open-hint">Extract</span>
      </button>
      <div class="core-detail" id="detail-${c.id}">
        <div class="core-detail-inner">
          <div class="core-detail-pad">
            <div>
              <p>${c.summary}</p>
              <ul class="tag-list" aria-label="Topics">${c.tags.map(t => `<span>${t}</span>`).join('')}</ul>
              ${c.link ? `<a class="btn btn-primary" href="${c.link.href}" target="_blank" rel="noopener noreferrer">${c.link.label} →</a>` : ''}
            </div>
            <figure class="core-img">
              <img src="${c.image}" alt="${c.imageAlt}" loading="lazy" decoding="async">
              <span class="thin-section" aria-hidden="true"></span>
            </figure>
          </div>
        </div>
      </div>`;
    rack.appendChild(sample);
  });

  /* ---- Testimonials ---- */
  const tgrid = $('#testimonials-grid');
  D.testimonials.forEach(t => {
    const card = el('article', 'testimonial-card reveal');
    card.innerHTML = `
      <span class="testimonial-badge">${t.badge}</span>
      <blockquote class="testimonial-content"><p class="testimonial-text">“${t.text}”</p></blockquote>
      <footer class="testimonial-author">
        <span class="author-avatar" aria-hidden="true">${avatarHTML(t)}</span>
        <span class="author-info">
          <span class="author-name">${t.name}</span>
          <span class="author-role">${t.role}</span>
        </span>
      </footer>`;
    tgrid.appendChild(card);
  });

  /* ---- Gallery ---- */
  const ggrid = $('#gallery-grid');
  D.gallery.forEach((g, i) => {
    const fig = el('figure', 'gallery-item reveal');
    fig.innerHTML = `
      <button type="button" class="gallery-trigger" data-index="${i}"
        aria-label="View larger image: ${g.alt}">
        <img src="${g.src}" alt="${g.alt}" width="800" height="600" loading="lazy" decoding="async">
      </button>
      <figcaption>${g.caption}</figcaption>`;
    ggrid.appendChild(fig);
  });

  /* ---- Map legend ---- */
  const legendList = $('#map-legend-list');
  D.mapSites.forEach(s => {
    const li = el('li');
    li.innerHTML = `
      <button type="button" class="map-legend-item" data-site="${s.id}" aria-pressed="false">
        <span class="legend-dot legend-dot--${s.type}" aria-hidden="true"></span>
        <span class="legend-text"><strong>${s.name}</strong><em>${s.org}</em></span>
      </button>`;
    legendList.appendChild(li);
  });

  /* ---- Contact ---- */
  $('#contact-intro').textContent = D.contact.intro;
  const details = $('#contact-details');
  D.contact.rows.forEach(r => {
    const row = el('div', 'contact-row');
    let val;
    if (r.href) {
      val = `<a href="${r.href}"${r.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${r.value}</a>`;
    } else val = `<span>${r.value}</span>`;
    row.innerHTML = `<strong>${r.label}:</strong><span class="contact-val">${val}${r.copy ? '' : ''}</span>`;
    if (r.copy) {
      const btn = el('button', 'copy-btn', 'Copy');
      btn.type = 'button';
      btn.setAttribute('aria-label', `Copy ${r.value} to clipboard`);
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(r.value);
          btn.textContent = 'Copied ✓';
          const live = el('span', 'sr-only', `Copied ${r.value} to clipboard`);
          live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
          btn.appendChild(live);
        } catch (e) { btn.textContent = 'Ctrl+C'; }
        setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
      });
      $('.contact-val', row).appendChild(document.createTextNode(' '));
      $('.contact-val', row).appendChild(btn);
    }
    details.appendChild(row);
  });
  $('#languages').innerHTML = `<span aria-hidden="true">🇳🇵</span> <span>${D.contact.languages}</span>`;

  /* ---- Footer ---- */
  $('#footer-copy').textContent = D.footer.copyright;
  const flinks = $('#footer-links');
  D.footer.links.forEach(l => {
    flinks.appendChild(el('li', null, `<a href="#${l.toLowerCase()}">${l}</a>`));
  });
}

/* ==========================================================================
   2. TYPEWRITER HEADLINE
   ========================================================================== */
function initTypewriter() {
  const node = $('#typing-text');
  if (!node || reduceMotion) return;
  const TEXT = node.textContent;
  node.textContent = '';
  let i = 0, deleting = false;
  (function tick() {
    if (!deleting) {
      i++;
      node.textContent = TEXT.slice(0, i);
      if (i === TEXT.length) { deleting = true; setTimeout(tick, 2600); return; }
      setTimeout(tick, 60);
    } else {
      i--;
      node.textContent = TEXT.slice(0, i);
      if (i === 0) { deleting = false; setTimeout(tick, 500); return; }
      setTimeout(tick, 30);
    }
  })();
}

/* ==========================================================================
   3. TECTONIC FAULT PARALLAX (GSAP ScrollTrigger via CDN, with rAF fallback)
   ========================================================================== */
function initParallax() {
  if (reduceMotion) return;

  // Build decorative strata bands inside each stratum
  $$('.stratum').forEach(sec => {
    for (let k = 0; k < 2; k++) {
      const band = el('div', 'band');
      const top = 18 + Math.random() * 64;
      band.style.top = top + '%';
      band.dataset.speed = (k === 0 ? -0.12 : 0.16) + Math.random() * 0.1;
      const hue = ['#b6552e', '#c98d5f', '#7b4f36', '#41697a'][Math.floor(Math.random() * 4)];
      band.innerHTML = `
        <svg viewBox="0 0 1200 90" preserveAspectRatio="none" style="height:70px">
          <path d="M0 ${30 + k * 14} Q 150 ${10 + k * 10}, 300 ${28 + k * 12} T 600 ${26 + k * 14} T 900 ${30 + k * 10} T 1200 ${24 + k * 12} L 1200 90 L 0 90 Z"
                fill="none" stroke="${hue}" stroke-width="2"/>
        </svg>`;
      sec.prepend(band);
    }
  });

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    $$('.band').forEach(band => {
      gsap.to(band, {
        yPercent: parseFloat(band.dataset.speed) * 100,
        ease: 'none',
        scrollTrigger: { trigger: band.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
    // Fault divider plates slide past each other (strike-slip feel)
    $$('.fault').forEach(f => {
      const [a, b] = f.querySelectorAll('.plate-group');
      if (!a || !b) return;
      gsap.to(a, { x: -60, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.to(b, { x: 60, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // Section titles perform a fault-split displacement when entering view
    $$('.section-title').forEach(t => {
      ScrollTrigger.create({
        trigger: t, start: 'top 85%', once: true,
        onEnter: () => t.classList.add('in-view')
      });
    });
  } else {
    // Fallback: lightweight rAF parallax
    const bands = $$('.band');
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        bands.forEach(band => {
          const rect = band.parentElement.getBoundingClientRect();
          const prog = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
          band.style.transform = `translateY(${(prog - 0.5) * parseFloat(band.dataset.speed) * 300}px)`;
        });
        ticking = false;
      });
    }, { passive: true });
  }
}

/* ==========================================================================
   4. SCROLL REVEALS + ACTIVE NAV + HEADER STATE
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

function initNav() {
  const header = $('.site-header');
  const links = $$('.primary-nav a');
  const sections = $$('main section[id]');

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 140) current = s.id;
    });
    links.forEach(l => {
      const active = l.getAttribute('href') === `#${current}`;
      l.classList.toggle('active', active);
      active ? l.setAttribute('aria-current', 'location') : l.removeAttribute('aria-current');
    });
  }, { passive: true });

  const toggle = $('.nav-toggle'), nav = $('#primary-nav');
  if (toggle && nav) {
    const setMenu = open => {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    };
    toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }
}

/* ==========================================================================
   5. CORE SAMPLE ACCORDION
   ========================================================================== */
function initCores() {
  $$('.core-sample').forEach(sample => {
    const triggers = $$('.core-trigger, .core-summary', sample);
    const detail = $('.core-detail', sample);
    detail && detail.setAttribute('role', 'region');

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
   6. LIGHTBOX (gallery thin-section viewer)
   ========================================================================== */
function initLightbox() {
  const box = $('#lightbox'), img = $('#lightbox-img'), cap = $('#lightbox-caption');
  if (!box) return;
  let idx = -1, lastFocus = null;

  function open(i) {
    const g = D.gallery[i];
    idx = i;
    img.src = g.src; img.alt = g.alt; cap.textContent = g.caption;
    box.classList.add('open');
    box.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    lastFocus = document.activeElement;
    setTimeout(() => $('.lightbox-close', box).focus(), 80);
    if (window.Seismo) window.Seismo.trigger(0.9);
  }
  function close() {
    box.classList.remove('open');
    setTimeout(() => box.setAttribute('hidden', ''), 350);
    document.body.style.overflow = '';
    idx = -1;
    lastFocus && lastFocus.focus();
  }
  function nav(dir) {
    if (idx < 0) return;
    open((idx + dir + D.gallery.length) % D.gallery.length);
  }

  $$('.gallery-trigger').forEach(b =>
    b.addEventListener('click', () => open(parseInt(b.dataset.index, 10))));
  $('.lightbox-close', box).addEventListener('click', close);
  $('.lightbox-prev', box).addEventListener('click', () => nav(-1));
  $('.lightbox-next', box).addEventListener('click', () => nav(1));
  box.addEventListener('click', e => { if (e.target === box) close(); });
  document.addEventListener('keydown', e => {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') nav(-1);
    if (e.key === 'ArrowRight') nav(1);
  });
}

/* ==========================================================================
   7. FIELD MAP (Leaflet)
   ========================================================================== */
function initMap() {
  const mapEl = $('#travelMap');
  if (!mapEl || typeof L === 'undefined') return;

  const PIN_COLORS = { work: '#c98d5f', research: '#6aaee6', study: '#d8b25f' };
  const map = L.map(mapEl, {
    center: [28.3949, 84.124], zoom: 7, minZoom: 6, maxZoom: 17,
    scrollWheelZoom: false, keyboard: true, zoomControl: true
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const markers = {};
  const legendBtns = $$('.map-legend-item');
  const setActive = id => legendBtns.forEach(b => {
    const on = b.dataset.site === id;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', String(on));
  });

  D.mapSites.forEach(site => {
    const icon = L.divIcon({
      className: 'custom-map-pin',
      html: `<span style="color:${PIN_COLORS[site.type]};font-size:30px;line-height:1;text-shadow:0 4px 10px rgba(0,0,0,.6)">📍</span>`,
      iconSize: [34, 34], iconAnchor: [17, 30], popupAnchor: [0, -28]
    });
    const m = L.marker(site.coords, { icon, title: site.name, alt: `${site.name} — ${site.org}`, riseOnHover: true, keyboard: true }).addTo(map);
    m.bindPopup(`<div class="map-popup"><span class="map-popup-role">${site.role}</span><strong class="map-popup-title">${site.name}</strong><span class="map-popup-org">${site.org}</span></div>`);
    m.on('click', () => setActive(site.id));
    markers[site.id] = m;
  });

  legendBtns.forEach(btn => btn.addEventListener('click', () => {
    const site = D.mapSites.find(s => s.id === btn.dataset.site);
    if (!site) return;
    map.flyTo(site.coords, site.zoom, { duration: 0.9 });
    markers[site.id].openPopup();
    setActive(site.id);
    if (window.Seismo) window.Seismo.trigger(0.6);
  }));
}

/* ==========================================================================
   8. GEO LAB — mount the 3 photorealistic WebGL instrument modules
   (framework: js/geoweb-core.js · modules: js/geoweb-{xpl,strata,slope}.js)
   The legacy 20-canvas loop registry (geolabs-core + geolabs-*) has been
   refactored away; only the hero strata canvas still uses GeoLabs.attachCustom.
   ========================================================================== */
function initGeoLabs() {
  if (window.GeoWeb && window.GeoWeb.boot) window.GeoWeb.boot('#geo-instruments');
}

/* ==========================================================================
   BOOT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  render();
  initTypewriter();
  initReveals();
  initNav();
  initCores();
  initLightbox();
  initParallax();
  initMap();
  initGeoLabs();
});
