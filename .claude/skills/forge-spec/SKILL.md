---
name: forge-spec
description: >-
  Create or review a SPEC.md — structured requirements, phases, and tasks with
  acceptance criteria. Must pass review before proceeding.
generated-status: failed
verified-at: '2026-03-16T19:11:00.690Z'
verification-score: 84
---

# Forge Spec Phase

You are creating or reviewing a **SPEC.md** file. The spec is the single source of truth for what will be built. It must be complete, unambiguous, and pass review before any implementation begins.

## Step 1: Context Hydration

1. Read `CLAUDE.md` for project conventions.
2. Read `CONTEXT.md` (required — if missing, run `forge-discuss` first).
3. Read any existing `SPEC.md` to determine if this is a new spec or a revision.
4. If retrying after a failed review, approach the problem fresh. Do not reuse the failed spec structure — re-read CONTEXT.md and rebuild.

## Step 2: Create SPEC.md

Write `SPEC.md` in the project root with this structure:

```markdown
# Spec: [Feature Name]

**Version:** 1.0
**Status:** draft
**Created:** [ISO timestamp]
**Updated:** [ISO timestamp]

## Overview

[2-3 sentence description of what this feature does and why it matters]

## Requirements

### R1: [Requirement name]
**Description:** [What it does]
**Acceptance criteria:**
- [ ] [Specific, testable criterion]
- [ ] [Another criterion]

### R2: [Next requirement]
...

## Out of Scope

- [What we are NOT building]

## Tech Stack

- [Language, framework, libraries]

## Phases

### Phase 1: [Phase name]
[Description of what this phase delivers]

#### Tasks

| ID | Description | Files | Verification | Dependencies |
|----|-------------|-------|-------------|-------------|
| T1 | [Task description] | [file paths] | [How to verify] | [Task IDs] |
| T2 | ... | ... | ... | T1 |

### Phase 2: [Phase name]
...
```

## Step 3: Self-Review

Before presenting the spec, run this review checklist:

**Completeness checks (all must pass):**
- [ ] No TBD, TODO, or placeholder sections anywhere in the spec
- [ ] Every requirement has at least one acceptance criterion
- [ ] Every acceptance criterion is testable (can be verified with a specific action)
- [ ] Every task has files, verification criteria, and dependencies listed
- [ ] Out of scope section exists and is non-empty
- [ ] Overview is specific (not generic boilerplate)

**Consistency checks:**
- [ ] All requirements are covered by at least one task
- [ ] Task dependencies form a valid DAG (no circular dependencies)
- [ ] File paths are realistic for the project structure
- [ ] Tech stack matches project conventions from CLAUDE.md

**Quality checks:**
- [ ] Tasks are small enough to implement in a single commit
- [ ] Verification criteria are concrete (not "works correctly" — specify HOW to verify)
- [ ] No requirement is duplicated across tasks

If any check fails, fix the spec before presenting it.

## Step 4: Status Transitions

- **draft**: Initial creation. Can be edited freely.
- **review**: Self-review passed. Present to user for approval.
- **approved**: User approved. Ready for planning/execution.

Update the Status field in SPEC.md as you transition.

## Rules

- NEVER leave TBD or placeholder content in a spec marked as "review" or "approved."
- NEVER skip the self-review step.
- NEVER include implementation details in requirements — requirements describe WHAT, not HOW.
- If CONTEXT.md is missing or incomplete, tell the user to run `forge-discuss` first.
- Each requirement MUST have acceptance criteria. "Implement X" is not a requirement — "Users can do Y, verified by Z" is.
