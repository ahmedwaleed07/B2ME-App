-- B2ME initial PostgreSQL/Supabase schema — draft, NOT deployed.
-- Apply only to a NEW, independently owned B2ME Supabase project after review.
-- No tables, policies or code in MIRA/VYRSIA will be changed.

create extension if not exists pgcrypto;
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  preferred_language text not null default 'ar' check (preferred_language in ('ar','en')),
  email_marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.create_profile_for_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name',''), 150));
  return new;
end;
$$;
revoke all on function public.create_profile_for_user() from public, anon, authenticated;
create trigger on_b2me_auth_user_created after insert on auth.users
for each row execute function public.create_profile_for_user();
create trigger update_profiles_timestamp before update on public.profiles
for each row execute function public.set_updated_at();

create table public.categories (
 id bigint generated always as identity primary key,
 slug text not null unique,
 name_ar text not null,
 name_en text not null,
 icon_key text not null default 'grid',
 sort_order integer not null default 0,
 is_active boolean not null default true
);
insert into public.categories(slug,name_ar,name_en,icon_key,sort_order) values
 ('technology','التكنولوجيا والأتمتة','Technology & Automation','code',10),
 ('advertising','الدعاية والتسويق','Advertising & Marketing','megaphone',20),
 ('office','الأثاث المكتبي','Office Furniture','armchair',30),
 ('logistics','النقل والتوصيل','Delivery & Logistics','truck',40),
 ('catering','الضيافة والتجهيز','Catering & Hospitality','utensils',50),
 ('security','الأمن والحماية','Security & Safety','shield',60),
 ('creative','التصميم والتصوير','Design & Photography','camera',70),
 ('consulting','الاستشارات','Business Consulting','briefcase',80),
 ('supplies','التوريدات','Business Supplies','package',90);

create type public.provider_kind as enum ('company','freelancer');
create type public.provider_status as enum ('pending','active','suspended','rejected');
create table public.providers (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
 kind public.provider_kind not null default 'company',
 name_ar text not null check (length(trim(name_ar)) >= 2),
 name_en text,
 category_id bigint references public.categories(id),
 city text not null default 'Baghdad',
 description_ar text,
 description_en text,
 public_email text,
 public_phone text,
 website_url text,
 instagram_url text,
 facebook_url text,
 linkedin_url text,
 logo_path text,
 cover_path text,
 status public.provider_status not null default 'pending',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index providers_public_search on public.providers(status,category_id,city);
create index providers_owner on public.providers(owner_id);
create index providers_created_recent on public.providers(created_at desc) where status='active';
-- Any provider-controlled change to a public active business requires a renewed approval.
-- The backend's elevated role handles approval; app users cannot update status columns.
create function public.require_provider_reapproval()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.role() = 'authenticated' and old.status = 'active' then
    new.status := 'pending';
  end if;
  return new;
end;
$$;
revoke all on function public.require_provider_reapproval() from public, anon, authenticated;
create trigger require_provider_reapproval_before_update before update on public.providers
for each row execute function public.require_provider_reapproval();
create trigger update_providers_timestamp before update on public.providers
for each row execute function public.set_updated_at();

create type public.offer_status as enum ('draft','pending_review','published','rejected','expired');
create table public.provider_offers (
 id uuid primary key default gen_random_uuid(),
 provider_id uuid not null references public.providers(id) on delete cascade,
 title_ar text not null,
 title_en text,
 details_ar text,
 details_en text,
 cover_path text,
 valid_until timestamptz,
 status public.offer_status not null default 'draft',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index offers_by_provider on public.provider_offers(provider_id,status);
-- Provider edits to an already reviewed offer revoke its published status pending review.
create function public.require_offer_reapproval()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.role() = 'authenticated' and old.status in ('published','pending_review','rejected','expired') then
    new.status := 'pending_review';
  end if;
  return new;
end;
$$;
revoke all on function public.require_offer_reapproval() from public, anon, authenticated;
create trigger require_offer_reapproval_before_update before update on public.provider_offers
for each row execute function public.require_offer_reapproval();
create trigger update_offers_timestamp before update on public.provider_offers
for each row execute function public.set_updated_at();

create type public.inquiry_status as enum ('new','contacted','closed');
create table public.inquiries (
 id uuid primary key default gen_random_uuid(),
 provider_id uuid not null references public.providers(id) on delete cascade,
 requester_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 requester_name text not null,
 requester_email text not null,
 requester_phone text,
 message text not null,
 contact_consent boolean not null default false check (contact_consent = true),
 status public.inquiry_status not null default 'new',
 created_at timestamptz not null default now()
);
create index inquiries_provider on public.inquiries(provider_id,created_at desc);
create index inquiries_requester on public.inquiries(requester_id,created_at desc);

create table public.favorites (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 provider_id uuid not null references public.providers(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_id,provider_id)
);

create table public.notifications (
 id uuid primary key default gen_random_uuid(),
 recipient_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check (kind in ('transactional','promotion')),
 title_ar text not null,
 title_en text,
 body_ar text,
 body_en text,
 target_path text,
 is_read boolean not null default false,
 created_at timestamptz not null default now()
);
create index notifications_recipient on public.notifications(recipient_id,created_at desc);

-- Entitlements and promoted placements are written by a privileged billing/admin backend only.
create table public.provider_subscriptions (
 id uuid primary key default gen_random_uuid(),
 provider_id uuid not null references public.providers(id) on delete cascade,
 plan_code text not null check(plan_code in ('trial','basic','pro','premium')),
 starts_at timestamptz not null,
 ends_at timestamptz,
 active boolean not null default false,
 external_billing_ref text,
 created_at timestamptz not null default now()
);
create index subscriptions_by_provider on public.provider_subscriptions(provider_id,active);

create table public.featured_placements (
 id uuid primary key default gen_random_uuid(),
 provider_id uuid not null references public.providers(id) on delete cascade,
 placement_key text not null check(placement_key in ('search_top','home_featured','email_campaign')),
 starts_at timestamptz not null,
 ends_at timestamptz not null check(ends_at > starts_at),
 created_at timestamptz not null default now()
);
create index featured_by_placement on public.featured_placements(placement_key,starts_at,ends_at);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.providers enable row level security;
alter table public.provider_offers enable row level security;
alter table public.inquiries enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;
alter table public.provider_subscriptions enable row level security;
alter table public.featured_placements enable row level security;

-- Strip broad client writes; grant safe columns only. Role grants + RLS jointly apply.
revoke all on public.profiles,public.providers,public.categories,public.provider_offers,
 public.inquiries,public.favorites,public.notifications,public.provider_subscriptions,
 public.featured_placements from anon,authenticated;

grant usage on schema public to anon,authenticated;
grant select on public.categories to anon,authenticated;
grant select on public.providers,public.provider_offers,public.featured_placements to anon,authenticated;
grant select on public.profiles,public.inquiries,public.favorites,
 public.notifications,public.provider_subscriptions to authenticated;

grant update (display_name,preferred_language,email_marketing_opt_in) on public.profiles to authenticated;

grant insert (kind,name_ar,name_en,category_id,city,description_ar,description_en,
 public_email,public_phone,website_url,instagram_url,facebook_url,linkedin_url,
 logo_path,cover_path) on public.providers to authenticated;
grant update (kind,name_ar,name_en,category_id,city,description_ar,description_en,
 public_email,public_phone,website_url,instagram_url,facebook_url,linkedin_url,
 logo_path,cover_path) on public.providers to authenticated;

grant insert (provider_id,title_ar,title_en,details_ar,details_en,cover_path,valid_until)
 on public.provider_offers to authenticated;
grant update (title_ar,title_en,details_ar,details_en,cover_path,valid_until)
 on public.provider_offers to authenticated;
grant delete on public.provider_offers to authenticated;

grant insert (provider_id,requester_name,requester_email,requester_phone,message,contact_consent)
 on public.inquiries to authenticated;
grant update (status) on public.inquiries to authenticated;

grant insert (provider_id) on public.favorites to authenticated;
grant delete on public.favorites to authenticated;
grant update (is_read) on public.notifications to authenticated;

-- Category IDs are read-only; no client sequence grants are required.

create policy "read_own_profile" on public.profiles for select to authenticated using (id=auth.uid());
create policy "edit_own_profile" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy "read_categories" on public.categories for select to anon,authenticated using (is_active);

create policy "read_active_or_owned_providers" on public.providers for select to anon,authenticated
 using (status='active' or owner_id=auth.uid());
create policy "request_new_provider" on public.providers for insert to authenticated
 with check (owner_id=auth.uid() and status='pending');
create policy "edit_owned_provider" on public.providers for update to authenticated
 using (owner_id=auth.uid()) with check (owner_id=auth.uid());

create policy "read_published_or_owned_offers" on public.provider_offers for select to anon,authenticated
 using ((status='published' and exists (select 1 from public.providers p where p.id=provider_id and p.status='active'))
        or exists(select 1 from public.providers p where p.id=provider_id and p.owner_id=auth.uid()));
create policy "create_own_draft_offer" on public.provider_offers for insert to authenticated
 with check (status='draft' and exists(select 1 from public.providers p where p.id=provider_id and p.owner_id=auth.uid() and p.status='active'));
create policy "edit_own_offer" on public.provider_offers for update to authenticated
 using (exists(select 1 from public.providers p where p.id=provider_id and p.owner_id=auth.uid()))
 with check (exists(select 1 from public.providers p where p.id=provider_id and p.owner_id=auth.uid()));
create policy "delete_own_offer" on public.provider_offers for delete to authenticated
 using (exists(select 1 from public.providers p where p.id=provider_id and p.owner_id=auth.uid()));

create policy "read_own_or_received_inquiries" on public.inquiries for select to authenticated
 using (requester_id=auth.uid() or exists(select 1 from public.providers p where p.id=provider_id and p.owner_id=auth.uid()));
create policy "submit_own_inquiry_to_active_provider" on public.inquiries for insert to authenticated
 with check (requester_id=auth.uid() and contact_consent=true and lower(requester_email)=lower(auth.jwt()->>'email') and
 exists(select 1 from public.providers p where p.id=provider_id and p.status='active'));
create policy "provider_update_inquiry_status" on public.inquiries for update to authenticated
 using (exists(select 1 from public.providers p where p.id=provider_id and p.owner_id=auth.uid()))
 with check (exists(select 1 from public.providers p where p.id=provider_id and p.owner_id=auth.uid()));

create policy "read_own_favorites" on public.favorites for select to authenticated using (user_id=auth.uid());
create policy "save_own_favorite" on public.favorites for insert to authenticated with check (user_id=auth.uid());
create policy "delete_own_favorite" on public.favorites for delete to authenticated using (user_id=auth.uid());
create policy "read_own_notifications" on public.notifications for select to authenticated using (recipient_id=auth.uid());
create policy "mark_own_notifications_read" on public.notifications for update to authenticated
 using (recipient_id=auth.uid()) with check (recipient_id=auth.uid());
create policy "read_own_subscriptions" on public.provider_subscriptions for select to authenticated
 using (exists(select 1 from public.providers p where p.id=provider_id and p.owner_id=auth.uid()));
create policy "read_current_featured" on public.featured_placements for select to anon,authenticated
 using (now() between starts_at and ends_at and exists(select 1 from public.providers p where p.id=provider_id and p.status='active'));

-- IMPORTANT future work: protect file uploads with Storage policies, require verified email,
-- implement Edge Function for lead mail (with validation/rate limits), and only publish
-- offers/change provider status after admin approval and billing checks.


-- Explicit submission: clients never get UPDATE(status) permission.
-- A review queue can then be serviced by the privileged admin backend.
create function public.submit_offer_for_review(offer_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  changed_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;
  update public.provider_offers as o
  set status='pending_review'
  where o.id=offer_id
    and o.status in ('draft','rejected','expired')
    and exists (
      select 1 from public.providers as p
      where p.id=o.provider_id
        and p.owner_id=current_user_id
        and p.status='active'
    )
  returning o.id into changed_id;
  return changed_id is not null;
end;
$$;
revoke all on function public.submit_offer_for_review(uuid) from public,anon;
grant execute on function public.submit_offer_for_review(uuid) to authenticated;

-- SECURITY NOTES
-- 1. Activate providers/publish offers/set paid subscriptions only with a protected server-side admin role.
-- 2. Verify email in Auth settings, enforce abuse/rate limits at the backend, and set Storage RLS before enabling uploads.
-- 3. The client must not hold service_role credentials. This migration grants no client writes to paid entitlements.
-- 4. Any promotional emails require opt-in and an unsubscribe mechanism.
-- 5. This SQL is not deployed. Apply only to a dedicated B2ME project after review.