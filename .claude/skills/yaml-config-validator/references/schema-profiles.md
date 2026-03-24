# YAML Config Validator -- Schema Profiles

Required fields, structural rules, and common schema expectations for each supported config type.

---

## Kubernetes Manifests

**Detection:** `apiVersion` and `kind` fields present at root level.

### Required Fields (all resource types)

| Field | Required | Notes |
|-------|----------|-------|
| `apiVersion` | yes | Must be a valid API group/version |
| `kind` | yes | Must match a known resource kind |
| `metadata` | yes | Must be a mapping |
| `metadata.name` | yes | Must be a non-empty string |

### Per-Kind Required Fields

**Deployment / StatefulSet / DaemonSet:**
| Field | Required | Notes |
|-------|----------|-------|
| `spec.selector.matchLabels` | yes | Must match `spec.template.metadata.labels` |
| `spec.template.spec.containers` | yes | Must be a non-empty list |
| `spec.template.spec.containers[].image` | yes | Each container needs an image |
| `spec.template.spec.containers[].name` | yes | Each container needs a name |

**Service:**
| Field | Required | Notes |
|-------|----------|-------|
| `spec.selector` | yes (usually) | Must match pod labels |
| `spec.ports` | yes | Must be a non-empty list |
| `spec.ports[].port` | yes | Must be an integer |

**ConfigMap:**
| Field | Required | Notes |
|-------|----------|-------|
| `data` or `binaryData` | one required | At least one must be present |

**Secret:**
| Field | Required | Notes |
|-------|----------|-------|
| `type` | recommended | Defaults to `Opaque` |
| `data` or `stringData` | one required | At least one must be present |

**Ingress:**
| Field | Required | Notes |
|-------|----------|-------|
| `spec.rules` | yes | Must be a non-empty list |
| `spec.rules[].http.paths` | yes | Each rule needs paths |

### Security Best Practices (Kubernetes)

Flag as warning when missing:
- `securityContext` on pod or container spec
- `resources.limits` and `resources.requests` on containers
- `readOnlyRootFilesystem: true`
- `runAsNonRoot: true`
- Network policies for the namespace

---

## Docker Compose

**Detection:** `services` key at root level. May have `version` key (deprecated in Compose v2+).

### Required Fields

| Field | Required | Notes |
|-------|----------|-------|
| `services` | yes | Must be a non-empty mapping |
| `services.<name>.image` or `services.<name>.build` | one required | Each service needs either |

### Per-Service Expected Fields

| Field | Expected | Notes |
|-------|----------|-------|
| `ports` | common | List of port mappings |
| `environment` or `env_file` | common | List or mapping of env vars |
| `volumes` | common | List of volume mounts |
| `depends_on` | optional | Service dependency ordering |
| `restart` | recommended | Restart policy for production |
| `healthcheck` | recommended | Health monitoring |

### Structural Rules

- `ports` must be a list, each entry a string (`"8080:80"`) or mapping
- `environment` can be a list (`- KEY=val`) or mapping (`KEY: val`) but not mixed
- `volumes` entries should reference defined named volumes or use bind mount syntax
- Named volumes referenced in services must be declared in top-level `volumes` key
- Networks referenced in services must be declared in top-level `networks` key

---

## GitHub Actions Workflows

**Detection:** File path under `.github/workflows/`; has `on` and `jobs` keys.

### Required Fields

| Field | Required | Notes |
|-------|----------|-------|
| `name` | recommended | Workflow display name |
| `on` | yes | Trigger event(s) |
| `jobs` | yes | Must be a non-empty mapping |
| `jobs.<id>.runs-on` | yes | Runner specification |
| `jobs.<id>.steps` | yes | Must be a non-empty list |

### Per-Step Expected Fields

Each step must have at least one of:
- `uses` -- references a reusable action
- `run` -- shell command(s) to execute

Optional but common:
- `name` -- step display name (recommended for readability)
- `with` -- input parameters for `uses` steps
- `env` -- environment variables for `run` steps
- `if` -- conditional execution

### Structural Rules

- `on` can be a string, list, or mapping (all valid)
- `runs-on` must be a string or list of strings
- `uses` values should pin to a SHA or tag, not `@main` or `@master` (security concern)
- `secrets` context usage should reference repository or environment secrets, not hardcoded values

---

## GitLab CI

**Detection:** Filename `.gitlab-ci.yml`; has `stages` key or jobs with `script` key.

### Required Fields

| Field | Required | Notes |
|-------|----------|-------|
| `stages` | recommended | List of pipeline stages |
| `<job>.script` | yes | Every job must have a script |

### Per-Job Expected Fields

| Field | Expected | Notes |
|-------|----------|-------|
| `stage` | recommended | Which stage the job belongs to |
| `image` | optional | Docker image for the job |
| `only` / `rules` | recommended | When to run the job |
| `artifacts` | optional | Files to pass between jobs |

### Structural Rules

- Jobs cannot be named with reserved words: `image`, `services`, `stages`, `before_script`, `after_script`, `variables`, `cache`, `include`, `default`, `workflow`, `pages`
- `script` must be a string or list of strings
- `stage` values must match entries in the `stages` list

---

## Ansible Playbooks

**Detection:** Root-level list with entries containing `hosts` and `tasks`, or a list of task mappings with `name` keys.

### Required Fields (Playbook)

| Field | Required | Notes |
|-------|----------|-------|
| `hosts` | yes | Target hosts/groups |
| `tasks` | yes (usually) | List of tasks, unless using `roles` |

### Per-Task Required Fields

| Field | Required | Notes |
|-------|----------|-------|
| `name` | recommended | Human-readable task description |
| module key | yes | At least one module (e.g., `copy`, `template`, `command`) |

---

## Helm Values Files

**Detection:** Filename matching `values.yaml`, `values-*.yaml`, or `values.*.yaml`.

### Validation Approach

Helm values files have no universal schema -- their structure depends on the chart. Validation focuses on:

- Structural correctness (valid YAML)
- Security checks (no plaintext secrets)
- Anti-pattern detection (hardcoded IPs, deep nesting)
- Cross-reference with `Chart.yaml` if present in the same directory
- Consistency with `values.schema.json` if present

---

## Generic YAML

For files that do not match any specific type, apply:

- All syntax checks (SY01-SY08)
- All security checks (SE01-SE10)
- All anti-pattern checks (AP01-AP08)
- No schema-specific required field checks
