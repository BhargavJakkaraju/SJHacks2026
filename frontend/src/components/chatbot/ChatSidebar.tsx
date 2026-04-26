"use client";

export default function ChatSidebar() {
  return (
    <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-md backdrop-blur-md">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-white/70 uppercase">
        Chat Edits
      </h2>
      <div className="mb-3 h-40 overflow-auto rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/40">
        Chat stream placeholder.
      </div>
      <div className="flex items-center gap-2">
        <input
          disabled
          placeholder="Try: make the arms longer..."
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30"
        />
        <button
          type="button"
          disabled
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white opacity-50"
        >
          Send
        </button>
      </div>
    </aside>
  );
}
