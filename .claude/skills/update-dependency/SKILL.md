---
name: update-dependency
description: >-
  Use when updating an npm dependency to a newer version. Takes a package_name, checks npm outdated and the package changelog for breaking changes, assesses blast radius (how many files import it, peer dependency conflicts), runs npm install with the new version, fixes any breaking API changes in consuming files, and verifies with tsc --noEmit + tests + lint. Commits both package.json and lockfile. One dependency per PR. Do NOT use for adding new dependencies, removing dependencies, or bulk updates.
---

# Update Dependency — Quick Workflow

You are updating a dependency to its latest (or specified) version. This uses the QUICK workflow — no discuss or spec phase.

**Input:** `package_name` (required), optionally a target version.

## Step 1: Context Hydration

1. Read `CLAUDE.md` for project conventions.
2. Read `package.json` to find the current version of the dependency.
3. Check what depends on this package: search for imports/requires of the package across the codebase.
4. Read the package's changelog or release notes for breaking changes:
   - Check `node_modules/<package_name>/CHANGELOG.md` if available
   - Or use `npm info <package_name>` to see available versions
5. Check if the project has a lockfile (`package-lock.json` or `yarn.lock`).

## Step 2: Assess Impact

Before updating, understand the blast radius:

1. How many files import this package?
2. Are there any known breaking changes between the current and target version?
3. Are there peer dependency conflicts?

Run: `npm outdated <package_name>` to see current vs. wanted vs. latest.

## Step 3: Update

1. Update the package:
   ```bash
   npm install <package_name>@latest
   ```
   Or for a specific version:
   ```bash
   npm install <package_name>@<version>
   ```

2. If there are peer dependency warnings, resolve them.

3. Check for breaking changes in the update:
   - Run `npx tsc --noEmit` to catch type errors (TypeScript projects).
   - Run `forge_run_tests` or `npm test` to catch runtime errors.
   - Run `forge_run_lint` or `npm run lint` to catch lint issues.

## Step 4: Fix Breaking Changes

If the update introduces breaking changes:

1. Read the migration guide or changelog for the new version.
2. Update all files that import the package to use the new API.
3. Update type definitions if needed.
4. Update tests to match new behavior.
5. Re-run all verification steps.

## Step 5: Review (`forge-review`)

Quick review:
- Stage 1: The dependency is updated, all imports work, no broken references.
- Stage 2: Tests pass, lint passes, types check, no regressions.

## Step 6: Ship (`forge-ship`)

1. Create branch: `chore/update-<package-name>`
2. Commit message: `chore: update <package_name> from <old_version> to <new_version>`
   - Include breaking changes addressed in the commit body.
3. Stage `package.json` and `package-lock.json` (or `yarn.lock`) explicitly.
4. Push and create PR.

## Step 7: Monitor (`forge-monitor-pr`)

1. Poll CI — the full test suite must pass with the updated dependency.
2. Fix CI failures if any (max 2 rounds).

## Cross-Cutting Rules

- **One dependency at a time**: Do not update multiple unrelated dependencies in one PR.
- **Lockfile must be committed**: Always include the lockfile in the commit.
- **No major version bumps without discussion**: If the update is a major version bump with significant breaking changes, warn the user and consider using the FULL workflow instead.
- **Fresh context on retry**: If retrying, re-read the changelog and re-check for breaking changes.
