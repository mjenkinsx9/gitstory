# npm Dependency Health -- Check Catalog

Complete reference for all checks with examples, rationale, and detection guidance.

---

## Category A: Outdated Packages

### OD01 -- Major Version Behind Latest
**Severity:** warning
**What:** A dependency is more than one major version behind the latest release.
**Why:** Major versions typically contain important improvements, security fixes, and performance gains. Being multiple majors behind makes incremental upgrades harder.
**Example:**
```
express: installed 3.21.2, latest 5.0.1 (2 major versions behind)
```
**Detection:** Compare major version from `npm outdated --json` output. Flag when `current major < latest major - 1`.

### OD02 -- Stale Dependency (>1 Year Old)
**Severity:** warning
**What:** A dependency has not been updated in the project for more than 1 year, and a newer version exists.
**Why:** Long-stale dependencies accumulate breaking changes and may have unpatched vulnerabilities.
**Detection:** Compare `current` vs `latest` from `npm outdated`. Cross-reference with the `time` field from `npm view <pkg> time --json` if needed.

### OD03 -- Deprecated Package
**Severity:** critical
**What:** A dependency is marked as deprecated on the npm registry.
**Why:** Deprecated packages will not receive security patches. The maintainer has typically recommended a replacement.
**Example:**
```
request: DEPRECATED - Use 'node-fetch', 'undici', or 'got' instead
```
**Detection:** Check `npm outdated --json` for deprecated markers, or run `npm view <pkg> deprecated`.

### OD04 -- Exact Pin Without Lockfile
**Severity:** info
**What:** A dependency uses an exact version (no `^` or `~`) and the project has no lockfile.
**Why:** Without a lockfile, exact pinning is actually a reasonable safety measure. This is informational -- the real issue is the missing lockfile, not the pinning.
**Detection:** Parse version strings in package.json for absence of `^`, `~`, `>=`, or `*` prefixes, combined with absence of a lockfile.

### OD05 -- Overly Broad Version Range
**Severity:** warning
**What:** A dependency uses `*`, `>=0`, or `""` as its version, accepting any version.
**Why:** Wildcard versions can pull in breaking changes on any install. This defeats the purpose of version management.
**Example:**
```json
"dependencies": {
  "some-lib": "*"
}
```
**Detection:** Match version strings against `*`, `>=0.0.0`, or empty string.

### OD06 -- Package Renamed or Moved
**Severity:** warning
**What:** A dependency has been superseded by a package under a different name or scope.
**Why:** The old name may stop receiving updates.
**Example:**
```
@babel/core supersedes babel-core
@hapi/hapi supersedes hapi
```
**Detection:** Check for common known renames. Also check `npm view <pkg>` for deprecation notices that mention a replacement.

---

## Category B: Security Vulnerabilities

### VU01 -- Critical Vulnerability
**Severity:** critical
**What:** `npm audit` reports a critical-severity vulnerability.
**Why:** Critical vulnerabilities typically allow remote code execution, authentication bypass, or complete data exposure.
**Detection:** Parse `npm audit --json` output for entries with `severity: "critical"`.

### VU02 -- High Vulnerability
**Severity:** critical
**What:** `npm audit` reports a high-severity vulnerability.
**Why:** High vulnerabilities allow significant exploitation such as privilege escalation or sensitive data leaks.
**Detection:** Parse `npm audit --json` for `severity: "high"`.

### VU03 -- Moderate Vulnerability
**Severity:** warning
**What:** `npm audit` reports a moderate-severity vulnerability.
**Why:** Moderate vulnerabilities require specific conditions to exploit but still pose real risk.
**Detection:** Parse `npm audit --json` for `severity: "moderate"`.

### VU04 -- Low Vulnerability
**Severity:** info
**What:** `npm audit` reports a low-severity vulnerability.
**Why:** Low vulnerabilities have limited impact or require highly unlikely conditions.
**Detection:** Parse `npm audit --json` for `severity: "low"`.

### VU05 -- Vulnerability in Direct Dependency
**Severity:** critical
**What:** The vulnerable package is a direct dependency (listed in package.json), not a transitive one.
**Why:** Direct dependencies are within your control to update. Transitive vulnerabilities may require waiting for upstream fixes.
**Detection:** Cross-reference vulnerable package names from `npm audit` with keys in `dependencies`/`devDependencies`.

### VU06 -- Vulnerability Only in devDependency
**Severity:** info
**What:** The vulnerability exists only in a package used during development, not shipped to production.
**Why:** Dev-only vulnerabilities have much lower risk since they are not exposed to end users. An attacker would need access to your development environment.
**Detection:** Check if the vulnerable dependency (or its ancestor in the tree) is only reachable from `devDependencies`.

### VU07 -- No Lockfile Present
**Severity:** warning
**What:** The project has no `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`.
**Why:** Without a lockfile, `npm audit` cannot reliably determine exact installed versions. Different installs may get different dependency trees.
**Detection:** Check for lockfile existence in the project root.

### VU08 -- npm audit Unavailable
**Severity:** info
**What:** The `npm audit` command failed or is unavailable (e.g., private registry without audit support).
**Why:** Vulnerability data could not be checked. This is not a vulnerability itself but a gap in coverage.
**Detection:** Check the exit code and stderr of `npm audit --json`.

---

## Category C: Unused Dependencies

### UN01 -- Unused Production Dependency
**Severity:** warning
**What:** A package listed in `dependencies` is never imported anywhere in the source code.
**Why:** Unused production dependencies inflate bundle size, increase install time, and expand the attack surface for supply chain attacks.
**Detection:** Search all source files for `import ... from '<pkg>'`, `require('<pkg>')`, `require('<pkg>/...')`, and dynamic `import('<pkg>')`. Also check for framework-specific usage patterns (e.g., Babel plugins referenced by short name in config files).

### UN02 -- Unused Dev Dependency
**Severity:** warning
**What:** A package listed in `devDependencies` is never imported or referenced in source files or configuration.
**Why:** Unnecessary dev dependencies slow down installs and can cause version conflicts.
**Detection:** Same as UN01 but also check config files, package.json `scripts`, and tool-specific configs. Many dev dependencies are CLI tools invoked via scripts rather than imported.

### UN03 -- Duplicate Functionality
**Severity:** info
**What:** Two or more packages that serve the same purpose are both installed.
**Why:** Adds unnecessary weight and complexity. Pick one and standardize.
**Common duplicates:**
- `lodash` + `underscore`
- `moment` + `dayjs` + `date-fns`
- `axios` + `node-fetch` + `got` + `superagent`
- `uuid` + `nanoid` + `cuid`
- `chalk` + `kleur` + `picocolors`
- `commander` + `yargs` + `meow`
- `winston` + `pino` + `bunyan`
**Detection:** Check for known equivalent package pairs in the dependency list.

### UN04 -- Used Only in Commented-Out Code
**Severity:** warning
**What:** The only references to a package are in commented-out lines.
**Why:** If the code using the package has been commented out, the dependency is effectively dead weight.
**Detection:** If all import/require matches are preceded by `//` or inside `/* */` blocks, flag the dependency.

### UN05 -- Orphaned Types Package
**Severity:** warning
**What:** A `@types/*` package exists in devDependencies but the corresponding runtime package is not installed.
**Why:** Type definitions without the runtime package serve no purpose and indicate a dependency that was partially removed.
**Example:**
```
@types/express is installed but express is not in dependencies
```
**Detection:** For each `@types/<name>` in devDependencies, verify that `<name>` (or `@<scope>/<name>` for scoped types) exists in dependencies or devDependencies.

---

## Category D: Peer Dependency Issues

### PD01 -- Missing Required Peer Dependency
**Severity:** warning
**What:** A direct dependency declares a peer dependency that is not installed in the project.
**Why:** Missing peer dependencies can cause runtime crashes, unexpected behavior, or duplicate bundled copies.
**Example:**
```
react-dom requires react@^18.0.0 as a peer dependency, but react is not installed
```
**Detection:** Parse `npm ls --json` for `peerMissing` entries. Or read each direct dependency's `package.json` from `node_modules/` and check its `peerDependencies` against the project's installed packages.

### PD02 -- Peer Dependency Version Mismatch
**Severity:** warning
**What:** A peer dependency is installed but at a version outside the required range.
**Why:** Version mismatches can cause subtle bugs, API incompatibilities, or duplicate packages in the bundle.
**Example:**
```
react-dom requires react@^18.0.0, but react@17.0.2 is installed
```
**Detection:** Parse `npm ls --json` for `invalid` entries, or compare installed versions against peer dependency ranges.

### PD03 -- Conflicting Peer Requirements
**Severity:** critical
**What:** Two or more dependencies require incompatible versions of the same peer dependency.
**Why:** No single version can satisfy both requirements, leading to guaranteed issues for at least one consumer.
**Example:**
```
library-a requires react@^17.0.0
library-b requires react@^18.0.0
No single react version satisfies both
```
**Detection:** Collect all peer dependency requirements for each package name across all direct dependencies. Check if the intersection of version ranges is empty.

### PD04 -- Optional Peer Listed as Required
**Severity:** info
**What:** A peer dependency is effectively optional (used for an optional feature) but not marked in `peerDependenciesMeta`.
**Why:** Projects may get unnecessary warnings about missing deps they do not need.
**Detection:** Check for `peerDependenciesMeta` entries with `optional: true` in direct dependency package.json files.

---

## Category E: License Compatibility

### LI01 -- Copyleft License in Non-Copyleft Project
**Severity:** critical
**What:** A dependency uses a strong copyleft license (GPL-2.0, GPL-3.0, AGPL-3.0, EUPL-1.2) while the project itself uses a permissive license (MIT, ISC, Apache-2.0, BSD-2-Clause, BSD-3-Clause).
**Why:** Copyleft licenses require derivative works to use the same license. Using copyleft-licensed code in a permissively-licensed project may violate the copyleft terms.
**Detection:** Compare each dependency's `license` field against the project's `license` field. Flag when project is permissive and dependency is copyleft.

### LI02 -- Missing or UNLICENSED Dependency
**Severity:** warning
**What:** A dependency has no `license` field, or its license is `UNLICENSED`.
**Why:** Without a license, you technically have no legal right to use the package. `UNLICENSED` explicitly means "all rights reserved."
**Detection:** Check `license` field in each dependency's `node_modules/<pkg>/package.json`. Flag if absent, empty, or `UNLICENSED`.

### LI03 -- Non-Standard License Identifier
**Severity:** warning
**What:** A dependency's `license` field does not match any SPDX identifier.
**Why:** Non-standard identifiers make automated compliance checking impossible and may indicate a custom license with unknown terms.
**Example:**
```
"license": "SEE LICENSE IN LICENSE.md"
```
**Detection:** Validate license strings against the SPDX license list. Common valid identifiers: MIT, ISC, Apache-2.0, BSD-2-Clause, BSD-3-Clause, GPL-2.0-only, GPL-3.0-only, LGPL-2.1-only, MPL-2.0, 0BSD, Unlicense.

### LI04 -- Project Missing License Field
**Severity:** warning
**What:** The project's own package.json has no `license` field.
**Why:** Without declaring your own license, consumers cannot determine how they may use your code, and license compatibility analysis against dependencies is impossible.
**Detection:** Check root package.json for `license` field.

### LI05 -- Deprecated License Syntax
**Severity:** info
**What:** The `licenses` array format (plural) is used instead of the SPDX expression `license` field.
**Why:** The `licenses` array was deprecated in npm v5. The correct format is a single `license` field with an SPDX expression (e.g., `"MIT OR Apache-2.0"`).
**Detection:** Check for `licenses` (plural) key in package.json.

### LI06 -- Weak Copyleft License
**Severity:** info
**What:** A dependency uses a weak copyleft license (LGPL-2.1, LGPL-3.0, MPL-2.0).
**Why:** Weak copyleft licenses typically allow linking/importing without requiring the consuming project to adopt the same license, but there may be obligations if you modify the licensed code itself. Worth being aware of.
**Detection:** Check dependency license fields for LGPL-* and MPL-* identifiers.

### LI07 -- Incompatible Multi-License Terms
**Severity:** warning
**What:** A dependency declares multiple licenses (via SPDX OR/AND expressions) that may conflict with each other or with the project's license.
**Why:** AND expressions require compliance with all listed licenses. If one of them is incompatible with the project, the entire dependency is problematic.
**Example:**
```
"license": "GPL-3.0 AND MIT"  -- must comply with BOTH, so GPL-3.0 restrictions apply
```
**Detection:** Parse SPDX expressions. For AND expressions, check each component for compatibility. For OR expressions, check if at least one component is compatible.
