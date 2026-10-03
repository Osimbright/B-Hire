import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { EmptyState, buttonStyles } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password" };

/** Reached from the reset email via /auth/confirm, which signs the user in. */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email as string | undefined;

  if (!data?.claims.sub) {
    return (
      <EmptyState
        icon="clock"
        title="This link has expired"
        description="Password reset links work once and expire after an hour. Request a new one to continue."
        action={
          <Link href="/forgot-password" className={buttonStyles("accent")}>
            Request a new link
          </Link>
        }
      />
    );
  }

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-fg">Choose a new password</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        {email ? (
          <>
            For <span className="font-medium text-fg">{email}</span>. You&rsquo;ll log in with it next.
          </>
        ) : (
          "You’ll log in with it next."
        )}
      </p>
      <div className="mt-8">
        <ResetPasswordForm />
      </div>
    </>
  );
}
