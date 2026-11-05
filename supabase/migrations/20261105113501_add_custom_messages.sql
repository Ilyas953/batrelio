-- Messages the artisan can personalise. Null means "Batrelio's default", which follows
-- the company name and future wording improvements.

alter table public.companies
  -- First part of the phone greeting; Batrelio appends what happens next (SMS, call back, hidden number).
  add column greeting_intro text check (char_length(greeting_intro) between 1 and 300),
  -- One of the voices offered in the app (lib/telephony/voices.ts).
  add column greeting_voice text check (greeting_voice ~ '^[a-z0-9-]{1,40}$'),
  -- Text sent with a quote link; the link is appended.
  add column quote_message text check (char_length(quote_message) between 1 and 300);

grant update (greeting_intro, greeting_voice, quote_message) on public.companies to authenticated;
