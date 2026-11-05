-- Two more answers to a request besides the quote:
-- - propose a visit: the artisan sends the message from their own phone;
-- - share the mission: the artisan cannot take the job, Batrelio looks for another
--   artisan by hand from the admin space.

alter type public.request_status add value if not exists 'shared';

-- Date and time of the proposed visit.
alter table public.requests add column visit_at timestamptz;

create type public.mission_status as enum ('to_place', 'in_progress', 'placed', 'abandoned');

create table public.shared_missions (
  id uuid primary key default gen_random_uuid(),
  -- A request is shared once at most.
  request_id uuid not null unique,
  company_id uuid not null,
  -- Optional word from the artisan to Batrelio.
  artisan_note text check (char_length(artisan_note) between 1 and 1000),
  status public.mission_status not null default 'to_place',
  -- Batrelio's internal follow-up (who was called, who took it): never shown to the artisan.
  admin_note text check (char_length(admin_note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (request_id, company_id)
    references public.requests (id, company_id) on delete cascade
);

create index shared_missions_status_created_at_idx on public.shared_missions (status, created_at desc);

create trigger shared_missions_set_updated_at
  before update on public.shared_missions
  for each row execute function public.set_updated_at();

alter table public.shared_missions enable row level security;

-- The artisan only sees that their own mission was shared and where it stands.
create policy "Owners can read their shared missions"
  on public.shared_missions for select
  to authenticated
  using (
    exists (
      select 1 from public.companies
      where companies.id = shared_missions.company_id
        and companies.owner_id = (select auth.uid())
    )
  );

-- Every write goes through the server (service role). The admin note stays out of reach.
revoke all on public.shared_missions from anon, authenticated;
grant select (id, request_id, company_id, status, created_at) on public.shared_missions to authenticated;
