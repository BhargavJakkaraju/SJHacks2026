"use client";

import { useCallback, useRef, useState } from "react";

import ChatSidebar from "@/components/chatbot/ChatSidebar";
import Canvas from "@/components/sketchpad/Canvas";
import Toolbar from "@/components/sketchpad/Toolbar";
import Scene from "@/components/viewport/Scene";
import { useWorkspaceStore } from "@/store/workspace";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export default function WorkspacePage() {
  const predictionEnabled = useWorkspaceStore((state) => state.predictionEnabled);
  const isGenerating = useWorkspaceStore((state) => state.isGenerating);
  const clearCanvasVersion = useWorkspaceStore((state) => state.clearCanvasVersion);
  const togglePrediction = useWorkspaceStore((state) => state.togglePrediction);
  const setGenerating = useWorkspaceStore((state) => state.setGenerating);
  const requestClearCanvas = useWorkspaceStore((state) => state.requestClearCanvas);
  const setGenerationResult = useWorkspaceStore((state) => state.setGenerationResult);
  const setGenerationError = useWorkspaceStore((state) => state.setGenerationError);

  const [sketchpadExpanded, setSketchpadExpanded] = useState(false);
  const getDataURLRef = useRef<(() => string | null) | null>(null);

  const handleCanvasReady = useCallback(
    (api: { getDataURL: () => string | null }) => {
      getDataURLRef.current = api.getDataURL;
    },
    [],
  );

  const handleGenerate = useCallback(async () => {
    const dataUrl = getDataURLRef.current?.();
    if (!dataUrl) {
      setGenerationError("Canvas not ready yet — try again in a moment.");
      return;
    }

    setGenerationError(null);
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/sketch-to-3d`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sketch_data_url: dataUrl }),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`Backend ${res.status}: ${detail.slice(0, 240)}`);
      }
      const body = (await res.json()) as {
        glb_url: string;
        source: string;
        used_fallback: boolean;
        job_id: string | null;
        fallback_reason: string | null;
      };
      setGenerationResult({
        glbUrl: body.glb_url,
        source: body.source,
        usedFallback: body.used_fallback,
        fallbackReason: body.fallback_reason,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setGenerationError(message);
    } finally {
      setGenerating(false);
    }
  }, [setGenerating, setGenerationError, setGenerationResult]);

  const sketchpadPanel = (
    <section
      className={
        sketchpadExpanded
          ? "flex h-full flex-col gap-3 rounded-2xl border border-sky-200 bg-white/85 p-4 shadow-lg backdrop-blur"
          : "flex flex-col gap-3 rounded-2xl border border-sky-200 bg-white/80 p-4 shadow-md backdrop-blur"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-sky-900 uppercase">
          Sketchpad
        </h2>
        <button
          type="button"
          onClick={() => setSketchpadExpanded((v) => !v)}
          className="rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium text-sky-800 transition hover:bg-sky-50"
        >
          {sketchpadExpanded ? "Collapse" : "Expand"}
        </button>
      </div>
      <Toolbar onClear={requestClearCanvas} />
      <div className={sketchpadExpanded ? "min-h-0 flex-1" : undefined}>
        <Canvas
          predictionEnabled={predictionEnabled}
          clearVersion={clearCanvasVersion}
          onReady={handleCanvasReady}
          fillHeight={sketchpadExpanded}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? "Generating..." : "Compile & Generate"}
        </button>
        <button
          type="button"
          onClick={togglePrediction}
          className="rounded-lg border border-sky-300 bg-white px-4 py-2 text-sm text-sky-800 transition hover:bg-sky-50"
        >
          {predictionEnabled ? "Disable Prediction" : "Enable Prediction"}
        </button>
      </div>
    </section>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-200 via-sky-100 to-sky-300 px-4 py-5 text-sky-950 md:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="rounded-2xl border border-sky-200 bg-white/70 p-4 shadow-md backdrop-blur">
          <h1 className="text-lg font-semibold text-sky-950">ArtForge Workspace</h1>
          <p className="mt-1 text-sm text-sky-800">
            Sketch on the right, compile, and refine generated assets in the 3D
            panel on the left.
          </p>
        </header>

        {!sketchpadExpanded && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Scene />
            {sketchpadPanel}
          </div>
        )}

        <ChatSidebar />
      </div>

      {sketchpadExpanded && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-sky-200 via-sky-100 to-sky-300 p-4 md:p-6">
          <div className="mx-auto flex h-full w-full max-w-7xl flex-col">
            {sketchpadPanel}
          </div>
        </div>
      )}
    </main>
  );
}
