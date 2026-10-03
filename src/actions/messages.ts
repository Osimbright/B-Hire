"use server";

import { cleanFileName, isAllowedType } from "@/lib/attachments";
import { requireProfile } from "@/lib/auth";
import { conversationFolder, isConversationRef, type ConversationRef } from "@/lib/conversations";
import * as db from "@/lib/db";
import type { ChatMessage } from "@/lib/types";

/** A file the browser has already uploaded to the conversation's Storage folder. */
export type UploadedAttachment = { path: string; name: string };

/** Whether `userId` is part of the conversation (and, for a direct one, may see it yet). */
async function canUse(conversation: ConversationRef, userId: string) {
  const found =
    conversation.kind === "job"
      ? await db.getConversation(conversation.jobId, conversation.freelancerId, userId)
      : await db.getDirectConversation(conversation.clientId, conversation.freelancerId, userId);
  return found !== null;
}

async function markRead(conversation: ConversationRef, userId: string) {
  if (conversation.kind === "job") {
    await db.markConversationRead(userId, conversation.jobId, conversation.freelancerId);
  } else {
    await db.markDirectConversationRead(userId, conversation.clientId, conversation.freelancerId);
  }
}

/**
 * Send a message in the conversation, if the user is part of it.
 * The text may be empty when a file is attached.
 */
export async function sendMessage(
  conversation: ConversationRef,
  body: string,
  attachment?: UploadedAttachment,
): Promise<{ message?: ChatMessage; error?: string }> {
  const profile = await requireProfile();
  const text = body.trim();

  if (!isConversationRef(conversation)) return { error: "Unknown conversation." };
  if (!text && !attachment) return { error: "Message can’t be empty." };
  if (text.length > 4000) return { error: "Message is too long (4,000 characters max)." };
  if (!(await canUse(conversation, profile.id))) {
    return { error: "You can’t send messages in this conversation." };
  }

  let file: Pick<ChatMessage, "attachment_path" | "attachment_name" | "attachment_type" | "attachment_size"> | undefined;
  if (attachment) {
    // Only a file directly inside this conversation's folder…
    const folder = `${conversationFolder(conversation)}/`;
    const path = String(attachment.path);
    const key = path.slice(folder.length);
    if (!path.startsWith(folder) || !key || key.includes("/") || key.includes("..")) {
      return { error: "That file doesn’t belong to this conversation." };
    }
    // …that really was uploaded. Size and type come from Storage, not the browser.
    const info = await db.getAttachmentInfo(path);
    if (!info) return { error: "The file didn’t finish uploading. Please try again." };
    if (!isAllowedType(info.type)) return { error: "That file type isn’t supported." };

    file = {
      attachment_path: path,
      attachment_name: cleanFileName(String(attachment.name)),
      attachment_type: info.type,
      attachment_size: info.size,
    };
  }

  const message =
    conversation.kind === "job"
      ? await db.createMessage({
          job_id: conversation.jobId,
          freelancer_id: conversation.freelancerId,
          sender_id: profile.id,
          body: text,
          ...file,
        })
      : await db.createDirectMessage({
          client_id: conversation.clientId,
          freelancer_id: conversation.freelancerId,
          sender_id: profile.id,
          body: text,
          ...file,
        });
  await markRead(conversation, profile.id);
  return { message };
}

/**
 * Latest messages in a conversation — polled by the open chat for new
 * replies. The chat is on screen when it polls, so this also marks it read.
 */
export async function getMessages(conversation: ConversationRef): Promise<ChatMessage[]> {
  const profile = await requireProfile();
  if (!isConversationRef(conversation)) return [];
  if (!(await canUse(conversation, profile.id))) return [];
  await markRead(conversation, profile.id);
  return conversation.kind === "job"
    ? db.listMessages(conversation.jobId, conversation.freelancerId)
    : db.listDirectMessages(conversation.clientId, conversation.freelancerId);
}

/** The signed-in user's conversation list — polled by the messages sidebar. */
export async function getThreads(): Promise<db.Thread[]> {
  const profile = await requireProfile();
  return db.listThreads(profile.id);
}
