-- Auto reply to missed calls: the artisan forwards unanswered calls to their Batrelio number,
-- the caller hears a greeting and receives an SMS with a request link.

alter table public.companies
  -- The Batrelio number calls are forwarded to (E.164), and its id at the telephony provider.
  add column phone_number text unique check (phone_number ~ '^\+[1-9][0-9]{6,14}$'),
  add column phone_number_sid text,
  add column auto_reply_enabled boolean not null default false,
  -- French operators require each alphanumeric sender to be registered (AF2M):
  -- set by the admin once the registration is accepted.
  add column sms_sender_approved boolean not null default false;

-- A new sender name needs a new registration.
create function public.reset_sms_sender_approval()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.sms_sender_name is distinct from old.sms_sender_name then
    new.sms_sender_approved = false;
  end if;
  return new;
end;
$$;

create trigger companies_reset_sms_sender_approval
  before update of sms_sender_name on public.companies
  for each row execute function public.reset_sms_sender_approval();

-- Artisans can pause or resume the auto reply; the number itself is set by the server.
grant update (auto_reply_enabled) on public.companies to authenticated;

create table public.missed_calls (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  -- The provider's call id: a retried webhook never handles the same call twice.
  call_sid text not null unique,
  caller_phone text,
  request_id uuid references public.requests (id) on delete set null,
  sms_status text not null default 'pending' check (sms_status in (
    'pending', 'sent', 'delivered', 'failed',
    'skipped_disabled', 'skipped_anonymous', 'skipped_not_mobile', 'skipped_own_number', 'skipped_recent'
  )),
  sms_sid text unique,
  created_at timestamptz not null default now()
);

create index missed_calls_company_caller_idx on public.missed_calls (company_id, caller_phone, created_at desc);

alter table public.missed_calls enable row level security;

create policy "Owners can read their missed calls"
  on public.missed_calls for select
  to authenticated
  using (
    exists (
      select 1 from public.companies
      where companies.id = missed_calls.company_id
        and companies.owner_id = (select auth.uid())
    )
  );

revoke insert, update, delete on public.missed_calls from anon, authenticated;
