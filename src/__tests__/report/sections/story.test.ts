import { describe, it, expect } from 'vitest';
import { generateStory } from '../../../report/sections/story.js';
import type { StoryData, Chapter, ContributorSummary } from '../../../types.js';

function makeContributor(overrides: Partial<ContributorSummary> = {}): ContributorSummary {
  return {
    name: 'Alice',
    email: 'alice@example.com',
    commitCount: 10,
    additions: 500,
    deletions: 100,
    firstCommit: new Date('2023-01-15'),
    lastCommit: new Date('2023-06-01'),
    ...overrides,
  };
}

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    title: 'The Beginning',
    description: 'Initial project setup and foundation.',
    startDate: new Date('2023-01-15'),
    endDate: new Date('2023-03-15'),
    commits: [],
    contributors: [
      makeContributor({ name: 'Alice' }),
      makeContributor({ name: 'Bob', email: 'bob@example.com' }),
      makeContributor({ name: 'Charlie', email: 'charlie@example.com' }),
    ],
    totalAdditions: 3000,
    totalDeletions: 500,
    dominantPaths: ['src/'],
    intensity: 0.75,
    ...overrides,
  };
}

function makeStoryData(overrides: Partial<StoryData> = {}): StoryData {
  return {
    repoName: 'my-repo',
    title: 'My Repo',
    totalCommits: 142,
    totalContributors: 7,
    totalAdditions: 9500,
    totalDeletions: 3200,
    firstCommitDate: new Date('2023-01-15'),
    lastCommitDate: new Date('2024-06-20'),
    chapters: [makeChapter()],
    contributors: [],
    dailyActivity: [],
    commits: [],
    ...overrides,
  };
}

describe('generateStory', () => {
  it('returns HTML with id="story"', () => {
    const html = generateStory(makeStoryData());
    expect(html).toContain('id="story"');
  });

  it('contains a timeline container', () => {
    const html = generateStory(makeStoryData());
    expect(html).toContain('timeline');
  });

  it('contains chapter cards with fade-in class', () => {
    const html = generateStory(makeStoryData());
    expect(html).toContain('fade-in');
  });

  it('contains intensity bar elements', () => {
    const data = makeStoryData({
      chapters: [makeChapter({ intensity: 0.75 })],
    });
    const html = generateStory(data);
    expect(html).toContain('intensity');
    expect(html).toContain('75%');
  });

  it('contains contributor pill elements', () => {
    const html = generateStory(makeStoryData());
    expect(html).toContain('pill');
    expect(html).toContain('Alice');
    expect(html).toContain('Bob');
  });

  it('shows chapter title', () => {
    const html = generateStory(makeStoryData({
      chapters: [makeChapter({ title: 'The Great Refactor' })],
    }));
    expect(html).toContain('The Great Refactor');
  });

  it('shows chapter description', () => {
    const html = generateStory(makeStoryData({
      chapters: [makeChapter({ description: 'A major rewrite of the core.' })],
    }));
    expect(html).toContain('A major rewrite of the core.');
  });

  it('shows commit count', () => {
    const commits = Array.from({ length: 5 }, () => ({
      hash: 'abc123',
      author: 'Alice',
      email: 'alice@example.com',
      date: new Date('2023-02-01'),
      subject: 'fix things',
      body: '',
      files: [],
    }));
    const html = generateStory(makeStoryData({
      chapters: [makeChapter({ commits })],
    }));
    expect(html).toContain('5');
  });

  it('shows lines added/removed stats', () => {
    const html = generateStory(makeStoryData({
      chapters: [makeChapter({ totalAdditions: 3000, totalDeletions: 500 })],
    }));
    expect(html).toContain('3,000');
    expect(html).toContain('500');
  });

  it('alternates left/right positioning for multiple chapters', () => {
    const data = makeStoryData({
      chapters: [
        makeChapter({ title: 'Chapter One' }),
        makeChapter({ title: 'Chapter Two' }),
      ],
    });
    const html = generateStory(data);
    expect(html).toContain('timeline-left');
    expect(html).toContain('timeline-right');
  });

  it('limits contributor pills to top 5', () => {
    const contributors = Array.from({ length: 8 }, (_, i) =>
      makeContributor({ name: `Dev${i}`, email: `dev${i}@example.com`, commitCount: 100 - i })
    );
    const html = generateStory(makeStoryData({
      chapters: [makeChapter({ contributors })],
    }));
    expect(html).toContain('Dev0');
    expect(html).toContain('Dev4');
    expect(html).not.toContain('Dev5');
  });

  it('escapes HTML in chapter title and description', () => {
    const html = generateStory(makeStoryData({
      chapters: [makeChapter({
        title: '<script>alert("xss")</script>',
        description: '<img onerror="hack">',
      })],
    }));
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('contains section title "The Story"', () => {
    const html = generateStory(makeStoryData());
    expect(html).toContain('The Story');
  });

  it('shows formatted date range', () => {
    const html = generateStory(makeStoryData({
      chapters: [makeChapter({
        startDate: new Date('2023-01-15'),
        endDate: new Date('2023-03-15'),
      })],
    }));
    expect(html).toContain('Jan');
    expect(html).toContain('2023');
  });
});
