import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { analyzeRepository } from '../git/analyzer.js';
import { clusterIntoChapters } from '../narrative/chapters.js';
import { generateChapterTitle } from '../narrative/titles.js';
import { computeContributors, computeDailyActivity } from '../utils/stats.js';
import { generateHTML } from '../report/generator.js';
import type { StoryData } from '../types.js';

function git(args: string, cwd: string, env?: Record<string, string>): string {
  return execSync(`git ${args}`, {
    cwd,
    encoding: 'utf-8',
    env: { ...process.env, ...env },
  });
}

describe('Integration Tests', () => {
  let repoDir: string;

  beforeAll(() => {
    repoDir = mkdtempSync(join(tmpdir(), 'gitstory-integration-'));

    git('init', repoDir);
    git('config user.name "Setup"', repoDir);
    git('config user.email "setup@test.com"', repoDir);

    // Commit 1 - Author1, Day 1
    writeFileSync(join(repoDir, 'README.md'), '# Test Project\n');
    git('add .', repoDir);
    git(
      '-c user.name="Alice" -c user.email="alice@test.com" commit -m "feat: initial project setup"',
      repoDir,
      {
        GIT_AUTHOR_DATE: '2025-01-01T10:00:00+00:00',
        GIT_COMMITTER_DATE: '2025-01-01T10:00:00+00:00',
      },
    );

    // Commit 2 - Author2, Day 1 (same chapter as commit 1)
    execSync('mkdir -p src', { cwd: repoDir });
    writeFileSync(join(repoDir, 'src/index.ts'), 'console.log("hello");\n');
    git('add .', repoDir);
    git(
      '-c user.name="Bob" -c user.email="bob@test.com" commit -m "feat: add entry point"',
      repoDir,
      {
        GIT_AUTHOR_DATE: '2025-01-01T14:00:00+00:00',
        GIT_COMMITTER_DATE: '2025-01-01T14:00:00+00:00',
      },
    );

    // Commit 3 - Author3, Day 1
    writeFileSync(join(repoDir, 'src/utils.ts'), 'export function helper() {}\n');
    git('add .', repoDir);
    git(
      '-c user.name="Charlie" -c user.email="charlie@test.com" commit -m "feat: add utility helpers"',
      repoDir,
      {
        GIT_AUTHOR_DATE: '2025-01-01T18:00:00+00:00',
        GIT_COMMITTER_DATE: '2025-01-01T18:00:00+00:00',
      },
    );

    // Gap of >24 hours to create a new chapter

    // Commit 4 - Author1, Day 3
    writeFileSync(join(repoDir, 'src/index.ts'), 'console.log("updated");\nexport {};\n');
    git('add .', repoDir);
    git(
      '-c user.name="Alice" -c user.email="alice@test.com" commit -m "fix: update entry point"',
      repoDir,
      {
        GIT_AUTHOR_DATE: '2025-01-03T10:00:00+00:00',
        GIT_COMMITTER_DATE: '2025-01-03T10:00:00+00:00',
      },
    );

    // Commit 5 - Author2, Day 5 (another chapter)
    execSync('mkdir -p docs', { cwd: repoDir });
    writeFileSync(join(repoDir, 'docs/guide.md'), '# Guide\n');
    git('add .', repoDir);
    git(
      '-c user.name="Bob" -c user.email="bob@test.com" commit -m "docs: add user guide"',
      repoDir,
      {
        GIT_AUTHOR_DATE: '2025-01-05T12:00:00+00:00',
        GIT_COMMITTER_DATE: '2025-01-05T12:00:00+00:00',
      },
    );
  });

  afterAll(() => {
    rmSync(repoDir, { recursive: true, force: true });
  });

  function buildStoryData(repoPath: string, maxCommits?: number): StoryData {
    const commits = analyzeRepository(repoPath, maxCommits);
    const chapters = clusterIntoChapters(commits);
    for (const chapter of chapters) {
      chapter.title = generateChapterTitle(chapter);
    }
    const contributors = computeContributors(commits);
    const dailyActivity = computeDailyActivity(commits);

    const totalAdditions = commits.reduce(
      (sum, c) => sum + c.files.reduce((s, f) => s + f.additions, 0),
      0,
    );
    const totalDeletions = commits.reduce(
      (sum, c) => sum + c.files.reduce((s, f) => s + f.deletions, 0),
      0,
    );

    const sorted = [...commits].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    return {
      repoName: 'test-repo',
      title: 'The Story of test-repo',
      totalCommits: commits.length,
      totalContributors: contributors.length,
      totalAdditions,
      totalDeletions,
      firstCommitDate: sorted[0].date,
      lastCommitDate: sorted[sorted.length - 1].date,
      chapters,
      contributors,
      dailyActivity,
      commits,
    };
  }

  it('full pipeline produces valid HTML', () => {
    const storyData = buildStoryData(repoDir);

    expect(storyData.totalCommits).toBe(5);
    expect(storyData.totalContributors).toBe(3);
    expect(storyData.chapters.length).toBeGreaterThanOrEqual(2);

    // Every chapter should have a title
    for (const chapter of storyData.chapters) {
      expect(chapter.title).toBeTruthy();
    }

    const html = generateHTML(storyData);

    // Verify it's valid HTML
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain('</html>');

    // Verify all 7 sections are present
    expect(html).toContain('hero');
    expect(html).toContain('prologue');
    expect(html).toContain('pulse');
    expect(html).toContain('story');
    expect(html).toContain('cast');
    expect(html).toContain('rhythm');
    expect(html).toContain('epilogue');

    // Verify contributor names appear
    expect(html).toContain('Alice');
    expect(html).toContain('Bob');
    expect(html).toContain('Charlie');

    // Verify chapter titles appear
    for (const chapter of storyData.chapters) {
      expect(html).toContain(chapter.title);
    }

    // Verify D3 CDN is loaded
    expect(html).toContain('d3.v7.min.js');

    // Verify STORY_DATA is embedded
    expect(html).toContain('STORY_DATA');
  });

  it('single commit repo produces valid output', () => {
    const singleRepoDir = mkdtempSync(join(tmpdir(), 'gitstory-single-'));
    try {
      git('init', singleRepoDir);
      git('config user.name "Solo"', singleRepoDir);
      git('config user.email "solo@test.com"', singleRepoDir);

      writeFileSync(join(singleRepoDir, 'file.txt'), 'hello\n');
      git('add .', singleRepoDir);
      git('commit -m "only commit"', singleRepoDir, {
        GIT_AUTHOR_DATE: '2025-06-01T10:00:00+00:00',
        GIT_COMMITTER_DATE: '2025-06-01T10:00:00+00:00',
      });

      const storyData = buildStoryData(singleRepoDir);

      expect(storyData.totalCommits).toBe(1);
      expect(storyData.chapters.length).toBe(1);
      expect(storyData.contributors.length).toBe(1);
      expect(storyData.contributors[0].name).toBe('Solo');

      const html = generateHTML(storyData);
      expect(html).toMatch(/^<!DOCTYPE html>/);
      expect(html).toContain('</html>');
      expect(html).toContain('Solo');
    } finally {
      rmSync(singleRepoDir, { recursive: true, force: true });
    }
  });

  it('analyzeRepository respects maxCommits', () => {
    const commits = analyzeRepository(repoDir, 2);
    expect(commits.length).toBe(2);
  });

  it('writeFile produces actual HTML file', () => {
    const storyData = buildStoryData(repoDir);
    const html = generateHTML(storyData);

    const outPath = join(repoDir, 'output.html');
    writeFileSync(outPath, html, 'utf-8');

    expect(existsSync(outPath)).toBe(true);

    const content = readFileSync(outPath, 'utf-8');
    expect(content).toMatch(/^<!DOCTYPE html>/);
    expect(content.length).toBeGreaterThan(1000);
  });
});
