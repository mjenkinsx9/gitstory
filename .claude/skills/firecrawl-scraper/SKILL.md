---
name: firecrawl-scraper
description: >
  Use this skill whenever you need to scrape web pages, crawl websites, extract content from URLs,
  search the web and scrape results, discover site structure, batch-scrape multiple URLs, or
  download images from web content, or sync/update local Anthropic documentation.
  This skill teaches you how to use the 10 firecrawl MCP tools
  effectively. Use when the user says "scrape", "crawl", "fetch this page", "get content from",
  "extract from URL", "map this site", "search and scrape", "batch scrape", "download images from",
  or provides a URL they want content from. Also use when you need web content for research,
  documentation ingestion, competitive analysis, or building datasets from web sources.
---

# Firecrawl Web Scraper

You have 10 MCP tools for web scraping via a self-hosted Firecrawl instance at `192.168.233.20:3002`. No API key is needed.

## Tool Selection

Pick the right tool based on what you need:

| Need | Tool | Notes |
|------|------|-------|
| Content from a single URL | `firecrawl_scrape` | Fastest. Returns markdown by default. |
| Content from multiple known URLs | `firecrawl_batch_scrape_start` → `firecrawl_batch_scrape_status` | Async. Up to 1000 URLs in parallel. |
| Crawl a site following links | `firecrawl_crawl_start` → `firecrawl_crawl_status` | Async. Set `maxDepth` and `limit`. Cancel with `firecrawl_crawl_cancel`. |
| Discover all URLs on a site | `firecrawl_map` | Returns URL list grouped by depth. Good recon step before crawling. |
| Web search + auto-scrape results | `firecrawl_search` | Combines search engine query with content extraction. |
| Extract images from markdown | `firecrawl_extract_media` | Parses markdown/HTML for image URLs. Optional download with FlareSolverr bypass. |
| Sync local Anthropic docs | `firecrawl_sync_docs` | Re-crawls Claude Code and/or Platform docs. Runs on the MCP server host. |

## Common Patterns

### Single Page Scrape
```
firecrawl_scrape(url: "https://example.com/page", formats: ["markdown"])
```
- Default `onlyMainContent: true` strips nav/footer — usually what you want
- Add `waitFor: 3000` for JS-heavy SPAs that need time to render
- Use `actions` for pages requiring interaction (click cookie banners, expand sections):
  ```
  actions: [
    { type: "click", selector: "#accept-cookies" },
    { type: "wait", milliseconds: 1000 },
    { type: "scroll", direction: "down", amount: 3 }
  ]
  ```
- Set `mobile: true` to get mobile-optimized content

### Async Job Pattern (Crawl & Batch)
Crawl and batch scrape are async — they return a job ID immediately:
1. **Start**: Call `firecrawl_crawl_start` or `firecrawl_batch_scrape_start` — get back a `jobId`
2. **Poll**: Call `firecrawl_crawl_status` or `firecrawl_batch_scrape_status` with the `jobId`
3. **Check**: Status will be `scraping` → `completed` or `failed`
4. **Read**: When `completed`, results are in the `data` array (paginated, max 20 previewed)

Poll every few seconds. Do not spam — the server is doing real work.

### Crawl with Scope Control
```
firecrawl_crawl_start(
  url: "https://docs.example.com",
  maxDepth: 3,
  limit: 50,
  includePaths: ["/docs/*", "/api/*"],
  excludePaths: ["/blog/*", "/changelog/*"]
)
```
- `includePaths`/`excludePaths` use glob patterns to focus the crawl
- `allowExternalLinks: true` follows links to other domains (use carefully)
- `allowBackwardLinks: true` follows links back to parent directories

### Map Before You Crawl
When you don't know a site's structure:
```
firecrawl_map(url: "https://example.com", limit: 200)
```
Then use the discovered URLs to decide what to crawl or batch-scrape. Use `search` param to filter:
```
firecrawl_map(url: "https://example.com", search: "api documentation")
```

### Web Search + Scrape
```
firecrawl_search(query: "react server components best practices", limit: 5)
```
Returns scraped content from top search results — combines discovery and extraction in one step. Use `lang` and `country` for localized results.

### Batch Scrape Known URLs
When you have a list of specific URLs:
```
firecrawl_batch_scrape_start(urls: ["https://a.com/1", "https://a.com/2", ...])
```
More efficient than calling `firecrawl_scrape` in a loop. Supports 1-1000 URLs.

### Image Extraction
After scraping, extract images from the markdown output:
```
firecrawl_extract_media(markdown: "<scraped markdown>", download: false)
```
- `download: false` (default) just lists image URLs
- `download: true` actually downloads them
- `targetDomain: "https://example.com"` enables FlareSolverr Cloudflare bypass for protected images

### Sync Local Anthropic Docs
Keep the local Claude Code and Platform documentation up to date:
```
firecrawl_sync_docs(target: "all")           // sync both doc sets
firecrawl_sync_docs(target: "claude-code")   // just Claude Code docs
firecrawl_sync_docs(target: "platform")      // just Platform docs
```
This runs the crawler sync pipeline on the MCP server host — it re-scrapes pages, detects changes via content hashing, and post-processes the output. Can take several minutes. The synced docs are used by the `forge-docs-reference` skill.

## Output Formats

All scrape tools support these `formats`:
- `markdown` (default) — clean text, best for LLM consumption
- `html` — parsed HTML
- `rawHtml` — original HTML source
- `links` — extracted hyperlinks
- `screenshot` — page screenshot (base64)
- `screenshot@fullPage` — full-page screenshot

Use `markdown` for content extraction. Use `links` when you need to discover URLs on a page. Use `html` when you need structural information.

## Tips

- **Start with `firecrawl_scrape`** for single pages — it's synchronous and fast
- **Use `firecrawl_map` first** when exploring an unfamiliar site
- **Set `onlyMainContent: true`** (default) to skip boilerplate
- **Use `includePaths`** on crawls to avoid scraping irrelevant sections
- **Keep `limit` reasonable** on crawls — start small (10-20), increase if needed
- **Prefer `firecrawl_batch_scrape_start`** over multiple `firecrawl_scrape` calls when you have 3+ URLs
- **Use `firecrawl_search`** instead of a separate web search tool when you need both search and content
