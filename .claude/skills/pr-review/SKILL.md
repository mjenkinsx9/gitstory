---
name: pr-review
description: >-
  Use when reviewing a pull request (read-only — no code changes). Takes a pr_number, fetches the PR diff with gh pr diff, checks SPEC.md compliance if present, and performs a structured review covering correctness (off-by-one, null handling, race conditions), security (injection, secrets), quality (function length, any abuse, console.log), testing (coverage, meaningful assertions), and style. Submits review via gh pr review with approve/comment/request-changes. Do NOT use for fixing code, implementing features, or monitoring CI.
---

# PR Review — Review-Only Workflow

You are reviewing a pull request. This is a review-only workflow — you do NOT fix or modify code. You provide feedback.

**Input:** `pr_number` (required)

## Step 1: Context Hydration

1. Read `CLAUDE.md` for project conventions.
2. Fetch PR details: `gh pr view <pr_number>`
3. Fetch the PR diff: `gh pr diff <pr_number>`
4. Read the PR description, linked issues, and any existing review comments.
5. If `SPEC.md` exists, read it to understand intended requirements.
6. Check CI status: `gh pr checks <pr_number>`

## Step 2: Understand the Change

Before reviewing, build a mental model:
1. What is this PR trying to do? (Read the PR description and linked issue)
2. What files are changed? (Read the diff summary)
3. What is the blast radius? (How many files, how central are they)

## Step 3: Review — Spec Compliance

If a SPEC.md exists, check:
- [ ] All requirements from the spec are addressed
- [ ] Acceptance criteria are met
- [ ] No spec requirements are missing from the implementation

If no SPEC.md exists, check:
- [ ] The PR description clearly states what it does
- [ ] The implementation matches the stated intent
- [ ] No obvious missing functionality

## Step 4: Review — Code Quality

For each changed file in the diff:

1. **Correctness**: Does the code do what it claims? Look for:
   - Off-by-one errors
   - Null/undefined handling
   - Error handling gaps
   - Race conditions
   - Missing edge cases

2. **Security**: Check for:
   - Hardcoded secrets or credentials
   - SQL injection, XSS, or other injection vulnerabilities
   - Improper input validation
   - Overly permissive permissions

3. **Quality**: Check for:
   - Functions over 50 lines
   - Files over 500 lines
   - Duplicated logic
   - Missing type annotations (TypeScript)
   - `any` type abuse
   - Console.log in production code

4. **Testing**: Check for:
   - Test coverage for new functionality
   - Test coverage for edge cases
   - Tests that actually assert meaningful behavior (not just "doesn't throw")

5. **Style**: Check for:
   - Consistency with existing codebase patterns
   - Clear naming
   - Appropriate comments (explaining WHY, not WHAT)

## Step 5: Submit Review

Submit the review using `gh pr review <pr_number>`:

- If no issues: `gh pr review <pr_number> --approve --body "LGTM. [brief summary of what looks good]"`
- If minor issues only: `gh pr review <pr_number> --comment --body "[feedback]"`
- If blocking issues: `gh pr review <pr_number> --request-changes --body "[feedback]"`

For inline comments on specific lines, use:
```bash
gh api repos/{owner}/{repo}/pulls/<pr_number>/comments -f body="[comment]" -f path="[file]" -f line=[line] -f side="RIGHT" -f commit_id="[sha]"
```

## Review Format

Structure your review as:

```
## Summary
[1-2 sentence summary of the PR and your overall assessment]

## Findings

### Critical (blocks merge)
- [file:line] [issue description]

### Major (should fix)
- [file:line] [issue description]

### Minor (nice to fix)
- [file:line] [issue description]

### Positive
- [What the PR does well — always include at least one positive note]
```

## Rules

- NEVER modify code in this workflow. Review only.
- NEVER approve a PR with critical issues.
- NEVER nitpick style if the project has no linter — focus on correctness and security.
- Always include at least one positive observation.
- Be specific — reference file paths and line numbers.
- Suggest fixes, don't just point out problems.
