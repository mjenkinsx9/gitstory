---
name: clean-feature-flag
description: >-
  Use when a feature flag needs to be removed from the codebase after full rollout or removal. Takes a flag_name, searches for ALL references (definition, conditional branches, tests, docs), maps them in a structured table (File, Line, Type, Action), then removes the flag definition and flattens conditional branches (keeping the "on" or "off" path as appropriate). Verifies zero references remain after cleanup. Do NOT use for adding feature flags, toggling flags, or general code cleanup.
---

# Clean Feature Flag — Quick Workflow

You are removing a feature flag that is no longer needed (the feature is fully rolled out or fully removed). This uses the QUICK workflow.

**Input:** `flag_name` (required)

## Step 1: Context Hydration

1. Read `CLAUDE.md` for project conventions.
2. Search the codebase for all references to the flag:
   ```
   Search for: <flag_name> across all files
   ```
3. Identify:
   - Where the flag is defined (config, environment variable, feature flag service)
   - Where the flag is checked (conditional branches)
   - Where the flag is tested
4. Determine the flag's intended state: Is the feature fully rolled out (keep the "on" branch) or fully removed (keep the "off" branch)?
   - Check with the user if unclear.

## Step 2: Map All References

Create a list of every file and line that references the flag:

| File | Line | Type | Action |
|------|------|------|--------|
| `config/flags.ts` | 15 | Definition | Remove entry |
| `src/feature.ts` | 42 | Conditional | Keep "on" branch |
| `src/feature.test.ts` | 88 | Test | Remove flag-specific test |

## Step 3: Clean Up

For each reference, apply the appropriate action:

1. **Flag definition**: Remove the flag entry from the config/feature flag system.
2. **Conditional branches** (`if flag_enabled`):
   - If feature is rolled out: Keep the "on" branch code, remove the `if` check and the "off" branch.
   - If feature is removed: Keep the "off" branch code, remove the `if` check and the "on" branch.
   - Preserve proper indentation after removing the conditional.
3. **Tests**:
   - Remove tests that specifically test flag-on vs. flag-off behavior.
   - Keep tests for the feature itself (if the feature is staying).
   - Update tests that reference the flag.
4. **Documentation**: Update any docs that mention the flag.

After cleanup:
- Run `forge_run_tests` or `npm test`.
- Run `forge_run_lint` or `npm run lint`.
- Run `npx tsc --noEmit` (TypeScript projects).
- Search for the flag name again to confirm zero references remain.

## Step 4: Review (`forge-review`)

Quick review:
- Stage 1: The flag is completely removed. Zero references remain in the codebase.
- Stage 2: Tests pass, lint passes, no dead code left behind, no broken imports.

## Step 5: Ship (`forge-ship`)

1. Create branch: `chore/remove-flag-<flag-name>`
2. Commit: `chore: remove feature flag <flag_name> — [feature is fully rolled out / feature is removed]`
3. Push and create PR.

## Step 6: Monitor (`forge-monitor-pr`)

1. Poll CI.
2. Fix CI failures if any (max 2 rounds).

## Cross-Cutting Rules

- **Confirm the intended state**: ALWAYS confirm with the user whether the feature should stay (flag on) or go (flag off) before making changes.
- **Zero references**: After cleanup, searching for the flag name must return zero results.
- **No behavioral changes beyond the flag**: Do not refactor or improve code while cleaning the flag.
- **Fresh context on retry**: If retrying, re-search for the flag from scratch.
