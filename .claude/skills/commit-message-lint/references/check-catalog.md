# Commit Message Lint -- Full Check Catalog

Detailed descriptions, rationale, and examples for every check.

---

## Category F: Format

### F01 -- Missing type prefix

**Severity:** critical

Conventional commits require a type prefix (e.g., `feat`, `fix`, `docs`) to categorize the change. Without it, automated tooling (changelogs, semantic versioning) cannot process the commit.

**Detect:** Subject line does not start with a recognized type keyword followed by an optional scope and colon.

**Bad:**
```
add user authentication
fixed the login bug
updated readme
```

**Good:**
```
feat: add user authentication
fix: resolve login redirect loop
docs: update API usage examples in README
```

### F02 -- Missing colon+space separator after type

**Severity:** critical

The conventional commit format requires `type(scope): description` or `type: description`. Missing the colon or the space after it breaks tooling.

**Detect:** Subject starts with a valid type but is not followed by `:` and a space (with optional scope in between).

**Bad:**
```
feat add user login
fix- resolve crash on startup
refactor(auth)update token logic
```

**Good:**
```
feat: add user login
fix: resolve crash on startup
refactor(auth): update token logic
```

### F03 -- Subject line over 72 characters

**Severity:** warning

Long subject lines get truncated in `git log --oneline`, GitHub, and other tools. Keep the subject concise and put details in the body.

**Detect:** First line of the commit message exceeds 72 characters.

**Bad:**
```
feat(authentication): add OAuth2 support with Google and GitHub providers including refresh token rotation and session management
```

**Good:**
```
feat(auth): add OAuth2 support for Google and GitHub

Includes refresh token rotation and session management.
Provider config is read from environment variables.
```

### F04 -- Body not separated from subject by blank line

**Severity:** warning

Git treats the first line as the subject. If additional text follows without a blank line separator, tools may render it incorrectly.

**Detect:** Commit message has more than one line and the second line is not blank.

**Bad:**
```
fix: resolve null pointer in user service
The user object was not being checked for null before
accessing the email property.
```

**Good:**
```
fix: resolve null pointer in user service

The user object was not being checked for null before
accessing the email property.
```

### F05 -- Invalid type

**Severity:** warning

Using non-standard types reduces the value of conventional commits. Stick to the recognized set: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

**Detect:** Subject starts with a word followed by `:` or `(`, but the word is not in the standard type list.

**Bad:**
```
feature: add login page
bugfix: resolve crash
improvement: speed up query
```

**Good:**
```
feat: add login page
fix: resolve crash
perf: speed up query
```

### F06 -- Footer format invalid

**Severity:** info

Footers should use the format `token: value` or `token #value` (e.g., `Reviewed-by: Name`, `Fixes #123`). `BREAKING CHANGE:` is a special footer.

**Detect:** Lines after the body that look like footers but do not follow the `token: value` or `token #value` pattern.

---

## Category SC: Scope

### SC01 -- Inconsistent scope naming across commits

**Severity:** warning

Using different scope names for the same module creates noise and defeats the purpose of scoping. For example, `auth` in some commits and `authentication` in others.

**Detect:** Across the analyzed commit range, find scopes that likely refer to the same component but use different names.

Common inconsistency pairs:
- `auth` / `authentication`
- `db` / `database`
- `api` / `rest` / `http`
- `ui` / `frontend` / `client`
- `srv` / `server` / `backend`
- `deps` / `dependencies`
- `config` / `cfg` / `configuration`

### SC02 -- Overly broad scope

**Severity:** info

Scopes like `app`, `code`, `project`, `src`, `all`, `everything`, `stuff` are too broad to be useful. A good scope identifies a specific module or subsystem.

**Detect:** Scope matches a list of known overly-broad terms.

**Bad:**
```
fix(app): resolve crash
refactor(code): clean up utils
chore(all): update dependencies
```

**Good:**
```
fix(auth): resolve crash on token refresh
refactor(parser): clean up AST visitor
chore(deps): update lodash to 4.17.21
```

### SC03 -- Missing scope when project uses scopes consistently

**Severity:** info

If most commits in the range use scopes, a commit without a scope may be an oversight.

**Detect:** More than 70% of analyzed commits use a scope, and this commit does not.

---

## Category D: Description Quality

### D01 -- Vague/meaningless message

**Severity:** critical

A commit message should explain what changed and why. Messages like "fix stuff" or "update" communicate nothing.

**Detect:** Full subject line (or the description portion after the type prefix) matches one of these patterns:

Exact matches (case-insensitive, with or without type prefix):
- "fix stuff", "fix things", "fixed stuff", "fixed things"
- "update", "updates", "updated"
- "changes", "change", "changed"
- "misc", "miscellaneous"
- "WIP", "wip", "work in progress"
- "temp", "tmp", "temporary"
- "test", "testing" (as the entire description)
- "asdf", "aaa", "xxx", "foo", "bar", "baz"
- ".", "..", "..."
- "minor", "minor changes", "minor fix", "minor update"
- "small fix", "quick fix", "hotfix" (as the entire description)
- "oops", "oopsie", "whoops"
- "stuff", "things"
- "idk"
- "done"
- "commit"
- "save", "saving"
- "checkpoint"

**Bad:**
```
fix stuff
update
misc changes
WIP
.
```

**Good:**
```
fix(auth): prevent session fixation on login
feat(api): add pagination to user list endpoint
refactor: extract validation logic into shared module
```

### D02 -- Non-imperative mood

**Severity:** warning

Git convention (and the conventional commits spec) uses imperative mood: "add feature" not "added feature" or "adding feature". This matches the style of git-generated messages like "Merge branch..." and reads as an instruction: "applying this commit will {description}".

**Detect:** Description starts with a past-tense verb (ending in "-ed") or present participle (ending in "-ing").

Common false positives to ignore:
- "fixed-width", "added-value" (compound adjectives)
- Words that naturally end in -ed but are not past tense in context

**Bad:**
```
feat: added user login
fix: fixing the crash on startup
docs: updated the README
```

**Good:**
```
feat: add user login
fix: resolve crash on startup
docs: update API usage examples in README
```

### D03 -- Describes implementation, not intent

**Severity:** warning

The commit message should explain what the change achieves, not the low-level code changes. The diff shows the code; the message should explain the purpose.

**Detect:** Description contains implementation details like specific variable names, function calls, or line numbers without explaining the purpose.

**Bad:**
```
fix: change userId to number type in UserService.ts line 42
refactor: move foo() from bar.js to baz.js
feat: add if-else block to handleLogin
```

**Good:**
```
fix: use numeric user IDs to match database schema
refactor: colocate parsing logic with AST module
feat: add fallback authentication for legacy accounts
```

### D04 -- Description under 10 characters

**Severity:** warning

Extremely short descriptions rarely provide enough context. If the description after the type prefix is under 10 characters, it is likely too vague.

**Detect:** The description portion (after `type(scope): `) is fewer than 10 characters.

**Bad:**
```
fix: typo
feat: auth
docs: readme
chore: bump
```

**Good:**
```
fix: correct spelling of "authentication" in login form
feat: add OAuth2 authentication flow
docs: add API rate limiting section to README
chore: bump typescript from 5.3 to 5.4
```

### D05 -- Redundant type in description

**Severity:** info

Repeating the type word in the description is redundant because the type prefix already conveys it.

**Detect:** The description (after `type: `) starts with or contains the same word as the type.

**Bad:**
```
fix: fix the login bug
feat: add a new feature for exports
refactor: refactor the user service
docs: document the documentation process
test: test the payment flow
```

**Good:**
```
fix: resolve login redirect loop
feat: add CSV export for reports
refactor: extract shared validation logic
docs: add API authentication guide
test: cover payment flow edge cases
```

### D06 -- Starts with uppercase after type prefix

**Severity:** info

The conventional commits spec recommends lowercase for the description to maintain consistency. This is a stylistic convention, not a hard rule.

**Detect:** The first character of the description (after `type(scope): `) is uppercase.

**Bad:**
```
feat: Add user login
fix: Resolve crash on startup
```

**Good:**
```
feat: add user login
fix: resolve crash on startup
```

---

## Category AP: Anti-Patterns

### AP01 -- Multiple concerns in one commit

**Severity:** warning

Each commit should address a single concern. Commits that mix feature work with refactoring, or bug fixes with formatting, are harder to review, revert, and bisect.

**Detect:** Heuristics:
- Subject mentions "and" connecting unrelated actions ("add login and fix payment bug")
- Diff touches files in completely unrelated modules (if diff is available)
- Subject uses multiple type-like words ("fix and refactor", "add and update")

**Bad:**
```
feat: add user login and fix payment processing and update docs
```

**Good:**
```
feat(auth): add user login flow
fix(payments): resolve decimal rounding in totals
docs: update authentication guide
```

### AP02 -- Ticket/issue number only

**Severity:** critical

A commit message that contains only a ticket number provides no context without access to the issue tracker. Commit messages should be self-contained.

**Detect:** Subject line is only a ticket reference pattern: `JIRA-1234`, `#1234`, `PROJ-123`, or similar, with no descriptive text.

**Bad:**
```
JIRA-4521
#283
PROJ-99
```

**Good:**
```
fix(auth): prevent session fixation on login

Fixes JIRA-4521
```

### AP03 -- Consecutive identical or near-identical messages

**Severity:** warning

Multiple consecutive commits with the same or nearly identical messages usually indicate WIP commits that should be squashed before merging.

**Detect:** Two or more consecutive commits (by the same author) with identical subject lines, or subjects differing only by a trailing number or punctuation.

**Bad:**
```
fix: update styles
fix: update styles
fix: update styles
```

**Good:**
```
fix(ui): align header spacing with design spec
```

### AP04 -- Profanity or frustration-driven messages

**Severity:** warning

Commit messages are permanent project history and may be read by future contributors, auditors, or during incident review. Keep them professional.

**Detect:** Subject or body contains common profanity or frustration expressions. This check should be conservative -- flag only obvious cases.

### AP05 -- Merge commit with default message only

**Severity:** info

Default merge messages like "Merge branch 'feature' into main" are acceptable but adding context about what was merged and why is better for project history.

**Detect:** Subject matches the pattern `Merge (branch|pull request|remote-tracking branch) '.+'`.

Note: This is info-level only. Default merge messages are common and not necessarily a problem.
