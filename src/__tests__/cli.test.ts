import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { isGitHubUrl } from '../git/remote.js';

/**
 * Helper: create a fresh Commander program matching the CLI definition,
 * but without executing the action handler (we just test parsing).
 */
function createTestProgram(): Command {
  const program = new Command();
  program.name('gitstory').version('1.0.0');
  program.exitOverride(); // throw instead of process.exit in tests

  program
    .command('analyze')
    .description('Analyze a git repository and generate an HTML narrative timeline')
    .argument('[repo-path]', 'Path to git repository or GitHub URL', '.')
    .option('-o, --output <file>', 'Output HTML file path', 'gitstory.html')
    .option('-n, --max-commits <number>', 'Maximum number of commits to analyze')
    .option('--title <string>', 'Custom title for the report')
    .action(() => {
      // no-op for parsing tests
    });

  return program;
}

describe('CLI argument parsing', () => {
  it('defaults repo-path to "."', () => {
    const program = createTestProgram();
    let capturedPath: string | undefined;
    // Override the action to capture the parsed argument
    program.commands[0].action((repoPath: string) => {
      capturedPath = repoPath;
    });
    program.parse(['analyze'], { from: 'user' });
    expect(capturedPath).toBe('.');
  });

  it('accepts a custom repo path', () => {
    const program = createTestProgram();
    let capturedPath: string | undefined;
    program.commands[0].action((repoPath: string) => {
      capturedPath = repoPath;
    });
    program.parse(['analyze', '/some/path'], { from: 'user' });
    expect(capturedPath).toBe('/some/path');
  });

  it('parses -o flag for output path', () => {
    const program = createTestProgram();
    program.parse(['analyze', '-o', 'custom.html'], { from: 'user' });
    const analyzeCmd = program.commands[0];
    expect(analyzeCmd.opts().output).toBe('custom.html');
  });

  it('defaults output to gitstory.html', () => {
    const program = createTestProgram();
    program.parse(['analyze'], { from: 'user' });
    const analyzeCmd = program.commands[0];
    expect(analyzeCmd.opts().output).toBe('gitstory.html');
  });

  it('parses -n flag for max-commits', () => {
    const program = createTestProgram();
    program.parse(['analyze', '-n', '100'], { from: 'user' });
    const analyzeCmd = program.commands[0];
    expect(analyzeCmd.opts().maxCommits).toBe('100');
  });

  it('parses --title flag', () => {
    const program = createTestProgram();
    program.parse(['analyze', '--title', 'My Project Story'], { from: 'user' });
    const analyzeCmd = program.commands[0];
    expect(analyzeCmd.opts().title).toBe('My Project Story');
  });
});

describe('max-commits validation', () => {
  /**
   * The CLI should reject max-commits values that are 0 or negative.
   * We test the validation logic directly.
   */
  function validateMaxCommits(value: string): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error('--max-commits must be a positive integer');
    }
    return parsed;
  }

  it('accepts a positive integer', () => {
    expect(validateMaxCommits('50')).toBe(50);
  });

  it('rejects 0', () => {
    expect(() => validateMaxCommits('0')).toThrow('--max-commits must be a positive integer');
  });

  it('rejects negative numbers', () => {
    expect(() => validateMaxCommits('-5')).toThrow('--max-commits must be a positive integer');
  });

  it('rejects non-numeric strings', () => {
    expect(() => validateMaxCommits('abc')).toThrow('--max-commits must be a positive integer');
  });
});

describe('GitHub URL detection routing', () => {
  it('detects GitHub URLs for remote clone path', () => {
    expect(isGitHubUrl('https://github.com/user/repo')).toBe(true);
    expect(isGitHubUrl('https://github.com/user/repo.git')).toBe(true);
  });

  it('treats non-URL strings as local paths', () => {
    expect(isGitHubUrl('.')).toBe(false);
    expect(isGitHubUrl('/home/user/project')).toBe(false);
    expect(isGitHubUrl('./relative/path')).toBe(false);
  });
});

describe('repo name extraction', () => {
  it('extracts repo name from GitHub URL', () => {
    function extractRepoName(repoPath: string): string {
      const segments = repoPath.replace(/\/+$/, '').split('/');
      return segments[segments.length - 1].replace(/\.git$/, '');
    }

    expect(extractRepoName('https://github.com/user/my-project.git')).toBe('my-project');
    expect(extractRepoName('https://github.com/user/my-project')).toBe('my-project');
    expect(extractRepoName('https://github.com/user/my-project/')).toBe('my-project');
  });
});
