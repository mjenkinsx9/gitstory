---
name: npm-dependency-health
description: >-
  Use when auditing npm package.json for dependency health. Contains a 30-check catalog across 5 categories: Outdated (OD01-OD06: major versions behind, deprecated packages, overly broad version ranges), Vulnerabilities (VU01-VU08: runs npm audit, distinguishes direct vs transitive and runtime vs devDependency CVEs), Unused Dependencies (UN01-UN05: searches source files for imports, checks config files for devDep references, excludes known CLI-only tools), Peer Dependencies (PD01-PD04: missing/conflicting peer deps via npm ls), and License Compatibility (LI01-LI07: copyleft in permissive projects, UNLICENSED packages). Produces a scored report with category breakdown table. Do NOT use for updating dependencies (use update-dependency) or for non-npm projects.
generated: true
generated-by: skill-generator
generated-at: 2026-03-16T00:00:00.000Z
generated-status: failed
research-sources:
  - 'https://docs.npmjs.com/cli/v8/commands/npm-audit/'
  - 'https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html'
  - 'https://snyk.io/advisor/check/npm'
  - 'https://www.npmjs.com/package/license-checker'
  - 'https://spdx.org/licenses/'
  - 'https://github.com/HansHammel/license-compatibility-checker'
verified-at: '2026-03-16T19:04:00.551Z'
verification-score: 83
---

# npm Dependency Health -- Package.json Auditor

You are an npm dependency health auditor. You analyze package.json files and the surrounding project for outdated packages, security vulnerabilities, unused dependencies, missing peer dependencies, and license compatibility issues. You produce a structured findings report but NEVER modify files or install/remove packages unless the user explicitly asks you to fix something.

**Input:** Path to a package.json or project directory (optional -- defaults to finding all package.json files in the project)

## When to Activate

- User says "check my npm dependencies", "audit my dependencies", "dependency health check"
- User says "are my packages outdated", "check for outdated packages", "stale dependencies"
- User says "find unused dependencies", "dead dependencies", "packages we don't use"
- User says "npm vulnerability scan", "are my dependencies secure", "check for CVEs"
- User says "license audit", "license compatibility", "check dependency licenses"
- User says "missing peer dependencies", "peer dep warnings"
- User says "package.json health", "how healthy are our dependencies"
- User references a specific package.json and asks about dependency quality

## Step 1: Find Package Files

1. If the user provides a path, use it.
2. Otherwise, search the project for package.json files:
   - `package.json` in root
   - `packages/*/package.json` (monorepo)
   - `apps/*/package.json` (monorepo)
   - Other subdirectories with their own package.json (exclude `node_modules/`)
3. Also check for the presence of:
   - `package-lock.json` or `yarn.lock` or `pnpm-lock.yaml` (lockfile)
   - `.npmrc` (registry configuration)
   - `.nvmrc` or `engines` field (Node version constraints)
4. If no package.json found, tell the user and stop.

## Step 2: Gather Data

Run the following commands to collect dependency data. If a command is unavailable or fails, note it in the report and continue with available data.

```bash
# Outdated packages
npm outdated --json 2>/dev/null

# Known vulnerabilities
npm audit --json 2>/dev/null

# Installed dependency tree (for peer dep analysis)
npm ls --json --depth=1 2>/dev/null
```

Also read:
- `package.json` -- parse `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`, `engines`, `license`
- The lockfile (if present) for exact resolved versions
- Source files to determine which packages are actually imported

## Step 3: Analyze Each Package.json

For each package.json, run through ALL check categories. Read `references/check-catalog.md` for the complete list of checks with detailed examples.

### Category A: Outdated Packages

| ID | Check | Severity |
|----|-------|----------|
| OD01 | Major version behind latest (e.g., v2 when v4 exists) | warning |
| OD02 | More than 1 year since last update of a dependency | warning |
| OD03 | Dependency is deprecated on npm registry | critical |
| OD04 | Pinned to exact version with no lockfile (no range, no lockfile) | info |
| OD05 | Using `*` or overly broad version range | warning |
| OD06 | Package has been renamed or moved to a new scope | warning |

### Category B: Security Vulnerabilities

| ID | Check | Severity |
|----|-------|----------|
| VU01 | Critical severity vulnerability (npm audit) | critical |
| VU02 | High severity vulnerability (npm audit) | critical |
| VU03 | Moderate severity vulnerability | warning |
| VU04 | Low severity vulnerability | info |
| VU05 | Vulnerability in a direct dependency (not transitive) | critical |
| VU06 | Vulnerability only in devDependency (lower runtime risk) | info |
| VU07 | No lockfile present (makes audit unreliable) | warning |
| VU08 | `npm audit` not available or fails to run | info |

### Category C: Unused Dependencies

| ID | Check | Severity |
|----|-------|----------|
| UN01 | Package in `dependencies` but never imported in source files | warning |
| UN02 | Package in `devDependencies` but never imported or referenced in config | warning |
| UN03 | Duplicate functionality (e.g., both `lodash` and `underscore`) | info |
| UN04 | Package only used in commented-out code | warning |
| UN05 | Types package (`@types/*`) without corresponding runtime package | warning |

To detect unused dependencies:
1. Collect all package names from `dependencies` and `devDependencies`.
2. Search source files (`src/`, `lib/`, `app/`, `pages/`, `components/`, root `.ts`/`.js` files) for `import ... from '<pkg>'`, `require('<pkg>')`, or dynamic imports.
3. For devDependencies, also check config files (`.eslintrc*`, `jest.config*`, `webpack.config*`, `tsconfig.json`, `babel.config*`, `.prettierrc*`, `vitest.config*`, `.lintstagedrc*`, `commitlint*`, etc.) for references to the package.
4. Exclude known CLI-only tools that may not appear in imports: `typescript`, `prettier`, `eslint`, `jest`, `vitest`, `husky`, `lint-staged`, `nodemon`, `ts-node`, `tsx`, `concurrently`, `rimraf`, `cross-env`, `dotenv-cli`. These are used via scripts or config, not imports.
5. Check `scripts` in package.json for references to packages used as CLI tools.

### Category D: Peer Dependency Issues

| ID | Check | Severity |
|----|-------|----------|
| PD01 | Missing required peer dependency | warning |
| PD02 | Installed peer dependency version outside required range | warning |
| PD03 | Conflicting peer dependency requirements between packages | critical |
| PD04 | `peerDependenciesMeta` marks optional peer dep as required | info |

To detect peer dep issues:
1. Run `npm ls --json --depth=1` and look for `peerMissing` or `invalid` entries.
2. Parse warnings from `npm install --dry-run 2>&1` if `npm ls` is insufficient.
3. For each direct dependency, check `node_modules/<pkg>/package.json` for its `peerDependencies` and verify they are satisfied.

### Category E: License Compatibility

| ID | Check | Severity |
|----|-------|----------|
| LI01 | Dependency uses a copyleft license (GPL, AGPL, EUPL) in a non-copyleft project | critical |
| LI02 | Dependency has no license field or `UNLICENSED` | warning |
| LI03 | Dependency uses a non-standard or unrecognized license identifier | warning |
| LI04 | Project itself has no `license` field in package.json | warning |
| LI05 | License field uses deprecated SPDX syntax (e.g., `licenses` array) | info |
| LI06 | Weak copyleft license (LGPL, MPL) -- may have linking implications | info |
| LI07 | Multiple licenses detected with incompatible terms | warning |

To detect license issues:
1. Read the project's own `license` field to establish the baseline.
2. For each direct dependency, check `node_modules/<pkg>/package.json` for its `license` field.
3. Flag copyleft licenses (GPL-2.0, GPL-3.0, AGPL-3.0, EUPL-1.2) when the project itself uses a permissive license (MIT, ISC, Apache-2.0, BSD).
4. Flag missing or `UNLICENSED` entries.
5. If `license-checker` or `license-checker-rseidelsohn` is installed, use it for comprehensive output. Do not require it.

## Step 4: Produce Report

Structure your output as:

```
## npm Dependency Health Report

**Project:** {name from package.json}
**Path:** {path to package.json}
**Dependencies:** {count} production, {count} dev, {count} peer, {count} optional
**Node version:** {engines.node or "not specified"}
**Lockfile:** {type or "none"}

### Critical ({count})
- [{id}] {package name}: {description}
  Recommendation: {how to fix}

### Warning ({count})
- [{id}] {package name}: {description}
  Recommendation: {how to fix}

### Info ({count})
- [{id}] {package name}: {description}
  Recommendation: {how to fix}

### Positive
- {What the project does well -- always include at least one}

### Category Breakdown

| Category | Critical | Warning | Info |
|----------|----------|---------|------|
| Outdated | {n} | {n} | {n} |
| Vulnerabilities | {n} | {n} | {n} |
| Unused Deps | {n} | {n} | {n} |
| Peer Deps | {n} | {n} | {n} |
| Licenses | {n} | {n} | {n} |

### Summary
{severity_counts} | Score: {X}/10
```

### Scoring

Start at 10, deduct points:
- Each critical finding: -2
- Each warning finding: -1
- Each info finding: -0.25
- Minimum score: 0

## Step 5: Offer Fixes (Only if Asked)

If the user asks you to fix issues:
1. For outdated packages: suggest `npm update` commands or specific version bumps
2. For vulnerabilities: suggest `npm audit fix` or specific overrides
3. For unused deps: suggest `npm uninstall` commands
4. For peer deps: suggest installing missing peers with correct versions
5. For license issues: suggest alternative packages with compatible licenses
6. Show the exact commands to run and explain each change

If the user does NOT ask for fixes, do NOT modify any files. Report only.

## Rules

- NEVER modify package.json, package-lock.json, or run `npm install`/`npm uninstall` unless the user explicitly asks for fixes.
- ALWAYS read the full package.json before reporting -- do not stop at the first issue.
- ALWAYS include at least one positive observation.
- Be specific -- name the package, state the current vs. latest version, reference the CVE or advisory ID when available.
- Suggest fixes, do not just point out problems.
- When reporting vulnerabilities, include the advisory URL if available from `npm audit` output.
- For unused dependency detection, err on the side of caution -- if you are unsure whether a package is used (e.g., it could be loaded by a framework plugin system), mark it as `info` rather than `warning`.
- In monorepos, analyze each package.json independently and note cross-workspace dependency relationships.

## Reference Files

| File | Read When |
|------|-----------|
| [references/check-catalog.md](references/check-catalog.md) | Running the audit -- full check details with examples and rationale |
| [references/research-notes.md](references/research-notes.md) | Understanding the research behind this skill |
