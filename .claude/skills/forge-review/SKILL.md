---
name: forge-review
description: >-
  Two-stage review gate — spec compliance then code quality. Must pass both
  stages. Unlimited retries.
generated-status: failed
verified-at: '2026-03-16T19:12:34.047Z'
verification-score: 83
---

# Forge Review Gate

You are running the **two-stage review gate**. Code must pass both stages before it can be shipped. This review is strict — incomplete or low-quality work gets sent back for fixes.

## Pre-Review: Context Hydration

1. Read `SPEC.md` to understand what was supposed to be built.
2. Read `PLAN.md` to understand the task breakdown.
3. Read `CONTEXT.md` for decisions and edge cases.
4. If retrying after a previous failure, approach with fresh eyes. Do NOT reuse your previous review — re-read all artifacts and re-evaluate from scratch.

## Stage 1: Spec Compliance

Check whether the implementation matches the spec. Every check uses a severity level:

- **critical** (blocks): Must fix before proceeding. Review fails.
- **major** (warns): Should fix. Review passes with warnings.
- **minor** (notes): Nice to fix. Does not affect review outcome.

### Checks:

1. **File existence** [critical]: Every file listed in PLAN.md tasks exists.
2. **No empty files** [critical]: No created file is empty or contains only boilerplate.
3. **Requirements coverage** [critical]: Every requirement in SPEC.md has corresponding implementation. Trace each requirement to code.
4. **Acceptance criteria** [critical]: Every acceptance criterion in SPEC.md is satisfied. Run the verification steps from PLAN.md.
5. **No TBD/TODO in deliverables** [major]: No TODO, FIXME, HACK, or TBD markers in new code (existing ones in untouched code are fine).
6. **No placeholder implementations** [major]: No functions that just throw "not implemented" or return hardcoded test data.

### Stage 1 verdict:
- Any **critical** issue = FAIL. Stop here. List all issues and ask for fixes.
- Only **major** or **minor** issues = PASS with warnings. Proceed to Stage 2.

## Stage 2: Code Quality

Check whether the code is well-written. Only run this if Stage 1 passed.

### Checks:

1. **File size** [major]: No file exceeds 500 lines. If it does, recommend splitting.
2. **Function complexity** [major]: No function exceeds 50 lines. If it does, recommend extracting helpers.
3. **Hardcoded secrets** [critical]: No passwords, API keys, tokens, or secrets in code. Check for patterns like `password =`, `api_key =`, `secret =`, `token =` that don't reference environment variables.
4. **Console.log in production** [minor]: No `console.log` statements in production code (test files are fine).
5. **Tests exist** [major]: New functionality has corresponding test files. Check for `.test.` or `.spec.` files.
6. **Tests pass** [major]: Run `forge_run_tests` or `npm test` and verify all tests pass.
7. **Lint passes** [major]: Run `forge_run_lint` or `npm run lint` and verify no errors.
8. **Type safety** [major]: For TypeScript projects, run `npx tsc --noEmit` and verify no type errors.
9. **No `any` abuse** [minor]: Check for excessive use of `any` type (more than 3 instances in new code).

### Stage 2 verdict:
- Any **critical** issue = FAIL. List all issues and ask for fixes.
- Only **major** or **minor** issues = PASS with warnings.

## Output Format

Present the review as:

```
## Review Results

### Stage 1: Spec Compliance — [PASS/FAIL]

| # | Check | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| 1 | File existence | critical | PASS | All 5 files exist |
| 2 | ... | ... | ... | ... |

### Stage 2: Code Quality — [PASS/FAIL]

| # | Check | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| 1 | File size | major | PASS | Largest: 234 lines |
| 2 | ... | ... | ... | ... |

### Verdict: [PASS / FAIL]

[If FAIL: list specific issues to fix with file paths and line numbers]
[If PASS: confirm ready to ship]
```

## Retry Protocol

- If review fails, fix the issues and re-run the review.
- On retry, re-read all context files fresh. Do not assume previous state.
- There is no retry limit — keep trying until the review passes.
- After 10 failed rounds, stop and explain what is blocking progress. Do not silently loop.

## Rules

- NEVER skip Stage 1. Stage 2 only runs if Stage 1 passes.
- NEVER pass a review with critical issues.
- NEVER modify the spec to match the implementation — the implementation must match the spec.
- If the spec itself is wrong, stop the review and tell the user to update the spec first.
