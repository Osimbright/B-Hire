import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Chat } from "@/components/chat";
import { Icon } from "@/components/icons";
import { ContactInfo, InfoSection } from "@/components/messages/contact-info";
import { buttonStyles } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import * as db from "@/lib/db";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Conversation" };

/** A client and a freelancer talking outside any job — started by the client from the freelancer's profile. */
export default async function DirectConversationPage(
  props: PageProps<"/dashboard/messages/direct/[clientId]/[freelancerId]">,
) {
  const { clientId, freelancerId } = await props.params;
  if (!isUuid(clientId) || !isUuid(freelancerId)) notFound();

  const profile = await requireProfile();
  const conversation = await db.getDirectConversation(clientId, freelancerId, profile.id);
  if (!conversation) notFound();

  const { other } = conversation;
  const isClient = profile.id === clientId;
  const otherName = other.full_name || "Unnamed user";
  const firstName = otherName.split(/\s+/)[0];
  const [messages, freelancer] = await Promise.all([
    db.listDirectMessages(clientId, freelancerId),
    isClient ? db.getFreelancerProfile(freelancerId) : null,
  ]);

  const info = (
    <ContactInfo
      name={otherName}
      role={other.role}
      other={other}
      freelancer={freelancer}
      profileHref={isClient ? `/dashboard/client/freelancers/${freelancerId}` : undefined}
    >
      {isClient ? (
        <InfoSection title="Ready to hire?">
          <p className="text-sm leading-6 text-muted">
            Post a job and ask {firstName} to send a proposal — you can accept it from the job page.
          </p>
          <Link href="/dashboard/client/jobs/new" className={buttonStyles("secondary", "md", "mt-3 w-full")}>
            <Icon name="plus" className="size-4" />
            Post a job
          </Link>
        </InfoSection>
      ) : (
        <InfoSection title="Direct message">
          <p className="text-sm leading-6 text-muted">
            {firstName} reached out after viewing your profile. This chat isn&rsquo;t tied to a job — if they post
            one, you can send a proposal as usual.
          </p>
        </InfoSection>
      )}
    </ContactInfo>
  );

  return (
    <Chat
      key={`direct/${clientId}/${freelancerId}`}
      conversation={{ kind: "direct", clientId, freelancerId }}
      currentUserId={profile.id}
      otherName={otherName}
      otherAvatarPath={other.avatar_path}
      subtitle="Direct message"
      info={info}
      initialMessages={messages}
    />
  );
}
