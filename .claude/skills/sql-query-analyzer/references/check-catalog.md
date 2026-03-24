# SQL Query Analyzer -- Full Check Catalog

Detailed descriptions, rationale, and examples for every check.

---

## Category P: Performance

### P01 -- SELECT * instead of explicit column list

**Severity:** warning

SELECT * retrieves all columns, including those not needed. This prevents covering index optimizations, increases network transfer, and breaks when schema changes add large columns.

**Detect:** `SELECT *` or `SELECT table.*` in any query.

**Bad:**
```sql
SELECT * FROM users WHERE active = true;
```

**Good:**
```sql
SELECT id, name, email FROM users WHERE active = true;
```

### P02 -- No LIMIT on SELECT (unbounded result set)

**Severity:** critical

A SELECT without LIMIT (or TOP, FETCH FIRST) can return millions of rows, overwhelming application memory and network. Every user-facing query should have a bound.

**Detect:** SELECT query without LIMIT, TOP, or FETCH FIRST. Exclude: subqueries used in EXISTS/IN, aggregate-only queries (SELECT COUNT), INSERT...SELECT, CREATE TABLE AS SELECT.

**Bad:**
```sql
SELECT id, name FROM orders WHERE status = 'pending';
```

**Good:**
```sql
SELECT id, name FROM orders WHERE status = 'pending' LIMIT 100;
```

### P03 -- OFFSET-based pagination on large tables

**Severity:** warning

OFFSET pagination forces the database to scan and discard rows. At high offsets (e.g., OFFSET 100000), performance degrades linearly. Use keyset/cursor pagination instead.

**Detect:** `OFFSET` with a large literal value (>1000) or a variable/parameter.

**Bad:**
```sql
SELECT * FROM products ORDER BY id LIMIT 20 OFFSET 100000;
```

**Good:**
```sql
-- Keyset pagination
SELECT * FROM products WHERE id > :last_seen_id ORDER BY id LIMIT 20;
```

### P04 -- ORDER BY RAND() or non-deterministic sort

**Severity:** critical

ORDER BY RAND() generates a random value for every row, then sorts the entire result set. This is O(n log n) on the full table with no index support.

**Detect:** `ORDER BY RAND()`, `ORDER BY RANDOM()`, `ORDER BY NEWID()`, `ORDER BY DBMS_RANDOM.VALUE`.

**Bad:**
```sql
SELECT * FROM products ORDER BY RAND() LIMIT 5;
```

**Good:**
```sql
-- Pre-select random IDs, then fetch
SELECT * FROM products WHERE id IN (
  SELECT id FROM products ORDER BY RAND() LIMIT 5
);
-- Or use a random offset approach for large tables
```

### P05 -- Function call on indexed column in WHERE

**Severity:** critical

Wrapping an indexed column in a function (UPPER, LOWER, DATE, YEAR, COALESCE, CAST) prevents the optimizer from using the index. The function must be evaluated for every row.

**Detect:** WHERE clause with function wrapping a column: `WHERE UPPER(name) = ...`, `WHERE YEAR(created_at) = ...`, `WHERE COALESCE(col, '') = ...`.

**Bad:**
```sql
SELECT * FROM users WHERE UPPER(email) = 'USER@EXAMPLE.COM';
SELECT * FROM events WHERE YEAR(created_at) = 2025;
```

**Good:**
```sql
-- Use a functional index or adjust the comparison
SELECT * FROM users WHERE email = LOWER('USER@EXAMPLE.COM');
-- Or create a functional index: CREATE INDEX idx_users_email_lower ON users(LOWER(email));

SELECT * FROM events
WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01';
```

### P06 -- Implicit type conversion in WHERE/JOIN

**Severity:** critical

Comparing columns of different types (e.g., varchar to int) forces implicit conversion on every row, preventing index seeks. The optimizer converts the column side, not the literal.

**Detect:** WHERE or JOIN comparing columns where types likely differ: string column compared to unquoted number, numeric column compared to quoted string.

**Bad:**
```sql
-- If user_id is VARCHAR
SELECT * FROM orders WHERE user_id = 12345;
```

**Good:**
```sql
SELECT * FROM orders WHERE user_id = '12345';
```

### P07 -- LIKE with leading wildcard

**Severity:** warning

A leading wildcard (LIKE '%term') forces a full table/index scan because the index is organized by prefix. Trailing wildcards (LIKE 'term%') can use the index.

**Detect:** `LIKE '%...'` or `LIKE '%...%'` patterns in WHERE clause.

**Bad:**
```sql
SELECT * FROM products WHERE name LIKE '%widget%';
```

**Good:**
```sql
-- Use full-text search for substring matching
SELECT * FROM products WHERE MATCH(name) AGAINST('widget');
-- Or use a trigram index (PostgreSQL: pg_trgm)
```

### P08 -- OR conditions that prevent index usage

**Severity:** warning

OR conditions on different columns prevent the optimizer from using a single index. Each OR branch may require a separate scan.

**Detect:** WHERE clause with OR combining conditions on different indexed columns.

**Bad:**
```sql
SELECT * FROM users WHERE email = 'a@b.com' OR phone = '555-1234';
```

**Good:**
```sql
-- Use UNION for index-friendly OR
SELECT * FROM users WHERE email = 'a@b.com'
UNION
SELECT * FROM users WHERE phone = '555-1234';
```

### P09 -- Correlated subquery that could be a JOIN

**Severity:** warning

A correlated subquery executes once per row of the outer query. If it can be rewritten as a JOIN or a derived table, the optimizer can use set-based operations.

**Detect:** Subquery in SELECT or WHERE that references a column from the outer query.

**Bad:**
```sql
SELECT u.name,
  (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count
FROM users u;
```

**Good:**
```sql
SELECT u.name, COALESCE(o.order_count, 0) AS order_count
FROM users u
LEFT JOIN (SELECT user_id, COUNT(*) AS order_count FROM orders GROUP BY user_id) o
  ON o.user_id = u.id;
```

### P10 -- Missing WHERE clause on UPDATE or DELETE

**Severity:** critical

UPDATE or DELETE without WHERE affects every row in the table. This is almost always a bug and can cause catastrophic data loss.

**Detect:** `UPDATE ... SET ...` or `DELETE FROM ...` without a WHERE clause.

**Bad:**
```sql
DELETE FROM sessions;
UPDATE users SET active = false;
```

**Good:**
```sql
DELETE FROM sessions WHERE expires_at < NOW();
UPDATE users SET active = false WHERE last_login < '2024-01-01';
```

---

## Category I: Index Opportunities

### I01 -- WHERE clause column likely missing index

**Severity:** warning

Columns used in WHERE equality or range conditions are strong candidates for indexes, especially on large tables.

**Detect:** WHERE clause filtering on a column that does not appear to have an index (inferred from schema context or naming patterns).

**Recommendation:** `CREATE INDEX idx_{table}_{column} ON {table}({column});`

### I02 -- JOIN column without apparent index

**Severity:** warning

JOIN columns should be indexed on both sides for efficient lookups. The "many" side of a one-to-many relationship especially benefits from an index on the foreign key.

**Detect:** JOIN ON clause referencing columns not known to be indexed.

**Recommendation:** `CREATE INDEX idx_{table}_{fk_column} ON {table}({fk_column});`

### I03 -- ORDER BY column not covered by index

**Severity:** info

If the ORDER BY column is not indexed, the database must sort the entire result set in memory (filesort). For large result sets, this is expensive.

**Detect:** ORDER BY on a column not known to be part of an index.

### I04 -- Composite index column order mismatch

**Severity:** warning

A composite index (a, b, c) can satisfy queries filtering on (a), (a, b), or (a, b, c) but NOT (b), (c), or (b, c). If queries filter on non-leading columns, the index is not used.

**Detect:** WHERE clause filtering on columns that are part of a composite index but not in leading position.

### I05 -- GROUP BY column without index

**Severity:** warning

GROUP BY without an index on the grouped column forces a full scan and sort. An index allows the optimizer to group by sequential reads.

**Detect:** GROUP BY on a column not known to be indexed.

### I06 -- Foreign key column without index

**Severity:** warning

Foreign key columns are used in JOINs and cascading operations. Without an index, JOINs require nested loop scans and DELETE cascades lock the child table.

**Detect:** Column named `*_id` used in a JOIN that is not known to be indexed.

---

## Category J: Join Issues

### J01 -- Cartesian product (missing JOIN condition)

**Severity:** critical

A query joining two tables without an ON condition produces a Cartesian product (rows_a x rows_b). This is almost always a mistake.

**Detect:** `FROM a, b` without a WHERE condition linking them, or `CROSS JOIN` on non-trivial tables.

**Bad:**
```sql
SELECT * FROM users, orders;
```

**Good:**
```sql
SELECT * FROM users JOIN orders ON users.id = orders.user_id;
```

### J02 -- Joining more than 5 tables

**Severity:** warning

Queries joining many tables have exponentially more execution plan options. The optimizer may choose a suboptimal plan, and the query becomes hard to reason about.

**Detect:** More than 5 JOIN clauses in a single query.

### J03 -- JOIN on mismatched types

**Severity:** warning

Joining columns of different types forces implicit conversion, preventing index use on one or both sides.

**Detect:** JOIN ON clause where column types appear to differ (e.g., INT vs VARCHAR based on naming conventions or schema context).

### J04 -- LEFT JOIN where INNER JOIN would suffice

**Severity:** info

LEFT JOIN preserves all rows from the left table even without matches. If the query's WHERE clause filters out NULLs from the right table, the LEFT JOIN is effectively an INNER JOIN but prevents certain optimizations.

**Detect:** LEFT JOIN followed by WHERE clause filtering on a column from the right table (e.g., `WHERE right_table.col IS NOT NULL` or `WHERE right_table.col = ...`).

**Bad:**
```sql
SELECT u.*, o.total
FROM users u LEFT JOIN orders o ON u.id = o.user_id
WHERE o.status = 'shipped';
```

**Good:**
```sql
SELECT u.*, o.total
FROM users u INNER JOIN orders o ON u.id = o.user_id
WHERE o.status = 'shipped';
```

### J05 -- Redundant DISTINCT caused by improper JOIN

**Severity:** warning

DISTINCT after a JOIN often indicates the JOIN is producing duplicate rows due to a one-to-many relationship. Fix the JOIN or use a subquery/aggregation instead of DISTINCT.

**Detect:** `SELECT DISTINCT` combined with a JOIN.

### J06 -- Joining on function result

**Severity:** warning

Applying a function to a JOIN column prevents index usage on that column.

**Detect:** JOIN ON clause with function wrapping a column: `ON LOWER(a.col) = LOWER(b.col)`.

---

## Category N: N+1 and Query Patterns

### N01 -- Loop executing individual queries (N+1 pattern)

**Severity:** critical

Executing a query per iteration of a loop results in N+1 total queries (1 to fetch the list, N to fetch each item's data). This is the most common ORM performance issue.

**Detect in application code:**
- SQL query string or ORM call inside a for/while/forEach/map loop body
- `.find()`, `.findOne()`, `.get()`, `.load()` inside iteration

**Bad (pseudocode):**
```
users = db.query("SELECT * FROM users")
for user in users:
    orders = db.query("SELECT * FROM orders WHERE user_id = ?", user.id)
```

**Good:**
```
users = db.query("SELECT * FROM users")
user_ids = [u.id for u in users]
orders = db.query("SELECT * FROM orders WHERE user_id IN (?)", user_ids)
```

### N02 -- Sequential queries that could be batched

**Severity:** warning

Multiple independent queries executed sequentially can often be combined into a single query with UNION ALL or a JOIN.

**Detect:** Two or more queries in sequence hitting the same table with different filter values.

### N03 -- SELECT inside a loop body

**Severity:** critical

Any SELECT statement found inside a loop body is a strong N+1 indicator, even if not immediately obvious from the query text.

**Detect:** SELECT keyword inside a for/while/forEach body in application code.

### N04 -- Missing eager loading (ORM)

**Severity:** warning

ORMs that lazy-load relations by default cause N+1 when iterating over a collection and accessing a relation. Use eager loading (include, joinedload, with, eager_load).

**Detect ORM patterns:**
- Sequelize: missing `include` in findAll
- SQLAlchemy: missing `joinedload` or `subqueryload`
- ActiveRecord: missing `.includes()` or `.eager_load()`
- Prisma: missing `include` in findMany
- TypeORM: missing `relations` option or `leftJoinAndSelect`

### N05 -- Unbatched INSERT/UPDATE in a loop

**Severity:** warning

Inserting or updating one row at a time in a loop is dramatically slower than a batch INSERT or a single UPDATE with a CASE expression.

**Bad:**
```
for item in items:
    db.execute("INSERT INTO log (msg) VALUES (?)", item.msg)
```

**Good:**
```sql
INSERT INTO log (msg) VALUES ('a'), ('b'), ('c');
```

---

## Category A: Anti-Patterns

### A01 -- COUNT(*) for existence check

**Severity:** info

SELECT COUNT(*) scans all matching rows just to check if any exist. EXISTS stops at the first match.

**Bad:**
```sql
SELECT COUNT(*) FROM orders WHERE user_id = 123;
-- Then check if count > 0 in application code
```

**Good:**
```sql
SELECT EXISTS (SELECT 1 FROM orders WHERE user_id = 123);
```

### A02 -- NOT IN with nullable column

**Severity:** warning

NOT IN returns no rows if any value in the subquery is NULL, due to three-valued logic. Use NOT EXISTS instead.

**Bad:**
```sql
SELECT * FROM users WHERE id NOT IN (SELECT user_id FROM banned);
-- If any banned.user_id is NULL, this returns zero rows
```

**Good:**
```sql
SELECT * FROM users u
WHERE NOT EXISTS (SELECT 1 FROM banned b WHERE b.user_id = u.id);
```

### A03 -- HAVING for non-aggregate conditions

**Severity:** warning

HAVING is evaluated after GROUP BY and aggregation. Non-aggregate conditions in HAVING force the database to group and aggregate rows that could have been filtered out earlier by WHERE.

**Bad:**
```sql
SELECT department, COUNT(*) FROM employees
GROUP BY department HAVING department != 'HR';
```

**Good:**
```sql
SELECT department, COUNT(*) FROM employees
WHERE department != 'HR' GROUP BY department;
```

### A04 -- Deeply nested subqueries (>2 levels)

**Severity:** warning

Subqueries nested more than 2 levels deep are hard to optimize, hard to read, and often indicate the query should be refactored using CTEs or JOINs.

**Detect:** More than 2 levels of SELECT nesting.

### A05 -- UNION where UNION ALL would suffice

**Severity:** info

UNION performs an implicit DISTINCT, which requires sorting the combined result set. If duplicates between the branches are impossible or acceptable, UNION ALL avoids the sort.

**Detect:** `UNION` (without ALL) where the branches have different WHERE conditions on the same table or different tables.

### A06 -- String concatenation for query building

**Severity:** critical

Building queries by concatenating user input creates SQL injection vulnerabilities. Use parameterized queries or prepared statements.

**Detect in application code:** String concatenation (`+`, `||`, f-strings, template literals) with a query string that includes variable interpolation.

**Bad:**
```python
query = "SELECT * FROM users WHERE name = '" + user_input + "'"
```

**Good:**
```python
query = "SELECT * FROM users WHERE name = %s"
cursor.execute(query, (user_input,))
```

### A07 -- Large IN list (>100 values)

**Severity:** warning

Very large IN lists are inefficient. The optimizer may not use indexes effectively, and the query text itself becomes large. Use a temporary table or a JOIN with a values list.

**Detect:** IN clause with more than 100 literal values.

### A08 -- Data type mismatch in UNION columns

**Severity:** info

UNION columns should have matching types. Mismatched types force implicit conversion and can produce unexpected results.

### A09 -- FLOAT/DOUBLE for monetary values

**Severity:** warning

Floating-point types introduce rounding errors unsuitable for financial calculations. Use DECIMAL or NUMERIC with explicit precision.

**Detect:** Column or literal used in a monetary context (column names like `price`, `amount`, `total`, `balance`, `cost`) with FLOAT or DOUBLE type.

### A10 -- SELECT non-aggregated column with GROUP BY

**Severity:** warning

Selecting columns not in the GROUP BY clause and not inside aggregate functions produces undefined behavior in most SQL engines (MySQL allows it by default, which masks bugs).

**Detect:** SELECT clause includes columns not present in GROUP BY and not wrapped in an aggregate function (COUNT, SUM, AVG, MIN, MAX).
