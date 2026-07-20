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
- `npm run compare:model`: Compare the current OpenRouter model with DeepSeek V3.1 for Task 4.7.
- `npm run report:week3`: Generate `docs/week3-quality-report.md` and `docs/week3-quality-review.csv`.
- `npm run cost:week3`: Generate `docs/week3-cost-model.md`.
- `npm run demo`: Run a deterministic replay demo that emits profile JSON and logo output.
- `npm run demo:live`: Run a live demo through the pipeline for a supplied URL.
- `npm run export:ui`: Export generated providers from `output/` into deployable static UI data.
- `npm run ui`: Start the local profile browser at `http://localhost:3001`.

## Profile Browser

Run:

```bash
npm run ui
```

The local browser reads existing folders in `output/` and shows company logo, name, services, technologies, vendor partnerships, links, confidence score, recent activity dates/sources when available, evidence summaries, and review notes. Filters cover country, services, technologies, vendor partnerships, confidence score, and free-text search.

## Provider Data For Deployment

The source crawl output in `output/` is intentionally ignored by Git because it is generated data. For the public provider browser, the app uses Supabase when configured and falls back to the compact deployable export:

- `public/profiles.json`: provider cards and detail-page data.
- `public/logos/`: provider logos used by the UI.

After running or updating the pipeline, refresh the deployable provider data:

```bash
npm run export:ui
git add public/profiles.json public/logos
git commit -m "Update provider data"
git push
```

The Git export remains useful as a fallback and for local demos. The admin UI uses Supabase so providers can be reviewed and published without a redeploy.

## Supabase Admin UI

Run `docs/supabase-schema.sql` in the Supabase SQL editor, then create Supabase Auth users for the admins. For the first admin account, use `phil@thegogrow.ch` with the agreed password.

Set these Vercel environment variables:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAILS=phil@thegogrow.ch,nunezkathleenm@gmail.com
OPENROUTER_API_KEY=
```

The `/api/admin-*` routes verify Supabase Auth tokens and use the service role key only on the server. The Admin tab can queue scrape requests, view jobs, review database providers, and publish providers. The actual background scrape processor is intentionally separate from this UI layer.

## Week 1 Documents

- `docs/week1-research.md`: Research notes on Firecrawl, GitHub API, Apollo, and Clearbit.
- `docs/week1-review.md`: Review report generated from current output data.
- `docs/week3-quality-report.md`: Week 3 before/after quality summary, per-field review scoring, and logo success rate.
- `docs/week3-cost-model.md`: Firecrawl, Apollo/Clearbit, Brandfetch, and OpenRouter cost model for 1,000 and 5,000 profiles.
- `docs/final-report.md`: Final project report with architecture, quality, cost, scale, limitations, and next steps.
- `docs/demo-script.md`: 15-minute demo runbook.
- `docs/sprint2-operations.md`: Sprint 2 readiness checks, audit-history decision, and Admin CSV exports.

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
- `SUPABASE_URL`: Supabase project URL for the provider database.
- `SUPABASE_ANON_KEY`: Supabase anon key used for admin sign-in verification.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-only key used by Vercel API routes.
- `ADMIN_EMAILS`: Comma-separated admin emails allowed to access the Admin tab.

Run `npm run readiness:sprint2` before deployment to verify Supabase schema, required API route files, and deployment environment variables.

## Important

- The codebase is ready to run, but a real end-to-end result still requires valid `FIRECRAWL_API_KEY` and `OPENROUTER_API_KEY` values in `.env`.
- The official Firecrawl Node SDK currently requires Node.js 22+.
- The current `data/company-urls.json` is seeded from providers visible on `https://www.rocketengineers.io/explore` as reviewed on 2026-06-03.
