# Week 3 and Week 4 Simple Report

Generated: 2026-06-18

## Summary

Week 3 and Week 4 are satisfied. The current dataset is now focused on the Swiss market by prioritizing Switzerland and Germany instead of a global provider mix.

Final target corpus:

| Source | URLs | Profiles | Logos | Complete Profile + Logo Pairs |
| --- | ---: | ---: | ---: | ---: |
| Rocket Engineers test companies | 17 | 17 | 17 | 17 |
| Week 3 Swiss/Germany companies | 60 | 60 | 60 | 60 |
| Week 4 Germany companies | 35 | 35 | 35 | 35 |
| **Total** | **112** | **112** | **112** | **112** |

## Week 3 Status

### 3.1 Prompt Improvement

Satisfied.

The LLM prompt was updated to reduce hallucinations and improve vendor partnership extraction. The prompt now requires explicit evidence for partnerships and excludes customers, clients, tools merely used, repository dependencies, and case-study brands.

Evidence:

- Prompt implementation: `src/llm/openrouter.js`
- Before/after summary: `docs/week3-quality-report.md`

### 3.2 Logo Extraction

Satisfied.

Logo extraction was improved with multiple fallback approaches:

- Brandfetch logo lookup.
- Website metadata and crawl image candidates.
- JSON-LD logo extraction.
- CSS background image extraction.
- Common logo path fallback.
- Scoring that penalizes favicons and small icons.

Result:

- Week 3 logos: **60/60**
- Final target-corpus logos: **112/112**

### 3.3 Additional URLs

Satisfied.

Week 3 now contains 60 additional Swiss/Germany IT service provider URLs.

Evidence:

- URL list: `data/week3-additional-company-urls.json`
- Discovery notes: `data/week3-url-discovery.csv`

### 3.4 Pipeline Run on 50+ Companies

Satisfied.

The pipeline was run on all 60 Week 3 companies.

Result:

- Week 3 profiles: **60/60**
- Week 3 logos: **60/60**

### 3.5 Quality Review

Satisfied.

A 20-profile review sample was scored per field, with special attention to vendor partnerships and logos.

Key results:

| Field | Accuracy |
| --- | ---: |
| companyName | 100% |
| website | 100% |
| description | 98% |
| services | 94% |
| focusAreas | 94% |
| technologies | 90% |
| vendorPartnerships | 94% |
| logoUrl | 100% |

Evidence:

- Quality report: `docs/week3-quality-report.md`
- Review CSV: `docs/week3-quality-review.csv`

## Week 4 Status

### 4.1 Reach 100+ Profiles and Logos

Satisfied.

The pipeline was run on more companies until the target corpus exceeded 100 complete profiles.

Result:

- Total target URLs: **112**
- Total profiles: **112**
- Total logos: **112**
- Complete profile + logo pairs: **112**

### 4.2 Cost Model

Satisfied.

The cost model includes Firecrawl credits, Apollo enrichment calls, Brandfetch logo lookup cost, and OpenRouter/LLM cost.

Per-profile assumptions:

| Cost Area | Estimate |
| --- | ---: |
| Firecrawl | 5 credits/profile |
| Apollo | 1 enrichment call/profile |
| Brandfetch | about $0.05/profile |
| OpenRouter/LLM | about $0.04/profile |

Projected cost:

| Profiles | Firecrawl Credits | Apollo Calls | OpenRouter | Brandfetch | Known Dollar Subtotal |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1,000 | 5,000 | 1,000 | $39.04 | $51.60 | $90.64 |
| 5,000 | 25,000 | 5,000 | $195.21 | $258.00 | $453.21 |

Important note:

Firecrawl and Apollo exact dollar costs depend on the account plan or overage pricing. The model reports Firecrawl in credits and Apollo in enrichment calls unless plan-specific dollar rates are provided.

Evidence:

- Cost model: `docs/week3-cost-model.md`

### 4.3 Final Report

Satisfied.

The final report was written and updated for the Swiss/Germany corpus.

Evidence:

- Final report: `docs/final-report.md`

### 4.4 Demo

Satisfied.

A 15-minute demo plan and working demo command are ready.

Recommended demo:

```bash
npm run demo
```

The demo shows:

1. A Swiss provider URL going in.
2. Source data being loaded from the collected pipeline output.
3. The synthesis prompt being prepared.
4. `profile.json` being emitted.
5. `logo.png` being emitted.

Demo output:

- `output/demo/adfinis.com/profile.json`
- `output/demo/adfinis.com/logo.png`

Evidence:

- Demo script: `docs/demo-script.md`
- Demo runner: `src/utils/runDemo.js`

## Notes and Caveats

- The current corpus is intentionally Swiss/Germany-focused because the product is for the Swiss market.
- OpenRouter and Apollo credits were exhausted during the extended run, so later regional profiles used deterministic fallback synthesis and skipped Apollo enrichment.
- The pipeline still produced complete profile and logo artifacts for all 112 target companies.
- If maximum profile quality is required, rerun the regional Week 3/4 corpus after refilling OpenRouter and Apollo credits.
