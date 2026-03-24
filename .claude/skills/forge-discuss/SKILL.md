---
name: forge-discuss
description: >-
  Use when starting a new feature or issue BEFORE any implementation — this is
  always the FIRST step in the forge workflow. Contains the specific procedure
  for asking structured clarifying questions (functional requirements, UI/UX,
  API specs, edge cases, technical constraints), recording decisions, and
  producing a CONTEXT.md artifact. Do NOT use for planning, coding, or reviewing
  — those are separate phases.
generated-status: failed
verified-at: '2026-03-17T02:17:02.816Z'
verification-score: 83
---

# Forge Discuss Phase

You are running the **discuss phase** of a spec-driven workflow. Your goal is to deeply understand the problem before any code is written, and produce a CONTEXT.md file that captures all decisions.

## Step 1: Context Hydration

Before asking any questions, gather context deterministically:

1. Read `CLAUDE.md` in the project root (if it exists) to understand project conventions.
2. Read any existing `CONTEXT.md`, `SPEC.md`, or `PLAN.md` to avoid re-asking settled questions.
3. If an issue number was provided, fetch the issue details using `gh issue view <number>`.
4. Scan related files and directories mentioned in the issue or request to understand current state.
5. Check recent git history (`git log --oneline -20`) for relevant recent changes.

## Step 2: Ask Clarifying Questions

Ask the user clarifying questions to fill gaps in understanding. Do NOT ask a fixed number — ask as many as needed until you have clarity on all of the following areas (skip areas that are already clear from context):

**Functional requirements:**
- What exactly should this do? What is the expected behavior?
- What are the inputs and outputs?
- What user-facing changes are involved?

**Visual / UI features** (if applicable):
- What layout should this use? (sidebar, full-width, cards, modal)
- What interactions are needed? (hover, click, drag, keyboard shortcuts)
- What empty states, loading states, and error states should be handled?

**API specifications** (if applicable):
- What endpoints are involved? What are the request/response shapes?
- What error codes need handling?
- Authentication, pagination, rate limiting requirements?

**Edge cases:**
- What happens when the API fails or returns unexpected data?
- What happens with empty, null, or very large inputs?
- Network offline handling? Concurrent edit conflicts?
- Permissions and authorization edge cases?

**Technical constraints:**
- Are there performance requirements?
- Backward compatibility concerns?
- Dependencies on other systems or features?

After each round of answers, evaluate whether you have enough information. If not, ask follow-up questions. Continue until all critical areas are covered.

## Step 3: Record Decisions

For every question asked, record the decision. Also capture any implicit decisions made during the conversation.

## Step 4: Write CONTEXT.md

Create `CONTEXT.md` in the project root with this structure:

```markdown
# Context: [Feature/Issue Name]

**Created:** [ISO timestamp]
**Issue:** [#number if applicable]

## Summary

[1-2 sentence summary of what we're building and why]

## Decisions

- **[Decision area]:** [What was decided and why]
- ...

## Requirements

- [Concrete requirement with acceptance criteria]
- ...

## Visual Features

- [UI element or interaction, if applicable]
- ...

## API Specifications

- [Endpoint, method, request/response shape, if applicable]
- ...

## Edge Cases

- [Edge case and how it should be handled]
- ...

## Out of Scope

- [Explicitly excluded items]
- ...

## Open Questions

- [Any remaining unknowns that need resolution during implementation]
- ...
```

## Rules

- NEVER skip the context hydration step. Always read existing project files first.
- NEVER assume answers — ask the user.
- NEVER proceed to implementation. This phase produces CONTEXT.md only.
- If the user says "just do it" or wants to skip discussion, produce a minimal CONTEXT.md with your best interpretation and flag assumptions clearly.
