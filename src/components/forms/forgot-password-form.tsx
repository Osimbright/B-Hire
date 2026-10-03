"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { Field, FormAlert, Input } from "@/components/ui";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined);

  return (
    <form action={action} className="space-y-5">
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.fields?.email}
        />
      </Field>
      <FormAlert state={state} />
      <SubmitButton variant="accent" className="w-full" pendingText="Sending link…">
        Send reset link
      </SubmitButton>
    </form>
  );
}
