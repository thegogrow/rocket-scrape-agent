# Weekly Plan — Outreach Validation

Status: Deadlines to be filled in together.

Weeks 1–9 are the completed record, condensed from `docs/project-documentation.md` into the same list format as the rest of this plan, so this one document tracks the whole project week by week. Week 10 onward is the go-forward plan: it doesn't restart Sprint 2's original numbering, it picks up from where the admin, outreach-draft, and claim-request infrastructure already stands, and targets the actual Sprint 2 objective — prove that scraped profiles turn into real customer relationships. The remaining Sprint 2 tasks (email delivery automation, self-serve OTP claim, scraper-side contact extraction) are optional follow-on work, built only if validation shows they're worth it — not steps to complete for their own sake.

## Week 1 — Research + First End-to-End Result
*May 28 – Jun 3, 2026*

1. Set up the Node.js project skeleton: Firecrawl SDK, OpenRouter via OpenAI SDK, Cheerio, dotenv. **Deliverable:** working project skeleton. **Status:** Done.
2. Research Firecrawl, GitHub API, Apollo, Clearbit capabilities and limitations. **Deliverable:** `docs/archive/week1-research.md`. **Status:** Done.
3. Collect all Rocket Engineers test-company URLs. **Deliverable:** `data/company-urls.json`. **Status:** Done.
4. Run Firecrawl on all test companies; save raw output per company. **Deliverable:** `output/<domain>/raw.json`. **Status:** Done.
5. Build the LLM synthesis step; generate first AI profiles. **Deliverable:** `src/llm/openrouter.js`. **Status:** Done.
6. Review generated profiles against existing RE profiles. **Deliverable:** `docs/archive/week1-review.md`. **Status:** Done.

## Week 2 — Add Sources + Full Pipeline for All Test Companies
*Jun 4 – Jun 10, 2026*

1. Build the GitHub integration: org match, repos, languages, contributor activity. **Deliverable:** `src/github/github.js`. **Status:** Done.
2. Build the Apollo enrichment module (company size, location, LinkedIn). **Deliverable:** `src/enrichment/apollo.js`. **Status:** Done.
3. Unify the pipeline: Firecrawl + GitHub + Apollo → LLM → JSON profile + logo; accept single or multiple URLs. **Deliverable:** `src/pipeline/runPipeline.js`. **Status:** Done.
4. Run the full pipeline on all RE test companies. **Deliverable:** complete profiles + logos. **Status:** Done.
5. Build the comparison spreadsheet: existing vs. scraped fields. **Deliverable:** `docs/archive/week2-comparison.csv`. **Status:** Done.

## Week 3 — Iterate on Quality + Scale to 50+
*Jun 11 – Jun 17, 2026*

1. Harden the LLM prompt against vendor-partnership hallucination. **Deliverable:** `src/llm/openrouter.js`. **Status:** Done.
2. Improve logo extraction with ranked candidate scoring (Brandfetch, JSON-LD, metadata, CSS, common paths). **Deliverable:** documented in `docs/archive/final-report.md`. **Status:** Done.
3. Source 60 additional Swiss/German provider URLs (DACH-focused). **Deliverable:** `data/week3-additional-company-urls.json`. **Status:** Done.
4. Run the full pipeline on all 60 companies. **Deliverable:** 60/60 profiles, 60/60 logos. **Status:** Done.
5. Manually review a 20-profile sample, per-field accuracy. **Deliverable:** `docs/archive/week3-quality-report.md`, `docs/archive/week3-quality-review.csv`. **Status:** Done.

## Week 4 — Scale to 100+ Profiles, Cost Model, Final Report, Demo
*Jun 18 – Jun 24, 2026*

1. Source 35 additional German provider URLs; reach 112 total profiles/logos. **Deliverable:** `data/week4-additional-company-urls.json`. **Status:** Done.
2. Build the cost model, projected to 1,000 and 5,000 profiles. **Deliverable:** `docs/archive/week3-cost-model.md`. **Status:** Done.
3. Write the Final Report. **Deliverable:** `docs/archive/final-report.md`. **Status:** Done.
4. Build the demo (deterministic + live). **Deliverable:** `docs/archive/demo-script.md`, `npm run demo`. **Status:** Done.
5. De-prioritize GitHub as primary technology source in favor of website content. **Deliverable:** `src/utils/enforceWebsiteFirstTechnologies.js`. **Status:** Done.
6. Build the local profile browser with filters and recent-activity dates/sources. **Deliverable:** `npm run ui`, `src/ui/server.js`. **Status:** Done.
7. Compare a Chinese LLM model (DeepSeek V3.1) against the primary model. **Deliverable:** `docs/archive/model-comparison-4.7.md`. **Status:** Done.

## Week 5 — Sprint 1 Baseline Lock
*Jun 25 – Jul 1, 2026*

1. Back up and lock the 201 cleaned public provider profiles as the Sprint 2 starting dataset. **Deliverable:** `docs/archive/sprint1-baseline.md`, `backups/sprint1-baseline-20260713/`. **Status:** Done.

## Week 6 — Admin Backend + Human Review Flow
*Jul 2 – Jul 8, 2026*

1. Add the profile lifecycle status field in Supabase. **Deliverable:** `providers.status` (scraped → ... → removed). **Status:** Done.
2. Build the admin profile list view: filter by status, sort, search, paginate. **Deliverable:** `public/admin.html`, `public/admin.js`. **Status:** Done.
3. Build the admin profile detail view: editable fields, status dropdown, logo re-upload. **Deliverable:** admin detail view. **Status:** Done.
4. Build the review/quality-feedback workflow (missing/incorrect/added fields, reviewer notes, up/down signal). **Deliverable:** `reviewer_feedback` table. **Status:** Done.
5. Add a tag taxonomy to standardize services/industries/technologies/vendor-partnership tags. **Deliverable:** `tag_taxonomy` table. **Status:** Done.

## Week 7 — Outreach Contacts + Email Generation
*Jul 9 – Jul 15, 2026*

1. Build the outreach contacts table and admin UI (name, title, email, LinkedIn, seniority, source, primary flag). **Deliverable:** `outreach_contacts` table. **Status:** Done.
2. Build the LLM outreach generator: Email 1/2/3, LinkedIn message, claim-profile invitation in one call. **Deliverable:** `src/llm/outreachMessages.js`. **Status:** Done.
3. Wire generation into the admin: generate drafts for a provider's primary contact, log activity, don't silently overwrite. **Deliverable:** `src/api/admin-generate-outreach.js`. **Status:** Done.
4. Build the outreach message status tracking (draft/approved/sent/opened/clicked/replied). **Deliverable:** `outreach_messages` table. **Status:** Done.

## Week 8 — Claim Flow
*Jul 16 – Jul 22, 2026*

1. Build the public unclaimed-profile experience. **Deliverable:** `public/index.html`, `public/profile-access.html`, `public/claim.html`, `public/remove.html`. **Status:** Done.
2. Build the claim/removal request flow: company submits request tied to their profile, admin reviews and approves/rejects. **Deliverable:** `claim-request.js` → `claim_requests` table → `admin-claim-request.js`. **Status:** Done.
3. Build the companion "connect with a provider" buyer-lead flow. **Deliverable:** `public/connect.html` → `provider-lead.js` → `provider_leads` table. **Status:** Done.

## Week 9 — Activity Log + Metrics
*Jul 23 – Jul 29, 2026*

1. Build the canonical activity log (event type, label, summary, actor, metadata). **Deliverable:** `activity_events` table, `admin-activity.js`. **Status:** Done.
2. Build the Metrics dashboard: profile counts by status, outreach signal breakdown, email-engagement summary. **Deliverable:** admin Metrics panel. **Status:** Done.
3. Add CSV exports: reviewed providers, outreach queue, claim requests, leads, events, signals. **Deliverable:** `docs/archive/sprint2-operations.md`. **Status:** Done.
4. Add a readiness-check script for env vars, API routes, and schema before demo/deploy. **Deliverable:** `npm run readiness:sprint2`. **Status:** Done.
5. Add success stories, provider events, and market signals tables with admin approval. **Deliverable:** `success_stories`, `provider_events`, `market_signals` tables. **Status:** Done.

---

## Week 10 — Outreach Cycle: Prerequisites, First Batch, and Follow-Through
*Starts Jul 30, 2026 — this block spans the full outreach cycle (build → send → follow up), not a single calendar week, since follow-ups run on a ~12–14 day cadence*

**Part A — Prerequisites (build once, unblocks tracking for every future batch):**

1. Add the `outreach_cycles` table (one row per provider: stage, last sent, next due date, resolution) — tracks which cycle stage each company is on, since nothing does today. **Deliverable:** schema migration in `docs/supabase-schema.sql`. **Deadline:** TBD.
2. Add `cycle_number` to `outreach_messages` so a real send is tied to a stage instead of sitting as one of five static drafts. **Deliverable:** schema migration. **Deadline:** TBD.
3. Add the `outreach_links` table (opaque token, provider, purpose, expiry, used-at) — replaces the unauthenticated `?domain=acme.com` claim/remove link. **Deliverable:** schema migration. **Deadline:** TBD.
4. Replace `?domain=` with `?token=` on `profile-access.html`, `claim.html`, and `remove.html`; generate a token whenever an outreach message with a link is created. **Deliverable:** signed claim/remove links. **Deadline:** TBD.
5. Build the "due today" admin view: providers where `next_action_due_at <= today` and not yet resolved (claimed/removed/closed_no_response). **Deliverable:** daily action list in admin. **Deadline:** TBD.

**Part B — Select and Send the First Real Batch:**

6. Select 20–30 approved profiles most likely to respond (smallest, most active, or companies met at events). **Deliverable:** named batch list. **Deadline:** TBD.
7. Source/confirm a primary outreach contact per profile in the admin (name, email, LinkedIn) where missing. **Deliverable:** contacts complete for the batch. **Deadline:** TBD.
8. Generate and review Email 1 drafts for the batch; edit for accuracy and tone; links use the new token scheme. **Deliverable:** approved Email 1 per profile. **Deadline:** TBD.
9. Send Email 1 manually from a real inbox. **Deliverable:** first real outreach sent. **Deadline:** TBD.
10. The moment each email sends, create its `outreach_cycles` row: `cycle_1_sent`, `next_action_due_at = +6 days`. This is the habit that makes the whole cycle trackable — not just an activity-log entry. **Deliverable:** cycle row per sent profile. **Deadline:** TBD.

**Part C — Monitor and Follow Up Through the Cycle:**

11. Check the "due today" list each day instead of scanning everything. **Deliverable:** daily check habit. **Deadline:** TBD.
12. On reply/claim/removal, immediately set `resolution` and stop the cycle — never let it reach the next stage. **Deliverable:** no follow-ups sent to responders. **Deadline:** TBD.
13. For no response by the due date, send Email 2, advance to `cycle_2_sent`, set a new due date (~5–7 days out). **Deliverable:** cycle 2 sent where due. **Deadline:** TBD.
14. For no response after Email 2's due date, send Email 3, advance to `cycle_3_sent`, set final due date (~12–14 days total from first send). **Deliverable:** cycle 3 sent where due. **Deadline:** TBD.
15. After Email 3 with no response, set `closed_no_response`. Done — don't send more. **Deliverable:** closed-out profiles. **Deadline:** TBD.

## Week 11 — Results Report, Decision Gate, and Admin Tags UI Cleanup
*After the Week 10 cycle closes out (last profile hits `closed_no_response` or resolves)*

1. Compile results: claims, removals, replies (other), closed-no-response, per stage of the cycle. **Deliverable:** results notes. **Deadline:** TBD.
2. Write a short outreach results report (is email quality good enough, is the claim-request flow enough/too much friction, which cycle stage converted). **Deliverable:** `docs/sprint2-outreach-report.md`. **Deadline:** TBD.
3. Decide whether manual sending is the bottleneck or contact sourcing is — these have different fixes (see Week 12+). **Deliverable:** documented go/no-go decision. **Deadline:** TBD.
4. Fix and improve the UI of the admin Tags page (`tag_taxonomy` management view) — layout, usability, and visual consistency with the rest of the admin. **Deliverable:** improved Tags page UI. **Deadline:** TBD.

## Week 12+ — Automation (Only If Week 11 Justifies It)
*Build only what's justified — not steps to complete by default*

1. Adopt a cold-outreach sequencer (Instantly.ai, Smartlead, Lemlist, or Apollo.io sequences) instead of building SendGrid/Postmark — build only if manual sending becomes the bottleneck. **Deliverable:** sequencer sending + tracking live. **Deadline:** TBD.
2. Wire Apollo people-search (fallback: Hunter.io) into contact creation — build only if contact sourcing becomes the slow part. **Deliverable:** auto-filled `outreach_contacts`. **Deadline:** TBD.
3. Add inbound reply detection (Postmark Inbound/Mailgun Routes) — only if a DIY sending route was chosen instead of a sequencer. **Deliverable:** reply detection live. **Deadline:** TBD.
4. Build the self-serve OTP + account-creation claim flow — build only if claim requests outpace manual admin review. **Deliverable:** self-serve claim flow. **Deadline:** TBD.
5. Write a formal Sprint 2 report equivalent to `docs/archive/final-report.md` — once a large-enough outreach sample exists. **Deliverable:** `docs/sprint2-report.md`. **Deadline:** TBD.

## Check-Ins

- **Week 10** (Jul 30 onward) — You present: prereqs built, batch sent, cycle tracked daily through follow-ups. We decide together: any adjustments to the stage/due-date model or Email 2/3 content based on early replies.
- **Week 11** (After cycle closes) — You present: full outreach results + report, admin Tags page UI cleanup. We decide together: sequencer vs. continued manual sending; which deferred items to build next.
