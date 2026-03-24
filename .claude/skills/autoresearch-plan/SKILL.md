---
name: autoresearch-plan
description: Interactive wizard that converts a plain-language goal into a validated autoresearch configuration (Scope, Metric, Direction, Verify). Use when setting up an autoresearch run or when the user needs help defining a measurable metric.
---

# Autoresearch Plan — Goal -> Configuration Wizard

This is the planning wizard for the [autoresearch](../autoresearch/SKILL.md) skill. It converts a plain-language goal into a validated, ready-to-execute autoresearch configuration.

Load the full protocol from `../autoresearch/references/plan-workflow.md` and follow it step by step.

## Quick Summary

1. **Capture Goal** — ask what the user wants to improve (or accept inline text)
2. **Analyze Context** — scan codebase for tooling, test runners, build scripts. Use `forge_project_info` MCP tool if available.
3. **Define Scope** — suggest file globs, validate they resolve to real files
4. **Define Metric** — suggest mechanical metrics, validate they output a number
5. **Define Guard (optional)** — regression prevention command
6. **Define Direction** — higher or lower is better
7. **Define & Validate Verify Command** — construct the shell command, **dry-run it**, confirm it works
8. **Confirm & Launch** — present the complete config, offer to launch immediately

## Critical Gates

- Metric MUST be mechanical (outputs a parseable number, not subjective)
- Verify command MUST pass a dry run on the current codebase before accepting
- Scope MUST resolve to >=1 file

## Forge Observability

At start: `forge_run_start(skill_name: "autoresearch", phase: "plan")`
At end: `forge_run_end(run_id: "<from start>", outcome: "success"|"failure", summary: "config validated")`

## Output

A ready-to-paste `/autoresearch` invocation:

```
/autoresearch
Goal: {goal}
Scope: {scope}
Metric: {metric} ({direction})
Verify: {verify_command}
Guard: {guard_command}
```
