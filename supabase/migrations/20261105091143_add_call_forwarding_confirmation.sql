-- Setup guide: the artisan says they dialled the call-forwarding code on their phone.
-- Forwarding is set at the operator, so Batrelio cannot see it; the first forwarded
-- call (a row in missed_calls) is what proves it works.

alter table public.companies
  add column call_forwarding_confirmed_at timestamptz;

grant update (call_forwarding_confirmed_at) on public.companies to authenticated;
