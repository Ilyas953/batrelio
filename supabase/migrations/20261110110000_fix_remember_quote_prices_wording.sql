-- When a quote has the same line twice with other capitals or spaces, keep the first one as written,
-- with its spaces tidied ("location  NACELLE" typed later does not replace "Location nacelle").

create or replace function public.remember_quote_prices(p_quote_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.price_items as item (company_id, category, designation, unit, unit_price_cents, vat_rate_bp, use_count, last_used_at)
  select distinct on (lower(regexp_replace(btrim(line.designation), '\s+', ' ', 'g')), line.unit)
    line.company_id, line.category, regexp_replace(btrim(line.designation), '\s+', ' ', 'g'), line.unit,
    line.unit_price_cents, line.vat_rate_bp, 1, now()
  from public.quote_lines line
  where line.quote_id = p_quote_id and line.unit_price_cents is not null
  order by lower(regexp_replace(btrim(line.designation), '\s+', ' ', 'g')), line.unit, line.position
  on conflict (company_id, designation_key, unit) do update
    set unit_price_cents = excluded.unit_price_cents,
        vat_rate_bp = excluded.vat_rate_bp,
        category = excluded.category,
        use_count = item.use_count + 1,
        last_used_at = now();
$$;

revoke execute on function public.remember_quote_prices(uuid) from public, anon;
grant execute on function public.remember_quote_prices(uuid) to authenticated;
