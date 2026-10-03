import Image from "next/image";
import collabImage from "@/assets/landing/collab-screen.jpg";
import freelancerImage from "@/assets/landing/freelancer-laptop.jpg";
import planningImage from "@/assets/landing/planning.jpg";
import wireframesImage from "@/assets/landing/wireframes.jpg";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { TrustBand } from "@/components/landing/trust-band";
import { JOB_CATEGORIES } from "@/lib/config";
import type { LandingMetrics } from "@/lib/db";
import { formatDuration, formatMoney } from "@/lib/format";

type Stats = {
  openJobs: number;
  freelancers: number;
  clients: number;
  liveBudget: number;
  proposals: number;
  hires: number;
  avgProposalsPerJob: number;
  answeredShare: number;
};

function Serif({ children }: { children: ReactNode }) {
  return <em className="font-serif font-normal tracking-[-0.01em]">{children}</em>;
}

/**
 * "About the platform": a frosted panel that rises over the hero, then a live
 * numbers bento, then a ticker of categories.
 */
export function Platform({ stats, metrics }: { stats: Stats; metrics: LandingMetrics }) {
  const reply = metrics.replyHours != null ? formatDuration(metrics.replyHours) : null;
  const firstReply = metrics.clientFirstReplyHours != null ? formatDuration(metrics.clientFirstReplyHours) : null;

  return (
    <>
      {/* Overlap panel */}
      <section id="platform" className="relative z-20 -mt-32 scroll-mt-8 px-2 sm:-mt-36 sm:px-3">
        <div data-reveal className="mx-auto max-w-[1320px] rounded-[1.75rem] bg-canvas/80 p-2.5 shadow-[0_50px_120px_-50px_rgba(25,26,22,0.55)] ring-1 ring-inset ring-white/70 backdrop-blur-2xl sm:rounded-[2.5rem] sm:p-3">
          <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-12">
            <div className="flex flex-col justify-between gap-10 px-4 py-7 sm:px-8 sm:py-10 lg:col-span-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">About B-Hire</p>
              <div>
                <h2 className="text-[clamp(2.7rem,5.4vw,5rem)] font-light leading-[0.94] tracking-[-0.05em] text-fg">
                  Hiring that
                  <br />
                  feels <Serif>human</Serif> again
                </h2>
                <p className="mt-7 max-w-md text-[15px] leading-7 text-muted">
                  No bidding wars, no endless inboxes. Clients describe the work and a budget,
                  freelancers answer with a considered proposal, and both sides talk one-on-one
                  until the fit is right.
                </p>
              </div>
            </div>

            {/* Card: many pitches */}
            <article className="flex min-h-[320px] flex-col justify-between rounded-[1.5rem] bg-surface p-6 lg:col-span-3">
              <h3 className="text-[1.65rem] font-light leading-[1.05] tracking-[-0.035em] text-fg">
                One brief,
                <br />
                many pitches
              </h3>
              <ul className="my-6 space-y-2" aria-hidden="true">
                {[
                  { initials: "LF", bid: "$1,400", width: "78%", tone: "bg-fg" },
                  { initials: "SR", bid: "$1,650", width: "92%", tone: "bg-line-strong" },
                  { initials: "TG", bid: "$1,200", width: "66%", tone: "bg-line-strong" },
                ].map((row) => (
                  <li key={row.initials} className="flex items-center gap-2.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-canvas text-[10px] font-semibold text-muted">
                      {row.initials}
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
                      <span className={`block h-full rounded-full ${row.tone}`} style={{ width: row.width }} />
                    </span>
                    <span className="tabular w-12 text-right text-xs text-fg">{row.bid}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm leading-6 text-muted">
                Bids, cover notes and profiles side by side, so the best fit is obvious.
              </p>
            </article>

            {/* Card: conversations */}
            <article className="flex min-h-[320px] flex-col justify-between rounded-[1.5rem] bg-surface p-6 lg:col-span-3">
              <h3 className="text-[1.65rem] font-light leading-[1.05] tracking-[-0.035em] text-fg">
                Talk before
                <br />
                you commit
              </h3>
              <div className="my-6 space-y-2 text-[13px]" aria-hidden="true">
                <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-canvas px-3.5 py-2 text-fg">
                  Could you share a similar project?
                </p>
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2 text-bone">
                  Sending a case study now ✦
                </p>
              </div>
              <p className="text-sm leading-6 text-muted">
                A private thread for every job and applicant. Details never get lost.
              </p>
            </article>

            {/* Wide photo */}
            <article className="relative isolate flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[1.5rem] p-6 sm:min-h-[400px] lg:col-span-8">
              <Image
                src={planningImage}
                alt="Hands arranging sticky notes and sketches while planning a project"
                fill
                placeholder="blur"
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="-z-20 object-cover"
              />
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,rgba(250,248,241,0.92)_0%,rgba(250,248,241,0.55)_32%,rgba(25,26,22,0.05)_55%,rgba(25,26,22,0.7)_100%)]" />
              <h3 className="text-[clamp(1.9rem,3vw,2.6rem)] font-light leading-[1.02] tracking-[-0.04em] text-fg">
                Post a job
                <br />
                in <Serif>minutes</Serif>
              </h3>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <p className="max-w-xs rounded-2xl bg-ink/55 px-4 py-3 text-sm leading-6 text-bone ring-1 ring-inset ring-white/15 backdrop-blur-md">
                  A title, a clear scope, a budget and a deadline. That&rsquo;s the whole form.
                </p>
                <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-medium text-bone ring-1 ring-inset ring-white/25 backdrop-blur-md">
                  {JOB_CATEGORIES.length} categories
                </span>
              </div>
            </article>

            {/* Narrow dark photo */}
            <article className="relative isolate flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[1.5rem] p-6 sm:min-h-[400px] lg:col-span-4">
              <Image
                src={wireframesImage}
                alt="A designer sketching app wireframes with a pen"
                fill
                placeholder="blur"
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="-z-20 object-cover grayscale"
              />
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(25,26,22,0.72)_0%,rgba(25,26,22,0.25)_45%,rgba(25,26,22,0.85)_100%)]" />
              <h3 className="text-[clamp(1.9rem,3vw,2.6rem)] font-light leading-[1.02] tracking-[-0.04em] text-bone">
                Proposals you
                <br />
                can <Serif>compare</Serif>
              </h3>
              <p className="max-w-[16rem] text-sm leading-6 text-bone/80">
                Accept one and every other pending proposal closes, politely and automatically.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Category ticker */}
      <div data-reveal className="fade-x overflow-hidden py-14 sm:py-20" aria-hidden="true">
        <div className="marquee-x flex w-max [--marquee-duration:55s]">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {JOB_CATEGORIES.filter((c) => c !== "Other").map((category) => (
                <span key={category} className="flex items-center">
                  <span className="whitespace-nowrap px-8 font-serif text-[clamp(2rem,4vw,3.4rem)] italic tracking-[-0.02em] text-fg/85">
                    {category}
                  </span>
                  <svg viewBox="0 0 24 24" className="size-5 shrink-0 fill-zest-deep">
                    <path d="M12 0c.6 6.6 5.4 11.4 12 12-6.6.6-11.4 5.4-12 12-.6-6.6-5.4-11.4-12-12C6.6 11.4 11.4 6.6 12 0z" />
                  </svg>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Live numbers bento */}
      <section className="px-4 pb-28 sm:px-6 lg:pb-36">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-12 grid gap-6 lg:grid-cols-12 lg:items-end">
            <h2
              data-reveal
              className="text-[clamp(2.6rem,5vw,4.6rem)] font-light leading-[0.95] tracking-[-0.05em] text-fg lg:col-span-7"
            >
              The marketplace,
              <br />
              in <Serif>real numbers</Serif>
            </h2>
            <p data-reveal className="max-w-md text-[15px] leading-7 text-muted lg:col-span-5 lg:justify-self-end">
              Pulled live from B-Hire as jobs are posted, proposals come in and clients leave
              reviews — not a marketing estimate.
            </p>
          </div>

          <TrustBand metrics={metrics} />

          <div className="mt-3 grid gap-3 lg:grid-cols-12">
            {/* Portrait with dial */}
            <article
              data-reveal
              className="grain relative isolate flex min-h-[460px] flex-col justify-end overflow-hidden rounded-[2rem] p-6 lg:col-span-4 lg:row-span-2"
            >
              <Image
                src={freelancerImage}
                alt="A freelancer in a mustard sweater working on a laptop"
                fill
                placeholder="blur"
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="-z-20 object-cover grayscale"
              />
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(25,26,22,0.1)_40%,rgba(25,26,22,0.88)_100%)]" />
              <svg viewBox="0 0 200 200" aria-hidden="true" className="absolute left-1/2 top-[38%] w-[62%] -translate-x-1/2 -translate-y-1/2 text-bone/80">
                {Array.from({ length: 60 }, (_, i) => {
                  const a = (i / 60) * Math.PI * 2;
                  const long = i % 5 === 0;
                  return (
                    <line
                      key={i}
                      x1={100 + Math.cos(a) * (long ? 80 : 86)}
                      y1={100 + Math.sin(a) * (long ? 80 : 86)}
                      x2={100 + Math.cos(a) * 94}
                      y2={100 + Math.sin(a) * 94}
                      stroke="currentColor"
                      strokeWidth={long ? 1.6 : 0.9}
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
              <div className="relative">
                <p className="text-2xl font-light leading-tight tracking-[-0.03em] text-bone">
                  Your profile travels with every proposal
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-4 text-sm text-bone/75">
                  <span className="inline-flex items-center gap-2">
                    <span className="grid size-5 place-items-center rounded-full bg-zest text-ink">
                      <Icon name="check" className="size-3" />
                    </span>
                    Skills, rate &amp; portfolio
                  </span>
                  <span className="tabular">{metrics.activeFreelancers} active this month</span>
                </div>
              </div>
            </article>

            {/* Open jobs with two bars */}
            <article
              data-reveal
              className="flex min-h-[300px] flex-col justify-between rounded-[2rem] bg-canvas-deep/60 p-7 lg:col-span-4"
            >
              <div>
                <p className="text-sm text-muted">Open right now</p>
                <p className="tabular mt-2 text-6xl font-light tracking-[-0.06em] text-fg">{stats.openJobs}</p>
                <p className="mt-1 text-sm text-muted">
                  jobs worth <span className="text-fg">{formatMoney(stats.liveBudget)}</span>
                </p>
              </div>
              <div className="flex h-36 items-end gap-3" aria-hidden="true">
                <div className="flex h-full flex-1 flex-col justify-end">
                  <p className="tabular text-lg font-light text-fg">{stats.hires}</p>
                  <p className="mb-2 text-[11px] text-muted">Hires made</p>
                  <div
                    className="rounded-2xl bg-zest"
                    style={{ height: `${Math.max(18, (stats.hires / Math.max(stats.proposals, 1)) * 100)}%` }}
                  />
                </div>
                <div className="flex h-full flex-1 flex-col justify-end">
                  <p className="tabular text-lg font-light text-fg">{stats.proposals}</p>
                  <p className="mb-2 text-[11px] text-muted">Proposals sent</p>
                  <div className="h-[72%] rounded-2xl bg-fg" />
                </div>
              </div>
            </article>

            {/* Dark: answered share */}
            <article
              data-reveal
              className="grain relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-[2rem] bg-ink p-7 text-bone lg:col-span-4"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm text-ink-muted">Jobs that got a proposal</p>
                <Icon name="sparkle" className="size-5 text-zest" />
              </div>
              <p className="tabular text-6xl font-light tracking-[-0.06em] text-zest">
                {Math.round(stats.answeredShare * 100)}
                <span className="text-4xl">%</span>
              </p>
              <ul className="space-y-2" aria-label="Responsiveness">
                {[
                  { label: "Proposals per job", value: stats.avgProposalsPerJob.toFixed(1), width: "62%" },
                  {
                    label: "Typical message reply",
                    value: reply ? `${reply.value} ${reply.unit}` : "—",
                    width: "82%",
                  },
                  {
                    label: "Client's first reply",
                    value: firstReply ? `${firstReply.value} ${firstReply.unit}` : "—",
                    width: "100%",
                  },
                ].map((row, index) => (
                  <li
                    key={row.label}
                    className={`flex items-center justify-between rounded-full px-4 py-2 text-xs ${
                      index === 2 ? "bg-[linear-gradient(90deg,#383b32,#cbf24c)] text-bone" : "bg-white/10 text-bone/85"
                    }`}
                    style={{ width: row.width }}
                  >
                    <span>{row.label}</span>
                    {/* The last pill fades into zest, so its number needs dark ink to stay readable. */}
                    <span className={`tabular font-medium ${index === 2 ? "text-fg" : ""}`}>{row.value}</span>
                  </li>
                ))}
              </ul>
            </article>

            {/* Zest: free to start */}
            <article data-reveal className="relative flex min-h-[260px] overflow-hidden rounded-[2rem] bg-zest lg:col-span-8">
              <div className="flex flex-1 flex-col justify-between p-7 sm:p-8">
                <p className="max-w-[14rem] text-[1.65rem] font-light leading-[1.05] tracking-[-0.035em] text-fg">
                  Free to post.
                  <br />
                  Free to <Serif>pitch</Serif>.
                </p>
                <p className="mt-8 text-fg">
                  <span className="align-top text-xl">$</span>
                  <span className="tabular text-7xl font-light tracking-[-0.06em]">0</span>
                  <span className="ml-1 font-serif text-lg italic">/ to get started</span>
                </p>
              </div>
              <div className="relative hidden w-[46%] sm:block">
                <Image
                  src={collabImage}
                  alt="Two colleagues reviewing code together on a monitor"
                  fill
                  placeholder="blur"
                  sizes="(min-width: 1024px) 30vw, 45vw"
                  className="object-cover"
                />
                <div aria-hidden="true" className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-zest to-transparent" />
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
