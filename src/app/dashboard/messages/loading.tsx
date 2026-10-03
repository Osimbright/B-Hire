/** Chat-pane skeleton shown while switching conversations; the list stays put. */
export default function ConversationLoading() {
  return (
    <div className="flex flex-1 animate-pulse flex-col" aria-label="Loading conversation">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
        <div className="size-11 rounded-full bg-line/70" />
        <div className="space-y-2">
          <div className="h-3.5 w-36 rounded-full bg-line/70" />
          <div className="h-3 w-52 rounded-full bg-line/50" />
        </div>
      </div>
      <div className="flex-1 space-y-3 bg-canvas-soft p-6">
        <div className="h-12 w-2/5 rounded-2xl bg-line/50" />
        <div className="ml-auto h-12 w-1/3 rounded-2xl bg-line/60" />
        <div className="h-16 w-1/2 rounded-2xl bg-line/50" />
      </div>
      <div className="border-t border-line p-3">
        <div className="h-11 rounded-full bg-line/50" />
      </div>
    </div>
  );
}
