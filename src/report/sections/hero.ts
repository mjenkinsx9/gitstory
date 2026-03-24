import type { StoryData } from '../../types.js';
import { escapeHtml } from '../../utils/stats.js';

export function generateHero(data: StoryData): string {
  const repoName = escapeHtml(data.repoName);
  const title = escapeHtml(data.title);
  const timespan = formatTimespan(data.firstCommitDate, data.lastCommitDate);

  return `
  <section id="hero">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
    <div class="orb orb-4"></div>
    <div class="hero-content">
      <h1 class="gradient-text">${repoName}</h1>
      <p class="hero-subtitle">${title}</p>
      <div class="hero-stats">
        <div class="hero-stat">
          <span class="hero-stat-value">${data.totalCommits}</span>
          <span class="hero-stat-label">Commits</span>
        </div>
        <div class="hero-stat">
          <span class="hero-stat-value">${data.totalContributors}</span>
          <span class="hero-stat-label">Contributors</span>
        </div>
        <div class="hero-stat">
          <span class="hero-stat-value">${timespan}</span>
          <span class="hero-stat-label">Timespan</span>
        </div>
      </div>
    </div>
  </section>`;
}

function formatTimespan(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days < 1) return 'less than a day';
  if (days < 30) return `${days} day${days === 1 ? '' : 's'}`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years} year${years === 1 ? '' : 's'}, ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
}
