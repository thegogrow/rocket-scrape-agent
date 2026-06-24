# Final Report

Generated: 2026-06-17

## Executive Summary

The scraping and enrichment pipeline now produces normalized IT service provider profiles at 100+ scale for the Swiss-market use case. The final target corpus contains 112 companies across the original Rocket Engineers test set, a Switzerland-focused Week 3 segment, and a Germany-focused Week 3/4 segment.

Final delivered output:

| Corpus | URLs | Profiles | Logos | Profiles + Logos |
| --- | ---: | ---: | ---: | ---: |
| Rocket Engineers test companies | 17 | 17 | 17 | 17 |
| Week 3 Swiss/Germany companies | 60 | 60 | 60 | 60 |
| Week 4 Germany companies | 35 | 35 | 35 | 35 |
| **Total target corpus** | **112** | **112** | **112** | **112** |

Generated artifacts are saved under `output/<domain>/` with:

- `raw.json`: Firecrawl crawl/scrape output wrapper.
- `github.json`: GitHub organization and repository activity enrichment.
- `enrichment.json`: Apollo organization enrichment where credits were available.
- `brandfetch.json`: Brandfetch data where credits/rate limits allowed.
- `source-bundle.json`: Combined source data used for synthesis.
- `profile.json`: Normalized company profile.
- `logo.png`: Best saved logo asset.
- `logo-source.json`: Selected logo URL, source type, score, and timestamp.

## Pipeline Architecture

The pipeline in `src/pipeline/runPipeline.js` executes one company at a time:

1. Normalize the input URL and derive the output domain.
2. Crawl website content through Firecrawl.
3. Search GitHub for an organization match and recent repository activity.
4. Enrich company metadata through Apollo when credits are available.
5. Fetch brand metadata and logo candidates through Brandfetch when available.
6. Build a `source-bundle.json` from all collected sources.
7. Generate a normalized profile through OpenRouter LLM synthesis, or use the deterministic fallback profile generator when LLM credits are unavailable.
8. Save the best logo using ranked Brandfetch, profile, crawl, JSON-LD, metadata, CSS, and common-path candidates.

## Prompt and Extraction Improvements

The profile prompt was hardened based on Week 2 findings:

- It now requires conservative extraction from supplied evidence only.
- It explicitly forbids using customers, clients, implementation targets, repository dependencies, or case-study brands as vendor partnerships.
- It extracts partnerships only when supported by partner, certification, reseller, marketplace, member, alliance, competency, or service-provider language.
- It prefers Apollo/Clearbit-style enrichment for company size, founded year, LinkedIn URL, and location.
- It prefers website copy for service offerings, focus areas, technologies, and vendor partnerships.
- It uses GitHub data only for GitHub URL, technologies, and recent activity.

The LLM request now caps output tokens to avoid OpenRouter reserving the model maximum and failing against the available credit balance.

## Logo Extraction Improvements

Logo extraction was improved after Week 2 showed favicon/icon candidates being selected too often:

- Brandfetch logos are ranked first when available.
- Website candidates are scored by source, URL, alt text, class/id context, parent header/nav/logo context, dimensions, and file type.
- JSON-LD `logo` values, metadata logo tags, OpenGraph/Twitter images, CSS background images, `picture/source` elements, lazy image attributes, and common `/logo.*` paths are considered.
- Favicon and small icon candidates are penalized unless no better logo candidate exists.
- The selected source is written to `logo-source.json` for auditability.

Final target corpus logo success: **112/112**.

## Data Collection

Input URL lists:

- `data/company-urls.json`: original Rocket Engineers test companies.
- `data/week3-additional-company-urls.json`: 60 regional provider URLs, split into 30 Swiss providers and 30 German providers.
- `data/week4-additional-company-urls.json`: 35 additional German IT, cloud, open-source, DevOps, and software service provider URLs.

Discovery notes:

- `data/week3-url-discovery.csv`
- `data/week4-url-discovery.csv`

The Week 3 and Week 4 batches were regionalized for Swiss-market relevance. The resulting target corpus has 112 complete profile/logo pairs, with Week 3 and Week 4 focused on Swiss and German providers rather than a global provider mix.

## Quality Results

The Week 3 quality report is available at `docs/week3-quality-report.md`.

Key results:

- Week 2 vendor-partnership issue mix before prompt iteration: `better`: 2, `different`: 1, `missing`: 8, `worse`: 6.
- Week 3 completed profiles: 60/60.
- Week 3 logo success: 60/60.
- Week 3 manual-review sample size: 20 profiles.

Per-field sample accuracy from `docs/week3-quality-report.md`:

| Field | Reviewed Values | Accuracy |
| --- | ---: | ---: |
| companyName | 20 | 100% |
| website | 20 | 100% |
| description | 20 | 98% |
| services | 18 | 94% |
| focusAreas | 18 | 94% |
| technologies | 20 | 90% |
| vendorPartnerships | 8 | 94% |
| location | 5 | 100% |
| companySize | 4 | 100% |
| foundedYear | 4 | 100% |
| recentActivity | 17 | 91% |
| githubUrl | 18 | 100% |
| linkedinUrl | 5 | 100% |
| logoUrl | 20 | 100% |
| industries | 3 | 33% |

The weakest measured field is `industries`, because it is often absent from direct source evidence and the conservative prompt avoids inferring sectors from general context. This is a deliberate quality tradeoff to reduce hallucination.

## Cost Model

The cost model is available at `docs/week3-cost-model.md`.

Current assumptions:

- Firecrawl: 5 credits/profile because the crawler is configured for up to 5 pages.
- Apollo: 1 organization enrichment call/profile.
- Brandfetch: $129/month for 2,500 fetches, amortized to about $0.05/profile.
- OpenRouter: `anthropic/claude-sonnet-4` modeled at $3/input MTok and $15/output MTok.
- Clearbit/Breeze: not currently called; configurable if substituted for Apollo.

Saved-output token average:

- Average LLM input tokens/profile: 11,599.
- Average LLM output tokens/profile: 283.
- Estimated OpenRouter cost/profile: about $0.04.

Projection:

| Profiles | Firecrawl Credits | Apollo Credit Calls | OpenRouter | Brandfetch | Known Dollar Subtotal |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1,000 | 5,000 | 1,000 | $39.04 | $51.60 | $90.64 |
| 5,000 | 25,000 | 5,000 | $195.21 | $258.00 | $453.21 |

Firecrawl and Apollo exact dollar totals require plan-specific blended rates. The cost script supports:

- `FIRECRAWL_USD_PER_CREDIT`
- `APOLLO_USD_PER_CREDIT`
- `CLEARBIT_USD_PER_RECORD`

## Demo

Demo assets are documented in `docs/demo-script.md`.

Recommended deterministic demo:

```bash
npm run demo
```

This replays an existing complete Swiss-provider run for `https://www.adfinis.com/`, shows the URL input, reports collected source-data counts, shows the prompt-preparation step, and emits:

- `output/demo/adfinis.com/profile.json`
- `output/demo/adfinis.com/logo.png`

Live demo command when API credits are available:

```bash
npm run demo:live -- --url=https://www.adfinis.com/
```

Live fallback demo when OpenRouter credits are unavailable:

```bash
SKIP_LLM=true npm run demo:live -- --url=https://www.adfinis.com/
```

## Operational Notes

- OpenRouter credits were exhausted during the extended 100+ profile run. The pipeline now falls back to deterministic profile generation rather than losing collected data.
- Apollo credits were exhausted during later runs. Apollo failures are non-fatal; profiles continue from website, GitHub, and Brandfetch/crawl data.
- Brandfetch rate limits appeared during the regional rerun. The improved website logo extractor covered all target logos despite those limits.
- The target corpus has 112 complete profile/logo pairs. There are older non-target output directories from earlier experiments, but the three target URL lists all have complete profile/logo coverage.

## Recommended Next Steps

1. Refill OpenRouter and Apollo credits, then rerun the regional Week 3/4 corpus with full LLM synthesis and enrichment if higher quality is required for every replacement profile.
2. Add explicit industry extraction sources or taxonomy rules before using `industries` as a high-confidence field.
3. Add a persisted run manifest per batch with provider credit status, LLM/fallback mode, and per-company timing.
4. Add automated visual logo validation for dimensions/transparency/background fit.
5. Add a small gold-standard dataset for vendor partnerships to continuously regression-test prompt changes.
