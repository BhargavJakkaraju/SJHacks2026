"use client";

import ModelLoader from "@/components/viewport/ModelLoader";
import TransformGizmo from "@/components/viewport/TransformGizmo";
import { useWorkspaceStore } from "@/store/workspace";

export default function Scene() {
  const glbUrl = useWorkspaceStore((state) => state.glbUrl);
  const glbSource = useWorkspaceStore((state) => state.glbSource);
  const usedFallback = useWorkspaceStore((state) => state.usedFallback);
  const fallbackReason = useWorkspaceStore((state) => state.fallbackReason);
  const isGenerating = useWorkspaceStore((state) => state.isGenerating);
  const generationError = useWorkspaceStore((state) => state.generationError);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-md backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-white/70 uppercase">
          3D Environment
        </h2>
        <TransformGizmo />
      </div>
      <ModelLoader
        glbUrl={glbUrl}
        isGenerating={isGenerating}
        generationError={generationError}
      />
      {glbUrl && (
        <div className="mt-2 space-y-1 text-xs text-white/50">
          <p>
            Source: <span className="text-white/80">{glbSource ?? "unknown"}</span>
            {usedFallback && (
              <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-300">
                fallback (mock)
              </span>
            )}
          </p>
          {usedFallback && fallbackReason && (
            <p className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-1 font-mono text-[11px] text-amber-300">
              Fallback reason: {fallbackReason}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
