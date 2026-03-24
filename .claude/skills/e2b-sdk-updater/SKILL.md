---
name: e2b-sdk-updater
description: Use when checking E2B SDK updates or migrating E2B API changes. Monitors e2b and @e2b/code-interpreter packages, compares SDK API against project usage in src/e2b-template/template.ts, src/e2b-template/build.dev.ts, src/e2b-template/build.prod.ts, src/sandbox/code-interpreter.ts, and src/sandbox/e2b-manager.ts. Detects new SandboxBackend implementations in src/sandbox/ (classes implementing SandboxBackend interface), checks if SandboxBackendType union should be extended, and prompts to add new backends to the factory. Runs npm outdated and npm audit, verifies with build + tsc --noEmit. Updates consuming files if breaking API changes are found. Reports "All E2B packages up to date" when current. Do NOT use for general npm audits (use npm-dependency-health) or adding E2B features (use implement-feature).
generated: true
generated-by: skill-generator
generated-at: 2026-03-22T00:00:00.000Z
generated-status: unverified
research-sources: []
---

# E2B SDK Updater

Check for E2B SDK updates, detect API breaking changes, monitor sandbox backend implementations, and update consuming files.

**Input:** None (analyzes project automatically)

## When to Activate

- User says "check E2B SDK updates", "E2B SDK outdated", "update E2B packages"
- User says "E2B API changes", "E2B migration", "E2B breaking changes"
- User says "why is E2B broken", "E2B sandbox not working", "E2B type errors"
- User references src/e2b-template/template.ts, src/e2b-template/build.dev.ts, src/e2b-template/build.prod.ts, src/sandbox/code-interpreter.ts, or src/sandbox/e2b-manager.ts in context of API changes
- User says "check sandbox backends", "new sandbox backend", "add sandbox backend", "monitor backends"
- User references src/sandbox/sandbox-backend.ts or src/sandbox/ in context of backend additions

## Step 0: Monitor Sandbox Backend Implementations

Before checking SDK versions, scan for new sandbox backend implementations.

### Scan for SandboxBackend Implementations

Search `src/sandbox/` for files containing:
- Classes that `implements SandboxBackend`
- Classes that `extends` a backend base class
- Exports of classes with backend-related names (e.g., `*Sandbox`, `*Backend`)

```bash
grep -r "implements SandboxBackend\|extends.*Sandbox\|export class.*Sandbox\|export class.*Backend" src/sandbox/ --include="*.ts"
```

### Current Backend Registry

| Backend Type | Class | File | Package |
|-------------|-------|------|---------|
| `e2b` | `E2BSandbox` | `src/sandbox/e2b-manager.ts` | `e2b` |
| `code-interpreter` | `CodeInterpreterBackend` | `src/sandbox/code-interpreter.ts` | `@e2b/code-interpreter` |

**Note:** `SandboxBackendType` union type is defined in `src/sandbox/sandbox-backend.ts` (not in `e2b-manager.ts`).

### Check SandboxBackendType Union

Read `src/sandbox/sandbox-backend.ts` and verify the `SandboxBackendType` union matches the discovered backends:

```typescript
export type SandboxBackendType = 'e2b' | 'code-interpreter';
```

### Detect New Backends

If a new class implementing `SandboxBackend` is found:
1. Identify the new backend's type string (e.g., `docker`, `local`, `mock`)
2. Check if it's missing from `SandboxBackendType`
3. Check if it's missing from `createSandboxBackend()` factory function
4. Prompt user: "New sandbox backend detected: `{ClassName}` in `{file}`. Add `{type}` to SandboxBackendType and factory?"

If user confirms, proceed to add the backend to the factory.

### Adding a New Backend to Factory

If user confirms adding a new backend:

1. Add the type string to `SandboxBackendType` union in `src/sandbox/sandbox-backend.ts`
2. Add a new branch in `createSandboxBackend()`:

```typescript
if (backend === '{newType}') {
  const { {ClassName} } = await import('./{filename}.js');
  const sandbox = new {ClassName}(opts?.templateId, opts?.env);
  await sandbox.create();
  return sandbox;
}
```

3. Re-verify with build

## Step 1: Check Current Package Versions

Read `package.json` and extract:
- `e2b` version (currently ^2.14.1)
- `@e2b/code-interpreter` version (currently ^2.3.3)

## Step 2: Run npm outdated for E2B Packages

```bash
npm outdated e2b @e2b/code-interpreter --json 2>/dev/null
```

Parse output to determine:
- Current installed version
- Wanted version (semver range max)
- Latest published version

If both packages are at latest, proceed to Step 4.

## Step 3: Check for API Breaking Changes

If updates are available, fetch the E2B SDK changelog and compare API signatures:

**Current API usage to verify:**

### `e2b` package — Template API (src/e2b-template/)
```typescript
// template.ts — fluent builder
Template()
  .fromUbuntuImage('22.04')
  .setEnvs({ ... })
  .setStartCmd(cmd, args)

// build.dev.ts / build.prod.ts
Template.build(forgeTemplate, 'name', { onBuildLogs: defaultBuildLogger({ minLevel: 'info' }) })
Template.build(forgeTemplate, 'name')
```

### `e2b` package — Sandbox API (src/sandbox/e2b-manager.ts)
```typescript
// Factory creates sandbox instance; uses createSandboxBackend() internally
const sandbox = await createSandboxBackend('e2b', { templateId, envs })
sandbox.getId()  // Returns the sandbox ID
await sandbox.commands.run(command, { timeoutMs })
await sandbox.files.read(path, { format: 'text' })
await sandbox.files.write(path, content)
await sandbox.kill()
```

### `@e2b/code-interpreter` package (src/sandbox/code-interpreter.ts)
```typescript
// Factory creates sandbox instance; uses createSandboxBackend() internally
const sandbox = await createSandboxBackend('code-interpreter', { templateId, envs })
sandbox.getId()  // Returns the sandbox ID
await sandbox.commands.run(command, { timeoutMs })
await sandbox.runCode(code, { language: 'python' | 'javascript' })
await sandbox.files.read(path, { format: 'text' })
await sandbox.files.write(path, content)
await sandbox.kill()
```

Research the new SDK version's API differences:
- Check npm changelog: `npm info e2b changelog`
- Check `@e2b/code-interpreter` changelog
- Look for renamed methods, changed option shapes, removed properties

## Step 4: Security Audit

```bash
npm audit --json 2>/dev/null | grep -A5 '"production":true' | head -50
```

Focus on E2B package vulnerabilities specifically.

## Step 5: Build Verification

Run to catch any type errors from SDK updates:
```bash
npm run build && npx tsc --noEmit
```

If build fails with E2B SDK errors, those indicate breaking API changes requiring fixes.

## Step 6: Fix Breaking Changes

If breaking API changes are detected:

1. Read the migration guide or changelog for the new version
2. Update `src/e2b-template/template.ts` — Template builder API
3. Update `src/e2b-template/build.dev.ts` — Template.build() options
4. Update `src/e2b-template/build.prod.ts` — Template.build() options
5. Update `src/sandbox/e2b-manager.ts` — E2BSandbox SDK calls
6. Update `src/sandbox/code-interpreter.ts` — CodeInterpreterSandbox SDK calls
7. Re-run build verification

## Step 7: Report

If updates available and applied:
```
## E2B SDK Update Report

**e2b:** {old_version} -> {new_version}
**@e2b/code-interpreter:** {old_version} -> {new_version}

### Breaking Changes
- {description of changes and fixes applied}

### Verification
- Build: PASSED
- Type-check: PASSED
```

If no updates needed:
```
All E2B packages up to date

- e2b: {current_version} (latest)
- @e2b/code-interpreter: {current_version} (latest)

Security audit: {npm audit summary}
```

## Key Files Monitored

| File | API Surface |
|------|-------------|
| src/e2b-template/template.ts | Template() fluent builder: .fromUbuntuImage(), .setEnvs(), .setStartCmd() |
| src/e2b-template/build.dev.ts | Template.build() with onBuildLogs option |
| src/e2b-template/build.prod.ts | Template.build() signature |
| src/sandbox/sandbox-backend.ts | SandboxBackend interface, SandboxBackendType union, createSandboxBackend() factory |
| src/sandbox/e2b-manager.ts | E2BSandbox wrapper class with getId(), commands.run(), files.read/write, kill() |
| src/sandbox/code-interpreter.ts | CodeInterpreterBackend.create(), .runCode(), .commands.run(), .files.read/write, .kill() |
| package.json | e2b and @e2b/code-interpreter version pins |

## Rules

- If no updates available, report "All E2B packages up to date" and skip file modifications
- If updates exist but no breaking API changes, apply npm update
- If breaking API changes exist, update consuming files to match new API
- Always verify with build + type-check after any change
- If build fails after applying updates, revert and report the specific breakage
- When a new SandboxBackend implementation is found, always prompt before modifying SandboxBackendType or factory
- Only add a backend to the factory if the user explicitly confirms
