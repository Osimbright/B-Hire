import { StarRating } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { Review } from "@/lib/types";

/** A posted review, as shown on the job page to both the client and the freelancer. */
export function ReviewCard({ review, author }: { review: Review; author: string }) {
  return (
    <figure className="rounded-2xl bg-canvas-soft p-5 ring-1 ring-line">
      <div className="flex items-center justify-between gap-3">
        <StarRating rating={review.rating} className="size-5" />
        <span className="text-xs text-faint">{formatDate(review.created_at)}</span>
      </div>
      <blockquote className="mt-3 whitespace-pre-line text-[15px] leading-7 text-fg">
        &ldquo;{review.body}&rdquo;
      </blockquote>
      <figcaption className="mt-3 text-xs text-muted">— {author}</figcaption>
    </figure>
  );
}
