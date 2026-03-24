---
name: address-todo
description: >-
  Use when resolving a specific TODO, FIXME, or HACK comment in the codebase. Takes file_path and line_number, reads the comment and 50 lines of surrounding context, checks git blame to understand when/why it was added, classifies it (missing implementation, known bug, performance, cleanup, missing tests), implements the fix, removes the comment, and verifies with tests. One TODO per PR. Do NOT use for general code improvements, refactoring, or finding TODOs — this resolves a specific one.
---

# Address TODO — Quick Workflow

You are resolving a TODO, FIXME, or HACK comment in the codebase. This uses the QUICK workflow — no discuss or spec phase.

**Input:** `file_path` (required), `line_number` (required)

## Step 1: Context Hydration

1. Read `CLAUDE.md` for project conventions.
2. Read the file at the specified path and line number.
3. Read the full TODO/FIXME/HACK comment to understand what needs to be done.
4. Read the surrounding code (50 lines above and below) to understand the context.
5. Check git blame for the TODO to understand when and why it was added: `git log -1 --format="%H %s" -L <line>,<line>:<file_path>`
6. Search for related TODOs in the same file or related files.

## Step 2: Understand the TODO

Classify the TODO:

1. **Missing implementation**: Code needs to be written (e.g., "TODO: implement error handling")
2. **Known bug**: A workaround exists and needs proper fix (e.g., "HACK: temporary workaround for #123")
3. **Performance**: Something needs optimization (e.g., "TODO: optimize this N+1 query")
4. **Cleanup**: Dead code, deprecated patterns, or tech debt (e.g., "FIXME: remove after migration")
5. **Missing tests**: Test coverage needed (e.g., "TODO: add tests for edge cases")

## Step 3: Implement the Fix

Based on the classification:

1. **Missing implementation**: Write the code. Follow existing patterns in the file.
2. **Known bug**: Implement the proper fix. Remove the workaround if possible.
3. **Performance**: Profile first, then optimize. Add a comment explaining the optimization.
4. **Cleanup**: Remove dead code, update deprecated patterns, clean up.
5. **Missing tests**: Write the tests. Ensure they test meaningful behavior.

After implementing:
- Remove the TODO/FIXME/HACK comment.
- Run `forge_run_tests` or `npm test` to verify nothing broke.
- Run `forge_run_lint` or `npm run lint`.

## Step 4: Review (`forge-review`)

Quick review:
- Stage 1: The TODO is resolved, the replacement code is correct.
- Stage 2: Tests pass, lint passes, no new issues introduced, the TODO comment is removed.

## Step 5: Ship (`forge-ship`)

1. Create branch: `chore/resolve-todo-<short-description>`
2. Commit: `chore: resolve TODO in <file_path> — [what was done]`
3. Push and create PR.

## Step 6: Monitor (`forge-monitor-pr`)

1. Poll CI.
2. Fix CI failures if any (max 2 rounds).

## Cross-Cutting Rules

- **Remove the comment**: After addressing the TODO, the comment must be removed. Do not leave resolved TODOs.
- **One TODO per PR**: If the file has multiple related TODOs, you may address them together. Unrelated TODOs get separate PRs.
- **Don't gold-plate**: Fix what the TODO asks for. Do not refactor the entire file.
- **Fresh context on retry**: If retrying, re-read the file and surrounding code.
- **If the TODO references an issue**: Check if the issue is still open and relevant. If the issue is closed, the TODO may already be stale.
