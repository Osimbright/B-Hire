-- =====================================================================
--  B-Hire — finish a job and review the freelancer
--
--  Until now a job could only go open → in_progress (accept_proposal()),
--  so nothing ever reached "completed" and no review could be left.
--    1. complete_job(): the job's client marks their in-progress job done.
--    2. Reviews may only be left once the job is completed (one per job,
--       already enforced by reviews.job_id being unique).
--
--  Run once: Supabase Dashboard → SQL Editor → paste → Run
--  (or `supabase db push`).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Mark a job as completed (called from the app with supabase.rpc)
--    jobs has no update policy, so status only changes through functions
--    like this one, which check ownership and the current status.
-- ---------------------------------------------------------------------

create or replace function public.complete_job(p_job_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.jobs
  set status = 'completed'
  where id = p_job_id
    and client_id = auth.uid()     -- only the job's owner
    and status = 'in_progress'     -- only once someone has been hired
    and hired_freelancer_id is not null;

  if not found then
    raise exception 'Job not found, or it is not in progress';
  end if;
end;
$$;

revoke execute on function public.complete_job(uuid) from public, anon;
grant execute on function public.complete_job(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 2. Reviews: only for completed jobs, by the client, about who they hired
-- ---------------------------------------------------------------------

drop policy if exists "reviews: clients review the freelancer they hired" on public.reviews;
create policy "reviews: clients review the freelancer they hired"
  on public.reviews for insert to authenticated
  with check (
    client_id = (select auth.uid())
    and exists (
      select 1 from public.jobs j
      where j.id = reviews.job_id
        and j.client_id = (select auth.uid())
        and j.hired_freelancer_id = reviews.freelancer_id
        and j.status = 'completed'
    )
  );
