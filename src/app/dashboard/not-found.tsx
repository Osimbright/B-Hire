import Link from "next/link";
import { EmptyState, buttonStyles } from "@/components/ui";

/** notFound() inside the dashboard: keeps the top bar so there's a way back. */
export default function DashboardNotFound() {
  return (
    <EmptyState
      icon="search"
      title="We couldn’t find that"
      description="This job, profile or conversation doesn’t exist, or you don’t have access to it."
      action={
        <Link href="/dashboard" className={buttonStyles("primary")}>
          Back to dashboard
        </Link>
      }
    />
  );
}
