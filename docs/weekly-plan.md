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

## Week 10 — Outreach Cycle: Send-From-Admin, Automated Follow-Up (Built)
*Jul 30, 2026 onward*

Everything below is code + schema, and it's done. The `outreach_cycles`/`outreach_links` tables are live in Supabase (confirmed). What's left — the sending account, DNS, activating the cron job, and the first real batch — needs a live sending account before any of it can run, so it moves to Week 11 rather than sitting here half-blocked.

**Part A — Tracking + Link Prerequisites:**

1. Add the `outreach_cycles` table (one row per provider: stage, last sent, next due date, resolution) — tracks which cycle stage each company is on, since nothing does today. **Deliverable:** schema migration in `docs/supabase-schema.sql`. **Status:** Done, applied to Supabase.
2. Add `cycle_number` to `outreach_messages` so a real send is tied to a stage instead of sitting as one of five static drafts. **Deliverable:** schema migration. **Status:** Done, applied to Supabase.
3. Add the `outreach_links` table (opaque token, provider, purpose, expiry, used-at) — purpose covers `access` (used by both the claim and removal forms on one shared page) and `opt_out`, so unsubscribe reuses the same system instead of needing its own build. **Deliverable:** schema migration. **Status:** Done, applied to Supabase.
4. Replace `?domain=` with `?token=` on `profile-access.html` (and the `claim.html`/`remove.html` redirects into it); generate a token whenever an outreach message with a link is created. **Deliverable:** `src/ui/supabaseStore.js` (`outreach_links` functions), `public/request-flow.js`, `src/api/resolve-outreach-link.js`. **Status:** Done.
5. Add a cycle-status badge (stage + next due date) directly in the existing admin Outreach Queue row — no separate "due today" panel needed. **Deliverable:** cycle status visible in Outreach Queue. **Status:** Done.

**Part B — Sending Infrastructure (code side):**

1. Build the `send-outreach` endpoint and a **Send** button on the approved draft in the Outreach Queue — sends via the provider's API, sets `outreach_messages.status = "sent"`, creates the `outreach_cycles` row. **Deliverable:** `src/api/send-outreach.js`, Send button in admin. **Status:** Done.
2. Treat a click on the token link (claim/remove/opt-out) as the engagement signal — skip building pixel-based open tracking, since it's unreliable in modern mail clients anyway. **Deliverable:** design decision recorded, no `opened` tracking built. **Status:** Done.
3. Wire claim, removal, and opt-out requests to automatically set `resolution` and stop the provider's cycle the moment any of them comes in. **Deliverable:** cycle auto-stops on claim/remove/opt-out. **Status:** Done.
4. Add a **"Mark as Replied"** manual button in the admin — since automatic inbound reply-detection is deferred (see Week 13+), a human seeing a real reply in their inbox clicks this once to stop the cycle. **Deliverable:** manual reply-stop control (`src/api/admin-outreach-cycle.js`). **Status:** Done.

**Part C — Automated Follow-Up Engine (code side):**

1. Build the daily follow-up job as a Supabase `pg_cron` scheduled task (not a separate always-on process) — finds providers whose `next_action_due_at` has passed and who aren't resolved, sends the next email in sequence (Email 2, then Email 3), and advances the cycle. **Deliverable:** `src/api/outreach-followup.js`, `pg_cron`/`pg_net` job in `docs/supabase-schema.sql`. **Status:** Code done; activating it (enabling the `pg_cron`/`pg_net` extensions, filling in your deployed URL and `OUTREACH_CRON_SECRET`, running the job once) is a Week 11 setup task.
2. Add a manual "pause" toggle per provider as a safeguard before the job fires on it. **Deliverable:** pause control in admin. **Status:** Done.

## Week 11 — Go-Live Setup + First Real Batch
*Aug 10, 2026 onward*

Nothing left here is more building — it's account setup, config, and the first operational pass, gathered in one place so it's a single checklist instead of scattered "needs you" notes. Most of Part A and all of Part B closed out in one session on 2026-08-10; what's left is concentrated in Part C.

**Part A — Sending Account + Deployment Config:**

1. Sign up for Resend and create the sending account. **Deliverable:** provider account; set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in the deployment env. **Status:** Done. Currently sending from Resend's shared `onboarding@resend.dev` domain (works, but see item 2).
2. Set up a dedicated sending subdomain with SPF/DKIM/DMARC records. **Deliverable:** verified sending domain, so real inboxes don't flag the mail as spam. **Status:** Not started. Still the single biggest thing blocking a trustworthy real send — cold email from a shared/unverified domain has a materially higher chance of landing in spam.
3. Confirm `PUBLIC_BASE_URL` matches the real deployed site. **Deliverable:** the claim/remove/opt-out links embedded in outreach emails resolve correctly instead of pointing at localhost or a stale URL. **Status:** Done. Found and fixed a real gotcha along the way: Vercel's per-deployment URLs (the ones with a random hash) change on every redeploy — had to switch to the stable project alias (`rocket-scrape-agent-the-go-grow-company.vercel.app`), which Vercel keeps pointed at whatever's current in production. Also had to disable Vercel's "Vercel Authentication" deployment protection, which was silently 401-ing every API call including the cron job's own request.
4. Set `OUTREACH_CRON_SECRET` and `OUTREACH_TEST_INBOX_EMAIL` in the deployment env. **Deliverable:** cron auth configured, and a real inbox for dry-run sends to land in. **Status:** Done, set in both local `.env` and Vercel's env vars (the two are separate — `.env` is gitignored and never reaches the deployed site, which tripped up the first attempt).
5. Enable the `pg_cron` and `pg_net` extensions in Supabase, fill in your deployed URL and `OUTREACH_CRON_SECRET` in place of the two placeholders in the follow-up job SQL at the bottom of `docs/supabase-schema.sql`, and run that block once. **Deliverable:** the daily follow-up job actually scheduled and live. **Status:** Done, confirmed scheduled (`cron.schedule` returned job id 2) and confirmed reachable (direct call to `/api/outreach-followup` returns 200).

**Part B — Test Before Anything Real:**

6. With `OUTREACH_DRY_RUN` left on (the default), run the full cycle against yourself: send Email 1 → simulate no reply → confirm the follow-up job fires Email 2 on schedule → click "Mark as Replied" → confirm the cycle stops. **Deliverable:** verified working cycle, with nothing sent to a real company yet. **Status:** Done. Verified against a throwaway synthetic test provider (not a real batch company) end to end: Email 1 sent and redirected correctly to the test inbox, the live follow-up endpoint picked up the backdated due date and sent Email 2, "Mark as Replied" stopped the cycle, test provider deleted afterward. Along the way, fixed a real bug in `updateProvider` (`src/ui/supabaseStore.js`) that crashed when called with only `outreachContacts`/`outreachMessages` and no status change — the PATCH body ended up empty and Supabase returned no row.

**Part C — Select and Send the First Real Batch:**

7. Select 20–30 approved profiles most likely to respond. **Deliverable:** named batch list. **Status:** In progress. The original plan's ranking criteria (smallest, most active) turned out to be uncomputable — there's no company-size field anywhere in the schema, and `confidence_score` (data quality, not fit) just surfaces large multinationals when sorted on. Started from 17 pre-staged `outreach_pending` providers as the working batch; still need to make the final 20-30 selection explicit.
8. Source/confirm a primary outreach contact per profile. **Deliverable:** contacts complete for the batch. **Status:** Mostly done, ahead of schedule. Built Apollo people-search + email-reveal (`src/enrichment/apollo.js`) and a batch script (`scripts/sourceOutreachContacts.js`) rather than continuing to source contacts one by one by hand — this pulls Week 13+'s "wire Apollo people-search" item forward, since manual research agents proved too slow to source contacts at any real volume (see note below). Result: 62 providers now have a real, named, mostly-verified contact (up from 0 real contacts and 17 generic mailboxes at the start of the session). Ran out of Apollo lead credits partway through the eligible pool (~195 providers); topping up credits would let this finish for the remaining ~130 whenever needed, but 62 is already well past the 20-30 needed for this first batch. Also fixed a genuine duplicate-record bug found in the process: "Public Cloud Group" existed as two separate provider rows (one under a stale `kreuzwerker.de` domain, one under the correct `pcg.io`) — consolidated onto the correct record.
9. Generate and review Email 1 drafts for the batch; edit for accuracy and tone; approve. **Deliverable:** approved Email 1 per profile. **Status:** Not done — this is now the top blocker. Audited the 62 contacted providers: only 18 have any Email 1 draft, and all 18 predate the Week 10 opt-out-footer feature, so none of them have an unsubscribe link, and none embed the real profile-access link either. The other 44 have no draft at all. Every draft needs generating or regenerating via the admin's "Generate Drafts" action before anything can be approved.
10. Turn off `OUTREACH_DRY_RUN` and send Email 1 to the real batch via the admin Send button. **Deliverable:** first real outreach sent, cycle tracking live. **Status:** Not started — blocked on 2, 7, and 9.

**Part D — Site Readiness Audit (2026-08-10):**

Before sending real email to real companies, audited the site end to end from three angles — the admin, the general site visitor, and the company who'll click the link in the outreach email. Full pass on the public homepage, the connect/buyer-lead page, the admin login screen, and (most importantly) `profile-access.html` — the exact page every outreach recipient lands on.

1. Found and fixed a CSS cascade bug: `.providerAccessHero` (the layout on `profile-access.html`) was defined twice in `styles.css` — a later, unconditional definition silently overrode the responsive breakpoint that was supposed to collapse it to one column on narrow screens. **Deliverable:** fix applied in `public/styles.css`; added the page's containers to the existing narrow-phone width-cap pattern as a second layer of defense. **Status:** Done at the source-code level (verified by reading the CSS cascade directly); real-device confirmation still recommended since the headless-Chrome tooling available in this environment couldn't reliably emulate a narrow mobile viewport for a final visual check.
2. Verified the claim/removal request flow works end to end via direct API calls: valid submissions succeed, missing/malformed email is rejected with a clear message, no raw errors leak to the user. **Status:** Done, no issues found.
3. Confirmed the `?domain=` restriction on `claim.html`/`remove.html` (Week 10's security fix, preventing anyone from claiming a profile by guessing a domain in the URL) is working as intended. **Status:** Confirmed working, not a bug.
4. Hid Success Stories, Events, and Signals from the public nav (`public/index.html`) and from the admin's per-provider edit panels (`public/admin.html`), per the decision to focus the admin workflow purely on outreach for now. **Deliverable:** 3 public nav links and 4 admin edit sections hidden via the `hidden` attribute — fully reversible, no data touched. **Status:** Done.
5. Minor copy cleanup still open: `profile-access.html` and `claim.html` both still say claiming "gives you... the ability to add success stories and events," which now points at a hidden feature. **Status:** Not done, low priority.
6. Direct-linking to a specific provider's public detail page via `?domain=` on the homepage doesn't open it (shows the full index instead). **Status:** Not done, low priority — not part of the outreach flow, since outreach links point to `profile-access.html`, not the public detail page.

## Week 12 — Self-Serve Profile Editing From the Claim Link (Built)
*Aug 17 – Aug 20, 2026*

This displaced the originally-planned Week 12 below. The trigger wasn't outreach-cycle results (the cycle hasn't closed — Email 1 hasn't even sent to the real batch yet, see Week 11 Part C) but direct feedback on the claim-link experience itself: a company clicking their link could only submit a generic claim/removal *request* and then wait for an admin to manually review it and separately go edit the profile later. That's high friction for the company and a manual bottleneck for review. It's also the foundation for the planned premium-profile monetization — the same link is meant to become a durable "manage your listing" entry point a company returns to, not a one-time form.

**Part A — Self-Serve Edit + Publish:**

1. Replace the "submit a request and wait" flow at `/profile-access` with a self-serve editor styled like the public profile page — company name, logo, website, location, description, services/technologies/industries, LinkedIn/GitHub — so what the owner edits looks like what visitors will see. **Deliverable:** rewritten `public/profile-access.html`, new `public/profile-edit.js`. **Status:** Done, deployed to production 2026-08-20.
2. Verify ownership with a one-time business-email-domain match (reusing the same check `claim_requests` already used), then mint a persistent, non-expiring `owner_edit` outreach link so the company can come back later without re-verifying. **Deliverable:** `applyOwnerProfileEdit()` in `src/ui/supabaseStore.js`, new `owner_edit` outreach-link purpose (schema change in `docs/supabase-schema.sql`). **Status:** Done.
3. New `GET`/`PATCH /api/profile-edit` endpoint: publishes edits immediately, no admin review queue, auto-claims the profile on first save. Removal requests are unchanged and still go through admin review — only the edit/claim path got faster. **Deliverable:** `src/api/profile-edit.js`. **Status:** Done.
4. Real logo file upload instead of requiring a hosted URL, reusing `uploadProviderLogo()` (previously wired only into the scraper pipeline, never exposed to a browser). Logo uploads publish immediately on selection — the one field that doesn't wait for the page-level Publish button, since a logo swap is low-ambiguity and the extra click was pure friction. **Deliverable:** `src/api/profile-edit-logo.js`. **Status:** Done.

**Part B — Safety Net for a Zero-Review Write Path:**

5. Explicit bypass of the confidence-score publish guardrail for this path only — an owner claiming and fixing a low-confidence scraped profile is exactly the case the guardrail would otherwise block, with no reviewer left in the loop to clear it. **Deliverable:** `skipConfidenceGuardrail` option on `updateProvider()`. **Status:** Done.
6. Every self-serve save logs a `provider_self_edited` activity event with a before/after snapshot of just the fields touched, and a one-click **"Revert this edit"** button in the admin Activity tab restores it — the safety net standing in for a pre-publish review gate. **Deliverable:** snapshot capture in `applyOwnerProfileEdit()`, revert button in `public/admin.js`. **Status:** Done. Building this surfaced and fixed a real pre-existing bug: the admin's "Self-edited" badge/filter (item 7) was checking field names (`eventType`, `providerId`) that never matched the actual processed activity-timeline shape (`type`, and no `providerId` at all) — it would have silently never worked.
7. Admin "Self-edited" badge + filter on the Live Providers table, so recently self-edited profiles can be spot-checked after the fact instead of gated before publish. **Deliverable:** badge/filter in `public/admin.js`/`public/admin.html`. **Status:** Done (see bug note above).
8. Logo uploads write to a unique storage path per upload instead of overwriting the same file, so a reverted logo change still resolves to a real image rather than one that got destroyed by the next upload. **Status:** Done.

Verified end-to-end against a throwaway test provider (created via script, fully deleted afterward including its activity-log rows) and against the real "Demo Test 2" fixture already used to rehearse the outreach flow: claiming despite a low confidence score, editing and publishing with no re-verification on return visits, edits reflected on the public site immediately, logo upload with auto-publish, and a simulated revert that restored the exact prior field values without touching claim status. **Not yet verified:** an actual click-through in a browser, and clicking the real "Revert" button in a live admin session — both need a human, not just API calls.

**Part C — Automatic Contact Sourcing + Draft Generation on Scrape:**

Before this, a scraped company got a full profile but no named contact and no outreach drafts — both existed as capabilities (`sourceOutreachContact()`, `generateOutreachMessages()`) but only ever ran manually: a standalone batch script for contacts, an admin button click per provider for drafts. Decision: trigger both automatically the moment a company is scraped, not gated behind admin approval — a scraped profile is treated as good enough to start outreach prep on immediately.

9. Extracted the shared "source a contact if missing / generate drafts if missing" logic (previously duplicated between the manual admin action and the batch script) into `src/pipeline/outreachAutomation.js`, so the automatic hook and the backfill script can't drift apart. **Status:** Done.
10. Wired both steps into the scrape-job completion path, right after a provider is saved with status `scraped` — `src/api/admin-run-job.js`. Best-effort: never fails the scrape job if Apollo or the LLM has a bad moment, and skips cleanly if the provider already has a real (non-generic) contact or already has drafts, so re-scraping/recrawling an already-enriched company doesn't waste an Apollo credit. **Deliverable:** `prepareOutreachForScrapedProvider()` in `src/api/admin-run-job.js`. **Status:** Done.
11. Found and fixed a real, separate pre-existing bug while wiring this up: `updateProvider()` (the update path used by everything except the initial scrape insert) was missing `company_size` from its field whitelist entirely — any attempt to save it through that path, including the new backfill script below, would have failed silently. **Deliverable:** fix in `src/ui/supabaseStore.js`. **Status:** Done.
12. Updated `scripts/sourceOutreachContacts.js` to use the shared module and to also generate drafts immediately after sourcing a contact, instead of contacts and drafts being two separate manual passes. **Status:** Done.
13. New `scripts/backfillCompanySize.js` — backfills the `company_size` column (added Week 11, never backfilled) via Apollo company enrichment, which doesn't cost per-contact credits. **Status:** Done, script built and tested.
14. Verified the auto-hook end-to-end against a throwaway test provider: created with status `scraped`, contact found and saved, 5 drafts generated, provider status correctly left untouched (still `scraped`, awaiting review) rather than accidentally publishing it. **Status:** Done.

**Backfill results for the existing 212 providers — partially done, then blocked on Apollo credits:**

| | Before | After this run |
|---|---|---|
| Have `company_size` | 0 / 212 | **71 / 212** |
| Have a real contact + drafts | 65 / 212 | **66 / 212** |

Running `scripts/backfillCompanySize.js` against the full set hit Apollo's `organizations/enrich` rate limit (50 calls/min) and then genuine credit exhaustion ("insufficient credits," confirmed with a fresh live call afterward) — the same wall Week 11 hit. **Status:** Blocked on Apollo credits being topped up, not a code issue. Once credits are back: `node scripts/backfillCompanySize.js` for the remaining ~138, then `node scripts/sourceOutreachContacts.js` for the remaining ~146 (this one costs more per provider — email reveal, not just company lookup — so it'll hit the same wall immediately if run before credits are restored).

**Deferred from the originally-planned Week 12** (still gated on the Week 11 cycle actually closing, which hasn't happened yet — see Week 11 Part C):

1. Compile results: claims, removals, replies (other), closed-no-response, per stage of the cycle. **Deliverable:** results notes. **Status:** Not started.
2. Write a short outreach results report (is email quality good enough, is the claim-request flow enough/too much friction, which cycle stage converted). **Deliverable:** `docs/sprint2-outreach-report.md`. **Status:** Not started.
3. Decide whether manual sending is the bottleneck or contact sourcing is — these have different fixes (see Week 13+). **Deliverable:** documented go/no-go decision. **Status:** Not started.
4. Fix and improve the UI of the admin Tags page (`tag_taxonomy` management view) — layout, usability, and visual consistency with the rest of the admin. **Deliverable:** improved Tags page UI. **Status:** Not started.

## Week 13+ — Automation (Only If Week 12 Justifies It)
*Build only what's justified — not steps to complete by default*

1. Adopt a cold-outreach sequencer (Instantly.ai, Smartlead, Lemlist, or Apollo.io sequences) instead of building SendGrid/Postmark — build only if manual sending becomes the bottleneck. **Deliverable:** sequencer sending + tracking live.
2. ~~Wire Apollo people-search (fallback: Hunter.io) into contact creation~~ — **Done early, in Week 11 (2026-08-10).** Manual per-company research (LinkedIn/web search) proved too slow to reach the trigger condition without hitting it first: sourcing 6 contacts by hand took ~2 minutes each and mostly turned up "no verified email." Apollo's people-search + email-reveal API, wired into `src/enrichment/apollo.js`, does the same job in seconds per company using the account already paid for and used for company enrichment. See Week 11 Part C item 8.
3. Add automatic inbound reply detection (Postmark Inbound/Mailgun Routes), matching replies via a   per-provider plus-address (`outreach+<provider_id>@yourdomain.com`) — build only if manually clicking "Mark as Replied" becomes tedious at higher reply volume. **Deliverable:** reply detection live.
4. ~~Build the self-serve OTP + account-creation claim flow~~ — **Done differently, in Week 12 (2026-08-17 to 2026-08-20).** Built as email-domain verification against the existing outreach-link token rather than OTP + account creation — simpler, and reuses infrastructure already in place instead of adding a new auth mechanism. See Week 12.
5. Write a formal Sprint 2 report equivalent to `docs/archive/final-report.md` — once a large-enough outreach sample exists. **Deliverable:** `docs/sprint2-report.md`.
6. Backfill `company_size` for existing providers via Apollo's `organizations/enrich` call, and wire it into batch-ranking so "smallest, most active" from Week 11 Part C item 7 becomes computable — build once Apollo credits are topped up. **Deliverable:** populated `company_size` column, ranked batch selection.

## Check-Ins

- **Week 10** (Jul 30 onward) — You present: send-from-admin, cycle tracking, and the automated follow-up job built. We decide together: any adjustments to the stage/due-date model before go-live.
- **Week 11** (Aug 10 onward) — You present: sending account live, cron job activated, test cycle verified end to end, 62 real contacts sourced via the new Apollo pipeline, a full site readiness audit with fixes applied. Still open before the first real send: sending domain + DNS, final batch selection, and drafting/approving Email 1 for the batch (only 18 of 62 contacted providers have any draft, and those 18 predate the opt-out-link feature). We decide together: any adjustments to Email 2/3 content based on early replies, once sending actually starts.
- **Week 12** (Aug 17–20, 2026) — You present: self-serve profile editing shipped to production — company edits publish instantly from the claim link with no admin review queue, logo upload, and a one-click admin revert as the safety net in place of a pre-publish gate. Also: contact sourcing and outreach-draft generation now fire automatically the moment a company is scraped, instead of needing a manual batch script and a manual "Generate Drafts" click; backfilled `company_size` and contacts/drafts partway through the existing 212 providers before hitting Apollo credit exhaustion (same wall as Week 11). Verified against a real demo-company link end to end via direct API calls; browser click-through and a live admin revert are still open. We decide together: any adjustments after you try it yourself; when to top up Apollo credits and finish the backfill; when to pick back up the original Week 12 items (results report, Tags UI cleanup), still gated on the outreach cycle actually closing.
