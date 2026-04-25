"use client";

import { useCallback, useRef } from "react";

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

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-zinc-100 md:px-6">
      <div className="mx-auto grid w-full max-w-7xl gap-4 xl:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <header className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h1 className="text-lg font-semibold">ArtForge Workspace</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Sketch below, compile, and refine generated assets in the 3D panel.
            </p>
          </header>

          <Scene />

          <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">
              Sketchpad
            </h2>
            <Toolbar onClear={requestClearCanvas} />
            <Canvas
              predictionEnabled={predictionEnabled}
              clearVersion={clearCanvasVersion}
              onReady={handleCanvasReady}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? "Generating..." : "Compile & Generate"}
              </button>
              <button
                type="button"
                onClick={togglePrediction}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-100 transition hover:bg-zinc-800"
              >
                {predictionEnabled ? "Disable Prediction" : "Enable Prediction"}
              </button>
            </div>
          </section>
        </section>

        <ChatSidebar />
      </div>
    </main>
  );
}
