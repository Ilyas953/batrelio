-- Numbers the artisan never wants to auto-reply to (family, suppliers, partners):
-- no SMS and no request, the call only shows in the missed-call history.

create table public.auto_reply_exclusions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  phone text not null check (phone ~ '^\+[1-9][0-9]{6,14}$'),
  -- Optional reminder for the artisan, e.g. "Fournisseur bois".
  label text check (char_length(label) <= 60),
  created_at timestamptz not null default now(),
  unique (company_id, phone)
);

alter table public.auto_reply_exclusions enable row level security;

create policy "Owners can read their exclusions"
  on public.auto_reply_exclusions for select
  to authenticated
  using (
    exists (
      select 1 from public.companies
      where companies.id = auto_reply_exclusions.company_id
        and companies.owner_id = (select auth.uid())
    )
  );

create policy "Owners can add exclusions"
  on public.auto_reply_exclusions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.companies
      where companies.id = auto_reply_exclusions.company_id
        and companies.owner_id = (select auth.uid())
    )
  );

create policy "Owners can remove exclusions"
  on public.auto_reply_exclusions for delete
  to authenticated
  using (
    exists (
      select 1 from public.companies
      where companies.id = auto_reply_exclusions.company_id
        and companies.owner_id = (select auth.uid())
    )
  );

revoke insert, update, delete on public.auto_reply_exclusions from anon, authenticated;
grant insert (company_id, phone, label), delete on public.auto_reply_exclusions to authenticated;

-- New outcome for a call from an excluded number.
alter table public.missed_calls drop constraint missed_calls_sms_status_check;
alter table public.missed_calls add constraint missed_calls_sms_status_check check (sms_status in (
  'pending', 'sent', 'delivered', 'failed',
  'skipped_disabled', 'skipped_anonymous', 'skipped_not_mobile', 'skipped_own_number', 'skipped_recent',
  'skipped_excluded'
));
