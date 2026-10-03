import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { StarRating } from "@/components/ui";
import type { LandingMetrics } from "@/lib/db";
import { formatDuration } from "@/lib/format";

function Metric({
  icon,
  label,
  value,
  unit,
  extra,
  note,
}: {
  icon: IconName;
  label: string;
  value: ReactNode;
  unit?: string;
  extra?: ReactNode;
  note: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-8 bg-surface p-6 sm:p-7">
      <p className="inline-flex items-center gap-2 text-[13px] text-muted">
        <span className="grid size-7 place-items-center rounded-full bg-canvas text-fg">
          <Icon name={icon} className="size-3.5" />
        </span>
        {label}
      </p>
      <div>
        <p className="flex flex-wrap items-baseline gap-x-2 text-fg">
          <span className="tabular text-[clamp(2.75rem,4.4vw,3.75rem)] font-light leading-none tracking-[-0.06em]">
            {value}
          </span>
          {unit && <span className="font-serif text-2xl italic text-muted">{unit}</span>}
        </p>
        {extra && <div className="mt-2.5">{extra}</div>}
        <p className="mt-3 text-[13px] leading-5 text-muted">{note}</p>
      </div>
    </div>
  );
}

/**
 * The five trust numbers — rating, hours delivered, active freelancers, reply
 * time and client response — computed live from the marketplace.
 */
export function TrustBand({ metrics }: { metrics: LandingMetrics }) {
  const reply = metrics.replyHours != null ? formatDuration(metrics.replyHours) : null;
  const firstReply = metrics.clientFirstReplyHours != null ? formatDuration(metrics.clientFirstReplyHours) : null;

  return (
    <div
      // Revealed as one band: the cells are separated by hairline gaps that
      // would break apart if each animated on its own.
      data-reveal
      className="grid gap-px overflow-hidden rounded-[2rem] bg-line ring-1 ring-line sm:grid-cols-2 sm:[&>*:last-child]:col-span-2 lg:grid-cols-5 lg:[&>*:last-child]:col-span-1"
      aria-label="B-Hire by the numbers"
    >
      <Metric
        icon="star"
        label="Client rating"
        value={metrics.rating.average != null ? metrics.rating.average.toFixed(1) : "—"}
        unit="/ 5"
        extra={metrics.rating.average != null && <StarRating rating={metrics.rating.average} />}
        note={`From ${metrics.rating.count} client ${metrics.rating.count === 1 ? "review" : "reviews"} on completed jobs`}
      />
      <Metric
        icon="clock"
        label="Client work delivered"
        value={metrics.hoursDelivered.toLocaleString("en-US")}
        unit="hrs"
        note={`Estimated across ${metrics.completedJobs} completed ${metrics.completedJobs === 1 ? "job" : "jobs"}`}
      />
      <Metric
        icon="users"
        label="Active freelancers"
        value={metrics.activeFreelancers}
        unit={`of ${metrics.totalFreelancers}`}
        note="Pitched, messaged or worked on a job in the last 30 days"
      />
      <Metric
        icon="chat"
        label="Message reply time"
        value={reply?.value ?? "—"}
        unit={reply?.unit}
        note="Typical (median) time to answer a new message"
      />
      <Metric
        icon="bolt"
        label="Client response"
        value={Math.round(metrics.clientResponseRate * 100)}
        unit="%"
        note={
          firstReply
            ? `of proposals get a reply — usually within ${firstReply.value} ${firstReply.unit}`
            : "of proposals get a reply from the client"
        }
      />
    </div>
  );
}
