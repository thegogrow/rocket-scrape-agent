# Rocket Engineers Scrape Agent — Project Documentation (Week 1–13)

Prepared: 2026-07-31
Updated: 2026-08-24
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

### Week 11 — Go-Live Setup + First Real Batch

- Signed up for Resend and set `RESEND_API_KEY`/`RESEND_FROM_EMAIL`. Currently sending from Resend's shared `onboarding@resend.dev` domain — a dedicated sending subdomain with SPF/DKIM/DMARC records is still not set up, and is the single biggest thing blocking a trustworthy real send, since cold email from a shared/unverified domain is materially more likely to land in spam.
- Fixed a real deployment gotcha while confirming `PUBLIC_BASE_URL`: Vercel's per-deployment URLs (the ones with a random hash) change on every redeploy, so the links embedded in outreach emails have to point at the stable project alias instead. Also had to disable Vercel's "Vercel Authentication" deployment protection, which was silently returning 401 on every API call, including the cron job's own request.
- Set `OUTREACH_CRON_SECRET` and `OUTREACH_TEST_INBOX_EMAIL` in both local `.env` and Vercel's environment separately (`.env` is gitignored and never reaches the deployed site, which tripped up the first attempt).
- Enabled the `pg_cron`/`pg_net` extensions in Supabase and confirmed the daily follow-up job is actually scheduled and reachable.
- Ran the full outreach cycle end to end against a throwaway synthetic test provider with `OUTREACH_DRY_RUN` left on: Email 1 sent and redirected to the test inbox, the live follow-up job picked up the backdated due date and sent Email 2 on schedule, "Mark as Replied" stopped the cycle, and the test provider was deleted afterward. Found and fixed a real bug along the way: `updateProvider()` crashed when called with only outreach-contact/message changes and no status change, because the resulting database update ended up empty.
- Built Apollo people-search + email-reveal (`src/enrichment/apollo.js`) and a batch script (`scripts/sourceOutreachContacts.js`), after manual per-company contact research proved too slow at any real volume (~2 minutes per contact, mostly turning up no verified email). This pulled a Week 13+ item forward. Sourced 62 real, named, mostly-verified contacts — up from 0 real contacts and 17 generic mailboxes. Also found and fixed a duplicate-provider-record bug ("Public Cloud Group" existed under two different domains) surfaced while sourcing.
- Audited the site end to end from three angles — the admin, a general visitor, and the company clicking their outreach link — before sending anything real. Found and fixed a CSS cascade bug that silently broke the claim page's mobile layout. Confirmed the claim/removal request flow and the `?domain=`-guessing security fix both still work correctly. Hid Success Stories, Events, and Signals from the public nav and admin edit panels to keep the admin workflow focused on outreach for now.
- Still open, and blocking the first real send: the sending-domain DNS work above, final selection of the 20–30 company batch (17 pre-staged candidates started; ranking by company size turned out to be uncomputable, since no such field exists in the schema yet), and drafting/approving Email 1 for the batch — only 18 of the 62 contacted providers have any draft, and all 18 predate the opt-out-footer feature, so none of them are actually ready to send.

### Week 12 — Self-Serve Profile Editing From the Claim Link

- Replaced the "submit a request and wait for admin review" flow at `/profile-access` with a self-serve editor styled like the public profile page (`public/profile-access.html`, `public/profile-edit.js`) — company name, logo, website, location, description, services/technologies/industries, LinkedIn/GitHub, publishing edits immediately with no admin review queue and auto-claiming the profile on first save (`GET`/`PATCH /api/profile-edit`, `src/api/profile-edit.js`).
- Ownership verified with a one-time business-email-domain match (reusing the check `claim_requests` already used), which mints a persistent, non-expiring `owner_edit` outreach link so the company can return later without re-verifying (`applyOwnerProfileEdit()` in `src/ui/supabaseStore.js`, new `owner_edit` link purpose in `docs/supabase-schema.sql`). Removal requests are unchanged and still go through admin review — only the edit/claim path got faster.
- Added real logo file upload (`src/api/profile-edit-logo.js`), reusing `uploadProviderLogo()` which previously was wired only into the scraper pipeline. Logo uploads publish immediately on selection, ahead of the rest of the page's Publish button, since a logo swap is low-ambiguity. Each upload writes to a unique storage path so a reverted logo change still resolves to a real image.
- Built the safety net for a zero-review write path: an explicit bypass of the confidence-score publish guardrail for this path only (`skipConfidenceGuardrail` option on `updateProvider()`), every self-serve save logs a `provider_self_edited` activity event with a before/after snapshot of just the touched fields, and a one-click **"Revert this edit"** button in the admin Activity tab restores it. Building this surfaced and fixed a pre-existing bug: the admin's "Self-edited" badge/filter was checking field names that never matched the actual activity-timeline shape, so it would have silently never worked.
- Automated contact sourcing and outreach-draft generation on scrape: extracted the shared "source a contact if missing / generate drafts if missing" logic into `src/pipeline/outreachAutomation.js` (previously duplicated between the manual admin action and the batch script) and wired both steps into the scrape-job completion path in `src/api/admin-run-job.js`, right after a provider is saved with status `scraped`. Best-effort — never fails the scrape job on an Apollo/LLM error, and skips cleanly if the provider already has a real contact or drafts. Found and fixed a separate pre-existing bug while wiring this up: `updateProvider()` was missing `company_size` from its field whitelist, so saving it through the update path (including the new backfill script) failed silently.
- Backfilled the existing 212 providers partway: `company_size` went from 0/212 to 71/212, real contact + drafts from 65/212 to 66/212, before hitting the same Apollo credit wall as Week 11. Blocked on credits being topped up, not a code issue.
- Verified end-to-end against a throwaway test provider and against the real "Demo Test 2" fixture via direct API calls: claiming despite a low confidence score, editing and publishing with no re-verification on return visits, logo upload with auto-publish, and a simulated revert restoring exact prior field values. Not yet verified: an actual browser click-through and a live admin revert click — both need a human.

### Week 13 — Client Feedback, Built Same Day (2026-08-24)

Phil reviewed the live site and gave structured feedback in Slack, 8 points. Several revise features that shipped in Week 11/Week 12 rather than being net-new scope; two are real bugs found during his review. All 8 were built the same session:

- **Owner/editor verification and roles, done.** Root-caused the actual gap first: `applyOwnerProfileEdit()`'s own code comment admitted "possessing the emailed link's token is treated as sufficient authorization by itself" — Week 12 never checked identity, just token possession. Fixed with a magic-link flow (not OTP, to reuse existing token/email infrastructure): a Name/Email/Role form on `profile-access.html`, a new `verify`-purpose outreach-link token bound to the submitted email (`outreach_links.email` column), and `src/api/claim-verify.js` (request/confirm/invite actions) backed by `src/email/ownerVerification.js`. New `provider_editors` table tracks role (`owner`/`editor`) and status per provider/email — the first verified person becomes owner, later verifiers become editors, and an owner can invite others by email (bypassing the domain-match check, since the owner is vouching directly). Already-claimed providers are grandfathered, no forced re-verification.
- **Tag taxonomy normalization, done.** New "Find Duplicate Tags (AI)" button in the admin Tags panel runs one LLM pass per category (`src/llm/tagNormalization.js`, same scaffold as `outreachMessages.js`) via `POST /api/admin-tags-normalize`, proposing duplicate/synonym clusters. Staged for review, not auto-applied — an admin approves or dismisses each cluster before anything merges, reusing the existing per-tag Merge action.
- **Pending-tag review flow, done.** Self-serve tag entry now upserts a `candidate` row into `tag_taxonomy` for anything not already there (`upsertCandidateTagsIfNew()`), flags just that tag with a "Pending" badge (amber on the public editor, blue in admin) without blocking the rest of the save, and logs a `tag_candidate_created` activity event. The admin's existing Approve/Merge actions (Week 6) already handle accept/remap — no new admin UI needed.
- **Bug — services tag box clears on click: fixed.** Root cause: the `<label>` wrapping each tag-picker list (`public/admin.html:638-657`) had no explicit `for` target, so the browser treated the first tag chip's remove button as the label's implicit control — any click on the label area synthetically clicked it. Fixed with explicit `for="profileEditServices"` etc. on each label; no JS changes needed.
- **Bug — reported slow/blocking page: partially addressed.** No reproduction steps were available, so this couldn't be conclusively root-caused. Code review found the highest-confidence cause and fixed it: three free-text filter inputs had no debounce, so every keystroke triggered a full synchronous table re-render (`debounce()` helper added in `public/admin.js`). Two lower-confidence, higher-risk findings (`renderTags()` and the Outreach Queue both do unbounded scans over all providers on every render, regardless of active tab) were left alone pending confirmation this is actually the cause.
- **Edit-profile UX, done.** Admin edit-profile dialog restructured into 4 tabs (Profile, Public Content, Outreach, Notes) — pure UI change, no field or data changes, reusing the same show/hide pattern as the top-level admin nav.
- **Multi-contact outreach selection, done.** Apollo people-search now returns up to 3 ranked candidates per company instead of 1 (`sourceOutreachContacts()`, renamed from the singular version) — note this raises Apollo credit spend per company proportionally. Sourcing is now additive instead of destructive: a real pre-existing bug meant auto-sourcing used to delete any manually-added contacts on every re-run. New `outreach_contacts.source_status` column (`sourced`/`confirmed`) means a candidate is never treated as send-eligible until a human confirms it in the admin — enforced everywhere a contact gets picked, including the actual send path in `src/email/sendOutreachMessage.js`.
- **Dashboard clickability, done.** "Needs Review" tile/rows and "Recent Jobs" rows now link through to the filtered Review/Scrape sections or open the relevant provider directly, reusing the existing `setSection()` hash-router.
- **Clarification, answered.** Automatic contact-search already existed (Week 12 Part C); no separate visibility change requested.

**Not yet applied to production:** two schema migrations at the bottom of `docs/supabase-schema.sql` (the `provider_editors` table + `outreach_links.email` column for verification, and `outreach_contacts.source_status` for multi-contact) need to be run manually in the Supabase SQL editor before those two features work live — this session has no direct database access, consistent with every prior week's schema changes. **Also not yet done:** a real browser click-through of the verification flow and the tag-duplicate finder — both were smoke-tested via direct API calls (curl) against the live site, confirming routes/auth/error-handling behave correctly, but the actual multi-step user flows need a human in a browser once the migrations are applied.

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
| Week 11 contact sourcing | `src/enrichment/apollo.js`, `scripts/sourceOutreachContacts.js` |
| Week 12 self-serve profile edit | `public/profile-edit.js`, `src/api/profile-edit.js`, `src/api/profile-edit-logo.js`, `src/pipeline/outreachAutomation.js` |
| Week 13 owner/editor verification | `src/api/claim-verify.js`, `src/email/ownerVerification.js`, `resolveOwnerEditAccess()`/`beginOwnerVerification()`/`confirmOwnerVerification()`/`inviteProviderEditor()` in `src/ui/supabaseStore.js` |
| Week 13 tag normalization + pending tags | `src/llm/tagNormalization.js`, `src/api/admin-tags-normalize.js`, `upsertCandidateTagsIfNew()` in `src/ui/supabaseStore.js` |
| Week 13 multi-contact outreach | `src/enrichment/apollo.js` (`sourceOutreachContacts`), `src/pipeline/outreachAutomation.js`, `outreach_contacts.source_status` |
| Week 13 client feedback log | `docs/weekly-plan.md` (Week 13) |
