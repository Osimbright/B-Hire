"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/actions/auth";
import { RolePicker } from "@/components/forms/role-picker";
import { SubmitButton } from "@/components/submit-button";
import { Field, FormAlert, Input } from "@/components/ui";
import type { Role } from "@/lib/types";

export function LoginForm({ next, defaultRole }: { next?: string; defaultRole?: Role }) {
  const [state, action] = useActionState(login, undefined);
  const fields = state?.fields;

  return (
    <form action={action} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <RolePicker legend="Log in as…" defaultRole={fields?.role ?? defaultRole} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={fields?.email} />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <div className="-mt-3 text-right">
        <Link href="/forgot-password" className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
          Forgot password?
        </Link>
      </div>
      <FormAlert state={state} />
      <SubmitButton variant="accent" className="w-full" pendingText="Logging in…">
        Log in
      </SubmitButton>
    </form>
  );
}
