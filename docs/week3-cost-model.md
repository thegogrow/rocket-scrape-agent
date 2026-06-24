# Week 3 Cost Model

Generated: 2026-06-17T12:29:17.459Z

## Pricing Inputs

- Firecrawl: `crawl`, `scrape`, `map`, and `monitor` are modeled as 1 credit per page. This pipeline crawls up to 5 pages per profile.
- Apollo: organization enrichment is modeled as 1 credit-consuming organization-enrichment call per profile. Dollar cost depends on the Apollo plan or overage rate.
- Brandfetch: modeled from Starter pricing of $129/month for up to 2,500 brand fetches, amortized per profile.
- OpenRouter: modeled for `anthropic/claude-sonnet-4` at $3/input MTok and $15/output MTok.
- Clearbit: not called by the current code path. Set `CLEARBIT_USD_PER_RECORD` only if using Clearbit/Breeze as a replacement enrichment provider.

## Source Links

- Firecrawl pricing: https://www.firecrawl.dev/pricing
- Apollo organization enrichment: https://docs.apollo.io/reference/organization-enrichment
- Brandfetch pricing: https://brandfetch.com/developers/pricing
- OpenRouter Claude Sonnet 4 pricing: https://openrouter.ai/anthropic/claude-sonnet-4

## Per-Profile Model

- Token estimate source: saved-output-average (60 profiles).
- Average LLM input tokens: 11,599.
- Average LLM output tokens: 283.
- Firecrawl: 5 credits/profile.
- Apollo: 1 credit-consuming call/profile.
- Brandfetch: $0.05/profile amortized.
- OpenRouter: $0.04/profile.
- Firecrawl configured dollar cost: not priced/profile.
- Apollo configured dollar cost: not priced/profile.
- Clearbit configured dollar cost: not priced/profile.

## Projections

| Profiles | Firecrawl Credits | Apollo Credit Calls | OpenRouter | Brandfetch | Known Dollar Subtotal | Configured Dollar Total |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1,000 | 5,000 | 1,000 | $39.04 | $51.60 | $90.64 | $90.64 |
| 5,000 | 25,000 | 5,000 | $195.21 | $258.00 | $453.21 | $453.21 |

## Exact-Dollar Configuration

- Set `FIRECRAWL_USD_PER_CREDIT` to your blended Firecrawl plan cost per credit.
- Set `APOLLO_USD_PER_CREDIT` to your blended Apollo plan or overage cost per enrichment credit.
- Set `CLEARBIT_USD_PER_RECORD` only if replacing Apollo with Clearbit/Breeze enrichment.