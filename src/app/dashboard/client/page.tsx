import type { Metadata } from "next";
import Link from "next/link";
import { DotMatrix, FunnelBars, MeterList, StepLine } from "@/components/charts";
import { Icon } from "@/components/icons";
import {
  EmptyState,
  PageHeader,
  Pill,
  StatusBadge,
  Widget,
  buttonStyles,
} from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import * as db from "@/lib/db";
import { formatDate, formatMoney, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

const SLICE_COLORS = [
  "var(--color-fg)",
  "var(--color-iris)",
  "var(--color-clay)",
  "var(--color-tide)",
];

const percent = (ratio: number) => `${Math.round(ratio * 100)}%`;

export default async function ClientDashboardPage() {
  const profile = await requireProfile("client");
  const [jobs, overview] = await Promise.all([
    db.listClientJobs(profile.id),
    db.getClientOverview(profile.id),
  ]);
  const firstName = profile.full_name.split(" ")[0];

  const postJobButton = (
    <Link href="/dashboard/client/jobs/new" className={buttonStyles("accent")}>
      <Icon name="plus" className="size-4" />
      Post a job
    </Link>
  );

  const funnel = [
    { label: "Jobs posted", value: overview.jobsPosted, hint: "all time" },
    {
      label: "Jobs answered",
      value: Math.round(overview.responseRate * overview.jobsPosted),
      hint: `${percent(overview.responseRate)} of posted`,
    },
    { label: "Proposals in", value: overview.proposalsReceived, hint: `${overview.avgProposalsPerJob.toFixed(1)} per job` },
    { label: "In conversation", value: overview.conversations, hint: "chats opened" },
    { label: "Hired", value: overview.hires, hint: `${percent(overview.hireRate)} of posted` },
  ];

  const peak = overview.proposalsByWeekday.reduce(
    (best, day) => (day.value > best.value ? day : best),
    overview.proposalsByWeekday[0],
  );

  return (
    <>
      <PageHeader
        size="display"
        title="Overview"
        description={
          firstName
            ? `Welcome back, ${firstName}. Here's how your hiring is tracking.`
            : "Here's how your hiring is tracking."
        }
        meta={
          <>
            <Pill icon="calendar">All time</Pill>
            <Pill icon="briefcase">
              {overview.openJobs} open · {overview.inProgress} in progress
            </Pill>
          </>
        }
        action={postJobButton}
      />

      <div className="grid gap-4 xl:grid-cols-12">
        {/* Hiring funnel */}
        <Widget
          className="xl:col-span-7"
          eyebrow="Pipeline"
          title="From posted job to hire"
          flush
          bodyClassName="flex flex-col pt-4"
        >
          <FunnelBars steps={funnel} />
        </Widget>

        {/* Budget */}
        <Widget className="xl:col-span-5" eyebrow="Budget" title="Committed vs. posted">
          <p className="tabular text-5xl font-semibold tracking-[-0.045em] text-fg">
            {formatMoney(overview.totalBudget)}
          </p>
          <p className="mt-2 text-sm text-muted">
            {overview.committed > 0 ? (
              <>
                <span className="font-medium text-fg">{formatMoney(overview.committed)}</span> committed to
                freelancers you&rsquo;ve hired
              </>
            ) : (
              "Nothing committed yet — accept a proposal to start a project."
            )}
          </p>

          <div className="mt-6 border-t border-line pt-5">
            {overview.budgetByCategory.length > 0 ? (
              <MeterList
                items={overview.budgetByCategory.map((slice, index) => ({
                  label: slice.label,
                  value: formatMoney(slice.value),
                  ratio: slice.value / Math.max(overview.totalBudget, 1),
                  color: SLICE_COLORS[index % SLICE_COLORS.length],
                }))}
              />
            ) : (
              <p className="text-sm text-muted">Post a job to see where your budget is going.</p>
            )}
          </div>
        </Widget>

        {/* Proposal rhythm */}
        <Widget className="xl:col-span-4" eyebrow="Rhythm" title="When proposals arrive">
          <DotMatrix columns={overview.proposalsByWeekday} peakLabel={peak?.value ? peak.label : undefined} />
        </Widget>

        {/* Volume over time */}
        <Widget className="xl:col-span-4" eyebrow="Last 8 weeks" title="Proposal volume">
          <p className="tabular text-4xl font-semibold tracking-[-0.04em] text-fg">
            {overview.proposalsReceived}
          </p>
          <p className="mt-1 text-sm text-muted">
            {overview.avgProposalsPerJob.toFixed(1)} proposals per job on average
          </p>
          <div className="mt-5">
            <StepLine values={overview.proposalsByWeek} labels={["8w ago", "now"]} />
          </div>
        </Widget>

        {/* Insight */}
        <Widget className="relative xl:col-span-4" tone="ink">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-zest/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full bg-clay/25 blur-3xl"
          />
          <div className="relative flex h-full flex-col">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-bone ring-1 ring-inset ring-white/15">
              <Icon name="sparkle" className="size-3.5 text-zest" />
              Insight
            </span>
            <p className="tabular mt-6 text-6xl font-semibold tracking-[-0.05em] text-zest">
              {percent(overview.responseRate)}
            </p>
            <p className="mt-3 text-lg font-medium leading-6 text-bone">
              of your jobs attracted at least one proposal.
            </p>
            <p className="mt-auto pt-4 text-sm leading-6 text-ink-muted">
              {overview.jobsPosted === 0
                ? "Post your first job and freelancers will start pitching within hours."
                : overview.responseRate >= 0.8
                  ? "Strong pull. Clear scope and a realistic budget are doing the work — keep writing them this way."
                  : "Jobs with a specific deliverable and a named budget get noticeably more proposals."}
            </p>
          </div>
        </Widget>
      </div>

      {/* Jobs */}
      <div className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-fg">Your jobs</h2>
          <p className="text-sm text-muted">{jobs.length} total</p>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            icon="briefcase"
            title="No jobs yet"
            description="Post your first job and freelancers will start sending proposals."
            action={postJobButton}
          />
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/dashboard/client/jobs/${job.id}`}
                  className="group flex h-full flex-col rounded-3xl bg-surface p-5 ring-1 ring-line transition hover:ring-fg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium leading-6 text-fg">{job.title}</p>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="mt-1.5 text-sm text-muted">
                    {job.category} · Due {formatDate(job.deadline)} · Posted {timeAgo(job.created_at)}
                  </p>
                  <div className="mt-5 flex items-end justify-between gap-4 border-t border-line-soft pt-4">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Budget</p>
                      <p className="tabular mt-0.5 text-lg font-semibold tracking-tight text-fg">
                        {formatMoney(job.budget)}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-sm font-medium text-fg transition group-hover:bg-zest group-hover:text-ink">
                      {job.proposal_count} proposal{job.proposal_count === 1 ? "" : "s"}
                      <Icon name="arrowRight" className="size-4" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
