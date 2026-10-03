import { formatDate, formatMoney, timeAgo } from "@/lib/format";
import type { Job } from "@/lib/types";
import { Icon, type IconName } from "@/components/icons";
import { Widget } from "@/components/ui";

/** Budget / deadline / category / description card used on both job pages. */
export function JobDetailsCard({ job, clientName }: { job: Job; clientName?: string }) {
  const details: { label: string; value: string; icon: IconName }[] = [
    { label: "Budget", value: formatMoney(job.budget), icon: "coins" },
    { label: "Deadline", value: formatDate(job.deadline), icon: "calendar" },
    { label: "Category", value: job.category, icon: "grid" },
    clientName
      ? { label: "Client", value: clientName, icon: "user" }
      : { label: "Posted", value: timeAgo(job.created_at), icon: "clock" },
  ];

  return (
    <Widget eyebrow="The brief" title="Job details">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line">
        {details.map((detail) => (
          <div key={detail.label} className="bg-surface p-4">
            <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
              <Icon name={detail.icon} className="size-3.5" />
              {detail.label}
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-fg">{detail.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 border-t border-line-soft pt-5">
        <h3 className="text-sm font-semibold text-fg">Description</h3>
        <p className="mt-2.5 whitespace-pre-line text-sm leading-6 text-muted">{job.description}</p>
      </div>
    </Widget>
  );
}
