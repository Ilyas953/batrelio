-- Request links: the artisan sends a single-use link, the customer describes their need
-- and adds photos, and the request lands in the artisan space.
-- Customers have no account: the public form goes through the server (secret key),
-- which checks the link before writing anything.

create type public.request_source as enum ('missed_call', 'link');

alter table public.requests
  add column source public.request_source not null default 'missed_call';

create table public.request_links (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  -- 122 random bits (UUID v4): impossible to guess.
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  -- Optional prefill, when the artisan already knows who they send the link to.
  customer_name text check (char_length(customer_name) <= 120),
  customer_phone text check (customer_phone ~ '^\+[1-9][0-9]{6,14}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  used_at timestamptz,
  request_id uuid references public.requests (id) on delete set null
);

create index request_links_company_id_idx on public.request_links (company_id);

create table public.request_photos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  request_id uuid not null,
  -- Path in the request-photos bucket: {company_id}/{request_id}/{photo id}.jpg
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  foreign key (request_id, company_id)
    references public.requests (id, company_id) on delete cascade
);

create index request_photos_request_id_idx on public.request_photos (request_id);

alter table public.request_links enable row level security;
alter table public.request_photos enable row level security;

create policy "Owners can read their request links"
  on public.request_links for select
  to authenticated
  using (
    exists (
      select 1 from public.companies
      where companies.id = request_links.company_id
        and companies.owner_id = (select auth.uid())
    )
  );

create policy "Owners can create request links"
  on public.request_links for insert
  to authenticated
  with check (
    exists (
      select 1 from public.companies
      where companies.id = request_links.company_id
        and companies.owner_id = (select auth.uid())
    )
  );

create policy "Owners can read their request photos"
  on public.request_photos for select
  to authenticated
  using (
    exists (
      select 1 from public.companies
      where companies.id = request_photos.company_id
        and companies.owner_id = (select auth.uid())
    )
  );

-- Artisans choose who they send a link to; the token, expiry and use are set by the server.
revoke insert, update, delete on public.request_links from anon, authenticated;
grant insert (company_id, customer_name, customer_phone) on public.request_links to authenticated;
revoke insert, update, delete on public.request_photos from anon, authenticated;

-- Private bucket: photos are only reachable through short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('request-photos', 'request-photos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Owners can read their request photo files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'request-photos'
    and exists (
      select 1 from public.companies
      where companies.id::text = (storage.foldername(name))[1]
        and companies.owner_id = (select auth.uid())
    )
  );
