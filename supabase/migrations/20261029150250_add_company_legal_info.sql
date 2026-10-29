-- Legal details printed on quotes. Most come from the government company register
-- (looked up with the SIRET); insurance and mediator are typed in by the artisan.
-- All optional: an account works without them, quotes will require them.

create type public.legal_form as enum ('ei', 'eurl', 'sarl', 'sasu', 'sas', 'sa', 'snc', 'autre');

-- 'subject': charges VAT. 'franchise': micro-entrepreneur, "TVA non applicable, art. 293 B du CGI".
create type public.vat_regime as enum ('subject', 'franchise');

alter table public.companies
  -- Registered name (e.g. the owner's name for a sole trader); `name` stays the trading name.
  add column legal_name text check (char_length(legal_name) <= 200),
  add column legal_form public.legal_form,
  add column naf_code text check (naf_code ~ '^[0-9]{2}\.[0-9]{2}[A-Z]$'),
  add column address_line text check (char_length(address_line) <= 300),
  add column postal_code text check (postal_code ~ '^[0-9]{5}$'),
  add column city text check (char_length(city) <= 100),
  add column vat_regime public.vat_regime,
  add column vat_number text check (vat_number ~ '^FR[0-9A-Z]{2}[0-9]{9}$'),
  add column share_capital_cents bigint check (share_capital_cents >= 0),
  add column insurer_name text check (char_length(insurer_name) <= 200),
  add column insurer_address text check (char_length(insurer_address) <= 300),
  add column insurance_policy_number text check (char_length(insurance_policy_number) <= 100),
  add column insurance_coverage_area text check (char_length(insurance_coverage_area) <= 200),
  add column mediator_name text check (char_length(mediator_name) <= 200),
  add column mediator_website text check (char_length(mediator_website) <= 300),
  -- E.164, e.g. +33612345678.
  add column contact_phone text check (contact_phone ~ '^\+[1-9][0-9]{6,14}$'),
  add column contact_email text check (contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');
