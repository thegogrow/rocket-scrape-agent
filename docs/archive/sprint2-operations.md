# Sprint 2 Operations

## Readiness Checks

Run this before demos or deployment:

```bash
npm run readiness:sprint2
```

The check verifies:

- Required environment variables for Supabase admin flows.
- Sprint 2 API route files expected by Vercel.
- Supabase tables and columns used by admin workflows.

The Admin dashboard also shows readiness warnings after login. Missing optional tables such as `reviewer_feedback`, `provider_events`, `market_signals`, `outreach_messages`, or `provider_leads` degrade only the related feature, but should still be fixed before production use.

## Canonical Audit History

Canonical audit history is now:

- `activity_events` for lifecycle, outreach, claim, lead, content, event, and signal actions.
- `reviewer_feedback` for quality-review decisions and reviewer notes.

`providers.activity_log` is legacy compatibility storage. The UI still reads it as a fallback while older provider rows are migrated, but new audit/reporting work should use the normalized tables first.

## Admin CSV Exports

The Metrics page includes CSV exports for:

- Reviewed providers
- Outreach queue
- Claim requests
- Leads
- Events
- Signals

Exports are admin-only and use the same Supabase Auth token as the rest of the Admin UI.
