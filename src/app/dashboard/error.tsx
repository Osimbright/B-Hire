"use client";

import { useEffect } from "react";
import { Icon } from "@/components/icons";
import { buttonStyles } from "@/components/ui";

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-3xl bg-surface px-6 py-20 text-center ring-1 ring-line">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-ink text-clay">
        <Icon name="bolt" />
      </div>
      <h2 className="mt-5 text-xl font-semibold tracking-tight text-fg">Something went wrong</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        We couldn&rsquo;t load this page. Please try again.
      </p>
      <button type="button" onClick={() => retry()} className={buttonStyles("primary", "md", "mt-7")}>
        Try again
      </button>
    </div>
  );
}
