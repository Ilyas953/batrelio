-- Invoices, made from a quote ("Faire la facture"). A draft stays editable by the artisan; once issued
-- it gets the next number of an unbroken sequence and never changes again (corrections go through
-- a credit note). Numbering, issuing and payment are written by the server only.

create type public.invoice_status as enum ('draft', 'issued', 'paid');

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  quote_id uuid not null,
  status public.invoice_status not null default 'draft',
  -- F2026-001: per company, unbroken, set when issued.
  number text,
  public_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  title text check (char_length(title) <= 200),
  customer_name text check (char_length(customer_name) <= 120),
  customer_address text check (char_length(customer_address) <= 500),
  -- Date the work was completed: required on the invoice.
  work_completed_on date,
  -- 0: payable on receipt.
  payment_due_days integer not null default 0 check (payment_due_days in (0, 15, 30, 45)),
  -- Deposit already paid by the customer, deducted from what remains to pay.
  deposit_received_cents integer not null default 0 check (deposit_received_cents >= 0),
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  vat_cents integer not null default 0 check (vat_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  notes text check (char_length(notes) <= 2000),
  -- The company's legal details frozen when issued.
  company_snapshot jsonb,
  issued_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, company_id),
  unique (company_id, number),
  foreign key (quote_id, company_id) references public.quotes (id, company_id) on delete cascade
);

create index invoices_company_id_status_idx on public.invoices (company_id, status, created_at desc);

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

create table public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null,
  company_id uuid not null,
  position integer not null check (position >= 0),
  category public.quote_line_category not null default 'other',
  designation text not null check (char_length(designation) between 1 and 500),
  quantity numeric(12, 2) not null check (quantity >= 0),
  unit text not null check (char_length(unit) between 1 and 20),
  unit_price_cents integer check (unit_price_cents >= 0),
  vat_rate_bp integer not null default 0 check (vat_rate_bp in (0, 550, 1000, 2000)),
  created_at timestamptz not null default now(),
  foreign key (invoice_id, company_id) references public.invoices (id, company_id) on delete cascade
);

create index invoice_lines_invoice_id_idx on public.invoice_lines (invoice_id, position);

alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;

-- The artisan reads their own invoices; creates and edits drafts only; deletes drafts only.
create policy "Owners can read their invoices"
  on public.invoices for select to authenticated
  using (exists (select 1 from public.companies where companies.id = invoices.company_id and companies.owner_id = (select auth.uid())));

create policy "Owners can create draft invoices"
  on public.invoices for insert to authenticated
  with check (
    status = 'draft'
    and exists (select 1 from public.companies where companies.id = invoices.company_id and companies.owner_id = (select auth.uid()))
  );

create policy "Owners can edit their draft invoices"
  on public.invoices for update to authenticated
  using (status = 'draft' and exists (select 1 from public.companies where companies.id = invoices.company_id and companies.owner_id = (select auth.uid())))
  with check (status = 'draft' and exists (select 1 from public.companies where companies.id = invoices.company_id and companies.owner_id = (select auth.uid())));

create policy "Owners can delete their draft invoices"
  on public.invoices for delete to authenticated
  using (status = 'draft' and exists (select 1 from public.companies where companies.id = invoices.company_id and companies.owner_id = (select auth.uid())));

create policy "Owners can read their invoice lines"
  on public.invoice_lines for select to authenticated
  using (exists (select 1 from public.companies where companies.id = invoice_lines.company_id and companies.owner_id = (select auth.uid())));

-- Lines change only through replace_invoice_lines, and only on a draft.
create policy "Owners can change lines of their draft invoices"
  on public.invoice_lines for all to authenticated
  using (exists (
    select 1 from public.invoices
    join public.companies on companies.id = invoices.company_id
    where invoices.id = invoice_lines.invoice_id and invoices.status = 'draft' and companies.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.invoices
    join public.companies on companies.id = invoices.company_id
    where invoices.id = invoice_lines.invoice_id and invoices.status = 'draft' and companies.owner_id = (select auth.uid())
  ));

revoke insert, update, delete on public.invoices from anon, authenticated;
grant insert (company_id, quote_id, title, customer_name, customer_address, work_completed_on, payment_due_days,
              deposit_received_cents, subtotal_cents, vat_cents, total_cents, notes)
  on public.invoices to authenticated;
grant update (title, customer_name, customer_address, work_completed_on, payment_due_days,
              deposit_received_cents, subtotal_cents, vat_cents, total_cents, notes)
  on public.invoices to authenticated;
grant delete on public.invoices to authenticated;

revoke insert, update, delete on public.invoice_lines from anon, authenticated;
grant insert, delete on public.invoice_lines to authenticated;

-- Replaces all the lines of a draft invoice in one go (security invoker: RLS applies).
create function public.replace_invoice_lines(p_invoice_id uuid, p_lines jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_company_id uuid;
begin
  select company_id into v_company_id from public.invoices where id = p_invoice_id and status = 'draft';
  if v_company_id is null then
    raise exception 'Facture introuvable ou déjà émise';
  end if;

  delete from public.invoice_lines where invoice_id = p_invoice_id;

  insert into public.invoice_lines (invoice_id, company_id, position, category, designation, quantity, unit, unit_price_cents, vat_rate_bp)
  select p_invoice_id, v_company_id, line.position, line.category, line.designation, line.quantity, line.unit,
         line.unit_price_cents, line.vat_rate_bp
  from jsonb_to_recordset(p_lines) as line(
    position integer, category public.quote_line_category, designation text, quantity numeric,
    unit text, unit_price_cents integer, vat_rate_bp integer
  );
end;
$$;

revoke execute on function public.replace_invoice_lines(uuid, jsonb) from public, anon;
grant execute on function public.replace_invoice_lines(uuid, jsonb) to authenticated;
