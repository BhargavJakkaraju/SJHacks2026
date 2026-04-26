"use client";

import { useCallback } from "react";

import ModelLoader from "@/components/viewport/ModelLoader";
import TransformGizmo from "@/components/viewport/TransformGizmo";
import { selectActiveTab, useWorkspaceStore } from "@/store/workspace";

export default function Scene() {
  const activeTab = useWorkspaceStore(selectActiveTab);
  const combineActive = useWorkspaceStore((state) => state.combineActive);
  const combinedGlbUrl = useWorkspaceStore((state) => state.combinedGlbUrl);
  const tabs = useWorkspaceStore((state) => state.tabs);

  const displayedGlbUrl = combineActive ? combinedGlbUrl : activeTab.glbUrl;
  const isGenerating = combineActive ? false : activeTab.isGenerating;
  const generationError = combineActive ? null : activeTab.generationError;

  const headerLabel = combineActive
    ? "Combined View"
    : `3D Environment · ${activeTab.label}`;

  const exportFilename = combineActive
    ? "combined.glb"
    : `${activeTab.label.toLowerCase().replace(/\s+/g, "-")}.glb`;

  const canExport = !!displayedGlbUrl && !isGenerating;

  // Force a download via the anchor `download` attribute. Same-origin asset
  // (served from /public) so the browser will respect the filename.
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
    <section className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 shadow-[0_0_50px_-30px_rgba(59,130,246,0.4)] backdrop-blur">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2
          className={`text-sm font-semibold tracking-[0.2em] uppercase ${
            combineActive ? "text-violet-200" : "text-white/80"
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

      {combineActive && (
        <div className="mb-3 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
          <span className="font-semibold">Showing combined model:</span>{" "}
          {tabs.map((tab, idx) => (
            <span key={tab.id}>
              {idx > 0 && <span className="px-1 text-violet-300">+</span>}
              <span>{tab.label}</span>
            </span>
          ))}
          .
        </div>
      )}

      <ModelLoader
        glbUrl={displayedGlbUrl}
        isGenerating={isGenerating}
        generationError={generationError}
      />
    </section>
  );
}
