-- =====================================================================
--  B-Hire — richer profiles: a picture or logo, and more details
--
--    1. New profile columns:
--         everyone     avatar_path, headline, location
--         freelancers  availability, languages
--         clients      company, website
--    2. Column grants: signed-in users can read them, and edit their own.
--    3. A public `avatars` Storage bucket. Each user uploads only into
--       their own folder, `<user_id>/…`.
--    4. freelancer_cards() / freelancer_profile() return the new columns.
--
--  The size cap and type list mirror src/lib/avatars.ts — change both together.
--
--  Run once: Supabase Dashboard → SQL Editor → paste → Run
--  (or `supabase db push`).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------

alter table public.profiles
  add column if not exists avatar_path  text,
  add column if not exists headline     text not null default '',
  add column if not exists location     text not null default '',
  add column if not exists availability text not null default 'available',
  add column if not exists languages    text[] not null default '{}',
  add column if not exists company      text not null default '',
  add column if not exists website      text not null default '';

alter table public.profiles drop constraint if exists profiles_details_check;
alter table public.profiles add constraint profiles_details_check
  check (
    char_length(headline) <= 120
    and char_length(location) <= 80
    and char_length(company) <= 120
    and char_length(website) <= 300
    and availability in ('available', 'limited', 'unavailable')
    and cardinality(languages) <= 10
    -- A picture sits in the owner's own folder of the avatars bucket.
    and (avatar_path is null or avatar_path like id::text || '/%')
  );


-- ---------------------------------------------------------------------
-- 2. Who can read and change which columns
--    (email stays private — see 20260927000000_profile_email.sql)
-- ---------------------------------------------------------------------

grant select (id, role, full_name, bio, skills, hourly_rate, portfolio_links, created_at,
              avatar_path, headline, location, availability, languages, company, website)
  on public.profiles to authenticated;

grant update (full_name, bio, skills, hourly_rate, portfolio_links,
              avatar_path, headline, location, availability, languages, company, website)
  on public.profiles to authenticated;


-- ---------------------------------------------------------------------
-- 3. The avatars bucket
--    Public, so a picture is a plain URL anywhere in the app. Uploads are
--    resized in the browser first, so 5 MB is generous.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars: users upload to their own folder" on storage.objects;
create policy "avatars: users upload to their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Needed to look a file up (and delete it) through the API; the files
-- themselves are public anyway.
drop policy if exists "avatars: users see their own files" on storage.objects;
create policy "avatars: users see their own files"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars: users delete their own files" on storage.objects;
create policy "avatars: users delete their own files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);


-- ---------------------------------------------------------------------
-- 4. The freelancer directory, now with the new details
--    (same as 20260924000001_public_read.sql apart from the new columns,
--    the headline in search and the client's picture on reviews)
-- ---------------------------------------------------------------------

create or replace function public.freelancer_cards(p_search text default '')
returns jsonb
language sql stable security definer set search_path = ''
as $$
  with needle as (select nullif(btrim(coalesce(p_search, '')), '') as q)
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
  from (
    select f.id, f.role, f.full_name, f.bio, f.skills, f.hourly_rate,
           f.portfolio_links, f.created_at,
           f.avatar_path, f.headline, f.location, f.availability, f.languages, f.company, f.website,
           (select avg(r.rating)  from public.reviews r where r.freelancer_id = f.id) as rating,
           (select count(*)       from public.reviews r where r.freelancer_id = f.id) as review_count,
           (select count(*)       from public.jobs j
             where j.hired_freelancer_id = f.id and j.status = 'completed')           as completed_jobs
    from public.profiles f, needle
    where f.role = 'freelancer'
      and (
        needle.q is null
        or f.full_name ilike '%' || needle.q || '%'
        or f.headline  ilike '%' || needle.q || '%'
        or f.bio       ilike '%' || needle.q || '%'
        or exists (select 1 from unnest(f.skills) s where s ilike '%' || needle.q || '%')
      )
  ) x
$$;


create or replace function public.freelancer_profile(p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_profile jsonb;
  v_work    jsonb;
  v_reviews jsonb;
  v_rating  numeric;
  v_rcount  bigint;
  v_done    bigint;
  v_prog    bigint;
  v_earned  numeric;
begin
  select jsonb_build_object(
    'id', f.id, 'role', f.role, 'full_name', f.full_name, 'bio', f.bio,
    'skills', f.skills, 'hourly_rate', f.hourly_rate,
    'portfolio_links', f.portfolio_links, 'created_at', f.created_at,
    'avatar_path', f.avatar_path, 'headline', f.headline, 'location', f.location,
    'availability', f.availability, 'languages', f.languages,
    'company', f.company, 'website', f.website
  )
  into v_profile
  from public.profiles f
  where f.id = p_id and f.role = 'freelancer';

  if v_profile is null then
    return null;
  end if;

  -- Jobs they were hired for, newest first.
  select coalesce(jsonb_agg(x.item order by x.created_at desc), '[]'::jsonb)
    into v_work
  from (
    select j.created_at,
      jsonb_build_object(
        'job', to_jsonb(j) || jsonb_build_object(
                 'client_name', coalesce(nullif(c.full_name, ''), 'Client')),
        'amount', coalesce(p.bid, j.budget),
        'review', case when rv.id is null then null else to_jsonb(rv) end
      ) as item
    from public.jobs j
    left join public.profiles  c  on c.id = j.client_id
    left join public.proposals p  on p.job_id = j.id and p.freelancer_id = p_id
    left join public.reviews   rv on rv.job_id = j.id and rv.freelancer_id = p_id
    where j.hired_freelancer_id = p_id
  ) x;

  select coalesce(jsonb_agg(x.item order by x.created_at desc), '[]'::jsonb)
    into v_reviews
  from (
    select rv.created_at,
      to_jsonb(rv) || jsonb_build_object(
        'client_name',        coalesce(nullif(c.full_name, ''), 'Client'),
        'client_avatar_path', c.avatar_path,
        'job_title',          coalesce(j.title, 'A B-Hire job')
      ) as item
    from public.reviews rv
    left join public.profiles c on c.id = rv.client_id
    left join public.jobs     j on j.id = rv.job_id
    where rv.freelancer_id = p_id
  ) x;

  select avg(rating), count(*) into v_rating, v_rcount
  from public.reviews where freelancer_id = p_id;

  select count(*) filter (where status = 'completed'),
         count(*) filter (where status = 'in_progress')
    into v_done, v_prog
  from public.jobs where hired_freelancer_id = p_id;

  select coalesce(sum(coalesce(p.bid, j.budget)), 0)
    into v_earned
  from public.jobs j
  left join public.proposals p on p.job_id = j.id and p.freelancer_id = p_id
  where j.hired_freelancer_id = p_id and j.status = 'completed';

  return jsonb_build_object(
    'profile', v_profile,
    'stats', jsonb_build_object(
      'rating',         v_rating,
      'review_count',   v_rcount,
      'completed_jobs', v_done,
      'in_progress',    v_prog,
      'total_earned',   v_earned
    ),
    'work',    v_work,
    'reviews', v_reviews
  );
end;
$$;

-- `create or replace` keeps the existing grants: signed-in users only.
