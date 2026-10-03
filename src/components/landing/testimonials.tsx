"use client";

import { useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { TESTIMONIALS, type Testimonial } from "@/components/landing/content";

/** Where a card sits relative to the active one, wrapping around: -2 … 2. */
function offsetFrom(index: number, active: number, total: number) {
  let offset = index - active;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;
  return offset;
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

/**
 * Portrait artwork instead of stock faces: a duotone field, a tick-ring halo
 * and the person's initials. Swap for real, permissioned photos when you have them.
 */
function Portrait({ person, active }: { person: Testimonial; active: boolean }) {
  const [a, b] = person.palette;
  return (
    <div
      className="grain relative size-full overflow-hidden rounded-[inherit]"
      style={{ background: `radial-gradient(120% 90% at 30% 15%, ${a} 0%, color-mix(in oklab, ${a} 45%, ${b}) 55%, ${b} 100%)` }}
    >
      <svg viewBox="0 0 200 200" aria-hidden="true" className="absolute left-1/2 top-[40%] w-[86%] -translate-x-1/2 -translate-y-1/2 opacity-70 mix-blend-overlay">
        {Array.from({ length: 48 }, (_, i) => {
          const angle = (i / 48) * Math.PI * 2;
          const long = i % 4 === 0;
          // Round so server and browser serialise identical attributes (no hydration mismatch).
          const at = (radius: number, fn: (x: number) => number) => Math.round((100 + fn(angle) * radius) * 100) / 100;
          return (
            <line
              key={i}
              x1={at(long ? 74 : 82, Math.cos)}
              y1={at(long ? 74 : 82, Math.sin)}
              x2={at(92, Math.cos)}
              y2={at(92, Math.sin)}
              stroke="#fff"
              strokeWidth={long ? 2 : 1.2}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <span className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 font-serif text-[5.5rem] italic leading-none tracking-[-0.04em] text-white mix-blend-overlay">
        {initials(person.name)}
      </span>
      <div
        className={cn(
          "absolute inset-x-3 bottom-3 rounded-2xl bg-black/25 px-3 py-2.5 text-center ring-1 ring-inset ring-white/25 backdrop-blur-md transition-opacity duration-500",
          active ? "opacity-100" : "opacity-0",
        )}
      >
        <p className="truncate text-sm font-medium text-white">{person.name}</p>
        <p className="truncate text-[10px] text-white/75">{person.location}</p>
      </div>
    </div>
  );
}

export function Testimonials() {
  const [active, setActive] = useState(0);
  const total = TESTIMONIALS.length;
  const current = TESTIMONIALS[active];
  const go = (step: number) => setActive((value) => (value + step + total) % total);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowRight") go(1);
    if (event.key === "ArrowLeft") go(-1);
  }

  return (
    <section id="stories" className="scroll-mt-4 overflow-hidden px-4 py-28 sm:px-6 lg:py-36">
      <div className="mx-auto max-w-[1320px] text-center">
        <p data-reveal className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          Testimonials
        </p>
        <h2
          data-reveal
          className="mx-auto mt-6 max-w-3xl text-[clamp(2.6rem,5.4vw,4.8rem)] font-light leading-[0.95] tracking-[-0.05em] text-fg"
        >
          Stories from both
          <br />
          sides of the <em className="font-serif font-normal">hire</em>
        </h2>

        {/* Stage */}
        <div
          data-reveal
          className="relative mx-auto mt-16 h-[380px] max-w-5xl [--step:128px] sm:h-[430px] sm:[--step:210px] lg:[--step:250px]"
          onKeyDown={onKeyDown}
          role="group"
          aria-roledescription="carousel"
          aria-label="Customer stories"
        >
          {TESTIMONIALS.map((person, index) => {
            const offset = offsetFrom(index, active, total);
            const distance = Math.abs(offset);
            const isActive = offset === 0;
            return (
              <button
                key={person.name}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show ${person.name}'s story`}
                aria-current={isActive || undefined}
                tabIndex={distance > 1 ? -1 : 0}
                className={cn(
                  "absolute left-1/2 top-0 h-[300px] w-[220px] -ml-[110px] rounded-[1.75rem] p-1.5 transition-[transform,opacity,box-shadow] duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg sm:h-[350px] sm:w-[260px] sm:-ml-[130px]",
                  isActive
                    ? "bg-surface shadow-[0_40px_80px_-30px_rgba(25,26,22,0.45)]"
                    : "bg-surface/70 shadow-[0_20px_40px_-24px_rgba(25,26,22,0.35)]",
                )}
                style={{
                  transform: `translateX(calc(var(--step) * ${offset})) translateY(${distance * 34}px) rotate(${offset * 7}deg) scale(${1 - distance * 0.14})`,
                  zIndex: 30 - distance,
                  opacity: distance > 2 ? 0 : distance === 2 ? 0.55 : 1,
                }}
              >
                <span className="block size-full rounded-[1.4rem]">
                  <Portrait person={person} active={isActive} />
                </span>
                {isActive && (
                  <span className="absolute -bottom-5 left-1/2 grid size-11 -translate-x-1/2 place-items-center rounded-full bg-ink font-serif text-3xl leading-none text-zest ring-4 ring-canvas">
                    &rdquo;
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Story */}
        <div data-reveal className="mx-auto mt-6 max-w-2xl" aria-live="polite">
          <p className="text-2xl font-medium leading-snug tracking-[-0.02em] text-fg sm:text-[1.75rem]">
            {current.headline}
          </p>
          <p className="mt-5 text-[15px] leading-7 text-muted">{current.body}</p>
          <p className="mt-6 text-sm text-fg">
            {current.name} <span className="text-faint">·</span>{" "}
            <span className="text-muted">{current.role}</span>
          </p>
          <ul className="mt-5 flex flex-wrap justify-center gap-2">
            {current.outcome.map((item) => (
              <li key={item} className="rounded-full bg-surface px-4 py-1.5 text-xs font-medium text-fg ring-1 ring-inset ring-line">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Controls */}
        <div data-reveal className="mt-10 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous story"
            className="grid size-12 place-items-center rounded-full bg-surface text-fg ring-1 ring-inset ring-line transition hover:bg-ink hover:text-bone"
          >
            <Icon name="arrowLeft" className="size-[18px]" />
          </button>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {TESTIMONIALS.map((person, index) => (
              <span
                key={person.name}
                className={cn("h-1.5 rounded-full transition-all duration-500", index === active ? "w-7 bg-fg" : "w-1.5 bg-line-strong")}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next story"
            className="grid size-12 place-items-center rounded-full bg-surface text-fg ring-1 ring-inset ring-line transition hover:bg-ink hover:text-bone"
          >
            <Icon name="arrowRight" className="size-[18px]" />
          </button>
        </div>
      </div>
    </section>
  );
}
