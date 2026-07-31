# Sprint 1 Baseline

Created: 2026-07-13

This baseline locks the cleaned Sprint 1 public provider export before Sprint 2 outreach and claim workflow work begins.

## Snapshot

- Backup directory: `backups/sprint1-baseline-20260713`
- Source commit: `2270f46`
- Public export: `public/profiles.json`
- Profile count: 201
- `public/profiles.json` SHA-256: `4766af60c8c9db085d5f0dc7390398467aa79b173a3efb8221abefea694704cd`

## Backup Artifacts

- `profiles.json`: exact public profile export at baseline time.
- `public-logos.tgz`: archived `public/logos` directory.
- `domains.json`: sorted list of baseline profile domains.
- `git-status.txt`: worktree state when the baseline was created.
- `manifest.json`: machine-readable summary of this baseline.

## Data Quality Counts

- Missing country: 47
- Missing city: 179
- Missing description: 2
- Missing services: 2
- Missing industries: 2
- Missing technologies: 3
- Low confidence profiles: 3

City coverage remains intentionally conservative because many provider websites do not expose reliable city evidence.

## Sprint 2 Starting Rule

Treat these 201 profiles as the Sprint 2 input dataset. Sprint 2 should add lifecycle fields, review status, quality logs, outreach contacts, claim requests, and activity tracking on top of this baseline instead of changing the definition of the Sprint 1 data export.
