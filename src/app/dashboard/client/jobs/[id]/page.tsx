import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { acceptProposal, completeJob } from "@/actions/jobs";
import { MeterList } from "@/components/charts";
import { ReviewForm } from "@/components/forms/review-form";
import { Icon } from "@/components/icons";
import { JobDetailsCard } from "@/components/job-details";
import { ReviewCard } from "@/components/review-card";
import { SubmitButton } from "@/components/submit-button";
import {
  Alert,
  Avatar,
  EmptyState,
  PageHeader,
  Pill,
  SkillList,
  StatusBadge,
  Widget,
  buttonStyles,
} from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import * as db from "@/lib/db";
import { formatMoney, timeAgo } from "@/lib/format";
import { cn, isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Job proposals" };

export default async function ClientJobPage(props: PageProps<"/dashboard/client/jobs/[id]">) {
  const [{ id }, { posted, completed, reviewed, error }] = await Promise.all([props.params, props.searchParams]);
  if (!isUuid(id)) notFound();

  const profile = await requireProfile("client");
  const job = await db.getJob(id);
  if (!job || job.client_id !== profile.id) notFound();

  const [proposals, review] = await Promise.all([
    db.listJobProposals(job.id),
    job.status === "completed" ? db.getJobReview(job.id) : null,
  ]);
  const canAccept = job.status === "open";
  const hired = proposals.find((proposal) => proposal.freelancer_id === job.hired_freelancer_id);
  const hiredName = hired?.freelancer?.full_name || "your freelancer";

  const bids = proposals.map((proposal) => proposal.bid);
  const lowest = bids.length ? Math.min(...bids) : 0;
  const highest = bids.length ? Math.max(...bids) : 0;
  const average = bids.length ? Math.round(bids.reduce((sum, bid) => sum + bid, 0) / bids.length) : 0;

  return (
    <>
      <PageHeader
        back={{ href: "/dashboard/client", label: "Overview" }}
        title={job.title}
        description={
          <span className="inline-flex items-center gap-2">
            <StatusBadge status={job.status} /> Posted {timeAgo(job.created_at)}
          </span>
        }
        meta={
          <Pill icon="file">
            {proposals.length} {proposals.length === 1 ? "proposal" : "proposals"}
          </Pill>
        }
      />

      {posted && (
        <Alert tone="success" className="mb-6">
          Your job is live. Freelancers can now find it and send proposals.
        </Alert>
      )}
      {error === "accept" && (
        <Alert tone="error" className="mb-6">
          We couldn&rsquo;t accept that proposal. The job may no longer be open.
        </Alert>
      )}
      {completed && !review && (
        <Alert tone="success" className="mb-6">
          Job marked as complete. Leave {hiredName} a review below. It helps other clients hire.
        </Alert>
      )}
      {reviewed && (
        <Alert tone="success" className="mb-6">
          Thanks! Your review is now on {hiredName}&rsquo;s profile.
        </Alert>
      )}
      {error === "complete" && (
        <Alert tone="error" className="mb-6">
          We couldn&rsquo;t mark this job as complete. It may not be in progress any more.
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <JobDetailsCard job={job} />

          {bids.length > 0 && (
            <Widget eyebrow="Bids" title="How they compare">
              <p className="tabular text-4xl font-semibold tracking-[-0.04em] text-fg">
                {formatMoney(average)}
              </p>
              <p className="mt-1 text-sm text-muted">average bid against your {formatMoney(job.budget)} budget</p>
              <div className="mt-6">
                <MeterList
                  items={[
                    {
                      label: "Lowest",
                      value: formatMoney(lowest),
                      ratio: lowest / Math.max(highest, 1),
                      color: "var(--color-tide)",
                    },
                    {
                      label: "Average",
                      value: formatMoney(average),
                      ratio: average / Math.max(highest, 1),
                      color: "var(--color-fg)",
                    },
                    {
                      label: "Highest",
                      value: formatMoney(highest),
                      ratio: 1,
                      color: "var(--color-clay)",
                    },
                  ]}
                />
              </div>
            </Widget>
          )}
        </div>

        <section className="space-y-4 lg:col-span-8">
          {job.status === "in_progress" && (
            <Widget
              eyebrow="In progress"
              title={`Working with ${hiredName}`}
              action={<StatusBadge status="in_progress" />}
            >
              <p className="text-sm leading-6 text-muted">
                When the work is delivered and you&rsquo;re happy with it, mark the job as complete.
                You&rsquo;ll then be able to rate and review {hiredName}.
              </p>
              <form action={completeJob.bind(null, job.id)} className="mt-5">
                <SubmitButton
                  variant="accent"
                  pendingText="Completing…"
                  confirm={`Mark “${job.title}” as complete? This can’t be undone.`}
                >
                  <Icon name="check" className="size-4" />
                  Mark job as complete
                </SubmitButton>
              </form>
            </Widget>
          )}

          {job.status === "completed" && (
            <Widget
              eyebrow="Completed"
              title={review ? `Your review of ${hiredName}` : `How did ${hiredName} do?`}
              action={<StatusBadge status="completed" />}
            >
              {review ? (
                <ReviewCard review={review} author={profile.full_name || "You"} />
              ) : (
                <ReviewForm jobId={job.id} freelancerName={hiredName} />
              )}
            </Widget>
          )}

          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-fg">Proposals</h2>
            {canAccept && proposals.length > 0 && (
              <p className="text-sm text-muted">Accepting one declines the rest.</p>
            )}
          </div>

          {proposals.length === 0 ? (
            <EmptyState
              icon="file"
              title="No proposals yet"
              description="Freelancers browsing open jobs will see this one. Check back soon."
            />
          ) : (
            proposals.map((proposal) => {
              const name = proposal.freelancer?.full_name || "Freelancer";
              const rate = proposal.freelancer?.hourly_rate;
              const won = proposal.status === "accepted";
              return (
                <article
                  key={proposal.id}
                  className={cn(
                    "rounded-3xl bg-surface p-6 ring-1",
                    won ? "ring-zest-deep" : "ring-line",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <Link
                      href={`/dashboard/client/freelancers/${proposal.freelancer_id}`}
                      className="group flex items-center gap-3.5"
                    >
                      <Avatar name={name} src={proposal.freelancer?.avatar_path} />
                      <div className="min-w-0">
                        <p className="inline-flex items-center gap-1 font-medium text-fg underline-offset-4 group-hover:underline">
                          {name}
                          <Icon name="arrowUpRight" className="size-3.5 text-faint group-hover:text-fg" />
                        </p>
                        <p className="text-sm text-muted">
                          {rate != null && `${formatMoney(rate)}/hr · `}Sent {timeAgo(proposal.created_at)}
                        </p>
                      </div>
                    </Link>
                    <div className="flex flex-col items-end gap-1.5">
                      <p className="tabular text-2xl font-semibold tracking-[-0.03em] text-fg">
                        {formatMoney(proposal.bid)}
                      </p>
                      <StatusBadge status={proposal.status} />
                    </div>
                  </div>

                  <p className="mt-5 whitespace-pre-line text-sm leading-6 text-muted">{proposal.cover_note}</p>

                  {proposal.freelancer && proposal.freelancer.skills.length > 0 && (
                    <div className="mt-5">
                      <SkillList skills={proposal.freelancer.skills} />
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-2 border-t border-line-soft pt-5">
                    {canAccept && proposal.status === "pending" && (
                      <form action={acceptProposal.bind(null, proposal.id, job.id)}>
                        <SubmitButton
                          variant="accent"
                          pendingText="Accepting…"
                          confirm={`Accept ${name}'s proposal for ${formatMoney(proposal.bid)}? Other pending proposals will be declined.`}
                        >
                          <Icon name="check" className="size-4" />
                          Accept proposal
                        </SubmitButton>
                      </form>
                    )}
                    <Link
                      href={`/dashboard/messages/${job.id}/${proposal.freelancer_id}`}
                      className={buttonStyles("secondary")}
                    >
                      <Icon name="chat" className="size-4" />
                      Message
                    </Link>
                    <Link
                      href={`/dashboard/client/freelancers/${proposal.freelancer_id}`}
                      className={buttonStyles("ghost")}
                    >
                      <Icon name="user" className="size-4" />
                      View profile
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </>
  );
}
