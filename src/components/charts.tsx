import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Chart marks for the B-Hire dashboards.
 *
 * Everything here is plain SVG or CSS with no client-side JavaScript, so the
 * widgets render on the server along with the data they describe. Colours come
 * from the theme tokens in globals.css and are passed in as CSS colour values.
 */

/** Diagonal hatching used for the muted steps of a funnel. */
const HATCH = {
  backgroundColor: "color-mix(in oklab, var(--color-fg) 4%, transparent)",
  backgroundImage:
    "repeating-linear-gradient(135deg, color-mix(in oklab, var(--color-fg) 40%, transparent) 0 1.5px, transparent 1.5px 7px)",
  boxShadow: "inset 0 2px 0 var(--color-fg)",
};

export type FunnelStep = {
  label: string;
  value: number;
  /** Small caption under the number, e.g. "89% of posted". */
  hint?: string;
};

/**
 * A staircase of columns, one per stage. Every step is hatched except the one
 * at `highlight`, which is filled with the accent — the stage worth reading.
 */
export function FunnelBars({
  steps,
  highlight = steps.length - 1,
  height = 168,
}: {
  steps: FunnelStep[];
  highlight?: number;
  height?: number;
}) {
  const max = Math.max(...steps.map((step) => step.value), 1);

  return (
    <div className="flex h-full flex-1 flex-col overflow-x-auto">
      <div className="flex min-w-[520px] flex-1 border-t border-line">
        {steps.map((step, index) => {
          const active = index === highlight;
          // Keep tiny values visible: floor every bar at 8% of the plot.
          const ratio = Math.max(step.value / max, 0.08);
          return (
            <div
              key={step.label}
              className={cn(
                "relative flex flex-1 flex-col border-l border-line first:border-l-0",
                active && "bg-canvas-soft",
              )}
            >
              <div className="px-4 pt-4">
                <p
                  className={cn(
                    "truncate text-[11px] font-medium uppercase tracking-[0.06em]",
                    active ? "text-fg" : "text-faint",
                  )}
                >
                  {step.label}
                </p>
                <p
                  className={cn(
                    "tabular mt-1 text-2xl font-semibold tracking-[-0.03em]",
                    active ? "text-fg" : "text-muted",
                  )}
                >
                  {step.value}
                </p>
                <p className="mt-0.5 h-4 truncate text-[11px] text-faint">{step.hint}</p>
              </div>

              <div className="relative mt-3 flex-1" style={{ minHeight: height }}>
                <div
                  className={cn(
                    "absolute inset-x-0 bottom-0",
                    active && "bg-zest shadow-[inset_0_2px_0_var(--color-zest-deep)]",
                  )}
                  style={active ? { height: `${ratio * 100}%` } : { height: `${ratio * 100}%`, ...HATCH }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Counts as stacks of dots, one column per bucket. The busiest column is
 * filled in ink and called out above the grid.
 */
export function DotMatrix({
  columns,
  peakLabel,
  maxDots = 7,
  onDark = false,
}: {
  columns: { label: string; value: number }[];
  peakLabel?: string;
  maxDots?: number;
  onDark?: boolean;
}) {
  const max = Math.max(...columns.map((column) => column.value), 1);
  const peak = columns.reduce((best, column, index) => (column.value > columns[best].value ? index : best), 0);

  return (
    <div>
      {peakLabel && (
        <p
          className={cn(
            "mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium",
            onDark ? "bg-white/10 text-ink-muted" : "bg-canvas-deep/70 text-muted",
          )}
        >
          Busiest: <span className={onDark ? "text-zest" : "text-fg"}>{peakLabel}</span>
        </p>
      )}
      <div className="flex items-end justify-between gap-1.5">
        {columns.map((column, index) => {
          const dots = column.value === 0 ? 0 : Math.max(1, Math.round((column.value / max) * maxDots));
          const isPeak = index === peak && column.value > 0;
          return (
            <div key={`${column.label}-${index}`} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex flex-col-reverse gap-1" style={{ minHeight: maxDots * 12 }}>
                {Array.from({ length: dots }, (_, dot) => (
                  <span
                    key={dot}
                    className={cn(
                      "block size-2 rounded-full",
                      isPeak
                        ? onDark
                          ? "bg-zest"
                          : "bg-fg"
                        : onDark
                          ? "bg-white/25"
                          : "bg-line-strong",
                    )}
                  />
                ))}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isPeak ? (onDark ? "text-bone" : "text-fg") : onDark ? "text-ink-muted" : "text-faint",
                )}
              >
                {column.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type MeterItem = {
  label: string;
  value: ReactNode;
  /** 0–1. */
  ratio: number;
  color: string;
};

/**
 * Labelled rows with a segmented bar underneath — the breakdown of one total
 * into its parts.
 */
export function MeterList({
  items,
  onDark = false,
  columns = 1,
}: {
  items: MeterItem[];
  onDark?: boolean;
  /** Two columns keeps bars a readable length in full-width widgets. */
  columns?: 1 | 2;
}) {
  return (
    <ul className={columns === 2 ? "grid gap-x-10 gap-y-4 md:grid-cols-2" : "space-y-4"}>
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className={cn("truncate text-sm", onDark ? "text-ink-muted" : "text-muted")}>{item.label}</span>
            <span
              className={cn(
                "tabular shrink-0 text-sm font-semibold",
                onDark ? "text-bone" : "text-fg",
              )}
            >
              {item.value}
            </span>
          </div>
          <div
            className={cn(
              "mt-2 h-2 overflow-hidden rounded-full",
              onDark ? "bg-white/10" : "bg-canvas-deep",
            )}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(Math.min(item.ratio, 1), 0.02) * 100}%`,
                // Vertical ticks give the fill a measured, instrument-like texture.
                backgroundImage: `repeating-linear-gradient(90deg, ${item.color} 0 4px, color-mix(in oklab, ${item.color} 55%, transparent) 4px 6px)`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * A stepped line with hatched fill beneath it — a coarse view of volume over
 * time, not a precise series.
 */
export function StepLine({
  values,
  labels,
  color = "var(--color-clay)",
  height = 96,
}: {
  values: number[];
  labels?: string[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...values, 1);
  const width = 100;
  const step = width / Math.max(values.length, 1);
  const y = (value: number) => 38 - (value / max) * 32;

  // Build the staircase: across the top of each bucket, then down to the next.
  let line = `M 0 ${y(values[0] ?? 0)}`;
  values.forEach((value, index) => {
    line += ` L ${(index + 1) * step} ${y(value)}`;
    if (index < values.length - 1) line += ` L ${(index + 1) * step} ${y(values[index + 1])}`;
  });
  const area = `${line} L ${width} 40 L 0 40 Z`;
  // Deterministic so server and client markup match; includes the colour so
  // two lines with the same data but different colours don't share a pattern.
  const patternId = `hatch-${color.replace(/[^a-z0-9]/gi, "")}-${values.join("-")}`;

  return (
    <div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ height }} className="w-full" aria-hidden="true">
        <defs>
          <pattern id={patternId} width="2" height="40" patternUnits="userSpaceOnUse">
            <line x1="0.5" y1="0" x2="0.5" y2="40" stroke={color} strokeWidth="0.7" opacity="0.28" />
          </pattern>
        </defs>
        <path d={area} fill={`url(#${patternId})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {labels && (
        <div className="mt-2 flex justify-between text-[11px] text-faint">
          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * A 260° dial with a tick ring. Used for the single "how am I doing" number on
 * a page — profile strength, win rate.
 */
export function Gauge({
  value,
  caption,
  size = 190,
}: {
  /** 0–100. */
  value: number;
  caption?: ReactNode;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const SWEEP = 260;
  const track = circumference * (SWEEP / 360);
  const ticks = 40;
  // SVG angles run clockwise from 3 o'clock. Starting at 140° puts the
  // 100° gap symmetrically at the bottom of the dial.
  const START = 140;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
          {/* Tick ring — instrument texture, the lit part tracks the value */}
          {Array.from({ length: ticks }, (_, index) => {
            const t = index / (ticks - 1);
            const angle = (START + t * SWEEP) * (Math.PI / 180);
            const lit = clamped > 0 && t <= clamped / 100;
            return (
              <line
                key={index}
                x1={50 + Math.cos(angle) * 45}
                y1={50 + Math.sin(angle) * 45}
                x2={50 + Math.cos(angle) * 49}
                y2={50 + Math.sin(angle) * 49}
                stroke={lit ? "var(--color-fg)" : "var(--color-line-strong)"}
                strokeWidth={lit ? 1.1 : 0.8}
                strokeLinecap="round"
              />
            );
          })}
          <g transform={`rotate(${START} 50 50)`}>
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="var(--color-canvas-deep)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${track} ${circumference}`}
            />
            {clamped > 0 && (
              <>
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="var(--color-fg)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${track * (clamped / 100)} ${circumference}`}
                />
                {/* Zest core line — the accent without losing contrast on white */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="var(--color-zest)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeDasharray={`${track * (clamped / 100)} ${circumference}`}
                />
              </>
            )}
          </g>
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <p className="tabular text-4xl font-semibold tracking-[-0.04em] text-fg">{Math.round(clamped)}%</p>
        </div>
      </div>
      {caption && <div className="mt-1 text-center text-sm text-muted">{caption}</div>}
    </div>
  );
}

/** Tiny inline bar series for list rows. */
export function MiniBars({ values, color = "var(--color-fg)" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-8 items-end gap-1" aria-hidden="true">
      {values.map((value, index) => (
        <span
          key={index}
          className="w-1.5 rounded-full"
          style={{
            height: `${Math.max(value / max, 0.12) * 100}%`,
            backgroundColor: color,
            opacity: index === values.length - 1 ? 1 : 0.28,
          }}
        />
      ))}
    </div>
  );
}
