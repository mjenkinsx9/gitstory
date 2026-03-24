import { describe, it, expect } from 'vitest';
import { generateChapterTitle } from '../../narrative/titles.js';
import { Chapter, GitCommit, ContributorSummary } from '../../types.js';

function makeCommit(overrides: Partial<GitCommit> = {}): GitCommit {
  return {
    hash: 'abc123',
    author: 'Alice',
    email: 'alice@example.com',
    date: new Date('2025-06-15'),
    subject: 'some commit',
    body: '',
    files: [],
    ...overrides,
  };
}

function makeContributor(overrides: Partial<ContributorSummary> = {}): ContributorSummary {
  return {
    name: 'Alice',
    email: 'alice@example.com',
    commitCount: 5,
    additions: 100,
    deletions: 50,
    firstCommit: new Date('2025-06-01'),
    lastCommit: new Date('2025-06-30'),
    ...overrides,
  };
}

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    title: '',
    description: '',
    startDate: new Date('2025-06-01'),
    endDate: new Date('2025-06-30'),
    commits: [makeCommit()],
    contributors: [makeContributor()],
    totalAdditions: 100,
    totalDeletions: 50,
    dominantPaths: ['src/'],
    intensity: 0.5,
    ...overrides,
  };
}

describe('generateChapterTitle', () => {
  it('generates a refactoring title when deletions > 2x additions', () => {
    const chapter = makeChapter({
      totalAdditions: 50,
      totalDeletions: 150,
    });
    const title = generateChapterTitle(chapter);
    expect(title.toLowerCase()).toMatch(/refactor|cleanup|clean/);
  });

  it('generates a bug-squashing title when >50% commits mention fix/bug/patch', () => {
    const commits = [
      makeCommit({ subject: 'fix: resolve login issue' }),
      makeCommit({ subject: 'bug: handle null pointer' }),
      makeCommit({ subject: 'patch: update validation' }),
      makeCommit({ subject: 'fix: correct date parsing' }),
      makeCommit({ subject: 'add new feature' }),
    ];
    const chapter = makeChapter({ commits });
    const title = generateChapterTitle(chapter);
    expect(title.toLowerCase()).toMatch(/bug|fix|squash|hunt|patch/);
  });

  it('generates a directory-focused title when >70% of dominant paths share a top-level dir', () => {
    const commits = [
      makeCommit({
        files: [
          { path: 'api/routes.ts', additions: 10, deletions: 2 },
          { path: 'api/middleware.ts', additions: 5, deletions: 1 },
          { path: 'api/handlers.ts', additions: 8, deletions: 3 },
        ],
      }),
      makeCommit({
        files: [
          { path: 'api/models.ts', additions: 12, deletions: 0 },
          { path: 'api/utils.ts', additions: 3, deletions: 1 },
          { path: 'config/db.ts', additions: 2, deletions: 0 },
          { path: 'README.md', additions: 1, deletions: 0 },
        ],
      }),
    ];
    const chapter = makeChapter({
      commits,
      dominantPaths: ['api/'],
    });
    const title = generateChapterTitle(chapter);
    expect(title.toLowerCase()).toContain('api');
  });

  it('generates a solo author title when there is a single contributor', () => {
    const chapter = makeChapter({
      contributors: [makeContributor({ name: 'Bob' })],
    });
    // Need to make sure other patterns don't match first
    const title = generateChapterTitle(chapter);
    expect(title).toContain('Bob');
  });

  it('generates a sprint title when commit frequency is high (>5 per day)', () => {
    // 30 commits over 3 days = 10 per day
    const commits: GitCommit[] = [];
    for (let i = 0; i < 30; i++) {
      commits.push(
        makeCommit({
          hash: `hash${i}`,
          date: new Date('2025-06-01'),
          author: 'Alice',
          subject: `update component ${i}`,
          files: [
            { path: `src/components/comp${i}.ts`, additions: 5, deletions: 2 },
            { path: `lib/utils/helper${i}.ts`, additions: 3, deletions: 1 },
          ],
        }),
      );
    }
    const chapter = makeChapter({
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-06-03'),
      commits,
      contributors: [
        makeContributor({ name: 'Alice' }),
        makeContributor({ name: 'Bob' }),
      ],
      totalAdditions: 500,
      totalDeletions: 100,
    });
    const title = generateChapterTitle(chapter);
    expect(title.toLowerCase()).toMatch(/sprint|blitz|burst/);
  });

  it('generates a fallback title with date range when no pattern matches', () => {
    const chapter = makeChapter({
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-03-31'),
      commits: [
        makeCommit({ subject: 'update docs', author: 'Alice' }),
        makeCommit({ subject: 'add tests', author: 'Bob' }),
      ],
      contributors: [
        makeContributor({ name: 'Alice' }),
        makeContributor({ name: 'Bob' }),
      ],
      totalAdditions: 100,
      totalDeletions: 50,
    });
    const title = generateChapterTitle(chapter);
    // Should contain month or date-related info
    expect(title).toMatch(/March|Mar|2025|Chapter/i);
  });
});
