---
name: forge-plan
description: >-
  Break an approved SPEC.md into waves of parallelizable tasks with
  dependencies. Outputs PLAN.md.
generated-status: failed
verified-at: '2026-03-16T19:15:40.686Z'
verification-score: 84
---

# Forge Plan Phase

You are breaking an approved spec into an execution plan. The plan organizes tasks into **waves** — groups of tasks that can run in parallel because they have no dependencies on each other.

## Step 1: Context Hydration

1. Read `CLAUDE.md` for project conventions.
2. Read `SPEC.md` (required — must exist and have status "approved"). If not approved, tell the user to run `forge-spec` first.
3. Read `CONTEXT.md` for decisions and edge cases.
4. Scan the current codebase to understand existing file structure and patterns.

## Step 2: Research (before planning)

Dispatch the **researcher** agent before writing any tasks. The researcher answers: "What do I need to know to PLAN this implementation well?"

**Dispatch the researcher agent with:**
- Prompt: "You are being invoked from forge-plan. Research the implementation approach in SPEC.md and produce RESEARCH.md. Answer: what libraries, patterns, and ordering constraints do I need to know to plan this well?"
- Pass the full content of SPEC.md and CONTEXT.md (if exists)
- Working directory: current project directory

**Once the researcher completes and RESEARCH.md exists:**
- Read RESEARCH.md
- Incorporate HIGH-confidence findings into the task graph: adjust file order, wave sequencing, verification steps, library choices
- Flag any LOW-confidence findings as notes in PLAN.md for the implementer to validate

**Skip condition:** If RESEARCH.md already exists from earlier in this session, read it instead of dispatching the agent again.

## Step 3: Build the Task Graph

For each task in SPEC.md:

1. Assign a unique ID: `W<wave>-T<number>` (e.g., W1-T1, W1-T2, W2-T1).
2. Define clearly:
   - **id**: The unique task identifier
   - **description**: What to implement (one sentence)
   - **files**: Exact file paths to create or modify
   - **verification**: How to verify this task is done (specific command, test, or check)
   - **dependencies**: List of task IDs that must complete first
3. Determine which tasks can run in parallel (no shared file dependencies, no logical dependencies).

## Step 4: Organize into Waves

Group tasks into waves based on the dependency graph:

- **Wave 1**: Tasks with no dependencies (foundations, types, interfaces, configs)
- **Wave 2**: Tasks that depend only on Wave 1 tasks
- **Wave N**: Tasks that depend on tasks from previous waves

Rules for wave construction:
- Tasks in the same wave MUST NOT modify the same files.
- Tasks in the same wave MUST NOT have dependencies on each other.
- Keep waves small (2-5 tasks) for manageable review cycles.
- Each task should be completable in a single commit.

## Step 5: Write PLAN.md

Create `PLAN.md` in the project root:

```markdown
# Plan: [Feature Name]

**Spec:** SPEC.md
**Created:** [ISO timestamp]
**Total tasks:** [N]
**Total waves:** [N]

## Wave 1: [Wave description]

| ID | Description | Files | Verification | Deps |
|----|-------------|-------|-------------|------|
| W1-T1 | [description] | `path/to/file.ts` | [verification] | — |
| W1-T2 | [description] | `path/to/other.ts` | [verification] | — |

## Wave 2: [Wave description]

| ID | Description | Files | Verification | Deps |
|----|-------------|-------|-------------|------|
| W2-T1 | [description] | `path/to/file.ts` | [verification] | W1-T1 |

## Execution Notes

- [Any ordering constraints or gotchas]
- [Environment setup needed]
- [Test commands to run between waves]
```

## Step 6: Validate the Plan

Before presenting:
- [ ] Every task from SPEC.md is represented in at least one wave
- [ ] No circular dependencies exist
- [ ] No two tasks in the same wave touch the same file
- [ ] Every task has a concrete verification step
- [ ] Wave order respects all dependency chains

## Rules

- NEVER create a plan without an approved SPEC.md.
- NEVER put dependent tasks in the same wave.
- NEVER create tasks that are too large to verify in a single commit.
- If a task from the spec is too large, split it into subtasks and note the split.
- Each task's verification MUST be runnable (a command, a test, a check — not "it works").
