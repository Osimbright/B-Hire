"use client";

import { useActionState } from "react";
import { updatePassword } from "@/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { Field, FormAlert, Input } from "@/components/ui";

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, undefined);

  return (
    <form action={action} className="space-y-5">
      <Field label="New password" htmlFor="password" hint="At least 8 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <FormAlert state={state} />
      <SubmitButton variant="accent" className="w-full" pendingText="Saving…">
        Set new password
      </SubmitButton>
    </form>
  );
}
