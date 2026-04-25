"use client";

export default function ChatSidebar() {
  return (
    <aside className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-200 uppercase">
        Chat Edits
      </h2>
      <div className="mb-3 h-64 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-400">
        Chat stream placeholder.
      </div>
      <div className="flex items-center gap-2">
        <input
          disabled
          placeholder="Try: make the arms longer..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-500"
        />
        <button
          type="button"
          disabled
          className="rounded-lg bg-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200"
        >
          Send
        </button>
      </div>
    </aside>
  );
}
