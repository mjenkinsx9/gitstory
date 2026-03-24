# REST API Lint -- Check Catalog

Detailed examples for every check in the REST API Lint skill. Use this as a reference when running the audit.

---

## Category A: URL Naming

### U01 -- Verbs in URL path

URLs should represent resources (nouns), not actions (verbs). The HTTP method communicates the action.

**Bad:**
```
GET  /getUsers
POST /createUser
POST /deleteOrder/123
GET  /fetchArticles
```

**Good:**
```
GET    /users
POST   /users
DELETE /orders/123
GET    /articles
```

### U02 -- Singular nouns for collections

Collection endpoints must use plural nouns. A singular noun implies a single resource.

**Bad:**
```
GET /user          -- collection should be plural
GET /product/list  -- avoid /list suffix too
```

**Good:**
```
GET /users
GET /products
```

### U03 -- Uppercase or camelCase in URL segments

URLs should be lowercase with hyphens as separators. URLs are case-sensitive on most servers, and mixed case creates confusion.

**Bad:**
```
GET /userProfiles
GET /User/Settings
GET /api/v1/OrderItems
```

**Good:**
```
GET /user-profiles
GET /user/settings
GET /api/v1/order-items
```

### U04 -- Trailing slashes inconsistency

Pick one convention (with or without trailing slash) and stick to it. Mixing creates confusion and potential 301 redirects.

**Bad (inconsistent):**
```
GET /users/
GET /products
GET /orders/
```

**Good (consistent):**
```
GET /users
GET /products
GET /orders
```

### U05 -- Deeply nested resources

Nesting beyond two levels creates tight coupling and unwieldy URLs. Flatten by promoting sub-resources to top-level with query filters.

**Bad:**
```
GET /users/:userId/orders/:orderId/items/:itemId/reviews
```

**Good:**
```
GET /orders/:orderId/items         -- one level of nesting
GET /reviews?item_id=:itemId       -- or promote to top-level with filter
```

### U06 -- File extensions in URLs

Content type should be negotiated via Accept headers, not URL extensions.

**Bad:**
```
GET /users.json
GET /report.xml
```

**Good:**
```
GET /users          (Accept: application/json)
GET /reports/123    (Accept: application/xml)
```

### U07 -- Action-based sub-resources missing

For operations that do not map cleanly to CRUD, use a verb sub-resource on the specific resource rather than overloading PUT/PATCH.

**Bad:**
```
PUT /orders/123  { "status": "cancelled" }   -- overloading update for an action
```

**Good:**
```
POST /orders/123/cancel
POST /users/456/deactivate
```

Note: This is informational. Both approaches are acceptable depending on context.

### U08 -- Underscore separators

Hyphens are preferred over underscores in URLs for readability and SEO. Underscores can be hidden by underline styling.

**Bad:**
```
GET /user_profiles
GET /order_line_items
```

**Good:**
```
GET /user-profiles
GET /order-line-items
```

### U09 -- Internal implementation details leaked

URLs should reflect domain concepts, not database tables, internal services, or implementation details.

**Bad:**
```
GET /db/user_table/select
GET /internal/cache/flush
GET /mysql/users/query
```

**Good:**
```
GET /users
POST /admin/cache/invalidate    -- if needed, namespace under /admin
```

---

## Category B: HTTP Method Usage

### M01 -- POST used for retrieval

GET is the correct method for reading data. POST for retrieval breaks cacheability and violates REST semantics.

**Bad:**
```
POST /users/search  { "name": "John" }     -- if this is just filtering
POST /api/getReport
```

**Good:**
```
GET /users?name=John
GET /reports/123
```

Exception: Complex search with large query bodies may warrant POST `/search` as a pragmatic choice. Flag as info, not critical, when the query complexity justifies it.

### M02 -- GET used for mutation

GET requests must be safe (no side effects). Using GET for writes is a security risk (CSRF, prefetch, crawlers can trigger mutations).

**Bad:**
```
GET /users/123/delete
GET /orders/456/approve
GET /api/reset-database
```

**Good:**
```
DELETE /users/123
POST  /orders/456/approve
POST  /admin/reset-database
```

### M03 -- PUT used for partial updates

PUT should replace the entire resource. For partial updates, use PATCH.

**Bad:**
```
PUT /users/123  { "email": "new@example.com" }    -- only updating one field
```

**Good:**
```
PATCH /users/123  { "email": "new@example.com" }   -- partial update
PUT   /users/123  { "name": "...", "email": "...", "role": "..." }  -- full replace
```

### M04 -- DELETE returns 200 with body

Successful DELETE operations that do not return a response body should use 204 (No Content).

**Acceptable:**
```
DELETE /users/123  ->  204 No Content
DELETE /users/123  ->  200 OK  { "deleted": true }   -- acceptable if body is intentional
```

### M05 -- Missing common methods on a resource

If a resource has a collection endpoint, it usually should also support get-by-ID, and possibly create/update/delete.

**Flag when:**
```
GET /users           -- exists
GET /users/:id       -- missing
```

### M06 -- Non-idempotent PUT

PUT must be idempotent: calling it N times should produce the same result as calling it once. If the endpoint auto-increments counters or appends to lists, it belongs on POST or PATCH.

### M07 -- PATCH replaces entire resource

If a PATCH handler requires all fields and replaces the full object, it is behaving as PUT and should be labeled as such.

---

## Category C: Response Status Codes

### C01 -- 200 for everything

Using 200 OK for all responses (including errors) hides failures from monitoring, proxies, and client error handlers.

**Bad:**
```
POST /users  ->  200 { "error": "email already exists" }
GET  /users/999  ->  200 { "error": "not found" }
```

**Good:**
```
POST /users  ->  409 Conflict { "error": "email already exists" }
GET  /users/999  ->  404 Not Found
```

### C02 -- POST create returns 200 instead of 201

Successful resource creation should return 201 Created, optionally with a Location header.

**Good:**
```
POST /users  ->  201 Created
  Location: /users/789
  { "id": 789, "name": "..." }
```

### C03 -- DELETE returns 200 instead of 204

When DELETE removes a resource and returns no body, use 204.

### C04 -- Missing 404 handling

Resource-by-ID endpoints must return 404 when the resource does not exist, not 200 with null/empty body.

### C05 -- Missing 400 for validation failures

Client input errors should return 400 Bad Request with details about what failed, not 500.

### C06 -- Missing 401/403 distinction

- 401 Unauthorized: The client is not authenticated (no token, expired token)
- 403 Forbidden: The client is authenticated but lacks permission

Conflating these makes debugging auth issues difficult.

### C07 -- 500 for client errors

Returning 500 for input validation, missing resources, or permission errors triggers false alerts in monitoring. Reserve 500 for genuine server failures.

### C08 -- Non-standard status codes

Custom or non-standard codes (499, 512, 600) break HTTP semantics and confuse clients.

### C09 -- No error status codes

Endpoints that only handle the happy path and have no error responses are fragile.

---

## Category D: Pagination & Filtering

### P01 -- Unbounded collection results

Collection endpoints without pagination will fail at scale. Every list endpoint should support limit/offset or cursor-based pagination.

**Bad:**
```
GET /users  ->  [ ...10,000 users... ]
```

**Good:**
```
GET /users?page=1&limit=20  ->  { "data": [...], "meta": { "total": 10000, "page": 1, "limit": 20 } }
```

### P02 -- Pagination metadata missing

Clients need to know total count, current page, and available pages to build UIs.

**Good response envelope:**
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "total_pages": 8
  }
}
```

Or cursor-based:
```json
{
  "data": [...],
  "meta": {
    "next_cursor": "abc123",
    "has_more": true
  }
}
```

### P03 -- Bare array response

Returning a bare JSON array prevents adding metadata later without breaking clients.

**Bad:**
```
GET /users  ->  [ { "id": 1 }, { "id": 2 } ]
```

**Good:**
```
GET /users  ->  { "data": [ { "id": 1 }, { "id": 2 } ] }
```

### P04 -- Inconsistent pagination parameters

All collection endpoints should use the same parameter names.

**Bad (inconsistent):**
```
GET /users?page=1&limit=20
GET /orders?offset=0&count=20
GET /products?p=1&size=20
```

### P05 -- No filtering or sorting

Collection endpoints should support at minimum filtering by key fields and sorting.

**Good:**
```
GET /users?role=admin&sort=-created_at
GET /products?category=electronics&min_price=100&sort=+name
```

### P06 -- Filtering via POST body

Filtering and searching should use GET with query parameters when practical. POST bodies are not cacheable.

---

## Category E: Error Response Format

### E01 -- Inconsistent error structure

All error responses across the API should follow the same structure.

**Bad (inconsistent):**
```
POST /users  ->  400 { "error": "invalid email" }
POST /orders ->  400 { "message": "missing field", "code": 1001 }
PUT  /items  ->  400 { "errors": ["bad input"] }
```

**Good (consistent):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": [...]
  }
}
```

### E02 -- No machine-readable error code

Error responses should include a stable error code/type that clients can programmatically handle, not just a human-readable message.

**Bad:**
```json
{ "message": "Something went wrong" }
```

**Good:**
```json
{ "error": { "code": "DUPLICATE_EMAIL", "message": "A user with this email already exists" } }
```

### E03 -- Stack traces leaked

Production error responses must never include stack traces, SQL queries, file paths, or internal service names.

**Bad:**
```json
{
  "error": "NullPointerException",
  "stack": "at com.app.UserService.create(UserService.java:42)..."
}
```

### E04 -- Plain text errors

Error responses should be structured JSON, not plain text strings.

**Bad:**
```
HTTP 400
Bad Request: missing email field
```

**Good:**
```json
{ "error": { "code": "MISSING_FIELD", "message": "The 'email' field is required" } }
```

### E05 -- HTTP status missing from error body

Including the status code in the error body is a convenience for clients that may lose the HTTP status during processing.

### E06 -- Not using RFC 9457 Problem Details

RFC 9457 defines a standard error format. Not required, but recommended for new APIs.

```json
{
  "type": "https://api.example.com/errors/validation",
  "title": "Validation Error",
  "status": 400,
  "detail": "The 'email' field must be a valid email address",
  "instance": "/users"
}
```

### E07 -- Validation errors do not identify fields

When input validation fails, the error should specify which field(s) failed and why.

**Bad:**
```json
{ "error": "Validation failed" }
```

**Good:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      { "field": "email", "issue": "must be a valid email address" },
      { "field": "age", "issue": "must be a positive integer" }
    ]
  }
}
```

---

## Category F: Versioning & General

### V01 -- No versioning strategy

APIs should have a versioning strategy (URL-based `/v1/`, header-based, or query param) to allow non-breaking evolution.

**Common approaches:**
```
/api/v1/users          -- URL prefix (most common)
Accept: application/vnd.api+json;version=1    -- header
/users?version=1       -- query param (least recommended)
```

### V02 -- Mixed versioning strategies

Pick one versioning approach and use it consistently.

### V03 -- No Content-Type header

API responses should set `Content-Type: application/json` (or appropriate type).

### V04 -- Inconsistent naming across the API

All endpoints should follow the same naming conventions (plural nouns, hyphens, lowercase).

### V05 -- CORS not configured

Public-facing APIs consumed by browsers need CORS headers. Internal-only APIs may skip this.
