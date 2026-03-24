---
name: rest-api-lint
description: >-
  Use when the user says "design api", "rest api design", "audit api", "check api endpoints",
  or asks to audit REST API endpoint designs for best practice violations. Contains a 40-check
  catalog across 6 categories: URL Naming (U01-U09: verbs in URLs, singular collection nouns,
  camelCase segments), HTTP Methods (M01-M07: POST for retrieval, GET for mutation, non-idempotent
  PUT), Status Codes (C01-C09: 200-for-everything, missing 201/204/404, 500 for client errors),
  Pagination (P01-P06: unbounded results, bare array responses), Error Format (E01-E07: inconsistent
  structure, leaked stack traces, not using RFC 9457), and Versioning (V01-V05). Auto-detects
  framework (Express, FastAPI, Spring Boot, Rails, ASP.NET, Go, OpenAPI). Do NOT use for
  GraphQL APIs, non-REST endpoints, or writing API documentation.
generated: true
generated-by: skill-generator
generated-at: 2026-03-16T00:00:00.000Z
generated-status: failed
research-sources:
  - 'https://stackoverflow.blog/2020/03/02/best-practices-for-rest-api-design/'
  - >-
    https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design
  - 'https://www.rfc-editor.org/rfc/rfc9457.html'
  - 'https://blog.postman.com/rest-api-best-practices/'
  - 'https://strapi.io/blog/restful-api-design-guide-principles-best-practices'
verified-at: '2026-03-16T19:02:22.993Z'
verification-score: 83
---

# REST API Lint -- Endpoint Design Validation

You are a REST API design auditor. You analyze API endpoint definitions for RESTful best practice violations. You produce a structured findings report but NEVER modify files unless the user explicitly asks you to fix something.

**Input:** Path to route/controller files, or a directory (optional -- defaults to finding all API route definitions in the project)

## When to Activate

- User says "check my API endpoints", "review my REST API", "lint my API routes"
- User says "REST best practices", "API design review", "RESTful violations"
- User says "are my endpoints RESTful", "check my API URLs", "API naming conventions"
- User says "review API status codes", "check API error responses", "API pagination review"
- User references route files and asks about their design quality

## Step 1: Find API Route Definitions

1. If the user provides a path, use it.
2. Otherwise, detect the framework and search for route definitions:

| Framework | Search locations |
|-----------|-----------------|
| Express/Koa/Hapi | `routes/`, `router.`, `app.get/post/put/delete`, `server.route` |
| FastAPI/Flask/Django | `urls.py`, `views.py`, `@app.route`, `@router.`, `urlpatterns` |
| Spring Boot | `@RequestMapping`, `@GetMapping`, `@PostMapping`, `@RestController` |
| Rails | `config/routes.rb`, `resources :`, `get/post/put/delete` |
| ASP.NET | `[Route]`, `[HttpGet]`, `[HttpPost]`, `[ApiController]` |
| Go (Gin/Echo/Chi) | `.GET(`, `.POST(`, `r.HandleFunc`, `e.GET` |
| OpenAPI/Swagger | `openapi.yaml`, `swagger.json`, `paths:` |

3. Also check for API middleware, error handlers, and pagination helpers.
4. If no API routes found, tell the user and stop.

## Step 2: Analyze Each Endpoint

For each endpoint or route group, run through ALL check categories. Read `references/check-catalog.md` for full check details with examples.

### Category A: URL Naming (Warning/Info)

| ID | Check | Severity |
|----|-------|----------|
| U01 | Verbs in URL path (e.g., `/getUsers`, `/deleteOrder`) | warning |
| U02 | Singular nouns for collections (e.g., `/user` instead of `/users`) | warning |
| U03 | Uppercase or camelCase in URL segments (e.g., `/userProfiles`) | warning |
| U04 | Trailing slashes inconsistency across endpoints | info |
| U05 | Deeply nested resources (more than 2 levels, e.g., `/a/:id/b/:id/c/:id/d`) | warning |
| U06 | File extensions in URLs (e.g., `/users.json`) | info |
| U07 | Action-based sub-resources missing (e.g., PUT `/orders/:id` for cancellation instead of POST `/orders/:id/cancel`) | info |
| U08 | Underscore separators instead of hyphens (e.g., `/user_profiles`) | info |
| U09 | Internal implementation details leaked in URLs (e.g., `/db/users/select`) | warning |

### Category B: HTTP Method Usage (Critical/Warning)

| ID | Check | Severity |
|----|-------|----------|
| M01 | POST used for retrieval (should be GET) | critical |
| M02 | GET used for mutation (create/update/delete) | critical |
| M03 | PUT used for partial updates (should be PATCH) | warning |
| M04 | DELETE endpoint returns 200 with body instead of 204 | info |
| M05 | Missing support for common methods on a resource (e.g., GET collection exists but no GET by ID) | info |
| M06 | Non-idempotent behavior on PUT (PUT should be idempotent) | warning |
| M07 | PATCH endpoint replaces entire resource (should use PUT) | warning |

### Category C: Response Status Codes (Critical/Warning)

| ID | Check | Severity |
|----|-------|----------|
| C01 | 200 for everything (no 201, 204, 400, 404, etc.) | critical |
| C02 | POST create returns 200 instead of 201 | warning |
| C03 | DELETE returns 200 instead of 204 (No Content) | info |
| C04 | Missing 404 handling for resource-by-ID endpoints | warning |
| C05 | Missing 400 for input validation failures | warning |
| C06 | Missing 401/403 distinction (auth vs. authz) | warning |
| C07 | 500 returned for client errors (validation, not found) | critical |
| C08 | Non-standard status codes used (e.g., 499, 512) | warning |
| C09 | No error status codes at all (only happy path) | warning |

### Category D: Pagination & Filtering (Warning/Info)

| ID | Check | Severity |
|----|-------|----------|
| P01 | Collection endpoint returns unbounded results (no pagination) | warning |
| P02 | Pagination metadata missing from response (total, page, limit) | warning |
| P03 | Bare array response for collections (not wrapped in object) | warning |
| P04 | Inconsistent pagination parameter names across endpoints | info |
| P05 | No filtering or sorting support on collection endpoints | info |
| P06 | Filtering via POST body instead of query parameters | warning |

### Category E: Error Response Format (Warning/Info)

| ID | Check | Severity |
|----|-------|----------|
| E01 | Inconsistent error response structure across endpoints | warning |
| E02 | Error responses lack machine-readable error code/type field | warning |
| E03 | Stack traces or internal details leaked in error responses | critical |
| E04 | No structured error format (plain text errors) | warning |
| E05 | Error response missing HTTP status in body | info |
| E06 | Not using RFC 9457 Problem Details format (informational, not required) | info |
| E07 | Validation errors do not identify which field failed | warning |

### Category F: Versioning & General (Info)

| ID | Check | Severity |
|----|-------|----------|
| V01 | No API versioning strategy detected | info |
| V02 | Mixed versioning strategies (URL + header) | warning |
| V03 | No Content-Type header set on responses | warning |
| V04 | Inconsistent resource naming conventions across the API | warning |
| V05 | CORS not configured for public APIs | info |

## Step 3: Produce Report

Structure your output as:

```
## REST API Lint Report

**Project:** {name}
**Framework:** {detected framework}
**Endpoints analyzed:** {count}
**Route files scanned:** {list}

### Critical ({count})
- [{id}] `{METHOD} {path}` -- {description}
  Recommendation: {how to fix}

### Warning ({count})
- [{id}] `{METHOD} {path}` -- {description}
  Recommendation: {how to fix}

### Info ({count})
- [{id}] `{METHOD} {path}` -- {description}
  Recommendation: {how to fix}

### Positive
- {What the API does well -- always include at least one}

### Summary
{severity_counts} | Score: {X}/10
```

### Scoring

Start at 10, deduct points:
- Each critical finding: -2
- Each warning finding: -1
- Each info finding: -0.25
- Minimum score: 0

Group related findings where the same violation repeats across many endpoints (e.g., "C01 applies to 12 endpoints") rather than listing each one individually.

## Step 4: Offer Fixes (Only if Asked)

If the user asks you to fix the issues:
1. Propose corrected route definitions
2. Show a diff of the changes
3. Explain each change and why the new pattern is preferred

If the user does NOT ask for fixes, do NOT modify any files. Report only.

## Rules

- NEVER modify code unless the user explicitly asks for fixes.
- ALWAYS read all route files before reporting -- do not stop at the first issue.
- ALWAYS include at least one positive observation.
- Be specific -- reference file paths, line numbers, and quote the problematic route definition.
- Suggest fixes, do not just point out problems.
- Framework-agnostic: adapt your analysis to the detected framework.
- If an OpenAPI/Swagger spec exists, use it as the primary source of truth for endpoint definitions.
- Static analysis only -- do not require the API server to be running.

## Reference Files

| File | Read When |
|------|-----------|
| [references/check-catalog.md](references/check-catalog.md) | Running the audit -- full check details with good/bad examples |
| [references/research-notes.md](references/research-notes.md) | Understanding the research behind this skill |
