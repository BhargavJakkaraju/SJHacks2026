"use client";

import type { WorkspaceTab } from "@/store/workspace";

type CombinedSketchPreviewProps = {
  tab: WorkspaceTab;
};

export default function CombinedSketchPreview({
  tab,
}: CombinedSketchPreviewProps) {
  const previews = tab.sourcePreviews ?? [];

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
        <span className="font-semibold">Combined source drawings.</span> This
        tab is read-only — switch to a drawing tab to keep editing.
      </div>

      <div
        className={`grid flex-1 gap-3 ${
          previews.length > 1 ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        {previews.length === 0 && (
          <div className="flex h-full items-center justify-center rounded-xl border border-white/10 bg-zinc-950 px-4 text-center text-xs text-white/50">
            No source drawings captured.
          </div>
        )}

        {previews.map((preview) => (
          <div
            key={preview.tabId}
            className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-950"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
              <span className="text-[10px] font-semibold tracking-[0.2em] text-white/50 uppercase">
                {preview.label}
              </span>
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] tracking-wider text-white/40 uppercase">
                Source
              </span>
            </div>
            <div className="flex flex-1 items-center justify-center bg-[#0a0a0a] p-3">
              {preview.dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.dataUrl}
                  alt={`${preview.label} sketch`}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-white/40">
                  No drawing captured for {preview.label}.
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
