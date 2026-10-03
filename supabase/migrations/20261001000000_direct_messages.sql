-- =====================================================================
--  B-Hire — direct messages: a client can message a freelancer straight
--  from their profile, before (or without) a job.
--
--    1. direct_messages / direct_reads: a conversation is identified by
--       (client_id, freelancer_id), alongside the job conversations in
--       `messages`, which stay as they are.
--    2. RLS: only the two people can read it. The client writes first;
--       once they have, the freelancer can reply. Freelancers can't
--       cold-message clients.
--    3. Chat files for direct conversations live in the same bucket under
--       `direct/<client_id>/<freelancer_id>/…`.
--
--  Run once: Supabase Dashboard → SQL Editor → paste → Run
--  (or `supabase db push`).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

create table if not exists public.direct_messages (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.profiles (id) on delete cascade,
  freelancer_id   uuid not null references public.profiles (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  body            text not null,
  attachment_path text,
  attachment_name text,
  attachment_type text,
  attachment_size bigint,
  created_at      timestamptz not null default now(),

  constraint direct_messages_sender_check check (sender_id in (client_id, freelancer_id)),
  -- Same rules as `messages`: text is optional when a file is attached…
  constraint direct_messages_body_check
    check (char_length(body) <= 4000 and (char_length(body) >= 1 or attachment_path is not null)),
  -- …and the four attachment columns are set together, in this conversation's own folder.
  constraint direct_messages_attachment_check
    check (
      (attachment_path is null and attachment_name is null and attachment_type is null and attachment_size is null)
      or (
        attachment_path like 'direct/' || client_id::text || '/' || freelancer_id::text || '/%'
        and char_length(attachment_name) between 1 and 255
        and attachment_type is not null
        and attachment_size >= 0
      )
    )
);
create index if not exists direct_messages_thread_idx
  on public.direct_messages (client_id, freelancer_id, created_at);
create index if not exists direct_messages_freelancer_idx
  on public.direct_messages (freelancer_id, created_at);

-- When each participant last opened a direct conversation; drives unread badges.
create table if not exists public.direct_reads (
  user_id       uuid not null references public.profiles (id) on delete cascade,
  client_id     uuid not null references public.profiles (id) on delete cascade,
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  read_at       timestamptz not null default now(),
  primary key (user_id, client_id, freelancer_id)
);


-- ---------------------------------------------------------------------
-- 2. Row-level security
-- ---------------------------------------------------------------------

create or replace function private.role_of(p_id uuid)
returns text
language sql stable security definer set search_path = ''
as $$
  select role from public.profiles where id = p_id
$$;

-- True once the client has written — until then the freelancer can't reply.
create or replace function private.direct_thread_started(p_client_id uuid, p_freelancer_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.direct_messages
    where client_id = p_client_id and freelancer_id = p_freelancer_id and sender_id = p_client_id
  )
$$;

alter table public.direct_messages enable row level security;
alter table public.direct_reads    enable row level security;

revoke all on public.direct_messages, public.direct_reads from anon;

drop policy if exists "direct_messages: participants can read" on public.direct_messages;
create policy "direct_messages: participants can read"
  on public.direct_messages for select to authenticated
  using (client_id = (select auth.uid()) or freelancer_id = (select auth.uid()));

drop policy if exists "direct_messages: clients start, freelancers reply" on public.direct_messages;
create policy "direct_messages: clients start, freelancers reply"
  on public.direct_messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and private.role_of(client_id) = 'client'
    and private.role_of(freelancer_id) = 'freelancer'
    and (
      sender_id = client_id
      or (sender_id = freelancer_id and private.direct_thread_started(client_id, freelancer_id))
    )
  );
-- No update/delete policies: a message stays as it was sent.

drop policy if exists "direct_reads: users manage their own" on public.direct_reads;
create policy "direct_reads: users manage their own"
  on public.direct_reads for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (client_id = (select auth.uid()) or freelancer_id = (select auth.uid()))
  );


-- ---------------------------------------------------------------------
-- 3. Chat files: also allow `direct/<client_id>/<freelancer_id>/…`
--    (replaces the version in 20260930000000_chat_attachments.sql; the
--    storage policies that call it don't change).
-- ---------------------------------------------------------------------

create or replace function private.is_chat_file_member(p_name text)
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  uuid_pattern constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  v_uid           uuid := (select auth.uid());
  v_job_id        text := split_part(p_name, '/', 1);
  v_freelancer_id text := split_part(p_name, '/', 2);
  v_client_id     text;
begin
  -- Direct conversation: the client may share files from the start,
  -- the freelancer once the client has written.
  if v_job_id = 'direct' then
    v_client_id     := split_part(p_name, '/', 2);
    v_freelancer_id := split_part(p_name, '/', 3);
    if v_client_id !~* uuid_pattern or v_freelancer_id !~* uuid_pattern then
      return false;
    end if;

    if v_uid = v_client_id::uuid then
      return private.role_of(v_client_id::uuid) = 'client'
         and private.role_of(v_freelancer_id::uuid) = 'freelancer';
    end if;
    if v_uid = v_freelancer_id::uuid then
      return private.direct_thread_started(v_client_id::uuid, v_freelancer_id::uuid);
    end if;
    return false;
  end if;

  -- Job conversation: `<job_id>/<freelancer_id>/…`.
  if v_job_id !~* uuid_pattern or v_freelancer_id !~* uuid_pattern then
    return false;
  end if;

  return exists (
    select 1
    from public.proposals p
    join public.jobs j on j.id = p.job_id
    where p.job_id = v_job_id::uuid
      and p.freelancer_id = v_freelancer_id::uuid
      and v_uid in (p.freelancer_id, j.client_id)
  );
end;
$$;
