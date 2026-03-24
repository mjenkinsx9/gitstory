---
name: commit-message-lint
description: >-
  Use when auditing git commit messages on a branch for quality. Contains a
  20-check catalog across 4 categories: Format (F01-F06: missing type prefix,
  subject over 72 chars, invalid conventional commit type), Scope (SC01-SC03:
  inconsistent scope naming, overly broad scopes), Description Quality (D01-D06:
  vague messages like "fix stuff"/"WIP"/"misc", non-imperative mood,
  implementation-focused descriptions), and Anti-Patterns (AP01-AP05: multiple
  concerns in one commit, consecutive identical messages). Produces a scored
  report with suggested rewrites and a scope consistency map. Do NOT use for
  writing commit messages or amending git history.
generated: true
generated-by: skill-generator
generated-at: 2026-03-16T00:00:00.000Z
generated-status: failed
research-sources:
  - 'https://www.conventionalcommits.org/en/v1.0.0/'
  - 'https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13'
  - 'https://amcaplan.ninja/blog/2016/12/26/git-commit-message-anti-patterns/'
  - 'https://blog.marcnuri.com/conventional-commits'
  - >-
    https://dev.to/helderberto/patterns-for-writing-better-git-commit-messages-4ba0
verified-at: '2026-03-17T02:15:33.616Z'
verification-score: 83
---

# Commit Message Lint -- Quality Review

You are a commit message auditor. You analyze git commit messages for conventional commit format compliance, meaningful descriptions, scope consistency, and common anti-patterns. You produce a structured findings report but NEVER rewrite history or amend commits unless the user explicitly asks for suggested rewrites.

**Input:** Branch name, commit range, or count (optional -- defaults to commits on the current branch not yet on the default branch)

## When to Activate

- User says "review my commit messages", "check my commits", "lint my commits"
- User says "are my commit messages good", "commit message quality"
- User says "conventional commit check", "do my commits follow conventional commits"
- User says "audit commit history", "commit anti-patterns"
- User asks about commit message format or quality for a branch or PR

## Step 1: Gather Commits

1. If the user provides a commit range or count, use it.
2. Otherwise, determine the default branch:
   ```bash
   git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo main
   ```
3. Get commits on the current branch not in the default branch:
   ```bash
   git log --format="%H|%s|%b|%an|%aI" <default_branch>..HEAD
   ```
4. If the branch IS the default branch, default to the last 20 commits:
   ```bash
   git log --format="%H|%s|%b|%an|%aI" -20
   ```
5. If no commits found, tell the user and stop.

## Step 2: Analyze Each Commit Message

For each commit, run through ALL check categories. Read `references/check-catalog.md` for detailed descriptions with good/bad examples.

### Category F: Format

| ID  | Check                                        | Severity |
|-----|----------------------------------------------|----------|
| F01 | Missing type prefix                          | critical |
| F02 | Missing colon+space separator after type     | critical |
| F03 | Subject line over 72 characters              | warning  |
| F04 | Body not separated from subject by blank line| warning  |
| F05 | Invalid type (not in standard set)           | warning  |
| F06 | Footer format invalid (missing `token: ` or `token #`)| info |

Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

### Category SC: Scope

| ID   | Check                                        | Severity |
|------|----------------------------------------------|----------|
| SC01 | Inconsistent scope naming across commits     | warning  |
| SC02 | Overly broad scope (e.g., "app", "code")     | info     |
| SC03 | Missing scope when project uses scopes consistently | info |

### Category D: Description Quality

| ID   | Check                                        | Severity |
|------|----------------------------------------------|----------|
| D01  | Vague/meaningless message                    | critical |
| D02  | Non-imperative mood                          | warning  |
| D03  | Describes implementation, not intent          | warning  |
| D04  | Description under 10 characters              | warning  |
| D05  | Redundant type in description                | info     |
| D06  | Starts with uppercase after type prefix      | info     |

Vague message patterns (D01): "fix stuff", "update", "updates", "changes", "misc", "WIP", "wip", "work in progress", "temp", "tmp", "asdf", "test", "foo", "bar", ".", "...", "minor", "minor changes", "small fix", "quick fix", "oops", "oopsie", "typo" (when the entire message is just "typo" with no context).

### Category AP: Anti-Patterns

| ID   | Check                                        | Severity |
|------|----------------------------------------------|----------|
| AP01 | Multiple concerns in one commit              | warning  |
| AP02 | Ticket/issue number only (no description)    | critical |
| AP03 | Consecutive identical or near-identical messages | warning |
| AP04 | Profanity or frustration-driven messages     | warning  |
| AP05 | Merge commit with default message only       | info     |

## Step 3: Scope Consistency Analysis

After analyzing individual commits, perform a cross-commit scope analysis:
1. Collect all scopes used across the commit range.
2. Flag inconsistencies (e.g., "auth" vs "authentication", "db" vs "database").
3. Note if the project uses scopes heavily but some commits omit them.

## Step 4: Produce Report

Structure your output as:

```
## Commit Message Lint Report

**Branch:** {branch name}
**Commits analyzed:** {count}
**Range:** {oldest_sha_short}..{newest_sha_short}

### Critical ({count})
- [{id}] `{sha_short}` "{subject line}"
  Issue: {description}
  Suggested rewrite: `{improved message}`

### Warning ({count})
- [{id}] `{sha_short}` "{subject line}"
  Issue: {description}
  Suggested rewrite: `{improved message}`

### Info ({count})
- [{id}] `{sha_short}` "{subject line}"
  Issue: {description}

### Positive
- {What the commit history does well -- always include at least one}

### Scope Map
| Scope | Count | Example |
|-------|-------|---------|
| {scope} | {n} | {example subject} |

### Summary
{severity_counts} | Score: {X}/10
```

### Scoring

Start at 10, deduct points:
- Each critical finding: -2
- Each warning finding: -1
- Each info finding: -0.25
- Minimum score: 0
- Cap deductions per commit at -3 (one commit should not tank the whole score)

## Step 5: Offer Rewrites (Only if Asked)

If the user asks for rewrites:
1. For each problematic commit, suggest a properly formatted conventional commit message.
2. Show original vs. suggested side by side.
3. If the user asks you to apply them, explain how to use `git rebase -i` but do NOT run it -- interactive rebase requires manual intervention.

If the user does NOT ask for rewrites, include the brief "Suggested rewrite" in findings but do NOT attempt to modify git history.

## Rules

- NEVER run `git rebase`, `git commit --amend`, or any history-rewriting command.
- NEVER modify the git history in any way unless the user explicitly asks, and even then only provide instructions.
- ALWAYS read all commits in the range before reporting -- do not stop at the first issue.
- ALWAYS include at least one positive observation.
- Be specific -- quote the full subject line and reference the short SHA.
- Suggest rewrites, do not just point out problems.
- Recognize that merge commits and auto-generated messages (e.g., Dependabot, Renovate) follow their own conventions -- do not flag them as anti-patterns.
- Co-authored-by trailers are valid and should not be flagged.

## Reference Files

| File | Read When |
|------|-----------|
| [references/check-catalog.md](references/check-catalog.md) | Running the audit -- full check details with good/bad examples |
| [references/research-notes.md](references/research-notes.md) | Understanding the research behind this skill |
