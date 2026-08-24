-- Rocket Engineers Supabase setup.
-- Run this in the Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  company_name text not null,
  website text,
  country text,
  city text,
  location text,
  description text,
  services jsonb not null default '[]'::jsonb,
  focus_areas jsonb not null default '[]'::jsonb,
  industries jsonb not null default '[]'::jsonb,
  technologies jsonb not null default '[]'::jsonb,
  vendor_partnerships jsonb not null default '[]'::jsonb,
  success_stories jsonb not null default '[]'::jsonb,
  solutions jsonb not null default '[]'::jsonb,
  recent_activity jsonb not null default '[]'::jsonb,
  review_notes jsonb not null default '[]'::jsonb,
  scraper_quality_log jsonb not null default '{}'::jsonb,
  activity_log jsonb not null default '[]'::jsonb,
  files jsonb not null default '{}'::jsonb,
  confidence_score integer not null default 0,
  github_url text,
  linkedin_url text,
  logo_url text,
  claimed boolean not null default false,
  claimed_by_email text,
  claimed_at timestamptz,
  claim_verification_method text,
  removal_requested_at timestamptz,
  removed_at timestamptz,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'premium')),
  status text not null default 'scraped' check (
    status in (
      'scraped',
      'in_review',
      'approved',
      'outreach_pending',
      'outreach_active',
      'claimed',
      'unclaimed',
      'removal_requested',
      'removed'
    )
  ),
  source_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scrape_jobs (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  domain text,
  company_name text,
  status text not null default 'queued' check (
    status in ('queued', 'running', 'needs_review', 'published', 'failed')
  ),
  requested_by text,
  error text,
  result_provider_id uuid references public.providers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tag_taxonomy (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('services', 'industries', 'technologies', 'vendor_partnerships')),
  name text not null,
  normalized_name text not null,
  status text not null default 'candidate' check (status in ('candidate', 'approved', 'merged')),
  merge_target text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, normalized_name)
);

create table if not exists public.outreach_contacts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  name text,
  title text,
  email text,
  linkedin_url text,
  seniority text,
  source text,
  primary_contact boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists outreach_contacts_one_primary_per_provider
on public.outreach_contacts (provider_id)
where primary_contact;

create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  contact_id uuid references public.outreach_contacts(id) on delete set null,
  channel text not null check (channel in ('email', 'linkedin', 'claim_invite')),
  message_step text not null check (message_step in ('email_1', 'email_2', 'email_3', 'linkedin_message', 'claim_profile_invitation')),
  subject text,
  body text not null default '',
  status text not null default 'draft' check (
    status in ('draft', 'approved', 'sent', 'opened', 'clicked', 'replied')
  ),
  generated_by text,
  approved_by text,
  approved_at timestamptz,
  sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, message_step)
);

create table if not exists public.claim_requests (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers(id) on delete set null,
  domain text not null,
  email text not null,
  request_type text not null default 'claim' check (request_type in ('claim', 'removal')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  verification_method text,
  reviewed_by text,
  reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outreach_cycles (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  stage text not null default 'not_started' check (
    stage in ('not_started', 'cycle_1_sent', 'cycle_2_sent', 'cycle_3_sent', 'closed')
  ),
  resolution text check (
    resolution in ('claimed', 'removed', 'no_response', 'opted_out', 'replied_other')
  ),
  paused boolean not null default false,
  last_sent_at timestamptz,
  next_action_due_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id)
);

create table if not exists public.outreach_links (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  token text not null unique,
  purpose text not null default 'access' check (purpose in ('access', 'opt_out')),
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists outreach_links_provider_id_idx on public.outreach_links (provider_id);

create table if not exists public.provider_leads (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers(id) on delete set null,
  domain text not null,
  name text,
  company text,
  email text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'forwarded', 'closed')),
  reviewed_by text,
  reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.success_stories (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  title text not null,
  short_text text,
  link text,
  source_url text,
  status text not null default 'draft' check (status in ('suggested', 'draft', 'approved', 'archived')),
  featured boolean not null default false,
  approved_by text,
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_events (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  location text,
  online boolean not null default false,
  source_url text,
  status text not null default 'suggested' check (status in ('suggested', 'approved', 'expired', 'archived')),
  featured boolean not null default false,
  approved_by text,
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_signals (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers(id) on delete set null,
  signal_type text not null check (
    signal_type in ('hiring', 'news', 'leadership', 'tender', 'technology', 'partnership')
  ),
  title text not null,
  source_url text,
  status text not null default 'scraped' check (status in ('scraped', 'reviewed', 'approved', 'archived')),
  approved_by text,
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers(id) on delete set null,
  event_type text not null,
  label text not null,
  summary text,
  actor_email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reviewer_feedback (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  reviewer_email text,
  feedback text not null check (feedback in ('up', 'down', 'neutral')),
  status_from text,
  status_to text,
  quality_missing jsonb not null default '[]'::jsonb,
  quality_incorrect jsonb not null default '[]'::jsonb,
  quality_added jsonb not null default '[]'::jsonb,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.tag_taxonomy
  drop constraint if exists tag_taxonomy_category_check;

alter table public.tag_taxonomy
  add constraint tag_taxonomy_category_check
  check (category in ('services', 'industries', 'technologies', 'vendor_partnerships'));

alter table public.providers
  add column if not exists city text,
  add column if not exists claimed boolean not null default false,
  add column if not exists claimed_by_email text,
  add column if not exists claimed_at timestamptz,
  add column if not exists claim_verification_method text,
  add column if not exists removal_requested_at timestamptz,
  add column if not exists removed_at timestamptz,
  add column if not exists subscription_tier text not null default 'free',
  add column if not exists industries jsonb not null default '[]'::jsonb,
  add column if not exists success_stories jsonb not null default '[]'::jsonb,
  add column if not exists solutions jsonb not null default '[]'::jsonb,
  add column if not exists scraper_quality_log jsonb not null default '{}'::jsonb,
  add column if not exists activity_log jsonb not null default '[]'::jsonb;

alter table public.success_stories
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz;

alter table public.provider_events
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz;

alter table public.market_signals
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz;

alter table public.provider_leads
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz;

alter table public.outreach_messages
  add column if not exists cycle_number integer;

alter table public.providers
  drop constraint if exists providers_status_check;

update public.providers
set status = case status
  when 'published' then 'approved'
  when 'draft' then 'scraped'
  when 'needs_review' then 'in_review'
  when 'archived' then 'removed'
  else status
end
where status in ('published', 'draft', 'needs_review', 'archived');

alter table public.providers
  alter column status set default 'scraped',
  add constraint providers_status_check check (
    status in (
      'scraped',
      'in_review',
      'approved',
      'outreach_pending',
      'outreach_active',
      'claimed',
      'unclaimed',
      'removal_requested',
      'removed'
    )
  );

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists providers_set_updated_at on public.providers;
create trigger providers_set_updated_at
before update on public.providers
for each row execute function public.set_updated_at();

drop trigger if exists scrape_jobs_set_updated_at on public.scrape_jobs;
create trigger scrape_jobs_set_updated_at
before update on public.scrape_jobs
for each row execute function public.set_updated_at();

drop trigger if exists tag_taxonomy_set_updated_at on public.tag_taxonomy;
create trigger tag_taxonomy_set_updated_at
before update on public.tag_taxonomy
for each row execute function public.set_updated_at();

drop trigger if exists outreach_contacts_set_updated_at on public.outreach_contacts;
create trigger outreach_contacts_set_updated_at
before update on public.outreach_contacts
for each row execute function public.set_updated_at();

drop trigger if exists outreach_messages_set_updated_at on public.outreach_messages;
create trigger outreach_messages_set_updated_at
before update on public.outreach_messages
for each row execute function public.set_updated_at();

drop trigger if exists claim_requests_set_updated_at on public.claim_requests;
create trigger claim_requests_set_updated_at
before update on public.claim_requests
for each row execute function public.set_updated_at();

drop trigger if exists outreach_cycles_set_updated_at on public.outreach_cycles;
create trigger outreach_cycles_set_updated_at
before update on public.outreach_cycles
for each row execute function public.set_updated_at();

drop trigger if exists provider_leads_set_updated_at on public.provider_leads;
create trigger provider_leads_set_updated_at
before update on public.provider_leads
for each row execute function public.set_updated_at();

drop trigger if exists success_stories_set_updated_at on public.success_stories;
create trigger success_stories_set_updated_at
before update on public.success_stories
for each row execute function public.set_updated_at();

drop trigger if exists provider_events_set_updated_at on public.provider_events;
create trigger provider_events_set_updated_at
before update on public.provider_events
for each row execute function public.set_updated_at();

drop trigger if exists market_signals_set_updated_at on public.market_signals;
create trigger market_signals_set_updated_at
before update on public.market_signals
for each row execute function public.set_updated_at();

alter table public.providers enable row level security;
alter table public.scrape_jobs enable row level security;
alter table public.tag_taxonomy enable row level security;
alter table public.outreach_contacts enable row level security;
alter table public.outreach_messages enable row level security;
alter table public.claim_requests enable row level security;
alter table public.outreach_cycles enable row level security;
alter table public.outreach_links enable row level security;
alter table public.provider_leads enable row level security;
alter table public.success_stories enable row level security;
alter table public.provider_events enable row level security;
alter table public.market_signals enable row level security;
alter table public.activity_events enable row level security;
alter table public.reviewer_feedback enable row level security;

drop policy if exists "Published providers are public" on public.providers;
create policy "Published providers are public"
on public.providers for select
using (status in ('approved', 'outreach_pending', 'outreach_active', 'claimed', 'unclaimed'));

-- Admin reads/writes use SUPABASE_SERVICE_ROLE_KEY from Vercel API routes.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY in browser code.

insert into storage.buckets (id, name, public)
values ('provider-logos', 'provider-logos', true)
on conflict (id) do nothing;

-- Week 11: persist Apollo's estimated_num_employees so the outreach batch
-- can be ranked/filtered by company size, which nothing captured before.
alter table public.providers
  add column if not exists company_size text;

-- Week 10 Part C: automated daily outreach follow-up job.
-- One-time setup, run manually after enabling both extensions from the
-- Supabase dashboard (Database -> Extensions): pg_cron and pg_net.
-- Replace the two placeholders below before running:
--   <YOUR_DEPLOYED_SITE_URL>    e.g. https://rocket-scrape-agent.vercel.app
--   <YOUR_OUTREACH_CRON_SECRET> must match OUTREACH_CRON_SECRET in the deployment env
create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.trigger_outreach_followup_job()
returns void as $$
begin
  perform net.http_post(
    url := '<YOUR_DEPLOYED_SITE_URL>/api/outreach-followup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<YOUR_OUTREACH_CRON_SECRET>'
    ),
    body := '{}'::jsonb
  );
end;
$$ language plpgsql;

select cron.unschedule('outreach-daily-followup')
where exists (select 1 from cron.job where jobname = 'outreach-daily-followup');

select cron.schedule(
  'outreach-daily-followup',
  '0 8 * * *', -- 08:00 UTC daily
  $$select public.trigger_outreach_followup_job();$$
);

-- Week 12: self-serve profile editing from the claim link. A provider that
-- verifies ownership (business email matching their domain) gets a
-- non-expiring "owner_edit" link, distinct from the one-shot "access" link
-- sent in the outreach email, so they can return later to manage the
-- listing without re-verifying every time.
alter table public.outreach_links
  drop constraint if exists outreach_links_purpose_check;

alter table public.outreach_links
  add constraint outreach_links_purpose_check
  check (purpose in ('access', 'opt_out', 'owner_edit'));

-- Week 13: multi-contact outreach sourcing (client feedback). Apollo
-- people-search now returns several ranked candidates per company instead of
-- auto-picking one, so contacts need a way to distinguish "Apollo suggested
-- this, nobody's reviewed it yet" from "a human confirmed this is a real
-- contact to send to" - default 'confirmed' keeps every pre-existing row
-- (manually added, or auto-sourced before this distinction existed) exactly
-- as send-eligible as it already was.
alter table public.outreach_contacts
  add column if not exists source_status text not null default 'confirmed';

alter table public.outreach_contacts
  drop constraint if exists outreach_contacts_source_status_check;

alter table public.outreach_contacts
  add constraint outreach_contacts_source_status_check
  check (source_status in ('sourced', 'confirmed'));

-- Week 13: real owner/editor verification (client feedback). Week 12's
-- applyOwnerProfileEdit only ever checked "does this person possess the
-- token", never who they actually are - this closes that gap. A new
-- "verify" link purpose carries the email it was minted for (unlike
-- "access"/"owner_edit", which are per-provider, not per-person), and
-- provider_editors is the actual roles table: who's verified to edit a
-- given provider, and whether they're the owner (can invite others) or an
-- editor (can only edit). Providers already claimed via the old flow are
-- grandfathered - see the code-level check in resolveOwnerEditAccess()
-- rather than a data backfill, so no existing claim needs to be touched.
alter table public.outreach_links
  add column if not exists email text;

alter table public.outreach_links
  drop constraint if exists outreach_links_purpose_check;

alter table public.outreach_links
  add constraint outreach_links_purpose_check
  check (purpose in ('access', 'opt_out', 'owner_edit', 'verify'));

create table if not exists public.provider_editors (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  status text not null default 'pending' check (status in ('pending', 'active')),
  invited_by text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, email)
);

create index if not exists provider_editors_provider_id_idx on public.provider_editors (provider_id);

drop trigger if exists provider_editors_set_updated_at on public.provider_editors;
create trigger provider_editors_set_updated_at
before update on public.provider_editors
for each row execute function public.set_updated_at();

alter table public.provider_editors enable row level security;
