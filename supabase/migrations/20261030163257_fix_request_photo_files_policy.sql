-- In the previous policy, `name` inside the subquery resolved to companies.name (the company
-- name) instead of the file path, so no artisan could read their own photos.
-- Qualifying the column makes it read the file path in storage.objects.

drop policy "Owners can read their request photo files" on storage.objects;

create policy "Owners can read their request photo files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'request-photos'
    and exists (
      select 1 from public.companies
      where companies.id::text = (storage.foldername(objects.name))[1]
        and companies.owner_id = (select auth.uid())
    )
  );
