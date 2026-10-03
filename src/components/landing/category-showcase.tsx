"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ShowcaseItem = {
  category: string;
  blurb: string;
  image: StaticImageData;
  alt: string;
  openJobs: number;
  avgBudget: number;
  latestTitle: string | null;
};

/** A list of categories beside one large photo card that follows the selection. */
export function CategoryShowcase({ items }: { items: ShowcaseItem[] }) {
  const [active, setActive] = useState(0);
  const current = items[active];

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
      {/* Selector */}
      <div data-reveal className="lg:col-span-4">
        <ul
          className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:block lg:space-y-0 lg:overflow-visible lg:border-l lg:border-line lg:px-0 lg:pb-0"
          role="tablist"
          aria-label="Categories"
        >
          {items.map((item, index) => {
            const selected = index === active;
            return (
              <li key={item.category} className="shrink-0 snap-start">
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="category-panel"
                  onClick={() => setActive(index)}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  className={cn(
                    "group relative w-full text-left transition",
                    "rounded-full px-4 py-2.5 ring-1 ring-inset lg:rounded-none lg:py-4 lg:pl-7 lg:pr-0 lg:ring-0",
                    selected ? "bg-fg text-canvas ring-fg lg:bg-transparent lg:text-fg" : "bg-surface text-muted ring-line lg:bg-transparent",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute -left-px top-3 bottom-3 hidden w-0.5 rounded-full bg-fg transition-opacity lg:block",
                      selected ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span
                    className={cn(
                      "block whitespace-nowrap text-sm font-medium lg:text-[1.35rem] lg:font-light lg:tracking-[-0.025em]",
                      !selected && "lg:group-hover:text-fg",
                    )}
                  >
                    {item.category}
                  </span>
                  <span className="mt-0.5 hidden text-xs text-faint lg:block">
                    {item.openJobs} open {item.openJobs === 1 ? "job" : "jobs"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Stage */}
      <div
        data-reveal
        id="category-panel"
        role="tabpanel"
        aria-live="polite"
        className="relative isolate min-h-[520px] overflow-hidden rounded-[2rem] bg-ink sm:aspect-[16/11] sm:min-h-0 lg:col-span-8"
      >
        {items.map((item, index) => (
          <Image
            key={item.category}
            src={item.image}
            alt={index === active ? item.alt : ""}
            fill
            placeholder="blur"
            sizes="(min-width: 1024px) 60vw, 100vw"
            className={cn(
              "-z-20 object-cover transition-[opacity,transform] duration-700 ease-out",
              index === active ? "scale-100 opacity-100" : "scale-[1.04] opacity-0",
            )}
          />
        ))}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(25,26,22,0)_45%,rgba(25,26,22,0.85)_100%)]" />

        {/* Glass brief */}
        <div className="absolute left-4 top-4 w-[min(20rem,calc(100%-2rem))] rounded-[1.5rem] bg-surface/75 p-5 ring-1 ring-inset ring-surface/80 backdrop-blur-xl sm:left-6 sm:top-6">
          <p className="text-xl font-light tracking-[-0.025em] text-fg">{current.category}</p>
          <p className="mt-2 text-[13px] leading-5 text-muted">{current.blurb}</p>
          <Link
            href="/signup?role=freelancer"
            className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-fg hover:text-zest-ink"
          >
            Browse these jobs
            <Icon name="arrowRight" className="size-3.5" />
          </Link>
        </div>

        {/* Live figures */}
        <dl className="absolute inset-x-0 bottom-0 grid grid-cols-2 gap-x-6 gap-y-4 p-6 text-bone sm:grid-cols-[auto_auto_1fr] sm:gap-x-12 sm:p-8">
          <div>
            <dt className="text-[11px] text-bone/60">Open jobs</dt>
            <dd className="tabular mt-1 text-3xl font-light tracking-[-0.04em]">{current.openJobs}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-bone/60">Average budget</dt>
            <dd className="tabular mt-1 text-3xl font-light tracking-[-0.04em]">
              {current.openJobs ? formatMoney(current.avgBudget) : "—"}
            </dd>
          </div>
          <div className="col-span-2 min-w-0 sm:col-span-1">
            <dt className="text-[11px] text-bone/60">Latest brief</dt>
            <dd className="mt-1.5 truncate text-lg font-light tracking-[-0.02em]">
              {current.latestTitle ?? "New briefs arrive every week"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
