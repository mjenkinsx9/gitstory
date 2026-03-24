---
name: implement-feature
description: >-
  Use when implementing a new feature end-to-end from a GitHub issue number. Orchestrates the full 6-phase forge workflow: discuss (parallel agent investigation + structured questioning with options, produce CONTEXT.md with checklist), spec (produce SPEC.md), plan (dispatch researcher agent to produce RESEARCH.md, then produce PLAN.md with parallelizable task waves), execute (implement per PLAN.md tasks with two-stage review per task), audit (TDD discipline audit, plan compliance check, UAT verification walkthrough, finishing branch with PR creation), and monitor (poll CI, respond to reviews). Do NOT use for quick bug fixes, CI fixes, or tasks that do not need the full workflow.
---

# Implement Feature — Full Workflow

You are implementing a new feature end-to-end using the full spec-driven workflow. This is the most thorough workflow — use it for new features that need discussion, specification, and structured implementation.

**Input:** `issue_number` (required)

## Workflow: FULL

Execute these phases in order. Do NOT skip any phase.

**⚠️ CRITICAL: Each phase gate must be completed before proceeding. Skipping phases produces incomplete/broken output. The verification step at the end will fail if phases are skipped.**

### Phase 1: Discuss

**This phase uses parallel agent investigation and structured questioning with user options.**

**PHASE GATE — Complete all items before doing any synthesis work:**

- [ ] Created `/planning/<feature-name>/` directory
- [ ] Dispatched `issue-investigator` agent (🔵 blue) with `issue_number`
- [ ] Dispatched `codebase-investigator` agent (🟢 green) with `feature_domain` and `issue_number`
- [ ] Both agents completed and wrote their reports to `agent-reports/`
- [ ] Read both agent reports before proceeding

**⚠️ You must dispatch both agents. Do NOT synthesize findings yourself — the agents must produce the reports.**

1. **Create feature planning folder**: Create `/planning/<feature-name>/` where `<feature-name>` is derived from the issue title (kebab-case)

2. **Dispatch parallel investigation agents**:

   **Name the planning folder** using [feature-naming-conventions.md](../../.claude/feature-naming-conventions.md):
   - Derive `<feature-name>` from issue title (kebab-case)
   - Create `/planning/<feature-name>/` directory
   - Example: "Add user authentication" → `/planning/add-user-authentication/`

   Dispatch TWO agents simultaneously using the `Task` tool:

   **Agent 1: Issue Investigator** (🔵 blue)
   - Invoke: `issue-investigator` agent
   - Input: `issue_number`
   - This agent fetches issue body, comments, labels, related PRs

   **Agent 2: Codebase Investigator** (🟢 green)
   - Invoke: `codebase-investigator` agent
   - Input: `feature_domain` (derived from issue labels/topic), `issue_number`
   - This agent explores relevant infrastructure, patterns, dependencies

   Both agents write their reports to the planning folder:
   - `/planning/<feature-name>/agent-reports/issue-investigator-report.md`
   - `/planning/<feature-name>/agent-reports/codebase-investigator-report.md`

3. **Read agent reports**: After agents complete, read both reports to synthesize findings

4. **Initialize STATE.md**: Create the state tracking file in the planning folder:
   ```
   /planning/<feature-name>/STATE.md
   ```
   Initialize with Phase 1 status and the Decisions Log (capture any early decisions made during agent investigation).

5. **Chunk-Based Design Validation** (Superpowers pattern): Present design decisions **one chunk at a time** for validation. Do NOT present everything at once.

   For each major design decision identified from agent reports, present ONE chunk for validation. Adapt chunk topics to the feature type:

   **Example template (API features):**
   ```
   **Design Chunk 1: [Interaction Pattern]**

   Based on investigation, I'm considering:
   - Option A: RESTful endpoints with standard CRUD
   - Option B: GraphQL-style flexible queries

   Which approach do you prefer?
   1. **RESTful (recommended)** — Simple, predictable, well-understood
   2. **GraphQL-style** — Flexible queries, nested resolvers
   3. **Something else** — Describe your preference
   ```

   **Example template (CLI/data pipeline features):**
   ```
   **Design Chunk 1: [Input/Output Format]**

   Based on investigation, I'm considering:
   - Option A: Structured files (JSON/YAML config)
   - Option B: Command-line flags with defaults

   Which approach do you prefer?
   1. **Structured files (recommended)** — Declarative, version-controllable
   2. **CLI flags** — Quick for simple cases
   3. **Something else** — Describe your preference
   ```

   **Chunk topics** (select based on feature type, skip if N/A):
   1. Interaction pattern / input-output format
   2. Data model / persistence approach
   3. Authentication / authorization (if applicable)
   4. Error handling strategy
   5. Edge cases flagged by agents

   Once all chunks are validated, proceed to clarifying questions for any remaining gaps.

6. **Formulate clarifying questions**: Based on agent findings and validated design chunks, identify remaining gaps that need user input. Questions should cover:
   - Scope (what's IN vs OUT)
   - Behavior (edge cases, user interactions)
   - API design (interface preferences)
   - Technical constraints (if any agent findings were unclear)
   - Priority (if multiple valid approaches exist)

7. **Ask questions using `AskUserQuestion`** — ONE question per message with options:
   - Provide 2-4 distinct options per question
   - ALWAYS mark one option as `(recommended)` — this is the default if user doesn't respond
   - Options should represent meaningfully different approaches, not minor variations

   **Example question format:**
   ```
   What level of API surface do you want for this feature?

   1. **Minimal (recommended)** — Single endpoint, no versioning, evolvable later
   2. **Full REST** — Standard CRUD endpoints, query params, pagination
   3. **GraphQL-style** — Flexible queries, nested resolvers, subscriptions option
   ```

8. **Iterate** until scope is clear. Each question round MUST use `AskUserQuestion`.

9. **Update STATE.md**: Mark Phase 1 (Discuss) as DONE, log all decisions made during the discuss phase in the Decisions Log section.

10. **Output `CONTEXT.md`** in the planning folder with:
   - **Requirements Checklist** (MUST use checkbox syntax `-[ ]` for every item)
   - **Open Questions** (answered and unanswered)
   - **Scope Boundary** (what's IN and what's OUT)
   - **Suggested Approach** with tradeoffs from agent findings
   - **Issue Reference**: Link to original GitHub issue
   - **Success Criteria** derived from issue and user discussion

### Phase 2: Spec

**This phase writes the SPEC.md, self-reviews it, gets user approval, and creates the worktree.**

**PHASE GATE — Complete all items before drafting SPEC.md:**

- [ ] Read `/planning/<feature-name>/CONTEXT.md` completely
- [ ] Read `/planning/<feature-name>/agent-reports/issue-investigator-report.md`
- [ ] Read `/planning/<feature-name>/agent-reports/codebase-investigator-report.md`
- [ ] State.md exists and Phase 1 is marked DONE
- [ ] Cited 1 key finding from issue investigator report: [cite it]
- [ ] Cited 1 key finding from codebase investigator report: [cite it]

**You must read the Phase 1 outputs. Do NOT draft SPEC.md from memory or prior knowledge.**

#### 2.1 Draft SPEC.md

Using the CONTEXT.md and agent reports from Phase 1, write a comprehensive `SPEC.md` to `/planning/<feature-name>/spec.md`.

**Required Sections:**

```markdown
# [Feature Name] Specification

## Overview
- **Issue**: #[number]
- **Summary**: [2-3 sentence description]
- **Motivation**: [Why this feature is needed]

## Requirements Checklist
All items from CONTEXT.md — each must be addressed:
- [ ] [Requirement 1]
- [ ] [Requirement 2]

## Data Model
- **Types/Interfaces**: [TypeScript interfaces, data shapes]
- **Entities**: [Core entities and their relationships]
- **Edge Cases**: [null, empty, error states]

## API Design
- **Endpoints**: [All endpoints with method, path, params]
- **Request/Response**: [Shape for each operation]
- **Errors**: [Error codes and messages]
- **Auth**: [Authentication/authorization if needed]

## User Flows
- **Happy Path**: [Main user journey]
- **Error Paths**: [Error handling flows]
- **Edge Cases**: [Corner cases]

## Acceptance Criteria
Each criterion must be TESTABLE:
- [ ] [Criterion 1] — verified by: [how to test]
- [ ] [Criterion 2] — verified by: [how to test]

## Out of Scope
Explicitly list what is NOT included:
- [ ] [Exclusion 1]
- [ ] [Exclusion 2]

## Risks & Unknowns
- **[Risk]**: [description] — mitigation: [how to handle]
- **[Unknown]**: [what's uncertain] — approach: [how to handle]

## Status
- **Draft**: [date]
- **Approved**: [date] (pending)
```

#### 2.2 Self-Review

Dispatch the **spec-reviewer** agent (🟠 amber) to review the draft:
- Invoke: `spec-reviewer` agent
- Input: `spec_path` (path to SPEC.md), `context_path` (path to CONTEXT.md)
- The reviewer writes `spec-reviewer-report.md` to the planning folder

Read the report. If **blocking issues** are found:
1. Fix the issues in SPEC.md
2. Re-dispatch spec-reviewer
3. Repeat until no blocking issues

**Advisory recommendations** can be noted but do not block.

#### 2.3 User Approval

Present the SPEC.md to the user for approval using `AskUserQuestion`:

```
I've completed the specification for this feature. Please review SPEC.md and let me know:

1. **Approved (recommended)** — Proceed to planning and worktree setup
2. **Minor edits needed** — Describe the changes and I'll update the spec
3. **Major revisions needed** — This represents a significant scope change

The spec is at: /planning/<feature-name>/spec.md
```

Wait for user response. If "Minor edits":
- Make the edits
- Re-run self-review (step 2.2)
- Ask for approval again

If "Major revisions":
- Discuss the scope changes with user
- May require returning to Phase 1 for re-discussion
- Resume when scope is clarified

#### 2.4 Create Worktree

**After spec approval**, create an isolated worktree following [git-worktree-patterns](../../.claude/git-worktree-patterns.md):

1. **Check for worktree directory**:
   ```bash
   ls -d .worktrees 2>/dev/null || ls -d worktrees 2>/dev/null
   ```

2. **Verify it's ignored**:
   ```bash
   git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
   ```
   If NOT ignored: add to `.gitignore` and commit before proceeding.

3. **Create worktree**:
   ```bash
   git worktree add ".worktrees/<feature-name>" -b "feat/<feature-name>"
   ```

4. **Setup in worktree**:
   ```bash
   cd .worktrees/<feature-name>
   npm install  # or appropriate setup
   ```

5. **Verify baseline**:
   ```bash
   npm test  # or project-appropriate test command
   ```
   If tests fail: report failures, ask whether to proceed or investigate.

6. **Copy planning files to worktree**:
   ```bash
   cp -r /planning/<feature-name> ./
   ```
   Note: This copies planning files from the main repo into the worktree so subagents can access them.

7. **Report**:
   ```
   Worktree ready at .worktrees/<feature-name>
   Branch: feat/<feature-name>
   Tests passing — clean baseline verified
   Ready for Phase 3: Planning
   ```

8. **Update STATE.md**: Mark Phase 2 (Spec) as DONE with completion date.

### Phase 3: Plan (`forge-plan`)

Phase 3 produces `RESEARCH.md` (from researcher) and `PLAN.md` (approved, with reviewer sign-off). This phase uses subagent-driven patterns with review loops and TDD-style task steps.

**PHASE GATE — Complete all items before drafting PLAN.md:**

- [ ] Read `/planning/<feature-name>/SPEC.md` completely
- [ ] STATE.md exists and Phase 2 is marked DONE
- [ ] Cited 1 acceptance criterion from SPEC.md: [cite it]
- [ ] Cited 1 risk/unknown from SPEC.md: [cite it]

**You must read the SPEC.md. Do NOT draft PLAN.md from memory or prior knowledge.**

#### 3.1 Research

Dispatch the **researcher** agent to produce `RESEARCH.md` from SPEC.md:
- Invoke: `researcher` agent
- Input: `spec_path` (path to SPEC.md)
- The researcher validates: current best practices, library versions, codebase patterns to reuse, wave ordering constraints, known pitfalls
- **Skip if RESEARCH.md already exists** in `/planning/<feature-name>/` from a previous run of this skill on the same issue/feature

**Research output:** `RESEARCH.md` in the planning folder with HIGH/MEDIUM/LOW confidence findings.

#### 3.2 Draft PLAN.md

Write `PLAN.md` in the planning folder with required header + TDD-style tasks organized into waves.

**Required Header:**
```markdown
# [Feature] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development to implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** [One sentence describing the feature's purpose]
**Architecture:** [2-3 sentences describing the high-level design]
**Tech Stack:** [Key technologies and libraries]
```

**Task Format:**
```markdown
### Task W1-T1: [Component Name]

**Files:**
- Create: `path/to/file.ts`
- Modify: `path/to/existing.ts`
- Test: `tests/path/to/test.ts`

**Verification:** [concrete command to verify task works]

**Steps:**
- [ ] Step 1: Write failing test
- [ ] Step 2: Run test to verify it fails
- [ ] Step 3: Write minimal implementation
- [ ] Step 4: Run test to verify it passes
- [ ] Step 5: Commit

**Status Handling:**
- DONE → Proceed to review
- DONE_WITH_CONCERNS → Read concerns, address if needed
- NEEDS_CONTEXT → Provide context, re-dispatch
- BLOCKED → May need smaller pieces or escalate
```

**Wave Organization Rules:**
1. Tasks that depend on each other must be in sequential waves
2. Tasks without dependencies can be in the same wave
3. No two tasks in the same wave may touch the same files (file conflict check)
4. Each task must be small enough for a single atomic commit
5. First wave should establish the foundation; later waves add features on top

**Plan must also specify:**
- Two-stage review order: spec compliance review FIRST, then code quality review
- Implementer status handling for DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED
- Finishing branch step as required before claiming implementation complete

#### 3.3 Review Loop

Dispatch the **plan-document-reviewer** agent (🟣 violet):
- Invoke: `plan-document-reviewer` agent
- Input: `plan_path`, `spec_path`, `research_path` (if exists)
- Reviewer writes `plan-document-reviewer-report.md` to the planning folder

**Review checks:**
| Category | Checks |
|----------|--------|
| **Completeness** | Every SPEC.md requirement covered, every wave has tasks |
| **Wave Structure** | Valid DAG, no circular deps, no file conflicts in same wave |
| **Task Quality** | Single-commit size, TDD steps present (all 5), concrete verification |
| **Header** | Goal, Architecture, Tech Stack all present |
| **Research** | HIGH-confidence findings incorporated, LOW-confidence flagged |
| **Status Handling** | Plan specifies how to handle all four statuses |
| **Two-Stage Review** | Plan specifies spec compliance THEN code quality order |

**Loop rules:**
- If **blocking issues** found: fix the issues in PLAN.md and re-dispatch plan-document-reviewer
- If **advisory recommendations**: note them but do not block
- Max **3 iterations** of fix-and-re-review
- After **3 failed iterations**: escalate to human for guidance

Read the report. If blocking issues:
1. Fix the issues in PLAN.md
2. Re-dispatch plan-document-reviewer
3. Repeat until approved or max iterations reached

#### 3.4 Execution Handoff

After plan approval (no blocking issues), ask user via `AskUserQuestion`:

```
The implementation plan is ready for execution. How would you like to proceed?

1. **Subagent-Driven (recommended)** — Dispatch subagents one at a time per task, with two-stage review per task (all waves)
2. **Inline Execution** — Implement wave-by-wave with direct oversight, you control each step
3. **Hybrid** — Subagents for Wave 1 (one task at a time), inline for subsequent waves
```

- **Subagent-Driven** is recommended for features with 5+ tasks
- **Inline** is better for learning/exploration or small features
- **Hybrid** balances parallelism with control

Wait for user response before proceeding to Phase 4.

#### 3.5 Output

After Phase 3 completes:
- `RESEARCH.md` (from researcher agent)
- `PLAN.md` (approved, with plan-document-reviewer sign-off in `plan-document-reviewer-report.md`)
- Execution mode decision from user

**Update STATE.md**: Mark Phase 3 (Plan) as DONE with completion date. Initialize Wave Progress and Task Status tables based on PLAN.md wave structure.

**Reference:** See [subagent-driven-patterns.md](../../.claude/subagent-driven-patterns.md) for detailed execution patterns.

### Phase 4: Execute

Phase 4 execution is driven by PLAN.md task definitions and the execution mode chosen in Phase 3.4.

**PHASE GATE — Complete all items before executing any tasks:**

- [ ] Read `/planning/<feature-name>/PLAN.md` completely
- [ ] STATE.md exists and Phase 3 is marked DONE
- [ ] Listed all waves in the plan: [list them, e.g., W1: 3 tasks, W2: 2 tasks]
- [ ] Cited the first task's files from PLAN.md: [cite W1-T1 files]
- [ ] Confirmed execution mode from Phase 3.4 handoff

**You must read PLAN.md before executing. Do NOT implement tasks from memory or assumptions.**

#### 4.1 Pre-Execution Setup

**Inputs from Phase 3:**
- `PLAN.md` — already reviewed and approved by plan-document-reviewer
- `RESEARCH.md` — already created by researcher agent in Phase 3.1
- `SPEC.md` — the approved specification

1. **Read PLAN.md** — understand wave structure, task order, dependencies
2. **Read RESEARCH.md** — incorporate HIGH-confidence findings into implementation
3. **Verify worktree baseline** — run tests to confirm clean starting point
4. **Confirm execution mode** — use the mode chosen in Phase 3.4

#### 4.2 Wave Execution Loop

For each wave (W1, W2, ..., Wn):

**4.2.1 Before Wave Starts**
- If Wave N > 1: Verify previous wave's inter-wave tests pass
- Announce wave start: "Starting Wave N with X tasks"
- **Update STATE.md**: Mark wave as 🚧 IN_PROGRESS

**4.2.2 Task Execution** (one task at a time)

For each task in the wave:

**a) Read Task**
Read the task definition from PLAN.md:
- Files to create/modify/test
- Verification command
- TDD steps (write test → run fail → implement → run pass → commit)
- Status handling guidance

**b) Dispatch Implementer** (Subagent-Driven mode)

Dispatch an **implementer** subagent with:
- Task definition
- SPEC.md (for compliance reference)
- RESEARCH.md (for implementation guidance)
- CLAUDE.md conventions

The implementer executes the TDD cycle and returns a status:
- **DONE** → proceed to review
- **DONE_WITH_CONCERNS** → read concerns, address if needed
- **NEEDS_CONTEXT** → provide context, re-dispatch
- **BLOCKED** → assess: break into smaller tasks or escalate

**OR**

**b) Execute Inline** (Inline/Hybrid mode)

Implement the task directly following the TDD cycle:
- [ ] Write failing test
- [ ] Run test to verify it fails
- [ ] Write minimal implementation
- [ ] Run test to verify it passes
- [ ] Commit

**c) Two-Stage Review Per Task** (REQUIRED for both modes)

**Stage 1: Spec Compliance Review**
- Dispatch `spec-reviewer` agent (same invocation as Phase 2.2)
- Input: `spec_path` (path to SPEC.md), `context_path` (path to CONTEXT.md)
- Check: does implementation match every SPEC.md requirement?
- If fails → fix implementation, re-review until passing

**Stage 2: Code Quality Review**
- Dispatch `code-reviewer` agent
- Check: tests pass, lint passes, no secrets, no `any` abuse
- If fails → fix issues, re-review until passing

**CRITICAL: Never start code quality review before spec compliance is approved.**

**d) Verification Before Completion (Iron Law)**
- Run the task's verification command independently
- Confirm output shows passing state
- Do NOT trust agent/conversation claims — verify directly

**Update STATE.md**: Mark task as ✅ DONE, note completion timestamp.

**4.2.3 Between Tasks**
- Run inter-task verification (quick test + lint)
- If verification fails, fix before proceeding to next task

**4.2.4 After Wave Completes**
- Run full wave verification (tests + lint)
- If any verification fails, fix before starting next wave
- **Update STATE.md**: Mark wave as ✅ DONE, update wave completion timestamp.

**PHASE GATE — Complete all items before starting the audit:**
- [ ] Read `/planning/<feature-name>/PLAN.md` completely
- [ ] STATE.md exists and Phase 4 is marked DONE
- [ ] All waves completed and verified (tests pass, lint passes)
- [ ] Listed all completed tasks from PLAN.md: [list W1-Tx, W2-Tx, etc.]
- [ ] Cited the finishing branch verification results: [cite npm test / tsc --noEmit output]
**You must read PLAN.md and confirm all waves complete. Do NOT start audit if tasks are still in progress.**

### Phase 5: Audit & Retrospective Gate

Phase 5 runs AFTER Phase 4 execution completes but BEFORE shipping. It is the quality gate that confirms the implementation is ready.

#### 5.1 Pre-Audit Setup

**Inputs:**
- `PLAN.md` — approved plan with wave structure
- `SPEC.md` — approved specification
- Implementation — completed codebase

1. Read PLAN.md — understand what was promised vs what was delivered
2. Read SPEC.md — refresh on acceptance criteria
3. List all commits since baseline — understand what changed

#### 5.2 TDD Discipline Audit

**Check:** Were tests written BEFORE implementation (RED), passing after minimal code (GREEN), then refactored?

- [ ] For each task, verify test file was created before implementation file (check git log order)
- [ ] If code was written before tests → flag as **CRITICAL** (process violation)
- [ ] Verify each commit is atomic (one logical change per commit)
- [ ] If commits are not atomic → flag as **ADVISORY**

**Severity:**
- **CRITICAL** — code written before tests blocks Phase 6
- **ADVISORY** — noted, does not block

#### 5.3 Plan Compliance Check

**Check:** Does implementation match what PLAN.md promised?

- [ ] Every wave completed as specified?
- [ ] Every task done, or documented deviation?
- [ ] Files created/modified match task definitions?
- [ ] Verification commands executed per task?

**Severity:**
- **CRITICAL** — missing task or unverified implementation blocks Phase 6
- **ADVISORY** — minor deviation, documented and justified

#### 5.4 Deliverables Verification Walkthrough (GSD-Style)

For each acceptance criterion in SPEC.md:
- Walk through yes/no — can the deliverable be demonstrated?
- If no → **Auto-Spawn Debug Agent** (see procedure below)
- Create `UAT.md` (User Acceptance Testing document) with results

**Debug Agent Auto-Spawn Procedure** (when a deliverable fails UAT):

1. **Spawn `debug-expert` agent** with:
   - The specific acceptance criterion that failed
   - Command output showing the failure
   - SPEC.md and the implementation files
   - The relevant task definition from PLAN.md

2. **Debug agent produces a fix plan** written to:
   ```
   /planning/<feature-name>/fix-plans/<task-name>.md
   ```

3. **Present fix plan to user** via `AskUserQuestion`:
   ```
   UAT revealed an issue: [deliverable description]

   Debug agent analysis: [1-sentence root cause]
   Fix plan created at: fix-plans/<task-name>.md

   Options:
   1. **Execute fix plan** — Dispatch fix agent with the generated plan
   2. **Modify approach** — Provide different guidance and re-diagnose
   3. **Skip deliverable** — Document as KNOWN ISSUE and continue
   ```

4. **If user selects option 1** → Re-enter Phase 4.2 for that task only, then re-run Phase 5.4 for the affected deliverable.
   - **Max 3 fix attempts per deliverable** — if the same deliverable fails UAT 3 times, escalate to human with a summary of all attempts.

5. **Update STATE.md**: Record the issue in Open Issues, the fix plan path, and user decision.

**Format for UAT.md:**
```markdown
# UAT: [Feature Name]

## Deliverable 1: [Description]
- Status: PASS / FAIL / BLOCKED
- Evidence: [command output or screenshot]
- Notes: [if FAIL, root cause and fix plan reference]

## Deliverable 2: ...
```

#### 5.5 Issue Triage

Collect all issues found in 5.2, 5.3, 5.4:

| Issue | Severity | Status |
|-------|----------|--------|
| Code before test | CRITICAL | Must fix |
| Missing task | CRITICAL | Must fix |
| Unverified deliverable | CRITICAL | Must fix |
| Non-atomic commit | ADVISORY | Noted |
| Minor deviation | ADVISORY | Noted |

**Rule:** Any CRITICAL issue blocks Phase 6. Return to Phase 4 to fix before proceeding.

#### 5.6 Finishing Branch (Required Step — Integrated Here)

After audit passes (no critical issues remaining):

**a) Verify Clean Baseline**
```bash
npm test  # All tests pass
npm run lint  # No lint errors
npx tsc --noEmit  # No type errors
```

**b) Present Options to User** via `AskUserQuestion`:
```
Implementation complete. All waves finished and verified.

Options:
1. **Create PR (recommended)** — Push branch and create pull request
2. **Continue on branch** — Keep working without PR yet
3. **Abandon branch** — Discard worktree
```

**c) Execute Selected Option**

If Create PR:
- Push to remote
- Create PR with forge PR template
- Report PR URL

If Abandon branch:
- Remove the worktree: `git worktree remove .worktrees/<feature-name>`
- Report: "Worktree removed. Branch abandoned."

#### 5.7 Output
- `UAT.md` — User Acceptance Testing document
- Audit result: PASS / CONDITIONAL PASS / FAIL
- PR URL (if created)
- Any advisory notes for retrospective

**Update STATE.md**: Mark Phase 5 (Audit) as ✅ DONE with completion date and PR URL (if created).

### Phase 6: Monitor (`forge-monitor-pr`)

Phase 6 runs AFTER Phase 5 Finishing Branch creates the PR.

1. Poll CI status using `gh pr checks`
2. Fix CI failures (max 2 rounds)
3. Respond to review comments

## Cross-Cutting Rules

- **Context hydration**: At every phase, re-read relevant files before doing work.
- **Fresh context on retry**: If retrying after failure, approach the problem fresh.
- **Never merge**: Only create the PR.
- **Report the PR URL** when complete.
- **Planning folder**: All feature artifacts go in `/planning/<feature-name>/` (see [feature-naming-conventions.md](../../.claude/feature-naming-conventions.md))
- **Parallel agents**: Issue and Codebase investigators run simultaneously in Phase 1
- **Checklist requirement**: CONTEXT.md MUST have checkbox syntax for all requirements
- **STATE.md**: Cross-session state tracking file maintained throughout the workflow (see format below)

### STATE.md Format

```markdown
# [Feature] Implementation State

## Phase Status
| Phase | Status | Completed |
|-------|--------|----------|
| Phase 1: Discuss | ✅ DONE | 2026-03-20 |
| Phase 2: Spec | 🚧 IN_PROGRESS | — |
| Phase 3: Plan | ⏳ PENDING | — |
| Phase 4: Execute | ⏳ PENDING | — |
| Phase 5: Audit | ⏳ PENDING | — |
| Phase 6: Monitor | ⏳ PENDING | — |

## Wave Progress
| Wave | Tasks | Status |
|------|-------|--------|
| W1 | 3 tasks | ⏳ PENDING |
| W2 | 2 tasks | ⏳ PENDING |

## Task Status
| Task | Status | Notes |
|------|--------|-------|
| W1-T1 | ✅ DONE | — |
| W1-T2 | 🚧 IN_PROGRESS | — |
| W1-T3 | ⏳ PENDING | — |

## Open Issues
- [Any blocking issues logged here]

## Decisions Log
- [Key decisions made during discuss/spec phases]
```

