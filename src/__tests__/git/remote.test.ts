import { describe, it, expect } from 'vitest';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isGitHubUrl, cloneRemoteRepo, cleanupTempRepo } from '../../git/remote.js';

describe('isGitHubUrl', () => {
  it('returns true for https://github.com/user/repo', () => {
    expect(isGitHubUrl('https://github.com/user/repo')).toBe(true);
  });

  it('returns true for https://github.com/user/repo.git', () => {
    expect(isGitHubUrl('https://github.com/user/repo.git')).toBe(true);
  });

  it('returns true for https://github.com/user/repo/', () => {
    expect(isGitHubUrl('https://github.com/user/repo/')).toBe(true);
  });

  it('returns true for repos with dots and hyphens in names', () => {
    expect(isGitHubUrl('https://github.com/my-org/my-repo.js')).toBe(true);
    expect(isGitHubUrl('https://github.com/user123/repo-name.git')).toBe(true);
  });

  it('returns false for http:// (non-https)', () => {
    expect(isGitHubUrl('http://github.com/user/repo')).toBe(false);
  });

  it('returns false for SSH URLs', () => {
    expect(isGitHubUrl('git@github.com:user/repo.git')).toBe(false);
  });

  it('returns false for non-GitHub hosts', () => {
    expect(isGitHubUrl('https://gitlab.com/user/repo')).toBe(false);
  });

  it('returns false for GitHub root without user/repo', () => {
    expect(isGitHubUrl('https://github.com/')).toBe(false);
  });

  it('returns false for non-URL strings', () => {
    expect(isGitHubUrl('not-a-url')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isGitHubUrl('')).toBe(false);
  });
});

describe('cloneRemoteRepo', () => {
  it('is a function that accepts a URL string', () => {
    expect(typeof cloneRemoteRepo).toBe('function');
  });

  it('throws on invalid URL', () => {
    expect(() => cloneRemoteRepo('https://github.com/nonexistent-user-abc123/nonexistent-repo-xyz789.git'))
      .toThrow('Failed to clone');
  });
});

describe('cleanupTempRepo', () => {
  it('removes a temporary directory', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'gitstory-test-'));
    expect(existsSync(tempDir)).toBe(true);

    cleanupTempRepo(tempDir);
    expect(existsSync(tempDir)).toBe(false);
  });

  it('does not throw if directory does not exist', () => {
    expect(() => cleanupTempRepo('/tmp/gitstory-nonexistent-dir-12345')).not.toThrow();
  });
});
