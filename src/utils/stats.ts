import type {
  GitCommit,
  ContributorSummary,
  DailyActivity,
} from '../types.js';

export function computeContributors(
  commits: GitCommit[]
): ContributorSummary[] {
  const map = new Map<
    string,
    {
      name: string;
      email: string;
      commitCount: number;
      additions: number;
      deletions: number;
      firstCommit: Date;
      lastCommit: Date;
    }
  >();

  for (const commit of commits) {
    const existing = map.get(commit.email);
    const additions = commit.files.reduce((sum, f) => sum + f.additions, 0);
    const deletions = commit.files.reduce((sum, f) => sum + f.deletions, 0);

    if (existing) {
      existing.commitCount++;
      existing.additions += additions;
      existing.deletions += deletions;
      if (commit.date < existing.firstCommit) {
        existing.firstCommit = commit.date;
      }
      if (commit.date > existing.lastCommit) {
        existing.lastCommit = commit.date;
      }
    } else {
      map.set(commit.email, {
        name: commit.author,
        email: commit.email,
        commitCount: 1,
        additions,
        deletions,
        firstCommit: commit.date,
        lastCommit: commit.date,
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.commitCount - a.commitCount
  );
}

export function computeDailyActivity(commits: GitCommit[]): DailyActivity[] {
  const map = new Map<
    string,
    { count: number; additions: number; deletions: number }
  >();

  for (const commit of commits) {
    const dateStr = commit.date.toISOString().slice(0, 10);
    const additions = commit.files.reduce((sum, f) => sum + f.additions, 0);
    const deletions = commit.files.reduce((sum, f) => sum + f.deletions, 0);

    const existing = map.get(dateStr);
    if (existing) {
      existing.count++;
      existing.additions += additions;
      existing.deletions += deletions;
    } else {
      map.set(dateStr, { count: 1, additions, deletions });
    }
  }

  return Array.from(map.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
