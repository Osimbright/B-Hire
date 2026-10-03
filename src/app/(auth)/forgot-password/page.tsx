import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import { Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage(props: PageProps<"/forgot-password">) {
  const { error } = await props.searchParams;

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-fg">Forgot your password?</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Enter the email you signed up with and we&rsquo;ll send you a link to choose a new one.
      </p>

      {error === "expired" && (
        <Alert tone="error" className="mt-6">
          That reset link is invalid or has expired. Request a new one below, and open it in this same browser.
        </Alert>
      )}

      <div className="mt-8">
        <ForgotPasswordForm />
      </div>

      <p className="mt-6 text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-fg underline underline-offset-4 hover:text-zest-ink">
          Back to log in
        </Link>
      </p>
    </>
  );
}
