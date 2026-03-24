# SQL Query Analyzer -- Research Notes

## Sources Consulted

1. **GitHub: boralp/sql-anti-patterns** -- Comprehensive catalog of SQL anti-patterns across logical design, physical design, query construction, and application development. Key patterns incorporated: SELECT *, ORDER BY RAND(), spaghetti queries, excessive JOINs, redundant DISTINCT, HAVING misuse, nested subqueries, OR overuse.

2. **MSSQLTips: SQL Server Anti-Patterns** -- Extended Events for detecting anti-patterns in production. Informed the implicit type conversion checks (P06) and function-on-indexed-column checks (P05).

3. **MSSQLTips: Implicit Conversions** -- Detailed analysis of how implicit type conversion prevents index seeks and forces scans. Informed checks P06 and J03.

4. **Slicker.me: SQL Anti-Patterns and How to Fix Them** -- Practical guide covering SELECT *, missing indexes, N+1, unbounded queries. Reinforced check severity assignments.

5. **SQLFingers: Missing Indexes 2025 Edition** -- Methodology for identifying missing index opportunities from query patterns without requiring EXPLAIN output.

## Key Design Decisions

### Static Analysis Only
This skill performs static analysis of SQL text. It does NOT execute queries or connect to databases. Index recommendations are inferred from query patterns (WHERE, JOIN, ORDER BY columns) rather than from execution plans. If the user provides EXPLAIN output, the skill incorporates it.

### N+1 Detection Strategy
N+1 detection requires analyzing application code structure, not just SQL. The skill looks for:
- Queries inside loop bodies (for, while, forEach, map)
- ORM lazy-loading patterns (.load(), accessing relations without include/eager)
- Sequential single-row fetches that could be batched

### Severity Calibration
- **Critical**: Issues that cause full table scans, unbounded result sets, or security risks (injection). These can take down production.
- **Warning**: Issues that degrade performance but do not cause catastrophic failure. Fixable with moderate effort.
- **Info**: Stylistic or minor efficiency improvements. Good practice but not urgent.

### Database Engine Neutrality
Checks are written to apply across PostgreSQL, MySQL, SQLite, and SQL Server. Engine-specific recommendations (e.g., PostgreSQL partial indexes, MySQL covering indexes) are noted when the engine is identified.

## Patterns Not Included (and Why)

- **Schema design issues** (normalization, EAV pattern): Out of scope -- this is a query analyzer, not a schema auditor.
- **Query plan analysis**: Requires database access. The skill works with static text only.
- **Transaction isolation concerns**: Runtime behavior, not statically detectable from query text.
- **Connection pooling issues**: Application infrastructure, not query-level.
