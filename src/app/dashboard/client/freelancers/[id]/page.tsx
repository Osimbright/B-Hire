import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import {
  AvailabilityBadge,
  Avatar,
  EmptyState,
  PageHeader,
  SkillList,
  StarRating,
  StatusBadge,
  Widget,
  buttonStyles,
} from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { conversationHref } from "@/lib/conversations";
import * as db from "@/lib/db";
import { formatMoney, formatMonthYear, timeAgo } from "@/lib/format";
import { isUuid, safeUrl } from "@/lib/utils";

export async function generateMetadata(props: PageProps<"/dashboard/client/freelancers/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const freelancer = isUuid(id) ? await db.getFreelancerProfile(id) : null;
  return { title: freelancer?.profile.full_name || "Freelancer profile" };
}

export default async function FreelancerProfilePage(props: PageProps<"/dashboard/client/freelancers/[id]">) {
  const { id } = await props.params;
  if (!isUuid(id)) notFound();

  const client = await requireProfile("client");
  const [freelancer, threads] = await Promise.all([db.getFreelancerProfile(id), db.listThreads(client.id)]);
  if (!freelancer) notFound();
  // Conversations about your jobs with this freelancer, most recent activity first.
  const jobChats = threads.filter((thread) => thread.kind === "job" && thread.freelancer_id === id);
  const directHref = conversationHref({ kind: "direct", clientId: client.id, freelancerId: id });

  const { profile, stats, work, reviews } = freelancer;
  const name = profile.full_name || "Unnamed freelancer";
  const firstName = name.split(/\s+/)[0];
  const links = profile.portfolio_links.map(safeUrl).filter((url): url is URL => url !== null);
  const headline = profile.headline || profile.skills.slice(0, 3).join(" · ") || "Freelancer";

  const facts: { label: string; value: string; icon: IconName }[] = [
    { label: "Jobs completed", value: String(stats.completed_jobs), icon: "check" },
    { label: "In progress", value: String(stats.in_progress), icon: "clock" },
    { label: "Total earned", value: formatMoney(stats.total_earned), icon: "coins" },
    {
      label: "Rating",
      value: stats.rating != null ? `${stats.rating.toFixed(1)} / 5` : "—",
      icon: "star",
    },
  ];

  return (
    <>
      <PageHeader
        back={{ href: "/dashboard/client/freelancers", label: "Freelancers" }}
        title="Freelancer profile"
        description="Their experience, past projects and what other clients say — everything you need before you hire."
      />

      <div className="grid items-start gap-4 lg:grid-cols-12">
        {/* Identity + contact */}
        <aside className="space-y-4 lg:sticky lg:top-28 lg:col-span-4">
          <section className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
            <div className="h-20 bg-ink bg-[radial-gradient(var(--color-ink-line)_1px,transparent_1px)] bg-size-[14px_14px]" />
            <div className="-mt-12 px-6 pb-6">
              <div className="w-fit rounded-full ring-4 ring-surface">
                <Avatar name={name} src={profile.avatar_path} size="xl" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-fg">{name}</h2>
              <p className="mt-1 text-sm text-muted">{headline}</p>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted">
                <AvailabilityBadge availability={profile.availability} />
                {profile.location && (
                  <span className="inline-flex items-center gap-1">
                    <Icon name="pin" className="size-3.5 text-faint" />
                    {profile.location}
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                {stats.rating != null ? (
                  <span className="inline-flex items-center gap-1.5">
                    <StarRating rating={stats.rating} />
                    <span className="tabular font-semibold text-fg">{stats.rating.toFixed(1)}</span>
                    <span className="text-muted">
                      ({stats.review_count} {stats.review_count === 1 ? "review" : "reviews"})
                    </span>
                  </span>
                ) : (
                  <span className="text-muted">No reviews yet</span>
                )}
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line text-sm">
                <div className="bg-canvas-soft p-3.5">
                  <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Rate</dt>
                  <dd className="tabular mt-1 font-semibold text-fg">
                    {profile.hourly_rate != null ? `${formatMoney(profile.hourly_rate)}/hr` : "Not set"}
                  </dd>
                </div>
                <div className="bg-canvas-soft p-3.5">
                  <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Member since</dt>
                  <dd className="mt-1 font-semibold text-fg">{formatMonthYear(profile.created_at)}</dd>
                </div>
              </dl>

              {/* A direct chat works any time; chats about your jobs open once they send a proposal. */}
              <div className="mt-5 space-y-2">
                <Link href={directHref} className={buttonStyles("accent", "lg", "w-full")}>
                  <Icon name="chat" className="size-4" />
                  Message {firstName}
                </Link>
                {jobChats.length > 0 ? (
                  <ul className="space-y-1 pt-1">
                    {jobChats.map((chat) => (
                      <li key={chat.href}>
                        <Link
                          href={chat.href}
                          className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs text-muted transition hover:bg-canvas-soft hover:text-fg"
                        >
                          <Icon name="chat" className="size-3.5 shrink-0 text-faint" />
                          <span className="truncate">About “{chat.job_title}”</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Link href="/dashboard/client/jobs/new" className={buttonStyles("secondary", "lg", "w-full")}>
                    <Icon name="plus" className="size-4" />
                    Post a job
                  </Link>
                )}
              </div>
            </div>
          </section>

          {links.length > 0 && (
            <Widget eyebrow="Elsewhere" title="Portfolio & links">
              <ul className="space-y-2">
                {links.map((url, index) => (
                  <li key={index}>
                    <a
                      href={url.href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="flex items-center gap-3 rounded-2xl bg-canvas-soft px-4 py-3 text-sm text-fg ring-1 ring-line-soft transition hover:ring-line-strong"
                    >
                      <Icon name="link" className="size-4 shrink-0 text-faint" />
                      <span className="min-w-0 flex-1 truncate">
                        {url.hostname.replace(/^www\./, "")}
                        {url.pathname !== "/" ? url.pathname : ""}
                      </span>
                      <Icon name="arrowUpRight" className="size-3.5 shrink-0 text-faint" />
                    </a>
                  </li>
                ))}
              </ul>
            </Widget>
          )}
        </aside>

        <div className="space-y-4 lg:col-span-8">
          {/* At a glance */}
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="rounded-3xl bg-surface p-5 ring-1 ring-line">
                <dt className="flex items-center justify-between gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
                  {fact.label}
                  <Icon name={fact.icon} className="size-4 text-line-strong" />
                </dt>
                <dd className="tabular mt-2 text-2xl font-semibold tracking-[-0.03em] text-fg">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <Widget eyebrow="Profile" title={`About ${firstName}`}>
            <p className="whitespace-pre-line text-[15px] leading-7 text-muted">
              {profile.bio || `${firstName} hasn't written a bio yet.`}
            </p>
            {profile.skills.length > 0 && (
              <div className="mt-6 border-t border-line-soft pt-5">
                <h3 className="mb-3 text-sm font-semibold text-fg">Skills</h3>
                <SkillList skills={profile.skills} max={30} />
              </div>
            )}
            {profile.languages.length > 0 && (
              <div className="mt-6 border-t border-line-soft pt-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">
                  <Icon name="language" className="size-4 text-faint" />
                  Languages
                </h3>
                <p className="text-sm text-muted">{profile.languages.join(" · ")}</p>
              </div>
            )}
          </Widget>

          <Widget
            eyebrow="Work history"
            title="Projects on B-Hire"
            action={
              work.length > 0 ? (
                <span className="text-xs text-muted">
                  {work.length} {work.length === 1 ? "project" : "projects"}
                </span>
              ) : undefined
            }
          >
            {work.length === 0 ? (
              <p className="text-sm text-muted">{firstName} hasn&rsquo;t completed a project on B-Hire yet.</p>
            ) : (
              <ol className="divide-y divide-line-soft">
                {work.map(({ job, amount, review }) => (
                  <li key={job.id} className="py-5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-fg">{job.title}</p>
                        <p className="mt-1 text-xs text-muted">
                          {job.category} · for {job.client_name} · started {timeAgo(job.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="tabular text-sm font-semibold text-fg">{formatMoney(amount)}</span>
                        <StatusBadge status={job.status} />
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{job.description}</p>
                    {review && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                        <StarRating rating={review.rating} className="size-3.5" />
                        <span className="line-clamp-1 italic">“{review.body}”</span>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Widget>

          <section>
            <div className="mb-3 mt-8 flex items-end justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-fg">Testimonials</h2>
              {stats.rating != null && (
                <p className="text-sm text-muted">
                  Average <span className="tabular font-semibold text-fg">{stats.rating.toFixed(1)}</span> from{" "}
                  {stats.review_count} {stats.review_count === 1 ? "client" : "clients"}
                </p>
              )}
            </div>
            {reviews.length === 0 ? (
              <EmptyState
                icon="star"
                title="No testimonials yet"
                description={`Reviews appear here after ${firstName} completes a job and the client leaves feedback.`}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {reviews.map((review) => (
                  <figure key={review.id} className="flex flex-col rounded-3xl bg-surface p-6 ring-1 ring-line">
                    <div className="flex items-center justify-between gap-3">
                      <StarRating rating={review.rating} />
                      <Icon name="quote" className="size-6 text-line-strong" />
                    </div>
                    <blockquote className="mt-4 flex-1 text-[15px] leading-7 text-fg">
                      “{review.body}”
                    </blockquote>
                    <figcaption className="mt-5 flex items-center gap-3 border-t border-line-soft pt-4">
                      <Avatar name={review.client_name} src={review.client_avatar_path} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-fg">{review.client_name}</p>
                        <p className="truncate text-xs text-muted">
                          {review.job_title} · {timeAgo(review.created_at)}
                        </p>
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
