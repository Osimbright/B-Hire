import type { Metadata } from "next";
import Link from "next/link";
import { FunnelBars, Gauge, StepLine } from "@/components/charts";
import { Icon } from "@/components/icons";
import {
  Alert,
  EmptyState,
  PageHeader,
  Pill,
  StatCard,
  StatusBadge,
  Widget,
  buttonStyles,
} from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import * as db from "@/lib/db";
import { formatMoney, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "My proposals" };

export default async function MyProposalsPage(props: PageProps<"/dashboard/freelancer/proposals">) {
  const profile = await requireProfile("freelancer");
  const { sent } = await props.searchParams;
  const [proposals, overview] = await Promise.all([
    db.listFreelancerProposals(profile.id),
    db.getFreelancerOverview(profile.id),
  ]);

  const funnel = [
    { label: "Sent", value: overview.sent, hint: "all time" },
    { label: "Awaiting", value: overview.pending, hint: formatMoney(overview.pipelineValue) },
    { label: "Decided", value: overview.decided, hint: "client has chosen" },
    { label: "Won", value: overview.accepted, hint: formatMoney(overview.wonValue) },
  ];

  return (
    <>
      <PageHeader
        size="display"
        title="My proposals"
        description="Every proposal you've sent and where it stands."
        meta={
          <>
            <Pill icon="clock">{overview.pending} awaiting a decision</Pill>
            <Pill icon="coins">Avg bid {formatMoney(Math.round(overview.avgBid))}</Pill>
          </>
        }
        action={
          <Link href="/dashboard/freelancer" className={buttonStyles("accent")}>
            <Icon name="search" className="size-4" />
            Find more work
          </Link>
        }
      />

      {sent && (
        <Alert tone="success" className="mb-6">
          Proposal sent. You&rsquo;ll see its status update here once the client decides.
        </Alert>
      )}

      <div className="grid gap-4 xl:grid-cols-12">
        <Widget className="xl:col-span-8" eyebrow="Pipeline" title="How your bids progress" flush bodyClassName="flex flex-col pt-4">
          <FunnelBars steps={funnel} />
        </Widget>

        <Widget className="xl:col-span-4" eyebrow="Win rate" title="Of the bids clients decided on">
          <div className="flex h-full flex-col items-center justify-center py-2">
            <Gauge
              value={overview.winRate * 100}
              size={170}
              caption={
                overview.decided === 0
                  ? "No decisions yet"
                  : `${overview.accepted} won of ${overview.decided} decided`
              }
            />
          </div>
        </Widget>

        <div className="grid gap-4 sm:grid-cols-3 xl:col-span-8 xl:grid-cols-3">
          <StatCard label="Pending" value={overview.pending} note={formatMoney(overview.pipelineValue)} icon="clock" />
          <StatCard label="Accepted" value={overview.accepted} note={formatMoney(overview.wonValue)} icon="check" />
          <StatCard label="Not selected" value={overview.rejected} note="Better luck next round" icon="x" />
        </div>

        <Widget className="xl:col-span-4" eyebrow="Last 8 weeks" title="Bidding activity">
          <StepLine values={overview.bidsByWeek} labels={["8w ago", "now"]} color="var(--color-iris)" height={72} />
        </Widget>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-xl font-semibold tracking-[-0.02em] text-fg">All proposals</h2>

        {proposals.length === 0 ? (
          <EmptyState
            icon="file"
            title="No proposals yet"
            description="Browse open jobs and send your first proposal."
            action={
              <Link href="/dashboard/freelancer" className={buttonStyles("accent")}>
                Find work
              </Link>
            }
          />
        ) : (
          <ul className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
            {proposals.map((proposal, index) => (
              <li
                key={proposal.id}
                className={index > 0 ? "border-t border-line-soft" : undefined}
              >
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/freelancer/jobs/${proposal.job_id}`}
                        className="truncate font-medium text-fg underline-offset-4 hover:underline"
                      >
                        {proposal.job?.title ?? "Job"}
                      </Link>
                      <StatusBadge status={proposal.status} />
                      {proposal.status === "accepted" && proposal.job?.status === "completed" && (
                        <StatusBadge status="completed" />
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-muted">
                      {proposal.job?.client_name ?? "Client"} · Sent {timeAgo(proposal.created_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-5">
                    <div className="text-right">
                      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Your bid</p>
                      <p className="tabular mt-0.5 font-semibold tracking-tight text-fg">
                        {formatMoney(proposal.bid)}
                      </p>
                      {proposal.job && (
                        <p className="text-xs text-muted">of {formatMoney(proposal.job.budget)}</p>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/messages/${proposal.job_id}/${profile.id}`}
                      className={buttonStyles("secondary")}
                    >
                      <Icon name="chat" className="size-4" />
                      <span className="hidden sm:inline">Message</span>
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
