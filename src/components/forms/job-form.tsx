"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createJob } from "@/actions/jobs";
import { SubmitButton } from "@/components/submit-button";
import { Field, FormAlert, Input, Select, Textarea, buttonStyles } from "@/components/ui";
import { JOB_CATEGORIES } from "@/lib/config";

export function JobForm({ minDeadline }: { minDeadline: string }) {
  const [state, action] = useActionState(createJob, undefined);
  const fields = state?.fields;

  return (
    <form action={action} className="space-y-6">
      <Field label="Job title" htmlFor="title" hint="Short and specific, e.g. “Build a Shopify storefront”.">
        <Input
          id="title"
          name="title"
          required
          minLength={3}
          maxLength={120}
          placeholder="What do you need done?"
          defaultValue={fields?.title}
        />
      </Field>

      <Field label="Description" htmlFor="description" hint="Scope, deliverables, and any must-have skills.">
        <Textarea
          id="description"
          name="description"
          rows={8}
          required
          minLength={20}
          maxLength={10000}
          defaultValue={fields?.description}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Category" htmlFor="category">
          {/* React only applies a select's defaultValue on mount, and resets the
              form after the action — so remount with the submitted category. */}
          <Select
            key={fields?.category ?? ""}
            id="category"
            name="category"
            required
            defaultValue={fields?.category ?? ""}
          >
            <option value="" disabled>
              Choose…
            </option>
            {JOB_CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </Select>
        </Field>
        <Field label="Budget (USD)" htmlFor="budget">
          <Input
            id="budget"
            name="budget"
            type="number"
            min="1"
            step="1"
            required
            placeholder="500"
            defaultValue={fields?.budget}
          />
        </Field>
        <Field label="Deadline" htmlFor="deadline">
          <Input
            id="deadline"
            name="deadline"
            type="date"
            min={minDeadline}
            required
            defaultValue={fields?.deadline}
          />
        </Field>
      </div>

      <FormAlert state={state} />

      <div className="flex justify-end gap-3 border-t border-line-soft pt-6">
        <Link href="/dashboard/client" className={buttonStyles("ghost")}>
          Cancel
        </Link>
        <SubmitButton variant="accent" pendingText="Posting…">
          Post job
        </SubmitButton>
      </div>
    </form>
  );
}
