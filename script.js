/* ==========================================================================
   SUJAN PAUDYAL PORTFOLIO — ACCESSIBLE JAVASCRIPT
   WCAG 2.1 AA Compliant, Performance Optimized
   ========================================================================== */

'use strict';

/* ==========================================================================
   1. Typewriter Headline
   ========================================================================== */
(function initTypewriter() {
  const TEXT = "I Study the Ground Beneath What We Build.";
  const TYPE_SPEED = 65;
  const DELETE_SPEED = 35;
  const PAUSE_END = 2000;
  const PAUSE_START = 500;

  function start() {
    const el = document.getElementById('typing-text');
    if (!el || el.dataset.typing === 'true') return;

    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Show full text immediately without animation
      el.textContent = TEXT;
      return;
    }

    el.dataset.typing = 'true';
    el.textContent = '';

    let index = 0;
    let deleting = false;

    function tick() {
      if (!el.isConnected) return; // Stop if element removed from DOM

      if (!deleting) {
        index++;
        el.textContent = TEXT.slice(0, index);
        
        if (index === TEXT.length) {
          deleting = true;
          setTimeout(tick, PAUSE_END);
          return;
        }
        setTimeout(tick, TYPE_SPEED);
      } else {
        index--;
        el.textContent = TEXT.slice(0, index);
        
        if (index === 0) {
          deleting = false;
          setTimeout(tick, PAUSE_START);
          return;
        }
        setTimeout(tick, DELETE_SPEED);
      }
    }

    setTimeout(tick, PAUSE_START);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

/* ==========================================================================
   2. Page Features (Reveal, Navigation, Lightbox, Copy Buttons)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Scroll Reveal (respects reduced motion) ---- */
  const revealElements = document.querySelectorAll(
    '.project-card, .section-intro, .hero-visual, .about-text, .about-side, .subsection, .exp-item, .exp-card, .gallery-item, .contact-card'
  );

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    // Show all elements immediately
    revealElements.forEach(el => el.classList.add('visible'));
  } else {
    revealElements.forEach(el => el.classList.add('reveal'));

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { 
      threshold: 0.05, 
      rootMargin: '0px 0px -40px 0px' 
    });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  /* ---- Active Navigation Link (with ARIA) ---- */
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.primary-nav a');

  function updateActiveNav() {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      
      if (window.scrollY >= (sectionTop - 120) && 
          window.scrollY < (sectionTop + sectionHeight - 120)) {
        current = section.id;
      }
    });

    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === `#${current}`;
      link.classList.toggle('active', isActive);
      
      // Use aria-current for accessibility
      if (isActive) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  // Throttle scroll handler for performance
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) return;
    
    scrollTimeout = setTimeout(() => {
      updateActiveNav();
      scrollTimeout = null;
    }, 100);
  }, { passive: true });

  // Initial call
  updateActiveNav();

  /* ---- Mobile Navigation (with focus management) ---- */
  const navToggle = document.querySelector('.nav-toggle');
  const primaryNav = document.querySelector('.primary-nav');
  const navLinksList = primaryNav ? primaryNav.querySelectorAll('a') : [];

  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = primaryNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');

      if (isOpen) {
        // Focus first link when menu opens
        setTimeout(() => {
          if (navLinksList.length > 0) {
            navLinksList[0].focus();
          }
        }, 100);
      }
    });

    // Close menu on link click
    navLinksList.forEach(link => {
      link.addEventListener('click', () => {
        primaryNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open navigation menu');
      });
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && primaryNav.classList.contains('open')) {
        primaryNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open navigation menu');
        navToggle.focus();
      }
    });
  }

  /* ---- Gallery Lightbox (with focus trap and keyboard navigation) ---- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.querySelector('.lightbox-close');
  const galleryItems = document.querySelectorAll('.gallery-item');
  
  let lastFocused = null;
  let currentGalleryIndex = -1;

  function openLightbox(img, captionText, index) {
    if (!lightbox || !lightboxImg || !lightboxCaption) return;
    
    lastFocused = document.activeElement;
    currentGalleryIndex = index;
    
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = captionText;
    lightbox.hidden = false;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Focus close button
    setTimeout(() => {
      if (lightboxClose) lightboxClose.focus();
    }, 100);
  }

  function closeLightbox() {
    if (!lightbox) return;
    
    lightbox.hidden = true;
    lightboxImg.src = '';
    currentGalleryIndex = -1;
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Restore focus
    if (lastFocused) {
      lastFocused.focus();
    }
  }

  function navigateGallery(direction) {
    if (currentGalleryIndex === -1 || galleryItems.length === 0) return;
    
    let newIndex = currentGalleryIndex + direction;
    
    // Wrap around
    if (newIndex < 0) newIndex = galleryItems.length - 1;
    if (newIndex >= galleryItems.length) newIndex = 0;
    
    const newItem = galleryItems[newIndex];
    const img = newItem.querySelector('img');
    const caption = newItem.querySelector('figcaption');
    
    if (img) {
      openLightbox(img, caption ? caption.textContent : '', newIndex);
    }
  }

  // Set up gallery item interactions
  galleryItems.forEach((item, index) => {
    const img = item.querySelector('img');
    const caption = item.querySelector('figcaption');
    const button = item.querySelector('button');
    
    if (!img) return;

    const openHandler = () => openLightbox(img, caption ? caption.textContent : '', index);

    // Click handler (on button or figure)
    if (button) {
      button.addEventListener('click', openHandler);
    } else {
      item.addEventListener('click', openHandler);
    }

    // Keyboard handler
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openHandler();
      }
    });
  });

  // Lightbox controls
  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  if (lightbox) {
    // Close on backdrop click
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;

      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          navigateGallery(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateGallery(1);
          break;
        case 'Tab':
          // Trap focus within lightbox
          const focusableElements = lightbox.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
          break;
      }
    });
  }

  /* ---- Copy Buttons (with accessible feedback) ---- */
  document.querySelectorAll('.contact-card a[href^="mailto:"], .contact-card a[href^="tel:"]').forEach(link => {
    // Check if copy button already exists
    if (link.nextElementSibling && link.nextElementSibling.classList.contains('copy-btn')) {
      return;
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', `Copy ${link.textContent.trim()} to clipboard`);

    btn.addEventListener('click', async () => {
      const textToCopy = link.textContent.trim();
      
      try {
        await navigator.clipboard.writeText(textToCopy);
        btn.textContent = 'Copied ✓';
        btn.setAttribute('aria-label', `Copied ${textToCopy} to clipboard`);
        
        // Announce to screen readers
        const announcement = document.createElement('span');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = `Copied ${textToCopy} to clipboard`;
        btn.appendChild(announcement);
        
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.setAttribute('aria-label', `Copy ${textToCopy} to clipboard`);
          announcement.remove();
        }, 2000);
      } catch (err) {
        // Fallback for older browsers
        btn.textContent = 'Press Ctrl+C';
        setTimeout(() => {
          btn.textContent = 'Copy';
        }, 2000);
      }
    });

    link.insertAdjacentElement('afterend', btn);
  });

});

/* ==========================================================================
   3. Field Map of Nepal (Leaflet)
   ========================================================================== */
(function initFieldMap() {
  const mapEl = document.getElementById('travelMap');

  // Exit gracefully if map element or Leaflet not available
  if (!mapEl || typeof L === 'undefined') {
    console.warn('Map initialization skipped: element or Leaflet not found');
    return;
  }

  const PIN_COLORS = {
    work:     '#2e9e6b',
    research: '#0088cc',
    study:    '#d99a1f'
  };

  const sites = [
    {
      id: 'taplejung',
      name: 'Taplejung',
      role: 'Field Work',
      org: 'RPGCL · Mewa–Changhe 132 kV Transmission Line',
      type: 'work',
      coords: [27.3533, 87.6667],
      zoom: 11
    },
    {
      id: 'madhyaphawa',
      name: 'Madhyaphawa Khola',
      role: 'Field Work',
      org: 'Hydroelectric site investigation (OJT)',
      type: 'work',
      coords: [27.1500, 87.7500],
      zoom: 12
    },
    {
      id: 'rasuwagadhi',
      name: 'Rasuwagadhi–Kerung',
      role: 'Research',
      org: 'Published flood dynamics study · GeoWorld Journal',
      type: 'research',
      coords: [28.2833, 85.3833],
      zoom: 11
    },
    {
      id: 'jajarkot',
      name: 'Jajarkot',
      role: 'Research',
      org: 'Seismic micro-zonation study (in progress)',
      type: 'research',
      coords: [28.7200, 82.1900],
      zoom: 11
    },
    {
      id: 'kathmandu',
      name: 'Kathmandu',
      role: 'Academic',
      org: 'Tri-Chandra Multiple Campus, Tribhuvan University',
      type: 'study',
      coords: [27.7172, 85.3240],
      zoom: 12
    }
  ];

  // Initialize map with accessibility considerations
  const map = L.map(mapEl, {
    center: [28.3949, 84.1240],
    zoom: 7,
    minZoom: 6,
    maxZoom: 17,
    scrollWheelZoom: false, // Disabled by default for accessibility
    zoomControl: true,
    keyboard: true, // Enable keyboard navigation
    attributionControl: true
  });

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const legendButtons = document.querySelectorAll('.map-legend-item');
  const markers = {};

  function setActiveLegend(id) {
    legendButtons.forEach(btn => {
      const isActive = btn.dataset.site === id;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  // Create markers for each site
  sites.forEach(site => {
    const color = PIN_COLORS[site.type] || PIN_COLORS.work;

    const icon = L.divIcon({
      className: 'custom-map-pin',
      html: `<i class="fas fa-map-pin" style="color:${color}" aria-hidden="true"></i>`,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -34]
    });

    const marker = L.marker(site.coords, {
      icon,
      title: site.name,
      alt: `${site.name} — ${site.org}`,
      riseOnHover: true,
      keyboard: true
    }).addTo(map);

    // Accessible popup content
    marker.bindPopup(`
      <div class="map-popup" role="region" aria-label="${site.name} details">
        <span class="map-popup-role">${site.role}</span>
        <strong class="map-popup-title">${site.name}</strong>
        <span class="map-popup-org">${site.org}</span>
      </div>
    `);

    marker.on('click', () => setActiveLegend(site.id));
    markers[site.id] = marker;
  });

  // Legend button interactions
  legendButtons.forEach(btn => {
    // Set initial aria-pressed state
    btn.setAttribute('aria-pressed', 'false');

    btn.addEventListener('click', () => {
      const site = sites.find(s => s.id === btn.dataset.site);
      if (!site) return;

      map.flyTo(site.coords, site.zoom, { duration: 0.9 });
      markers[site.id].openPopup();
      setActiveLegend(site.id);
    });

    // Keyboard support
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // Enable scroll zoom only after user interaction (accessibility best practice)
  map.on('click', () => map.scrollWheelZoom.enable());
  map.on('mouseout', () => map.scrollWheelZoom.disable());

  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      map.invalidateSize();
    }, 250);
  });

  // Announce map to screen readers
  mapEl.setAttribute('aria-label', 
    'Interactive map of Nepal showing 5 field sites. Use the legend below to navigate to specific locations.'
  );
})();

/* ==========================================================================
   4. Smooth Scroll Enhancement (for browsers without native support)
   ========================================================================== */
(function enhanceSmoothScroll() {
  // Check if browser supports native smooth scroll
  if ('scrollBehavior' in document.documentElement.style) return;

  // Polyfill for older browsers
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      window.scrollTo({
        top: target.offsetTop - 80, // Account for fixed header
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });

      // Set focus to target for accessibility
      target.setAttribute('tabindex', '-1');
      target.focus();
    });
  });
})();

/* ==========================================================================
   5. Performance: Lazy load images not using native loading="lazy"
   ========================================================================== */
(function lazyLoadImages() {
  if ('loading' in HTMLImageElement.prototype) return; // Native lazy loading supported

  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  
  if (!('IntersectionObserver' in window)) {
    // Fallback: load all images immediately
    lazyImages.forEach(img => {
      if (img.dataset.src) img.src = img.dataset.src;
    });
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  });

  lazyImages.forEach(img => imageObserver.observe(img));
})();

/* ==========================================================================
   6. Error Handling: Global error reporter (for sandbox environments)
   ========================================================================== */
(function setupErrorReporting() {
  // Only in iframe/sandbox environments
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
          stack: event.error && event.error.stack 
            ? String(event.error.stack).slice(0, 2000) 
            : ''
        }
      }, '*');
    } catch (e) {
      // Silently fail if reporting doesn't work
    }
  });
})();