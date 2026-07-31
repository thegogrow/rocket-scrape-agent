# Weekly Plan — Outreach Validation

Status: Deadlines to be filled in together.

Weeks 1–9 are the completed record, condensed from `docs/project-documentation.md` into the same task-table format as the rest of this plan, so this one document tracks the whole project week by week. Week 10 onward is the go-forward plan: it doesn't restart Sprint 2's original numbering, it picks up from where the admin, outreach-draft, and claim-request infrastructure already stands, and targets the actual Sprint 2 objective — prove that scraped profiles turn into real customer relationships. The remaining Sprint 2 tasks (email delivery automation, self-serve OTP claim, scraper-side contact extraction) are optional follow-on work, built only if validation shows they're worth it — not steps to complete for their own sake.

## Week 1 — Research + First End-to-End Result

| # | Task | Deliverable | Status |
| --- | --- | --- | --- |
| 1.1 | Set up the Node.js project skeleton: Firecrawl SDK, OpenRouter via OpenAI SDK, Cheerio, dotenv. | Working project skeleton | Done |
| 1.2 | Research Firecrawl, GitHub API, Apollo, Clearbit capabilities and limitations. | `docs/archive/week1-research.md` | Done |
| 1.3 | Collect all Rocket Engineers test-company URLs. | `data/company-urls.json` | Done |
| 1.4 | Run Firecrawl on all test companies; save raw output per company. | `output/<domain>/raw.json` | Done |
| 1.5 | Build the LLM synthesis step; generate first AI profiles. | `src/llm/openrouter.js` | Done |
| 1.6 | Review generated profiles against existing RE profiles. | `docs/archive/week1-review.md` | Done |

## Week 2 — Add Sources + Full Pipeline for All Test Companies

| # | Task | Deliverable | Status |
| --- | --- | --- | --- |
| 2.1 | Build the GitHub integration: org match, repos, languages, contributor activity. | `src/github/github.js` | Done |
| 2.2 | Build the Apollo enrichment module (company size, location, LinkedIn). | `src/enrichment/apollo.js` | Done |
| 2.3 | Unify the pipeline: Firecrawl + GitHub + Apollo → LLM → JSON profile + logo; accept single or multiple URLs. | `src/pipeline/runPipeline.js` | Done |
| 2.4 | Run the full pipeline on all RE test companies. | Complete profiles + logos | Done |
| 2.5 | Build the comparison spreadsheet: existing vs. scraped fields. | `docs/archive/week2-comparison.csv` | Done |

## Week 3 — Iterate on Quality + Scale to 50+

| # | Task | Deliverable | Status |
| --- | --- | --- | --- |
| 3.1 | Harden the LLM prompt against vendor-partnership hallucination. | `src/llm/openrouter.js` | Done |
| 3.2 | Improve logo extraction with ranked candidate scoring (Brandfetch, JSON-LD, metadata, CSS, common paths). | Documented in `docs/archive/final-report.md` | Done |
| 3.3 | Source 60 additional Swiss/German provider URLs (DACH-focused). | `data/week3-additional-company-urls.json` | Done |
| 3.4 | Run the full pipeline on all 60 companies. | 60/60 profiles, 60/60 logos | Done |
| 3.5 | Manually review a 20-profile sample, per-field accuracy. | `docs/archive/week3-quality-report.md`, `docs/archive/week3-quality-review.csv` | Done |

## Week 4 — Scale to 100+ Profiles, Cost Model, Final Report, Demo

| # | Task | Deliverable | Status |
| --- | --- | --- | --- |
| 4.1 | Source 35 additional German provider URLs; reach 112 total profiles/logos. | `data/week4-additional-company-urls.json` | Done |
| 4.2 | Build the cost model, projected to 1,000 and 5,000 profiles. | `docs/archive/week3-cost-model.md` | Done |
| 4.3 | Write the Final Report. | `docs/archive/final-report.md` | Done |
| 4.4 | Build the demo (deterministic + live). | `docs/archive/demo-script.md`, `npm run demo` | Done |
| 4.5 | De-prioritize GitHub as primary technology source in favor of website content. | `src/utils/enforceWebsiteFirstTechnologies.js` | Done |
| 4.6 | Build the local profile browser with filters and recent-activity dates/sources. | `npm run ui`, `src/ui/server.js` | Done |
| 4.7 | Compare a Chinese LLM model (DeepSeek V3.1) against the primary model. | `docs/archive/model-comparison-4.7.md` | Done |

## Week 5 — Sprint 1 Baseline Lock

| # | Task | Deliverable | Status |
| --- | --- | --- | --- |
| 5.1 | Back up and lock the 201 cleaned public provider profiles as the Sprint 2 starting dataset. | `docs/archive/sprint1-baseline.md`, `backups/sprint1-baseline-20260713/` | Done |

## Week 6 — Admin Backend + Human Review Flow

| # | Task | Deliverable | Status |
| --- | --- | --- | --- |
| 6.1 | Add the profile lifecycle status field in Supabase. | `providers.status` (scraped → ... → removed) | Done |
| 6.2 | Build the admin profile list view: filter by status, sort, search, paginate. | `public/admin.html`, `public/admin.js` | Done |
| 6.3 | Build the admin profile detail view: editable fields, status dropdown, logo re-upload. | Admin detail view | Done |
| 6.4 | Build the review/quality-feedback workflow (missing/incorrect/added fields, reviewer notes, up/down signal). | `reviewer_feedback` table | Done |
| 6.5 | Add a tag taxonomy to standardize services/industries/technologies/vendor-partnership tags. | `tag_taxonomy` table | Done |

## Week 7 — Outreach Contacts + Email Generation

| # | Task | Deliverable | Status |
| --- | --- | --- | --- |
| 7.1 | Build the outreach contacts table and admin UI (name, title, email, LinkedIn, seniority, source, primary flag). | `outreach_contacts` table | Done |
| 7.2 | Build the LLM outreach generator: Email 1/2/3, LinkedIn message, claim-profile invitation in one call. | `src/llm/outreachMessages.js` | Done |
| 7.3 | Wire generation into the admin: generate drafts for a provider's primary contact, log activity, don't silently overwrite. | `src/api/admin-generate-outreach.js` | Done |
| 7.4 | Build the outreach message status tracking (draft/approved/sent/opened/clicked/replied). | `outreach_messages` table | Done |

## Week 8 — Claim Flow

| # | Task | Deliverable | Status |
| --- | --- | --- | --- |
| 8.1 | Build the public unclaimed-profile experience. | `public/index.html`, `public/profile-access.html`, `public/claim.html`, `public/remove.html` | Done |
| 8.2 | Build the claim/removal request flow: company submits request tied to their profile, admin reviews and approves/rejects. | `claim-request.js` → `claim_requests` table → `admin-claim-request.js` | Done |
| 8.3 | Build the companion "connect with a provider" buyer-lead flow. | `public/connect.html` → `provider-lead.js` → `provider_leads` table | Done |

## Week 9 — Activity Log + Metrics

| # | Task | Deliverable | Status |
| --- | --- | --- | --- |
| 9.1 | Build the canonical activity log (event type, label, summary, actor, metadata). | `activity_events` table, `admin-activity.js` | Done |
| 9.2 | Build the Metrics dashboard: profile counts by status, outreach signal breakdown, email-engagement summary. | Admin Metrics panel | Done |
| 9.3 | Add CSV exports: reviewed providers, outreach queue, claim requests, leads, events, signals. | `docs/archive/sprint2-operations.md` | Done |
| 9.4 | Add a readiness-check script for env vars, API routes, and schema before demo/deploy. | `npm run readiness:sprint2` | Done |
| 9.5 | Add success stories, provider events, and market signals tables with admin approval. | `success_stories`, `provider_events`, `market_signals` tables | Done |

---

## Week 10 — Select and Send the First Real Batch

| # | Task | Deliverable | Deadline |
| --- | --- | --- | --- |
| 10.1 | Select 20–30 approved profiles most likely to respond (smallest, most active, or companies met at events). | Named batch list |  |
| 10.2 | Source/confirm a primary outreach contact per profile in the admin (name, email, LinkedIn) where missing. | Contacts complete for the batch |  |
| 10.3 | Generate and review Email 1 drafts for the batch; edit for accuracy and tone. | Approved Email 1 per profile |  |
| 10.4 | Send Email 1 manually from a real inbox (no delivery pipeline needed yet). | First real outreach sent |  |
| 10.5 | Log each send as an activity event per provider (`outreach_pending` → `outreach_active`). | Activity log reflects real sends |  |

## Week 11 — Monitor and Follow Up

| # | Task | Deliverable | Deadline |
| --- | --- | --- | --- |
| 11.1 | Monitor replies, claim requests, and removal requests daily. | Response notes |  |
| 11.2 | Log every reply/claim/removal in the admin activity log as it happens. | Up-to-date activity log |  |
| 11.3 | For non-responders after ~5–7 days, send Email 2 manually. | Follow-up sent |  |
| 11.4 | Review and action any claim requests that come in (`admin-claim-request`). | Claim requests reviewed |  |

## Week 12 — Final Follow-Up and Results Report

| # | Task | Deliverable | Deadline |
| --- | --- | --- | --- |
| 12.1 | For remaining non-responders after ~12–14 days, send Email 3 (final, brief). | Final nudge sent |  |
| 12.2 | Compile results: replies, claims, removal requests, anything qualitative from responses. | Results notes |  |
| 12.3 | Write a short outreach results report (is email quality good enough, is the claim-request flow enough/too much friction, which email in the sequence got responses). | `docs/sprint2-outreach-report.md` |  |
| 12.4 | Decide, based on results, which of the deferred Sprint 2 items are actually worth building next (see below). | Documented go/no-go decision |  |

## Week 13+ — Build Only What Week 12 Justifies

Pick from this list based on the Week 12 decision — don't build all of it by default:

| Candidate | Build it if... |
| --- | --- |
| Real email delivery/scheduling (SendGrid/Postmark) + open/click tracking | Manual sending becomes the bottleneck, or you need real engagement metrics to keep iterating. |
| Self-serve OTP + account-creation claim flow | Claim requests start arriving faster than manual admin review can keep up, or friction from the request-based flow is visibly costing claims. |
| Scraper-side contact auto-extraction (Apollo) | You're regularly sourcing contacts for new batches by hand and it's becoming the slow part. |
| Formal Sprint 2 report equivalent to `docs/archive/final-report.md` | Once a large-enough outreach sample exists to draw real conclusions from. |

## Check-Ins

| Check-in | Date | You Present | We Decide Together |
| --- | --- | --- | --- |
| Week 10 | | First real batch sent, contacts confirmed | Any batch changes before follow-ups start |
| Week 11 | | Response/claim activity so far | Whether to adjust Email 2 based on early replies |
| Week 12 | | Full outreach results + report | Which deferred Sprint 2 items to build next |
