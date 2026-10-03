-- =====================================================================
--  B-Hire — Supabase schema
--
--  Run this whole file once on a fresh project:
--  Supabase Dashboard → SQL Editor → New query → paste → Run.
--
--  It creates:
--    1. Tables: profiles, jobs, proposals, messages
--    2. A trigger that creates a profile (with the chosen role) on signup
--    3. Row-level security (RLS) so users only see/change what they should
--    4. accept_proposal(): accepts one proposal atomically
--    5. Realtime for messages
-- =====================================================================

-- Helper functions used inside RLS policies live in a schema that the
-- public API does not expose, so nobody can call them directly via RPC.
create schema if not exists private;
grant usage on schema private to authenticated;


-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

-- One row per auth user. `role` decides which dashboard they get.
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  role            text not null check (role in ('client', 'freelancer')),
  full_name       text not null default '',
  bio             text not null default '',
  skills          text[] not null default '{}',
  hourly_rate     numeric(10, 2) check (hourly_rate is null or hourly_rate >= 0),
  portfolio_links text[] not null default '{}',
  created_at      timestamptz not null default now()
);

create table public.jobs (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references public.profiles (id) on delete cascade,
  title               text not null check (char_length(title) between 3 and 120),
  description         text not null check (char_length(description) <= 10000),
  category            text not null,
  budget              numeric(12, 2) not null check (budget > 0),
  deadline            date not null,
  status              text not null default 'open'
                        check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  hired_freelancer_id uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now()
);
create index jobs_client_id_idx on public.jobs (client_id);
create index jobs_status_created_idx on public.jobs (status, created_at desc);

create table public.proposals (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references public.jobs (id) on delete cascade,
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  cover_note    text not null check (char_length(cover_note) <= 5000),
  bid           numeric(12, 2) not null check (bid > 0),
  status        text not null default 'pending'
                  check (status in ('pending', 'accepted', 'rejected')),
  created_at    timestamptz not null default now(),
  unique (job_id, freelancer_id) -- one proposal per freelancer per job
);
create index proposals_freelancer_id_idx on public.proposals (freelancer_id);

-- A conversation is identified by (job_id, freelancer_id): the job's client
-- talking to one freelancer who sent a proposal on that job.
create table public.messages (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references public.jobs (id) on delete cascade,
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  sender_id     uuid not null references public.profiles (id) on delete cascade,
  body          text not null check (char_length(body) between 1 and 4000),
  created_at    timestamptz not null default now()
);
create index messages_thread_idx on public.messages (job_id, freelancer_id, created_at);

-- When each participant last opened a conversation; drives unread badges.
create table public.conversation_reads (
  user_id       uuid not null references public.profiles (id) on delete cascade,
  job_id        uuid not null references public.jobs (id) on delete cascade,
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  read_at       timestamptz not null default now(),
  primary key (user_id, job_id, freelancer_id)
);

-- A client's testimonial for the freelancer they hired, one per job.
create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null unique references public.jobs (id) on delete cascade,
  client_id     uuid not null references public.profiles (id) on delete cascade,
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  rating        smallint not null check (rating between 1 and 5),
  body          text not null check (char_length(body) between 1 and 2000),
  created_at    timestamptz not null default now()
);
create index reviews_freelancer_id_idx on public.reviews (freelancer_id, created_at desc);


-- ---------------------------------------------------------------------
-- 2. Create a profile automatically on signup
--    The role and name come from the `data` passed to supabase.auth.signUp().
--    Doing this in a trigger means it works even when email confirmation
--    is on (the user has no session yet, so the app couldn't insert it).
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'role', '') not in ('client', 'freelancer') then
    raise exception 'A role of "client" or "freelancer" is required to sign up';
  end if;

  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'role',
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------
-- 3. Row-level security
-- ---------------------------------------------------------------------

-- Helpers are SECURITY DEFINER so policies on jobs and proposals can look
-- at each other without triggering infinite RLS recursion.
create or replace function private.my_role()
returns text
language sql stable security definer set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function private.is_job_client(p_job_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.jobs where id = p_job_id and client_id = (select auth.uid())
  )
$$;

create or replace function private.has_proposal(p_job_id uuid, p_freelancer_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.proposals where job_id = p_job_id and freelancer_id = p_freelancer_id
  )
$$;

alter table public.profiles  enable row level security;
alter table public.jobs      enable row level security;
alter table public.proposals enable row level security;
alter table public.messages  enable row level security;
alter table public.conversation_reads enable row level security;
alter table public.reviews   enable row level security;

-- Logged-out visitors get nothing.
revoke all on public.profiles, public.jobs, public.proposals, public.messages,
  public.conversation_reads, public.reviews from anon;

-- profiles --------------------------------------------------------------
create policy "profiles: signed-in users can read"
  on public.profiles for select to authenticated
  using (true);

create policy "profiles: users update their own row"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Profiles are only created by the signup trigger, and users may only edit
-- these columns — `id` and `role` can never be changed from the app.
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name, bio, skills, hourly_rate, portfolio_links)
  on public.profiles to authenticated;

-- jobs --------------------------------------------------------------------
create policy "jobs: read open jobs, your own, or ones you applied to"
  on public.jobs for select to authenticated
  using (
    status = 'open'
    or client_id = (select auth.uid())
    or private.has_proposal(id, (select auth.uid()))
  );

create policy "jobs: clients post jobs"
  on public.jobs for insert to authenticated
  with check (
    client_id = (select auth.uid())
    and private.my_role() = 'client'
    and status = 'open'
    and hired_freelancer_id is null
  );
-- No update/delete policies: status only changes through accept_proposal().

-- proposals ---------------------------------------------------------------
create policy "proposals: freelancers see their own, clients see ones on their jobs"
  on public.proposals for select to authenticated
  using (freelancer_id = (select auth.uid()) or private.is_job_client(job_id));

create policy "proposals: freelancers apply to open jobs"
  on public.proposals for insert to authenticated
  with check (
    freelancer_id = (select auth.uid())
    and private.my_role() = 'freelancer'
    and status = 'pending'
    and exists (
      select 1 from public.jobs j where j.id = proposals.job_id and j.status = 'open'
    )
  );

-- messages ----------------------------------------------------------------
create policy "messages: participants can read"
  on public.messages for select to authenticated
  using (freelancer_id = (select auth.uid()) or private.is_job_client(job_id));

create policy "messages: participants can send"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (freelancer_id = (select auth.uid()) or private.is_job_client(job_id))
    and private.has_proposal(job_id, freelancer_id)
  );

-- conversation_reads --------------------------------------------------------
create policy "conversation_reads: users manage their own"
  on public.conversation_reads for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (freelancer_id = (select auth.uid()) or private.is_job_client(job_id))
  );

-- reviews -----------------------------------------------------------------
-- Public to signed-in users, so clients can size up a freelancer before hiring.
create policy "reviews: signed-in users can read"
  on public.reviews for select to authenticated
  using (true);

create policy "reviews: clients review the freelancer they hired"
  on public.reviews for insert to authenticated
  with check (
    client_id = (select auth.uid())
    and exists (
      select 1 from public.jobs j
      where j.id = reviews.job_id
        and j.client_id = (select auth.uid())
        and j.hired_freelancer_id = reviews.freelancer_id
        and j.status in ('in_progress', 'completed')
    )
  );


-- ---------------------------------------------------------------------
-- 4. Accept a proposal (called from the app with supabase.rpc)
--    In one transaction: accept this proposal, decline the other pending
--    ones, and move the job to "in_progress".
-- ---------------------------------------------------------------------

create or replace function public.accept_proposal(p_proposal_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_job_id        uuid;
  v_freelancer_id uuid;
begin
  select p.job_id, p.freelancer_id
    into v_job_id, v_freelancer_id
  from public.proposals p
  join public.jobs j on j.id = p.job_id
  where p.id = p_proposal_id
    and j.client_id = auth.uid()   -- only the job's owner
    and j.status = 'open'
    and p.status = 'pending'
  for update of j, p;              -- two simultaneous accepts can't both win

  if v_job_id is null then
    raise exception 'Proposal not found, or the job is no longer open';
  end if;

  update public.proposals set status = 'accepted' where id = p_proposal_id;

  update public.proposals set status = 'rejected'
  where job_id = v_job_id and id <> p_proposal_id and status = 'pending';

  update public.jobs
  set status = 'in_progress', hired_freelancer_id = v_freelancer_id
  where id = v_job_id;
end;
$$;

revoke execute on function public.accept_proposal(uuid) from public, anon;
grant execute on function public.accept_proposal(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 5. Realtime: push new messages to the chat view (RLS still applies)
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
