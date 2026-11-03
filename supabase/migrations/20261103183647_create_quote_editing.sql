-- Quotes the artisan builds from a request: AI-suggested lines, the artisan sets the prices,
-- then sends a link. A quote can be edited only while it is a draft; sending (number,
-- frozen company details, status) is done by the server, never by the client.

create type public.quote_line_category as enum ('labor', 'material', 'travel', 'waste', 'other');

alter table public.quotes
  add column number text check (char_length(number) <= 30),
  -- The customer's link: 122 random bits, impossible to guess.
  add column public_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  add column title text check (char_length(title) <= 200),
  add column customer_name text check (char_length(customer_name) <= 120),
  add column customer_address text check (char_length(customer_address) <= 500),
  add column subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  add column vat_cents integer not null default 0 check (vat_cents >= 0),
  add column deposit_percent integer check (deposit_percent between 0 and 100),
  add column validity_days integer not null default 30 check (validity_days between 1 and 365),
  add column work_start_date date,
  add column work_duration text check (char_length(work_duration) <= 120),
  -- Construction waste: estimated quantity, sorting and drop-off point (loi AGEC).
  add column waste_management text check (char_length(waste_management) <= 2000),
  add column notes text check (char_length(notes) <= 2000),
  -- Points the AI could not settle from the request, shown to the artisan only.
  add column ai_notes text check (char_length(ai_notes) <= 2000),
  -- Legal details of the company as they were when the quote was sent.
  add column company_snapshot jsonb,
  add unique (id, company_id),
  add unique (company_id, number);

alter table public.quotes alter column total_cents set default 0;

create table public.quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null,
  company_id uuid not null,
  position integer not null check (position >= 0),
  category public.quote_line_category not null default 'other',
  designation text not null check (char_length(designation) between 1 and 500),
  quantity numeric(12, 2) not null check (quantity >= 0),
  unit text not null check (char_length(unit) between 1 and 20),
  -- Set by the artisan: null until priced.
  unit_price_cents integer check (unit_price_cents >= 0),
  -- 0 (franchise or exempt), 5.5 %, 10 % or 20 %, in basis points.
  vat_rate_bp integer not null default 0 check (vat_rate_bp in (0, 550, 1000, 2000)),
  created_at timestamptz not null default now(),
  foreign key (quote_id, company_id) references public.quotes (id, company_id) on delete cascade
);

create index quote_lines_quote_id_idx on public.quote_lines (quote_id, position);

alter table public.quote_lines enable row level security;

-- Quotes: the artisan creates, edits and deletes their own drafts.
create policy "Owners can create quotes"
  on public.quotes for insert
  to authenticated
  with check (
    status = 'draft'
    and exists (
      select 1 from public.companies
      where companies.id = quotes.company_id
        and companies.owner_id = (select auth.uid())
    )
  );

create policy "Owners can edit their draft quotes"
  on public.quotes for update
  to authenticated
  using (
    status = 'draft'
    and exists (
      select 1 from public.companies
      where companies.id = quotes.company_id
        and companies.owner_id = (select auth.uid())
    )
  )
  with check (status = 'draft');

create policy "Owners can delete their draft quotes"
  on public.quotes for delete
  to authenticated
  using (
    status = 'draft'
    and exists (
      select 1 from public.companies
      where companies.id = quotes.company_id
        and companies.owner_id = (select auth.uid())
    )
  );

-- Lines follow their quote: readable by the owner, writable while the quote is a draft.
create policy "Owners can read their quote lines"
  on public.quote_lines for select
  to authenticated
  using (
    exists (
      select 1 from public.companies
      where companies.id = quote_lines.company_id
        and companies.owner_id = (select auth.uid())
    )
  );

create policy "Owners can write lines of their draft quotes"
  on public.quote_lines for all
  to authenticated
  using (
    exists (
      select 1 from public.quotes
      join public.companies on companies.id = quotes.company_id
      where quotes.id = quote_lines.quote_id
        and quotes.status = 'draft'
        and companies.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.quotes
      join public.companies on companies.id = quotes.company_id
      where quotes.id = quote_lines.quote_id
        and quotes.company_id = quote_lines.company_id
        and quotes.status = 'draft'
        and companies.owner_id = (select auth.uid())
    )
  );

-- Column privileges: number, token, status, dates and snapshot are the server's.
revoke insert, update, delete on public.quotes from anon, authenticated;
grant insert (
  company_id, request_id, title, customer_name, customer_address, subtotal_cents, vat_cents,
  total_cents, deposit_percent, deposit_cents, validity_days, work_start_date, work_duration,
  waste_management, notes, ai_notes
) on public.quotes to authenticated;
grant update (
  title, customer_name, customer_address, subtotal_cents, vat_cents, total_cents,
  deposit_percent, deposit_cents, validity_days, work_start_date, work_duration,
  waste_management, notes, ai_notes
) on public.quotes to authenticated;
grant delete on public.quotes to authenticated;

revoke insert, update, delete on public.quote_lines from anon, authenticated;
grant insert (quote_id, company_id, position, category, designation, quantity, unit, unit_price_cents, vat_rate_bp),
  update (position, category, designation, quantity, unit, unit_price_cents, vat_rate_bp),
  delete
  on public.quote_lines to authenticated;

-- Replaces every line of a draft in one transaction. Runs with the caller's rights:
-- RLS and column privileges still apply.
create function public.replace_quote_lines(p_quote_id uuid, p_lines jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_company_id uuid;
begin
  select company_id into v_company_id from public.quotes where id = p_quote_id and status = 'draft';
  if v_company_id is null then
    raise exception 'Devis introuvable ou déjà envoyé';
  end if;

  delete from public.quote_lines where quote_id = p_quote_id;

  insert into public.quote_lines (quote_id, company_id, position, category, designation, quantity, unit, unit_price_cents, vat_rate_bp)
  select p_quote_id, v_company_id, line.position, line.category, line.designation, line.quantity, line.unit,
         line.unit_price_cents, line.vat_rate_bp
  from jsonb_to_recordset(p_lines) as line(
    position integer, category public.quote_line_category, designation text, quantity numeric,
    unit text, unit_price_cents integer, vat_rate_bp integer
  );
end;
$$;

revoke execute on function public.replace_quote_lines(uuid, jsonb) from public, anon;
grant execute on function public.replace_quote_lines(uuid, jsonb) to authenticated;
