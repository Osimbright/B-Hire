import { Avatar, StarRating } from "@/components/ui";
import type { LandingMetrics, LandingReview } from "@/lib/db";
import { formatDuration, formatMonthYear } from "@/lib/format";
import { cn } from "@/lib/utils";

function ReviewCard({ review }: { review: LandingReview }) {
  return (
    <figure className="rounded-[1.5rem] bg-canvas-soft p-6 ring-1 ring-inset ring-line">
      <div className="flex items-center justify-between gap-3">
        <StarRating rating={review.rating} />
        <span className="text-[11px] text-faint">{formatMonthYear(review.created_at)}</span>
      </div>
      <blockquote className="mt-4 text-[15px] leading-7 text-fg">&ldquo;{review.body}&rdquo;</blockquote>
      <p className="mt-5 rounded-xl bg-surface px-3 py-2 text-xs leading-5 text-muted ring-1 ring-inset ring-line">
        Hired <span className="font-medium text-fg">{review.freelancer_name}</span> for{" "}
        <span className="text-fg">{review.job_title}</span>
      </p>
      <figcaption className="mt-4 flex items-center gap-3 border-t border-line pt-4">
        <Avatar name={review.client_name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">{review.client_name}</p>
          {review.client_bio && <p className="text-xs leading-4 text-muted">{review.client_bio.replace(/\.$/, "")}</p>}
        </div>
      </figcaption>
    </figure>
  );
}

/** A column that scrolls forever; its content is rendered twice for a seamless loop. */
function ScrollingColumn({
  reviews,
  duration,
  reverse,
  className,
}: {
  reviews: LandingReview[];
  duration: string;
  reverse?: boolean;
  className?: string;
}) {
  if (reviews.length === 0) return null;
  return (
    <div className={cn("fade-y h-full overflow-hidden", className)}>
      <div
        className="marquee-y flex flex-col gap-3 hover:[animation-play-state:paused]"
        style={{ ["--marquee-duration" as string]: duration, animationDirection: reverse ? "reverse" : undefined }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex flex-col gap-3" aria-hidden={copy === 1 || undefined}>
            {reviews.map((review) => (
              <ReviewCard key={`${copy}-${review.id}`} review={review} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Real client reviews, left on completed jobs, with the rating summary beside them. */
export function Reviews({ metrics }: { metrics: LandingMetrics }) {
  const { rating, reviews } = metrics;
  const columns = [0, 1, 2].map((col) => reviews.filter((_, i) => i % 3 === col));
  const firstReply = metrics.clientFirstReplyHours != null ? formatDuration(metrics.clientFirstReplyHours) : null;

  return (
    <section id="reviews" className="scroll-mt-4 px-2 sm:px-3">
      <div className="mx-auto grid max-w-[1500px] gap-12 overflow-hidden rounded-[1.75rem] bg-surface px-5 py-16 sm:rounded-[2.5rem] sm:px-10 sm:py-20 lg:grid-cols-12 lg:gap-8 lg:px-16 lg:py-24">
        {/* Summary */}
        <div className="flex flex-col lg:col-span-5">
          <p data-reveal className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
            Ratings &amp; reviews
          </p>
          <h2
            data-reveal
            className="mt-6 text-[clamp(2.6rem,5vw,4.4rem)] font-light leading-[0.95] tracking-[-0.05em] text-fg"
          >
            Rated by the
            <br />
            clients who <em className="font-serif font-normal">hired</em>
          </h2>

          {rating.average != null ? (
            <>
              <div data-reveal className="mt-12 flex items-end gap-5">
                <p className="tabular font-serif text-[7.5rem] leading-[0.8] tracking-[-0.04em] text-fg">
                  {rating.average.toFixed(1)}
                </p>
                <div className="pb-2">
                  <StarRating rating={rating.average} className="size-5" />
                  <p className="mt-2 text-sm text-muted">
                    from {rating.count} {rating.count === 1 ? "review" : "reviews"} on completed jobs
                  </p>
                </div>
              </div>

              <ul data-reveal className="mt-10 max-w-sm space-y-2.5" aria-label="Rating breakdown">
                {rating.breakdown.map((share, index) => {
                  const stars = 5 - index;
                  return (
                    <li key={stars} className="flex items-center gap-3 text-xs">
                      <span className="tabular w-3 text-muted">{stars}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
                        <span
                          className={cn("block h-full rounded-full", stars === 5 ? "bg-fg" : "bg-line-strong")}
                          style={{ width: `${share * 100}%` }}
                        />
                      </span>
                      <span className="tabular w-9 text-right text-muted">{Math.round(share * 100)}%</span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p data-reveal className="mt-10 max-w-sm text-[15px] leading-7 text-muted">
              Reviews appear here as clients finish jobs with their freelancers.
            </p>
          )}

          <dl data-reveal className="mt-10 grid max-w-sm grid-cols-2 gap-3">
            <div className="rounded-2xl bg-canvas-soft p-4 ring-1 ring-inset ring-line">
              <dt className="text-[11px] text-muted">Client response</dt>
              <dd className="tabular mt-1 text-2xl font-light tracking-[-0.04em] text-fg">
                {Math.round(metrics.clientResponseRate * 100)}%
              </dd>
            </div>
            <div className="rounded-2xl bg-canvas-soft p-4 ring-1 ring-inset ring-line">
              <dt className="text-[11px] text-muted">First client reply</dt>
              <dd className="tabular mt-1 text-2xl font-light tracking-[-0.04em] text-fg">
                {firstReply ? `${firstReply.value} ${firstReply.unit}` : "—"}
              </dd>
            </div>
          </dl>

          <a
            data-reveal
            href="#stories"
            className="mt-10 inline-flex w-fit items-center gap-3 text-sm font-medium text-fg lg:mt-auto lg:pt-10"
          >
            <span className="grid size-10 place-items-center rounded-full bg-zest">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </span>
            Read the full stories
          </a>
        </div>

        {/* Wall — every review is shown at every width, split into as many columns as fit.
            Skipped until there are reviews, so it doesn't leave a tall empty block. */}
        {reviews.length > 0 && (
        <div data-reveal className="h-[620px] lg:col-span-7 lg:h-[760px]">
          <div className="h-full sm:hidden">
            <ScrollingColumn reviews={reviews} duration={`${reviews.length * 7}s`} />
          </div>
          <div className="hidden h-full grid-cols-2 gap-3 sm:grid xl:hidden">
            {[0, 1].map((col) => (
              <ScrollingColumn
                key={col}
                reviews={reviews.filter((_, i) => i % 2 === col)}
                duration={col ? "62s" : "52s"}
                reverse={col === 1}
              />
            ))}
          </div>
          <div className="hidden h-full grid-cols-3 gap-3 xl:grid">
            {columns.map((column, col) => (
              <ScrollingColumn key={col} reviews={column} duration={["48s", "60s", "54s"][col]} reverse={col === 1} />
            ))}
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
