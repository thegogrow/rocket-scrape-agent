# rocket-scrape-agent

Node.js pipeline for crawling Rocket Engineers provider websites, storing raw crawl output, generating AI profiles, and producing a Week 1 review report.

## Requirements

- Node.js 22 or newer

## Setup

1. Copy `.env.example` to `.env`.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the project:

   ```bash
   npm start
   ```

## Week 1 Scope

- Crawl provider websites discovered from Rocket Engineers.
- Save raw Firecrawl output per company.
- Generate AI company profiles with OpenRouter via the OpenAI SDK.
- Save logos when a valid logo URL is available.
- Use Brandfetch as a logo fallback when site metadata is weak.
- Generate a markdown review report from saved output data.
- Browse generated profiles in a local frontend with filters and detail views.

## Project Structure

```text
.
├── data/
├── docs/
├── output/
├── src/
│   ├── config/
│   │   └── env.js
│   ├── crawlers/
│   │   └── firecrawl.js
│   ├── enrichment/
│   ├── github/
│   ├── llm/
│   │   └── openrouter.js
│   ├── pipeline/
│   │   └── runPipeline.js
│   ├── utils/
│   │   ├── fileSaver.js
│   │   ├── generateWeek1Review.js
│   │   └── loadCompanies.js
│   └── index.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
```

## Scripts

- `npm start`: Load company URLs and run the pipeline.
- `npm run dev`: Run the entrypoint in watch mode.
- `npm run review:week1`: Generate `docs/week1-review.md` from `output/`.
- `npm run pipeline:week3`: Run the pipeline for `data/week3-additional-company-urls.json`.
- `npm run pipeline:week4`: Run the pipeline for `data/week4-additional-company-urls.json`.
- `npm run report:week3`: Generate `docs/week3-quality-report.md` and `docs/week3-quality-review.csv`.
- `npm run cost:week3`: Generate `docs/week3-cost-model.md`.
- `npm run demo`: Run a deterministic replay demo that emits profile JSON and logo output.
- `npm run demo:live`: Run a live demo through the pipeline for a supplied URL.
- `npm run ui`: Start the local profile browser at `http://localhost:3001`.

## Profile Browser

Run:

```bash
npm run ui
```

The browser reads existing folders in `output/` and shows company logo, name, services, technologies, vendor partnerships, links, confidence score, recent activity dates/sources when available, full profile JSON, source data, raw crawl data, logo source, and review notes. Filters cover country, services, technologies, vendor partnerships, confidence score, and free-text search.

## Week 1 Documents

- `docs/week1-research.md`: Research notes on Firecrawl, GitHub API, Apollo, and Clearbit.
- `docs/week1-review.md`: Review report generated from current output data.
- `docs/week3-quality-report.md`: Week 3 before/after quality summary, per-field review scoring, and logo success rate.
- `docs/week3-cost-model.md`: Firecrawl, Apollo/Clearbit, Brandfetch, and OpenRouter cost model for 1,000 and 5,000 profiles.
- `docs/final-report.md`: Final project report with architecture, quality, cost, scale, limitations, and next steps.
- `docs/demo-script.md`: 15-minute demo runbook.

## Environment Variables

- `NODE_ENV`: Application environment.
- `FIRECRAWL_API_KEY`: API key for Firecrawl crawl requests.
- `FIRECRAWL_BASE_URL`: Base URL for the Firecrawl API.
- `OPENROUTER_API_KEY`: API key for OpenRouter.
- `OPENROUTER_BASE_URL`: Base URL used by the OpenAI SDK for OpenRouter.
- `OPENROUTER_MODEL`: Default model identifier for future LLM calls.
- `GITHUB_TOKEN`: Token for higher GitHub API limits.
- `APOLLO_API_KEY`: API key for Apollo enrichment.
- `APOLLO_BASE_URL`: Base URL for the Apollo API.
- `BRANDFETCH_API_KEY`: API key for Brandfetch logo fallback.
- `BRANDFETCH_BASE_URL`: Base URL for the Brandfetch Brand API.
- `OUTPUT_DIR`: Directory for generated outputs.
- `DATA_DIR`: Directory for cached or raw data files.

## Important

- The codebase is ready to run, but a real end-to-end result still requires valid `FIRECRAWL_API_KEY` and `OPENROUTER_API_KEY` values in `.env`.
- The official Firecrawl Node SDK currently requires Node.js 22+.
- The current `data/company-urls.json` is seeded from providers visible on `https://www.rocketengineers.io/explore` as reviewed on 2026-06-03.
