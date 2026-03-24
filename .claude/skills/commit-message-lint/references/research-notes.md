# Commit Message Lint -- Research Notes

## Sources Consulted

### Conventional Commits Specification (v1.0.0)
- URL: https://www.conventionalcommits.org/en/v1.0.0/
- The canonical spec. Defines the `type(scope): description` format.
- Valid types derived from Angular convention: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
- Breaking changes indicated by `!` after type/scope or `BREAKING CHANGE:` footer.
- Correlates with SemVer: fix = PATCH, feat = MINOR, BREAKING CHANGE = MAJOR.

### Conventional Commits Cheatsheet (GitHub Gist)
- URL: https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13
- Practical quick reference. Confirms the standard type list.
- Notes that scope should be a noun describing a section of the codebase.

### Git Commit Message Anti-Patterns (AMC Blog)
- URL: https://amcaplan.ninja/blog/2016/12/26/git-commit-message-anti-patterns/
- Identifies key anti-patterns: vague messages, repetitive messages, implementation-detail descriptions.
- Key insight: "The commit tagline should explain the semantic nature of your changes -- the What, not the How."
- Messages like "bug fix", "more work", "minor changes" communicate nothing.

### Conventional Commits Complete Guide (Marc Nuri)
- URL: https://blog.marcnuri.com/conventional-commits
- Emphasizes tooling benefits: automated changelogs, semantic versioning, searchable history.
- Notes 50-char subject preference (from Tim Pope) but 72 chars is the widely accepted max.

### Patterns for Better Git Commit Messages (DEV Community)
- URL: https://dev.to/helderberto/patterns-for-writing-better-git-commit-messages-4ba0
- Reinforces imperative mood convention.
- Recommends: each commit = single concern.
- Good framing: "If applied, this commit will {your subject line}."

## Design Decisions

1. **72-char limit over 50-char**: The 50-char "rule" is a guideline for the description portion only. With type and scope prefix, 72 chars for the full subject is more practical and aligns with git's own wrapping behavior.

2. **Scoring cap per commit**: Without a per-commit cap, a single terrible commit (e.g., "asdf" with 4 findings) could drop the score by 5+ points, making the score less useful as an overall quality indicator. A -3 cap per commit keeps the score representative.

3. **Auto-generated message exemptions**: Dependabot, Renovate, GitHub merge commits, and similar auto-generated messages follow their own conventions. Flagging them creates noise without actionable value.

4. **Imperative mood detection**: Only checking for -ed and -ing endings is imperfect but avoids false positives from NLP complexity. The check is warning-level, not critical, acknowledging its heuristic nature.

5. **Profanity detection is conservative**: Only flag obvious, unambiguous cases. Words with dual meanings (e.g., "damn" in "damn good performance improvement") should not be flagged. This check exists for professional history, not censorship.
