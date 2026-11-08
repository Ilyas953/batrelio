-- Greetings recorded once with the chosen voice (MP3), played on missed calls instead of being
-- read live at every call. Private: only the server (service role) reads and writes them, and
-- the telephony provider gets a short-lived signed URL during the call.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('greeting-audio', 'greeting-audio', false, 2097152, array['audio/mpeg'])
on conflict (id) do nothing;
