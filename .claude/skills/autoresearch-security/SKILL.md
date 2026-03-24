---
name: autoresearch-security
description: Autonomous STRIDE + OWASP Top 10 security audit using the autoresearch loop pattern. Iteratively tests vulnerability vectors with code evidence. Supports --diff, --fix, and --fail-on flags. Use for security audits, threat modeling, red-teaming, or finding vulnerabilities.
---

# Autoresearch Security — Autonomous Security Audit

This is the security audit subcommand for the [autoresearch](../autoresearch/SKILL.md) skill. It combines STRIDE threat modeling, OWASP Top 10 sweeps, and red-team adversarial analysis into a single autonomous loop.

Load the full protocol from `../autoresearch/references/security-workflow.md` and follow it completely.

## What It Does

1. **Codebase Reconnaissance** — scans tech stack, dependencies, configs, API routes
2. **Asset Identification** — catalogs data stores, auth systems, external services
3. **Trust Boundary Mapping** — browser<->server, public<->authenticated, user<->admin
4. **STRIDE Threat Model** — Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation of Privilege
5. **Attack Surface Map** — entry points, data flows, abuse paths
6. **Autonomous Loop** — iteratively tests each vector, validates with code evidence, logs findings
7. **Final Report** — severity-ranked findings with mitigations in `security/` folder

## Flags

| Flag | Purpose |
|------|---------|
| `--diff` | Delta mode — only audit files changed since last audit |
| `--fix` | After audit, auto-fix confirmed Critical/High findings |
| `--fail-on {severity}` | Exit non-zero if findings meet threshold (CI/CD gating) |

## Usage

```
/autoresearch-security

/autoresearch-security --diff

/autoresearch-security --fix

/autoresearch-security --fail-on critical

/autoresearch-security
Scope: src/api/**/*.ts, src/middleware/**/*.ts
Focus: authentication and authorization flows
```

## Forge Observability

At start: `forge_run_start(skill_name: "autoresearch", phase: "security")`
At end: `forge_run_end(run_id: "<from start>", outcome: "success"|"failure", summary: "<findings summary>")`
