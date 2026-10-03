import { isUuid } from "@/lib/utils";

/*
 * Two kinds of conversation share the chat UI:
 *   - job:    a job's client and one freelancer who sent a proposal on it
 *             (`messages`, files under `<job_id>/<freelancer_id>/…`);
 *   - direct: a client who messaged a freelancer from their profile, before
 *             or without a job (`direct_messages`, files under
 *             `direct/<client_id>/<freelancer_id>/…`). The client writes first.
 */
export type ConversationRef =
  | { kind: "job"; jobId: string; freelancerId: string }
  | { kind: "direct"; clientId: string; freelancerId: string };

export function conversationHref(ref: ConversationRef) {
  return ref.kind === "job"
    ? `/dashboard/messages/${ref.jobId}/${ref.freelancerId}`
    : `/dashboard/messages/direct/${ref.clientId}/${ref.freelancerId}`;
}

/** The Storage folder the conversation's files go in, without a trailing slash. */
export function conversationFolder(ref: ConversationRef) {
  return ref.kind === "job"
    ? `${ref.jobId}/${ref.freelancerId}`
    : `direct/${ref.clientId}/${ref.freelancerId}`;
}

/** Checks a conversation reference that came from the browser. */
export function isConversationRef(value: unknown): value is ConversationRef {
  if (typeof value !== "object" || value === null) return false;
  const ref = value as Record<string, unknown>;
  if (!isUuid(ref.freelancerId)) return false;
  if (ref.kind === "job") return isUuid(ref.jobId);
  if (ref.kind === "direct") return isUuid(ref.clientId);
  return false;
}
