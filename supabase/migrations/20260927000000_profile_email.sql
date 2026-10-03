-- =====================================================================
--  B-Hire — keep each user's email on their profile
--
--  Supabase Auth stores emails in auth.users, which the Table Editor and
--  the app's queries don't show next to the profile. This copies the email
--  onto public.profiles and keeps it current:
--    1. On signup   — handle_new_user() now writes it with the profile.
--    2. On login    — every sign-in (and every email change) re-syncs it.
--    3. Existing users are backfilled once, below.
--
--  Profiles are readable by every signed-in user, so the email column is
--  deliberately NOT granted to them: it's visible only in the Supabase
--  dashboard, to the service role, and to security definer functions.
--  A user can still read their own email from supabase.auth.getUser().
--
--  Run once: Supabase Dashboard → SQL Editor → paste → Run
--  (or `supabase db push`).
-- =====================================================================

alter table public.profiles add column if not exists email text;
create index if not exists profiles_email_idx on public.profiles (lower(email));


-- ---------------------------------------------------------------------
-- 1. Signup: create the profile with the email
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

  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'role',
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    lower(new.email)
  );
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 2. Login / email change: re-sync the email
--    Supabase updates auth.users.last_sign_in_at on every sign-in and
--    auth.users.email when a change is confirmed, so either fires this.
-- ---------------------------------------------------------------------

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.profiles
  set email = lower(new.email)
  where id = new.id
    and email is distinct from lower(new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, last_sign_in_at on auth.users
  for each row execute function public.sync_profile_email();

-- Trigger functions aren't meant to be called through the API.
revoke execute on function public.sync_profile_email() from public, anon, authenticated;


-- ---------------------------------------------------------------------
-- 3. Backfill everyone who signed up before this migration
-- ---------------------------------------------------------------------

update public.profiles p
set email = lower(u.email)
from auth.users u
where u.id = p.id
  and p.email is distinct from lower(u.email);


-- ---------------------------------------------------------------------
-- 4. Keep emails private from other users
--    Replace the table-wide SELECT with a column list that leaves out
--    `email`. Every query in the app already names its columns.
-- ---------------------------------------------------------------------

revoke select on public.profiles from authenticated;
grant select (id, role, full_name, bio, skills, hourly_rate, portfolio_links, created_at)
  on public.profiles to authenticated;
