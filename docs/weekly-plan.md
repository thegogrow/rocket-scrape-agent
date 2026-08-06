# Weekly Plan — Outreach Validation

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

## Week 10 — Outreach Cycle: Send-From-Admin, Automated Follow-Up, First Batch
*Starts Jul 30, 2026 —*

All of Part A, C, and most of Part B are now built (code + schema). What's left is the account/DNS setup only a human can do (6, 7), and the operational batch work in Part D, which needs the sending account from 6/7 in place first.

**Part A — Tracking + Link Prerequisites:**

1. Add the `outreach_cycles` table (one row per provider: stage, last sent, next due date, resolution) — tracks which cycle stage each company is on, since nothing does today. **Deliverable:** schema migration in `docs/supabase-schema.sql`. **Status:** Done.
2. Add `cycle_number` to `outreach_messages` so a real send is tied to a stage instead of sitting as one of five static drafts. **Deliverable:** schema migration. **Status:** Done.
3. Add the `outreach_links` table (opaque token, provider, purpose, expiry, used-at) — purpose covers `access` (used by both the claim and removal forms on one shared page) and `opt_out`, so unsubscribe reuses the same system instead of needing its own build. **Deliverable:** schema migration. **Status:** Done.
4. Replace `?domain=` with `?token=` on `profile-access.html` (and the `claim.html`/`remove.html` redirects into it); generate a token whenever an outreach message with a link is created. **Deliverable:** `src/ui/supabaseStore.js` (`outreach_links` functions), `public/request-flow.js`, `src/api/resolve-outreach-link.js`. **Status:** Done.
5. Add a cycle-status badge (stage + next due date) directly in the existing admin Outreach Queue row — no separate "due today" panel needed. **Deliverable:** cycle status visible in Outreach Queue. **Status:** Done.

**Part B — Sending Infrastructure (email management inside the admin):**

6. Pick a sending provider (Resend or Postmark) and create the account. **Deliverable:** provider account + API key. **Status:** Not started — needs you to sign up and set `RESEND_API_KEY`/`RESEND_FROM_EMAIL`; the code (`src/email/resend.js`) is ready and waiting on the key.
7. Set up a dedicated sending subdomain with SPF/DKIM/DMARC. **Deliverable:** verified sending domain. **Status:** Not started — DNS records only you can add.
8. Build the `send-outreach` endpoint and a **Send** button on the approved draft in the Outreach Queue — sends via the provider's API, sets `outreach_messages.status = "sent"`, creates the `outreach_cycles` row. **Deliverable:** `src/api/send-outreach.js`, Send button in admin. **Status:** Done.
9. Treat a click on the token link (claim/remove/opt-out) as the engagement signal — skip building pixel-based open tracking, since it's unreliable in modern mail clients anyway. **Deliverable:** design decision recorded, no `opened` tracking built. **Status:** Done.
10. Wire claim, removal, and opt-out requests to automatically set `resolution` and stop the provider's cycle the moment any of them comes in. **Deliverable:** cycle auto-stops on claim/remove/opt-out. **Status:** Done.
11. Add a **"Mark as Replied"** manual button in the admin — since automatic inbound reply-detection is deferred (see Week 12+), a human seeing a real reply in their inbox clicks this once to stop the cycle. **Deliverable:** manual reply-stop control (`src/api/admin-outreach-cycle.js`). **Status:** Done.

**Part C — Automated Follow-Up Engine:**

12. Build the daily follow-up job as a Supabase `pg_cron` scheduled task (not a separate always-on process) — finds providers whose `next_action_due_at` has passed and who aren't resolved, sends the next email in sequence (Email 2, then Email 3), and advances the cycle. **Deliverable:** `src/api/outreach-followup.js`, `pg_cron`/`pg_net` job in `docs/supabase-schema.sql`. **Status:** Code done; the SQL job still needs a one-time run in the Supabase SQL editor with your deployed URL and `OUTREACH_CRON_SECRET` filled in (see the comment block above it in the schema file).
13. Add a manual "pause" toggle per provider as a safeguard before the job fires on it. **Deliverable:** pause control in admin. **Status:** Done.

**Part D — Select, Test, and Send the First Real Batch:**

14. Select 20–30 approved profiles most likely to respond (smallest, most active, or companies met at events). **Deliverable:** named batch list. **Status:** Not started — your call on which companies.
15. Source/confirm a primary outreach contact per profile in the admin (name, email, LinkedIn) where missing. **Deliverable:** contacts complete for the batch. **Status:** Not started.
16. Generate and review Email 1 drafts for the batch; edit for accuracy and tone; approve. **Deliverable:** approved Email 1 per profile. **Status:** Not started — admin UI for this already existed before Week 10.
17. Add a dry-run/test-mode flag that redirects all sends to a test inbox regardless of the real recipient. **Deliverable:** safe end-to-end testing without touching real companies. **Status:** Done — `OUTREACH_DRY_RUN` defaults to `true` in `.env.example`, so sends redirect to `OUTREACH_TEST_INBOX_EMAIL` until deliberately turned off.
18. Run the full cycle against yourself in test mode: Email 1 → simulate no reply → confirm the follow-up job fires Email 2 → click "Mark as Replied" → confirm the cycle stops. **Deliverable:** verified working cycle. **Status:** Not started — needs 6/7 done first so there's something to actually send with.
19. Only after that passes: send Email 1 to the real batch via the admin Send button. **Deliverable:** first real outreach sent, cycle tracking live. **Status:** Not started.

## Week 11 — Results Report, Decision Gate, and Admin Tags UI Cleanup
*After the Week 10 cycle closes out (last profile hits `closed_no_response` or resolves)*

1. Compile results: claims, removals, replies (other), closed-no-response, per stage of the cycle. **Deliverable:** results notes.
2. Write a short outreach results report (is email quality good enough, is the claim-request flow enough/too much friction, which cycle stage converted). **Deliverable:** `docs/sprint2-outreach-report.md`.
3. Decide whether manual sending is the bottleneck or contact sourcing is — these have different fixes (see Week 12+). **Deliverable:** documented go/no-go decision.
4. Fix and improve the UI of the admin Tags page (`tag_taxonomy` management view) — layout, usability, and visual consistency with the rest of the admin. **Deliverable:** improved Tags page UI.

## Week 12+ — Automation (Only If Week 11 Justifies It)
*Build only what's justified — not steps to complete by default*

1. Adopt a cold-outreach sequencer (Instantly.ai, Smartlead, Lemlist, or Apollo.io sequences) instead of building SendGrid/Postmark — build only if manual sending becomes the bottleneck. **Deliverable:** sequencer sending + tracking live.
2. Wire Apollo people-search (fallback: Hunter.io) into contact creation — build only if contact sourcing becomes the slow part. **Deliverable:** auto-filled `outreach_contacts`.
3. Add automatic inbound reply detection (Postmark Inbound/Mailgun Routes), matching replies via a per-provider plus-address (`outreach+<provider_id>@yourdomain.com`) — build only if manually clicking "Mark as Replied" becomes tedious at higher reply volume. **Deliverable:** reply detection live.
4. Build the self-serve OTP + account-creation claim flow — build only if claim requests outpace manual admin review. **Deliverable:** self-serve claim flow.
5. Write a formal Sprint 2 report equivalent to `docs/archive/final-report.md` — once a large-enough outreach sample exists. **Deliverable:** `docs/sprint2-report.md`.

## Check-Ins

- **Week 10** (Jul 30 onward) — You present: send-from-admin and automated follow-up job built and tested, first real batch sent. We decide together: any adjustments to the stage/due-date model or Email 2/3 content based on early replies.
- **Week 11** (After cycle closes) — You present: full outreach results + report, admin Tags page UI cleanup. We decide together: sequencer vs. continued manual sending; which deferred items to build next.
