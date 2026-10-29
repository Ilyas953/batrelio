-- Proof that the artisan accepted the terms (CGV, privacy policy) at signup:
-- which version, and when. Recorded by the database itself, never by the client.

alter table public.companies
  add column terms_version text check (char_length(terms_version) <= 20),
  add column terms_accepted_at timestamptz;

create or replace function public.create_company_on_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ? 'company_name' then
    insert into public.companies (owner_id, name, sms_sender_name, trade, terms_version, terms_accepted_at)
    values (
      new.id,
      new.raw_user_meta_data ->> 'company_name',
      new.raw_user_meta_data ->> 'sms_sender_name',
      nullif(new.raw_user_meta_data ->> 'trade', '')::public.trade,
      new.raw_user_meta_data ->> 'terms_version',
      case when new.raw_user_meta_data ? 'terms_version' then now() end
    );
  end if;
  return new;
end;
$$;

-- RLS decides which rows an artisan reaches; column privileges decide what they may write.
-- Artisans edit their company profile, never its id, owner, dates or proof of acceptance.
revoke insert, update on public.companies from anon, authenticated;

grant update (
  name, sms_sender_name, siret, trade, region, legal_name, legal_form, naf_code,
  address_line, postal_code, city, vat_regime, vat_number, share_capital_cents,
  insurer_name, insurer_address, insurance_policy_number, insurance_coverage_area,
  mediator_name, mediator_website, contact_phone, contact_email
) on public.companies to authenticated;

grant insert (owner_id, name, sms_sender_name, trade, region, siret)
  on public.companies to authenticated;
