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
