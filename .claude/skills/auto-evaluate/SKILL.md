---
name: auto-evaluate
description: >-
  Use when you need a read-only quality assessment of a git branch without
  making any changes. Takes a branch_name and runs build, tsc --noEmit, lint,
  tests, and security scan, then performs manual code review (file sizes,
  complexity, test coverage, type safety, error handling). Produces a structured
  Quality Report with per-check pass/fail table, scored findings
  (Critical/Major/Minor), and an overall A-F grade with merge recommendation. Do
  NOT use for fixing code, creating PRs, or implementing changes.
generated-status: verified
verified-at: '2026-03-17T02:24:25.931Z'
verification-score: 97
---

# Auto-Evaluate — Standalone Evaluation

You are evaluating the quality of a branch without making any changes. This is a read-only assessment that produces a quality report.

**Input:** `branch_name` (required)

## Step 1: Context Hydration

1. Read `CLAUDE.md` for project conventions.
2. Switch context to the target branch: check it out or inspect it.
3. Read `SPEC.md` and `PLAN.md` if they exist, to understand intended scope.
4. Get the diff from the base branch: `git diff main...<branch_name>` (or the appropriate base).
5. List all changed files: `git diff --name-only main...<branch_name>`

## Step 2: Run Automated Checks

Execute each check and record results:

### 2a. Build
```bash
npm run build
```
Record: pass/fail, error count, error details.

### 2b. Type Check (TypeScript projects)
```bash
npx tsc --noEmit
```
Record: pass/fail, error count, error details.

### 2c. Lint
```bash
forge_run_lint or npm run lint
```
Record: pass/fail, warning count, error count, details.

### 2d. Tests
```bash
forge_run_tests or npm test
```
Record: pass/fail, total tests, passed, failed, skipped, coverage percentage if available.

### 2e. Security Scan
Search changed files for:
- Hardcoded secrets (passwords, API keys, tokens not from env vars)
- Known vulnerable patterns (SQL injection, XSS, command injection)

Record: findings with file paths and line numbers.

## Step 3: Manual Code Review

For each changed file, assess:

1. **Size**: Lines of code. Flag files over 500 lines.
2. **Complexity**: Functions over 50 lines. Deeply nested conditionals (4+ levels).
3. **Test coverage**: Does new code have corresponding tests?
4. **Type safety**: Use of `any` type (TypeScript). Missing type annotations.
5. **Error handling**: Are errors caught and handled appropriately?
6. **Naming**: Clear, consistent naming following project conventions.

## Step 4: Generate Report

Produce a quality report:

```markdown
# Quality Report: <branch_name>

**Evaluated:** [ISO timestamp]
**Base branch:** main
**Changed files:** [N]
**Total diff:** +[additions] -[deletions]

## Automated Checks

| Check | Status | Details |
|-------|--------|---------|
| Build | PASS/FAIL | [details] |
| Type Check | PASS/FAIL | [N errors] |
| Lint | PASS/FAIL | [N errors, N warnings] |
| Tests | PASS/FAIL | [N/M passed, coverage%] |
| Security | PASS/FAIL | [N findings] |

## Code Quality

| Metric | Score | Notes |
|--------|-------|-------|
| File sizes | OK/WARN | [largest file: N lines] |
| Function complexity | OK/WARN | [largest function: N lines] |
| Test coverage | OK/WARN | [N new files without tests] |
| Type safety | OK/WARN | [N uses of any] |
| Error handling | OK/WARN | [N unhandled paths] |

## Findings

### Critical
- [blocking issues]

### Major
- [should-fix issues]

### Minor
- [nice-to-fix issues]

## Overall Assessment

**Grade:** [A/B/C/D/F]
- A: All checks pass, high quality, good test coverage
- B: All checks pass, minor quality issues
- C: Some checks fail, but core functionality works
- D: Multiple failures, significant issues
- F: Does not build or major failures

**Recommendation:** [Ready to merge / Needs fixes / Needs significant rework]
```

## Rules

- NEVER modify any code. This is a read-only evaluation.
- NEVER create PRs or commits.
- Run ALL checks even if early ones fail — the report should be comprehensive.
- Be specific in findings — always include file paths and line numbers.
- If the branch doesn't exist, report the error and stop.
