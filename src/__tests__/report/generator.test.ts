import { describe, it, expect } from 'vitest';
import { generateHTML, serializeStoryData } from '../../report/generator.js';
import type { StoryData } from '../../types.js';

function createMockStoryData(): StoryData {
  const firstCommitDate = new Date('2024-01-15T10:00:00Z');
  const lastCommitDate = new Date('2024-06-20T15:30:00Z');

  return {
    repoName: 'my-awesome-project',
    title: 'The Story of my-awesome-project',
    totalCommits: 142,
    totalContributors: 5,
    totalAdditions: 12500,
    totalDeletions: 3200,
    firstCommitDate,
    lastCommitDate,
    chapters: [
      {
        title: 'The Beginning',
        description: 'Initial project setup and scaffolding',
        startDate: new Date('2024-01-15T10:00:00Z'),
        endDate: new Date('2024-02-28T18:00:00Z'),
        commits: [
          {
            hash: 'abc1234',
            author: 'Alice',
            email: 'alice@example.com',
            date: new Date('2024-01-15T10:00:00Z'),
            subject: 'Initial commit',
            body: '',
            files: [{ path: 'README.md', additions: 50, deletions: 0 }],
          },
        ],
        contributors: [
          {
            name: 'Alice',
            email: 'alice@example.com',
            commitCount: 30,
            additions: 5000,
            deletions: 800,
            firstCommit: new Date('2024-01-15T10:00:00Z'),
            lastCommit: new Date('2024-02-28T18:00:00Z'),
          },
        ],
        totalAdditions: 5000,
        totalDeletions: 800,
        dominantPaths: ['src/', 'package.json'],
        intensity: 0.7,
      },
    ],
    contributors: [
      {
        name: 'Alice',
        email: 'alice@example.com',
        commitCount: 80,
        additions: 8000,
        deletions: 2000,
        firstCommit: firstCommitDate,
        lastCommit: lastCommitDate,
      },
      {
        name: 'Bob',
        email: 'bob@example.com',
        commitCount: 62,
        additions: 4500,
        deletions: 1200,
        firstCommit: new Date('2024-02-01T09:00:00Z'),
        lastCommit: new Date('2024-06-18T12:00:00Z'),
      },
    ],
    dailyActivity: [
      { date: '2024-01-15', count: 3, additions: 200, deletions: 10 },
      { date: '2024-01-16', count: 5, additions: 350, deletions: 45 },
      { date: '2024-02-01', count: 2, additions: 120, deletions: 30 },
    ],
    commits: [
      {
        hash: 'abc1234',
        author: 'Alice',
        email: 'alice@example.com',
        date: new Date('2024-01-15T10:00:00Z'),
        subject: 'Initial commit',
        body: '',
        files: [{ path: 'README.md', additions: 50, deletions: 0 }],
      },
      {
        hash: 'def5678',
        author: 'Bob',
        email: 'bob@example.com',
        date: new Date('2024-02-01T09:00:00Z'),
        subject: 'Add feature X',
        body: 'Implements the X feature',
        files: [{ path: 'src/feature.ts', additions: 120, deletions: 30 }],
      },
    ],
  };
}

describe('generateHTML', () => {
  const data = createMockStoryData();

  it('returns string starting with <!DOCTYPE html>', () => {
    const html = generateHTML(data);
    expect(html.trimStart()).toMatch(/^<!DOCTYPE html>/);
  });

  it('contains all 7 section IDs', () => {
    const html = generateHTML(data);
    expect(html).toContain('id="hero"');
    expect(html).toContain('id="prologue"');
    expect(html).toContain('id="pulse"');
    expect(html).toContain('id="story"');
    expect(html).toContain('id="cast"');
    expect(html).toContain('id="rhythm"');
    expect(html).toContain('id="epilogue"');
  });

  it('contains D3.js CDN script tag', () => {
    const html = generateHTML(data);
    expect(html).toContain('https://d3js.org/d3.v7.min.js');
  });

  it('contains Google Fonts link tags for Inter and JetBrains Mono', () => {
    const html = generateHTML(data);
    expect(html).toContain('fonts.googleapis.com');
    expect(html).toContain('Inter');
    expect(html).toContain('JetBrains+Mono');
  });

  it('contains IntersectionObserver code', () => {
    const html = generateHTML(data);
    expect(html).toContain('IntersectionObserver');
  });

  it('contains noise filter SVG (feTurbulence)', () => {
    const html = generateHTML(data);
    expect(html).toContain('feTurbulence');
  });

  it('contains STORY_DATA JSON embedding', () => {
    const html = generateHTML(data);
    expect(html).toContain('STORY_DATA');
    // Should contain the serialized repo name
    expect(html).toContain('my-awesome-project');
  });

  it('contains counter animation code', () => {
    const html = generateHTML(data);
    expect(html).toMatch(/animateCounter|requestAnimationFrame/);
  });

  it('contains tooltip elements/references', () => {
    const html = generateHTML(data);
    expect(html).toContain('tooltip');
  });

  it('contains responsive @media queries', () => {
    const html = generateHTML(data);
    expect(html).toContain('@media');
  });
});

describe('serializeStoryData', () => {
  it('converts Date objects to ISO strings', () => {
    const data = createMockStoryData();
    const serialized = serializeStoryData(data);
    const parsed = JSON.parse(JSON.stringify(serialized));

    // Top-level dates should be strings
    expect(typeof parsed.firstCommitDate).toBe('string');
    expect(typeof parsed.lastCommitDate).toBe('string');

    // Contributor dates should be strings
    expect(typeof parsed.contributors[0].firstCommit).toBe('string');
    expect(typeof parsed.contributors[0].lastCommit).toBe('string');

    // Chapter dates should be strings
    expect(typeof parsed.chapters[0].startDate).toBe('string');
    expect(typeof parsed.chapters[0].endDate).toBe('string');

    // Commit dates should be strings
    expect(typeof parsed.commits[0].date).toBe('string');
  });
});
