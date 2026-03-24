/**
 * Returns the complete CSS styles for the GitStory HTML report.
 * Dark cinematic theme with glassmorphism, gradient accents, and responsive design.
 */
export function getStyles(): string {
  return `
/* ============================================================
   GitStory — Cinematic Dark Theme
   ============================================================ */

/* ---------- Reset & Base ---------- */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  font-size: 16px;
}

body {
  background: #06060e;
  color: #e0e0e8;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.7;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: #7dd3fc;
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: #bae6fd;
}

code, pre, .mono {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
}

/* ---------- Noise Overlay ---------- */
.noise-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
}

/* ---------- Scroll Fade Animation ---------- */
.fade-in {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}

/* ---------- Gradient Text Utility ---------- */
.gradient-text {
  background: linear-gradient(135deg, #7dd3fc 0%, #c084fc 50%, #f472b6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ---------- Section Common ---------- */
section {
  position: relative;
  padding: 6rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.section-heading {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #7dd3fc, #c084fc);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.section-subtitle {
  font-size: 1.1rem;
  color: #8888a0;
  margin-bottom: 3rem;
  max-width: 600px;
}

/* ---------- Glassmorphism Card ---------- */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 2rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* ============================================================
   #hero — Full-Screen Title
   ============================================================ */
#hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  overflow: hidden;
  padding: 2rem;
}

#hero h1 {
  font-size: 4.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #7dd3fc 0%, #c084fc 50%, #f472b6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

#hero .tagline {
  font-size: 1.25rem;
  color: #8888a0;
  max-width: 540px;
  margin-bottom: 2rem;
}

#hero .meta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: #555570;
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* Floating Orbs */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: #7dd3fc;
  top: -10%;
  left: -10%;
  animation-delay: 0s;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: #c084fc;
  bottom: -5%;
  right: -5%;
  animation-delay: -7s;
}

.orb-3 {
  width: 300px;
  height: 300px;
  background: #f472b6;
  top: 50%;
  left: 60%;
  animation-delay: -14s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -30px) scale(1.05); }
  50% { transform: translate(-20px, 20px) scale(0.95); }
  75% { transform: translate(10px, -10px) scale(1.02); }
}

/* ============================================================
   #prologue — Project Overview
   ============================================================ */
#prologue {
  padding-top: 4rem;
  padding-bottom: 4rem;
}

#prologue .stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

#prologue .stat-card {
  text-align: center;
  padding: 2rem 1rem;
}

#prologue .stat-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #7dd3fc, #c084fc);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

#prologue .stat-label {
  font-size: 0.85rem;
  color: #8888a0;
  margin-top: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* ============================================================
   #pulse — Activity Heatmap / Chart
   ============================================================ */
#pulse {
  padding-top: 4rem;
  padding-bottom: 4rem;
}

#pulse .chart-container {
  width: 100%;
  overflow-x: auto;
  margin-top: 2rem;
}

#pulse svg {
  display: block;
  margin: 0 auto;
}

#pulse .heatmap-cell {
  rx: 2;
  ry: 2;
  transition: opacity 0.2s ease;
}

#pulse .heatmap-cell:hover {
  opacity: 0.8;
  stroke: #fff;
  stroke-width: 1;
}

/* ============================================================
   #story — Narrative Timeline
   ============================================================ */
#story {
  padding-top: 4rem;
  padding-bottom: 4rem;
}

.timeline {
  position: relative;
  padding: 2rem 0;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, rgba(125, 211, 252, 0.3), rgba(192, 132, 252, 0.3), rgba(125, 211, 252, 0.1));
}

.timeline-chapter {
  position: relative;
  width: 50%;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.timeline-chapter:nth-child(odd) {
  left: 0;
  padding-right: 3rem;
  text-align: right;
}

.timeline-chapter:nth-child(even) {
  left: 50%;
  padding-left: 3rem;
  text-align: left;
}

.timeline-chapter::before {
  content: '';
  position: absolute;
  top: 2rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #c084fc;
  border: 2px solid #06060e;
  z-index: 1;
}

.timeline-chapter:nth-child(odd)::before {
  right: -6px;
}

.timeline-chapter:nth-child(even)::before {
  left: -6px;
}

.chapter-card {
  padding: 1.5rem;
}

.chapter-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #e0e0e8;
  margin-bottom: 0.5rem;
}

.chapter-date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: #555570;
  margin-bottom: 0.75rem;
}

.chapter-summary {
  font-size: 0.9rem;
  color: #aaaabc;
  line-height: 1.6;
  margin-bottom: 1rem;
}

/* Intensity Bar */
.intensity-bar {
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.05);
  margin-top: 0.75rem;
  overflow: hidden;
}

.intensity-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #7dd3fc, #c084fc);
  transition: width 0.6s ease-out;
}

/* Contributor Pills */
.contributor-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.contributor-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  font-family: 'JetBrains Mono', monospace;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #aaaabc;
}

.contributor-pill .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

/* ============================================================
   #cast — Top Contributors
   ============================================================ */
#cast {
  padding-top: 4rem;
  padding-bottom: 4rem;
}

#cast .cast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.cast-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1.5rem;
}

.cast-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin-bottom: 1rem;
  border: 2px solid rgba(125, 211, 252, 0.3);
}

.cast-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e0e0e8;
  margin-bottom: 0.25rem;
}

.cast-commits {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: #7dd3fc;
}

.cast-bar {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.05);
  margin-top: 1rem;
  overflow: hidden;
}

.cast-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #7dd3fc, #c084fc);
}

/* ============================================================
   #rhythm — Commit Patterns
   ============================================================ */
#rhythm {
  padding-top: 4rem;
  padding-bottom: 4rem;
}

#rhythm .rhythm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

#rhythm .rhythm-card {
  padding: 2rem;
}

#rhythm .rhythm-label {
  font-size: 0.85rem;
  color: #8888a0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.5rem;
}

#rhythm .rhythm-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.5rem;
  font-weight: 600;
  color: #e0e0e8;
}

/* ============================================================
   #epilogue — Closing Summary
   ============================================================ */
#epilogue {
  padding-top: 4rem;
  padding-bottom: 6rem;
  text-align: center;
}

#epilogue .closing {
  max-width: 640px;
  margin: 0 auto;
  font-size: 1.1rem;
  color: #aaaabc;
  line-height: 1.8;
}

#epilogue .generated-at {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: #444460;
  margin-top: 3rem;
}

/* ============================================================
   Tooltips
   ============================================================ */
.tooltip {
  position: absolute;
  pointer-events: none;
  padding: 0.6rem 1rem;
  background: rgba(10, 10, 20, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: #e0e0e8;
  z-index: 1000;
  white-space: nowrap;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.tooltip::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 8px;
  height: 8px;
  background: rgba(10, 10, 20, 0.92);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

/* ============================================================
   Scrollbar
   ============================================================ */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #06060e;
}

::-webkit-scrollbar-thumb {
  background: #2a2a3e;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #3a3a52;
}

/* ============================================================
   Responsive — Tablet
   ============================================================ */
@media (max-width: 768px) {
  #hero h1 {
    font-size: 2.5rem;
  }

  #hero .meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  section {
    padding: 4rem 1.5rem;
  }

  .section-heading {
    font-size: 2rem;
  }

  /* Collapse timeline to single column */
  .timeline::before {
    left: 1rem;
  }

  .timeline-chapter {
    width: 100%;
    left: 0 !important;
    padding-left: 3rem !important;
    padding-right: 0 !important;
    text-align: left !important;
  }

  .timeline-chapter::before {
    left: 0.45rem !important;
    right: auto !important;
  }

  #prologue .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  #cast .cast-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ============================================================
   Responsive — Mobile
   ============================================================ */
@media (max-width: 375px) {
  html {
    font-size: 14px;
  }

  #hero h1 {
    font-size: 2rem;
  }

  section {
    padding: 3rem 1rem;
  }

  .section-heading {
    font-size: 1.6rem;
  }

  #prologue .stats-grid {
    grid-template-columns: 1fr;
  }

  #cast .cast-grid {
    grid-template-columns: 1fr;
  }

  #rhythm .rhythm-grid {
    grid-template-columns: 1fr;
  }

  .glass-card {
    padding: 1.25rem;
  }
}
`;
}
