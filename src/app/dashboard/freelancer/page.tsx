import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Gauge, MeterList } from "@/components/charts";
import { Icon } from "@/components/icons";
import {
  Chip,
  EmptyState,
  Input,
  PageHeader,
  Pill,
  Select,
  Widget,
  buttonStyles,
} from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { JOB_CATEGORIES, isJobCategory } from "@/lib/config";
import * as db from "@/lib/db";
import { formatDate, formatMoney, timeAgo } from "@/lib/format";
import { profileStrength } from "@/lib/insights";

export const metadata: Metadata = { title: "Find work" };

const SLICE_COLORS = ["var(--color-fg)", "var(--color-iris)", "var(--color-clay)", "var(--color-tide)"];

export default async function FindWorkPage(props: PageProps<"/dashboard/freelancer">) {
  const profile = await requireProfile("freelancer");
  const params = await props.searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const category = typeof params.category === "string" && isJobCategory(params.category) ? params.category : "";

  const [jobs, appliedJobIds, overview] = await Promise.all([
    db.listOpenJobs({ search: q, category }),
    db.listAppliedJobIds(profile.id),
    db.getFreelancerOverview(profile.id),
  ]);

  const strength = profileStrength(profile);
  const filtered = Boolean(q || category);

  return (
    <>
      <PageHeader
        size="display"
        title="Find work"
        description="Open jobs from clients, newest first."
        meta={
          <>
            <Pill icon="briefcase">{overview.openJobs} open jobs</Pill>
            <Pill icon="coins">{formatMoney(overview.pipelineValue)} in play</Pill>
          </>
        }
        action={
          <Link href="/dashboard/freelancer/proposals" className={buttonStyles("primary")}>
            <Icon name="file" className="size-4" />
            My proposals
          </Link>
        }
      />

      <div className="grid gap-4 xl:grid-cols-12">
        {/* Profile strength */}
        <Widget className="xl:col-span-4" eyebrow="Your profile" title="Profile strength">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <Gauge value={strength.percent} size={150} />
            <div className="min-w-0 flex-1">
              {strength.missing.length === 0 ? (
                <p className="text-sm leading-6 text-muted">
                  Complete. Clients see everything they need when they open a proposal from you.
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium text-fg">Still missing</p>
                  <ul className="mt-2 space-y-1.5">
                    {strength.missing.map((item) => (
                      <li key={item.label} className="flex items-center gap-2 text-sm text-muted">
                        <span className="size-1.5 shrink-0 rounded-full bg-clay" />
                        {item.label}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/dashboard/freelancer/profile"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-fg hover:text-zest-ink"
                  >
                    Finish profile
                    <Icon name="arrowRight" className="size-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </Widget>

        {/* Pipeline */}
        <Widget className="xl:col-span-4" eyebrow="Pipeline" title="Where your bids stand">
          <p className="tabular text-4xl font-semibold tracking-[-0.04em] text-fg">
            {formatMoney(overview.pipelineValue)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {overview.pending} pending {overview.pending === 1 ? "bid" : "bids"} awaiting a decision
          </p>
          <div className="mt-6">
            <MeterList
              items={[
                {
                  label: "Pending",
                  value: overview.pending,
                  ratio: overview.sent ? overview.pending / overview.sent : 0,
                  color: "var(--color-iris)",
                },
                {
                  label: "Accepted",
                  value: overview.accepted,
                  ratio: overview.sent ? overview.accepted / overview.sent : 0,
                  color: "var(--color-zest-deep)",
                },
                {
                  label: "Not selected",
                  value: overview.rejected,
                  ratio: overview.sent ? overview.rejected / overview.sent : 0,
                  color: "var(--color-clay)",
                },
              ]}
            />
          </div>
        </Widget>

        {/* Matches */}
        <Widget className="relative xl:col-span-4" tone="ink">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-zest/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-12 size-56 rounded-full bg-iris/30 blur-3xl"
          />
          <div className="relative flex h-full flex-col">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-bone ring-1 ring-inset ring-white/15">
              <Icon name="bolt" className="size-3.5 text-zest" />
              Matched to your skills
            </span>
            <p className="tabular mt-6 text-6xl font-semibold tracking-[-0.05em] text-zest">
              {overview.matchingJobs}
            </p>
            <p className="mt-3 text-lg font-medium leading-6 text-bone">
              {overview.matchingJobs === 0
                ? "open jobs mention your skills right now."
                : `open ${overview.matchingJobs === 1 ? "job mentions" : "jobs mention"} something you list.`}
            </p>
            <p className="mt-auto pt-4 text-sm leading-6 text-ink-muted">
              {profile.skills.length === 0
                ? "Add your skills and we'll flag the jobs that fit."
                : overview.matchingJobs === 0
                  ? `Nothing mentions ${profile.skills.slice(0, 2).join(" or ")} yet — the ${overview.openJobs} open jobs below are still worth a look, and new ones arrive daily.`
                  : `Matching against ${profile.skills.slice(0, 3).join(", ")}${profile.skills.length > 3 ? ` +${profile.skills.length - 3} more` : ""}.`}
            </p>
          </div>
        </Widget>
      </div>

      {/* Open jobs by category — a quick read of where the demand is */}
      {overview.openJobsByCategory.length > 1 && (
        <div className="mt-4">
          <Widget eyebrow="Right now" title="Where the open work is">
            <MeterList
              columns={2}
              items={overview.openJobsByCategory.map((slice, index) => ({
                label: slice.label,
                value: `${slice.value} ${slice.value === 1 ? "job" : "jobs"}`,
                ratio: slice.value / Math.max(overview.openJobs, 1),
                color: SLICE_COLORS[index % SLICE_COLORS.length],
              }))}
            />
          </Widget>
        </div>
      )}

      {/* Search + results */}
      <div className="mt-10">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-fg">
            {filtered ? `${jobs.length} matching ${jobs.length === 1 ? "job" : "jobs"}` : "All open jobs"}
          </h2>
          {/* Keyed on the filters so "Clear filters" also resets the (uncontrolled) inputs. */}
          <Form
            key={`${q}|${category}`}
            action="/dashboard/freelancer"
            className="flex flex-col gap-2 sm:flex-row"
            role="search"
          >
            <div className="relative">
              <Icon
                name="search"
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-faint"
              />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Search jobs"
                aria-label="Search jobs"
                className="pl-10! sm:w-56"
              />
            </div>
            <Select name="category" defaultValue={category} aria-label="Category" className="sm:w-48">
              <option value="">All categories</option>
              {JOB_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
            <button type="submit" className={buttonStyles("primary")}>
              Search
            </button>
          </Form>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            icon="search"
            title={filtered ? "No matching jobs" : "No open jobs right now"}
            description={
              filtered
                ? "Try a different keyword or category."
                : "New jobs will appear here as clients post them."
            }
            action={
              filtered && (
                <Link href="/dashboard/freelancer" className={buttonStyles("secondary")}>
                  Clear filters
                </Link>
              )
            }
          />
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {jobs.map((job) => {
              const applied = appliedJobIds.has(job.id);
              return (
                <li key={job.id}>
                  <Link
                    href={`/dashboard/freelancer/jobs/${job.id}`}
                    className="group flex h-full flex-col rounded-3xl bg-surface p-5 ring-1 ring-line transition hover:ring-fg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-medium leading-6 text-fg">{job.title}</h3>
                        <p className="mt-1 text-sm text-muted">
                          {job.client_name} · Posted {timeAgo(job.created_at)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="tabular text-lg font-semibold tracking-tight text-fg">
                          {formatMoney(job.budget)}
                        </p>
                        <p className="text-xs text-muted">Due {formatDate(job.deadline)}</p>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{job.description}</p>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-line-soft pt-4">
                      <Chip>{job.category}</Chip>
                      {applied ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-zest-soft px-3 py-1.5 text-xs font-medium text-zest-ink">
                          <Icon name="check" className="size-3.5" />
                          Applied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-sm font-medium text-fg transition group-hover:bg-zest group-hover:text-ink">
                          View &amp; apply
                          <Icon name="arrowRight" className="size-4" />
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
