-- The company's logo, shown on its quotes and invoices. Private files: customers see them through a
-- short-lived signed link on the document page. Only the server writes them (after checking the file),
-- and every new logo gets a new file, so documents already sent keep the logo they were sent with.

alter table public.companies add column logo_path text check (logo_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|webp)$');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('company-logos', 'company-logos', false, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
