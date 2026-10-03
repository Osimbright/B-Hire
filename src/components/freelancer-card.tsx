import Link from "next/link";
import type { FreelancerStats } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import type { Profile } from "@/lib/types";
import { cn, safeUrl } from "@/lib/utils";
import { Icon } from "@/components/icons";
import { AvailabilityBadge, Avatar, SkillList, StarRating } from "@/components/ui";

/**
 * How a freelancer appears to clients (also used as the profile preview).
 * With `href`, the whole card opens the full profile.
 */
export function FreelancerCard({
  freelancer,
  href,
}: {
  freelancer: Profile & Partial<FreelancerStats>;
  href?: string;
}) {
  const name = freelancer.full_name || "Unnamed freelancer";
  const links = freelancer.portfolio_links
    .map(safeUrl)
    .filter((url): url is URL => url !== null)
    .slice(0, 3);

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-3xl bg-surface p-6 ring-1 ring-line",
        href && "transition hover:-translate-y-0.5 hover:ring-line-strong hover:shadow-[0_18px_40px_-24px_rgba(25,26,22,0.35)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <Avatar name={name} src={freelancer.avatar_path} size="lg" />
          <div className="min-w-0">
            {href ? (
              // Stretched link: its ::after covers the card, so a click anywhere opens the profile.
              <Link
                href={href}
                className="block truncate font-semibold tracking-tight text-fg after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-fg"
              >
                {name}
              </Link>
            ) : (
              <p className="truncate font-semibold tracking-tight text-fg">{name}</p>
            )}
            <p className="line-clamp-2 text-sm text-muted">
              {freelancer.headline || freelancer.skills[0] || "Freelancer"}
            </p>
          </div>
        </div>
        {freelancer.hourly_rate != null && (
          <div className="shrink-0 rounded-full bg-canvas px-3 py-1.5 text-center">
            <span className="tabular text-sm font-semibold text-fg">
              {formatMoney(freelancer.hourly_rate)}
            </span>
            <span className="text-xs text-muted">/hr</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
        <AvailabilityBadge availability={freelancer.availability} />
        {freelancer.location && (
          <span className="inline-flex items-center gap-1">
            <Icon name="pin" className="size-3.5 text-faint" />
            {freelancer.location}
          </span>
        )}
      </div>

      {freelancer.review_count !== undefined && (
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          {freelancer.rating != null ? (
            <>
              <StarRating rating={freelancer.rating} className="size-3.5" />
              <span className="tabular font-medium text-fg">{freelancer.rating.toFixed(1)}</span>
              <span>
                ({freelancer.review_count} {freelancer.review_count === 1 ? "review" : "reviews"})
              </span>
            </>
          ) : (
            <span>No reviews yet</span>
          )}
          {!!freelancer.completed_jobs && (
            <>
              <span className="text-line-strong">·</span>
              <span>
                {freelancer.completed_jobs} {freelancer.completed_jobs === 1 ? "job" : "jobs"} completed
              </span>
            </>
          )}
        </p>
      )}

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">{freelancer.bio || "No bio yet."}</p>

      {freelancer.skills.length > 0 && (
        <div className="mt-5">
          <SkillList skills={freelancer.skills} max={6} />
        </div>
      )}

      {links.length > 0 && (
        <div className="mt-auto space-y-1.5 border-t border-line-soft pt-4 [&:not(:first-child)]:mt-5">
          {links.map((url, index) => (
            <a
              key={index}
              href={url.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              // Sits above the stretched link so it stays clickable on its own.
              className="relative z-10 flex w-fit max-w-full items-center gap-2 text-sm text-muted transition hover:text-fg"
            >
              <Icon name="link" className="size-3.5 shrink-0 text-faint" />
              <span className="truncate underline-offset-4 hover:underline">
                {url.hostname.replace(/^www\./, "")}
                {url.pathname !== "/" ? url.pathname : ""}
              </span>
            </a>
          ))}
        </div>
      )}

      {href && (
        <p
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium text-fg",
            links.length > 0 ? "mt-4" : "mt-auto border-t border-line-soft pt-4",
          )}
        >
          View full profile
          <Icon name="arrowRight" className="size-4" />
        </p>
      )}
    </article>
  );
}
