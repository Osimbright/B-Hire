"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getThreads } from "@/actions/messages";
import { Icon } from "@/components/icons";
import { MESSAGES_CHANGED, UNREAD_CHANGED } from "@/components/messages/events";
import { Avatar, iconButtonStyles } from "@/components/ui";
import { attachmentLabel } from "@/lib/attachments";
import type { Thread } from "@/lib/db";
import { formatThreadTime } from "@/lib/format";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 4000;

/** What the conversation is about, under the other person's name. */
function threadTopic(thread: Thread) {
  return thread.job_title ?? "Direct message";
}

/**
 * Two-pane messenger: the conversation list on the left, the open chat on the
 * right. Below `md` only one pane shows at a time — the list on
 * /dashboard/messages, the chat inside a conversation.
 */
export function MessagesShell({
  role,
  currentUserId,
  initialThreads,
  children,
}: {
  role: Role;
  currentUserId: string;
  initialThreads: Thread[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [threads, setThreads] = useState(initialThreads);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [picking, setPicking] = useState(false);

  const inConversation = pathname !== "/dashboard/messages";
  const isOpen = (thread: Thread) => pathname === thread.href;
  // The open conversation is being read right now, whatever the last poll said.
  const unreadOf = (thread: Thread) => (isOpen(thread) ? 0 : thread.unread);

  // Refresh the list every few seconds, and right away when the chat reports a change.
  useEffect(() => {
    let cancelled = false;
    let refreshing = false;
    async function refresh() {
      // Server actions run one at a time; don't let refreshes pile up in front of a send.
      if (refreshing) return;
      refreshing = true;
      try {
        const latest = await getThreads();
        if (!cancelled) setThreads(latest);
      } catch {
        // Temporary network hiccup; try again on the next tick.
      } finally {
        refreshing = false;
      }
    }
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_INTERVAL_MS);
    window.addEventListener(MESSAGES_CHANGED, refresh);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener(MESSAGES_CHANGED, refresh);
    };
  }, []);

  const unreadCount = threads.filter((t) => unreadOf(t) > 0).length;
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(UNREAD_CHANGED, { detail: unreadCount }));
  }, [unreadCount]);

  const needle = query.trim().toLowerCase();
  const matches = (thread: Thread) =>
    !needle || `${thread.other_name} ${threadTopic(thread)}`.toLowerCase().includes(needle);

  // Chats with messages, plus the open one even if nobody has written yet.
  const chats = threads
    .filter((t) => t.last || isOpen(t))
    .filter((t) => filter === "all" || unreadOf(t) > 0)
    .filter(matches);
  const contacts = threads.filter(matches).sort((a, b) => a.other_name.localeCompare(b.other_name));
  const otherLabel = role === "client" ? "freelancer" : "client";

  return (
    <div className="-mb-10 flex h-[calc(100dvh-9.5rem)] min-h-[30rem] overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
      {/* Conversation list */}
      <aside
        className={cn(
          "w-full shrink-0 flex-col border-line md:flex md:w-80 md:border-r lg:w-96",
          inConversation ? "hidden" : "flex",
        )}
      >
        <div className="border-b border-line-soft px-4 pb-3 pt-4">
          <div className="flex items-center justify-between gap-3">
            {picking ? (
              <button
                type="button"
                onClick={() => setPicking(false)}
                className="-ml-1 inline-flex items-center gap-2 rounded-full py-1 pr-2 text-lg font-semibold tracking-tight text-fg"
              >
                <Icon name="arrowLeft" className="size-5" />
                New chat
              </button>
            ) : (
              <h1 className="text-2xl font-semibold tracking-[-0.03em] text-fg">Messages</h1>
            )}
            {!picking && (
              <button
                type="button"
                onClick={() => setPicking(true)}
                className={iconButtonStyles()}
                aria-label="Start a new chat"
                title="New chat"
              >
                <Icon name="pencil" className="size-[18px]" />
              </button>
            )}
          </div>

          <div className="relative mt-3">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={picking ? `Search ${otherLabel}s` : "Search chats"}
              aria-label={picking ? `Search ${otherLabel}s` : "Search chats"}
              className="block w-full rounded-full border-0 bg-canvas-soft py-2 pl-10 pr-4 text-sm text-fg ring-1 ring-inset ring-line-soft placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-fg"
            />
          </div>

          {!picking && (
            <div className="mt-3 flex gap-1.5" role="tablist" aria-label="Filter chats">
              {(["all", "unread"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={filter === value}
                  onClick={() => setFilter(value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium capitalize transition",
                    filter === value ? "bg-fg text-canvas" : "bg-canvas-soft text-muted hover:text-fg",
                  )}
                >
                  {value}
                  {value === "unread" && unreadCount > 0 && ` · ${unreadCount}`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {picking ? (
            contacts.length === 0 ? (
              <ListNote>
                {needle
                  ? `No ${otherLabel}s match “${query.trim()}”.`
                  : role === "client"
                    ? "Freelancers you message from their profile, or who send a proposal on one of your jobs, will appear here."
                    : "Clients whose jobs you've applied to, or who message you, will appear here."}
              </ListNote>
            ) : (
              <ul>
                {contacts.map((thread) => (
                  <li key={thread.href}>
                    <Link
                      href={thread.href}
                      onClick={() => {
                        setPicking(false);
                        setQuery("");
                      }}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-canvas-soft"
                    >
                      <Avatar name={thread.other_name} src={thread.other_avatar_path} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">{thread.other_name}</p>
                        <p className="truncate text-xs text-muted">{threadTopic(thread)}</p>
                      </div>
                      <span className="shrink-0 text-xs text-faint">{thread.last ? "Open" : "Start chat"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : chats.length === 0 ? (
            <ListNote>
              {needle ? (
                `No chats match “${query.trim()}”.`
              ) : filter === "unread" ? (
                "You're all caught up."
              ) : (
                <>
                  No conversations yet.{" "}
                  <button
                    type="button"
                    onClick={() => setPicking(true)}
                    className="font-medium text-fg underline underline-offset-4"
                  >
                    Start a new chat
                  </button>
                </>
              )}
            </ListNote>
          ) : (
            <ul>
              {chats.map((thread) => {
                const open = isOpen(thread);
                const unread = unreadOf(thread);
                return (
                  <li key={thread.href}>
                    <Link
                      href={thread.href}
                      aria-current={open ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 border-l-[3px] px-4 py-3 transition",
                        open ? "border-zest-deep bg-canvas" : "border-transparent hover:bg-canvas-soft",
                      )}
                    >
                      <Avatar name={thread.other_name} src={thread.other_avatar_path} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={cn("truncate text-sm text-fg", unread > 0 ? "font-semibold" : "font-medium")}>
                            {thread.other_name}
                          </p>
                          {thread.last && (
                            <time
                              suppressHydrationWarning
                              dateTime={thread.last.created_at}
                              className={cn("shrink-0 text-[11px]", unread > 0 ? "font-semibold text-zest-ink" : "text-faint")}
                            >
                              {formatThreadTime(thread.last.created_at)}
                            </time>
                          )}
                        </div>
                        <p className="truncate text-[11px] font-medium text-zest-ink">{threadTopic(thread)}</p>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <p className={cn("truncate text-[13px]", unread > 0 ? "text-fg" : "text-muted")}>
                            {thread.last ? (
                              <>
                                {thread.last.sender_id === currentUserId && (
                                  <span className="text-faint">You: </span>
                                )}
                                {thread.last.attachment_path && (
                                  <Icon name="paperclip" className="mr-1 inline size-3.5 -translate-y-px" />
                                )}
                                {thread.last.body || attachmentLabel(thread.last)}
                              </>
                            ) : (
                              <span className="italic text-faint">No messages yet</span>
                            )}
                          </p>
                          {unread > 0 && (
                            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-zest px-1.5 text-[11px] font-semibold text-ink">
                              {unread}
                              <span className="sr-only"> unread</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Open conversation */}
      <section className={cn("min-w-0 flex-1 flex-col md:flex", inConversation ? "flex" : "hidden")}>
        {children}
      </section>
    </div>
  );
}

function ListNote({ children }: { children: ReactNode }) {
  return <p className="px-6 py-12 text-center text-sm leading-6 text-muted">{children}</p>;
}
