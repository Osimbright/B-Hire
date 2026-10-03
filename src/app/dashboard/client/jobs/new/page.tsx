import type { Metadata } from "next";
import { JobForm } from "@/components/forms/job-form";
import { Card, PageHeader, Pill } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { todayISO } from "@/lib/format";

export const metadata: Metadata = { title: "Post a job" };

export default async function NewJobPage() {
  await requireProfile("client");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ href: "/dashboard/client", label: "Overview" }}
        title="Post a job"
        description="Clear, specific jobs get better proposals. Name the deliverable and the budget."
        meta={<Pill icon="clock">Takes about two minutes</Pill>}
      />
      <Card className="p-7">
        <JobForm minDeadline={todayISO()} />
      </Card>
    </div>
  );
}
