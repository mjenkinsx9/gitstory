# YAML Config Validator -- Research Notes

Research conducted during skill generation to inform check design and severity ratings.

## Sources Consulted

1. **YAML Best Practices -- Common Errors and How to Avoid Them** (moldstud.com)
   - 60% of YAML parsing issues arise from incorrect spacing
   - Missing space after colons causes 30% of user errors
   - Standardized array formatting reduces mistakes by ~25%
   - Proactive validation reduces troubleshooting time by ~50%

2. **YAML Security: Risks and Best Practices** (kusari.dev)
   - Unsafe YAML parsers (e.g., Python `yaml.load()`) allow arbitrary object instantiation / RCE
   - YAML's readable format makes it easy for developers to hardcode secrets during development
   - Template engines processing YAML with variable substitution are vulnerable to injection
   - Permissive parsing without schema validation creates "configuration drift"

3. **YAML Static Code Analysis Rules** (rules.sonarsource.com)
   - SonarSource maintains YAML-specific rules covering syntax, security, and best practices
   - Rules organized by severity and applicability to specific frameworks

4. **Secure Your Kubernetes: Static YAML Analysis** (offensivebytes.com)
   - Missing resource limits allow container-level DoS
   - Excessive RBAC permissions are a common misconfiguration
   - Security contexts (runAsNonRoot, readOnlyRootFilesystem) frequently missing

5. **YAMLlint** (yamllint.com)
   - Reference implementation for YAML syntax validation
   - Checks indentation consistency, trailing spaces, key duplicates, line length

## Key Findings

### Syntax Errors
- **Indentation** is the single largest source of YAML errors (60% of parse failures)
- **Tab characters** are strictly forbidden but commonly introduced by editors
- **Boolean trap**: YAML 1.1 treats yes/no/on/off as booleans, causing silent data corruption (e.g., country code `NO` becoming `false`)
- **Duplicate keys** are silently overwritten by most parsers, masking configuration intent

### Security
- **Plaintext secrets** are the most common security issue in YAML config files
- **Automated bots** continuously scrape public repos for exposed API keys (AWS keys exploited within minutes)
- **High-entropy string detection** catches secrets that do not match known key name patterns
- **Connection strings** with embedded credentials are easy to miss in review
- **RBAC wildcards** (`*`) violate least-privilege and are flagged by tools like KubeLinter

### Schema Validation
- **30% decrease** in critical configuration errors when schema validation is deployed (DevOps Institute, 2025)
- **Per-type validation** (Kubernetes, Compose, GitHub Actions) is far more useful than generic YAML syntax checking alone
- **Typo detection** via edit distance catches misspelled keys that parsers silently accept

### Anti-Patterns
- **Deep nesting** beyond 3-5 levels reduces readability and increases error probability
- **Hardcoded environment values** (IPs, hostnames) prevent config reuse across environments
- **Commented-out blocks** are dead code that confuses maintainers

## Design Decisions

1. **Severity ratings** follow the pr-review convention (Critical/Warning/Info) from the existing Forge skill set
2. **Scoring system** (10-point scale) matches dockerfile-lint for consistency across audit skills
3. **Check IDs** use two-letter category prefix + two-digit number for easy reference
4. **Secret masking** is mandatory in report output to prevent the validator itself from leaking secrets
5. **Config type detection** is automatic but can be overridden by the user
6. **Read-only by default** -- the skill reports but does not modify files, matching the pattern established by pr-review and dockerfile-lint
