# env-config-validator -- Research Notes

## Sources Consulted

- [dotenv-linter](https://github.com/dotenv-linter/dotenv-linter) -- Rust-based .env linter with 14 syntax/format checks
- [dotenv-safe](https://www.npmjs.com/package/dotenv-safe) -- Validates .env against .env.example for missing variables
- [Dotenv Security Docs](https://www.dotenv.org/docs/security/env.html) -- Official dotenv security guidance
- [dotenvx](https://dotenvx.com/) -- Encrypted .env with ECIES, successor to dotenv
- [Acunetix .env Vulnerability](https://www.acunetix.com/vulnerabilities/web/dotenv-env-file/) -- .env exposure as a web vulnerability
- [Common .env Mistakes (Medium)](https://medium.com/byte-of-knowledge/common-mistakes-developers-make-with-env-files-1dbd72272eba)
- [Doppler: Triumph and Tragedy of .env Files](https://www.doppler.com/blog/the-triumph-and-tragedy-of-env-files)

## Key Findings

### Format Issues (from dotenv-linter)
- Duplicated keys
- Ending/extra blank lines
- Incorrect delimiter (not `=`)
- Key without value
- Leading invalid characters
- Lowercase keys (convention is UPPER_SNAKE_CASE)
- Quote character issues (mixed quoting, unclosed quotes)
- Space around delimiter (`KEY = value` vs `KEY=value`)
- Substitution key validation (`${VAR}` references)
- Trailing whitespace
- Unordered keys (optional, stylistic)

### Security Concerns
- .env files are plaintext with no access audit trail
- Bots continuously scan for exposed .env files in public webroots and S3 buckets
- .env files should never be committed to version control
- Production should use proper secrets management (Kubernetes secrets, AWS Parameter Store, Azure Key Vault, etc.)
- File permissions should be restrictive (chmod 600)

### .env.example Pattern
- Committed to repo as a template listing all required variables
- Contains placeholder values, never real secrets
- dotenv-safe reads .env.example to validate that all required vars are defined in .env
- Discrepancies between .env and .env.example indicate either missing config or stale templates

### Insecure Defaults
- Weak passwords: "password", "123456", "admin", "changeme", "test", "default"
- Debug/development flags left enabled: DEBUG=true, NODE_ENV=development
- Overly permissive CORS: CORS_ORIGIN=*
- Unencrypted protocols: URLs starting with http:// for databases or APIs
- Default ports exposed without override
- Empty secret/token values that disable authentication

### Cross-Environment Consistency
- Inconsistent naming across environments (DB_USER vs DATABASE_USER)
- Missing environment-specific overrides
- Variables defined in one .env variant but not others (.env.development vs .env.production)
