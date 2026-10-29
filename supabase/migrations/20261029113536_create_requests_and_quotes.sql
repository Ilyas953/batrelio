-- Customer requests (sent from the form linked in the missed-call SMS) and the quotes
-- that answer them. Only what the artisan space reads for now; later V1 steps extend it.

create type public.request_status as enum ('new', 'quoted', 'visit_proposed', 'closed');
create type public.quote_status as enum ('draft', 'sent', 'signed', 'declined');

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  customer_name text check (char_length(customer_name) <= 120),
  -- E.164, e.g. +33612345678: the number that called.
  customer_phone text not null check (customer_phone ~ '^\+[1-9][0-9]{6,14}$'),
  description text check (char_length(description) <= 5000),
  address text check (char_length(address) <= 500),
  status public.request_status not null default 'new',
  created_at timestamptz not null default now(),
  -- Lets quotes reference (id, company_id) so a quote always belongs to the request's company.
  unique (id, company_id)
);

create index requests_company_id_created_at_idx on public.requests (company_id, created_at desc);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  request_id uuid not null,
  total_cents integer not null check (total_cents >= 0),
  deposit_cents integer check (deposit_cents >= 0),
  status public.quote_status not null default 'draft',
  sent_at timestamptz,
  signed_at timestamptz,
  deposit_paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (request_id, company_id)
    references public.requests (id, company_id) on delete cascade
);

create index quotes_company_id_status_idx on public.quotes (company_id, status);

create trigger quotes_set_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

-- An artisan only ever sees the requests and quotes of their own company.
-- Read-only for now: writes are added with the features that need them.
alter table public.requests enable row level security;
alter table public.quotes enable row level security;

create policy "Owners can read their requests"
  on public.requests for select
  to authenticated
  using (
    exists (
      select 1 from public.companies
      where companies.id = requests.company_id
        and companies.owner_id = (select auth.uid())
    )
  );

create policy "Owners can read their quotes"
  on public.quotes for select
  to authenticated
  using (
    exists (
      select 1 from public.companies
      where companies.id = quotes.company_id
        and companies.owner_id = (select auth.uid())
    )
  );
