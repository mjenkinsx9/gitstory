---
name: fix-issue
description: >-
  Use when fixing a GitHub issue end-to-end using the full 7-phase forge workflow. Takes an issue_number and orchestrates: discuss (produce CONTEXT.md), spec (produce SPEC.md with regression test requirements), plan (produce PLAN.md — Wave 1: failing repro test, Wave 2: fix, Wave 3: edge case tests), execute, review (two-stage gate), ship (fix/ branch, atomic commits, PR with Fixes #issue_number), and monitor CI. Do NOT use for quick one-line fixes, CI failures, or flaky tests — use fix-ci or fix-flaky-test for those.
---

# Fix Issue — Full Workflow

You are fixing a GitHub issue end-to-end using the full spec-driven workflow. This is the most thorough workflow — use it for bug fixes that need investigation, discussion, and careful implementation.

**Input:** `issue_number` (required)

## Workflow: FULL

Execute these phases in order. Do NOT skip any phase.

### Phase 1: Discuss (`forge-discuss`)

1. Fetch the issue: `gh issue view <issue_number>`
2. Read the issue body, comments, and labels.
3. Run the full discuss phase — ask clarifying questions about the bug, reproduction steps, expected behavior, and scope of the fix.
4. Output: `CONTEXT.md`

### Phase 2: Spec (`forge-spec`)

1. Create a spec for the fix — what exactly needs to change, acceptance criteria for "fixed."
2. Include regression test requirements.
3. Self-review the spec, then present to user for approval.
4. Output: `SPEC.md` with status "approved"

### Phase 3: Plan (`forge-plan`)

1. Break the fix into waves of tasks.
2. Typical structure for a bug fix:
   - Wave 1: Add a failing test that reproduces the bug
   - Wave 2: Fix the bug
   - Wave 3: Add edge case tests, update docs if needed
3. Output: `PLAN.md`

### Phase 4: Execute

For each wave, for each task:
1. Read the task from PLAN.md.
2. Implement the change.
3. Run the task's verification step.
4. If verification fails, fix and retry.

Use `forge_run_tests` to run tests after each wave.
Use `forge_run_lint` to check for lint issues.

### Phase 5: Review (`forge-review`)

Run the two-stage review gate:
- Stage 1: Spec compliance — every requirement and acceptance criterion met.
- Stage 2: Code quality — tests pass, lint passes, no secrets, no oversized files.

If review fails, fix issues and re-run. Unlimited retries. After 10 rounds, stop and explain what is blocking.

### Phase 6: Ship (`forge-ship`)

1. Create branch: `fix/<issue-short-description>`
2. Atomic commits per task.
3. Push and create PR.
4. PR body links to the issue: `Fixes #<issue_number>`

### Phase 7: Monitor (`forge-monitor-pr`)

1. Poll CI status.
2. Fix CI failures (max 2 rounds).
3. Respond to review comments.

## Cross-Cutting Rules

- **Context hydration**: At every phase, re-read relevant files before doing work.
- **Fresh context on retry**: If retrying after failure, approach the problem fresh. Do not reuse failed approaches.
- **Never merge**: Only create the PR. Never merge it.
- **Report the PR URL** when complete.
