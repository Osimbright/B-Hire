import Image from "next/image";
import Link from "next/link";
import heroImage from "@/assets/landing/hero-team.jpg";
import { Icon } from "@/components/icons";
import { SiteHeader } from "@/components/landing/site-header";
import { StarRating } from "@/components/ui";
import { formatMoney } from "@/lib/format";

type LiveJob = {
  title: string;
  category: string;
  budget: number;
  client_name: string;
  proposal_count: number;
} | null;

/** Three nested stadiums — a quiet, architectural mark inside the headline. */
function Rings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 64" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className={className}>
      <rect x="1" y="1" width="178" height="62" rx="31" />
      <rect x="12" y="12" width="156" height="40" rx="20" />
      <rect x="23" y="23" width="134" height="18" rx="9" />
    </svg>
  );
}

/** A hatched stadium — the same texture the dashboards use for their funnels. */
function Hatch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 64" fill="none" aria-hidden="true" className={className}>
      <defs>
        <clipPath id="hero-hatch">
          <rect width="180" height="64" rx="32" />
        </clipPath>
      </defs>
      <g clipPath="url(#hero-hatch)" stroke="currentColor" strokeWidth="1.4">
        {Array.from({ length: 22 }, (_, i) => {
          const x = -64 + i * 11;
          return <line key={i} x1={x} y1={64} x2={x + 64} y2={0} />;
        })}
      </g>
    </svg>
  );
}

export function Hero({
  openJobs,
  liveBudget,
  job,
  rating,
  activeFreelancers,
}: {
  openJobs: number;
  liveBudget: number;
  job: LiveJob;
  rating: { average: number | null; count: number };
  activeFreelancers: number;
}) {
  return (
    <section id="top" className="px-2 pt-2 sm:px-3 sm:pt-3">
      <div className="grain relative isolate flex min-h-[max(720px,calc(100svh-1.5rem))] flex-col overflow-hidden rounded-[1.75rem] bg-ink sm:rounded-[2.5rem]">
        <Image
          src={heroImage}
          alt="A small team working together around laptops at a wooden table"
          fill
          placeholder="blur"
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="-z-20 object-cover object-[center_35%]"
        />
        {/* Legibility: a cool wash over the photo, deeper at the top and bottom */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(18,22,20,0.78)_0%,rgba(18,22,20,0.28)_38%,rgba(18,22,20,0.35)_62%,rgba(18,22,20,0.9)_100%)]" />
        {/* Extra shade behind the body copy, which sits on the busiest part of the photo */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(70%_55%_at_12%_78%,rgba(18,22,20,0.7),transparent_70%)]" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(90%_60%_at_85%_100%,rgba(203,242,76,0.14),transparent_60%)]" />

        <SiteHeader />

        <div className="relative z-10 flex flex-1 flex-col justify-between gap-12 px-5 pb-44 pt-32 sm:px-10 sm:pb-48 lg:px-16 lg:pt-40">
          <h1 className="text-[clamp(3.1rem,8.6vw,8.75rem)] font-light leading-[0.9] tracking-[-0.055em] text-bone">
            <span className="rise block">Great work</span>
            <span className="rise flex items-center gap-[0.2em] [--rise-delay:120ms] md:pl-[1.15em]">
              <Rings className="hidden h-[0.62em] w-auto shrink-0 text-bone/55 md:block" />
              meets the
            </span>
            <span className="rise flex items-center gap-[0.22em] [--rise-delay:240ms]">
              <span>
                <em className="font-serif font-normal tracking-[-0.02em] text-zest">right</em> people
              </span>
              <Hatch className="hidden h-[0.62em] w-auto shrink-0 text-bone/45 md:block" />
            </span>
          </h1>

          <div className="rise flex flex-col gap-10 [--rise-delay:380ms] lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-md">
              <p className="text-lg leading-8 text-bone/80">
                The freelance marketplace where clients post honest briefs, freelancers pitch with
                intent, and every hire starts with a real conversation.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup?role=client"
                  className="inline-flex items-center gap-2 rounded-full bg-zest py-2 pl-6 pr-2 text-[15px] font-medium text-ink transition hover:bg-zest-deep"
                >
                  Start hiring
                  <span className="grid size-9 place-items-center rounded-full bg-ink text-zest">
                    <Icon name="arrowUpRight" className="size-4" />
                  </span>
                </Link>
                <Link
                  href="/signup?role=freelancer"
                  className="inline-flex items-center rounded-full px-6 py-3.5 text-[15px] font-medium text-bone ring-1 ring-inset ring-white/30 backdrop-blur-md transition hover:bg-white/10"
                >
                  Find work
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-bone/65">
                {rating.average != null && (
                  <a href="#reviews" className="inline-flex items-center gap-2 transition hover:text-bone">
                    <StarRating rating={rating.average} className="size-4" />
                    <span>
                      <span className="tabular font-medium text-bone">{rating.average.toFixed(1)}</span> from{" "}
                      {rating.count} client reviews
                    </span>
                  </a>
                )}
                <span className="inline-flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-zest" />
                  <span className="tabular text-bone">{activeFreelancers}</span> active freelancers
                </span>
                <span>
                  <span className="tabular text-bone">{openJobs}</span> open jobs ·{" "}
                  <span className="tabular text-bone">{formatMoney(liveBudget)}</span>
                </span>
              </div>
            </div>

            {job && (
              <Link
                href="/signup?role=freelancer"
                className="group w-full max-w-sm rounded-[1.75rem] bg-white/10 p-5 ring-1 ring-inset ring-white/20 backdrop-blur-xl transition hover:bg-white/15"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-bone/80">
                    <span className="relative flex size-2">
                      <span className="absolute inset-0 animate-ping rounded-full bg-zest opacity-60 motion-reduce:animate-none" />
                      <span className="relative size-2 rounded-full bg-zest" />
                    </span>
                    Newest brief on B-Hire
                  </span>
                  <span className="grid size-8 place-items-center rounded-full bg-bone text-ink transition group-hover:bg-zest">
                    <Icon name="arrowUpRight" className="size-4" />
                  </span>
                </div>
                <p className="mt-5 text-xl font-light leading-7 tracking-[-0.02em] text-bone">{job.title}</p>
                <p className="mt-1 text-sm text-bone/60">
                  {job.category} · {job.client_name}
                </p>
                <div className="mt-6 flex items-end justify-between border-t border-white/15 pt-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.1em] text-bone/50">Budget</p>
                    <p className="tabular mt-0.5 text-2xl font-light tracking-[-0.03em] text-bone">
                      {formatMoney(job.budget)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-[0.1em] text-bone/50">Proposals</p>
                    <p className="tabular mt-0.5 text-2xl font-light tracking-[-0.03em] text-bone">
                      {job.proposal_count}
                    </p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
