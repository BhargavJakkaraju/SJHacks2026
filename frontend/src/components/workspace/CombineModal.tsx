"use client";

import { useEffect, useState } from "react";

import type { WorkspaceTab } from "@/store/workspace";

type CombineModalProps = {
  tabs: WorkspaceTab[];
  defaultSelectedIds: string[];
  onCancel: () => void;
  onConfirm: (selectedIds: string[]) => void;
};

export default function CombineModal({
  tabs,
  defaultSelectedIds,
  onCancel,
  onConfirm,
}: CombineModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const available = new Set(tabs.map((t) => t.id));
    const preset = defaultSelectedIds.filter((id) => available.has(id));
    if (preset.length >= 2) return preset;
    return tabs.slice(0, 2).map((t) => t.id);
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const canCombine = selectedIds.length >= 2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="combine-modal-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-5 shadow-[0_20px_60px_-20px_rgba(139,92,246,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="combine-modal-title"
          className="text-base font-semibold text-white"
        >
          Combine files
        </h2>
        <p className="mt-1 text-xs text-white/60">
          Select which files to combine. Pick at least two.
        </p>

        <div className="mt-4 flex flex-col gap-1.5">
          {tabs.length === 0 && (
            <span className="text-xs text-white/50">
              No drawing files available.
            </span>
          )}
          {tabs.map((tab) => {
            const checked = selectedIds.includes(tab.id);
            return (
              <label
                key={tab.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  checked
                    ? "border-violet-500/60 bg-violet-500/15 text-white"
                    : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(tab.id)}
                  className="h-3.5 w-3.5 accent-violet-500"
                />
                <span className="flex-1 truncate">{tab.label}</span>
              </label>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedIds)}
            disabled={!canCombine}
            className={`rounded-lg border px-4 py-1.5 text-xs font-semibold transition ${
              canCombine
                ? "border-violet-500/60 bg-violet-600 text-white shadow-[0_0_18px_-6px_rgba(139,92,246,0.7)] hover:bg-violet-500"
                : "cursor-not-allowed border-white/10 bg-white/5 text-white/40"
            }`}
          >
            Combine
          </button>
        </div>
      </div>
    </div>
  );
}
