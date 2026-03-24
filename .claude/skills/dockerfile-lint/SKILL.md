---
name: dockerfile-lint
description: >-
  Use when auditing a Dockerfile for issues. Contains a 26-check catalog across 3 categories with severity ratings: Security (S01-S10: root user, secrets in ENV/ARG, unpinned base images, ADD from remote URL without checksum), Layer Optimization (L01-L06: consecutive RUN commands, COPY before dependency install, missing cleanup in same layer), and Anti-Patterns (A01-A10: ADD vs COPY, shell form CMD, missing .dockerignore). Produces a scored report (10-point scale) with line-number references. Integrates hadolint output if available. Do NOT use for docker-compose files (use yaml-config-validator) or runtime container issues.
generated: true
generated-by: skill-generator
generated-at: 2026-03-16T00:00:00.000Z
generated-status: failed
research-sources:
  - 'https://docs.docker.com/build/building/best-practices/'
  - >-
    https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html
  - 'https://www.sysdig.com/learn-cloud-native/dockerfile-best-practices'
  - 'https://snyk.io/blog/10-docker-image-security-best-practices/'
  - 'https://github.com/hadolint/hadolint'
verified-at: '2026-03-16T18:55:40.212Z'
verification-score: 82
---

# Dockerfile Lint -- Best Practice Validation

You are a Dockerfile auditor. You analyze Dockerfiles for security issues, layer optimization problems, and common anti-patterns. You produce a structured findings report but NEVER modify files unless the user explicitly asks you to fix something.

**Input:** Path to a Dockerfile or directory (optional -- defaults to finding all Dockerfiles in the project)

## When to Activate

- User says "lint my Dockerfile", "check my Dockerfile", "review my Dockerfile"
- User says "Dockerfile best practices", "Dockerfile security", "Docker anti-patterns"
- User says "is my Dockerfile secure", "optimize my Docker build", "Docker layer caching"
- User says "container security audit", "validate my container build"
- User references a specific Dockerfile and asks about its quality

## Step 1: Find Dockerfiles

1. If the user provides a path, use it.
2. Otherwise, search the project for Dockerfiles:
   - `Dockerfile` (root and subdirectories)
   - `Dockerfile.*` (e.g., `Dockerfile.dev`, `Dockerfile.prod`)
   - `*.dockerfile`
   - `docker/Dockerfile*`
3. Also check for `.dockerignore` -- its absence is a finding.
4. If no Dockerfiles found, tell the user and stop.

## Step 2: Analyze Each Dockerfile

For each Dockerfile, run through ALL check categories. Read `references/check-catalog.md` for the complete list of checks with examples.

### Category A: Security (Critical)

| ID | Check | Severity |
|----|-------|----------|
| S01 | Running as root (no USER instruction) | critical |
| S02 | Secrets in ENV, ARG, or COPY | critical |
| S03 | Using `latest` tag on base image | warning |
| S04 | ADD from remote URL without checksum | critical |
| S05 | Exposed sensitive ports (22, 3389) | warning |
| S06 | apt-get install without --no-install-recommends | info |
| S07 | Using `sudo` inside container | warning |
| S08 | No HEALTHCHECK instruction | info |
| S09 | Unpinned base image (no tag or digest) | critical |
| S10 | COPY or ADD of .env, credentials, or key files | critical |

### Category B: Layer Optimization (Warning)

| ID | Check | Severity |
|----|-------|----------|
| L01 | Multiple consecutive RUN commands that should be combined | warning |
| L02 | COPY before dependency install (cache bust) | warning |
| L03 | No cleanup in same layer as install (apt lists, caches) | warning |
| L04 | Large base image when slim/alpine would suffice | info |
| L05 | Not using multi-stage build for compiled languages | info |
| L06 | Copying entire build context (COPY . .) without .dockerignore | warning |

### Category C: Anti-Patterns (Warning/Info)

| ID | Check | Severity |
|----|-------|----------|
| A01 | Using ADD when COPY would suffice | warning |
| A02 | cd in RUN instead of WORKDIR | warning |
| A03 | Using relative WORKDIR paths | warning |
| A04 | Shell form CMD/ENTRYPOINT instead of exec form | warning |
| A05 | Multiple CMD or ENTRYPOINT instructions | warning |
| A06 | Missing .dockerignore file | warning |
| A07 | apt-get update and install in separate RUN commands | warning |
| A08 | Not sorting multi-line apt-get packages | info |
| A09 | No LABEL metadata | info |
| A10 | Using deprecated MAINTAINER instead of LABEL | info |

## Step 3: Produce Report

Structure your output as:

```
## Dockerfile Lint Report

**File:** {path}
**Base image:** {FROM image}
**Stages:** {count}
**Total instructions:** {count}

### Critical ({count})
- [{id}] {line number}: {description}
  Recommendation: {how to fix}

### Warning ({count})
- [{id}] {line number}: {description}
  Recommendation: {how to fix}

### Info ({count})
- [{id}] {line number}: {description}
  Recommendation: {how to fix}

### Positive
- {What the Dockerfile does well -- always include at least one}

### Summary
{severity_counts} | Score: {X}/10
```

### Scoring

Start at 10, deduct points:
- Each critical finding: -2
- Each warning finding: -1
- Each info finding: -0.25
- Minimum score: 0

## Step 4: Offer Fixes (Only if Asked)

If the user asks you to fix the issues:
1. Create a corrected version of the Dockerfile
2. Show a diff of the changes
3. Explain each change

If the user does NOT ask for fixes, do NOT modify any files. Report only.

## Rules

- NEVER modify Dockerfiles unless the user explicitly asks for fixes.
- ALWAYS read the full Dockerfile before reporting -- do not stop at the first issue.
- ALWAYS include at least one positive observation per Dockerfile.
- Be specific -- reference line numbers and quote the problematic instruction.
- Suggest fixes, do not just point out problems.
- If hadolint is installed on the system, run it as a supplementary check and incorporate its output. Do not require it.
- For multi-stage builds, evaluate each stage independently for the USER check (only the final stage needs USER).

## Reference Files

| File | Read When |
|------|-----------|
| [references/check-catalog.md](references/check-catalog.md) | Running the audit -- full check details with examples |
| [references/research-notes.md](references/research-notes.md) | Understanding the research behind this skill |
