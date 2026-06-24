# 15-Minute Demo Script

## Goal

Show the full profile-generation story: URLs go in, source data is collected, the synthesis step creates a normalized profile, and `profile.json` plus `logo.png` come out.

## Recommended Demo Command

Use replay mode for the live presentation because it is deterministic and does not depend on remaining OpenRouter or Apollo credits:

```bash
npm run demo
```

Default replay URL:

```text
https://www.adfinis.com/
```

Replay output:

```text
output/demo/adfinis.com/profile.json
output/demo/adfinis.com/logo.png
```

## Live Pipeline Command

Use this only when Firecrawl, Brandfetch, Apollo, and OpenRouter credits are available:

```bash
npm run demo:live -- --url=https://www.adfinis.com/
```

If OpenRouter credits are unavailable but a live crawl is still desired:

```bash
SKIP_LLM=true npm run demo:live -- --url=https://www.adfinis.com/
```

## 15-Minute Walkthrough

1. **Minute 0-2: Input list**
   - Open `data/company-urls.json`, `data/week3-additional-company-urls.json`, and `data/week4-additional-company-urls.json`.
   - State that the final corpus has 112 Swiss/Germany target URLs with 112 generated profiles and logos.

2. **Minute 2-5: Collection**
   - Show `src/pipeline/runPipeline.js`.
   - Explain the sequence: Firecrawl website crawl, GitHub organization lookup, Apollo enrichment, Brandfetch logo lookup, source bundle save.
   - Open an example `output/fairwinds.com/source-bundle.json`.

3. **Minute 5-8: Synthesis**
   - Show `src/llm/openrouter.js`.
   - Highlight strict JSON shape, conservative extraction rules, and vendor-partnership constraints.
   - Run `npm run demo` and show the prompt-size line.

4. **Minute 8-11: Output**
   - Open `output/demo/fairwinds.com/profile.json`.
   - Open `output/demo/fairwinds.com/logo.png`.
   - Point out normalized fields: services, technologies, vendor partnerships, recent activity, GitHub URL, LinkedIn URL, confidence score.

5. **Minute 11-13: Quality**
   - Open `docs/week3-quality-report.md`.
   - Highlight 60/60 Week 3 profiles, 60/60 Week 3 logos, 20-profile sample, and vendor-partnership scoring.

6. **Minute 13-15: Scale and costs**
   - Open `docs/week3-cost-model.md`.
   - Highlight Firecrawl credits, Apollo credit calls, OpenRouter token model, Brandfetch amortization, and 1,000/5,000 profile projections.

## Talking Points

- The pipeline now treats vendor partnerships conservatively: explicit partner/certification/member evidence only.
- Logo extraction now tries Brandfetch first, then profile/crawl candidates, JSON-LD, metadata, CSS background URLs, and common logo paths.
- The pipeline is resilient to exhausted enrichment or LLM credits: it persists raw/source data and can produce fallback profiles rather than losing a run.
- Demo replay mode is intentionally deterministic; live mode remains available when paid API credits are available.
