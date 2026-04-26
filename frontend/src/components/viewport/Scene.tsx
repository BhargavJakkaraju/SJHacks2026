"use client";

import { useCallback } from "react";

import ModelLoader from "@/components/viewport/ModelLoader";
import TransformGizmo from "@/components/viewport/TransformGizmo";
import { selectActiveTab, useWorkspaceStore } from "@/store/workspace";

export default function Scene() {
  const activeTab = useWorkspaceStore(selectActiveTab);
  const isCombined = activeTab.kind === "combined";

  const displayedGlbUrl = activeTab.glbUrl;
  const isGenerating = activeTab.isGenerating;
  const generationError = activeTab.generationError;

  const headerLabel = isCombined
    ? `3D Environment · ${activeTab.label}`
    : `3D Environment · ${activeTab.label}`;

  const exportFilename = `${activeTab.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}.glb`;

  const canExport = !!displayedGlbUrl && !isGenerating;

  const handleExport = useCallback(() => {
    if (!displayedGlbUrl) return;
    const link = document.createElement("a");
    link.href = displayedGlbUrl;
    link.download = exportFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [displayedGlbUrl, exportFilename]);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-white/10 bg-zinc-950/70 p-4 shadow-[0_0_50px_-30px_rgba(59,130,246,0.4)] backdrop-blur">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2
          className={`text-sm font-semibold tracking-[0.2em] uppercase ${
            isCombined ? "text-violet-200" : "text-white/80"
          }`}
        >
          {headerLabel}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={!canExport}
            title={
              canExport
                ? `Download ${exportFilename}`
                : "Generate a model first to export it"
            }
            className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span aria-hidden>↓</span>
            <span>Export GLB</span>
          </button>
          <TransformGizmo />
        </div>
      </div>

      {isCombined && (
        <div className="mb-3 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
          <span className="font-semibold">Combined model:</span>{" "}
          {(activeTab.sourcePreviews ?? []).map((preview, idx) => (
            <span key={preview.tabId}>
              {idx > 0 && <span className="px-1 text-violet-300">+</span>}
              <span>{preview.label}</span>
            </span>
          ))}
          .
        </div>
      )}

      <div className="flex-1">
        <ModelLoader
          glbUrl={displayedGlbUrl}
          isGenerating={isGenerating}
          generationError={generationError}
        />
      </div>
    </section>
  );
}
