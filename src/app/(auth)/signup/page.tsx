import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/forms/signup-form";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage(props: PageProps<"/signup">) {
  const { role } = await props.searchParams;
  const defaultRole = role === "client" || role === "freelancer" ? role : undefined;

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-fg">Create your account</h1>
      <p className="mt-2 text-sm text-muted">
        Already have one?{" "}
        <Link href="/login" className="font-medium text-fg underline underline-offset-4 hover:text-zest-ink">
          Log in
        </Link>
      </p>
      <div className="mt-8">
        <SignupForm defaultRole={defaultRole} />
      </div>
    </>
  );
}
