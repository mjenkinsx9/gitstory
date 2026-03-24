---
name: forge-create-agent
description: >-
  Use when creating a new Claude Code agent definition file. Contains the
  specific agent frontmatter format (name, description, tools fields in YAML),
  the agent-vs-skill decision guide, the file template for
  .claude/agents/<name>.md, the minimal tool selection rules
  (Read/Grep/Glob/Bash for read-only, add Write/Edit for modification, add
  WebFetch for research), and the validation checklist. Do NOT use for creating
  skills, creating MCP tools, or modifying existing agents.
generated-status: failed
verified-at: '2026-03-17T02:26:55.636Z'
verification-score: 86
---

# Forge: Create Agent

This skill helps you create new agent definitions for the Forge platform. Agents run in isolated parallel contexts for tasks that should not pollute the main conversation.

## When to Use an Agent vs a Skill

**Use an agent when:**
- The task produces a large amount of intermediate output (code review, security scan)
- The task can run in parallel with other work
- The task needs isolated context (won't confuse the main conversation)
- The output is a structured report or artifact

**Use a skill when:**
- You want to change HOW Claude approaches a problem (persona, methodology)
- The instructions apply to the main conversation directly
- There is no need for isolation or parallelism

If the user's request is better served by a skill, guide them to use `forge-create-skill` patterns instead.

## Agent Definition Format

```markdown
---
name: agent-name-in-kebab-case
description: When to use this agent (action-oriented, one line)
tools: [Tool1, Tool2, ...]
---

# Agent Name

[Full agent instructions]
```

## Creation Process

### Step 1: Understand the Need

Ask the user:
1. What task should this agent perform?
2. Should it run in parallel with other work?
3. What does the output look like?
4. What files/data does it need access to?

### Step 2: Design the Agent

1. **Name**: Use kebab-case. Should describe the role, not the task (e.g., `code-reviewer` not `review-this-pr`)
2. **Description**: Action-oriented, starts with "Use when..." — this helps Claude decide when to invoke the agent
3. **Tools**: Select the MINIMAL set needed:
   - **Read-only analysis**: `Read, Grep, Glob, Bash`
   - **Code modification**: `Read, Write, Edit, Grep, Glob, Bash`
   - **Research**: Add `WebFetch` or `WebSearch` only if external data is needed
   - Do NOT include tools the agent will not use
4. **Instructions**: Structure as:
   - Trigger conditions (when to invoke)
   - Step-by-step process
   - Output format (structured, consistent)
   - Guidelines and constraints

### Step 3: Write the Agent File

Create the file at `.claude/agents/<agent-name>.md` following this template:

```markdown
---
name: <kebab-case-name>
description: Use when <trigger condition>
tools: [<minimal tool list>]
---

# <Agent Name>

You are a <role description>. You <primary function> in an isolated context.

## Trigger

Invoke this agent when:
- <condition 1>
- <condition 2>

## Process

### Step 1: <First Phase>
1. <action>
2. <action>

### Step 2: <Second Phase>
1. <action>
2. <action>

## Output Format

\```
## <Report Title>

**Summary**: [one line]

### Findings
- [finding 1]
- [finding 2]
\```

## Guidelines

- <constraint 1>
- <constraint 2>
```

### Step 4: Validate

Check the agent definition against these criteria:
- [ ] Name is kebab-case and descriptive
- [ ] Description clearly states when to invoke
- [ ] Tool list is minimal (no unused tools)
- [ ] Instructions are actionable step-by-step
- [ ] Output format is structured and parseable
- [ ] Guidelines include failure/edge cases
- [ ] No overlap with existing agents

## Existing Agents (avoid duplication)

Before creating, check `.claude/agents/` for existing agents that might already cover the need:
- `code-reviewer` — code review and diff analysis
- `qa-engineer` — test writing and coverage
- `security-auditor` — vulnerability scanning
- `pr-monitor` — CI monitoring and PR management

## Best Practices

- Agents should be stateless — they receive context, do work, produce output
- Keep scope narrow: one agent, one job
- Include max iteration limits for agents that might loop (e.g., "max 2 fix rounds")
- Define clear output format so the main conversation can parse results
- Agents should never modify files outside their stated scope
