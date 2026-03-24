import { describe, it, expect } from 'vitest';
import type {
  FileChange,
  GitCommit,
  ContributorSummary,
  Chapter,
  DailyActivity,
  StoryData,
  AnalyzeOptions,
} from '../types.js';

describe('Type Definitions', () => {
  it('should create a valid FileChange', () => {
    const fc: FileChange = {
      path: 'src/index.ts',
      additions: 10,
      deletions: 3,
    };
    expect(fc.path).toBe('src/index.ts');
    expect(fc.additions).toBe(10);
    expect(fc.deletions).toBe(3);
  });

  it('should create a valid GitCommit', () => {
    const commit: GitCommit = {
      hash: 'abc123',
      author: 'Alice',
      email: 'alice@example.com',
      date: new Date('2025-01-01'),
      subject: 'Initial commit',
      body: 'First commit body',
      files: [{ path: 'README.md', additions: 1, deletions: 0 }],
    };
    expect(commit.hash).toBe('abc123');
    expect(commit.author).toBe('Alice');
    expect(commit.email).toBe('alice@example.com');
    expect(commit.date).toBeInstanceOf(Date);
    expect(commit.subject).toBe('Initial commit');
    expect(commit.body).toBe('First commit body');
    expect(commit.files).toHaveLength(1);
  });

  it('should create a valid ContributorSummary', () => {
    const contributor: ContributorSummary = {
      name: 'Alice',
      email: 'alice@example.com',
      commitCount: 42,
      additions: 500,
      deletions: 200,
      firstCommit: new Date('2025-01-01'),
      lastCommit: new Date('2025-06-01'),
    };
    expect(contributor.name).toBe('Alice');
    expect(contributor.commitCount).toBe(42);
    expect(contributor.additions).toBe(500);
    expect(contributor.deletions).toBe(200);
    expect(contributor.firstCommit).toBeInstanceOf(Date);
    expect(contributor.lastCommit).toBeInstanceOf(Date);
  });

  it('should create a valid Chapter', () => {
    const chapter: Chapter = {
      title: 'Genesis',
      description: 'The beginning',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-02-01'),
      commits: [],
      contributors: [],
      totalAdditions: 100,
      totalDeletions: 20,
      dominantPaths: ['src/', 'lib/'],
      intensity: 0.75,
    };
    expect(chapter.title).toBe('Genesis');
    expect(chapter.description).toBe('The beginning');
    expect(chapter.startDate).toBeInstanceOf(Date);
    expect(chapter.endDate).toBeInstanceOf(Date);
    expect(chapter.commits).toEqual([]);
    expect(chapter.contributors).toEqual([]);
    expect(chapter.totalAdditions).toBe(100);
    expect(chapter.totalDeletions).toBe(20);
    expect(chapter.dominantPaths).toEqual(['src/', 'lib/']);
    expect(chapter.intensity).toBe(0.75);
    expect(chapter.intensity).toBeGreaterThanOrEqual(0);
    expect(chapter.intensity).toBeLessThanOrEqual(1);
  });

  it('should create a valid DailyActivity', () => {
    const activity: DailyActivity = {
      date: '2025-01-15',
      count: 5,
      additions: 120,
      deletions: 30,
    };
    expect(activity.date).toBe('2025-01-15');
    expect(activity.count).toBe(5);
    expect(activity.additions).toBe(120);
    expect(activity.deletions).toBe(30);
  });

  it('should create a valid StoryData', () => {
    const story: StoryData = {
      repoName: 'my-project',
      title: 'The Story of My Project',
      totalCommits: 100,
      totalContributors: 5,
      totalAdditions: 5000,
      totalDeletions: 2000,
      firstCommitDate: new Date('2025-01-01'),
      lastCommitDate: new Date('2025-12-31'),
      chapters: [],
      contributors: [],
      dailyActivity: [],
      commits: [],
    };
    expect(story.repoName).toBe('my-project');
    expect(story.title).toBe('The Story of My Project');
    expect(story.totalCommits).toBe(100);
    expect(story.totalContributors).toBe(5);
    expect(story.firstCommitDate).toBeInstanceOf(Date);
    expect(story.lastCommitDate).toBeInstanceOf(Date);
    expect(story.chapters).toEqual([]);
    expect(story.contributors).toEqual([]);
    expect(story.dailyActivity).toEqual([]);
    expect(story.commits).toEqual([]);
  });

  it('should create a valid AnalyzeOptions with required fields', () => {
    const opts: AnalyzeOptions = {
      output: 'story.html',
    };
    expect(opts.output).toBe('story.html');
    expect(opts.maxCommits).toBeUndefined();
    expect(opts.title).toBeUndefined();
  });

  it('should create a valid AnalyzeOptions with all fields', () => {
    const opts: AnalyzeOptions = {
      output: 'story.html',
      maxCommits: 500,
      title: 'Custom Title',
    };
    expect(opts.output).toBe('story.html');
    expect(opts.maxCommits).toBe(500);
    expect(opts.title).toBe('Custom Title');
  });
});
