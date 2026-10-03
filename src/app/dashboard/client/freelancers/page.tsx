import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { FreelancerCard } from "@/components/freelancer-card";
import { Icon } from "@/components/icons";
import { EmptyState, Input, PageHeader, Pill, buttonStyles } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import * as db from "@/lib/db";

export const metadata: Metadata = { title: "Find freelancers" };

export default async function FreelancersPage(props: PageProps<"/dashboard/client/freelancers">) {
  await requireProfile("client");
  const { q } = await props.searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const freelancers = await db.listFreelancers(query);

  const rates = freelancers.map((f) => f.hourly_rate).filter((rate): rate is number => rate != null);
  const median = rates.length ? [...rates].sort((a, b) => a - b)[Math.floor(rates.length / 2)] : null;

  return (
    <>
      <PageHeader
        size="display"
        title="Freelancers"
        description="Browse profiles by skill, rate and portfolio."
        meta={
          <>
            <Pill icon="users">{freelancers.length} profiles</Pill>
            {median != null && <Pill icon="coins">Median ${median}/hr</Pill>}
          </>
        }
        action={
          // Keyed on the query so "Clear search" also resets the (uncontrolled) input.
          <Form key={query} action="/dashboard/client/freelancers" className="flex gap-2" role="search">
            <div className="relative">
              <Icon
                name="search"
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-faint"
              />
              <Input
                name="q"
                defaultValue={query}
                placeholder="Name, skill or keyword"
                aria-label="Search freelancers"
                className="pl-10! sm:w-64"
              />
            </div>
            <button type="submit" className={buttonStyles("primary")}>
              Search
            </button>
          </Form>
        }
      />

      {freelancers.length === 0 ? (
        <EmptyState
          icon="users"
          title={query ? "No matches" : "No freelancers yet"}
          description={
            query
              ? `Nobody matches “${query}”. Try a different skill or keyword.`
              : "Freelancer profiles will show up here as people sign up."
          }
          action={
            query && (
              <Link href="/dashboard/client/freelancers" className={buttonStyles("secondary")}>
                Clear search
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {freelancers.map((freelancer) => (
            <FreelancerCard
              key={freelancer.id}
              freelancer={freelancer}
              href={`/dashboard/client/freelancers/${freelancer.id}`}
            />
          ))}
        </div>
      )}
    </>
  );
}
