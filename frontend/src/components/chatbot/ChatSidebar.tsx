"use client";

export default function ChatSidebar() {
  return (
    <aside className="rounded-2xl border border-sky-200 bg-white/80 p-4 shadow-md backdrop-blur">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-sky-900 uppercase">
        Chat Edits
      </h2>
      <div className="mb-3 h-40 overflow-auto rounded-lg border border-sky-200 bg-sky-50/60 p-3 text-sm text-sky-700">
        Chat stream placeholder.
      </div>
      <div className="flex items-center gap-2">
        <input
          disabled
          placeholder="Try: make the arms longer..."
          className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-sky-900 placeholder:text-sky-400"
        />
        <button
          type="button"
          disabled
          className="rounded-lg bg-sky-300 px-3 py-2 text-xs font-medium text-white"
        >
          Send
        </button>
      </div>
    </aside>
  );
}
