import type { GitCommit, Chapter, ContributorSummary } from '../types.js';

const GAP_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export function clusterIntoChapters(commits: GitCommit[]): Chapter[] {
  if (commits.length === 0) return [];

  // Sort by date ascending
  const sorted = [...commits].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Group commits into clusters based on time gaps
  const groups: GitCommit[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].date.getTime() - sorted[i - 1].date.getTime();
    if (gap > GAP_THRESHOLD_MS) {
      groups.push([sorted[i]]);
    } else {
      groups[groups.length - 1].push(sorted[i]);
    }
  }

  // Build chapters
  const chapters: Chapter[] = groups.map((group) => buildChapter(group));

  // Normalize intensity
  normalizeIntensity(chapters);

  return chapters;
}

function buildChapter(commits: GitCommit[]): Chapter {
  const startDate = commits[0].date;
  const endDate = commits[commits.length - 1].date;

  let totalAdditions = 0;
  let totalDeletions = 0;
  const pathCounts = new Map<string, number>();
  const contributorMap = new Map<string, ContributorSummary>();

  for (const commit of commits) {
    for (const file of commit.files) {
      totalAdditions += file.additions;
      totalDeletions += file.deletions;

      const topDir = file.path.includes('/')
        ? file.path.split('/')[0]
        : file.path;
      pathCounts.set(topDir, (pathCounts.get(topDir) || 0) + 1);
    }

    const existing = contributorMap.get(commit.email);
    const commitAdditions = commit.files.reduce((s, f) => s + f.additions, 0);
    const commitDeletions = commit.files.reduce((s, f) => s + f.deletions, 0);

    if (existing) {
      existing.commitCount++;
      existing.additions += commitAdditions;
      existing.deletions += commitDeletions;
      if (commit.date < existing.firstCommit) existing.firstCommit = commit.date;
      if (commit.date > existing.lastCommit) existing.lastCommit = commit.date;
    } else {
      contributorMap.set(commit.email, {
        name: commit.author,
        email: commit.email,
        commitCount: 1,
        additions: commitAdditions,
        deletions: commitDeletions,
        firstCommit: commit.date,
        lastCommit: commit.date,
      });
    }
  }

  // Top 3 dominant paths by frequency
  const dominantPaths = [...pathCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([path]) => path);

  // Auto-generated description
  const contributors = [...contributorMap.values()];
  const fileCount = new Set(commits.flatMap((c) => c.files.map((f) => f.path))).size;
  const description = `${commits.length} commit${commits.length === 1 ? '' : 's'} by ${contributors.length} contributor${contributors.length === 1 ? '' : 's'} across ${fileCount} file${fileCount === 1 ? '' : 's'}`;

  return {
    title: '',
    description,
    startDate,
    endDate,
    commits,
    contributors,
    totalAdditions,
    totalDeletions,
    dominantPaths,
    intensity: 0, // will be normalized later
  };
}

function normalizeIntensity(chapters: Chapter[]): void {
  if (chapters.length === 0) return;

  const commitsPerDay = chapters.map((ch) => {
    const daySpan = Math.max(
      1,
      Math.ceil(
        (ch.endDate.getTime() - ch.startDate.getTime()) / (24 * 60 * 60 * 1000)
      )
    );
    return ch.commits.length / daySpan;
  });

  const maxRate = Math.max(...commitsPerDay);

  for (let i = 0; i < chapters.length; i++) {
    chapters[i].intensity = maxRate > 0 ? commitsPerDay[i] / maxRate : 1;
  }
}
