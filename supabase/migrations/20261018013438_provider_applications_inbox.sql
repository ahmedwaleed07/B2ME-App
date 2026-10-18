-- Preliminary provider requests are collected before any Auth account is created.
-- Only B2ME admins can read or review requests; public visitors can submit a request.
create table public.provider_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 160),
  job_title text check (job_title is null or char_length(btrim(job_title)) <= 160),
  company_name text check (company_name is null or char_length(btrim(company_name)) <= 200),
  phone text not null check (char_length(btrim(phone)) between 7 and 30),
  email text not null check (
    char_length(email) <= 320 and email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$'
  ),
  website text check (website is null or char_length(website) <= 500),
  social_links jsonb not null default '{}'::jsonb check (jsonb_typeof(social_links) = 'object'),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);
create index provider_applications_inbox on public.provider_applications(created_at desc) where status = 'pending';
create unique index provider_applications_one_pending_per_email on public.provider_applications(lower(email)) where status = 'pending';
alter table public.provider_applications enable row level security;
revoke all on public.provider_applications from anon, authenticated;
grant insert (full_name,job_title,company_name,phone,email,website,social_links) on public.provider_applications to anon, authenticated;
grant select on public.provider_applications to authenticated;
grant update (status,reviewed_at,reviewed_by) on public.provider_applications to authenticated;
create policy "submit preliminary provider application" on public.provider_applications for insert to anon, authenticated with check (status = 'pending' and reviewed_at is null and reviewed_by is null);
create policy "B2ME admins can view provider applications" on public.provider_applications for select to authenticated using ((select auth.jwt()->'app_metadata'->>'b2me_admin') = 'true');
create policy "B2ME admins can review provider applications" on public.provider_applications for update to authenticated using ((select auth.jwt()->'app_metadata'->>'b2me_admin') = 'true') with check ((select auth.jwt()->'app_metadata'->>'b2me_admin') = 'true');
