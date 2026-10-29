-- Self-service signup: the company is created in the same transaction as the user,
-- from the metadata sent by the signup form. An account never exists without its company,
-- whether or not email confirmation is enabled.
-- Users created by the admin or by scripts carry no company_name: they are left untouched.

create function public.create_company_on_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ? 'company_name' then
    insert into public.companies (owner_id, name, sms_sender_name, trade)
    values (
      new.id,
      new.raw_user_meta_data ->> 'company_name',
      new.raw_user_meta_data ->> 'sms_sender_name',
      nullif(new.raw_user_meta_data ->> 'trade', '')::public.trade
    );
  end if;
  return new;
end;
$$;

-- Only the trigger runs it, never an API call.
revoke execute on function public.create_company_on_signup() from public, anon, authenticated;

create trigger on_auth_user_created_create_company
  after insert on auth.users
  for each row execute function public.create_company_on_signup();
