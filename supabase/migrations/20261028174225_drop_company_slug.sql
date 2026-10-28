-- One domain per artisan is out of V1 scope: the subdomain is not needed yet.
alter table public.companies drop column slug;
