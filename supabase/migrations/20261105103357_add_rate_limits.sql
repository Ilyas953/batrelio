-- Attempt counters for sign-in, sign-up, the public request form and number purchases.
-- Keys hold a scope and a SHA-256 hash, never a raw IP address or e-mail.
-- Only the server (secret key) reads or writes them.

create table public.rate_limit_buckets (
  key text primary key check (char_length(key) <= 200),
  window_started_at timestamptz not null default now(),
  hits integer not null default 1
);

alter table public.rate_limit_buckets enable row level security;
revoke all on public.rate_limit_buckets from anon, authenticated;

-- Counts one attempt and says whether it stays within the limit (fixed window).
-- Atomic: concurrent attempts on the same key are all counted.
create function public.consume_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_window interval := make_interval(secs => p_window_seconds);
  v_hits integer;
begin
  insert into public.rate_limit_buckets as bucket (key, window_started_at, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    window_started_at = case when bucket.window_started_at <= now() - v_window then now() else bucket.window_started_at end,
    hits = case when bucket.window_started_at <= now() - v_window then 1 else bucket.hits + 1 end
  returning hits into v_hits;

  -- Housekeeping: counters are useless after a day (and must not be kept longer).
  if random() < 0.02 then
    delete from public.rate_limit_buckets where window_started_at < now() - interval '1 day';
  end if;

  return v_hits <= p_limit;
end;
$$;

revoke execute on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
