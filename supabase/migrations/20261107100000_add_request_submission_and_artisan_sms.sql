-- A missed call no longer shows as a request on its own: the artisan only sees what the
-- customer actually described in the form. Each new request is announced to the artisan by SMS.

-- When the customer sent the form. Null: a missed call whose customer has not described their need.
alter table public.requests add column submitted_at timestamptz;

-- What happened to the SMS telling the artisan about the new request.
alter table public.requests add column artisan_sms_status text check (
  artisan_sms_status in ('sent', 'failed', 'skipped_no_phone', 'skipped_not_mobile', 'skipped_test_account')
);

-- Requests already described, or already handled by the artisan, stay visible.
update public.requests
  set submitted_at = created_at
  where description is not null or status <> 'new';

create index requests_company_id_submitted_at_idx on public.requests (company_id, submitted_at desc)
  where submitted_at is not null;

-- Set by the database itself as soon as the customer's description arrives,
-- whichever code version saved it.
create function public.set_request_submitted_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.description is not null and new.submitted_at is null then
    new.submitted_at := now();
  end if;
  return new;
end;
$$;

revoke execute on function public.set_request_submitted_at() from public, anon, authenticated;

create trigger requests_set_submitted_at
  before insert or update of description on public.requests
  for each row execute function public.set_request_submitted_at();
