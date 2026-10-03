"use client";

import { useActionState } from "react";
import { submitProposal } from "@/actions/proposals";
import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { Field, FormAlert, Input, Textarea } from "@/components/ui";
import { formatMoney } from "@/lib/format";

export function ProposalForm({ jobId, budget }: { jobId: string; budget: number }) {
  const [state, action] = useActionState(submitProposal, undefined);
  const fields = state?.fields;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="job_id" value={jobId} />
      <Field
        label="Cover note"
        htmlFor="cover_note"
        hint="Why you’re a great fit, relevant experience, and how you’d approach the work."
      >
        <Textarea
          id="cover_note"
          name="cover_note"
          rows={8}
          required
          minLength={20}
          maxLength={5000}
          defaultValue={fields?.cover_note}
        />
      </Field>
      <Field label="Your bid (USD)" htmlFor="bid" hint={`Client’s budget: ${formatMoney(budget)}`}>
        <Input
          id="bid"
          name="bid"
          type="number"
          min="1"
          step="1"
          required
          defaultValue={fields?.bid ?? budget}
        />
      </Field>
      <FormAlert state={state} />
      <SubmitButton variant="accent" className="w-full" pendingText="Sending…">
        <Icon name="send" className="size-4" />
        Send proposal
      </SubmitButton>
    </form>
  );
}
