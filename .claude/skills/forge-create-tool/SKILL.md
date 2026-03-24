---
name: forge-create-tool
description: >-
  Use when creating a new MCP tool for the Forge Toolshed server specifically. Contains the exact TypeScript template for src/mcp-server/tools/<name>.ts (Zod input schema, execute method returning JSON with success/error/suggestion), the matching vitest test template, the server registration pattern (ListToolsRequestSchema + CallToolRequestSchema handlers in src/mcp-server/index.ts), and the MCP client config snippet. Do NOT use for building standalone MCP servers (use mcp-builder) or creating agents/skills.
---

# Forge: Create Tool

This skill helps you create new MCP tool implementations for the Forge Toolshed server. Each tool becomes available as an MCP tool that Claude Code (or any MCP client) can invoke.

## MCP Tool Anatomy

Every Forge MCP tool consists of three parts:
1. **Tool implementation** — TypeScript file in `src/mcp-server/tools/`
2. **Test file** — Matching test in `src/mcp-server/tools/` or `__tests__/`
3. **Server registration** — Tool registered in the MCP server entry point

## Creation Process

### Step 1: Define the Tool

Gather from the user:
1. **Name**: What the tool does (kebab-case, e.g., `run-tests`, `check-deps`)
2. **Description**: How an agent should decide to use this tool (clear, concise)
3. **Category**: `version-control`, `ci-cd`, `database`, `communication`, `monitoring`, `ai-agent`
4. **Parameters**: Input schema (what the tool needs)
5. **Returns**: Output schema (what the tool provides back to the agent)

### Step 2: Generate the Tool Implementation

Create `src/mcp-server/tools/<tool-name>.ts`:

```typescript
import { z } from 'zod';

// Input schema
const <ToolName>InputSchema = z.object({
  // Define parameters with descriptions
  param1: z.string().describe('Description of param1'),
  param2: z.number().optional().describe('Optional param with default behavior'),
});

type <ToolName>Input = z.infer<typeof <ToolName>InputSchema>;

// Tool metadata
export const <toolName>Tool = {
  name: '<tool-name>',
  description: '<Clear description of what this tool does and when to use it>',
  inputSchema: <ToolName>InputSchema,

  async execute(input: <ToolName>Input): Promise<string> {
    // Validate input
    const parsed = <ToolName>InputSchema.parse(input);

    // Implementation
    try {
      // Do the work
      const result = await doWork(parsed);

      // Return rich, structured context
      return JSON.stringify({
        success: true,
        data: result,
        summary: '<human-readable summary>',
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        suggestion: '<what the agent should try next>',
      });
    }
  },
};
```

### Step 3: Generate Tests

Create `src/mcp-server/tools/<tool-name>.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { <toolName>Tool } from './<tool-name>';

describe('<tool-name> tool', () => {
  describe('execute', () => {
    it('should succeed with valid input', async () => {
      const result = await <toolName>Tool.execute({
        param1: 'test-value',
      });
      const parsed = JSON.parse(result);
      expect(parsed.success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const result = await <toolName>Tool.execute({
        param1: 'invalid-value',
      });
      const parsed = JSON.parse(result);
      expect(parsed.success).toBe(false);
      expect(parsed.error).toBeDefined();
      expect(parsed.suggestion).toBeDefined();
    });

    it('should validate input schema', () => {
      expect(() => <toolName>Tool.inputSchema.parse({})).toThrow();
    });
  });
});
```

### Step 4: Register in MCP Server

Add the tool to `src/mcp-server/index.ts`:

```typescript
import { <toolName>Tool } from './tools/<tool-name>';

// In the tool registration section:
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ... existing tools
    {
      name: <toolName>Tool.name,
      description: <toolName>Tool.description,
      inputSchema: zodToJsonSchema(<toolName>Tool.inputSchema),
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    // ... existing cases
    case <toolName>Tool.name:
      return { content: [{ type: 'text', text: await <toolName>Tool.execute(request.params.arguments) }] };
  }
});
```

### Step 5: Config Snippet

Provide MCP client config for using the tool:

```json
{
  "mcpServers": {
    "forge-toolshed": {
      "command": "node",
      "args": ["dist/mcp-server/index.js"],
      "env": {}
    }
  }
}
```

## Tool Design Principles

Following Anthropic's MCP tool best practices:

1. **Clear descriptions** — The description is how the agent decides whether to use the tool. Be specific about when to use it and when NOT to
2. **Rich return values** — Return structured data with context, not just raw output. Include summaries, suggestions, and next steps
3. **Graceful errors** — Never throw unhandled errors. Return error objects with actionable suggestions
4. **Minimal parameters** — Only require what is necessary. Use sensible defaults for optional params
5. **Token efficiency** — Return what the agent needs, not everything available. Summarize large outputs
6. **Idempotent when possible** — Running the tool twice with the same input should be safe
7. **Schema validation** — Use Zod schemas for input validation with descriptive error messages

## Categories Reference

| Category | Examples | Notes |
|----------|----------|-------|
| `version-control` | git operations, file changes | Often wraps git CLI |
| `ci-cd` | build, test, lint, deploy | Wraps npm scripts or CI APIs |
| `database` | queries, migrations, schema | Needs connection config |
| `communication` | slack, email, notifications | Needs API tokens |
| `monitoring` | logs, errors, metrics | Reads observability data |
| `ai-agent` | search, scrape, summarize | Meta-tools for agents |

## Checklist

Before finalizing the tool:
- [ ] Name is kebab-case and describes the action
- [ ] Description clearly states when an agent should use this tool
- [ ] Input schema has descriptive parameter descriptions
- [ ] Error handling returns suggestions, not just error messages
- [ ] Tests cover happy path, error cases, and input validation
- [ ] Tool is registered in the MCP server
- [ ] No secrets or credentials are hardcoded
