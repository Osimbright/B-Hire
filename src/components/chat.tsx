"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { getMessages, sendMessage, type UploadedAttachment } from "@/actions/messages";
import { Icon } from "@/components/icons";
import { MESSAGES_CHANGED } from "@/components/messages/events";
import { Avatar, iconButtonStyles } from "@/components/ui";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_BUCKET,
  attachmentKind,
  attachmentProblem,
  attachmentUrl,
  fileExtension,
  formatBytes,
  newAttachmentPath,
  resolveAttachmentType,
} from "@/lib/attachments";
import { conversationFolder, type ConversationRef } from "@/lib/conversations";
import { formatClockTime, formatDayLabel } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 3000;

/** Combine two message lists without duplicates, oldest first. */
function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

function localDay(value: string) {
  return new Date(value).toDateString();
}

/** A file picked for the next message, with a local preview if it's a picture. */
type Attached = { file: File; previewUrl: string | null };

/**
 * The right-hand pane of the messenger: who you're talking to, the message
 * history and the composer. `info` is the contact panel that slides in when
 * the header is clicked.
 */
export function Chat({
  conversation,
  currentUserId,
  otherName,
  otherAvatarPath,
  subtitle,
  info,
  initialMessages,
}: {
  conversation: ConversationRef;
  currentUserId: string;
  otherName: string;
  otherAvatarPath: string | null;
  subtitle: ReactNode;
  info: ReactNode;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [attached, setAttached] = useState<Attached | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Mark the chat read now, then check for new replies every few seconds while the tab is visible.
  useEffect(() => {
    let cancelled = false;
    let polling = false;
    let lastSeenId: string | undefined;
    async function poll() {
      // Server actions run one at a time, so overlapping polls would queue up
      // in front of the user's own sends. Skip a tick while one is in flight.
      if (polling) return;
      polling = true;
      try {
        const latest = await getMessages(conversation);
        if (cancelled) return;
        setMessages((prev) => mergeMessages(prev, latest));
        // Refresh the conversation list on first open (unread → read) and when something new arrives.
        const newestId = latest.at(-1)?.id ?? "";
        if (newestId !== lastSeenId) {
          lastSeenId = newestId;
          window.dispatchEvent(new Event(MESSAGES_CHANGED));
        }
      } catch {
        // Temporary network hiccup; try again on the next tick.
      } finally {
        polling = false;
      }
    }
    poll();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [conversation]);

  // Keep the newest message in view.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  // Free the picture preview when leaving the chat.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  /** Set (or clear) the file for the next message, swapping its preview. */
  function replaceAttached(file: File | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const previewUrl =
      file && attachmentKind(resolveAttachmentType(file)) === "image" ? URL.createObjectURL(file) : null;
    previewUrlRef.current = previewUrl;
    setAttached(file ? { file, previewUrl } : null);
  }

  function attach(files: FileList | File[] | null | undefined) {
    const file = files?.[0];
    if (!file || sending) return;
    const problem = attachmentProblem(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    replaceAttached(file);
  }

  // A plain flag rather than useTransition: the chat and conversation-list polls
  // are server actions too, and while they keep arriving a transition's
  // isPending never settles, which left the composer stuck on "sending".
  async function send() {
    const body = draft.trim();
    const file = attached?.file;
    if ((!body && !file) || sending) return;
    setError(null);
    setDraft("");
    setSending(true);
    try {
      let attachment: UploadedAttachment | undefined;
      if (file) {
        // Straight from the browser to Storage, so big videos don't pass through our server.
        const path = newAttachmentPath(conversationFolder(conversation), file.name);
        const { error: uploadError } = await createClient()
          .storage.from(ATTACHMENT_BUCKET)
          .upload(path, file, { contentType: resolveAttachmentType(file) ?? undefined, upsert: false });
        if (uploadError) {
          setError(`Couldn’t upload “${file.name}”: ${uploadError.message}`);
          setDraft(body);
          return;
        }
        attachment = { path, name: file.name };
      }

      const result = await sendMessage(conversation, body, attachment);
      if (result.message) {
        const sent = result.message;
        setMessages((prev) => mergeMessages(prev, [sent]));
        if (file) replaceAttached(null);
        window.dispatchEvent(new Event(MESSAGES_CHANGED));
      } else {
        setError(result.error ?? "Message not sent.");
        setDraft(body);
      }
    } catch {
      setError("Message not sent — check your connection and try again.");
      setDraft(body);
    } finally {
      setSending(false);
    }
  }

  const hasFiles = (event: DragEvent) => event.dataTransfer.types.includes("Files");

  return (
    <div className="relative flex min-h-0 flex-1">
      <div
        className="relative flex min-w-0 flex-1 flex-col"
        onDragEnter={(event) => {
          if (!hasFiles(event)) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          if (!hasFiles(event)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(event) => {
          // Only when the pointer leaves the chat, not when it moves between children.
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(event) => {
          if (!hasFiles(event)) return;
          event.preventDefault();
          setDragging(false);
          attach(event.dataTransfer.files);
        }}
      >
        {/* Header */}
        <header className="flex items-center gap-2 border-b border-line bg-surface px-3 py-2.5 sm:px-4">
          <Link
            href="/dashboard/messages"
            className={iconButtonStyles("ring-0! md:hidden")}
            aria-label="Back to all chats"
          >
            <Icon name="arrowLeft" className="size-[18px]" />
          </Link>
          <button
            type="button"
            onClick={() => setInfoOpen((open) => !open)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-1.5 py-1 text-left transition hover:bg-canvas-soft"
            aria-expanded={infoOpen}
            aria-controls="contact-info"
          >
            <Avatar name={otherName} src={otherAvatarPath} />
            <span className="min-w-0">
              <span className="block truncate font-semibold tracking-tight text-fg">{otherName}</span>
              <span className="block truncate text-xs text-muted">{subtitle}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setInfoOpen((open) => !open)}
            className={iconButtonStyles(infoOpen ? "bg-fg! text-canvas! ring-fg!" : undefined)}
            aria-label={infoOpen ? "Hide contact info" : "Show contact info"}
            aria-expanded={infoOpen}
            aria-controls="contact-info"
          >
            <Icon name="info" className="size-[18px]" />
          </button>
        </header>

        {/* Messages */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto bg-canvas-soft bg-[radial-gradient(var(--color-line-soft)_1px,transparent_1px)] bg-size-[18px_18px] px-3 py-4 sm:px-6"
        >
          {messages.length === 0 ? (
            <div className="grid h-full place-items-center">
              <div className="max-w-xs rounded-2xl bg-surface px-5 py-4 text-center text-sm leading-6 text-muted ring-1 ring-line">
                <p className="font-medium text-fg">Say hello to {otherName}</p>
                <p className="mt-1">Messages and files are only visible to the two of you.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((message, index) => {
                const mine = message.sender_id === currentUserId;
                const previous = messages[index - 1];
                const newDay = !previous || localDay(previous.created_at) !== localDay(message.created_at);
                const firstInGroup = newDay || previous.sender_id !== message.sender_id;
                const time = <Timestamp value={message.created_at} mine={mine} />;
                return (
                  <Fragment key={message.id}>
                    {newDay && (
                      <div className="flex justify-center py-3">
                        <span
                          suppressHydrationWarning
                          className="rounded-full bg-surface px-3 py-1 text-[11px] font-medium text-muted ring-1 ring-line"
                        >
                          {formatDayLabel(message.created_at)}
                        </span>
                      </div>
                    )}
                    <div className={cn("flex", mine ? "justify-end" : "justify-start", firstInGroup && "pt-2")}>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl text-sm shadow-[0_1px_0_rgba(25,26,22,0.06)] sm:max-w-[70%]",
                          message.attachment_path ? "p-1.5" : "px-3.5 py-2",
                          mine ? "bg-ink text-bone" : "bg-surface text-fg ring-1 ring-line",
                          firstInGroup && (mine ? "rounded-tr-md" : "rounded-tl-md"),
                        )}
                      >
                        {message.attachment_path && <MessageAttachment message={message} mine={mine} />}
                        {message.body ? (
                          <p
                            className={cn(
                              "whitespace-pre-wrap break-words leading-6",
                              message.attachment_path && "px-2 pb-0.5 pt-1.5",
                            )}
                          >
                            {message.body}
                            {time}
                          </p>
                        ) : (
                          <p className="flow-root px-2 pb-1 pt-0.5 leading-none">{time}</p>
                        )}
                      </div>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          className="border-t border-line bg-surface px-3 py-2.5 sm:px-4"
        >
          {error && (
            <p role="alert" className="mb-2 px-2 text-sm text-clay">
              {error}
            </p>
          )}
          {attached && (
            <AttachedFile attached={attached} uploading={sending} onRemove={() => replaceAttached(null)} />
          )}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className={iconButtonStyles("size-11 disabled:opacity-50")}
              aria-label="Attach a picture, video or document"
              title="Attach a file"
            >
              <Icon name="paperclip" className="size-[18px]" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ATTACHMENT_ACCEPT}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(event) => {
                attach(event.target.files);
                // Allow picking the same file again after removing it.
                event.target.value = "";
              }}
            />
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                // Enter sends, Shift+Enter adds a new line.
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  send();
                }
              }}
              onPaste={(event) => {
                // Pasting a screenshot or copied file attaches it.
                if (event.clipboardData.files.length > 0) {
                  event.preventDefault();
                  attach(event.clipboardData.files);
                }
              }}
              rows={1}
              maxLength={4000}
              placeholder={attached ? "Add a caption" : "Type a message"}
              aria-label={`Message ${otherName}`}
              className="field-sizing-content block max-h-40 min-h-11 w-full resize-none rounded-3xl border-0 bg-canvas-soft px-4 py-2.5 text-sm leading-6 text-fg ring-1 ring-inset ring-line-soft placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-fg"
            />
            <button
              type="submit"
              disabled={sending || (!draft.trim() && !attached)}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-zest text-ink transition hover:bg-zest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:opacity-50"
              aria-label="Send message"
            >
              <Icon name="send" className="size-[18px]" />
            </button>
          </div>
        </form>

        {dragging && (
          <div className="pointer-events-none absolute inset-2 z-20 grid place-items-center rounded-3xl border-2 border-dashed border-fg/40 bg-surface/85 backdrop-blur-sm">
            <p className="flex items-center gap-2 text-sm font-medium text-fg">
              <Icon name="paperclip" className="size-5" />
              Drop to attach
            </p>
          </div>
        )}
      </div>

      {/* Contact info: a side column on wide screens, an overlay on narrow ones */}
      {infoOpen && (
        <aside
          id="contact-info"
          className="absolute inset-0 z-10 flex flex-col bg-surface xl:static xl:w-80 xl:shrink-0 xl:border-l xl:border-line"
        >
          <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
            <button
              type="button"
              onClick={() => setInfoOpen(false)}
              className={iconButtonStyles("ring-0!")}
              aria-label="Close contact info"
            >
              <Icon name="x" className="size-[18px]" />
            </button>
            <p className="font-semibold tracking-tight text-fg">Contact info</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {info}
            <SharedFiles messages={messages} />
          </div>
        </aside>
      )}
    </div>
  );
}

function Timestamp({ value, mine }: { value: string; mine: boolean }) {
  return (
    // Local time differs between server and browser, so skip the hydration check.
    <time
      suppressHydrationWarning
      dateTime={value}
      className={cn(
        "float-right ml-3 mt-2 translate-y-1 text-[10px] leading-none",
        mine ? "text-ink-muted" : "text-faint",
      )}
    >
      {formatClockTime(value)}
      {mine && <Icon name="check" className="ml-1 inline size-3 text-zest" />}
    </time>
  );
}

/** A picture or video shows inline; any other file is a card that downloads it. */
function MessageAttachment({ message, mine }: { message: ChatMessage; mine: boolean }) {
  const name = message.attachment_name ?? "File";
  const kind = attachmentKind(message.attachment_type);

  if (kind === "image") {
    return (
      <a
        href={attachmentUrl(message.id)}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-xl"
        title={`Open ${name}`}
      >
        {/* A signed Storage link behind a redirect, so next/image's optimiser doesn't apply. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachmentUrl(message.id)}
          alt={name}
          loading="lazy"
          className="aspect-[4/3] w-64 bg-canvas-soft object-cover transition hover:opacity-90 sm:w-72"
        />
      </a>
    );
  }

  if (kind === "video") {
    return (
      <video
        src={attachmentUrl(message.id)}
        controls
        playsInline
        preload="metadata"
        aria-label={name}
        className="aspect-video w-64 rounded-xl bg-ink sm:w-80"
      />
    );
  }

  return (
    <a
      href={attachmentUrl(message.id, true)}
      className={cn(
        "flex w-64 items-center gap-3 rounded-xl px-3 py-2.5 transition sm:w-72",
        mine ? "bg-bone/10 hover:bg-bone/15" : "bg-canvas-soft ring-1 ring-line-soft hover:ring-line-strong",
      )}
      title={`Download ${name}`}
    >
      <FileBadge name={name} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        <span className={cn("block text-xs", mine ? "text-ink-muted" : "text-muted")}>
          {message.attachment_size != null && formatBytes(message.attachment_size)}
        </span>
      </span>
      <Icon name="download" className="size-4 shrink-0 opacity-70" />
    </a>
  );
}

/** The file's extension in a little tile: "PDF", "DOCX". */
function FileBadge({ name }: { name: string }) {
  const extension = fileExtension(name).slice(0, 4).toUpperCase() || "FILE";
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-zest text-[10px] font-bold tracking-wide text-ink">
      {extension}
    </span>
  );
}

/** The picked file above the composer, before it's sent. */
function AttachedFile({
  attached,
  uploading,
  onRemove,
}: {
  attached: Attached;
  uploading: boolean;
  onRemove: () => void;
}) {
  const { file, previewUrl } = attached;
  const kind = attachmentKind(resolveAttachmentType(file));
  return (
    <div className="mb-2 flex items-center gap-3 rounded-2xl bg-canvas-soft p-2 pr-3 ring-1 ring-line-soft">
      {previewUrl ? (
        // A local blob: URL for the preview.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
      ) : kind === "video" ? (
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-ink text-bone">
          <Icon name="video" className="size-5" />
        </span>
      ) : (
        <FileBadge name={file.name} />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{file.name}</p>
        <p className={cn("text-xs text-muted", uploading && "animate-pulse")}>
          {uploading ? "Uploading…" : formatBytes(file.size)}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={uploading}
        className={iconButtonStyles("size-8 disabled:opacity-50")}
        aria-label={`Remove ${file.name}`}
      >
        <Icon name="x" className="size-4" />
      </button>
    </div>
  );
}

/** Everything shared in the conversation, for the contact-info panel. */
function SharedFiles({ messages }: { messages: ChatMessage[] }) {
  const files = messages.filter((m) => m.attachment_path).reverse();
  const media = files.filter((m) => attachmentKind(m.attachment_type) !== "file");
  const documents = files.filter((m) => attachmentKind(m.attachment_type) === "file");

  return (
    <section className="border-t border-line-soft px-6 py-5">
      <h3 className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
        Shared files{files.length > 0 && ` · ${files.length}`}
      </h3>
      {files.length === 0 ? (
        <p className="text-sm leading-6 text-muted">
          Pictures, videos and documents you send each other will show up here.
        </p>
      ) : (
        <div className="space-y-3">
          {media.length > 0 && (
            <ul className="grid grid-cols-3 gap-1.5">
              {media.map((message) => (
                <li key={message.id}>
                  <a
                    href={attachmentUrl(message.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block aspect-square overflow-hidden rounded-lg bg-canvas-soft ring-1 ring-line-soft"
                    title={message.attachment_name ?? undefined}
                  >
                    {attachmentKind(message.attachment_type) === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={attachmentUrl(message.id)}
                        alt={message.attachment_name ?? ""}
                        loading="lazy"
                        className="size-full object-cover transition hover:opacity-90"
                      />
                    ) : (
                      <span className="grid size-full place-items-center bg-ink text-bone">
                        <Icon name="video" className="size-5" />
                        <span className="sr-only">{message.attachment_name}</span>
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {documents.length > 0 && (
            <ul className="space-y-1.5">
              {documents.map((message) => (
                <li key={message.id}>
                  <a
                    href={attachmentUrl(message.id, true)}
                    className="flex items-center gap-3 rounded-xl bg-canvas-soft px-2.5 py-2 ring-1 ring-line-soft transition hover:ring-line-strong"
                  >
                    <FileBadge name={message.attachment_name ?? ""} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg">{message.attachment_name}</span>
                      <span className="block text-xs text-muted">
                        {message.attachment_size != null && formatBytes(message.attachment_size)}
                      </span>
                    </span>
                    <Icon name="download" className="size-4 shrink-0 text-faint" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
