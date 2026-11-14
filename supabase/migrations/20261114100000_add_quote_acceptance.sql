-- The customer accepts the quote online, or the artisan records the answer they got by phone or on paper.
-- Proof of an online acceptance: the name the customer typed, the time (signed_at) and their address.
-- signed_ip stays null when the artisan recorded the acceptance themselves.

alter table public.quotes
  add column signed_by_name text check (char_length(signed_by_name) between 1 and 120),
  add column signed_ip text check (char_length(signed_ip) <= 64),
  add column declined_at timestamptz;

-- A signed quote has its date; a declined one too.
alter table public.quotes
  add constraint quotes_signed_has_date check (status <> 'signed' or signed_at is not null),
  add constraint quotes_declined_has_date check (status <> 'declined' or declined_at is not null);
