"use client";

import type { WorkspaceTab } from "@/store/workspace";

type TabBarProps = {
  tabs: WorkspaceTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  combineActive: boolean;
  isCombining: boolean;
  onCombineClick: () => void;
  onExitCombine: () => void;
};

export default function TabBar({
  tabs,
  activeTabId,
  onSelectTab,
  combineActive,
  isCombining,
  onCombineClick,
  onExitCombine,
}: TabBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/70 p-2 shadow-[0_0_50px_-30px_rgba(59,130,246,0.4)] backdrop-blur">
      <div className="flex flex-1 flex-wrap items-center gap-1.5">
        {tabs.map((tab) => {
          const isActive = !combineActive && tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-blue-500/60 bg-blue-500/15 text-white shadow-[0_0_18px_-4px_rgba(59,130,246,0.6)]"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              <span>{tab.label}</span>
              {tab.glbUrl && (
                <span
                  title="Model generated"
                  className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
                />
              )}
            </button>
          );
        })}
        <button
          type="button"
          title="Add a new tab"
          aria-label="Add a new tab"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-dashed border-white/15 bg-transparent text-lg leading-none text-white/50 transition hover:border-white/30 hover:bg-white/5 hover:text-white/80"
        >
          +
        </button>
      </div>

      <div className="flex items-center gap-2">
        {combineActive && (
          <span className="rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
            Combined view
          </span>
        )}
        {combineActive ? (
          <button
            type="button"
            onClick={onExitCombine}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
          >
            <span>←</span>
            <span>Back to tabs</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onCombineClick}
            disabled={isCombining}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
              isCombining
                ? "cursor-not-allowed border-violet-400/40 bg-violet-500/15 text-violet-200"
                : "border-violet-500/60 bg-violet-600 text-white shadow-[0_0_18px_-4px_rgba(139,92,246,0.7)] hover:bg-violet-500"
            }`}
          >
            {isCombining ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-violet-300/40 border-t-violet-200" />
                <span>Compositing...</span>
              </>
            ) : (
              <>
                <span>✦</span>
                <span>Combine</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
