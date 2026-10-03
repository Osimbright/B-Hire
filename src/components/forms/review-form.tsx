"use client";

import { useActionState, useState } from "react";
import { submitReview } from "@/actions/jobs";
import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { Field, FormAlert, Textarea } from "@/components/ui";
import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export function ReviewForm({ jobId, freelancerName }: { jobId: string; freelancerName: string }) {
  const [state, action] = useActionState(submitReview, undefined);
  const fields = state?.fields;
  // Drives the star colours. The radios themselves stay uncontrolled with
  // defaultChecked from the echoed fields, so React's form reset after a
  // failed submit restores the choice instead of clearing it.
  const [rating, setRating] = useState(Number(fields?.rating) || 0);
  const [hover, setHover] = useState(0);
  const shown = hover || rating;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="job_id" value={jobId} />

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg">Your rating</legend>
        <div className="flex items-center gap-3">
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <label
                key={star}
                onMouseEnter={() => setHover(star)}
                className="cursor-pointer rounded-lg p-0.5 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-fg"
              >
                <input
                  type="radio"
                  name="rating"
                  value={star}
                  defaultChecked={Number(fields?.rating) === star}
                  onChange={() => setRating(star)}
                  required
                  className="sr-only"
                  aria-label={`${star} ${star === 1 ? "star" : "stars"} — ${LABELS[star]}`}
                />
                <Icon
                  name="star"
                  className={cn(
                    "size-8 transition",
                    star <= shown ? "fill-amber text-amber" : "text-line-strong",
                  )}
                />
              </label>
            ))}
          </div>
          <span className="text-sm text-muted" aria-hidden="true">
            {LABELS[shown]}
          </span>
        </div>
      </fieldset>

      <Field
        label="Your review"
        htmlFor="review-body"
        hint={`Shown on ${freelancerName}’s profile and may appear on the ${APP_NAME} homepage.`}
      >
        <Textarea
          id="review-body"
          name="body"
          rows={5}
          required
          minLength={10}
          maxLength={2000}
          placeholder="How was working together? Quality, communication, timing…"
          defaultValue={fields?.body}
        />
      </Field>

      <FormAlert state={state} />
      <SubmitButton variant="accent" className="w-full" pendingText="Posting review…">
        <Icon name="star" className="size-4" />
        Post review
      </SubmitButton>
    </form>
  );
}
