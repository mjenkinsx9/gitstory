# Dockerfile Lint -- Full Check Catalog

Detailed descriptions, rationale, and examples for every check.

---

## Category A: Security

### S01 -- Running as root (no USER instruction)

**Severity:** critical

Containers that run as root give an attacker full privileges inside the container. If combined with a container escape vulnerability, the attacker gains root on the host.

**Detect:** No `USER` instruction in the Dockerfile, or `USER root` without switching back.
For multi-stage builds, only the final stage must have a non-root USER.

**Bad:**
```dockerfile
FROM node:20
COPY . /app
CMD ["node", "server.js"]
# Runs as root by default
```

**Good:**
```dockerfile
FROM node:20
RUN groupadd -r appuser && useradd -r -g appuser -u 10001 appuser
COPY --chown=appuser:appuser . /app
USER appuser
CMD ["node", "server.js"]
```

### S02 -- Secrets in ENV, ARG, or COPY

**Severity:** critical

Secrets baked into the image are visible to anyone who can pull it. ENV and ARG values are preserved in image metadata and layer history. COPY of credential files embeds them permanently.

**Detect:** Look for:
- `ENV` or `ARG` with names containing: PASSWORD, SECRET, TOKEN, API_KEY, PRIVATE_KEY, CREDENTIAL, AWS_ACCESS, AWS_SECRET
- `COPY` or `ADD` of files named: `.env`, `*.pem`, `*.key`, `id_rsa`, `credentials`, `*.p12`, `*.pfx`

**Bad:**
```dockerfile
ENV DATABASE_PASSWORD=hunter2
ARG AWS_SECRET_ACCESS_KEY
COPY .env /app/.env
COPY id_rsa /root/.ssh/id_rsa
```

**Good:**
```dockerfile
# Use Docker secrets or runtime environment variables
# Never bake credentials into the image
RUN --mount=type=secret,id=db_password cat /run/secrets/db_password
```

### S03 -- Using `latest` tag on base image

**Severity:** warning

The `latest` tag is mutable. Builds are not reproducible -- you get a different image on every build. A breaking change in the upstream image silently breaks your build.

**Detect:** `FROM image:latest` or `FROM image` (implicit latest).

**Bad:**
```dockerfile
FROM node:latest
FROM python
```

**Good:**
```dockerfile
FROM node:20.11-alpine3.19
FROM python:3.12-slim-bookworm
```

### S04 -- ADD from remote URL without checksum

**Severity:** critical

ADD from a URL downloads arbitrary content without verification. The content could be tampered with via MITM or compromised upstream.

**Detect:** `ADD http://` or `ADD https://` without `--checksum`.

**Bad:**
```dockerfile
ADD https://example.com/app.tar.gz /app/
```

**Good:**
```dockerfile
ADD --checksum=sha256:abc123... https://example.com/app.tar.gz /app/
# Or use RUN with curl and manual verification
RUN curl -fsSL https://example.com/app.tar.gz -o /tmp/app.tar.gz \
    && echo "abc123... /tmp/app.tar.gz" | sha256sum -c - \
    && tar -xzf /tmp/app.tar.gz -C /app/
```

### S05 -- Exposed sensitive ports

**Severity:** warning

Exposing SSH (22) or RDP (3389) ports suggests the container is being used for interactive access, which is an anti-pattern. Containers should be ephemeral and not accessed via shell.

**Detect:** `EXPOSE 22` or `EXPOSE 3389`.

### S06 -- apt-get without --no-install-recommends

**Severity:** info

Without this flag, apt installs recommended packages that are usually unnecessary, increasing image size and attack surface.

**Detect:** `apt-get install` without `--no-install-recommends`.

### S07 -- Using sudo inside container

**Severity:** warning

If you need sudo, the container is likely running as non-root but escalating to root, defeating the purpose. Use gosu for process initialization or restructure the Dockerfile so the USER has the needed permissions directly.

**Detect:** `sudo` in any RUN instruction.

### S08 -- No HEALTHCHECK instruction

**Severity:** info

Without HEALTHCHECK, Docker and orchestrators cannot determine if the application inside the container is actually responding. The container may be "running" but the process is hung.

**Detect:** No `HEALTHCHECK` instruction anywhere in the Dockerfile.

### S09 -- Unpinned base image

**Severity:** critical

Using a base image without a tag or digest means you get whatever the registry resolves `latest` to. For supply chain security, pin to a specific digest.

**Detect:** `FROM image` with no `:tag` and no `@sha256:digest`.

### S10 -- COPY or ADD of credential files

**Severity:** critical

Copying files that commonly contain secrets (private keys, env files, credential configs) embeds them in the image layer permanently, even if you delete them in a later layer.

**Detect:** COPY/ADD sources matching: `.env`, `*.pem`, `*.key`, `id_rsa*`, `*.p12`, `*.pfx`, `credentials*`, `*secret*`.

---

## Category B: Layer Optimization

### L01 -- Multiple consecutive RUN commands

**Severity:** warning

Each RUN creates a filesystem layer. Combining related commands into a single RUN reduces layers and total image size (intermediate layers cannot be reclaimed).

**Detect:** Two or more consecutive RUN instructions that could logically be combined.

**Bad:**
```dockerfile
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git
RUN rm -rf /var/lib/apt/lists/*
```

**Good:**
```dockerfile
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       curl \
       git \
    && rm -rf /var/lib/apt/lists/*
```

### L02 -- COPY before dependency install (cache bust)

**Severity:** warning

If you COPY the entire source tree before installing dependencies, any source file change invalidates the dependency install cache. Copy dependency manifests first, install, then copy the rest.

**Detect:** `COPY . .` or `COPY . /app` appearing before a dependency install command (npm install, pip install, go mod download, etc.).

**Bad:**
```dockerfile
COPY . /app
RUN npm install
```

**Good:**
```dockerfile
COPY package.json package-lock.json /app/
RUN npm ci
COPY . /app
```

### L03 -- No cleanup in same layer as install

**Severity:** warning

Package manager caches (apt lists, pip cache, npm cache) persist in the layer where they were created. Deleting them in a separate RUN does not reduce image size -- the data is still in the previous layer.

**Detect:** `apt-get install` without `rm -rf /var/lib/apt/lists/*` in the same RUN. Similar for pip, apk, yum caches.

### L04 -- Large base image when slim/alpine available

**Severity:** info

Full distribution images (ubuntu, debian, node, python without slim/alpine suffix) are significantly larger than their minimal counterparts. Unless you need specific tools from the full image, prefer slim or alpine variants.

**Detect:** FROM using a full image (e.g., `node:20`, `python:3.12`, `ubuntu:22.04`) when `-slim` or `-alpine` variants exist.

### L05 -- Not using multi-stage build for compiled languages

**Severity:** info

For Go, Rust, Java, C/C++, and TypeScript projects, the compiler and build tools should not be in the production image. Multi-stage builds separate the build environment from the runtime.

**Detect:** Single FROM with build tools (gcc, go, javac, tsc, cargo) and application artifacts in the same image.

### L06 -- COPY entire context without .dockerignore

**Severity:** warning

`COPY . .` without a `.dockerignore` sends everything (node_modules, .git, build artifacts, test data) into the build context and potentially into the image.

**Detect:** `COPY . .` or `COPY . /app` and no `.dockerignore` file exists in the project.

---

## Category C: Anti-Patterns

### A01 -- Using ADD when COPY would suffice

**Severity:** warning

ADD has implicit behavior (auto-extracts tars, supports URLs) that makes the build less predictable. Use COPY for straightforward file copying. Reserve ADD only for tar extraction or remote URLs with checksums.

**Detect:** `ADD` where the source is a local file or directory (not a URL, not a tar).

### A02 -- cd in RUN instead of WORKDIR

**Severity:** warning

`RUN cd /app && ...` does not persist the directory change for subsequent instructions. WORKDIR sets the directory for all following instructions and is self-documenting.

**Detect:** `RUN cd` in any instruction.

### A03 -- Relative WORKDIR paths

**Severity:** warning

Relative WORKDIR paths depend on the previous WORKDIR and are hard to reason about. Always use absolute paths.

**Detect:** `WORKDIR` without a leading `/`.

### A04 -- Shell form CMD/ENTRYPOINT

**Severity:** warning

Shell form (`CMD command arg1 arg2`) runs via `/bin/sh -c`, which means the process does not receive SIGTERM directly (PID 1 is the shell, not your process). Exec form (`CMD ["command", "arg1"]`) runs the process directly.

**Detect:** `CMD` or `ENTRYPOINT` not using JSON array syntax.

### A05 -- Multiple CMD or ENTRYPOINT instructions

**Severity:** warning

Only the last CMD/ENTRYPOINT takes effect. Multiple entries are usually a mistake or indicate confusion about how these instructions work.

**Detect:** More than one `CMD` or more than one `ENTRYPOINT` instruction.

### A06 -- Missing .dockerignore

**Severity:** warning

Without .dockerignore, the entire build context (including .git, node_modules, build artifacts, secrets) is sent to the Docker daemon, slowing builds and risking accidental inclusion of sensitive files.

**Detect:** No `.dockerignore` file in the same directory as the Dockerfile or project root.

### A07 -- apt-get update and install in separate RUN

**Severity:** warning

If `apt-get update` is in a separate RUN, Docker may cache that layer and skip the update in future builds, leading to stale package indexes and failed installs.

**Detect:** `RUN apt-get update` as a standalone instruction, with `apt-get install` in a different RUN.

### A08 -- Unsorted multi-line package lists

**Severity:** info

Sorting packages alphabetically in multi-line `apt-get install` makes diffs cleaner and duplicates easier to spot.

**Detect:** Multi-line `apt-get install` with packages not in alphabetical order.

### A09 -- No LABEL metadata

**Severity:** info

LABELs provide image metadata (maintainer, version, description) that helps with image management and tooling integration.

**Detect:** No `LABEL` instruction in the Dockerfile.

### A10 -- Deprecated MAINTAINER instruction

**Severity:** info

MAINTAINER is deprecated. Use `LABEL maintainer="name <email>"` instead.

**Detect:** `MAINTAINER` instruction present.
