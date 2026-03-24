---
name: forge-docs-reference
description: >
  Local Anthropic documentation for Claude Code CLI, hooks, skills, plugins, MCP servers. Use for Claude API messages endpoint, tool schemas, structured outputs, streaming, prompt caching, Agent SDK, model pricing. Reference these docs for Anthropic-specific questions.
---

# Forge Documentation Reference

You have access to **two local documentation collections** scraped from official Anthropic docs. Use these as your primary reference when answering questions about Claude Code or the Claude API/Platform.

## Collections

| Collection | Path | Files | Covers |
|------------|------|-------|--------|
| Claude Code | `/home/mjenkins/github/forge/docs/claude_code_docs/` | 65 | CLI, IDE, terminal, hooks, skills, plugins, MCP config, permissions, sandboxing, agent teams, deployment |
| Claude Platform | `/home/mjenkins/github/forge/docs/claude_platform_developer_docs/` | 209 | API, SDKs, tool use, Agent SDK, models, pricing, prompt engineering, vision, streaming, structured outputs, evaluation |

Each collection has an `INDEX.md` manifest and a `docs/` folder of markdown files.

## Step 1: Route to the Right Collection

Route to the collection that best matches the query:

- **Claude Code topics** (CLI commands, IDE extensions, hooks, skills, plugins, permissions, CLAUDE.md, slash commands, terminal usage, checkpointing, memory, agent teams, deployment to CI/CD): → `claude_code_docs/`
- **Claude API/Platform topics** (API endpoints, SDKs, tool use schemas, Agent SDK, models, pricing, prompt engineering, vision, files API, structured outputs, streaming, prompt caching, batch API, evaluation): → `claude_platform_developer_docs/`

**Fallback strategy:** If the best-match collection doesn't have what you need, try the other collection before giving up. If still unclear, ask the user which area they mean. The user may also tell you directly where to look — respect that.

## Step 2: Search Strategy

Use **progressive disclosure** — start broad, narrow down.

### 2a. INDEX Scan (always start here)

Read the relevant `INDEX.md`:
- `/home/mjenkins/github/forge/docs/claude_code_docs/INDEX.md`
- `/home/mjenkins/github/forge/docs/claude_platform_developer_docs/INDEX.md`

Scan category headings and file descriptions to identify **1-3 candidate files**. The INDEX lists every file with a one-line summary — this is usually enough to find the right doc.

### 2b. Targeted Grep (if INDEX scan is insufficient)

For specific queries where the INDEX description doesn't pinpoint the file:

**Search by frontmatter topics:**
```
Grep pattern="topics:.*<keyword>" path="/home/mjenkins/github/forge/docs/<collection>/docs/"
```

**Search by content:**
```
Grep pattern="<specific term>" path="/home/mjenkins/github/forge/docs/<collection>/docs/" output_mode="files_with_matches"
```

The `topics` array in each file's YAML frontmatter contains keywords, command names, and feature names — it's an excellent search target.

### 2c. Read & Extract

Read the **1-3 most relevant files** identified above. Extract the answer from the document content.

## Step 3: Present Results

Always include source attribution:

```
**Source:** [title from frontmatter]
**Section:** [section from frontmatter]
**URL:** [url from frontmatter]
**File:** [relative path from /home/mjenkins/github/forge/]

[Synthesized answer from the document content]
```

If multiple files contribute to the answer, cite each one.

## Use Cases

This skill handles both **factual lookups** and **guidance/how-to** questions:

- **Factual:** "What parameters does the tool use input schema accept?" → Find the exact schema definition in the docs
- **Guidance:** "How should I structure an MCP server?" → Find best practices, patterns, and architectural guidance from the docs
- **Mixed:** "What's the right way to set up hooks and what options are available?" → Combine reference details with recommended patterns

For guidance questions, synthesize advice from the docs rather than just quoting — but always cite which doc(s) informed your answer.

## Rules

1. **Never fabricate** — only report what is actually in the doc files. If the docs don't cover a topic, say so.
2. **File budget** — for specific queries, read 1-3 targeted files. For broad or survey-type queries (e.g., "what are my options?"), read as many files as needed to give comprehensive coverage.
3. **Prefer specificity** — when multiple files could match, prefer the one whose `section` frontmatter most closely matches the query topic.
4. **Cite sources** — every answer must include the source file and URL so the user can verify against live docs.
5. **Staleness warning** — these docs were scraped at a point in time. If the `scraped_at` date is old, mention that the user may want to check the live URL for updates.
6. **Parallel search** — if the query spans both collections, search both INDEX files in parallel (two Read calls in one message).
7. **User overrides** — if the user tells you where to look or which collection to search, follow their direction.
