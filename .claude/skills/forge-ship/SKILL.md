---
name: forge-ship
description: >-
  Use when shipping code that has already been reviewed via the forge workflow. Contains the specific procedure for creating worktree-isolated branches, making atomic commits per PLAN.md task (one commit per task, ordered by wave), pushing, and opening a PR with the forge PR template (Summary, Requirements Addressed, Test Plan, Linked Issues). Reads SPEC.md, PLAN.md, and CONTEXT.md to hydrate context. Do NOT use for general git commits, merging PRs, or code review.
generated-status: failed
verified-at: '2026-03-16T19:14:05.727Z'
verification-score: 86
---

# Forge Ship Phase

You are shipping reviewed code. This phase creates an isolated branch, makes atomic commits, pushes, and opens a pull request. You NEVER merge — that is the reviewer's job.

## Step 1: Context Hydration

1. Read `SPEC.md` for the feature name and requirements.
2. Read `PLAN.md` for the task breakdown (used for commit messages).
3. Read `CONTEXT.md` for linked issues.
4. Check `git status` and `git branch` to understand current state.

## Step 2: Create Branch

Determine the branch name from the feature/issue:
- Format: `feat/<short-description>` for features, `fix/<short-description>` for bugs
- Example: `feat/user-authentication`, `fix/login-timeout`

If a worktree is appropriate (large feature, parallel work):
```
Use forge_worktree_create to create an isolated worktree
```

Otherwise, create a branch from the default branch:
```bash
git checkout -b <branch-name> origin/main
```

## Step 3: Atomic Commits

Make one commit per completed task from PLAN.md. Each commit should be:

- **Self-contained**: The codebase compiles and tests pass after this commit.
- **Descriptive**: Commit message references the task ID and describes what changed.
- **Focused**: Only includes files listed in the task.

Commit message format:
```
<task-id>: <description>

- [bullet points of what changed]
- Files: <list of files>
```

Stage files explicitly by name — never use `git add -A` or `git add .` to avoid accidentally including sensitive files.

Order commits to respect task dependencies (Wave 1 tasks committed before Wave 2 tasks).

## Step 4: Push

Push the branch to the remote:
```bash
git push -u origin <branch-name>
```

If push fails due to remote changes, rebase and retry:
```bash
git fetch origin main
git rebase origin/main
git push -u origin <branch-name>
```

## Step 5: Create Pull Request

Create a PR using `gh pr create` with this structure:

```
Title: [Short description under 70 chars]

Body:
## Summary

[1-3 bullet points describing what this PR does]

## Requirements Addressed

- [R1: requirement from SPEC.md]
- [R2: ...]

## Test Plan

- [ ] [How to test this change]
- [ ] [Another test step]

## Linked Issues

Closes #<issue_number> (if applicable)

## Review Notes

[Anything the reviewer should know — edge cases, tradeoffs, areas of concern]
```

Use a HEREDOC to pass the body for correct formatting.

## Rules

- NEVER merge the PR. Only create it.
- NEVER force push unless explicitly asked by the user.
- NEVER commit files that contain secrets (.env, credentials, tokens).
- NEVER use `git add -A` or `git add .` — stage files explicitly.
- If there are no changes to commit, do not create an empty commit.
- If the branch already exists on the remote, confirm with the user before overwriting.
- Always verify the PR was created successfully and report the PR URL.
