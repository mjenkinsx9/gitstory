import { describe, it, expect } from 'vitest';
import type { GitCommit } from '../../types.js';
import {
  computeContributors,
  computeDailyActivity,
  escapeHtml,
} from '../../utils/stats.js';

function makeCommit(overrides: Partial<GitCommit> = {}): GitCommit {
  return {
    hash: 'abc123',
    author: 'Alice',
    email: 'alice@example.com',
    date: new Date('2025-03-15T10:00:00Z'),
    subject: 'test commit',
    body: '',
    files: [{ path: 'src/index.ts', additions: 10, deletions: 3 }],
    ...overrides,
  };
}

describe('computeContributors', () => {
  it('aggregates commits by email with correct commitCount, additions, deletions, firstCommit, lastCommit', () => {
    const commits: GitCommit[] = [
      makeCommit({
        hash: 'a1',
        email: 'alice@example.com',
        author: 'Alice',
        date: new Date('2025-01-10T10:00:00Z'),
        files: [
          { path: 'a.ts', additions: 5, deletions: 2 },
          { path: 'b.ts', additions: 3, deletions: 1 },
        ],
      }),
      makeCommit({
        hash: 'b1',
        email: 'bob@example.com',
        author: 'Bob',
        date: new Date('2025-02-15T10:00:00Z'),
        files: [{ path: 'c.ts', additions: 20, deletions: 10 }],
      }),
    ];

    const contributors = computeContributors(commits);
    expect(contributors).toHaveLength(2);

    const alice = contributors.find((c) => c.email === 'alice@example.com')!;
    expect(alice.name).toBe('Alice');
    expect(alice.commitCount).toBe(1);
    expect(alice.additions).toBe(8);
    expect(alice.deletions).toBe(3);
    expect(alice.firstCommit).toEqual(new Date('2025-01-10T10:00:00Z'));
    expect(alice.lastCommit).toEqual(new Date('2025-01-10T10:00:00Z'));

    const bob = contributors.find((c) => c.email === 'bob@example.com')!;
    expect(bob.name).toBe('Bob');
    expect(bob.commitCount).toBe(1);
    expect(bob.additions).toBe(20);
    expect(bob.deletions).toBe(10);
  });

  it('merges multiple commits from the same author into a single ContributorSummary', () => {
    const commits: GitCommit[] = [
      makeCommit({
        hash: 'a1',
        email: 'alice@example.com',
        author: 'Alice',
        date: new Date('2025-01-01T10:00:00Z'),
        files: [{ path: 'a.ts', additions: 10, deletions: 2 }],
      }),
      makeCommit({
        hash: 'a2',
        email: 'alice@example.com',
        author: 'Alice',
        date: new Date('2025-03-01T10:00:00Z'),
        files: [{ path: 'b.ts', additions: 5, deletions: 1 }],
      }),
      makeCommit({
        hash: 'a3',
        email: 'alice@example.com',
        author: 'Alice',
        date: new Date('2025-02-01T10:00:00Z'),
        files: [{ path: 'c.ts', additions: 7, deletions: 3 }],
      }),
    ];

    const contributors = computeContributors(commits);
    expect(contributors).toHaveLength(1);

    const alice = contributors[0];
    expect(alice.name).toBe('Alice');
    expect(alice.email).toBe('alice@example.com');
    expect(alice.commitCount).toBe(3);
    expect(alice.additions).toBe(22);
    expect(alice.deletions).toBe(6);
    expect(alice.firstCommit).toEqual(new Date('2025-01-01T10:00:00Z'));
    expect(alice.lastCommit).toEqual(new Date('2025-03-01T10:00:00Z'));
  });

  it('sorts contributors by commitCount descending', () => {
    const commits: GitCommit[] = [
      makeCommit({ hash: 'b1', email: 'bob@example.com', author: 'Bob' }),
      makeCommit({ hash: 'a1', email: 'alice@example.com', author: 'Alice' }),
      makeCommit({ hash: 'a2', email: 'alice@example.com', author: 'Alice' }),
    ];

    const contributors = computeContributors(commits);
    expect(contributors[0].email).toBe('alice@example.com');
    expect(contributors[1].email).toBe('bob@example.com');
  });
});

describe('computeDailyActivity', () => {
  it('groups commits by YYYY-MM-DD with correct count and additions/deletions per day', () => {
    const commits: GitCommit[] = [
      makeCommit({
        hash: 'a1',
        date: new Date('2025-03-15T10:00:00Z'),
        files: [{ path: 'a.ts', additions: 10, deletions: 2 }],
      }),
      makeCommit({
        hash: 'b1',
        date: new Date('2025-03-16T14:00:00Z'),
        files: [{ path: 'b.ts', additions: 5, deletions: 1 }],
      }),
    ];

    const activity = computeDailyActivity(commits);
    expect(activity).toHaveLength(2);

    expect(activity[0].date).toBe('2025-03-15');
    expect(activity[0].count).toBe(1);
    expect(activity[0].additions).toBe(10);
    expect(activity[0].deletions).toBe(2);

    expect(activity[1].date).toBe('2025-03-16');
    expect(activity[1].count).toBe(1);
    expect(activity[1].additions).toBe(5);
    expect(activity[1].deletions).toBe(1);
  });

  it('merges multiple commits on the same day into a single DailyActivity entry', () => {
    const commits: GitCommit[] = [
      makeCommit({
        hash: 'a1',
        date: new Date('2025-03-15T09:00:00Z'),
        files: [{ path: 'a.ts', additions: 10, deletions: 2 }],
      }),
      makeCommit({
        hash: 'a2',
        date: new Date('2025-03-15T17:00:00Z'),
        files: [
          { path: 'b.ts', additions: 5, deletions: 1 },
          { path: 'c.ts', additions: 3, deletions: 0 },
        ],
      }),
    ];

    const activity = computeDailyActivity(commits);
    expect(activity).toHaveLength(1);
    expect(activity[0].date).toBe('2025-03-15');
    expect(activity[0].count).toBe(2);
    expect(activity[0].additions).toBe(18);
    expect(activity[0].deletions).toBe(3);
  });

  it('sorts activity by date ascending', () => {
    const commits: GitCommit[] = [
      makeCommit({ hash: 'b1', date: new Date('2025-03-20T10:00:00Z') }),
      makeCommit({ hash: 'a1', date: new Date('2025-03-10T10:00:00Z') }),
      makeCommit({ hash: 'c1', date: new Date('2025-03-15T10:00:00Z') }),
    ];

    const activity = computeDailyActivity(commits);
    expect(activity[0].date).toBe('2025-03-10');
    expect(activity[1].date).toBe('2025-03-15');
    expect(activity[2].date).toBe('2025-03-20');
  });
});

describe('escapeHtml', () => {
  it('escapes &, <, >, ", and \'', () => {
    expect(escapeHtml('&')).toBe('&amp;');
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('>')).toBe('&gt;');
    expect(escapeHtml('"')).toBe('&quot;');
    expect(escapeHtml("'")).toBe('&#39;');
  });

  it('escapes all special characters in a mixed string', () => {
    expect(escapeHtml('<script>alert("xss" & \'bad\')</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot; &amp; &#39;bad&#39;)&lt;/script&gt;'
    );
  });

  it('returns the same string when no special characters are present', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});
