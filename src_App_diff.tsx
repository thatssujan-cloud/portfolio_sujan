--- src/App.tsx (原始)
export default function App() {
  return (
    <div/>
  );
}


+++ src/App.tsx (修改后)
import { useEffect, useRef, useState, useCallback } from 'react';

export default function App() {
  const [navOpen, setNavOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState('');
  const [lightboxAlt, setLightboxAlt] = useState('');
  const [lightboxCaption, setLightboxCaption] = useState('');
  const lightboxRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Close lightbox
  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    if (lastFocusedRef.current) {
      lastFocusedRef.current.focus();
    }
  }, []);

  // Open lightbox
  const openLightbox = useCallback((src: string, alt: string, caption: string, trigger: HTMLElement) => {
    lastFocusedRef.current = trigger;
    setLightboxImg(src);
    setLightboxAlt(alt);
    setLightboxCaption(caption);
    setLightboxOpen(true);
  }, []);

  // Trap focus in lightbox when open
  useEffect(() => {
    if (lightboxOpen && lightboxRef.current) {
      const closeBtn = lightboxRef.current.querySelector('.lightbox-close') as HTMLButtonElement;
      closeBtn?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeLightbox();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [lightboxOpen, closeLightbox]);

  // Close nav on link click (mobile)
  const handleNavClick = () => {
    setNavOpen(false);
  };

  return (
    <>
      {/* Skip link */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* HEADER */}
      <header className="site-header" role="banner">
        <div className="header-inner">
          <a className="logo" href="#home" aria-label="Sujan Paudyal — Back to home">
            Sujan<span aria-hidden="true">.</span>
          </a>

          <button
            className="nav-toggle"
            type="button"
            aria-label={navOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={navOpen}
            aria-controls="primary-nav"
            onClick={() => setNavOpen(!navOpen)}
          >
            <span className="nav-toggle__bar" aria-hidden="true"></span>
            <span className="nav-toggle__bar" aria-hidden="true"></span>
            <span className="nav-toggle__bar" aria-hidden="true"></span>
          </button>

          <nav className={`primary-nav${navOpen ? ' is-open' : ''}`} id="primary-nav" aria-label="Primary">
            <ul>
              <li><a href="#home" onClick={handleNavClick}>Home</a></li>
              <li><a href="#about" onClick={handleNavClick}>About</a></li>
              <li><a href="#experience" onClick={handleNavClick}>Experience</a></li>
              <li><a href="#research" onClick={handleNavClick}>Research</a></li>
              <li><a href="#projects" onClick={handleNavClick}>Projects</a></li>
              <li><a href="#testimonials" onClick={handleNavClick}>Testimonials</a></li>
              <li><a href="#gallery" onClick={handleNavClick}>Gallery</a></li>
              <li><a href="#contact" onClick={handleNavClick}>Contact</a></li>
            </ul>
          </nav>

          <button
            className="theme-toggle-btn"
            id="themeToggle"
            type="button"
            aria-label="Switch to dark theme"
            aria-pressed="false"
            onClick={() => {
              const root = document.documentElement;
              const current = root.getAttribute('data-theme');
              const next = current === 'dark' ? 'light' : 'dark';
              root.setAttribute('data-theme', next);
              const btn = document.getElementById('themeToggle');
              const icon = document.getElementById('themeIcon');
              if (btn) {
                btn.setAttribute('aria-label', next === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
                btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
              }
              if (icon) icon.textContent = next === 'dark' ? '🌙' : '☀️';
            }}
          >
            <span id="themeIcon" aria-hidden="true">☀️</span>
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main id="main-content">

        {/* HERO */}
        <section id="home" className="hero" aria-labelledby="hero-heading">
          <div className="hero-grid">
            <div className="hero-content">
              <p className="eyebrow">Understanding the Earth Beneath Us</p>
              <h1 id="hero-heading">
                <span id="typing-text">I Study the Ground Beneath What We Build.</span>
                <span className="typing-cursor" aria-hidden="true"></span>
              </h1>
              <p className="lead">
                I'm Sujan Paudyal, an Assistant Geologist with 3+ years of field experience.
                I'm passionate about geology, glaciology, and exploring the processes that shape the Himalayan landscape.
              </p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="#projects">View my work</a>
                <a className="btn btn-ghost" href="CV_SUJAN_PAUDYAL.pdf" download>
                  Download CV <span aria-hidden="true">↓</span>
                </a>
              </div>
              <div className="extra-bth">
                <a className="btn btn-secondary" href="my-friends.html" target="_blank" rel="noopener noreferrer">
                  Meet My Friends
                </a>
              </div>
            </div>

            <div className="hero-visual">
              <figure className="photo-card">
                <img
                  src="image/fied3.jpeg"
                  alt="Sujan Paudyal standing in front of the Pathibhara temple in Taplejung, Nepal"
                  width={600}
                  height={750}
                  decoding="async"
                  style={{ fetchPriority: 'high' } as React.CSSProperties}
                />
              </figure>
              <p className="credential">
                <span aria-hidden="true">🎓</span> B.Sc. Geology · Trichandra Multiple Campus, Tribhuvan University
              </p>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="about" aria-labelledby="about-heading">
          <div className="about-grid">
            <div className="about-text">
              <h2 id="about-heading">About Me</h2>
              <p className="about-tagline">Where geology meets construction — reading the ground before the first footing is poured.</p>

              <p className="about-lede">
                I'm Sujan Paudyal, a geology graduate from Tri-Chandra Multiple Campus, Tribhuvan University,
                and currently a <span className="accent-term">Civil Sub-Engineer</span> on an active 132&nbsp;kV
                transmission line project in Taplejung. My work sits at the intersection of two disciplines:
                understanding what the ground is made of, and building safely on top of it.
              </p>
              <p className="about-lede">
                Across steep Himalayan terrain, that means <span>geological mapping, rock and soil identification,
                and slope stability assessments</span> on one side, and <span>foundation supervision, site leveling,
                and construction quality control</span> on the other. That dual lens has shaped my published research
                on flood dynamics and slope stability, and it now guides how I read a hillside before it's ever
                touched by a footing.
              </p>
              <p className="about-lede">
                Explore my research and fieldwork below, or reach out to talk about academic collaboration,
                geotechnical consulting, or graduate opportunities.
              </p>
              <ul className="skill-list" aria-label="Core technical skills">
                <li>Geological Mapping</li>
                <li>Rock Identification</li>
                <li>Soil Testing</li>
                <li>Terrain Analysis</li>
                <li>AutoCAD</li>
                <li>Surveying</li>
                <li>Foundation Construction</li>
                <li>MS Excel &amp; Word</li>
              </ul>
            </div>

            <div className="about-side">
              <figure className="about-photo">
                <img
                  src="image/filed3.jpeg"
                  alt="Sujan Paudyal examining foliated rock strata during a geological field survey in the Himalayas"
                  width={600}
                  height={750}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
              <div className="about-stats" role="list" aria-label="Key qualifications">
                <div className="stat-row" role="listitem">
                  <span className="stat-label">Education</span>
                  <span className="stat-value">Bachelor of Science</span>
                  <span className="badge badge--academic">Geology</span>
                </div>
                <div className="stat-row" role="listitem">
                  <span className="stat-label">Field Experience</span>
                  <span className="stat-value">3+ years in transmission line project</span>
                  <span className="badge badge--field">Government project</span>
                </div>
                <div className="stat-row" role="listitem">
                  <span className="stat-label">Research</span>
                  <span className="stat-value">Flood dynamics of Rasuwagadhi, Kerung border</span>
                  <span className="badge badge--research">GEOWORLD Students' Journal Vol.&nbsp;13</span>
                </div>
                <div className="stat-row" role="listitem">
                  <span className="stat-label">Current Focus</span>
                  <span className="stat-value">Seismic Micro-zonation of Jajarkot, Nepal</span>
                  <span className="badge badge--focus">In progress</span>
                </div>
              </div>
            </div>
          </div>

          {/* Education Timeline (nested within About for proper heading hierarchy) */}
          <div className="about-education row">
            <h3 id="education-heading">Education Timeline</h3>
            <ol className="timeline" aria-label="Education history">
              <li className="timeline-item">
                <div className="timeline-marker" aria-hidden="true"></div>
                <div className="timeline-body">
                  <h4>Bachelor of Science in Geology</h4>
                  <p className="timeline-meta">
                    <span className="timeline-institution">Tri-Chandra Multiple Campus, Tribhuvan University</span>
                    {' | '}
                    <span className="timeline-location">Kathmandu</span>
                  </p>
                  <p>Completed a 4-year curriculum covering Structural Geology, Petrology, Engineering Geology,
                    Hydrogeology, and the Geology of Nepal. Practical training includes geological field mapping,
                    rock mass identification, stratigraphy, and technical field report writing.</p>
                </div>
              </li>
              <li className="timeline-item">
                <div className="timeline-marker" aria-hidden="true"></div>
                <div className="timeline-body">
                  <h4>+2 Technical Science (Civil Engineering Stream)</h4>
                  <p className="timeline-meta">
                    <span className="timeline-institution">Shree Padma Secondary School</span>
                    {' | '}
                    <span className="timeline-location">Bhaktapur</span>
                  </p>
                  <p>Completed technical coursework in Soil Mechanics, Foundation Engineering, Field Surveying,
                    and Highway Engineering alongside foundational sciences. This applied background built a
                    practical understanding of ground stability and soil behavior.</p>
                </div>
              </li>
              <li className="timeline-item">
                <div className="timeline-marker" aria-hidden="true"></div>
                <div className="timeline-body">
                  <h4>Secondary Education Examination (SEE) — Technical Stream (Civil Engineering)</h4>
                  <p className="timeline-meta">
                    <span className="timeline-institution">Shree Bhanu Jana Secondary School</span>
                    {' | '}
                    <span className="timeline-location">Taplejung</span>
                  </p>
                  <p>Completed technical coursework focused on civil engineering fundamentals, basic surveying,
                    and construction materials. This early vocational training provided my first practical exposure
                    to land structures and material behavior.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* EXPERIENCE */}
        <section id="experience" className="experience" aria-labelledby="experience-heading">
          <h2 id="experience-heading" className="subsection-title">Work Experience</h2>

          <div className="subsection">
            <div className="exp-item">
              <h3>Civil Sub-Engineer</h3>
              <p className="exp-org">
                Rastriya Prasaran Grid Company Limited (RPGCL)
                <span aria-hidden="true"> · </span>
                Mewa-Changhe 132&nbsp;kV Transmission Line Project, Taplejung
              </p>
              <span className="exp-duration">3+ Years</span>
              <ul className="exp-list">
                <li>Oversee site construction of transmission tower footings, verifying compliance with structural specifications and safety standards.</li>
                <li>Conducted field soil assessments, test pit inspections, and leveling surveys to optimize foundation placement on complex slopes.</li>
                <li>Evaluated rock and soil stability along tower alignments to mitigate landslide and erosion hazards during excavation.</li>
                <li>Tracked project quantities, maintained daily technical logs, and streamlined field communication across project stakeholders.</li>
              </ul>
            </div>
          </div>

          <div className="subsection">
            <h3 className="subsection-title">Projects &amp; Internships</h3>
            <div className="exp-grid">
              <article className="exp-card">
                <h4>Hydroelectric Site Investigation (OJT)</h4>
                <p className="exp-org">Madhyaphawa Khola Jalabidhyut Co-operative Ltd. · 6&nbsp;Months</p>
                <ul className="exp-list">
                  <li>Conducted geological field mapping and terrain surveys along waterway alignments.</li>
                  <li>Assessed soil and rock stability at planned intake and headworks sites.</li>
                  <li>Supported civil engineering teams with preliminary field data collection.</li>
                </ul>
              </article>

              <article className="exp-card">
                <h4>Municipal Engineering Intern</h4>
                <p className="exp-org">Suryabinayak &amp; Phungling Municipalities · 3&nbsp;Months Each</p>
                <ul className="exp-list">
                  <li>Assisted with topographic surveys and leveling for municipal road projects.</li>
                  <li>Inspected slope conditions and drainage pathways for local retaining structures.</li>
                  <li>Gained practical exposure to municipal civil works and local site evaluations.</li>
                </ul>
              </article>
            </div>
          </div>

          <div className="subsection">
            <h3 className="subsection-title">Volunteer &amp; Extracurricular</h3>
            <ul className="volunteer-list">
              <li>
                <strong>Tribhuvan University Students Exploration Chapter (TUSEG)</strong>
                <span>Coordinated geological field mapping, technical workshops, and student interaction programs.</span>
              </li>
              <li>
                <strong>Community Disaster Preparedness &amp; Hazard Awareness</strong>
                <span>Conducted local awareness on landslide safety, slope monitoring, and flood precautions.</span>
              </li>
              <li>
                <strong>Nepal Geological Student Society (NGSS) — Student Volunteer</strong>
                <span>Supported event organization and technical session coordination during geological exhibition.</span>
              </li>
              <li>
                <strong>Youth Red Cross — Tri-Chandra Chapter</strong>
                <span>Organized campus blood donation drives and supported first-aid and community health outreach initiatives.</span>
              </li>
              <li>
                <strong>Amnesty International — Tri-Chandra Youth Network</strong>
                <span>Participated in youth leadership campaigns, social awareness drives, and community advocacy programs.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* MENTORS */}
        <section id="mentors" className="mentor-section" aria-labelledby="mentors-heading">
          <div className="subsection mentor-block">
            <h2 id="mentors-heading" className="subsection-title">Mentors &amp; Guidance</h2>
            <p className="subsection-lead">Grateful for the academic mentors who shaped my path into geology research.</p>
            <div className="mentor-strip">
              <figure className="mentor-photo">
                <img
                  src="image/with-professor.jpeg"
                  alt="Sujan Paudyal standing with his geology professor from Tri-Chandra Multiple Campus"
                  width={600}
                  height={450}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>With a geology mentor from Tri-Chandra Multiple Campus</figcaption>
              </figure>
              <figure className="mentor-photo">
                <img
                  src="image/professor.jpeg"
                  alt="Sujan Paudyal in discussion with an academic mentor about graduate research directions"
                  width={600}
                  height={450}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>Discussing research directions ahead of graduate applications</figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* RESEARCH */}
        <section id="research" className="projects" aria-labelledby="research-heading">
          <div className="projects-section">
            <div className="section-intro">
              <h2 id="research-heading">My Research</h2>
              <p>Applied field engineering, geotechnical assessments, and published geological research.</p>
            </div>

            <div className="project-grid">
              <article className="project-card" id="projects">
                <div className="project-cover">
                  <img
                    src="image/field10.jpeg"
                    alt="River channel measurement and field research near the Rasuwagadhi-Kerung transboundary corridor"
                    width={800}
                    height={500}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="project-icon" aria-hidden="true">🌊</div>
                </div>
                <div className="project-body">
                  <span className="project-meta">Published Research · GeoWorld Journal</span>
                  <h3>Flood Dynamics at Rasuwagadhi-Kerung Border</h3>
                  <p>Field-based study analyzing mountain flood hazards, terrain vulnerabilities, and disaster
                    risk management along the transboundary corridor. Published in GeoWorld Students' Journal.</p>
                  <div className="tag-list" aria-label="Research topics">
                    <span>Publication</span>
                    <span>Disaster Risk</span>
                    <span>Geomorphology</span>
                    <span>Flood Analysis</span>
                  </div>
                  <div className="project-links">
                    <a
                      href="paper.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Read published research paper on Rasuwagadhi flood dynamics (opens PDF in new tab)"
                    >
                      Read Paper (PDF) →
                    </a>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" className="testimonials" aria-labelledby="testimonials-heading">
          <div className="section-intro">
            <p className="section-eyebrow">Testimonials</p>
            <h2 id="testimonials-heading">What People Say</h2>
            <p>Feedback from colleagues, mentors, and collaborators who've worked with me in the field.</p>
          </div>

          <div className="testimonials-grid">
            <TestimonialCard
              badge="Academic Mentor"
              quote="Sujan demonstrates exceptional attention to detail in geological fieldwork and communicates complex terrain analysis in a way that helps bridge geology and engineering teams."
              name="Dr. Ramesh Neupane"
              role="Geology Professor, Tri-Chandra Multiple Campus"
              initials="RN"
              imgSrc="image/ramesh-neupane.jpg"
              imgAlt="Portrait of Dr. Ramesh Neupane"
            />
            <TestimonialCard
              badge="Field Colleague"
              quote="On our transmission line project, Sujan's foundation inspections caught several critical site issues early. His systematic approach to slope stability saved us both time and risk."
              name="Prakash Sharma"
              role="Site Engineer, RPGCL Taplejung Project"
              initials="PS"
              imgSrc="image/prakash-sharma.jpg"
              imgAlt="Portrait of Prakash Sharma"
            />
            <TestimonialCard
              badge="Project Lead"
              quote="Sujan's contribution to our hydroelectric site assessment was thorough and well-documented. His geological insights shaped our entire site layout strategy."
              name="Anita Poudel"
              role="Project Lead, Madhyaphawa Khola Hydroelectric"
              initials="AP"
              imgSrc="image/anita-poudel.jpg"
              imgAlt="Portrait of Anita Poudel"
            />
          </div>
        </section>

        {/* GALLERY */}
        <section id="gallery" className="gallery" aria-labelledby="gallery-heading">
          <div className="section-intro">
            <h2 id="gallery-heading">In the Field</h2>
            <p>Moments from site supervision, surveying, and foundation work across Taplejung's terrain.</p>
          </div>

          <div className="gallery-grid">
            <GalleryItem
              src="image/field2.jpeg"
              alt="Field crew inspecting a boundary marker at a transmission tower site overlooking a valley"
              caption="Site inspection at a tower boundary marker"
              onOpen={openLightbox}
            />
            <GalleryItem
              src="image/field4.jpeg"
              alt="Field crew reviewing a foundation excavation pit on a grassy hillside"
              caption="Foundation excavation review with the crew"
              onOpen={openLightbox}
            />
            <GalleryItem
              src="image/field6.jpeg"
              alt="Completed reinforced concrete tower foundation base ready for steel erection"
              caption="Completed foundation base, ready for erection"
              onOpen={openLightbox}
            />
            <GalleryItem
              src="image/field7.jpeg"
              alt="Two engineers walking across a foundation platform on a steep slope"
              caption="Walking the platform during a site visit"
              onOpen={openLightbox}
            />
          </div>
        </section>

        {/* FIELD MAP */}
        <section id="field-map" className="field-map" aria-labelledby="map-heading">
          <div className="section-intro">
            <p className="section-eyebrow">Field Coverage</p>
            <h2 id="map-heading">Map of Nepal</h2>
            <p>Where I've worked, surveyed and studied — from the transboundary corridors at Rasuwagadhi
              to the transmission line alignments of Taplejung.</p>
          </div>

          <div className="map-shell">
            <div
              id="travelMap"
              className="map-canvas"
              role="application"
              aria-label="Interactive map of Nepal showing fieldwork, research, and academic locations. Use the legend below to navigate to specific sites."
              tabIndex={0}
            ></div>

            <aside className="map-legend" aria-label="Field site legend">
              <h3 className="map-legend-title">Field Sites</h3>
              <ul className="map-legend-list">
                <li>
                  <button type="button" className="map-legend-item" data-site="taplejung">
                    <span className="legend-dot legend-dot--work" aria-hidden="true"></span>
                    <span className="legend-text">
                      <strong>Taplejung</strong>
                      <em>Mewa–Changhe 132&nbsp;kV Transmission Line</em>
                    </span>
                  </button>
                </li>
                <li>
                  <button type="button" className="map-legend-item" data-site="madhyaphawa">
                    <span className="legend-dot legend-dot--work" aria-hidden="true"></span>
                    <span className="legend-text">
                      <strong>Madhyaphawa Khola</strong>
                      <em>Hydroelectric site investigation (OJT)</em>
                    </span>
                  </button>
                </li>
                <li>
                  <button type="button" className="map-legend-item" data-site="rasuwagadhi">
                    <span className="legend-dot legend-dot--research" aria-hidden="true"></span>
                    <span className="legend-text">
                      <strong>Rasuwagadhi–Kerung</strong>
                      <em>Published flood dynamics research</em>
                    </span>
                  </button>
                </li>
                <li>
                  <button type="button" className="map-legend-item" data-site="jajarkot">
                    <span className="legend-dot legend-dot--research" aria-hidden="true"></span>
                    <span className="legend-text">
                      <strong>Jajarkot</strong>
                      <em>Seismic micro-zonation study (in progress)</em>
                    </span>
                  </button>
                </li>
                <li>
                  <button type="button" className="map-legend-item" data-site="kathmandu">
                    <span className="legend-dot legend-dot--study" aria-hidden="true"></span>
                    <span className="legend-text">
                      <strong>Kathmandu</strong>
                      <em>Tri-Chandra Multiple Campus, Tribhuvan University</em>
                    </span>
                  </button>
                </li>
              </ul>

              <ul className="map-key" aria-label="Map symbol key">
                <li><span className="legend-dot legend-dot--work" aria-hidden="true"></span> Field work</li>
                <li><span className="legend-dot legend-dot--research" aria-hidden="true"></span> Research</li>
                <li><span className="legend-dot legend-dot--study" aria-hidden="true"></span> Academic</li>
              </ul>

              <p className="map-legend-note">Select a site to zoom in, or drag the map to explore. Scroll-zoom activates after you click the map.</p>
            </aside>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="contact" aria-labelledby="contact-heading">
          <div className="section-intro">
            <h2 id="contact-heading">Get in Touch</h2>
            <p>Interested in collaboration, research opportunities, or just a conversation? Reach out anytime.</p>
          </div>

          <div className="contact-card">
            <p className="contact-intro">I'm open to graduate research opportunities, consulting, and project collaborations. Let's connect!</p>

            <a className="btn btn-primary btn-cv" href="CV_SUJAN_PAUDYAL.pdf" download>
              Download CV <span aria-hidden="true">↓</span>
            </a>

            <address className="contact-details">
              <div className="contact-row">
                <strong>Email:</strong>
                <a href="mailto:again.sujan@gmail.com">again.sujan@gmail.com</a>
              </div>
              <div className="contact-row">
                <strong>Phone:</strong>
                <a href="tel:+9779867996682">+977 986-7996682</a>
              </div>
              <div className="contact-row">
                <strong>LinkedIn:</strong>
                <a
                  href="https://www.linkedin.com/in/sujanpaudyal"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Sujan Paudyal on LinkedIn (opens in new tab)"
                >linkedin.com/in/sujanpaudyal</a>
              </div>
              <div className="contact-row">
                <strong>Location:</strong>
                <span>Kathmandu / Koshi Province, Nepal</span>
              </div>
              <div className="contact-row">
                <strong>References:</strong>
                <span>Academic &amp; professional references available on request</span>
              </div>
            </address>

            <p className="languages">
              <span aria-hidden="true">🇳🇵</span>
              <span>Languages: Nepali (native) · English (fluent) · Hindi (conversational)</span>
            </p>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-inner">
          <p>&copy; 2026 Sujan Paudyal. Built with <span aria-hidden="true">📐</span> and clean code.</p>
          <nav className="footer-links" aria-label="Footer">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#experience">Experience</a>
            <a href="#research">Research</a>
            <a href="#projects">Projects</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#gallery">Gallery</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </footer>

      {/* LIGHTBOX */}
      <div
        className={`lightbox${lightboxOpen ? ' is-active' : ''}`}
        id="lightbox"
        ref={lightboxRef}
        role="dialog"
        aria-modal="true"
        aria-label="Enlarged image viewer"
        hidden={!lightboxOpen}
      >
        <button
          className="lightbox-close"
          type="button"
          aria-label="Close image viewer"
          onClick={closeLightbox}
        >
          <span aria-hidden="true">✕</span>
        </button>
        <figure>
          <img id="lightbox-img" src={lightboxImg} alt={lightboxAlt} decoding="async" />
          <figcaption id="lightbox-caption">{lightboxCaption}</figcaption>
        </figure>
      </div>
    </>
  );
}

/* ===== Sub-components ===== */

interface TestimonialCardProps {
  badge: string;
  quote: string;
  name: string;
  role: string;
  initials: string;
  imgSrc: string;
  imgAlt: string;
}

function TestimonialCard({ badge, quote, name, role, initials, imgSrc, imgAlt }: TestimonialCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <article className="testimonial-card">
      <span className="testimonial-badge">{badge}</span>
      <blockquote className="testimonial-content">
        <p className="testimonial-text">{quote}</p>
      </blockquote>
      <footer className="testimonial-author">
        <span className="author-avatar" data-initials={initials}>
          {!imgError && (
            <img
              src={imgSrc}
              alt={imgAlt}
              width={48}
              height={48}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />
          )}
        </span>
        <span className="author-info">
          <span className="author-name">{name}</span>
          <span className="author-role">{role}</span>
        </span>
      </footer>
    </article>
  );
}

interface GalleryItemProps {
  src: string;
  alt: string;
  caption: string;
  onOpen: (src: string, alt: string, caption: string, trigger: HTMLElement) => void;
}

function GalleryItem({ src, alt, caption, onOpen }: GalleryItemProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <figure className="gallery-item">
      <button
        ref={btnRef}
        type="button"
        className="gallery-trigger"
        data-full-src={src}
        data-caption={caption}
        aria-label={`View larger image: ${alt}`}
        onClick={() => {
          if (btnRef.current) {
            onOpen(src, alt, caption, btnRef.current);
          }
        }}
      >
        <img
          src={src}
          alt={alt}
          width={800}
          height={600}
          loading="lazy"
          decoding="async"
        />
      </button>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
