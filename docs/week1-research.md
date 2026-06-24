# Week 1 Research Notes

Generated on: 2026-06-03

## Firecrawl

### What it can extract

- Clean page content in markdown, HTML, raw HTML, links, images, screenshots, JSON/extract output, summaries, and branding data.
- Branding output can include brand identity data such as logos, colors, fonts, typography, spacing, and UI components.
- Crawl supports full-site traversal and passes scrape options through to page extraction.
- Firecrawl crawl results include page-level metadata and HTTP status codes for successfully fetched pages.

### Practical limitations

- Full crawls are asynchronous and require polling.
- Some failed pages are not returned in the main crawl result set and must be checked via crawl error endpoints.
- Actual crawl coverage still depends on target site structure, robots restrictions, timeouts, and client-side rendering behavior.

### Relevant sources

- https://docs.firecrawl.dev/api-reference/introduction
- https://docs.firecrawl.dev/api-reference/v2-endpoint/scrape
- https://docs.firecrawl.dev/quickstarts/nodejs
- https://docs.firecrawl.dev/features/mcp

## GitHub API

### What it returns

- The REST API returns JSON by default, including `null` fields rather than omitting them.
- Repository contents endpoints return metadata like `type`, `name`, `path`, `size`, `sha`, `download_url`, `html_url`, and file content for files.
- The API supports standard REST concepts: path parameters, query parameters, pagination, authentication, and rate-limit headers.
- Rate limit headers such as `x-ratelimit-remaining` and `x-ratelimit-reset` help clients back off safely.

### Practical limitations

- Unauthenticated access is more limited.
- Large or paginated result sets require pagination handling.
- Different endpoints need different auth scopes or permissions.

### Relevant sources

- https://docs.github.com/en/rest/using-the-rest-api/getting-started-with-the-rest-api
- https://docs.github.com/en/rest/repos/contents?apiversion=2022-11-28
- https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28&apiversion=20222-11-28
- https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api

## Apollo

### Free-tier findings

- Apollo currently documents four plan types: Free, Basic, Professional, and Custom/Organization.
- Apollo also offers a time-limited free trial of paid functionality.
- The trial exposes Basic-plan features with limits such as record selection caps and phone access caps.

### Practical limitations

- Free and trial access are credit-limited.
- Higher-value enrichment data and operational scale depend on paid plans.
- Trial restrictions make it unsuitable as the long-term backbone for bulk enrichment without a paid upgrade.

### Relevant sources

- https://knowledge.apollo.io/hc/en-us/articles/5288168088205-Access-a-Free-Trial-of-Apollo

## Clearbit

### Free-tier findings

- Clearbit documents that its former free platform and several free tools were sunset on April 30, 2025.
- Free Clearbit accounts are not being created.
- The publicly documented free capability that remains is the AutoComplete API for company-name autocomplete with logo and domain information.
- Name to Domain API and Risk API are free only for existing Clearbit customers.

### Practical limitations

- Clearbit is no longer a general-purpose free enrichment option for new users.
- Most previous “free tier” use cases are no longer available in the old form.
- For Week 1, Clearbit should be treated as limited and not assumed to be broadly free.

### Relevant sources

- https://help.clearbit.com/hc/en-us/articles/7949415615255-What-Does-Clearbit-Offer-for-Free

## Rocket Engineers company source list

### Current source used

- Rocket Engineers provider directory page reviewed on 2026-06-03:
  - https://www.rocketengineers.io/explore

### Provider pages visible there

- incratec
- 4data
- écociel
- Palark
- ONZACK
- Floads
- Friendly Nerds
- tim&koko
- bespinian
- re:cinq
- nxt Engineering
- copebit
- 1way2cloud
- b-nova
- Peak Scale
- Puzzle ITC
- VSHN

### Notes

- `data/company-urls.json` contains the current provider website URLs mapped from the providers visible on Rocket Engineers `Explore` as of 2026-06-03.
- This is the Week 1 crawl seed list for the current implementation.
