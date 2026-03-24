# env-config-validator -- Full Check Catalog

Detailed descriptions, rationale, and examples for every check.

---

## Category A: Completeness (Missing Variables)

### C01 -- Variables in .env.example missing from .env

**Severity:** critical

If .env.example documents a required variable and .env does not define it, the application will likely fail at runtime or use an unexpected fallback.

**Detect:** Parse both .env.example and .env, compare key sets. Report any key present in .env.example but absent from .env.

**Example finding:**
```
.env.example defines DATABASE_URL but .env does not.
```

### C02 -- Variables in .env not in .env.example

**Severity:** warning

Variables defined in .env but not documented in .env.example suggest the template is stale. New team members will miss these variables.

**Detect:** Parse both files, report keys in .env that are absent from .env.example.

### C03 -- Empty values for required-looking variables

**Severity:** warning

Variables with names suggesting they are required (DATABASE_URL, API_KEY, SECRET_KEY, etc.) but assigned empty values will cause runtime errors.

**Detect:** Look for `KEY=` (empty value) or `KEY=""` or `KEY=''` where the key name contains: URL, HOST, KEY, SECRET, TOKEN, PASSWORD, DSN, ENDPOINT, CONNECTION.

### C04 -- Multiple .env variants with inconsistent variable sets

**Severity:** warning

When .env.development, .env.staging, .env.production exist, they should all define the same set of variables (with different values). Missing variables in one environment cause environment-specific failures.

**Detect:** Collect all .env.* variant files, compare their key sets, and report variables that exist in some variants but not all.

### C05 -- Commented-out variables that appear required

**Severity:** info

Lines like `# DATABASE_URL=postgres://...` may indicate a variable was intentionally disabled or accidentally commented out. Flag for review.

**Detect:** Lines starting with `#` followed by a valid KEY=VALUE pattern where the key appears in .env.example.

---

## Category B: Security

### S01 -- Secrets committed to version control

**Severity:** critical

.env files containing secrets should never be committed to git. Check if .env is tracked by git and if .gitignore excludes it.

**Detect:** Run `git ls-files --error-unmatch .env` -- if it succeeds, the file is tracked. Also check .gitignore for `.env` patterns.

### S02 -- Weak or default secret values

**Severity:** critical

Common placeholder passwords and default secrets are frequently left in place, creating security vulnerabilities.

**Detect:** Values matching common weak patterns for keys containing PASSWORD, SECRET, KEY, TOKEN:
- Exact matches: `password`, `secret`, `changeme`, `admin`, `test`, `default`, `123456`, `12345678`, `example`, `todo`, `fixme`, `placeholder`
- Short values (under 8 characters) for keys containing SECRET, KEY, or TOKEN
- Values identical to the key name (e.g., `PASSWORD=password`)

### S03 -- Debug or development mode enabled

**Severity:** warning

Debug flags and development-mode settings left enabled indicate a configuration that should not be used in production.

**Detect:** Look for:
- `DEBUG=true`, `DEBUG=1`, `DEBUG=yes`, `DEBUG=on`
- `NODE_ENV=development`
- `FLASK_DEBUG=1`
- `RAILS_ENV=development`
- `APP_DEBUG=true`
- `LOG_LEVEL=debug` or `LOG_LEVEL=trace`

Note: Only flag these if the file is NOT explicitly a development variant (i.e., not `.env.development` or `.env.local`).

### S04 -- Overly permissive CORS or origins

**Severity:** warning

Wildcard CORS origins allow any domain to make requests to the application.

**Detect:** Keys containing CORS, ORIGIN, ALLOWED_HOSTS with values of `*` or containing `*`.

### S05 -- Unencrypted connection strings

**Severity:** warning

Database or API URLs using unencrypted protocols expose credentials and data in transit.

**Detect:** Values starting with `http://` (not `http://localhost` or `http://127.0.0.1`), `postgres://` (should be `postgresql+ssl://` or include `?sslmode=require`), `mysql://` without SSL parameters, `redis://` (should be `rediss://` for TLS), `amqp://` (should be `amqps://`).

### S06 -- API keys or tokens with high entropy

**Severity:** info

Long high-entropy strings assigned to variables with generic names may be real credentials accidentally included.

**Detect:** Values longer than 20 characters with high character diversity assigned to keys containing KEY, TOKEN, SECRET, CREDENTIAL, AUTH. Flag for human review -- do NOT echo the full value, mask it.

### S07 -- .env file has overly permissive file permissions

**Severity:** warning

.env files readable by all users on the system expose secrets to any process.

**Detect:** On Unix systems, check file permissions. Warn if group-readable or world-readable (permissions more permissive than 600).

---

## Category C: Format and Syntax

### F01 -- Incorrect delimiter

**Severity:** critical

Lines that look like variable assignments but use `:` or ` ` instead of `=` will not be parsed correctly by dotenv libraries.

**Detect:** Lines matching a pattern like `^[A-Z_]+[: ][^ ]` that are not comments.

### F02 -- Spaces around delimiter

**Severity:** warning

`KEY = value` (spaces around `=`) is not universally supported across dotenv implementations. Some parsers include the spaces in the key or value.

**Detect:** Lines matching `^[A-Z_]+ +=` or `^[A-Z_]+= +[^ ]`.

### F03 -- Lowercase variable names

**Severity:** info

Convention is UPPER_SNAKE_CASE for environment variables. Lowercase names may cause confusion or conflicts with shell builtins.

**Detect:** Keys containing lowercase letters (excluding comments and blank lines).

### F04 -- Duplicate keys

**Severity:** warning

When a key is defined multiple times, only the last definition takes effect (in most implementations). This is confusing and error-prone.

**Detect:** Count occurrences of each key; report any with count > 1.

### F05 -- Unclosed or mismatched quotes

**Severity:** critical

Values that start with a quote but do not end with the matching quote will include the quote character in the value or cause parse errors.

**Detect:** Values starting with `"` but not ending with `"`, or starting with `'` but not ending with `'`. Account for multiline values if the dotenv implementation supports them.

### F06 -- Tab characters in indentation or values

**Severity:** info

Tab characters can be invisible and cause unexpected behavior in values or confuse parsers.

**Detect:** Lines containing tab characters.

### F07 -- Trailing whitespace

**Severity:** info

Trailing whitespace on values (outside quotes) may be silently included in the value, causing subtle bugs in URL or path values.

**Detect:** Lines where the value portion ends with whitespace and is not enclosed in quotes.

### F08 -- Lines that are neither comments, blanks, nor valid assignments

**Severity:** warning

Lines that don't match the `KEY=value`, comment (`#`), or blank line pattern indicate a formatting error.

**Detect:** Non-empty, non-comment lines that do not contain `=`.

### F09 -- Inconsistent quoting style

**Severity:** info

Mixing single quotes, double quotes, and unquoted values within the same file reduces readability and may cause inconsistent variable expansion behavior.

**Detect:** Count usage of each quoting style; flag if more than one style is used.

### F10 -- BOM or non-UTF-8 encoding

**Severity:** warning

Byte Order Marks or non-UTF-8 encoding can cause invisible characters in variable names or values.

**Detect:** Check for BOM at file start (bytes `EF BB BF`) or non-ASCII characters in key names.

---

## Category D: Anti-Patterns

### A01 -- Inline comments without proper support

**Severity:** warning

`KEY=value # comment` is not universally supported. Some dotenv implementations include `# comment` as part of the value.

**Detect:** Unquoted values containing ` #` -- the space-hash pattern.

### A02 -- URL values with unescaped special characters

**Severity:** warning

Database URLs and similar values containing `@`, `#`, `%`, or other special characters in passwords may break URL parsing if not properly encoded.

**Detect:** Values that look like URLs (contain `://`) with `@` in the authority section and special characters in what appears to be the password portion.

### A03 -- Very long values without quoting

**Severity:** info

Values longer than 200 characters without quotes are fragile and hard to maintain.

**Detect:** Unquoted values exceeding 200 characters.

### A04 -- Variable references without proper syntax

**Severity:** warning

Some dotenv implementations support `${VAR}` expansion, others use `$VAR`, and some support neither. Incorrect syntax leads to literal strings instead of expanded values.

**Detect:** Values containing `$` followed by alphanumeric characters. Flag for review since expansion support varies.

### A05 -- Multiline values without proper encoding

**Severity:** warning

Multiline values require specific quoting (double quotes with `\n`) in most dotenv implementations. Unquoted multiline values will truncate at the first newline.

**Detect:** Values that appear to contain literal newline sequences (`\n`) without being double-quoted.

### A06 -- Inconsistent naming conventions

**Severity:** info

Mixing naming patterns (e.g., `DB_HOST` and `DATABASE_PORT`, or `REDIS_URL` and `CACHE_REDIS_HOST`) makes it harder to discover related variables.

**Detect:** Group variables by common prefixes; flag groups where the same service uses different prefix patterns.
