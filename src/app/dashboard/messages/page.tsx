import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { requireProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Messages" };

/** The right-hand pane before a conversation is picked (the list itself lives in the layout). */
export default async function MessagesPage() {
  const profile = await requireProfile();
  const other = profile.role === "client" ? "freelancer" : "client";

  return (
    <div className="grid flex-1 place-items-center bg-canvas-soft bg-[radial-gradient(var(--color-line-soft)_1px,transparent_1px)] bg-size-[18px_18px] p-8">
      <div className="max-w-sm text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-ink text-zest">
          <Icon name="chat" className="size-7" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-fg">Your conversations</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Pick a chat on the left to open it here, or start a new one with a {other} using the pencil button.
        </p>
      </div>
    </div>
  );
}
