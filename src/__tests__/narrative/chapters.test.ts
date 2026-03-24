import { describe, it, expect } from 'vitest';
import type { GitCommit, Chapter } from '../../types.js';
import { clusterIntoChapters } from '../../narrative/chapters.js';

function makeCommit(overrides: Partial<GitCommit> = {}): GitCommit {
  return {
    hash: 'abc123',
    author: 'Alice',
    email: 'alice@example.com',
    date: new Date('2025-01-01T12:00:00Z'),
    subject: 'test commit',
    body: '',
    files: [{ path: 'src/index.ts', additions: 10, deletions: 2 }],
    ...overrides,
  };
}

describe('clusterIntoChapters', () => {
  it('should return 1 chapter for a single commit', () => {
    const commits = [makeCommit()];
    const chapters = clusterIntoChapters(commits);
    expect(chapters).toHaveLength(1);
    expect(chapters[0].commits).toHaveLength(1);
  });

  it('should return 1 chapter for 3 commits within 1 hour', () => {
    const commits = [
      makeCommit({ hash: 'a', date: new Date('2025-01-01T12:00:00Z') }),
      makeCommit({ hash: 'b', date: new Date('2025-01-01T12:30:00Z') }),
      makeCommit({ hash: 'c', date: new Date('2025-01-01T12:45:00Z') }),
    ];
    const chapters = clusterIntoChapters(commits);
    expect(chapters).toHaveLength(1);
    expect(chapters[0].commits).toHaveLength(3);
  });

  it('should return 2 chapters for commits with a 48h gap', () => {
    const commits = [
      makeCommit({ hash: 'a', date: new Date('2025-01-01T12:00:00Z') }),
      makeCommit({ hash: 'b', date: new Date('2025-01-03T12:00:00Z') }),
    ];
    const chapters = clusterIntoChapters(commits);
    expect(chapters).toHaveLength(2);
    expect(chapters[0].commits).toHaveLength(1);
    expect(chapters[1].commits).toHaveLength(1);
  });

  it('should set correct startDate and endDate from commits', () => {
    const commits = [
      makeCommit({ hash: 'a', date: new Date('2025-01-01T10:00:00Z') }),
      makeCommit({ hash: 'b', date: new Date('2025-01-01T14:00:00Z') }),
      makeCommit({ hash: 'c', date: new Date('2025-01-01T18:00:00Z') }),
    ];
    const chapters = clusterIntoChapters(commits);
    expect(chapters).toHaveLength(1);
    expect(chapters[0].startDate).toEqual(new Date('2025-01-01T10:00:00Z'));
    expect(chapters[0].endDate).toEqual(new Date('2025-01-01T18:00:00Z'));
  });

  it('should compute correct totalAdditions and totalDeletions', () => {
    const commits = [
      makeCommit({
        hash: 'a',
        date: new Date('2025-01-01T12:00:00Z'),
        files: [
          { path: 'src/a.ts', additions: 10, deletions: 2 },
          { path: 'src/b.ts', additions: 5, deletions: 1 },
        ],
      }),
      makeCommit({
        hash: 'b',
        date: new Date('2025-01-01T13:00:00Z'),
        files: [{ path: 'src/c.ts', additions: 20, deletions: 5 }],
      }),
    ];
    const chapters = clusterIntoChapters(commits);
    expect(chapters[0].totalAdditions).toBe(35);
    expect(chapters[0].totalDeletions).toBe(8);
  });

  it('should compute correct contributors list', () => {
    const commits = [
      makeCommit({
        hash: 'a',
        author: 'Alice',
        email: 'alice@example.com',
        date: new Date('2025-01-01T12:00:00Z'),
        files: [{ path: 'src/a.ts', additions: 10, deletions: 2 }],
      }),
      makeCommit({
        hash: 'b',
        author: 'Bob',
        email: 'bob@example.com',
        date: new Date('2025-01-01T13:00:00Z'),
        files: [{ path: 'src/b.ts', additions: 5, deletions: 1 }],
      }),
      makeCommit({
        hash: 'c',
        author: 'Alice',
        email: 'alice@example.com',
        date: new Date('2025-01-01T14:00:00Z'),
        files: [{ path: 'src/c.ts', additions: 20, deletions: 5 }],
      }),
    ];
    const chapters = clusterIntoChapters(commits);
    expect(chapters[0].contributors).toHaveLength(2);

    const alice = chapters[0].contributors.find((c) => c.email === 'alice@example.com');
    expect(alice).toBeDefined();
    expect(alice!.commitCount).toBe(2);
    expect(alice!.additions).toBe(30);
    expect(alice!.deletions).toBe(7);
    expect(alice!.firstCommit).toEqual(new Date('2025-01-01T12:00:00Z'));
    expect(alice!.lastCommit).toEqual(new Date('2025-01-01T14:00:00Z'));

    const bob = chapters[0].contributors.find((c) => c.email === 'bob@example.com');
    expect(bob).toBeDefined();
    expect(bob!.commitCount).toBe(1);
    expect(bob!.additions).toBe(5);
    expect(bob!.deletions).toBe(1);
  });

  it('should extract dominant paths correctly (most common directories)', () => {
    const commits = [
      makeCommit({
        hash: 'a',
        date: new Date('2025-01-01T12:00:00Z'),
        files: [
          { path: 'src/index.ts', additions: 1, deletions: 0 },
          { path: 'src/utils.ts', additions: 1, deletions: 0 },
          { path: 'src/lib/foo.ts', additions: 1, deletions: 0 },
          { path: 'tests/a.test.ts', additions: 1, deletions: 0 },
          { path: 'docs/readme.md', additions: 1, deletions: 0 },
        ],
      }),
      makeCommit({
        hash: 'b',
        date: new Date('2025-01-01T13:00:00Z'),
        files: [
          { path: 'src/bar.ts', additions: 1, deletions: 0 },
          { path: 'tests/b.test.ts', additions: 1, deletions: 0 },
        ],
      }),
    ];
    const chapters = clusterIntoChapters(commits);
    // src appears 4 times, tests 2 times, docs 1 time → top 3
    expect(chapters[0].dominantPaths).toEqual(['src', 'tests', 'docs']);
  });

  it('should normalize intensity: single chapter has intensity 1.0', () => {
    const commits = [makeCommit()];
    const chapters = clusterIntoChapters(commits);
    expect(chapters[0].intensity).toBe(1.0);
  });

  it('should normalize intensity proportionally across chapters', () => {
    // Chapter 1: 3 commits in 1 day → 3 commits/day
    // Chapter 2: 1 commit in 1 day → 1 commit/day
    // Max is 3, so chapter 1 intensity = 1.0, chapter 2 = 1/3
    const commits = [
      makeCommit({ hash: 'a', date: new Date('2025-01-01T10:00:00Z') }),
      makeCommit({ hash: 'b', date: new Date('2025-01-01T12:00:00Z') }),
      makeCommit({ hash: 'c', date: new Date('2025-01-01T14:00:00Z') }),
      // 48h gap → new chapter
      makeCommit({ hash: 'd', date: new Date('2025-01-03T12:00:00Z') }),
    ];
    const chapters = clusterIntoChapters(commits);
    expect(chapters).toHaveLength(2);
    expect(chapters[0].intensity).toBeCloseTo(1.0);
    expect(chapters[1].intensity).toBeCloseTo(1 / 3);
  });

  it('should leave title as empty string', () => {
    const commits = [makeCommit()];
    const chapters = clusterIntoChapters(commits);
    expect(chapters[0].title).toBe('');
  });

  it('should return empty array for empty input', () => {
    const chapters = clusterIntoChapters([]);
    expect(chapters).toHaveLength(0);
  });

  it('should sort commits by date ascending before clustering', () => {
    const commits = [
      makeCommit({ hash: 'b', date: new Date('2025-01-01T14:00:00Z') }),
      makeCommit({ hash: 'a', date: new Date('2025-01-01T10:00:00Z') }),
    ];
    const chapters = clusterIntoChapters(commits);
    expect(chapters).toHaveLength(1);
    expect(chapters[0].commits[0].hash).toBe('a');
    expect(chapters[0].commits[1].hash).toBe('b');
  });
});
