# npm Dependency Health -- Research Notes

Research conducted 2026-03-16 for the npm-dependency-health skill.

## Sources Consulted

1. **npm audit documentation** (https://docs.npmjs.com/cli/v8/commands/npm-audit/) -- Official reference for vulnerability scanning. Key: `--json` flag for machine-readable output, `--audit-level` flag for threshold filtering.

2. **OWASP NPM Security Cheat Sheet** (https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html) -- Comprehensive security guidance for npm projects. Covers lockfile importance, script injection risks, typosquatting.

3. **Snyk Advisor** (https://snyk.io/advisor/check/npm) -- Package health scoring methodology. Evaluates maintenance, popularity, security, and community activity.

4. **license-checker npm package** (https://www.npmjs.com/package/license-checker) -- Tool for auditing licenses across all dependencies. Supports SPDX identifiers, custom license text parsing, and exclusion lists.

5. **SPDX License List** (https://spdx.org/licenses/) -- Canonical list of license identifiers. Used for validating license field values in package.json.

6. **license-compatibility-checker** (https://github.com/HansHammel/license-compatibility-checker) -- Checks license compatibility using a hierarchy: Public Domain > Permissive > Weakly Protective > Strongly Protective > Network Protective.

## Key Findings

### Vulnerability Scanning
- `npm audit` uses the npm registry's advisory database. It requires a lockfile for accurate results.
- npm v8.3.0 introduced the `overrides` field for pinning transitive dependency versions, useful for fixing vulnerabilities in deep dependencies.
- A 2026 report shows 65% of teams delay or bypass audit fixes due to alert fatigue -- context-aware severity assessment (dev vs prod, direct vs transitive) is essential.

### Unused Dependency Detection
- No built-in npm command for detecting unused dependencies. Must be done by comparing installed packages against import/require statements in source.
- DevDependencies are tricky: many are CLI tools or config-referenced (ESLint plugins, Jest transformers, Babel presets). These appear "unused" by naive import scanning.
- Framework plugin systems (Babel, ESLint, PostCSS) use short names that require special handling (e.g., `"plugins": ["transform-runtime"]` maps to `babel-plugin-transform-runtime`).

### License Compatibility
- npm ecosystem is dominated by MIT, ISC, and Apache-2.0 (all permissive).
- Copyleft contamination is the primary risk: a single GPL dependency can theoretically require the entire project to be GPL-licensed.
- SPDX expressions support OR (choose one) and AND (comply with all) operators. AND expressions are more restrictive.
- The `licenses` (plural) field format is deprecated since npm v5.

### Peer Dependency Management
- npm v7+ auto-installs peer dependencies by default, reducing missing peer dep issues.
- `peerDependenciesMeta` allows marking peers as optional, reducing false warnings.
- Conflicting peer requirements between multiple direct dependencies is one of the hardest problems -- no automated resolution exists.

## Design Decisions

1. **Scoring model**: Adopted the same 10-point scale used by dockerfile-lint and yaml-config-validator for consistency across Forge skills.
2. **Conservative unused detection**: The skill errs on caution for unused deps, since false positives (flagging a used package as unused) are worse than false negatives. CLI tools and config-referenced packages are excluded from naive scanning.
3. **Vulnerability context**: Dev-only vulnerabilities are downgraded to `info` since they are not shipped to production. This reduces alert fatigue per industry research.
4. **License hierarchy**: Uses the SPDX compatibility model (Public Domain > Permissive > Weakly Protective > Strongly Protective > Network Protective) for clear, defensible categorization.
