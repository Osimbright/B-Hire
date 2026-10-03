"use client";

import { useActionState } from "react";
import { sendContactMessage } from "@/actions/contact";
import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { Field, FormAlert, Input, Textarea } from "@/components/ui";
import { CONTACT_TOPICS } from "@/lib/config";

export function ContactForm() {
  const [state, action] = useActionState(sendContactMessage, undefined);
  const fields = state?.fields;

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="contact-name">
          <Input id="contact-name" name="name" autoComplete="name" required defaultValue={fields?.name} />
        </Field>
        <Field label="Email" htmlFor="contact-email">
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={fields?.email}
          />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg">What&rsquo;s it about?</legend>
        <div className="flex flex-wrap gap-2">
          {CONTACT_TOPICS.map((topic, index) => (
            <label
              key={topic}
              className="cursor-pointer rounded-full bg-canvas px-4 py-2 text-[13px] text-muted ring-1 ring-inset ring-line transition hover:text-fg has-checked:bg-ink has-checked:text-bone has-checked:ring-fg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-fg"
            >
              <input
                type="radio"
                name="topic"
                value={topic}
                required
                defaultChecked={fields?.topic ? fields.topic === topic : index === 0}
                className="sr-only"
              />
              {topic}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Message" htmlFor="contact-message">
        <Textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          minLength={10}
          maxLength={4000}
          placeholder="Tell us a little about what you need…"
          defaultValue={fields?.message}
        />
      </Field>

      <FormAlert state={state} />

      <SubmitButton variant="primary" className="w-full" pendingText="Sending…">
        Send message
        <Icon name="send" className="size-4" />
      </SubmitButton>
    </form>
  );
}
