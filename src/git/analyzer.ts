import { execSync } from 'node:child_process';
import type { GitCommit, FileChange } from '../types.js';

const GIT_LOG_FORMAT =
  'COMMIT_START%nHash: %H%nAuthor: %an%nEmail: %ae%nDate: %aI%nSubject: %s%nBody: %b%nCOMMIT_END';

export function parseGitLog(rawOutput: string): GitCommit[] {
  const commits: GitCommit[] = [];

  const parts = rawOutput.split('COMMIT_START');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const endIdx = trimmed.indexOf('COMMIT_END');
    if (endIdx === -1) continue;

    const commitBlock = trimmed.substring(0, endIdx).trim();
    const afterCommit = trimmed.substring(endIdx + 'COMMIT_END'.length).trim();

    const lines = commitBlock.split('\n');

    let hash = '';
    let author = '';
    let email = '';
    let date = '';
    let subject = '';
    const bodyLines: string[] = [];
    let inBody = false;

    for (const line of lines) {
      if (inBody) {
        bodyLines.push(line);
        continue;
      }

      if (line.startsWith('Hash: ')) {
        hash = line.substring('Hash: '.length);
      } else if (line.startsWith('Author: ')) {
        author = line.substring('Author: '.length);
      } else if (line.startsWith('Email: ')) {
        email = line.substring('Email: '.length);
      } else if (line.startsWith('Date: ')) {
        date = line.substring('Date: '.length);
      } else if (line.startsWith('Subject: ')) {
        subject = line.substring('Subject: '.length);
      } else if (line.startsWith('Body: ')) {
        inBody = true;
        const bodyStart = line.substring('Body: '.length);
        if (bodyStart) {
          bodyLines.push(bodyStart);
        }
      }
    }

    const body = bodyLines.join('\n').trim();

    // Parse numstat lines after COMMIT_END
    const files: FileChange[] = [];
    if (afterCommit) {
      const numstatLines = afterCommit.split('\n');
      for (const nsLine of numstatLines) {
        const nsMatch = nsLine.match(/^(-|\d+)\t(-|\d+)\t(.+)$/);
        if (nsMatch) {
          const additions = nsMatch[1] === '-' ? 0 : parseInt(nsMatch[1], 10);
          const deletions = nsMatch[2] === '-' ? 0 : parseInt(nsMatch[2], 10);
          files.push({ path: nsMatch[3], additions, deletions });
        }
      }
    }

    if (hash) {
      commits.push({
        hash,
        author,
        email,
        date: new Date(date),
        subject,
        body,
        files,
      });
    }
  }

  return commits;
}

export function analyzeRepository(repoPath: string, maxCommits?: number): GitCommit[] {
  const maxCommitsArg = maxCommits !== undefined ? `-n ${maxCommits}` : '';
  const command = `git log --format="${GIT_LOG_FORMAT}" --numstat ${maxCommitsArg}`;

  const rawOutput = execSync(command, {
    cwd: repoPath,
    maxBuffer: 50 * 1024 * 1024,
    encoding: 'utf-8',
  });

  return parseGitLog(rawOutput);
}

export function isGitRepository(path: string): boolean {
  try {
    execSync('git rev-parse --git-dir', {
      cwd: path,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

export function isGitInstalled(): boolean {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
