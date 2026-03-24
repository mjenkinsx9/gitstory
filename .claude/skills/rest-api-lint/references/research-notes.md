# REST API Lint -- Research Notes

## Sources Consulted

1. **Stack Overflow Blog -- Best practices for REST API design** (https://stackoverflow.blog/2020/03/02/best-practices-for-rest-api-design/)
   - Key takeaways: Use nouns not verbs, plural collection names, logical nesting max 2 levels, filter/sort via query params, standard HTTP status codes, JSON responses, versioning via URL prefix.

2. **Microsoft Azure Architecture Center -- Web API Design Best Practices** (https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design)
   - Key takeaways: Resource-oriented design, HATEOAS maturity model, collection pagination, async operations with 202, ETags for concurrency.

3. **RFC 9457 -- Problem Details for HTTP APIs** (https://www.rfc-editor.org/rfc/rfc9457.html)
   - Supersedes RFC 7807. Defines `application/problem+json` media type with fields: type, title, status, detail, instance. Recommended for standardizing error responses.

4. **Postman Blog -- REST API Best Practices** (https://blog.postman.com/rest-api-best-practices/)
   - Key takeaways: Accept/respond with JSON, use status codes correctly, use hyphens in URLs, handle errors gracefully, allow filtering/sorting/pagination, cache data, version the API.

5. **Strapi -- RESTful API Design Guide** (https://strapi.io/blog/restful-api-design-guide-principles-best-practices)
   - Key takeaways: Statelessness principle, resource naming, CRUD-to-HTTP mapping, response envelope patterns.

## Key Design Decisions

- **Severity calibration**: GET-for-mutation and POST-for-retrieval are Critical because they have security implications (CSRF, prefetch triggering writes). URL naming issues are Warning/Info because they affect developer experience but not correctness.
- **Framework-agnostic**: The skill detects the framework from file patterns rather than requiring the user to specify it. This matches how dockerfile-lint auto-discovers Dockerfiles.
- **RFC 9457 as Info, not Warning**: Problem Details is a best practice but not universally adopted. Flagging its absence as Info avoids noise for APIs with their own consistent error format.
- **POST /search exception**: Complex search queries with large filter objects are a legitimate use of POST. The skill flags M01 as Critical but notes the exception for complex searches.
- **Scoring model**: Matches dockerfile-lint: start at 10, deduct by severity. Grouped findings prevent score collapse when one violation repeats across many endpoints.
