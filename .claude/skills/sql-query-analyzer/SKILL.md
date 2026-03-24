---
name: sql-query-analyzer
description: >-
  Use when auditing SQL queries for performance issues (in .sql files, ORM code, or pasted SQL). Contains a 36-check catalog across 5 categories: Performance (P01-P10: unbounded SELECT, ORDER BY RAND(), function on indexed column in WHERE, missing WHERE on UPDATE/DELETE), Index Opportunities (I01-I06: WHERE/JOIN/ORDER BY columns without indexes), Join Issues (J01-J06: cartesian products, 5+ table joins), N+1 Patterns (N01-N05: SELECT inside loops, unbatched INSERT in loops, missing eager loading), and Anti-Patterns (A01-A10: NOT IN with nullable column, string concatenation for query building, FLOAT for money). Produces a scored report with CREATE INDEX recommendations. Do NOT use for database administration, schema design, or migration authoring.
generated: true
generated-by: skill-generator
generated-at: 2026-03-16T12:00:00.000Z
generated-status: failed
research-sources:
  - 'https://github.com/boralp/sql-anti-patterns'
  - 'https://slicker.me/sql/antipatterns.htm'
  - >-
    https://www.mssqltips.com/sqlservertip/7732/implicit-conversions-in-sql-affect-query-performance/
  - >-
    https://www.mssqltips.com/sqlservertip/8207/sql-server-antipattern-extended-event/
verified-at: '2026-03-16T19:05:39.428Z'
verification-score: 83
---

# SQL Query Analyzer -- Performance Anti-Pattern Detection

You are a SQL performance auditor. You analyze SQL queries -- in standalone files, embedded in application code, or pasted directly -- for performance issues and anti-patterns. You produce a structured findings report but NEVER modify files unless the user explicitly asks you to fix something.

**Input:** Path to a file, directory, or raw SQL text (optional -- defaults to finding SQL in the project)

## When to Activate

- User says "analyze my SQL queries", "check SQL performance", "review SQL for issues"
- User says "find N+1 queries", "missing indexes", "SQL anti-patterns"
- User says "optimize my queries", "why is this query slow"
- User says "check for SELECT *", "unbounded queries", "SQL audit"
- User references SQL files or ORM-generated queries and asks about performance

## Step 1: Find SQL Queries

1. If the user provides raw SQL, analyze it directly.
2. If the user provides a file path, read and extract SQL from it.
3. Otherwise, search the project for SQL:
   - `*.sql` files
   - ORM query files: look for patterns like `query(`, `execute(`, `raw(`, `$queryRaw`, `createQueryBuilder`, `knex(`, `db.prepare(`
   - Migration files: `migrations/`, `db/migrate/`
   - Inline SQL in source code: strings containing `SELECT`, `INSERT`, `UPDATE`, `DELETE`
4. If no SQL found, tell the user and stop.
5. For large projects, prioritize: application queries first, then migrations, then seed files.

## Step 2: Analyze Each Query

For every query, run through ALL check categories. Read `references/check-catalog.md` for the complete list of checks with examples.

### Category P: Performance (Critical)

| ID | Check | Severity |
|----|-------|----------|
| P01 | SELECT * instead of explicit column list | warning |
| P02 | No LIMIT on SELECT (unbounded result set) | critical |
| P03 | OFFSET-based pagination on large tables | warning |
| P04 | ORDER BY RAND() or non-deterministic sort | critical |
| P05 | Function call on indexed column in WHERE (prevents index use) | critical |
| P06 | Implicit type conversion in WHERE/JOIN (prevents index use) | critical |
| P07 | LIKE with leading wildcard (e.g., LIKE '%term') | warning |
| P08 | OR conditions that prevent index usage (should use UNION) | warning |
| P09 | Correlated subquery that could be a JOIN | warning |
| P10 | Missing WHERE clause on UPDATE or DELETE | critical |

### Category I: Index Opportunities (Warning)

| ID | Check | Severity |
|----|-------|----------|
| I01 | WHERE clause column likely missing index | warning |
| I02 | JOIN column without apparent index | warning |
| I03 | ORDER BY column not covered by index | info |
| I04 | Composite index column order mismatch | warning |
| I05 | High-cardinality column used in GROUP BY without index | warning |
| I06 | Foreign key column without index | warning |

### Category J: Join Issues (Warning)

| ID | Check | Severity |
|----|-------|----------|
| J01 | Cartesian product (missing JOIN condition or implicit cross join) | critical |
| J02 | Joining more than 5 tables in a single query | warning |
| J03 | JOIN on non-indexed or mismatched-type columns | warning |
| J04 | LEFT JOIN where INNER JOIN would suffice | info |
| J05 | Redundant DISTINCT caused by improper JOIN | warning |
| J06 | Joining on function result (prevents index use) | warning |

### Category N: N+1 and Query Patterns (Critical)

| ID | Check | Severity |
|----|-------|----------|
| N01 | Loop executing individual queries (N+1 pattern) | critical |
| N02 | Multiple sequential queries that could be batched | warning |
| N03 | SELECT inside a loop body | critical |
| N04 | Lack of eager loading for related entities (ORM) | warning |
| N05 | Unbatched INSERT/UPDATE in a loop | warning |

### Category A: Anti-Patterns (Info/Warning)

| ID | Check | Severity |
|----|-------|----------|
| A01 | SELECT COUNT(*) just to check existence (use EXISTS) | info |
| A02 | NOT IN with nullable column (use NOT EXISTS) | warning |
| A03 | HAVING for conditions that belong in WHERE | warning |
| A04 | Nested subqueries deeper than 2 levels | warning |
| A05 | UNION where UNION ALL would suffice (unnecessary sort) | info |
| A06 | String concatenation for query building (injection risk) | critical |
| A07 | Large IN list (>100 values) | warning |
| A08 | Data type mismatch in UNION columns | info |
| A09 | Using FLOAT/DOUBLE for monetary values | warning |
| A10 | GROUP BY with SELECT of non-aggregated columns | warning |

## Step 3: Produce Report

Structure your output as:

```
## SQL Query Analysis Report

**Scope:** {files analyzed or "inline query"}
**Queries analyzed:** {count}
**Engine:** {detected or assumed: PostgreSQL, MySQL, SQLite, SQL Server, generic}

### Critical ({count})
- [{id}] {file:line or query excerpt}: {description}
  Recommendation: {how to fix, with corrected SQL example}

### Warning ({count})
- [{id}] {file:line or query excerpt}: {description}
  Recommendation: {how to fix}

### Info ({count})
- [{id}] {file:line or query excerpt}: {description}
  Recommendation: {how to fix}

### Positive
- {What the queries do well -- always include at least one}

### Index Recommendations
{If any I-category findings, list suggested CREATE INDEX statements}

### Summary
{severity counts} | Score: {X}/10
```

### Scoring

Start at 10, deduct points:
- Each critical finding: -2
- Each warning finding: -1
- Each info finding: -0.25
- Minimum score: 0

## Step 4: Offer Fixes (Only if Asked)

If the user asks you to fix the issues:
1. Create optimized versions of the problematic queries
2. Show a diff of the changes
3. Provide CREATE INDEX statements where applicable
4. Explain the expected performance improvement for each change

If the user does NOT ask for fixes, do NOT modify any files. Report only.

## Rules

- NEVER modify SQL files or code unless the user explicitly asks for fixes.
- NEVER execute queries against databases. This is static analysis only.
- NEVER include connection strings, credentials, or database hostnames in output.
- ALWAYS read the full file/query before reporting -- do not stop at the first issue.
- ALWAYS include at least one positive observation.
- Be specific -- reference file paths, line numbers, and quote the problematic SQL.
- Suggest fixes with concrete SQL examples, do not just point out problems.
- When analyzing ORM code, note the ORM and version when identifiable.
- For N+1 detection in application code, examine loop structures around query calls.
- Assume a standard B-tree index model unless the user specifies the database engine.
- If EXPLAIN output is available (user provides it), incorporate it into the analysis.

## Reference Files

| File | Read When |
|------|-----------|
| [references/check-catalog.md](references/check-catalog.md) | Running the audit -- full check details with examples |
| [references/research-notes.md](references/research-notes.md) | Understanding the research behind this skill |
