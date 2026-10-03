import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { AvailabilityBadge, Avatar, SkillList, StarRating, buttonStyles } from "@/components/ui";
import type { FreelancerProfile } from "@/lib/db";
import { formatMoney, formatMonthYear } from "@/lib/format";
import type { Profile, Role } from "@/lib/types";
import { safeUrl } from "@/lib/utils";

/**
 * The contact panel beside a chat: who the other person is, plus whatever
 * the conversation adds in `children` (the job it's about, how to hire…).
 */
export function ContactInfo({
  name,
  role,
  other,
  freelancer,
  profileHref,
  children,
}: {
  name: string;
  /** The other person's role. */
  role: Role;
  other: Profile | null;
  /** Their track record, when the viewer is a client talking to a freelancer. */
  freelancer: FreelancerProfile | null;
  /** Link to their full profile, when the viewer can open it. */
  profileHref?: string;
  children?: ReactNode;
}) {
  const website = other?.website ? safeUrl(other.website) : null;

  return (
    <div className="divide-y divide-line-soft">
      <div className="px-6 py-7 text-center">
        <div className="flex justify-center">
          <Avatar name={name} src={other?.avatar_path} size="xl" />
        </div>
        <p className="mt-4 text-xl font-semibold tracking-[-0.02em] text-fg">{name}</p>
        {other?.headline && <p className="mt-1 text-sm text-fg">{other.headline}</p>}
        <p className="mt-1 text-sm text-muted">
          {role === "freelancer" ? "Freelancer" : other?.company || "Client"}
          {other?.hourly_rate != null && ` · ${formatMoney(other.hourly_rate)}/hr`}
        </p>
        {(other?.location || website) && (
          <p className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted">
            {other?.location && (
              <span className="inline-flex items-center gap-1">
                <Icon name="pin" className="size-3.5 text-faint" />
                {other.location}
              </span>
            )}
            {website && (
              <a
                href={website.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1 transition hover:text-fg"
              >
                <Icon name="globe" className="size-3.5 text-faint" />
                {website.hostname.replace(/^www\./, "")}
              </a>
            )}
          </p>
        )}
        {role === "freelancer" && other && (
          <p className="mt-3 text-xs">
            <AvailabilityBadge availability={other.availability} />
          </p>
        )}
        {freelancer?.stats.rating != null && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
            <StarRating rating={freelancer.stats.rating} className="size-3.5" />
            <span className="tabular font-medium text-fg">{freelancer.stats.rating.toFixed(1)}</span>
            <span>({freelancer.stats.review_count})</span>
          </p>
        )}
        {profileHref && (
          <Link href={profileHref} className={buttonStyles("primary", "md", "mt-5 w-full")}>
            <Icon name="user" className="size-4" />
            View full profile
          </Link>
        )}
      </div>

      <InfoSection title="About">
        <p className="whitespace-pre-line text-sm leading-6 text-muted">{other?.bio || "No bio yet."}</p>
        {other && (
          <p className="mt-3 text-xs text-faint">On B-Hire since {formatMonthYear(other.created_at)}</p>
        )}
      </InfoSection>

      {other && other.skills.length > 0 && (
        <InfoSection title="Skills">
          <SkillList skills={other.skills} max={12} />
        </InfoSection>
      )}

      {other && other.languages.length > 0 && (
        <InfoSection title="Languages">
          <p className="text-sm text-muted">{other.languages.join(" · ")}</p>
        </InfoSection>
      )}

      {freelancer && (
        <InfoSection title="Track record">
          <dl className="grid grid-cols-2 gap-2">
            <InfoStat label="Jobs done" value={String(freelancer.stats.completed_jobs)} />
            <InfoStat label="Earned" value={formatMoney(freelancer.stats.total_earned)} />
          </dl>
        </InfoSection>
      )}

      {children}
    </div>
  );
}

export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="px-6 py-5">
      <h3 className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">{title}</h3>
      {children}
    </section>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-canvas-soft px-3 py-2.5 ring-1 ring-line-soft">
      <dt className="text-[11px] text-faint">{label}</dt>
      <dd className="tabular mt-0.5 text-base font-semibold text-fg">{value}</dd>
    </div>
  );
}
