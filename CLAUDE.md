# GitStory

A CLI tool that analyzes any git repository and generates a stunning, self-contained HTML narrative timeline.

## Stack

- TypeScript (strict mode), ESM modules, Node.js
- Commander for CLI
- D3.js v7 (CDN, loaded in output HTML)
- Vitest for testing

## Commands

- Build: `npm run build` (tsc to dist/)
- Type-check: `npx tsc --noEmit`
- Test: `npm test`
- Lint: `npm run lint`

## Conventions

- `npm` package manager
- Strict TypeScript (`strict: true`)
- Output is a single self-contained HTML file (no server needed)
- D3.js loaded from CDN in the output HTML, not as an npm dependency
- ESM modules (`"type": "module"` in package.json)

## Verification

Run after every code change:
- `npm run build` must succeed
- `npx tsc --noEmit` must pass

## Workflow

Use the full Forge workflow: discuss → spec → plan → execute → review → ship.
Use `/implement-feature` to orchestrate the build process.
