import type { ChatMessage } from "@/lib/types";

/*
 * Files shared in chat. They live in the private `chat-attachments` Storage
 * bucket, in the conversation's folder (see conversationFolder()); storage
 * policies let only the two people in that conversation upload or read
 * them. The size cap and the
 * type list below mirror the bucket settings in
 * supabase/migrations/20260930000000_chat_attachments.sql — change both together.
 */

export const ATTACHMENT_BUCKET = "chat-attachments";
export const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024;

const TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  ogv: "video/ogg",
  mov: "video/quicktime",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
  rtf: "application/rtf",
  txt: "text/plain",
  csv: "text/csv",
  zip: "application/zip",
};

const ALLOWED_TYPES = new Set([...Object.values(TYPE_BY_EXTENSION), "application/x-zip-compressed"]);

/** For the file picker's `accept` attribute. */
export const ATTACHMENT_ACCEPT = Object.keys(TYPE_BY_EXTENSION)
  .map((extension) => `.${extension}`)
  .join(",");

/** Pictures and videos every major browser can show inline; anything else is a download. */
const INLINE_IMAGES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"]);
const INLINE_VIDEOS = new Set(["video/mp4", "video/webm", "video/ogg", "video/quicktime"]);

export function isAllowedType(type: string) {
  return ALLOWED_TYPES.has(type);
}

export function fileExtension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/**
 * The MIME type to upload `file` as, or null if chat doesn't take it.
 * Browsers leave `file.type` empty for some formats (often Office files on
 * Windows), so fall back to the extension.
 */
export function resolveAttachmentType(file: Pick<File, "name" | "type">): string | null {
  if (isAllowedType(file.type)) return file.type;
  return TYPE_BY_EXTENSION[fileExtension(file.name)] ?? null;
}

/** Why `file` can't be attached, or null if it can. */
export function attachmentProblem(file: Pick<File, "name" | "type" | "size">): string | null {
  if (!resolveAttachmentType(file)) {
    return "That file type isn’t supported. Share pictures, videos, PDFs, Office documents, text files or zips.";
  }
  if (file.size > MAX_ATTACHMENT_BYTES) return `“${file.name}” is over the 50 MB limit.`;
  if (file.size === 0) return `“${file.name}” is empty.`;
  return null;
}

export type AttachmentKind = "image" | "video" | "file";

export function attachmentKind(type: string | null | undefined): AttachmentKind {
  if (type && INLINE_IMAGES.has(type)) return "image";
  if (type && INLINE_VIDEOS.has(type)) return "video";
  return "file";
}

/** Cleans a user-supplied file name for display and download. */
export function cleanFileName(name: string) {
  const cleaned = name.replace(/[\u0000-\u001f\u007f/\\]/g, "").trim();
  return (cleaned || "file").slice(-255);
}

/** A fresh, collision-free Storage path inside the conversation's folder. */
export function newAttachmentPath(folder: string, name: string) {
  const extension = fileExtension(name).replace(/[^a-z0-9]/g, "").slice(0, 10);
  return `${folder}/${crypto.randomUUID()}${extension ? `.${extension}` : ""}`;
}

/** Where the chat loads a message's file from; `download` asks for a save-as. */
export function attachmentUrl(messageId: string, download = false) {
  return `/dashboard/messages/files/${messageId}${download ? "?download=1" : ""}`;
}

/** "840 KB", "12.4 MB". */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

/** Short stand-in for a file-only message in the conversation list: "Photo", "Video", "report.pdf". */
export function attachmentLabel(message: Pick<ChatMessage, "attachment_name" | "attachment_type">) {
  const kind = attachmentKind(message.attachment_type);
  if (kind === "image") return "Photo";
  if (kind === "video") return "Video";
  return message.attachment_name ?? "File";
}
