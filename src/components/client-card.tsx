import { Icon } from "@/components/icons";
import { Avatar } from "@/components/ui";
import { formatMonthYear } from "@/lib/format";
import type { Profile } from "@/lib/types";
import { safeUrl } from "@/lib/utils";

/** How a client appears to freelancers (also used as the client's profile preview). */
export function ClientCard({ client }: { client: Profile }) {
  const name = client.full_name || "Client";
  const website = client.website ? safeUrl(client.website) : null;
  const subtitle = [client.headline, client.company].filter(Boolean).join(" · ") || "Client";

  return (
    <article className="rounded-3xl bg-surface p-6 ring-1 ring-line">
      <div className="flex items-center gap-3.5">
        <Avatar name={name} src={client.avatar_path} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold tracking-tight text-fg">{name}</p>
          <p className="truncate text-sm text-muted">{subtitle}</p>
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
        {client.location && (
          <li className="inline-flex items-center gap-1.5">
            <Icon name="pin" className="size-3.5 text-faint" />
            {client.location}
          </li>
        )}
        {website && (
          <li>
            <a
              href={website.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 transition hover:text-fg"
            >
              <Icon name="globe" className="size-3.5 text-faint" />
              {website.hostname.replace(/^www\./, "")}
            </a>
          </li>
        )}
        <li className="inline-flex items-center gap-1.5">
          <Icon name="calendar" className="size-3.5 text-faint" />
          On B-Hire since {formatMonthYear(client.created_at)}
        </li>
      </ul>

      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted">
        {client.bio || "This client hasn’t written about their business yet."}
      </p>
    </article>
  );
}
