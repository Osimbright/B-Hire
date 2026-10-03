-- =====================================================================
--  B-Hire — share files in chat (pictures, videos, documents)
--
--    1. A private Storage bucket, `chat-attachments`. Each file lives
--       under `<job_id>/<freelancer_id>/…`, the conversation it was sent in.
--    2. Storage policies: only the two people in that conversation can
--       upload to its folder or read from it. Files can't be changed or
--       deleted from the app once sent.
--    3. messages gets optional attachment columns, and a message may now
--       be a file with no text.
--
--  The allowed file types and 50 MB cap mirror src/lib/attachments.ts —
--  change both together.
--
--  Run once: Supabase Dashboard → SQL Editor → paste → Run
--  (or `supabase db push`).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. The bucket
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  false,
  52428800, -- 50 MB
  array[
    -- pictures
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/heic', 'image/heif',
    -- videos
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    -- documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
    'application/rtf',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- ---------------------------------------------------------------------
-- 2. Who can touch which files
-- ---------------------------------------------------------------------

-- True when the signed-in user is the client or the freelancer of the
-- conversation whose folder `p_name` is in (`<job_id>/<freelancer_id>/…`).
create or replace function private.is_chat_file_member(p_name text)
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  uuid_pattern constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  v_job_id        text := split_part(p_name, '/', 1);
  v_freelancer_id text := split_part(p_name, '/', 2);
begin
  if v_job_id !~* uuid_pattern or v_freelancer_id !~* uuid_pattern then
    return false;
  end if;

  return exists (
    select 1
    from public.proposals p
    join public.jobs j on j.id = p.job_id
    where p.job_id = v_job_id::uuid
      and p.freelancer_id = v_freelancer_id::uuid
      and (select auth.uid()) in (p.freelancer_id, j.client_id)
  );
end;
$$;

drop policy if exists "chat files: participants upload" on storage.objects;
create policy "chat files: participants upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-attachments' and private.is_chat_file_member(name));

drop policy if exists "chat files: participants read" on storage.objects;
create policy "chat files: participants read"
  on storage.objects for select to authenticated
  using (bucket_id = 'chat-attachments' and private.is_chat_file_member(name));
-- No update/delete policies: a sent file stays as it was sent.


-- ---------------------------------------------------------------------
-- 3. Attachments on messages
-- ---------------------------------------------------------------------

alter table public.messages
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text,
  add column if not exists attachment_size bigint;

-- Text is now optional when a file is attached.
alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages add constraint messages_body_check
  check (char_length(body) <= 4000 and (char_length(body) >= 1 or attachment_path is not null));

-- All four attachment columns are set together, and the file must sit in
-- this conversation's own folder.
alter table public.messages drop constraint if exists messages_attachment_check;
alter table public.messages add constraint messages_attachment_check
  check (
    (attachment_path is null and attachment_name is null and attachment_type is null and attachment_size is null)
    or (
      attachment_path like job_id::text || '/' || freelancer_id::text || '/%'
      and char_length(attachment_name) between 1 and 255
      and attachment_type is not null
      and attachment_size >= 0
    )
  );
