import type { StoryData } from '../types.js';
import { escapeHtml } from '../utils/stats.js';
import { getStyles } from './styles.js';
import { generateHero } from './sections/hero.js';
import { generatePrologue } from './sections/prologue.js';
import { generatePulse, getPulseScript } from './sections/pulse.js';
import { generateStory } from './sections/story.js';
import { generateCast, getCastScript } from './sections/cast.js';
import { generateRhythm, getRhythmScript } from './sections/rhythm.js';
import { generateEpilogue } from './sections/epilogue.js';

/**
 * Converts all Date fields in StoryData to ISO strings for safe JSON serialization.
 */
export function serializeStoryData(data: StoryData): Record<string, unknown> {
  return {
    repoName: data.repoName,
    title: data.title,
    totalCommits: data.totalCommits,
    totalContributors: data.totalContributors,
    totalAdditions: data.totalAdditions,
    totalDeletions: data.totalDeletions,
    firstCommitDate: data.firstCommitDate.toISOString(),
    lastCommitDate: data.lastCommitDate.toISOString(),
    chapters: data.chapters.map((ch) => ({
      title: ch.title,
      description: ch.description,
      startDate: ch.startDate.toISOString(),
      endDate: ch.endDate.toISOString(),
      commits: ch.commits.map((c) => ({
        ...c,
        date: c.date.toISOString(),
      })),
      contributors: ch.contributors.map((con) => ({
        ...con,
        firstCommit: con.firstCommit.toISOString(),
        lastCommit: con.lastCommit.toISOString(),
      })),
      totalAdditions: ch.totalAdditions,
      totalDeletions: ch.totalDeletions,
      dominantPaths: ch.dominantPaths,
      intensity: ch.intensity,
    })),
    contributors: data.contributors.map((con) => ({
      ...con,
      firstCommit: con.firstCommit.toISOString(),
      lastCommit: con.lastCommit.toISOString(),
    })),
    dailyActivity: data.dailyActivity,
    commits: data.commits.map((c) => ({
      ...c,
      date: c.date.toISOString(),
    })),
  };
}

/**
 * Returns the IntersectionObserver and counter animation script.
 */
export function getAnimationScript(): string {
  return `
(function() {
  // IntersectionObserver for fade-in elements
  var fadeEls = document.querySelectorAll('.fade-in');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    fadeEls.forEach(function(el) {
      observer.observe(el);
    });
  } else {
    // Fallback: make all visible immediately
    fadeEls.forEach(function(el) {
      el.classList.add('visible');
    });
  }

  // Counter animation for .counter elements
  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10);
    if (isNaN(target)) return;
    var duration = 2000;
    var start = null;

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString();
      }
    }

    requestAnimationFrame(step);
  }

  var counterEls = document.querySelectorAll('.counter');
  if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    counterEls.forEach(function(el) {
      counterObserver.observe(el);
    });
  } else {
    counterEls.forEach(function(el) {
      el.textContent = el.getAttribute('data-target');
    });
  }
})();
`;
}

/**
 * Generates a complete, self-contained HTML report from StoryData.
 */
export function generateHTML(data: StoryData): string {
  const title = escapeHtml(data.title);
  const serializedData = JSON.stringify(serializeStoryData(data));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>${getStyles()}</style>
</head>
<body>
  <!-- Noise filter SVG -->
  <svg style="position:absolute;width:0;height:0;">
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
  </svg>
  <div class="noise-overlay"></div>

  ${generateHero(data)}
  ${generatePrologue(data)}
  ${generatePulse()}
  ${generateStory(data)}
  ${generateCast()}
  ${generateRhythm()}
  ${generateEpilogue(data)}

  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script>const STORY_DATA = ${serializedData};</script>
  <script>${getPulseScript()}</script>
  <script>${getCastScript()}</script>
  <script>${getRhythmScript()}</script>
  <script>${getAnimationScript()}</script>
</body>
</html>`;
}
