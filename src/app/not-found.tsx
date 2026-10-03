import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo, buttonStyles } from "@/components/ui";

export const metadata: Metadata = { title: "Page not found" };

/** Any URL the app doesn't know, plus notFound() outside the dashboard. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas px-6 py-8 sm:px-12">
      <div className="flex items-center justify-between gap-4">
        <Logo />
        <ThemeToggle />
      </div>

      <main className="flex flex-1 items-center justify-center py-16">
        <div className="max-w-lg text-center">
          <p className="tabular font-serif text-[clamp(6rem,18vw,10rem)] leading-none tracking-[-0.04em] text-fg">
            404
          </p>
          <h1 className="mt-6 text-3xl font-semibold tracking-[-0.035em] text-fg sm:text-4xl">
            This page <em className="font-serif font-normal">wandered off</em>
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-[15px] leading-7 text-muted">
            The link may be broken, or the page may have been moved or removed.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className={buttonStyles("accent", "lg")}>
              <Icon name="arrowLeft" className="size-4" />
              Back to home
            </Link>
            <Link href="/dashboard" className={buttonStyles("secondary", "lg")}>
              Go to my dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
