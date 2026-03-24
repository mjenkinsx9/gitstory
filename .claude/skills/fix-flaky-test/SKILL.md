---
name: fix-flaky-test
description: >-
  Use when a test passes sometimes and fails other times (flaky/intermittent). Takes a test_file path, runs it 5 times to confirm flakiness, then systematically diagnoses the root cause using a 6-category checklist: timing/async issues, shared state, order dependence, environment dependence (Date, locale, timezone), network dependence (unmocked HTTP), and random data (unseeded Math.random). Applies the targeted fix and verifies stability with 10 consecutive runs. Do NOT use for tests that consistently fail — use fix-ci for those.
---

# Fix Flaky Test — Quick Workflow

You are diagnosing and fixing a flaky test. This uses the QUICK workflow — no discuss or spec phase. Go straight to investigation and fix.

**Input:** `test_file` (required — path to the flaky test file)

## Step 1: Context Hydration

1. Read `CLAUDE.md` for project conventions and test framework details.
2. Read the flaky test file to understand what it tests.
3. Read the source file(s) that the test exercises.
4. Check git log for recent changes to the test or its source: `git log --oneline -10 -- <test_file>`
5. If available, check CI history for intermittent failures: `gh run list --limit 10`

## Step 2: Diagnose the Flakiness

Run the test multiple times to confirm flakiness:
```bash
# Run 5 times and check for inconsistency
for i in {1..5}; do npm test -- <test_file> 2>&1 | tail -1; done
```

Common flakiness causes — check each:

1. **Timing/async issues**: Tests that depend on setTimeout, setInterval, or race conditions.
   - Look for: missing `await`, missing `done()` callbacks, hardcoded `setTimeout` delays.
2. **Shared state**: Tests that modify global state and affect other tests.
   - Look for: missing `beforeEach`/`afterEach` cleanup, shared variables between tests, database state leaking.
3. **Order dependence**: Tests that pass only when run in a specific order.
   - Try: running the test in isolation vs. in the full suite.
4. **Environment dependence**: Tests that depend on system time, locale, timezone, or file system state.
   - Look for: `new Date()`, `Date.now()`, locale-specific formatting, temp file paths.
5. **Network dependence**: Tests that make real HTTP calls.
   - Look for: unmocked fetch/axios calls, DNS resolution, external API calls.
6. **Random data**: Tests that use random inputs without seeding.
   - Look for: `Math.random()`, UUID generation, random test data.

## Step 3: Fix

Apply the appropriate fix based on the diagnosis:

- **Timing**: Add proper `await`, use fake timers, or increase timeouts with a comment explaining why.
- **Shared state**: Add proper setup/teardown, isolate test data.
- **Order dependence**: Make the test self-contained with its own setup.
- **Environment**: Mock `Date`, use fixed locales, use temp directories.
- **Network**: Add mocks/stubs for external calls.
- **Random data**: Seed the random generator or use fixed test data.

## Step 4: Verify Stability

Run the test multiple times to confirm the fix:
```bash
for i in {1..10}; do npm test -- <test_file> 2>&1 | tail -1; done
```

All 10 runs must pass. If any fail, the fix is incomplete — go back to Step 2.

## Step 5: Review (`forge-review`)

Quick review:
- Stage 1: The flaky test now passes consistently.
- Stage 2: The fix doesn't weaken the test (still tests meaningful behavior), no new issues introduced.

## Step 6: Ship (`forge-ship`)

1. Create branch: `fix/flaky-test-<test-name>`
2. Commit: `fix: stabilize flaky test in <test_file> — [root cause]`
3. Push and create PR.

## Step 7: Monitor (`forge-monitor-pr`)

1. Poll CI — the previously flaky test should now pass consistently.
2. Fix CI failures if any (max 2 rounds).

## Cross-Cutting Rules

- **Root cause, not band-aid**: Do not just add retries or increase timeouts without understanding why.
- **Fresh context on retry**: If retrying, re-run the diagnosis from scratch.
- **Preserve test intent**: The fix must not weaken what the test validates.
- **Document the root cause**: Include the root cause in the commit message.
