"use client";

import { useCallback, useRef, useState } from "react";

import ChatSidebar from "@/components/chatbot/ChatSidebar";
import Canvas from "@/components/sketchpad/Canvas";
import Toolbar from "@/components/sketchpad/Toolbar";
import Scene from "@/components/viewport/Scene";
import { useWorkspaceStore } from "@/store/workspace";

const PETAL_COUNT = 8;

function FlowerIcon() {
  return (
    <svg viewBox="-36 -36 72 72" width="24" height="24">
      {Array.from({ length: PETAL_COUNT }).map((_, i) => {
        const angle = (i / PETAL_COUNT) * 360;
        return (
          <ellipse
            key={i}
            cx="0"
            cy="-17"
            rx="6"
            ry="13"
            fill="white"
            opacity="0.92"
            transform={`rotate(${angle})`}
          />
        );
      })}
      <circle cx="0" cy="0" r="7.5" fill="white" />
    </svg>
  );
}

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
  const setCanvasAPI = useWorkspaceStore((state) => state.setCanvasAPI);

  const [sketchpadExpanded, setSketchpadExpanded] = useState(false);
  const getDataURLRef = useRef<(() => string | null) | null>(null);

  const handleCanvasReady = useCallback(
    (api: { getDataURL: () => string | null }) => {
      getDataURLRef.current = api.getDataURL;
      setCanvasAPI(api.getDataURL);
    },
    [setCanvasAPI],
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
          ? "flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-md"
          : "flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-md backdrop-blur-md"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-white/70 uppercase">
          Sketchpad
        </h2>
        <button
          type="button"
          onClick={() => setSketchpadExpanded((v) => !v)}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
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
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ boxShadow: "0 0 12px 2px rgba(59,130,246,0.5)" }}
        >
          {isGenerating ? "Generating..." : "Compile & Generate"}
        </button>
        <button
          type="button"
          onClick={togglePrediction}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          {predictionEnabled ? "Disable Prediction" : "Enable Prediction"}
        </button>
      </div>
    </section>
  );

  return (
    <main className="min-h-screen bg-black px-4 py-5 text-white md:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <FlowerIcon />
            <h1 className="text-lg font-semibold text-white">Bloom</h1>
          </div>
          <p className="mt-1 text-sm text-white/50">
            Sketch on the right, compile, and refine generated assets in the 3D panel on the left.
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
        <div className="fixed inset-0 z-50 flex flex-col bg-black p-4 md:p-6">
          <div className="mx-auto flex h-full w-full max-w-7xl flex-col">
            {sketchpadPanel}
          </div>
        </div>
      )}
    </main>
  );
}
