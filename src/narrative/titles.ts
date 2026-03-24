import { Chapter } from '../types.js';

const REFACTORING_TITLES = [
  'The Great Refactoring',
  'Cleanup & Refactoring',
  'The Clean Sweep',
];

const BUG_TITLES = [
  'Bug Squashing Marathon',
  'The Bug Hunt',
  'Fix & Patch Sprint',
];

const SPRINT_TITLES = [
  'Sprint Mode',
  'The Sprint',
  'Development Blitz',
];

function pick(options: string[], seed: number): string {
  return options[Math.abs(seed) % options.length];
}

function simpleSeed(chapter: Chapter): number {
  return chapter.commits.length + chapter.totalAdditions + chapter.totalDeletions;
}

function getTopDirectory(chapter: Chapter): string | null {
  const dirCounts = new Map<string, number>();
  let totalFiles = 0;

  for (const commit of chapter.commits) {
    for (const file of commit.files) {
      const topDir = file.path.split('/')[0];
      // Only count if the path actually has a directory (not root-level files)
      if (file.path.includes('/')) {
        dirCounts.set(topDir, (dirCounts.get(topDir) ?? 0) + 1);
      }
      totalFiles++;
    }
  }

  if (totalFiles === 0) return null;

  for (const [dir, count] of dirCounts) {
    if (count / totalFiles > 0.7) {
      return dir;
    }
  }

  return null;
}

function getCommitsPerDay(chapter: Chapter): number {
  const start = chapter.startDate.getTime();
  const end = chapter.endDate.getTime();
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  return chapter.commits.length / days;
}

function formatMonth(date: Date): string {
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function generateChapterTitle(chapter: Chapter): string {
  const seed = simpleSeed(chapter);

  // 1. High deletion-to-addition ratio → refactoring
  if (chapter.totalDeletions > 2 * chapter.totalAdditions) {
    return pick(REFACTORING_TITLES, seed);
  }

  // 2. >50% of commit subjects contain fix/bug/patch
  const fixPattern = /\b(fix|bug|patch)\b/i;
  const fixCount = chapter.commits.filter((c) => fixPattern.test(c.subject)).length;
  if (chapter.commits.length > 0 && fixCount / chapter.commits.length > 0.5) {
    return pick(BUG_TITLES, seed);
  }

  // 3. >70% of file changes in a single top-level directory
  const topDir = getTopDirectory(chapter);
  if (topDir) {
    const dirTitles = [
      `Feature Sprint: ${topDir}`,
      `Deep Dive into ${topDir}`,
      `Building ${topDir}`,
    ];
    return pick(dirTitles, seed);
  }

  // 4. Single contributor
  if (chapter.contributors.length === 1) {
    const author = chapter.contributors[0].name;
    const soloTitles = [
      `${author}'s Solo`,
      `A Solo Act by ${author}`,
      `${author}'s Chapter`,
    ];
    return pick(soloTitles, seed);
  }

  // 5. High commit frequency (>5 per day)
  if (getCommitsPerDay(chapter) > 5) {
    return pick(SPRINT_TITLES, seed);
  }

  // 6. Fallback: date range
  const startMonth = formatMonth(chapter.startDate);
  const endMonth = formatMonth(chapter.endDate);
  if (startMonth === endMonth) {
    return `Chapter: ${startMonth}`;
  }
  return `Chapter: ${startMonth} – ${endMonth}`;
}
