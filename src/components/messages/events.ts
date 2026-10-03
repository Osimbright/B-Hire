/*
 * Browser events that keep the messaging widgets in step without a shared
 * store: the open chat tells the conversation list to refresh, and the list
 * tells the top bar how many conversations are unread.
 */

/** Fired after a message is sent, received or read. */
export const MESSAGES_CHANGED = "bhire:messages-changed";

/** Fired with `detail: number` — conversations that have unread messages. */
export const UNREAD_CHANGED = "bhire:unread-changed";
