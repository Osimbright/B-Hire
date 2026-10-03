import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Chat } from "@/components/chat";
import { Icon } from "@/components/icons";
import { ContactInfo, InfoSection } from "@/components/messages/contact-info";
import { StatusBadge } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import * as db from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Conversation" };

export default async function ConversationPage(
  props: PageProps<"/dashboard/messages/[jobId]/[freelancerId]">,
) {
  const { jobId, freelancerId } = await props.params;
  if (!isUuid(jobId) || !isUuid(freelancerId)) notFound();

  const profile = await requireProfile();
  // Only the job's client and a freelancer who applied can open the conversation.
  const conversation = await db.getConversation(jobId, freelancerId, profile.id);
  if (!conversation) notFound();

  const { job, proposal, freelancer_name, other } = conversation;
  const isClient = job.client_id === profile.id;
  const otherName = (isClient ? freelancer_name : job.client_name) || "Unnamed user";
  const jobHref = isClient ? `/dashboard/client/jobs/${job.id}` : `/dashboard/freelancer/jobs/${job.id}`;
  const [messages, freelancer] = await Promise.all([
    db.listMessages(jobId, freelancerId),
    isClient ? db.getFreelancerProfile(freelancerId) : null,
  ]);

  const info = (
    <ContactInfo
      name={otherName}
      role={isClient ? "freelancer" : "client"}
      other={other}
      freelancer={freelancer}
      profileHref={isClient ? `/dashboard/client/freelancers/${freelancerId}` : undefined}
    >
      <InfoSection title="This conversation is about">
        <Link
          href={jobHref}
          className="group block rounded-2xl bg-canvas-soft p-4 ring-1 ring-line transition hover:ring-line-strong"
        >
          <p className="flex items-start justify-between gap-2 text-sm font-medium text-fg">
            {job.title}
            <Icon name="arrowUpRight" className="mt-0.5 size-3.5 shrink-0 text-faint group-hover:text-fg" />
          </p>
          <p className="tabular mt-1 text-xs text-muted">
            Budget {formatMoney(job.budget)} · Bid {formatMoney(proposal.bid)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              Job <StatusBadge status={job.status} />
            </span>
            <span className="inline-flex items-center gap-1.5">
              Proposal <StatusBadge status={proposal.status} />
            </span>
          </div>
        </Link>
      </InfoSection>
    </ContactInfo>
  );

  return (
    <Chat
      key={`${jobId}/${freelancerId}`}
      conversation={{ kind: "job", jobId: job.id, freelancerId }}
      currentUserId={profile.id}
      otherName={otherName}
      otherAvatarPath={other?.avatar_path ?? null}
      subtitle={job.title}
      info={info}
      initialMessages={messages}
    />
  );
}
