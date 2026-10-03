import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientCard } from "@/components/client-card";
import { ProposalForm } from "@/components/forms/proposal-form";
import { Icon } from "@/components/icons";
import { JobDetailsCard } from "@/components/job-details";
import { ReviewCard } from "@/components/review-card";
import { PageHeader, Pill, StatusBadge, Widget, buttonStyles } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import * as db from "@/lib/db";
import { formatMoney, timeAgo } from "@/lib/format";
import type { ProposalStatus } from "@/lib/types";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Job details" };

const STATUS_HELP: Record<ProposalStatus, string> = {
  pending: "The client hasn't decided yet. You'll see the status change here.",
  accepted: "You got the job. Message the client to get started.",
  rejected: "The client went with another freelancer this time.",
};

export default async function FreelancerJobPage(props: PageProps<"/dashboard/freelancer/jobs/[id]">) {
  const { id } = await props.params;
  if (!isUuid(id)) notFound();

  const profile = await requireProfile("freelancer");
  const [job, proposal] = await Promise.all([db.getJob(id), db.getProposal(id, profile.id)]);
  // Freelancers can see open jobs, plus closed ones they applied to.
  if (!job || (job.status !== "open" && !proposal)) notFound();

  const hiredMe = job.hired_freelancer_id === profile.id;
  const finished = hiredMe && job.status === "completed";
  const [review, client] = await Promise.all([
    finished ? db.getJobReview(job.id) : null,
    db.getProfile(job.client_id),
  ]);

  return (
    <>
      <PageHeader
        back={{ href: "/dashboard/freelancer", label: "Find work" }}
        title={job.title}
        description={
          <span className="inline-flex items-center gap-2">
            <StatusBadge status={job.status} /> Posted {timeAgo(job.created_at)}
          </span>
        }
        meta={<Pill icon="coins">Budget {formatMoney(job.budget)}</Pill>}
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <JobDetailsCard job={job} clientName={job.client_name} />
          {client && (
            <div>
              <p className="mb-3 mt-6 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
                About the client
              </p>
              <ClientCard client={client} />
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-5">
          {finished && (
            <Widget
              eyebrow="Completed"
              title={review ? "The client left you a review" : "The client marked this job as complete"}
              action={<StatusBadge status="completed" />}
            >
              {review ? (
                <ReviewCard review={review} author={job.client_name} />
              ) : (
                <p className="text-sm leading-6 text-muted">
                  Nice work. If {job.client_name} leaves a review, it will appear here and on your profile.
                </p>
              )}
            </Widget>
          )}

          {proposal ? (
            <Widget
              eyebrow="Your proposal"
              title={finished ? "You delivered this job." : STATUS_HELP[proposal.status]}
              action={<StatusBadge status={proposal.status} />}
            >
              <div className="rounded-2xl bg-canvas-soft p-5 ring-1 ring-line">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Your bid</p>
                <p className="tabular mt-1 text-3xl font-semibold tracking-[-0.035em] text-fg">
                  {formatMoney(proposal.bid)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {proposal.bid <= job.budget
                    ? `${formatMoney(job.budget - proposal.bid)} under budget`
                    : `${formatMoney(proposal.bid - job.budget)} over budget`}
                </p>
              </div>

              <p className="mt-5 whitespace-pre-line text-sm leading-6 text-muted">{proposal.cover_note}</p>

              <Link
                href={`/dashboard/messages/${job.id}/${profile.id}`}
                className={buttonStyles("primary", "md", "mt-6 w-full")}
              >
                <Icon name="chat" className="size-4" />
                Message client
              </Link>
            </Widget>
          ) : (
            <Widget
              eyebrow="Pitch"
              title="Submit a proposal"
              action={<Pill icon="bolt">One per job</Pill>}
            >
              <p className="text-sm leading-6 text-muted">
                You can send one proposal per job, so make it count. Lead with the closest thing
                you&rsquo;ve built.
              </p>
              <div className="mt-6">
                <ProposalForm jobId={job.id} budget={job.budget} />
              </div>
            </Widget>
          )}
        </div>
      </div>
    </>
  );
}
