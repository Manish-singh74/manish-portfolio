-- ============================================================
-- MANISH SINGH PORTFOLIO - SUPABASE SETUP
-- Run this in Supabase Dashboard -> SQL Editor.
-- BEFORE running: create your admin user in Authentication -> Users.
-- Then replace YOUR_ADMIN_EMAIL below with that user's email address.
-- ============================================================

create extension if not exists pgcrypto;

-- -------------------------
-- Admin allow-list
-- -------------------------
create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.portfolio_admins enable row level security;
revoke all on table public.portfolio_admins from anon;
grant select on table public.portfolio_admins to authenticated;

drop policy if exists "Admins can read their own admin record" on public.portfolio_admins;
create policy "Admins can read their own admin record"
on public.portfolio_admins
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Add your auth user to the admin allow-list by email.
-- Replace YOUR_ADMIN_EMAIL with the exact email used to sign in.
insert into public.portfolio_admins (user_id)
select id from auth.users
where lower(email) = lower('YOUR_ADMIN_EMAIL')
on conflict (user_id) do nothing;

-- -------------------------
-- Profile / portfolio settings
-- -------------------------
create table if not exists public.portfolio_profile (
  id integer primary key default 1 check (id = 1),
  name text not null default 'Manish Singh',
  role text not null default 'Data Analyst',
  tagline text not null default 'Data Analyst | Business Intelligence | Data Visualization',
  location text,
  phone text,
  email text,
  linkedin text,
  github text,
  portfolio text,
  resume_url text,
  resume_path text,
  photo_url text,
  photo_path text,
  updated_at timestamptz not null default now()
);

insert into public.portfolio_profile (id, name)
values (1, 'Manish Singh')
on conflict (id) do nothing;

alter table public.portfolio_profile enable row level security;
revoke all on table public.portfolio_profile from anon, authenticated;
grant select on table public.portfolio_profile to anon, authenticated;
grant update on table public.portfolio_profile to authenticated;

drop policy if exists "Public can read portfolio profile" on public.portfolio_profile;
create policy "Public can read portfolio profile"
on public.portfolio_profile
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can update portfolio profile" on public.portfolio_profile;
create policy "Admins can update portfolio profile"
on public.portfolio_profile
for update
to authenticated
using (exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())));

-- -------------------------
-- Projects
-- -------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tech text[] not null default '{}',
  description text not null default '',
  overview text not null default '',
  problem text not null default '',
  preparation text not null default '',
  analysis text not null default '',
  insights text[] not null default '{}',
  outcome text not null default '',
  github text,
  demo text,
  image_url text,
  image_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;
revoke all on table public.projects from anon, authenticated;
grant select on table public.projects to anon, authenticated;
grant insert, update, delete on table public.projects to authenticated;

drop policy if exists "Public can read projects" on public.projects;
create policy "Public can read projects"
on public.projects
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert projects" on public.projects;
create policy "Admins can insert projects"
on public.projects
for insert
to authenticated
with check (exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())));

drop policy if exists "Admins can update projects" on public.projects;
create policy "Admins can update projects"
on public.projects
for update
to authenticated
using (exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())));

drop policy if exists "Admins can delete projects" on public.projects;
create policy "Admins can delete projects"
on public.projects
for delete
to authenticated
using (exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())));

-- -------------------------
-- Certifications
-- -------------------------
create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text not null default '',
  year text,
  credential text,
  file_url text,
  file_path text,
  file_type text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.certifications enable row level security;
revoke all on table public.certifications from anon, authenticated;
grant select on table public.certifications to anon, authenticated;
grant insert, update, delete on table public.certifications to authenticated;

drop policy if exists "Public can read certifications" on public.certifications;
create policy "Public can read certifications"
on public.certifications
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert certifications" on public.certifications;
create policy "Admins can insert certifications"
on public.certifications
for insert
to authenticated
with check (exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())));

drop policy if exists "Admins can update certifications" on public.certifications;
create policy "Admins can update certifications"
on public.certifications
for update
to authenticated
using (exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())));

drop policy if exists "Admins can delete certifications" on public.certifications;
create policy "Admins can delete certifications"
on public.certifications
for delete
to authenticated
using (exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())));

-- -------------------------
-- Contact messages
-- -------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
revoke all on table public.contact_messages from anon, authenticated;
grant insert on table public.contact_messages to anon, authenticated;
grant select, delete on table public.contact_messages to authenticated;

drop policy if exists "Anyone can send contact messages" on public.contact_messages;
create policy "Anyone can send contact messages"
on public.contact_messages
for insert
to anon, authenticated
with check (length(trim(name)) between 2 and 100 and length(trim(email)) between 5 and 254 and length(trim(subject)) between 2 and 200 and length(trim(message)) between 2 and 5000);

drop policy if exists "Admins can read contact messages" on public.contact_messages;
create policy "Admins can read contact messages"
on public.contact_messages
for select
to authenticated
using (exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())));

drop policy if exists "Admins can delete contact messages" on public.contact_messages;
create policy "Admins can delete contact messages"
on public.contact_messages
for delete
to authenticated
using (exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())));

-- -------------------------
-- Storage bucket
-- -------------------------
insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do update set public = true;

-- Public visitors may view portfolio files.
drop policy if exists "Public can view portfolio media" on storage.objects;
create policy "Public can view portfolio media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-media');

-- Only portfolio admins may upload/update/delete files.
drop policy if exists "Admins can upload portfolio media" on storage.objects;
create policy "Admins can upload portfolio media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'portfolio-media' and exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())));

drop policy if exists "Admins can update portfolio media" on storage.objects;
create policy "Admins can update portfolio media"
on storage.objects
for update
to authenticated
using (bucket_id = 'portfolio-media' and exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())))
with check (bucket_id = 'portfolio-media' and exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())));

drop policy if exists "Admins can delete portfolio media" on storage.objects;
create policy "Admins can delete portfolio media"
on storage.objects
for delete
to authenticated
using (bucket_id = 'portfolio-media' and exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())));

-- Helpful grants for the browser Data API.
grant usage on schema public to anon, authenticated;

-- Seed the existing portfolio with the initial content from data.js.
-- The app also has a one-click seed button, so you can skip this block if preferred.
