-- =====================================================================
--  B-Hire — contact form + public marketing data
--
--  The base schema revokes everything from `anon`, which is right for
--  marketplace rows but leaves the public landing page with nothing to
--  show. These `security definer` functions are the one way out: they
--  return aggregates (and the review text meant to be read publicly),
--  never raw job, proposal or message rows.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Contact form
--    Anyone may submit; nobody may read it back through the API. Read
--    submissions in the dashboard's table editor.
-- ---------------------------------------------------------------------

-- Everything below is written to be safe to run more than once: the six
-- functions all use `create or replace`, and these two guard themselves.
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null check (char_length(email) between 3 and 320),
  topic      text not null check (char_length(topic) between 1 and 120),
  body       text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
grant insert on public.contact_messages to anon, authenticated;

drop policy if exists "contact_messages: anyone can submit" on public.contact_messages;
create policy "contact_messages: anyone can submit"
  on public.contact_messages for insert to anon, authenticated
  with check (true);
-- No select policy on purpose: submissions are write-only from the app.


-- ---------------------------------------------------------------------
-- 2. Public counters for the marketing page
-- ---------------------------------------------------------------------

create or replace function public.marketplace_stats()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  with j as (select id, status, budget from public.jobs),
       p as (select job_id, status from public.proposals),
       n as (select (select count(*) from j) as jobs, (select count(*) from p) as proposals)
  select jsonb_build_object(
    'openJobs',    (select count(*) from j where status = 'open'),
    'freelancers', (select count(*) from public.profiles where role = 'freelancer'),
    'clients',     (select count(*) from public.profiles where role = 'client'),
    'liveBudget',  (select coalesce(sum(budget), 0) from j where status = 'open'),
    'proposals',   n.proposals,
    'hires',       (select count(*) from p where status = 'accepted'),
    'avgProposalsPerJob',
      case when n.jobs = 0 then 0 else n.proposals::numeric / n.jobs end,
    'answeredShare',
      case when n.jobs = 0 then 0
           else (select count(*) from j where exists (select 1 from p where p.job_id = j.id))::numeric / n.jobs
      end
  )
  from n
$$;


-- ---------------------------------------------------------------------
-- 3. Trust numbers for the marketing page
-- ---------------------------------------------------------------------

create or replace function public.landing_metrics()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_since        timestamptz := now() - interval '30 days';
  v_review_count bigint;
  v_rating_avg   numeric;
  v_breakdown    jsonb;
  v_hours        numeric;
  v_completed    bigint;
  v_active       bigint;
  v_total_free   bigint;
  v_reply_hours  numeric;
  v_proposals    bigint;
  v_answered     bigint;
  v_first_reply  numeric;
  v_reviews      jsonb;
begin
  -- Ratings, and the share of reviews at 5, 4, 3, 2 and 1 stars.
  select count(*), avg(rating) into v_review_count, v_rating_avg from public.reviews;

  select coalesce(jsonb_agg(share order by stars desc), '[]'::jsonb)
    into v_breakdown
  from (
    select s.stars,
      case when v_review_count = 0 then 0
           else (select count(*) from public.reviews where round(rating) = s.stars)::numeric / v_review_count
      end as share
    from generate_series(1, 5) as s(stars)
  ) b;

  select count(*) into v_completed
  from public.jobs
  where status = 'completed' and hired_freelancer_id is not null;

  -- Estimated hours of finished work: accepted bid ÷ the freelancer's rate.
  select coalesce(sum(coalesce(p.bid, j.budget) / f.hourly_rate), 0)
    into v_hours
  from public.jobs j
  join public.profiles f on f.id = j.hired_freelancer_id
  left join public.proposals p on p.job_id = j.id and p.freelancer_id = j.hired_freelancer_id
  where j.status = 'completed' and f.hourly_rate is not null and f.hourly_rate > 0;

  select count(*) into v_total_free from public.profiles where role = 'freelancer';

  select count(*) into v_active
  from public.profiles f
  where f.role = 'freelancer'
    and (
      exists (select 1 from public.proposals p where p.freelancer_id = f.id and p.created_at >= v_since)
      or exists (select 1 from public.messages m where m.sender_id = f.id and m.created_at >= v_since)
      or exists (select 1 from public.jobs j where j.hired_freelancer_id = f.id and j.status = 'in_progress')
    );

  -- Median hours to answer the other person in a conversation.
  select percentile_cont(0.5) within group (order by gap)
    into v_reply_hours
  from (
    select extract(epoch from (created_at - lag(created_at) over w)) / 3600 as gap,
           sender_id,
           lag(sender_id) over w as prev_sender
    from public.messages
    window w as (partition by job_id, freelancer_id order by created_at)
  ) t
  where prev_sender is not null and prev_sender <> sender_id and gap is not null;

  -- How often, and how fast, clients answer a proposal.
  select count(*) into v_proposals from public.proposals;

  select
    count(*) filter (where first_msg is not null or status <> 'pending'),
    percentile_cont(0.5) within group (
      order by extract(epoch from (first_msg - created_at)) / 3600
    )
  into v_answered, v_first_reply
  from (
    select p.status, p.created_at,
      (select min(m.created_at)
         from public.messages m
        where m.job_id = p.job_id
          and m.freelancer_id = p.freelancer_id
          and m.sender_id = j.client_id
          and m.created_at >= p.created_at) as first_msg
    from public.proposals p
    join public.jobs j on j.id = p.job_id
  ) t;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
    into v_reviews
  from (
    select rv.id, rv.job_id, rv.client_id, rv.freelancer_id, rv.rating, rv.body, rv.created_at,
      coalesce(nullif(c.full_name, ''), 'Client')        as client_name,
      coalesce(c.bio, '')                                as client_bio,
      coalesce(nullif(f.full_name, ''), 'a freelancer')  as freelancer_name,
      coalesce(j.title, 'A B-Hire job')                  as job_title
    from public.reviews rv
    left join public.profiles c on c.id = rv.client_id
    left join public.profiles f on f.id = rv.freelancer_id
    left join public.jobs    j on j.id = rv.job_id
  ) x;

  return jsonb_build_object(
    'rating', jsonb_build_object(
      'average', v_rating_avg,
      'count',   v_review_count,
      'breakdown', v_breakdown
    ),
    'hoursDelivered',        round(v_hours),
    'completedJobs',         v_completed,
    'activeFreelancers',     v_active,
    'totalFreelancers',      v_total_free,
    'replyHours',            v_reply_hours,
    'clientResponseRate',    case when v_proposals = 0 then 0 else v_answered::numeric / v_proposals end,
    'clientFirstReplyHours', v_first_reply,
    'reviews',               v_reviews
  );
end;
$$;


-- ---------------------------------------------------------------------
-- 4. The newest open job, for the "live on B-Hire" card
--    A job that is already open to every signed-in user; this shows the
--    single newest one to visitors too.
-- ---------------------------------------------------------------------

create or replace function public.latest_open_job()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select to_jsonb(j) || jsonb_build_object(
    'client_name',    coalesce(nullif(c.full_name, ''), 'Client'),
    'proposal_count', (select count(*) from public.proposals p where p.job_id = j.id)
  )
  from public.jobs j
  left join public.profiles c on c.id = j.client_id
  where j.status = 'open'
  order by j.created_at desc
  limit 1
$$;


-- ---------------------------------------------------------------------
-- 5. Open-job numbers per category, in the order asked for
-- ---------------------------------------------------------------------

create or replace function public.category_summaries(p_categories text[])
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'category',    c.category,
        'openJobs',    s.open_jobs,
        'avgBudget',   s.avg_budget,
        'latestTitle', s.latest_title
      )
      order by c.ord
    ),
    '[]'::jsonb
  )
  from unnest(p_categories) with ordinality as c(category, ord)
  cross join lateral (
    select
      count(*)                                as open_jobs,
      coalesce(round(avg(j.budget)), 0)       as avg_budget,
      (select j2.title
         from public.jobs j2
        where j2.status = 'open' and j2.category = c.category
        order by j2.created_at desc
        limit 1)                              as latest_title
    from public.jobs j
    where j.status = 'open' and j.category = c.category
  ) s
$$;


-- ---------------------------------------------------------------------
-- 6. The freelancer directory
--    A freelancer's track record spans jobs posted by many clients, and
--    the jobs policy deliberately hides other clients' jobs. These two
--    functions expose just the portfolio view — title, amount, rating,
--    review — so a client can size someone up before hiring.
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
           (select avg(r.rating)  from public.reviews r where r.freelancer_id = f.id) as rating,
           (select count(*)       from public.reviews r where r.freelancer_id = f.id) as review_count,
           (select count(*)       from public.jobs j
             where j.hired_freelancer_id = f.id and j.status = 'completed')           as completed_jobs
    from public.profiles f, needle
    where f.role = 'freelancer'
      and (
        needle.q is null
        or f.full_name ilike '%' || needle.q || '%'
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
    'portfolio_links', f.portfolio_links, 'created_at', f.created_at
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
        'client_name', coalesce(nullif(c.full_name, ''), 'Client'),
        'job_title',   coalesce(j.title, 'A B-Hire job')
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


-- ---------------------------------------------------------------------
-- 7. Grants — these six functions are the only way past the table
--    policies, and each returns a narrowed, read-only view.
-- ---------------------------------------------------------------------

-- Supabase ships `alter default privileges in schema public grant all on
-- functions to anon, authenticated`, so revoking from PUBLIC is not enough:
-- both roles hold an explicit grant that has to be revoked by name. Start
-- from nothing, then grant back exactly what each function needs.
revoke execute on function
  public.marketplace_stats(),
  public.landing_metrics(),
  public.latest_open_job(),
  public.category_summaries(text[]),
  public.freelancer_cards(text),
  public.freelancer_profile(uuid)
from public, anon, authenticated;

-- The marketing page is read by logged-out visitors.
grant execute on function
  public.marketplace_stats(),
  public.landing_metrics(),
  public.latest_open_job(),
  public.category_summaries(text[])
to anon, authenticated;

-- The directory is a signed-in feature.
grant execute on function
  public.freelancer_cards(text),
  public.freelancer_profile(uuid)
to authenticated;
