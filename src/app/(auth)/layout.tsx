import type { ReactNode } from "react";
import { DotMatrix, MeterList } from "@/components/charts";
import { Icon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/ui";

/** Split-screen layout shared by /login and /signup. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden bg-ink p-12 lg:flex lg:flex-col lg:justify-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-zest/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-24 size-[26rem] rounded-full bg-clay/25 blur-3xl"
        />

        <div className="relative mx-auto w-full max-w-md">
          <h2 className="text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-bone">
            Hire faster.
            <span className="block text-zest">Get hired smarter.</span>
          </h2>
          <p className="mt-5 text-[15px] leading-7 text-ink-muted">
            Post a job, compare proposals side by side, and talk to freelancers one-on-one — all in
            one workspace.
          </p>

          {/* A slice of the product, rather than a stock illustration */}
          <div className="mt-10 space-y-3">
            <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-inset ring-white/10 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-bone">Landing page redesign</p>
                  <p className="mt-0.5 text-xs text-ink-muted">Design &amp; Creative · Due in 21 days</p>
                </div>
                <span className="rounded-full bg-zest px-2.5 py-0.5 text-xs font-medium text-ink">Open</span>
              </div>
              <div className="mt-5">
                <MeterList
                  onDark
                  items={[
                    { label: "Budget", value: "$1,500", ratio: 1, color: "var(--color-zest)" },
                    { label: "Best bid so far", value: "$1,400", ratio: 0.93, color: "var(--color-iris)" },
                  ]}
                />
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex -space-x-2">
                  {["LF", "SR", "AB", "+9"].map((initials) => (
                    <span
                      key={initials}
                      className="grid size-8 place-items-center rounded-full bg-ink-soft text-[10px] font-semibold text-bone ring-2 ring-ink"
                    >
                      {initials}
                    </span>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zest">
                  12 proposals
                  <Icon name="arrowRight" className="size-3.5" />
                </span>
              </div>
            </div>

            <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-inset ring-white/10 backdrop-blur">
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">
                When proposals arrive
              </p>
              <DotMatrix
                onDark
                maxDots={5}
                columns={[
                  { label: "M", value: 4 },
                  { label: "T", value: 6 },
                  { label: "W", value: 9 },
                  { label: "T", value: 7 },
                  { label: "F", value: 5 },
                  { label: "S", value: 2 },
                  { label: "S", value: 1 },
                ]}
              />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
