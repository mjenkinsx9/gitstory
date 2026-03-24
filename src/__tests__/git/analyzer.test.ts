import { describe, it, expect } from 'vitest';
import { parseGitLog, isGitRepository, isGitInstalled } from '../../git/analyzer.js';
import type { GitCommit } from '../../types.js';

const SAMPLE_GIT_LOG = `COMMIT_START
Hash: abc123def456789
Author: Jane Doe
Email: jane@example.com
Date: 2025-06-15T10:30:00+00:00
Subject: feat: add user authentication
Body: Implemented JWT-based auth flow.
COMMIT_END
3\t1\tsrc/auth.ts
10\t0\tsrc/middleware.ts

COMMIT_START
Hash: def789abc123456
Author: John Smith
Email: john@example.com
Date: 2025-06-14T09:00:00+00:00
Subject: chore: initial commit
Body:
COMMIT_END
5\t0\tREADME.md
`;

describe('parseGitLog', () => {
  it('should parse a known git log string into GitCommit[] objects', () => {
    const commits = parseGitLog(SAMPLE_GIT_LOG);

    expect(commits).toHaveLength(2);

    const first = commits[0];
    expect(first.hash).toBe('abc123def456789');
    expect(first.author).toBe('Jane Doe');
    expect(first.email).toBe('jane@example.com');
    expect(first.date).toEqual(new Date('2025-06-15T10:30:00+00:00'));
    expect(first.subject).toBe('feat: add user authentication');
    expect(first.body).toBe('Implemented JWT-based auth flow.');
    expect(first.files).toHaveLength(2);
    expect(first.files[0]).toEqual({ path: 'src/auth.ts', additions: 3, deletions: 1 });
    expect(first.files[1]).toEqual({ path: 'src/middleware.ts', additions: 10, deletions: 0 });

    const second = commits[1];
    expect(second.hash).toBe('def789abc123456');
    expect(second.author).toBe('John Smith');
    expect(second.subject).toBe('chore: initial commit');
    expect(second.body).toBe('');
    expect(second.files).toHaveLength(1);
    expect(second.files[0]).toEqual({ path: 'README.md', additions: 5, deletions: 0 });
  });

  it('should return empty array for empty output', () => {
    expect(parseGitLog('')).toEqual([]);
    expect(parseGitLog('\n\n')).toEqual([]);
  });

  it('should handle missing numstat (0 additions/deletions)', () => {
    const log = `COMMIT_START
Hash: aaa111
Author: Dev
Email: dev@test.com
Date: 2025-01-01T00:00:00+00:00
Subject: empty commit
Body:
COMMIT_END
`;
    const commits = parseGitLog(log);
    expect(commits).toHaveLength(1);
    expect(commits[0].files).toEqual([]);
  });

  it('should treat binary file entries (-\\t-\\tpath) as 0/0', () => {
    const log = `COMMIT_START
Hash: bbb222
Author: Dev
Email: dev@test.com
Date: 2025-01-01T00:00:00+00:00
Subject: add binary
Body:
COMMIT_END
-\t-\timage.png
5\t2\tsrc/index.ts
`;
    const commits = parseGitLog(log);
    expect(commits).toHaveLength(1);
    expect(commits[0].files).toHaveLength(2);
    expect(commits[0].files[0]).toEqual({ path: 'image.png', additions: 0, deletions: 0 });
    expect(commits[0].files[1]).toEqual({ path: 'src/index.ts', additions: 5, deletions: 2 });
  });

  it('should handle UTF-8 author names', () => {
    const log = `COMMIT_START
Hash: ccc333
Author: Müller Straße
Email: muller@test.com
Date: 2025-01-01T00:00:00+00:00
Subject: update
Body:
COMMIT_END
1\t0\tfile.txt
`;
    const commits = parseGitLog(log);
    expect(commits).toHaveLength(1);
    expect(commits[0].author).toBe('Müller Straße');
  });
});

describe('isGitRepository', () => {
  it('should return true for a valid git repository', () => {
    // The worktree itself is a git repo
    expect(isGitRepository(process.cwd())).toBe(true);
  });

  it('should return false for a non-git directory', () => {
    expect(isGitRepository('/tmp')).toBe(false);
  });
});

describe('isGitInstalled', () => {
  it('should return true when git is installed', () => {
    expect(isGitInstalled()).toBe(true);
  });
});
