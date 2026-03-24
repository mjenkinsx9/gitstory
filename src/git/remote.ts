import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Check if a string is a valid HTTPS GitHub repository URL.
 */
export function isGitHubUrl(input: string): boolean {
  return /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?\/?$/.test(input);
}

/**
 * Clone a remote GitHub repository to a temporary directory.
 * Returns the path to the cloned repo.
 */
export function cloneRemoteRepo(url: string): string {
  const tempDir = mkdtempSync(join(tmpdir(), 'gitstory-'));
  try {
    execSync(`git clone --single-branch "${url}" "${tempDir}/repo"`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 120000,
    });
    return join(tempDir, 'repo');
  } catch (error) {
    rmSync(tempDir, { recursive: true, force: true });
    throw new Error(`Failed to clone ${url}: ${(error as Error).message}`);
  }
}

/**
 * Clean up a temporary cloned repository directory.
 */
export function cleanupTempRepo(tempDir: string): void {
  rmSync(tempDir, { recursive: true, force: true });
}
