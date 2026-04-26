"use client";

import { useEffect, useRef, useState } from "react";

import type { WorkspaceTab } from "@/store/workspace";

type FileExplorerProps = {
  tabs: WorkspaceTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onCombineClick: () => void;
  isCombining: boolean;
  canCombine: boolean;
  onRenameTab: (id: string, label: string) => void;
};

type ContextMenuState = {
  tabId: string;
  x: number;
  y: number;
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
  onRenameTab,
}: FileExplorerProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  // Close the context menu on any outside click or Escape press.
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [contextMenu]);

  // Auto-focus + select the rename input when entering rename mode.
  useEffect(() => {
    if (renamingTabId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingTabId]);

  const startRename = (tab: WorkspaceTab) => {
    setRenamingTabId(tab.id);
    setRenameValue(tab.label);
    setContextMenu(null);
  };

  const commitRename = () => {
    if (!renamingTabId) return;
    const trimmed = renameValue.trim();
    if (trimmed) onRenameTab(renamingTabId, trimmed);
    setRenamingTabId(null);
    setRenameValue("");
  };

  const cancelRename = () => {
    setRenamingTabId(null);
    setRenameValue("");
  };

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
          const isRenaming = tab.id === renamingTabId;
          return (
            <div
              key={tab.id}
              onContextMenu={(e) => {
                e.preventDefault();
                const rect = (
                  e.currentTarget as HTMLDivElement
                ).getBoundingClientRect();
                setContextMenu({
                  tabId: tab.id,
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2,
                });
              }}
              className={`group flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition ${
                isActive
                  ? tab.kind === "combined"
                    ? "border-violet-500/50 bg-violet-500/15 text-white shadow-[0_0_18px_-6px_rgba(139,92,246,0.7)]"
                    : "border-blue-500/60 bg-blue-500/15 text-white shadow-[0_0_18px_-6px_rgba(59,130,246,0.7)]"
                  : "border-transparent text-white/65 hover:border-white/10 hover:bg-white/5 hover:text-white/90"
              }`}
            >
              {isRenaming ? (
                <div className="flex flex-1 items-center gap-2">
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
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitRename();
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        cancelRename();
                      }
                    }}
                    onBlur={commitRename}
                    className="w-full rounded border border-blue-500/60 bg-zinc-900 px-1.5 py-0.5 text-xs text-white outline-none focus:border-blue-400"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  onDoubleClick={() => startRename(tab)}
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
              )}
              {!isRenaming && tab.isClosable && (
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

      {contextMenu && (
        <div
          role="menu"
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            transform: "translate(-50%, -50%)",
          }}
          className="fixed z-50 w-40 overflow-hidden rounded-lg border border-white/10 bg-zinc-900/95 py-1 text-sm text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] backdrop-blur"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              const targetTab = tabs.find((t) => t.id === contextMenu.tabId);
              if (targetTab) startRename(targetTab);
            }}
            className="block w-full px-3 py-1.5 text-left transition hover:bg-white/10"
          >
            Rename
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => setContextMenu(null)}
            className="block w-full px-3 py-1.5 text-left transition hover:bg-white/10"
          >
            Delete
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => setContextMenu(null)}
            className="block w-full px-3 py-1.5 text-left transition hover:bg-white/10"
          >
            Move to
          </button>
        </div>
      )}
    </aside>
  );
}
