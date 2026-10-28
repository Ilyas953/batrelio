-- One company per artisan account. Every tenant-owned table will reference it.

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  -- Alphanumeric SMS sender (Twilio): 11 characters max, letters, digits and spaces,
  -- at least one letter.
  sms_sender_name text not null
    check (sms_sender_name ~ '^[A-Za-z0-9 ]{1,11}$' and sms_sender_name ~ '[A-Za-z]'),
  -- Subdomain of the artisan's space, e.g. dupont-toiture.
  slug text not null unique
    check (slug ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

-- An artisan only ever sees and edits their own company.
alter table public.companies enable row level security;

create policy "Owners can read their company"
  on public.companies for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Owners can create their company"
  on public.companies for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Owners can update their company"
  on public.companies for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
