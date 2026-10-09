/* ==========================================================================
   SUJAN PAUDYAL — PORTFOLIO CONTENT DATA
   Single source of truth for all personal content, projects, links & text.
   Edit here; the UI renders from this file.
   ========================================================================== */
'use strict';

window.STRATA_DATA = {
  meta: {
    name: 'Sujan Paudyal',
    title: 'Geologist & Civil Engineer',
    tagline: 'I Study the Ground Beneath What We Build.',
    eyebrow: 'Understanding the Earth Beneath Us'
  },

  hero: {
    lead: "I'm Sujan Paudyal, an Assistant Geologist with 3+ years of field experience. I'm passionate about geology, glaciology, and exploring the processes that shape the Himalayan landscape.",
    credential: 'B.Sc. Geology · Trichandra Multiple Campus, Tribhuvan University',
    photo: 'image/fied3.jpeg',
    photoAlt: 'Sujan Paudyal standing in front of the Pathibhara temple in Taplejung, Nepal',
    actions: [
      { label: 'View core samples', href: '#research', style: 'primary' },
      { label: 'Download CV', href: 'CV_SUJAN_PAUDYAL.pdf', download: true, style: 'ghost' },
      { label: 'Meet My Friends', href: 'my-friends.html', target: '_blank', style: 'copper' }
    ]
  },

  about: {
    tagline: 'Where geology meets construction — reading the ground before the first footing is poured.',
    paragraphs: [
      'I\'m Sujan Paudyal, a geology graduate from Tri-Chandra Multiple Campus, Tribhuvan University, and currently a <span class="accent-term">Civil Sub-Engineer</span> on an active 132&nbsp;kV transmission line project in Taplejung. My work sits at the intersection of two disciplines: understanding what the ground is made of, and building safely on top of it.',
      'Across steep Himalayan terrain, that means <em>geological mapping, rock and soil identification, and slope stability assessments</em> on one side, and <em>foundation supervision, site leveling, and construction quality control</em> on the other. That dual lens has shaped my published research on flood dynamics and slope stability, and it now guides how I read a hillside before it\'s ever touched by a footing.',
      'Explore my research and fieldwork below, or reach out to talk about academic collaboration, geotechnical consulting, or graduate opportunities.'
    ],
    photo: 'image/filed3.jpeg',
    photoAlt: 'Sujan Paudyal examining foliated rock strata during a geological field survey in the Himalayas',
    skills: ['Geological Mapping', 'Rock Identification', 'Soil Testing', 'Terrain Analysis', 'AutoCAD', 'Surveying', 'Foundation Construction', 'MS Excel & Word'],
    stats: [
      { label: 'Education', value: 'Bachelor of Science', badge: 'Geology', layer: 'topsoil' },
      { label: 'Field Experience', value: '3+ years in transmission line project', badge: 'Government project', layer: 'sedimentary' },
      { label: 'Research', value: 'Flood dynamics of Rasuwagadhi, Kerung border', badge: 'GEOWORLD Students\u2019 Journal Vol. 13', layer: 'metamorphic' },
      { label: 'Current Focus', value: 'Seismic Micro-zonation of Jajarkot, Nepal', badge: 'In progress', layer: 'igneous' }
    ]
  },

  /* Stratigraphic column — geological eras double as timeline markers */
  education: [
    {
      era: 'Phanerozoic · Quaternary',
      degree: 'Bachelor of Science in Geology',
      institution: 'Tri-Chandra Multiple Campus, Tribhuvan University',
      location: 'Kathmandu',
      text: 'Completed a 4-year curriculum covering Structural Geology, Petrology, Engineering Geology, Hydrogeology, and the Geology of Nepal. Practical training includes geological field mapping, rock mass identification, stratigraphy, and technical field report writing.'
    },
    {
      era: 'Mesozoic · Secondary',
      degree: '+2 Technical Science (Civil Engineering Stream)',
      institution: 'Shree Padma Secondary School',
      location: 'Bhaktapur',
      text: 'Completed technical coursework in Soil Mechanics, Foundation Engineering, Field Surveying, and Highway Engineering alongside foundational sciences. This applied background built a practical understanding of ground stability and soil behavior, directly preparing me for my B.Sc. studies in Engineering Geology.'
    },
    {
      era: 'Paleozoic · Primary',
      degree: 'Secondary Education Examination (SEE) — Technical Stream (Civil Engineering)',
      institution: 'Shree Bhanu Jana Secondary School',
      location: 'Taplejung',
      text: 'Completed technical coursework focused on civil engineering fundamentals, basic surveying, and construction materials. This early vocational training provided my first practical exposure to land structures and material behavior, sparking my long-term academic interest in geotechnical engineering and geology.'
    }
  ],

  jobs: [{
    role: 'Civil Sub-Engineer',
    org: 'Rastriya Prasaran Grid Company Limited (RPGCL)',
    project: 'Mewa-Changhe 132 kV Transmission Line Project, Taplejung',
    duration: '3+ Years',
    points: [
      'Oversee site construction of transmission tower footings, verifying compliance with structural specifications and safety standards.',
      'Conducted field soil assessments, test pit inspections, and leveling surveys to optimize foundation placement on complex slopes.',
      'Evaluated rock and soil stability along tower alignments to mitigate landslide and erosion hazards during excavation.',
      'Tracked project quantities, maintained daily technical logs, and streamlined field communication across project stakeholders.'
    ]
  }],

  internships: [
    {
      title: 'Hydroelectric Site Investigation (OJT)',
      org: 'Madhyaphawa Khola Jalabidhyut Co-operative Ltd. · 6 Months',
      points: [
        'Conducted geological field mapping and terrain surveys along waterway alignments.',
        'Assessed soil and rock stability at planned intake and headworks sites.',
        'Supported civil engineering teams with preliminary field data collection.'
      ]
    },
    {
      title: 'Municipal Engineering Intern',
      org: 'Suryabinayak & Phungling Municipalities · 3 Months Each',
      points: [
        'Assisted with topographic surveys and leveling for municipal road projects.',
        'Inspected slope conditions and drainage pathways for local retaining structures.',
        'Gained practical exposure to municipal civil works and local site evaluations.'
      ]
    }
  ],

  volunteer: [
    { name: 'Tribhuvan University Students Exploration Chapter (TUSEG)', desc: 'Coordinated geological field mapping, technical workshops, and student interaction programs.' },
    { name: 'Community Disaster Preparedness & Hazard Awareness', desc: 'Conducted local awareness on landslide safety, slope monitoring, and flood precautions.' },
    { name: 'Nepal Geological Student Society (NGSS) — Student Volunteer', desc: 'Supported event organization and technical session coordination during geological exhibition.' },
    { name: 'Youth Red Cross — Tri-Chandra Chapter', desc: 'Organized campus blood donation drives and supported first-aid and community health outreach initiatives.' },
    { name: 'Amnesty International — Tri-Chandra Youth Network', desc: 'Participated in youth leadership campaigns, social awareness drives, and community advocacy programs.' }
  ],

  mentors: {
    lead: 'Grateful for the academic mentors who shaped my path into geology research.',
    photos: [
      { src: 'image/with-professor.jpeg', alt: 'Sujan Paudyal standing with his geology professor from Tri-Chandra Multiple Campus', caption: 'With a geology mentor from Tri-Chandra Multiple Campus' },
      { src: 'image/professor.jpeg', alt: 'Sujan Paudyal in discussion with an academic mentor about graduate research directions', caption: 'Discussing research directions ahead of graduate applications' }
    ]
  },

  /* Core-sample project showcase */
  cores: [
    {
      id: 'flood-dynamics',
      icon: '🌊',
      depth: 'CORE 01 · 0–13 m',
      lithology: 'Alluvial & fluvial deposits',
      meta: 'Published Research · GeoWorld Journal',
      title: 'Flood Dynamics at Rasuwagadhi-Kerung Border',
      summary: 'Field-based study analyzing mountain flood hazards, terrain vulnerabilities, and disaster risk management along the transboundary corridor. Published in GeoWorld Students\u2019 Journal.',
      tags: ['Publication', 'Disaster Risk', 'Geomorphology', 'Flood Analysis'],
      link: { href: 'paper.pdf', label: 'Read Paper (PDF)', target: '_blank' },
      image: 'image/field10.jpeg',
      imageAlt: 'River channel measurement and field research near the Rasuwagadhi-Kerung transboundary corridor',
      bands: ['#8a5a3b', '#a9714b', '#6d4630', '#c98d5f', '#7b4f36']
    },
    {
      id: 'transmission-line',
      icon: '⛰️',
      depth: 'CORE 02 · 13–45 m',
      lithology: 'Mid-Himalayan crystalline basement',
      meta: 'Applied Field Engineering · RPGCL',
      title: 'Mewa-Changhe 132 kV Transmission Line Geotech',
      summary: 'Foundation geology along active Himalayan alignments: rock & soil identification, test-pit logging, slope-stability screening and footing quality control across complex terrain in Taplejung.',
      tags: ['Slope Stability', 'Foundation Engineering', 'Field Mapping', 'QC'],
      link: null,
      image: 'image/field4.jpeg',
      imageAlt: 'Field crew reviewing a foundation excavation pit on a grassy hillside',
      bands: ['#3f3d45', '#5b5148', '#7a6a55', '#4a4a52', '#63564a']
    },
    {
      id: 'microzonation',
      icon: '📈',
      depth: 'CORE 03 · 45–80 m',
      lithology: 'Siwalik molasse · in progress',
      meta: 'Seismotectonics · In Progress',
      title: 'Seismic Micro-zonation of Jajarkot, Nepal',
      summary: 'Ongoing study characterising site-specific ground response after the 2023 Jajarkot earthquake sequence — integrating geological, geotechnical and seismic data for safer reconstruction.',
      tags: ['Earthquake Geology', 'Site Response', 'Microzonation'],
      link: null,
      image: 'image/field-work.jpeg',
      imageAlt: 'Geological fieldwork in Himalayan terrain relevant to seismic micro-zonation research',
      bands: ['#b6552e', '#d97e4a', '#8f3f22', '#e0925c', '#a04a26']
    },
    {
      id: 'hydro-site',
      icon: '💧',
      depth: 'CORE 04 · 80–120 m',
      lithology: 'River-bed gravels & gneiss',
      meta: 'On-the-Job Training · Hydropower',
      title: 'Madhyaphawa Khola Hydroelectric Site Investigation',
      summary: 'Six-month OJT: geological mapping and terrain surveys along waterway alignments; stability assessment of intake and headworks foundations for a run-of-river scheme.',
      tags: ['Engineering Geology', 'Hydropower', 'Geological Mapping'],
      link: null,
      image: 'image/field9.jpeg',
      imageAlt: 'Geological investigation along a Himalayan river corridor during hydroelectric site survey',
      bands: ['#2f4d57', '#41697a', '#24404a', '#5b8798', '#315562']
    }
  ],

  testimonials: [
    {
      badge: 'Academic Mentor',
      text: 'Sujan demonstrates exceptional attention to detail in geological fieldwork and communicates complex terrain analysis in a way that helps bridge geology and engineering teams.',
      initials: 'RN',
      avatar: null,
      name: 'Dr. Ramesh Neupane',
      role: 'Geology Professor, Tri-Chandra Multiple Campus'
    },
    {
      badge: 'Field Colleague',
      text: 'On our transmission line project, Sujan\u2019s foundation inspections caught several critical site issues early. His systematic approach to slope stability saved us both time and risk.',
      initials: 'PS',
      avatar: null,
      name: 'Prakash Sharma',
      role: 'Site Engineer, RPGCL Taplejung Project'
    },
    {
      badge: 'Project Lead',
      text: 'Sujan\u2019s contribution to our hydroelectric site assessment was thorough and well-documented. His geological insights shaped our entire site layout strategy.',
      initials: 'AP',
      avatar: null,
      name: 'Anita Poudel',
      role: 'Project Lead, Madhyaphawa Khola Hydroelectric'
    }
  ],

  gallery: [
    { src: 'image/field2.jpeg', caption: 'Site inspection at a tower boundary marker', alt: 'Field crew inspecting a boundary marker at a transmission tower site overlooking a valley' },
    { src: 'image/field4.jpeg', caption: 'Foundation excavation review with the crew', alt: 'Field crew reviewing a foundation excavation pit on a grassy hillside' },
    { src: 'image/field6.jpeg', caption: 'Completed foundation base, ready for erection', alt: 'Completed reinforced concrete tower foundation base ready for steel erection' },
    { src: 'image/field7.jpeg', caption: 'Walking the platform during a site visit', alt: 'Two engineers walking across a foundation platform on a steep slope' }
  ],

  mapSites: [
    { id: 'taplejung', name: 'Taplejung', role: 'Field Work', org: 'RPGCL · Mewa–Changhe 132 kV Transmission Line', type: 'work', coords: [27.3533, 87.6667], zoom: 11 },
    { id: 'madhyaphawa', name: 'Madhyaphawa Khola', role: 'Field Work', org: 'Hydroelectric site investigation (OJT)', type: 'work', coords: [27.15, 87.75], zoom: 12 },
    { id: 'rasuwagadhi', name: 'Rasuwagadhi–Kerung', role: 'Research', org: 'Published flood dynamics study · GeoWorld Journal', type: 'research', coords: [28.2833, 85.3833], zoom: 11 },
    { id: 'jajarkot', name: 'Jajarkot', role: 'Research', org: 'Seismic micro-zonation study (in progress)', type: 'research', coords: [28.72, 82.19], zoom: 11 },
    { id: 'kathmandu', name: 'Kathmandu', role: 'Academic', org: 'Tri-Chandra Multiple Campus, Tribhuvan University', type: 'study', coords: [27.7172, 85.324], zoom: 12 }
  ],

  contact: {
    intro: 'I\'m open to graduate research opportunities, consulting, and project collaborations. Let\'s connect!',
    rows: [
      { label: 'Email', value: 'again.sujan@gmail.com', href: 'mailto:again.sujan@gmail.com', copy: true },
      { label: 'Phone', value: '+977 986-7996682', href: 'tel:+9779867996682', copy: true },
      { label: 'LinkedIn', value: 'linkedin.com/in/sujanpaudyal', href: 'https://www.linkedin.com/in/sujanpaudyal', external: true },
      { label: 'Location', value: 'Kathmandu / Koshi Province, Nepal' },
      { label: 'References', value: 'Academic & professional references available on request' }
    ],
    languages: 'Languages: Nepali (native) · English (fluent) · Hindi (conversational)'
  },

  footer: {
    copyright: '© 2026 Sujan Paudyal. Formed over deep time, built with clean code.',
    links: ['Home', 'About', 'Experience', 'Research', 'Testimonials', 'Gallery', 'Contact']
  }
};
