"use client";

import type { WorkspaceTab } from "@/store/workspace";

type FileExplorerProps = {
  tabs: WorkspaceTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onCombineClick: () => void;
  isCombining: boolean;
  canCombine: boolean;
};

function tabIconForKind(kind: WorkspaceTab["kind"]): string {
  return kind === "combined" ? "✦" : "✎";
}

export default function FileExplorer({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onCombineClick,
  isCombining,
  canCombine,
}: FileExplorerProps) {
  return (
    <aside className="flex h-full w-full flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-950/70 p-3 shadow-[0_0_50px_-30px_rgba(59,130,246,0.4)] backdrop-blur">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold tracking-[0.25em] text-white/50 uppercase">
          Files
        </span>
        <button
          type="button"
          title="Add a new tab"
          aria-label="Add a new tab"
          className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-white/15 text-sm leading-none text-white/50 transition hover:border-white/30 hover:text-white/80"
        >
          +
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const icon = tabIconForKind(tab.kind);
          return (
            <div
              key={tab.id}
              className={`group flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition ${
                isActive
                  ? tab.kind === "combined"
                    ? "border-violet-500/50 bg-violet-500/15 text-white shadow-[0_0_18px_-6px_rgba(139,92,246,0.7)]"
                    : "border-blue-500/60 bg-blue-500/15 text-white shadow-[0_0_18px_-6px_rgba(59,130,246,0.7)]"
                  : "border-transparent text-white/65 hover:border-white/10 hover:bg-white/5 hover:text-white/90"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className="flex flex-1 items-center gap-2 text-left"
              >
                <span
                  className={
                    tab.kind === "combined"
                      ? "text-violet-300"
                      : "text-white/40"
                  }
                  aria-hidden
                >
                  {icon}
                </span>
                <span className="truncate">{tab.label}</span>
                {tab.glbUrl && tab.kind === "drawing" && (
                  <span
                    title="Model generated"
                    className="ml-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
                  />
                )}
              </button>
              {tab.isClosable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  title="Close tab"
                  aria-label={`Close ${tab.label}`}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-white/40 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-white/5 pt-3">
        <span className="px-1 text-[10px] font-semibold tracking-[0.25em] text-white/50 uppercase">
          Actions
        </span>
        <button
          type="button"
          onClick={onCombineClick}
          disabled={isCombining || !canCombine}
          title={
            !canCombine
              ? "Need at least two drawing tabs to combine"
              : "Combine all drawing tabs into a new file"
          }
          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            isCombining
              ? "cursor-not-allowed border-violet-400/40 bg-violet-500/15 text-violet-200"
              : canCombine
                ? "border-violet-500/60 bg-violet-600 text-white shadow-[0_0_18px_-6px_rgba(139,92,246,0.7)] hover:bg-violet-500"
                : "cursor-not-allowed border-white/10 bg-white/5 text-white/40"
          }`}
        >
          {isCombining ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-violet-300/40 border-t-violet-200" />
              <span>Compositing...</span>
            </>
          ) : (
            <>
              <span aria-hidden>✦</span>
              <span>Combine tabs</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
