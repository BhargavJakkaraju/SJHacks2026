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
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">
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
        <div className="mt-2 space-y-1 text-xs text-zinc-500">
          <p>
            Source: <span className="text-zinc-300">{glbSource ?? "unknown"}</span>
            {usedFallback && (
              <span className="ml-2 rounded bg-yellow-900/40 px-1.5 py-0.5 text-yellow-200">
                fallback (mock)
              </span>
            )}
          </p>
          {usedFallback && fallbackReason && (
            <p className="rounded border border-yellow-900/50 bg-yellow-950/30 px-2 py-1 font-mono text-[11px] text-yellow-200">
              Fallback reason: {fallbackReason}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
