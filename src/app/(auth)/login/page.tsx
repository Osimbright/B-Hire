import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";
import { Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const { next, role, reset } = await props.searchParams;

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-fg">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-medium text-fg underline underline-offset-4 hover:text-zest-ink">
          Create an account
        </Link>
      </p>

      {reset === "1" && (
        <Alert tone="success" className="mt-6">
          Your password has been updated. Log in with your new password.
        </Alert>
      )}

      <div className="mt-8">
        <LoginForm
          next={typeof next === "string" ? next : undefined}
          defaultRole={role === "client" || role === "freelancer" ? role : undefined}
        />
      </div>
    </>
  );
}
