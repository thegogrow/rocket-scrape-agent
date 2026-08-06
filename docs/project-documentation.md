# Rocket Engineers Scrape Agent — Project Documentation (Week 1–10)

Prepared: 2026-07-31
Updated: 2026-08-06
Prepared for: Phil (client)

A week-by-week record of what was built, from the first Firecrawl crawl through the current state of the Sprint 2 admin, outreach, and claim workflow.

---

## Sprint 1: Scrape Agent Proof of Concept

### Week 1 — Research + First End-to-End Result

- Set up the Node.js project skeleton with the Firecrawl SDK, OpenRouter (via the OpenAI SDK with a custom base URL), Cheerio, and dotenv.
- Researched Firecrawl, the GitHub REST API, Apollo, and Clearbit — capabilities and limitations documented in `docs/archive/week1-research.md`.
- Collected the full list of Rocket Engineers test-company URLs into `data/company-urls.json`.
- Ran Firecrawl across all test companies, saving raw crawl output per company under `output/<domain>/raw.json`.
- Built the LLM synthesis step (`src/llm/openrouter.js`) and generated the first AI profiles.
- Reviewed generated profiles against existing RE profiles; findings captured in `docs/archive/week1-review.md`.

### Week 2 — Add Sources + Full Pipeline for All Test Companies

- Built the GitHub integration (`src/github/github.js`): org matching by company name/domain, repos, languages, contributor activity.
- Built the Apollo enrichment module (`src/enrichment/apollo.js`) for company size, location, and LinkedIn data.
- Unified the pipeline (`src/pipeline/runPipeline.js`) to run Firecrawl + GitHub + Apollo → LLM synthesis → JSON profile + logo, accepting a single URL or a list.
- Ran the full pipeline on all Rocket Engineers test companies.
- Built the field-by-field comparison spreadsheet: `docs/archive/week2-comparison.csv`.

### Week 3 — Iterate on Quality + Scale to 50+

- Hardened the LLM prompt against vendor-partnership hallucination — excluded customers, clients, case-study brands, and tool dependencies from being misread as partnerships.
- Improved logo extraction with ranked candidate scoring: Brandfetch first, then JSON-LD, metadata tags, CSS backgrounds, and common logo paths, with favicons penalized.
- Sourced 60 additional Swiss and German provider URLs (`data/week3-additional-company-urls.json`, discovery notes in `data/week3-url-discovery.csv`), focused on the DACH region to match the product's target market.
- Ran the full pipeline on all 60 companies: 60/60 profiles, 60/60 logos.
- Manually reviewed a 20-profile sample with per-field accuracy scoring: `docs/archive/week3-quality-report.md`, `docs/archive/week3-quality-review.csv`.

### Week 4 — Scale to 100+ Profiles, Cost Model, Final Report, Demo

- Sourced 35 additional German provider URLs (`data/week4-additional-company-urls.json`).
- Reached the final target corpus: **112 profiles, 112 logos, 112/112 complete profile+logo pairs** (17 RE test companies + 60 Week 3 + 35 Week 4).
- Built the cost model (`docs/archive/week3-cost-model.md`): ~$0.04/profile OpenRouter, ~$0.05/profile Brandfetch, projected to 1,000 and 5,000 profiles.
- Wrote the Final Report (`docs/archive/final-report.md`) covering architecture, what works/doesn't, tools evaluation, LLM performance, cost, quality metrics, and recommendations.
- Built the demo: `docs/archive/demo-script.md`, `npm run demo` (deterministic replay) and `npm run demo:live`.
- De-prioritized GitHub as the primary technology source in favor of website content (`src/utils/enforceWebsiteFirstTechnologies.js`).
- Built the local profile browser (`npm run ui`, `src/ui/server.js`) with filters for country, services, technologies, vendor partnerships, and confidence score, plus recent-activity dates and sources.
- Compared a Chinese LLM model (DeepSeek V3.1) against the primary model: `docs/archive/model-comparison-4.7.md`.

---

## Sprint 2: Outreach & Claim Workflow

### Baseline Lock

- Backed up and locked the 201 cleaned public provider profiles as the Sprint 2 starting dataset before adding lifecycle fields: `docs/archive/sprint1-baseline.md`, backup at `backups/sprint1-baseline-20260713/` (profiles, logos, domain list, manifest, checksum).

### Week 7 — Admin Backend + Human Review Flow

- Added the profile lifecycle status field in Supabase (`providers.status`): `scraped, in_review, approved, outreach_pending, outreach_active, claimed, unclaimed, removal_requested, removed`.
- Built the admin profile list view with status filtering, sorting, search, and pagination (`public/admin.html`, `public/admin.js`).
- Built the admin profile detail view: all fields editable, status dropdown, logo re-upload.
- Built the review/quality-feedback workflow as the `reviewer_feedback` table: reviewer email, up/down/neutral signal, missing fields, incorrect fields, manually-added fields, free-text notes, and the status transition the review produced.
- Added a tag taxonomy (`tag_taxonomy` table) to standardize services, industries, technologies, and vendor-partnership tags across the admin review workflow.

### Week 8 — Outreach Contacts + Email Generation

- Built the `outreach_contacts` table and admin UI: name, title, email, LinkedIn URL, seniority, source, with one contact markable as primary per provider.
- Built the LLM-powered outreach generator (`src/llm/outreachMessages.js`): one call produces five drafts per provider — Email 1 (initial), Email 2 (follow-up), Email 3 (final reminder), a LinkedIn message, and a claim-profile invitation. The prompt enforces no fabricated claims, no invented facts, professional/low-pressure tone, a LinkedIn message under 500 characters, and a link to verify/claim the profile in every message.
- Wired generation into the admin (`src/api/admin-generate-outreach.js`): generates drafts for a provider's primary contact, logs an activity entry, and won't silently overwrite existing drafts.
- Built the `outreach_messages` table tracking each draft's status: `draft, approved, sent, opened, clicked, replied`.

### Week 9 — Claim Flow

- Built the public unclaimed-profile experience: `public/index.html`, `public/profile-access.html`, `public/claim.html`, `public/remove.html`.
- Built the claim/removal request flow: a company submits a request tied to their specific provider profile (`POST /api/claim-request` → `claim_requests` table: domain, email, request type, status, metadata). An admin reviews and approves or rejects it (`PATCH /api/admin-claim-request`).
- Built a companion "connect with a provider" lead flow for buyer-side introduction requests (`public/connect.html` → `POST /api/provider-lead` → `provider_leads` table), reviewed the same way by admin (`new, reviewed, forwarded, closed`).

### Activity Log + Metrics

- Built the canonical activity log (`activity_events` table) with per-event type, label, summary, actor, and metadata, exposed via `POST /api/admin-activity`.
- Built the Metrics dashboard in the admin UI: profile counts by status, outreach signal breakdown, and an email-engagement summary panel.
- Added CSV exports from the admin: reviewed providers, outreach queue, claim requests, leads, events, and signals.
- Added a readiness-check script (`npm run readiness:sprint2`) that verifies required environment variables, expected API route files, and Supabase schema before a demo or deployment.
- Added `success_stories`, `provider_events`, and `market_signals` tables with their own admin approval workflow, for case studies and per-provider event/signal tracking.

### Week 10 — Outreach Cycle: Send-From-Admin, Automated Follow-Up

- Added outreach cycle tracking: the `outreach_cycles` table (one row per provider — stage `not_started → cycle_1_sent → cycle_2_sent → cycle_3_sent → closed`, resolution, pause flag, last-sent/next-due dates) and `outreach_messages.cycle_number`, so the admin can see which follow-up stage every company is on instead of inferring it from raw message rows.
- Replaced the unauthenticated `?domain=company.com` claim/removal link with opaque, expiring tokens: the `outreach_links` table (`src/api/resolve-outreach-link.js`, updated `public/request-flow.js` and `public/profile-access.html`), covering both the shared claim/removal access page and a one-click opt-out link.
- Added Resend email integration (`src/email/resend.js`) with a dry-run safety switch (`OUTREACH_DRY_RUN`, defaults on) that redirects all sends to a test inbox until deliberately turned off.
- Built the send-from-admin path: a **Send** action calls `src/api/send-outreach.js`, which delivers the email via Resend, marks the message sent, and advances the provider's cycle. The send/advance-cycle logic is shared (`src/email/sendOutreachMessage.js`) with the automated follow-up job.
- Built the automated daily follow-up job (`src/api/outreach-followup.js`, triggered by a Supabase `pg_cron`/`pg_net` job defined in `docs/supabase-schema.sql`): finds providers whose next action is due, sends Email 2 then Email 3 on schedule, and closes out non-responders after Email 3 — no manual daily checking required.
- Wired claim requests, removal requests, and opt-out clicks to automatically stop a provider's outreach cycle the moment any of them comes in, plus a manual **Mark as Replied** control (`src/api/admin-outreach-cycle.js`) for real replies, and a per-provider pause toggle.
- Generated emails now get an opt-out footer appended automatically, reusing the same token-link system as claim/removal.
- Added an email draft **Preview** in the admin that renders subject/body as the email will actually look (mirrors the paragraph formatting used in `src/email/resend.js`), and replaced the old "Edit Drafts" path (which opened the entire profile editor) with a dedicated outreach compose popup styled like an email client — To/Subject/body, status pill, and a contextual **Approve & Save / Save Changes / Send Email** action, including an inline **Generate Drafts** fallback when no drafts exist yet.
- Removed the speculative "Automation Options" panel (Apollo/Instantly/Smartlead/Lemlist comparison) from the admin outreach tab, and reworked the Outreach Queue table layout (dropped the Contacts column, added a Cycle status column, fixed an action-button overlap/hover-contrast bug introduced by the new controls).
- Fixed a bug where saving outreach messages from the admin silently cleared `cycle_number` on already-sent emails, because the client-side collect/normalize helpers never round-tripped that field.
- Sending account setup (Resend/Postmark signup, DNS, activating the cron job) and the first real batch send are tracked as go-live setup work in `docs/weekly-plan.md` Week 11 — Week 10 is the code/schema side only.

---

## Reference Index

| Area | File(s) |
| --- | --- |
| Sprint 1 baseline lock | `docs/archive/sprint1-baseline.md` |
| Week 1 research | `docs/archive/week1-research.md` |
| Week 1 review | `docs/archive/week1-review.md` |
| Week 2 comparison | `docs/archive/week2-comparison.csv` |
| Week 3 quality | `docs/archive/week3-quality-report.md`, `docs/archive/week3-quality-review.csv` |
| Week 3/4 cost model | `docs/archive/week3-cost-model.md` |
| Week 3/4 summary | `docs/archive/week3-week4-simple-report.md` |
| Final Report | `docs/archive/final-report.md` |
| Demo | `docs/archive/demo-script.md` |
| Model comparison | `docs/archive/model-comparison-4.7.md` |
| Sprint 2 operations | `docs/archive/sprint2-operations.md` |
| Supabase schema | `docs/supabase-schema.sql` |
| Week 10 outreach cycle + go-live setup | `docs/weekly-plan.md` (Week 10/11), `src/email/`, `src/api/send-outreach.js`, `src/api/outreach-followup.js` |
