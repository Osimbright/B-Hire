import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { AVAILABILITY, avatarUrl } from "@/lib/avatars";
import { APP_NAME } from "@/lib/config";
import type { Availability, FormState, JobStatus, ProposalStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/icons";

/* Small presentational building blocks shared by every page. No hooks, so
   they work in both Server and Client Components. */

// ---------- Buttons ----------

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "onDark";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-fg text-canvas hover:bg-fg-soft",
  accent: "bg-zest text-ink hover:bg-zest-deep",
  secondary: "bg-surface text-fg ring-1 ring-inset ring-line hover:bg-canvas-soft hover:ring-line-strong",
  ghost: "text-muted hover:bg-canvas-soft hover:text-fg",
  onDark: "bg-white/10 text-bone ring-1 ring-inset ring-white/15 hover:bg-white/20",
};

/** Class names for a pill button; use on <button> or <Link>. */
export function buttonStyles(
  variant: ButtonVariant = "primary",
  size: "sm" | "md" | "lg" = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:pointer-events-none disabled:opacity-50",
    size === "lg" ? "px-7 py-3.5 text-[15px]" : size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
    buttonVariants[variant],
    className,
  );
}

/** Round icon-only button, as used in the top bar and on widget headers. */
export function iconButtonStyles(className?: string) {
  return cn(
    "grid size-10 shrink-0 place-items-center rounded-full bg-surface text-muted ring-1 ring-inset ring-line transition hover:text-fg hover:ring-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg",
    className,
  );
}

// ---------- Form controls ----------

const controlStyles =
  "block w-full rounded-2xl border-0 bg-surface px-4 py-2.5 text-sm text-fg shadow-none ring-1 ring-inset ring-line placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-inset focus:ring-fg";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlStyles, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlStyles, "leading-6", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(controlStyles, "pr-9", className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs leading-5 text-muted">{hint}</p>}
    </div>
  );
}

// ---------- Feedback ----------

const alertTones = {
  error: "bg-clay/10 text-clay-ink ring-clay/25",
  success: "bg-zest-soft text-zest-ink ring-zest-deep/40",
  info: "bg-surface text-fg ring-line",
};

export function Alert({
  tone = "info",
  className,
  children,
}: {
  tone?: keyof typeof alertTones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-2xl px-4 py-3 text-sm ring-1 ring-inset", alertTones[tone], className)}
    >
      {children}
    </div>
  );
}

/** Shows the error/success message returned by a server action. */
export function FormAlert({ state }: { state: FormState }) {
  if (state?.error) return <Alert tone="error">{state.error}</Alert>;
  if (state?.message) return <Alert tone="success">{state.message}</Alert>;
  return null;
}

const statusStyles: Record<JobStatus | ProposalStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-zest-soft text-zest-ink ring-zest-deep/40" },
  in_progress: { label: "In progress", className: "bg-amber/15 text-amber-ink ring-amber/40" },
  completed: { label: "Completed", className: "bg-tide/10 text-tide-ink ring-tide/30" },
  cancelled: { label: "Cancelled", className: "bg-canvas-deep text-muted ring-line-strong" },
  pending: { label: "Pending", className: "bg-iris/10 text-iris-ink ring-iris/25" },
  accepted: { label: "Accepted", className: "bg-zest-soft text-zest-ink ring-zest-deep/40" },
  rejected: { label: "Not selected", className: "bg-clay/10 text-clay-ink ring-clay/25" },
};

export function StatusBadge({ status }: { status: JobStatus | ProposalStatus }) {
  const { label, className } = statusStyles[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        className,
      )}
    >
      {label}
    </span>
  );
}

// ---------- Layout ----------

const widgetTones = {
  paper: "bg-surface ring-1 ring-line",
  bone: "bg-canvas-soft ring-1 ring-line",
  ink: "bg-ink text-bone ring-1 ring-ink-line",
};

/**
 * The dashboard's basic unit: a rounded panel with an optional title row.
 * `tone="ink"` is the dark panel used for the one high-contrast card per view.
 */
export function Widget({
  title,
  eyebrow,
  action,
  tone = "paper",
  flush,
  className,
  bodyClassName,
  children,
}: {
  title?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  tone?: keyof typeof widgetTones;
  /** Drop the body padding — for charts and lists that run to the edge. */
  flush?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  const dark = tone === "ink";
  return (
    <section className={cn("flex flex-col overflow-hidden rounded-3xl", widgetTones[tone], className)}>
      {(title || action) && (
        <header
          className={cn(
            "flex items-start justify-between gap-4 px-6 pt-5",
            !flush && "pb-1",
          )}
        >
          <div className="min-w-0">
            {eyebrow && (
              <p
                className={cn(
                  "mb-1 text-[11px] font-medium uppercase tracking-[0.08em]",
                  dark ? "text-ink-muted" : "text-faint",
                )}
              >
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className={cn("text-[15px] font-semibold tracking-tight", dark ? "text-bone" : "text-fg")}>
                {title}
              </h2>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn("flex-1", !flush && "p-6", Boolean(title) && !flush && "pt-4", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

/** Plain panel with padding — kept for forms and detail cards. */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-3xl bg-surface p-6 ring-1 ring-line", className)}>{children}</div>
  );
}

/** A non-interactive metadata pill, e.g. "Last 30 days". */
export function Pill({ icon, children }: { icon?: IconName; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 text-xs font-medium text-muted ring-1 ring-inset ring-line">
      {icon && <Icon name={icon} className="size-3.5 text-faint" />}
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  action,
  meta,
  back,
  size = "default",
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Pills shown next to the action, e.g. the period a dashboard covers. */
  meta?: ReactNode;
  back?: { href: string; label: string };
  size?: "default" | "display";
}) {
  return (
    <div className="mb-8">
      {back && (
        <Link
          href={back.href}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg"
        >
          <Icon name="arrowLeft" className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1
            className={cn(
              "font-semibold tracking-[-0.035em] text-fg",
              size === "display" ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl",
            )}
          >
            {title}
          </h1>
          {description && (
            <div className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</div>
          )}
        </div>
        {(meta || action) && (
          <div className="flex flex-wrap items-center gap-2">
            {meta}
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact number tile: label, big value, and an optional footnote. */
export function StatCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  icon?: IconName;
}) {
  return (
    <div className="rounded-3xl bg-surface p-5 ring-1 ring-line">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-faint">{label}</p>
        {icon && <Icon name={icon} className="size-4 text-line-strong" />}
      </div>
      <p className="tabular mt-3 text-3xl font-semibold tracking-[-0.03em] text-fg">{value}</p>
      {note && <p className="mt-1.5 text-xs text-muted">{note}</p>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-line-strong bg-surface/60 px-6 py-16 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-ink text-zest">
        <Icon name={icon} />
      </div>
      <h3 className="mt-5 text-base font-semibold tracking-tight text-fg">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ---------- Identity ----------

/** The B-Hire mark: a stem and two counters that read as a "B". */
export function BrandMark({ className = "size-9", inverted = false }: { className?: string; inverted?: boolean }) {
  const glyph = inverted ? "fill-ink" : "fill-zest";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-[0.7rem]",
        inverted ? "bg-bone" : "bg-ink",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[62%]" aria-hidden="true">
        <rect x="6" y="5.5" width="3" height="13" rx="1.5" className={glyph} />
        <circle cx="14.6" cy="9.4" r="3.1" className={glyph} />
        <circle cx="14.6" cy="15.1" r="3.1" className={glyph} />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", onDark = false }: { href?: string; onDark?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.02em]",
        onDark ? "text-bone" : "text-fg",
      )}
    >
      <BrandMark className="size-9" />
      {APP_NAME}
    </Link>
  );
}

const avatarColors = [
  "bg-ink text-zest",
  "bg-iris/15 text-iris-ink",
  "bg-clay/15 text-clay-ink",
  "bg-tide/15 text-tide-ink",
  "bg-plum/15 text-plum-ink",
  "bg-zest-soft text-zest-ink",
];
const avatarSizes = {
  xs: "size-7 text-[10px]",
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-14 text-base",
  xl: "size-24 text-3xl",
};

/** A person's picture or logo, falling back to their initials. `src` is a Storage path in the avatars bucket. */
export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof avatarSizes;
}) {
  const url = avatarUrl(src);
  if (url) {
    return (
      // Small public images from Supabase Storage; next/image's optimiser would need a remote pattern for no gain.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className={cn("shrink-0 rounded-full bg-canvas-soft object-cover", avatarSizes[size])}
      />
    );
  }

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?";
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold",
        avatarSizes[size],
        avatarColors[hash % avatarColors.length],
      )}
    >
      {initials}
    </span>
  );
}

const availabilityDots: Record<Availability, string> = {
  available: "bg-zest-deep",
  limited: "bg-amber",
  unavailable: "bg-line-strong",
};

/** "● Available for work" — whether a freelancer is taking on projects. */
export function AvailabilityBadge({ availability }: { availability: Availability }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas-soft px-2.5 py-0.5 font-medium text-fg ring-1 ring-inset ring-line-soft">
      <span className={cn("size-1.5 rounded-full", availabilityDots[availability])} />
      {AVAILABILITY[availability].label}
    </span>
  );
}

/** Five stars filled to the nearest whole star, e.g. for a 4.6 average. */
export function StarRating({ rating, className = "size-4" }: { rating: number; className?: string }) {
  const filled = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name="star"
          className={cn(className, star <= filled ? "fill-amber text-amber" : "text-line-strong")}
        />
      ))}
    </span>
  );
}

export function Chip({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        tone === "dark" ? "bg-white/10 text-bone" : "bg-canvas-deep/70 text-muted",
      )}
    >
      {children}
    </span>
  );
}

export function SkillList({ skills, max = 8, tone }: { skills: string[]; max?: number; tone?: "light" | "dark" }) {
  if (skills.length === 0) return null;
  const extra = skills.length - max;
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.slice(0, max).map((skill) => (
        <Chip key={skill} tone={tone}>
          {skill}
        </Chip>
      ))}
      {extra > 0 && <Chip tone={tone}>+{extra}</Chip>}
    </div>
  );
}
