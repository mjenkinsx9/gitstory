#!/usr/bin/env node

import { Command } from 'commander';
import { writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { analyzeRepository, isGitRepository, isGitInstalled } from './git/analyzer.js';
import { isGitHubUrl, cloneRemoteRepo, cleanupTempRepo } from './git/remote.js';
import { clusterIntoChapters } from './narrative/chapters.js';
import { generateChapterTitle } from './narrative/titles.js';
import { computeContributors, computeDailyActivity } from './utils/stats.js';
import { generateHTML } from './report/generator.js';
import type { StoryData } from './types.js';

const program = new Command();

program.name('gitstory').version('1.0.0').description(
  'Analyze a git repository and generate a stunning HTML narrative timeline'
);

program
  .command('analyze')
  .description('Analyze a git repository and generate an HTML narrative timeline')
  .argument('[repo-path]', 'Path to git repository or GitHub URL', '.')
  .option('-o, --output <file>', 'Output HTML file path', 'gitstory.html')
  .option('-n, --max-commits <number>', 'Maximum number of commits to analyze')
  .option('--title <string>', 'Custom title for the report')
  .action(async (repoPath: string, options: { output: string; maxCommits?: string; title?: string }) => {
    // 1. Check git is installed
    if (!isGitInstalled()) {
      console.error('Error: git is not installed or not found in PATH.');
      process.exit(1);
    }

    // 2. Parse and validate --max-commits
    let maxCommits: number | undefined;
    if (options.maxCommits !== undefined) {
      const parsed = parseInt(options.maxCommits, 10);
      if (isNaN(parsed) || parsed <= 0) {
        console.error('Error: --max-commits must be a positive integer.');
        process.exit(1);
      }
      maxCommits = parsed;
    }

    // 3. Determine if repo path is a GitHub URL
    const isRemote = isGitHubUrl(repoPath);
    let actualPath = repoPath;
    let tempDir: string | undefined;

    // 4. If URL: clone to temp directory
    if (isRemote) {
      console.log(`Cloning ${repoPath}...`);
      try {
        actualPath = cloneRemoteRepo(repoPath);
        tempDir = actualPath;
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    } else {
      // 5. Validate local repository
      const resolvedPath = resolve(repoPath);
      if (!isGitRepository(resolvedPath)) {
        console.error(`Error: "${resolvedPath}" is not a git repository.`);
        process.exit(1);
      }
      actualPath = resolvedPath;
    }

    try {
      // 6a. Analyze repository
      const commits = analyzeRepository(actualPath, maxCommits);

      if (commits.length === 0) {
        console.error('Error: No commits found in the repository.');
        process.exit(1);
      }

      // 6b. Cluster into chapters
      const chapters = clusterIntoChapters(commits);

      // 6c. Generate titles for each chapter
      for (const chapter of chapters) {
        chapter.title = generateChapterTitle(chapter);
      }

      // 6d. Compute stats
      const contributors = computeContributors(commits);
      const dailyActivity = computeDailyActivity(commits);

      // 6e. Derive repo name
      let repoName: string;
      if (isRemote) {
        const segments = repoPath.replace(/\/+$/, '').split('/');
        repoName = segments[segments.length - 1].replace(/\.git$/, '');
      } else {
        repoName = basename(resolve(repoPath));
      }

      // 6f. Compute totals
      const totalAdditions = commits.reduce(
        (sum, c) => sum + c.files.reduce((s, f) => s + f.additions, 0),
        0
      );
      const totalDeletions = commits.reduce(
        (sum, c) => sum + c.files.reduce((s, f) => s + f.deletions, 0),
        0
      );

      // Sort commits by date for first/last
      const sorted = [...commits].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      // 6g. Assemble StoryData
      const storyData: StoryData = {
        repoName,
        title: options.title ?? `The Story of ${repoName}`,
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

      // 6h. Generate HTML and write to file
      const html = generateHTML(storyData);
      writeFileSync(options.output, html, 'utf-8');

      console.log(
        `Generated ${options.output} with ${commits.length} commits across ${chapters.length} chapters.`
      );
    } finally {
      // 7. Cleanup temp directory if remote
      if (tempDir) {
        cleanupTempRepo(tempDir);
      }
    }
  });

program.parse();
