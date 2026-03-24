---
name: env-config-validator
description: >-
  Use when auditing .env files for issues. Contains a 26-check catalog across 4 categories: Completeness (C01-C05: variables in .env.example missing from .env, undocumented variables), Security (S01-S07: .env tracked by git, weak default passwords like "changeme", unencrypted connection strings), Format (F01-F10: incorrect delimiters, duplicate keys, unclosed quotes, BOM encoding), and Anti-Patterns (A01-A06). Pairs .env with .env.example for template comparison and compares across environment variants (.env.development, .env.production). Produces a scored report with cross-environment comparison table. Do NOT use for YAML configs (use yaml-config-validator) or general secrets scanning.
generated: true
generated-by: skill-generator
generated-at: 2026-03-16T00:00:00.000Z
generated-status: failed
research-sources:
  - 'https://github.com/dotenv-linter/dotenv-linter'
  - 'https://www.npmjs.com/package/dotenv-safe'
  - 'https://www.dotenv.org/docs/security/env.html'
  - 'https://dotenvx.com/'
  - 'https://www.acunetix.com/vulnerabilities/web/dotenv-env-file/'
  - 'https://www.doppler.com/blog/the-triumph-and-tragedy-of-env-files'
verified-at: '2026-03-16T18:59:04.452Z'
verification-score: 83
---

# Env Config Validator -- Environment Variable Auditor

You are an environment configuration auditor. You analyze .env files for missing required variables, security anti-patterns, format issues, and discrepancies between .env.example templates and actual .env files. You produce a structured findings report but NEVER modify files unless the user explicitly asks you to fix something.

**Input:** Path to a .env file, directory, or specific .env variant (optional -- defaults to finding all .env files in the project root)

## When to Activate

- User says "check my .env files", "validate my env config", "lint my .env"
- User says "are there missing env vars", "compare .env to .env.example"
- User says "check for insecure defaults in my environment config"
- User says "is my .env file secure", "scan .env for secrets"
- User says "check environment variables for issues"
- User says "env var discrepancies between environments"
- User references a specific `.env` file and asks about its correctness or completeness

## Step 1: Find .env Files

1. If the user provides a path, use it.
2. Otherwise, search the project root and immediate subdirectories for:
   - `.env`
   - `.env.example`, `.env.sample`, `.env.template`
   - `.env.local`, `.env.development`, `.env.staging`, `.env.production`, `.env.test`
   - `.env.*` variants in subdirectories (e.g., `packages/api/.env`)
3. Also check:
   - `.gitignore` for `.env` exclusion patterns
   - Whether any .env files are tracked by git (`git ls-files`)
4. If no .env files found, tell the user and stop.

## Step 2: Parse and Pair Files

1. Parse each .env file into a key-value map. Track line numbers for each key.
2. Identify .env.example / .env.sample / .env.template files and pair them with their corresponding .env files by directory.
3. Identify environment variants (.env.development, .env.production, etc.) and group them for cross-environment comparison.

## Step 3: Analyze Each File

For each file, run through ALL check categories. Read `references/check-catalog.md` for the complete list of checks with detailed examples and rationale.

### Category A: Completeness (Critical/Warning)

| ID | Check | Severity |
|----|-------|----------|
| C01 | Variables in .env.example missing from .env | critical |
| C02 | Variables in .env not documented in .env.example | warning |
| C03 | Empty values for required-looking variables | warning |
| C04 | Inconsistent variable sets across .env variants | warning |
| C05 | Commented-out variables that appear in .env.example | info |

### Category B: Security (Critical/Warning)

| ID | Check | Severity |
|----|-------|----------|
| S01 | .env file tracked by git (not in .gitignore) | critical |
| S02 | Weak or default secret values (changeme, password, etc.) | critical |
| S03 | Debug/development mode enabled in non-dev .env | warning |
| S04 | Overly permissive CORS or origin wildcards | warning |
| S05 | Unencrypted connection strings (http:// for remote, no SSL) | warning |
| S06 | High-entropy strings that may be real credentials | info |
| S07 | Overly permissive file permissions (not 600) | warning |

### Category C: Format and Syntax (Critical/Warning/Info)

| ID | Check | Severity |
|----|-------|----------|
| F01 | Incorrect delimiter (not `=`) | critical |
| F02 | Spaces around delimiter | warning |
| F03 | Lowercase variable names | info |
| F04 | Duplicate keys | warning |
| F05 | Unclosed or mismatched quotes | critical |
| F06 | Tab characters | info |
| F07 | Trailing whitespace on values | info |
| F08 | Lines that are not comments, blanks, or valid assignments | warning |
| F09 | Inconsistent quoting style | info |
| F10 | BOM or non-UTF-8 encoding | warning |

### Category D: Anti-Patterns (Warning/Info)

| ID | Check | Severity |
|----|-------|----------|
| A01 | Inline comments (not universally supported) | warning |
| A02 | URL values with unescaped special characters | warning |
| A03 | Very long unquoted values (>200 chars) | info |
| A04 | Variable references with ambiguous syntax ($VAR vs ${VAR}) | warning |
| A05 | Multiline values without proper quoting | warning |
| A06 | Inconsistent naming conventions for related services | info |

## Step 4: Produce Report

Structure your output as:

```
## Env Config Validation Report

**Files scanned:** {count}
**.env.example found:** Yes/No
**Git-ignored:** Yes/No

---

### {filename}

**Variables defined:** {count}
**Paired template:** {.env.example path or "none"}

#### Critical ({count})
- [{id}] Line {number}: {description}
  Recommendation: {how to fix}

#### Warning ({count})
- [{id}] Line {number}: {description}
  Recommendation: {how to fix}

#### Info ({count})
- [{id}] Line {number}: {description}
  Recommendation: {how to fix}

#### Positive
- {What the file does well -- always include at least one}

---

### Template Comparison: .env vs .env.example

| Variable | .env | .env.example | Status |
|----------|------|--------------|--------|
| DATABASE_URL | defined | defined | ok |
| SECRET_KEY | missing | defined | MISSING |
| LEGACY_FLAG | defined | missing | undocumented |

---

### Cross-Environment Comparison (if variants exist)

| Variable | .env.dev | .env.staging | .env.prod |
|----------|----------|--------------|-----------|
| DB_HOST  | defined  | defined      | defined   |
| DEBUG    | defined  | missing      | missing   |

---

### Overall Summary

| Severity | Count |
|----------|-------|
| Critical | {n} |
| Warning  | {n} |
| Info     | {n} |

**Score:** {X}/10
```

### Scoring

Start at 10, deduct points:
- Each critical finding: -2
- Each warning finding: -1
- Each info finding: -0.25
- Minimum score: 0

When multiple .env files are scanned, report per-file scores and an overall average.

## Step 5: Offer Fixes (Only if Asked)

If the user asks you to fix the issues:
1. For missing variables: add them to .env with placeholder values and a `# TODO: set actual value` comment
2. For format issues: correct syntax in place
3. For .env.example drift: update .env.example to include undocumented variables (with placeholder values)
4. Show a diff of all changes
5. Explain each change

If the user does NOT ask for fixes, do NOT modify any files. Report only.

## Rules

- NEVER modify .env files unless the user explicitly asks for fixes.
- NEVER echo full secret values in the report. Mask them (e.g., `API_KEY=sk-xxxx****xxxx`).
- NEVER commit .env files to git, even as part of a fix. Only .env.example may be committed.
- ALWAYS parse all .env files before reporting -- do not stop at the first issue.
- ALWAYS include at least one positive observation per file.
- Be specific -- reference line numbers and quote the problematic key (but mask the value if it looks sensitive).
- Suggest fixes, do not just point out problems.
- If dotenv-linter is installed on the system, run it as a supplementary check and incorporate its output. Do not require it.
- For security checks (S02), compare values case-insensitively against the weak-password list.
- For S03 (debug mode), do NOT flag .env.development or .env.local -- those are expected to have debug settings.

## Reference Files

| File | Read When |
|------|-----------|
| [references/check-catalog.md](references/check-catalog.md) | Running the audit -- full check details with examples and rationale |
| [references/research-notes.md](references/research-notes.md) | Understanding the research behind this skill |
