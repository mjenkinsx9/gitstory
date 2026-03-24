# YAML Config Validator -- Full Check Catalog

Detailed descriptions, rationale, and examples for every check.

---

## Category A: Syntax

### SY01 -- Invalid YAML syntax (parse failure)

**Severity:** critical

The file cannot be parsed as valid YAML. This blocks all further structural and schema checks.

**Common causes:**
- Unmatched quotes or brackets
- Invalid escape sequences
- Malformed flow collections
- Invalid characters (BOM, null bytes, control characters)

**Bad:**
```yaml
services:
  web:
    image: nginx
    ports:
      - "80:80"
      - "443:443
    environment:
      - FOO=bar
```
The unclosed quote on the `443:443` line causes a parse failure.

**Good:**
```yaml
services:
  web:
    image: nginx
    ports:
      - "80:80"
      - "443:443"
    environment:
      - FOO=bar
```

### SY02 -- Tab characters used for indentation

**Severity:** critical

YAML strictly forbids tabs for indentation. Tabs cause parse errors that can be difficult to diagnose because they are visually indistinguishable from spaces in many editors.

**Detect:** Any tab character (`\t`) at the beginning of a line.

**Fix:** Replace all tabs with spaces (typically 2 spaces per indentation level). Configure your editor to use spaces for YAML files.

### SY03 -- Inconsistent indentation levels

**Severity:** warning

Mixing 2-space and 4-space indentation within the same file, or using odd-numbered indentation, creates fragile structure that is easy to break during editing. While YAML permits variable indentation, consistency prevents errors.

**Bad:**
```yaml
services:
  web:
      image: nginx
      ports:
        - "80:80"
    environment:
      FOO: bar
```

**Good:**
```yaml
services:
  web:
    image: nginx
    ports:
      - "80:80"
    environment:
      FOO: bar
```

### SY04 -- Trailing whitespace

**Severity:** info

Trailing spaces can cause diff noise and occasionally affect multiline string values. While not a parse error, they indicate sloppy editing.

**Detect:** Whitespace characters before the newline at the end of any line.

### SY05 -- Missing space after colon

**Severity:** critical

In YAML block style, `key:value` (no space) is parsed as a single string `"key:value"`, not as a key-value pair. This is a frequent source of silent misconfiguration.

**Bad:**
```yaml
database:
  host:localhost
  port:5432
```
Both `host:localhost` and `port:5432` are parsed as string values, not mappings.

**Good:**
```yaml
database:
  host: localhost
  port: 5432
```

### SY06 -- Unquoted special values (boolean trap)

**Severity:** warning

YAML 1.1 treats `yes`, `no`, `on`, `off`, `true`, `false` (case-insensitive) as booleans. Country codes like `NO` (Norway), `OFF` states, and other legitimate string values get silently converted.

**Bad:**
```yaml
countries:
  - US
  - GB
  - NO    # Parsed as boolean false!
  - FR

features:
  logging: on    # Parsed as boolean true, not string "on"
```

**Good:**
```yaml
countries:
  - US
  - GB
  - "NO"
  - FR

features:
  logging: "on"
```

### SY07 -- Duplicate keys

**Severity:** critical

YAML parsers handle duplicate keys inconsistently -- most silently use the last value, discarding earlier ones. This masks configuration that the author intended to be active.

**Bad:**
```yaml
database:
  host: primary-db.example.com
  port: 5432
  host: replica-db.example.com    # Silently overrides the first host
```

**Good:**
```yaml
database:
  primary_host: primary-db.example.com
  replica_host: replica-db.example.com
  port: 5432
```

### SY08 -- Incorrect multiline string syntax

**Severity:** warning

Confusion between `|` (literal block, preserves newlines) and `>` (folded block, joins lines with spaces) leads to unexpected string content. Trailing newline behavior (`|+`, `|-`, `>+`, `>-`) is another common source of bugs.

**Detect:** Multiline string indicators followed by content that suggests the wrong mode was chosen (e.g., a shell script using `>` instead of `|`).

---

## Category B: Security

### SE01 -- Plaintext passwords

**Severity:** critical

Passwords stored in plaintext in configuration files are exposed to anyone with read access to the repository or deployment artifact. Git history preserves them even after removal.

**Detect:** Keys matching patterns: `password`, `passwd`, `pwd`, `pass`, `db_password`, `mysql_password`, `postgres_password`, `redis_password`, `admin_password`, `root_password`, `user_password`, `login_password`.

Also detect values that follow common password patterns when associated with authentication-related keys.

**Bad:**
```yaml
database:
  host: db.example.com
  username: admin
  password: SuperSecret123!

redis:
  url: redis://:mysecretpassword@redis.example.com:6379
```

**Good:**
```yaml
database:
  host: db.example.com
  username: admin
  password: ${DB_PASSWORD}    # Injected at runtime

redis:
  url: ${REDIS_URL}    # Full URL from secrets manager
```

### SE02 -- API keys or tokens

**Severity:** critical

API keys, access tokens, and authentication tokens grant programmatic access to services. Exposed keys are frequently scraped from public repositories by automated bots.

**Detect:** Keys matching patterns: `api_key`, `apikey`, `api-key`, `token`, `auth_token`, `access_token`, `bearer_token`, `secret_key`, `secret`, `private_key`, `signing_key`, `encryption_key`, `client_secret`, `app_secret`, `webhook_secret`.

Also detect values that match known key formats:
- AWS: `AKIA[0-9A-Z]{16}`
- GitHub: `ghp_[a-zA-Z0-9]{36}`, `gho_`, `ghu_`, `ghs_`, `ghr_`
- Slack: `xoxb-`, `xoxp-`, `xoxo-`, `xapp-`
- Stripe: `sk_live_`, `pk_live_`, `rk_live_`
- Generic long hex/base64: 32+ character strings of `[a-f0-9]` or base64

**Bad** (do not include literal secrets -- examples shown as descriptions):
- `bot_token` set to a literal Slack token value (starts with the `xoxb-` prefix)
- `access_key_id` set to a literal AWS access key (starts with the `AKIA` prefix)
- `secret_access_key` set to a literal AWS secret key

**Good:**
```yaml
slack:
  bot_token: ${SLACK_BOT_TOKEN}
  webhook_url: ${SLACK_WEBHOOK_URL}

aws:
  # Credentials managed via IAM roles, not static keys
  region: us-east-1
```

### SE03 -- Inline private keys or certificates

**Severity:** critical

Private keys embedded directly in YAML files are fully exposed. Even if the repository is private, the key is stored in plaintext in git history, CI logs, and any system that processes the config.

**Detect:** Values containing PEM-encoded block headers. Look for the standard
`-----BEGIN <type>-----` envelope where `<type>` is one of:
- `RSA PRIVATE KEY`
- `EC PRIVATE KEY`
- `PRIVATE KEY`
- `OPENSSH PRIVATE KEY`
- `PGP PRIVATE KEY BLOCK`
- `CERTIFICATE` (warning, not critical -- certs are public, but may indicate keys nearby)

**Good practice:** Reference key files by path or use secrets management:
```yaml
tls:
  cert_file: /etc/ssl/certs/server.crt
  key_file: /etc/ssl/private/server.key    # File permissions restrict access
```

### SE04 -- Database connection strings with credentials

**Severity:** critical

Connection strings often embed usernames and passwords inline. These are easy to miss in review because they look like opaque URLs.

**Detect:** Values matching URI patterns with embedded credentials:
- `postgresql://user:pass@host`
- `mysql://user:pass@host`
- `mongodb://user:pass@host`
- `redis://:pass@host`
- `amqp://user:pass@host`

### SE05 -- Cloud provider credentials

**Severity:** critical

Static cloud credentials (AWS access keys, GCP service account keys, Azure client secrets) are high-value targets. A leaked AWS key can be exploited within minutes by automated scanners.

**Detect:**
- AWS: Keys matching `AKIA[0-9A-Z]{16}` or keys named `aws_access_key_id`, `aws_secret_access_key`
- GCP: `type: service_account` with `private_key` field, or `private_key_id`
- Azure: `client_secret`, `tenant_id` + `client_id` combination with a secret value

### SE06 -- High-entropy strings

**Severity:** warning

Long random-looking strings in configuration values may be secrets even if their key name does not match known patterns. Entropy analysis flags these for human review.

**Detect:** String values that are:
- 20+ characters long
- Consist primarily of alphanumeric characters with no dictionary words
- Have high Shannon entropy (> 4.5 bits per character)
- Are not file paths, URLs, or known non-secret formats (UUIDs, hashes used as identifiers)

### SE07 -- Unencrypted secrets not using secrets manager

**Severity:** warning

Values that appear to be secrets but are not referencing an external secrets manager (Vault, AWS Secrets Manager, SOPS, sealed-secrets) suggest the secret lifecycle is not properly managed.

**Detect:** Secret-named keys with literal values that are not environment variable references (`${VAR}`), Vault references (`vault:secret/path`), or SOPS-encrypted markers.

### SE08 -- Overly permissive RBAC / IAM roles

**Severity:** warning

Wildcard permissions (`*`) in RBAC rules, IAM policies, or security group configurations grant far more access than needed, violating least-privilege.

**Detect:**
- Kubernetes: `resources: ["*"]` or `verbs: ["*"]` in RBAC
- AWS IAM: `"Action": "*"` or `"Resource": "*"`
- Generic: any permission field with `*` as its sole value

### SE09 -- Containers running as root or privileged

**Severity:** warning

Container security contexts that run as root (UID 0) or in privileged mode bypass container isolation. This is the Kubernetes equivalent of Dockerfile S01.

**Detect:**
- `runAsUser: 0`
- `privileged: true`
- `allowPrivilegeEscalation: true`
- Missing `securityContext` on pod or container specs

### SE10 -- Disabled security features

**Severity:** warning

Configuration that explicitly disables security features (TLS verification, authentication, debug mode) is dangerous if deployed to production.

**Detect:**
- `tls_verify: false`, `ssl_verify: false`, `verify_ssl: false`, `insecure: true`
- `debug: true`, `DEBUG: true`, `debug_mode: true`
- `auth_enabled: false`, `authentication: disabled`, `require_auth: false`

---

## Category C: Schema / Required Fields

### SC01 -- Missing required fields

**Severity:** warning

Each config type has required fields without which the configuration is invalid or incomplete. See `references/schema-profiles.md` for per-type requirements.

### SC02 -- Unknown or misspelled top-level keys

**Severity:** warning

Keys that are close to but do not match known schema keys may be typos. For example, `sevices` instead of `services` in Docker Compose, or `apiVersoin` instead of `apiVersion` in Kubernetes.

**Detect:** Levenshtein distance <= 2 from a known key for the detected config type.

### SC03 -- Wrong value type

**Severity:** warning

A field expects a list but receives a string, or expects a mapping but receives a scalar. Common in ports, environment variables, and volume definitions.

**Bad:**
```yaml
services:
  web:
    ports: "80:80"    # Should be a list
    environment: FOO=bar    # Should be a list or mapping
```

**Good:**
```yaml
services:
  web:
    ports:
      - "80:80"
    environment:
      - FOO=bar
```

### SC04 -- Empty required sections

**Severity:** warning

A required section exists but is empty (null), meaning the configuration declares intent but provides no content.

**Detect:** Required mapping or sequence keys with `null`, `~`, or no value.

### SC05 -- Missing or deprecated version field

**Severity:** info

Some config formats have deprecated their version field (Docker Compose v2+) or require it (older Compose, some Helm charts). Flag when relevant.

### SC06 -- Undefined anchor references

**Severity:** critical

Using `*anchor_name` when no `&anchor_name` is defined causes a parse error. This often happens after refactoring when an anchor is removed but its references remain.

---

## Category D: Anti-Patterns

### AP01 -- Deep nesting (more than 5 levels)

**Severity:** info

Deeply nested YAML is hard to read and maintain. Consider flattening the structure or breaking it into separate files.

### AP02 -- Very long lines

**Severity:** info

Lines over 200 characters are hard to review in diffs and may indicate inline data that should be in a separate file.

### AP03 -- Hardcoded environment-specific values

**Severity:** warning

IP addresses, hostnames, ports, and URLs that are specific to a particular environment (dev, staging, prod) should be parameterized, not hardcoded.

**Detect:** Values matching:
- IPv4 addresses (except `127.0.0.1`, `0.0.0.0`, `localhost`)
- Internal hostnames (containing `.internal`, `.local`, `.corp`)
- Non-standard ports in URLs

### AP04 -- Commented-out configuration blocks

**Severity:** info

Large blocks of commented-out YAML (3+ consecutive comment lines that look like valid YAML) suggest dead configuration that should be removed or managed via version control instead.

### AP05 -- Inconsistent naming convention

**Severity:** info

Mixing `camelCase`, `snake_case`, `kebab-case`, and `PascalCase` for keys within the same file reduces readability. Conventions should be consistent (YAML community convention favors `snake_case`).

### AP06 -- Missing comments on non-obvious values

**Severity:** info

Magic numbers, non-default timeouts, or unusual configuration values without explanatory comments create maintenance burden.

### AP07 -- Unused anchors

**Severity:** warning

An anchor (`&name`) defined but never referenced (`*name`) is dead code that adds confusion.

### AP08 -- Overly broad glob patterns

**Severity:** warning

Glob patterns like `*`, `**/*`, or `*.*` in include/exclude sections may inadvertently match far more than intended.
