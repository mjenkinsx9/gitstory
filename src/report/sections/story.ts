import type { StoryData, Chapter } from '../../types.js';
import { escapeHtml } from '../../utils/stats.js';

const PILL_COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#c084fc', '#e879f9',
  '#f472b6', '#fb7185', '#f87171', '#fb923c', '#fbbf24',
];

export function generateStory(data: StoryData): string {
  const cards = data.chapters
    .map((chapter, index) => generateChapterCard(chapter, index))
    .join('\n');

  return `
  <section id="story">
    <h2 class="section-title fade-in">The Story</h2>
    <div class="timeline">
      <div class="timeline-line"></div>
      ${cards}
    </div>
  </section>`;
}

function generateChapterCard(chapter: Chapter, index: number): string {
  const side = index % 2 === 0 ? 'timeline-left' : 'timeline-right';
  const title = escapeHtml(chapter.title);
  const description = escapeHtml(chapter.description);
  const dateRange = formatDateRange(chapter.startDate, chapter.endDate);
  const commitCount = chapter.commits.length;
  const intensityPct = `${Math.round(chapter.intensity * 100)}%`;
  const additions = formatNumber(chapter.totalAdditions);
  const deletions = formatNumber(chapter.totalDeletions);

  const topContributors = chapter.contributors
    .slice(0, 5)
    .map((c, i) => {
      const color = PILL_COLORS[i % PILL_COLORS.length];
      const name = escapeHtml(c.name);
      return `<span class="contributor-pill" style="background:${color}">${name}</span>`;
    })
    .join('\n          ');

  return `
      <div class="timeline-card ${side} fade-in">
        <div class="timeline-dot"></div>
        <div class="timeline-card-content">
          <h3 class="chapter-title">${title}</h3>
          <span class="chapter-date">${dateRange}</span>
          <span class="chapter-commits">${commitCount} commit${commitCount === 1 ? '' : 's'}</span>
          <div class="intensity-bar-container">
            <div class="intensity-bar" style="width:${intensityPct}"></div>
          </div>
          <div class="contributor-pills">
            ${topContributors}
          </div>
          <p class="chapter-description">${description}</p>
          <div class="chapter-stats">
            <span class="stat-added">+${additions}</span>
            <span class="stat-removed">-${deletions}</span>
          </div>
        </div>
      </div>`;
}

function formatDateRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', opts);
  const endStr = end.toLocaleDateString('en-US', opts);
  if (startStr === endStr) return startStr;
  return `${startStr} – ${endStr}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}
