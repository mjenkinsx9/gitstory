---
name: fix-ci
description: >-
  Use when CI is failing on a branch and needs to be fixed. Skips the discuss/spec/plan phases — goes straight to diagnosis using gh run view --log-failed, classifies the failure type (test, lint, build, type error, dependency, flaky, infrastructure), makes the minimal fix, and pushes to the existing branch. Uses the forge review and monitor phases after fixing. Max 2 fix rounds before escalating. Do NOT use for implementing features, fixing flaky tests specifically, or general code changes.
---

# Fix CI — Quick Workflow

You are fixing a failing CI pipeline. This uses the QUICK workflow — no discuss or spec phase. Go straight to diagnosis and fix.

**Input:** `branch_name` (optional — defaults to current branch)

## Step 1: Context Hydration

1. Read `CLAUDE.md` for project conventions.
2. Determine the branch: use provided `branch_name` or `git branch --show-current`.
3. Check CI status: `gh pr checks` or `forge_ci_status`.
4. Get the failing run details: `gh run list --branch <branch> --limit 5`.

## Step 2: Diagnose

1. Get the failed run logs: `gh run view <run_id> --log-failed`
2. Identify the failure type:
   - **Test failure**: A specific test is failing. Read the test and the code it tests.
   - **Lint error**: A lint rule is violated. Read the file and line.
   - **Build error**: Compilation fails. Read the error message and the file.
   - **Type error**: TypeScript type check fails. Read the error and fix types.
   - **Dependency issue**: Package install fails. Check package.json and lockfile.
   - **Flaky test**: Test passes locally but fails in CI. Check for timing, env, or ordering issues.
   - **Infrastructure**: CI config issue, runner problem, or timeout. May not be fixable in code.

3. For each failure, identify the root cause file and line.

## Step 3: Fix

1. Make the minimal change to fix the CI failure.
2. Do NOT refactor, improve, or change anything beyond what is needed for CI to pass.
3. Run verification locally:
   - `forge_run_tests` or `npm test`
   - `forge_run_lint` or `npm run lint`
   - `npx tsc --noEmit` (for TypeScript)

## Step 4: Review (`forge-review`)

Run a quick review:
- Stage 1: Verify fix addresses the CI failure.
- Stage 2: Code quality — ensure fix doesn't introduce new issues.

## Step 5: Ship (`forge-ship`)

1. Commit the fix: `fix: resolve CI failure — [description of what failed and why]`
2. Push to the existing branch (do not create a new branch).
3. If no PR exists, create one. If a PR already exists, just push.

## Step 6: Monitor (`forge-monitor-pr`)

1. Poll CI to confirm the fix worked.
2. If CI fails again (round 2), diagnose and fix once more.
3. If CI fails a third time, stop and report to the user.

## Cross-Cutting Rules

- **Minimal changes only**: Fix CI, nothing else.
- **Fresh context on retry**: If retrying, re-read logs fresh. The failure may have changed.
- **Max 2 CI fix rounds**: After 2 failed fix attempts, escalate to the user.
- **Never merge**: Only push fixes and monitor.
