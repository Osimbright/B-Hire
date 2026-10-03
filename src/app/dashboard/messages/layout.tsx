import { MessagesShell } from "@/components/messages/messages-shell";
import { requireProfile } from "@/lib/auth";
import * as db from "@/lib/db";

/** Keeps the conversation list mounted while the chat on the right changes. */
export default async function MessagesLayout({ children }: LayoutProps<"/dashboard/messages">) {
  const profile = await requireProfile();
  const threads = await db.listThreads(profile.id);

  return (
    <MessagesShell role={profile.role} currentUserId={profile.id} initialThreads={threads}>
      {children}
    </MessagesShell>
  );
}
