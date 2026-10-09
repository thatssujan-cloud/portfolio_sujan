# STRATA — Immersive Geological Portfolio of Sujan Paudyal

A completely redesigned, interactive portfolio built as a **cross-section of the
Earth's crust**: you start at the Surface and scroll down through the Regolith,
Sedimentary and Metamorphic layers, past the Borehole Zone, all the way to the
Mantle Core.

**Stack:** plain HTML5 + modern CSS + vanilla JavaScript, with Three.js, GSAP
(ScrollTrigger), Leaflet and Google Fonts loaded via CDN. No build step —
open `index.html` or push to GitHub Pages and it works.

---

## Repository structure

```
/
├── index.html              ← NEW (overwrites the old single-file page)
├── css/
│   └── strata.css          ← design system: palette, layers, animations
├── js/
│   ├── data.js             ← ★ ALL YOUR CONTENT lives here (edit this only)
│   ├── main.js             ← renders sections + interactivity
│   ├── seismograph.js      ← reactive Canvas seismic background line
│   └── three-hero.js       ← interactive 3D mineral crystal (Three.js)
├── image/                  ← your original photos (untouched)
├── CV_SUJAN_PAUDYAL.pdf    ← preserved
├── paper.pdf               ← preserved (linked from Core Sample 01)
├── my-friends.html         ← preserved (linked from hero button)
├── CNAME                   ← preserved (sujanpaudyal.com.np)
└── archive/legacy/         ← copies of the previous index.html / style.css / script.js
```

### What was overwritten / added / kept

| File | Status |
|---|---|
| `index.html` | **Overwritten** with the new stratigraphic layout |
| `style.css`, `script.js` | **Removed** — replaced by `css/strata.css`, `js/*.js` (originals copied to `archive/legacy/`) |
| `css/`, `js/` folders | **New** — clean, modular architecture |
| `image/*`, `CV_SUJAN_PAUDYAL.pdf`, `paper.pdf`, `my-friends.html`, `CNAME`, `README.md` | **Kept untouched** |
| `src_App_diff.tsx` | Kept (leftover reference file; safe to delete) |

All personal content from the original site was migrated into **`js/data.js`**:
hero text & credential, About paragraphs, skills, qualification stats,
education (as stratigraphic units), RPGCL job details, internships, volunteering,
mentor photos, research/projects, testimonials, gallery captions, field-map sites
(Taplejung, Madhyaphawa Khola, Rasuwagadhi–Kerung, Jajarkot, Kathmandu), contact
info (email, phone, LinkedIn, languages) and footer text.

---

## The five signature interactions

1. **Interactive 3D Mineral Hero (`three-hero.js`)** — a faceted quartz point
   cluster with pyrite shards, wireframe lattice, orbiting sediment motes and a
   displaced Himalayan terrain mesh. Hover magnetically tilts and "charges" the
   crystals (emissive glow ramps up); drag spins them with inertia. Graceful
   fallback if WebGL is unavailable.
2. **Reactive Seismograph Line (`seismograph.js`)** — a full-screen Canvas trace
   that runs behind every section. It spikes on clicks, key presses, hovering
   interactive elements, opening core samples, and injects micro-tremor energy
   proportional to scroll velocity. Other modules can fire quakes via
   `window.Seismo.trigger(intensity)`.
3. **Tectonic Fault Parallax (`main.js` + GSAP ScrollTrigger)** — wavy strata
   bands drift at different depths inside each layer, fault-divider plates slide
   past each other strike-slip style between sections, and headings perform a
   one-time "fault-split" displacement when they enter view. A rAF fallback runs
   even if the GSAP CDN fails.
4. **Core Sample Project Showcase** — projects are logged like boreholes:
   lithology-colored drill cylinders in a rack; clicking "Extract" expands the
   thin-section record (summary, tags, field photo with polarizing-microscope
   overlay, paper link) and fires a seismograph spike.
5. **Stratigraphic Timeline** — education renders as a vertical geological
   column with era markers (Phanerozoic/Mesozoic/Paleozoic), lithology hatch
   strips and depth scales; experience continues downward with Holocene and
   Pleistocene era chips.

Plus: Leaflet field map with clickable legend fly-to, keyboard-navigable
gallery lightbox ("thin section viewer"), typewriter headline, copy-to-clipboard
contact rows, mobile drawer nav, scroll-spy active states, and full
`prefers-reduced-motion` support.

---

## Editing your content

Everything editable lives in **`js/data.js`** — no HTML changes needed:

- Add a project → append an object to `cores` (give it a unique `id`, colors in `bands`).
- Add a field site → append to `mapSites` with `[lat, lng]` coordinates.
- New testimonial → append to `testimonials` (set `avatar: 'image/your-photo.jpg'`
  to show a headshot instead of initials).
- Change palette → edit the CSS custom properties at the top of `css/strata.css`.

## Local preview

```bash
cd <repo> && python3 -m http.server 8000
# open http://localhost:8000
```

Deploy: push to the `main` branch — GitHub Pages serves `index.html` automatically
(the repo's `CNAME` keeps your custom domain).

*© 2026 Sujan Paudyal — formed over deep time, built with clean code.*
