---
name: forge-monitor-pr
description: >-
  Use when a PR has been created and needs post-submission monitoring. Contains the specific procedure for polling CI status with gh pr checks, reading failed run logs with gh run view --log-failed, auto-fixing CI failures (max 2 rounds), and responding to reviewer comments (human and bot). Reads SPEC.md and CONTEXT.md to answer review questions. Do NOT use for creating PRs, reviewing PRs, or pre-merge code changes.
---

# Forge Monitor PR

You are monitoring a pull request after creation. Your job is to ensure CI passes and respond to review comments.

## Step 1: Context Hydration

1. Get the PR number and URL. If not provided, check `gh pr list --head $(git branch --show-current)`.
2. Read `SPEC.md` and `PLAN.md` to understand what was built.
3. Read the PR description to understand what was shipped.

## Step 2: Poll CI Status

Check CI status using:
```bash
gh pr checks <pr_number>
```

Or use `forge_ci_status` if available.

Wait for CI to complete. Poll every 30 seconds, up to 10 minutes.

### If CI passes:
Report success and proceed to Step 3 (comment monitoring).

### If CI fails (Round 1):

1. **Read the CI logs**: Use `gh run view <run_id> --log-failed` to get failure details.
2. **Analyze the failure**: Determine if it is:
   - A test failure (fix the test or the code)
   - A lint error (fix the lint issue)
   - A build error (fix the compilation issue)
   - A flaky test (re-run CI)
   - An infrastructure issue (not fixable — report to user)
3. **Fix the issue**: Make the minimal change needed to fix the CI failure.
4. **Commit and push**: Use a descriptive commit message: `fix: resolve CI failure — [description]`
5. **Poll again**: Wait for CI to re-run.

### If CI fails (Round 2):

1. Repeat the analysis and fix process.
2. Commit and push the fix.
3. Poll for CI results one more time.

### If CI fails (Round 3+):

Stop. Do NOT keep fixing. Report to the user:
- What failed
- What you tried
- What you think is blocking
- Suggest next steps

## Step 3: Monitor Review Comments

Check for review comments:
```bash
gh pr view <pr_number> --comments
gh api repos/{owner}/{repo}/pulls/<pr_number>/reviews
gh api repos/{owner}/{repo}/pulls/<pr_number>/comments
```

### For each review comment:

1. **Read the comment** carefully.
2. **If it's a question**: Answer it based on SPEC.md, CONTEXT.md, and the code.
3. **If it's a change request**:
   - Evaluate whether the change is valid.
   - If valid: make the change, commit, push, and reply confirming the fix.
   - If you disagree: reply with a respectful explanation of why, referencing the spec or technical constraints.
4. **If it's from an automated reviewer** (Copilot, CodeRabbit, etc.):
   - Evaluate each suggestion on merit.
   - Apply suggestions that improve code quality.
   - Dismiss suggestions that are false positives or conflict with the spec.

## Retry Protocol

- If retrying after failure, approach the problem fresh. Do not reuse failed fixes.
- Max 2 rounds of CI fixes. After that, escalate to the user.
- For review comments, respond to all comments in a single pass when possible.

## Rules

- NEVER merge the PR. Only fix CI and respond to comments.
- NEVER force push unless the reviewer specifically asks for a squash or rebase.
- NEVER dismiss review comments without responding.
- NEVER make changes beyond what CI or reviewers request — do not scope-creep during monitoring.
- If CI is passing and there are no comments, report "PR is green and ready for review" and stop.
