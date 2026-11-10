-- "Mes prix": each artisan's own quote lines (wording, unit, price, VAT), remembered from the
-- quotes they send and reused for the next ones (by the AI draft and when typing a line).
-- Equipment and tools billed to the customer (aerial lift, scaffolding, chipper…) get their own category.

alter type public.quote_line_category add value if not exists 'equipment';

create table public.price_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  category public.quote_line_category not null default 'other',
  designation text not null check (char_length(designation) between 1 and 500),
  -- The same line typed with other capitals or spaces is the same item.
  designation_key text generated always as (lower(regexp_replace(btrim(designation), '\s+', ' ', 'g'))) stored,
  unit text not null check (char_length(unit) between 1 and 20),
  unit_price_cents integer not null check (unit_price_cents between 0 and 100000000),
  -- 0 (franchise or exempt), 5.5 %, 10 % or 20 %, in basis points.
  vat_rate_bp integer not null default 0 check (vat_rate_bp in (0, 550, 1000, 2000)),
  -- How often it appeared on a sent quote: the most used come first.
  use_count integer not null default 0 check (use_count >= 0),
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, designation_key, unit)
);

create index price_items_company_id_use_idx on public.price_items (company_id, use_count desc, last_used_at desc);

create trigger price_items_set_updated_at
  before update on public.price_items
  for each row execute function public.set_updated_at();

alter table public.price_items enable row level security;

-- An artisan only ever sees and changes their own prices.
create policy "Owners can read their prices"
  on public.price_items for select
  to authenticated
  using (exists (select 1 from public.companies where companies.id = price_items.company_id and companies.owner_id = (select auth.uid())));

create policy "Owners can add their prices"
  on public.price_items for insert
  to authenticated
  with check (exists (select 1 from public.companies where companies.id = price_items.company_id and companies.owner_id = (select auth.uid())));

create policy "Owners can change their prices"
  on public.price_items for update
  to authenticated
  using (exists (select 1 from public.companies where companies.id = price_items.company_id and companies.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.companies where companies.id = price_items.company_id and companies.owner_id = (select auth.uid())));

create policy "Owners can delete their prices"
  on public.price_items for delete
  to authenticated
  using (exists (select 1 from public.companies where companies.id = price_items.company_id and companies.owner_id = (select auth.uid())));

revoke insert, update, delete on public.price_items from anon, authenticated;
-- use_count and last_used_at only order the artisan's own list.
grant insert (company_id, category, designation, unit, unit_price_cents, vat_rate_bp, use_count, last_used_at) on public.price_items to authenticated;
grant update (category, designation, unit, unit_price_cents, vat_rate_bp, use_count, last_used_at) on public.price_items to authenticated;
grant delete on public.price_items to authenticated;

-- After a quote is sent: its priced lines join (or update) the artisan's prices.
-- Security invoker: row level security limits it to the caller's own quote and prices.
create function public.remember_quote_prices(p_quote_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.price_items as item (company_id, category, designation, unit, unit_price_cents, vat_rate_bp, use_count, last_used_at)
  select distinct on (lower(regexp_replace(btrim(line.designation), '\s+', ' ', 'g')), line.unit)
    line.company_id, line.category, btrim(line.designation), line.unit, line.unit_price_cents, line.vat_rate_bp, 1, now()
  from public.quote_lines line
  where line.quote_id = p_quote_id and line.unit_price_cents is not null
  order by lower(regexp_replace(btrim(line.designation), '\s+', ' ', 'g')), line.unit, line.position desc
  on conflict (company_id, designation_key, unit) do update
    set unit_price_cents = excluded.unit_price_cents,
        vat_rate_bp = excluded.vat_rate_bp,
        category = excluded.category,
        use_count = item.use_count + 1,
        last_used_at = now();
$$;

revoke execute on function public.remember_quote_prices(uuid) from public, anon;
grant execute on function public.remember_quote_prices(uuid) to authenticated;
