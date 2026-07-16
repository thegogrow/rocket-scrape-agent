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

alter table public.tag_taxonomy
  drop constraint if exists tag_taxonomy_category_check;

alter table public.tag_taxonomy
  add constraint tag_taxonomy_category_check
  check (category in ('services', 'industries', 'technologies', 'vendor_partnerships'));

alter table public.providers
  add column if not exists city text,
  add column if not exists claimed boolean not null default false,
  add column if not exists subscription_tier text not null default 'free',
  add column if not exists industries jsonb not null default '[]'::jsonb,
  add column if not exists success_stories jsonb not null default '[]'::jsonb,
  add column if not exists solutions jsonb not null default '[]'::jsonb,
  add column if not exists scraper_quality_log jsonb not null default '{}'::jsonb,
  add column if not exists activity_log jsonb not null default '[]'::jsonb;

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

alter table public.providers enable row level security;
alter table public.scrape_jobs enable row level security;
alter table public.tag_taxonomy enable row level security;

drop policy if exists "Published providers are public" on public.providers;
create policy "Published providers are public"
on public.providers for select
using (status in ('approved', 'outreach_pending', 'outreach_active', 'claimed', 'unclaimed'));

-- Admin reads/writes use SUPABASE_SERVICE_ROLE_KEY from Vercel API routes.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY in browser code.

insert into storage.buckets (id, name, public)
values ('provider-logos', 'provider-logos', true)
on conflict (id) do nothing;
