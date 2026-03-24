# Research Notes -- dockerfile-lint

## Sources Consulted

1. **Docker Official Docs** -- https://docs.docker.com/build/building/best-practices/
   - Canonical reference for instruction-level best practices
   - Key: multi-stage builds, COPY vs ADD, RUN consolidation, cache optimization, USER instruction

2. **OWASP Docker Security Cheat Sheet** -- https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html
   - 13 rules covering host, daemon, image, and runtime security
   - Key: non-root execution, capability dropping, secrets management, resource limits, read-only filesystems

3. **Sysdig Top 20 Dockerfile Best Practices** -- https://www.sysdig.com/learn-cloud-native/dockerfile-best-practices
   - Production-oriented checklist
   - Key: UID above 10000, fixed tags not latest, minimal base images, scan images in CI

4. **Snyk Docker Security Best Practices** -- https://snyk.io/blog/10-docker-image-security-best-practices/
   - Developer-focused security guide
   - Key: multistage builds for compiled languages, distroless images, vulnerability scanning

5. **Hadolint** -- https://github.com/hadolint/hadolint
   - Industry-standard Dockerfile linter (Haskell-based)
   - Rule prefix: DL (hadolint native) and SC (ShellCheck for inline bash)
   - Categories: error, warning, info, style

## Key Findings

### Security
- Running as root is the most common and most dangerous Dockerfile mistake
- Secrets in ENV/ARG persist in image metadata even if "deleted" in later layers
- Unpinned base images are a supply chain risk -- use digests for critical images
- ADD from remote URLs without checksums enables MITM attacks

### Layer Optimization
- Every RUN creates a layer; combine related commands
- Cache invalidation order matters: copy dependency manifests before source code
- Cleanup must happen in the same RUN as the install to actually reduce image size
- Alpine/slim base images can be 10-50x smaller than full distributions

### Anti-Patterns
- Shell form CMD does not pass signals correctly (PID 1 issue)
- cd in RUN does not persist -- use WORKDIR
- Multiple CMD/ENTRYPOINT is almost always a mistake
- Missing .dockerignore sends everything to the daemon

### Tools
- hadolint: static analysis, catches both Dockerfile and shell issues
- trivy/snyk: vulnerability scanning of built images (out of scope for this skill)
- Docker Scout: supply chain analysis and digest pinning

## Patterns Followed

- Organized checks by severity (critical > warning > info)
- Each check has: ID, description, detection logic, bad example, good example
- Scoring system: start at 10, deduct by severity
- Report-only by default, fix-on-request pattern (matches pr-review skill convention)
- Progressive disclosure: check summary in SKILL.md, full details in references/check-catalog.md
