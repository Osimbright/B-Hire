"use client";

import { useActionState } from "react";
import { signup } from "@/actions/auth";
import { RolePicker } from "@/components/forms/role-picker";
import { SubmitButton } from "@/components/submit-button";
import { Field, FormAlert, Input } from "@/components/ui";
import type { Role } from "@/lib/types";

export function SignupForm({ defaultRole }: { defaultRole?: Role }) {
  const [state, action] = useActionState(signup, undefined);
  const fields = state?.fields;

  return (
    <form action={action} className="space-y-5">
      <RolePicker legend="I want to join as…" defaultRole={fields?.role ?? defaultRole} />
      <Field label="Full name" htmlFor="full_name">
        <Input id="full_name" name="full_name" autoComplete="name" required defaultValue={fields?.full_name} />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={fields?.email} />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <FormAlert state={state} />
      <SubmitButton variant="accent" className="w-full" pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
