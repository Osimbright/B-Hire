import { Icon, type IconName } from "@/components/icons";
import { GlowCard } from "@/components/ui/spotlight-card";
import type { LandingMetrics } from "@/lib/db";
import { formatDuration } from "@/lib/format";

type Stats = {
  openJobs: number;
  hires: number;
  avgProposalsPerJob: number;
};

type Step = {
  step: string;
  icon: IconName;
  glow: "green" | "orange" | "purple";
  title: string;
  blurb: string;
  value: string;
  label: string;
};

/**
 * "How it works" — the three moves that make up a hire, on a dark band so the
 * spotlight cards read. Each card carries a live number, not a claim.
 */
export function HowItWorks({ stats, metrics }: { stats: Stats; metrics: LandingMetrics }) {
  const reply = metrics.replyHours != null ? formatDuration(metrics.replyHours) : null;

  const steps: Step[] = [
    {
      step: "01",
      icon: "pencil",
      glow: "green",
      title: "Post the brief",
      blurb: "A title, a clear scope, a budget and a deadline. That’s the whole form — no auction to set up.",
      value: String(stats.openJobs),
      label: "open jobs right now",
    },
    {
      step: "02",
      icon: "grid",
      glow: "orange",
      title: "Compare proposals",
      blurb: "Bids, cover notes and full profiles land side by side, so the right fit is the obvious one.",
      value: stats.avgProposalsPerJob.toFixed(1),
      label: "proposals per job, on average",
    },
    {
      step: "03",
      icon: "chat",
      glow: "purple",
      title: "Talk, then hire",
      blurb: "A private thread for every applicant. Accept one and every other proposal closes, politely.",
      value: reply ? `${reply.value}${reply.unit.charAt(0)}` : String(stats.hires),
      label: reply ? "typical reply to a message" : "hires made so far",
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-4 px-2 pb-28 sm:px-3 lg:pb-36">
      <div className="grain mx-auto max-w-[1500px] overflow-hidden rounded-[1.75rem] bg-ink px-5 py-16 sm:rounded-[2.5rem] sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <h2
            data-reveal
            className="text-[clamp(2.6rem,5vw,4.4rem)] font-light leading-[0.95] tracking-[-0.05em] text-bone lg:col-span-7"
          >
            Three moves,
            <br />
            start to <em className="font-serif font-normal text-zest">hired</em>
          </h2>
          <p data-reveal className="max-w-md text-[15px] leading-7 text-ink-muted lg:col-span-5 lg:justify-self-end">
            Move your cursor across the cards — the same three steps every job on B-Hire goes
            through, with the live numbers behind them.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            // Fades rather than lifts: the spotlight uses a fixed background,
            // which would slide around under an animated ancestor.
            <div key={step.step} data-reveal="fade" className="h-full">
              <GlowCard customSize glowColor={step.glow} className="h-full min-h-[380px] w-full text-bone">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-full bg-white/10 text-zest ring-1 ring-inset ring-white/15">
                      <Icon name={step.icon} className="size-5" />
                    </span>
                    <span className="tabular font-serif text-3xl italic leading-none text-bone/30">{step.step}</span>
                  </div>
                  <h3 className="mt-7 text-[1.65rem] font-light leading-[1.05] tracking-[-0.035em] text-bone">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-bone/70">{step.blurb}</p>
                </div>

                <div className="flex items-end justify-between gap-3 border-t border-white/15 pt-4">
                  <p className="tabular text-4xl font-light tracking-[-0.05em] text-zest">{step.value}</p>
                  <p className="max-w-[9rem] text-right text-[11px] leading-4 text-bone/60">{step.label}</p>
                </div>
              </GlowCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
