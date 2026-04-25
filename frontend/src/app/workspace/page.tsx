"use client";

import { useRef } from "react";

import ChatSidebar from "@/components/chatbot/ChatSidebar";
import Canvas, { type CanvasHandle } from "@/components/sketchpad/Canvas";
import Toolbar from "@/components/sketchpad/Toolbar";
import Scene from "@/components/viewport/Scene";
import { useWorkspaceStore } from "@/store/workspace";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

function toAbsoluteUrl(inputUrl: string) {
  if (/^https?:\/\//i.test(inputUrl)) {
    return inputUrl;
  }
  return `${API_BASE_URL}${inputUrl.startsWith("/") ? "" : "/"}${inputUrl}`;
}

export default function WorkspacePage() {
  const canvasRef = useRef<CanvasHandle | null>(null);
  const predictionEnabled = useWorkspaceStore((state) => state.predictionEnabled);
  const isGenerating = useWorkspaceStore((state) => state.isGenerating);
  const clearCanvasVersion = useWorkspaceStore((state) => state.clearCanvasVersion);
  const generatedModelUrl = useWorkspaceStore((state) => state.generatedModelUrl);
  const modelSource = useWorkspaceStore((state) => state.modelSource);
  const generationError = useWorkspaceStore((state) => state.generationError);
  const togglePrediction = useWorkspaceStore((state) => state.togglePrediction);
  const setGenerating = useWorkspaceStore((state) => state.setGenerating);
  const requestClearCanvas = useWorkspaceStore((state) => state.requestClearCanvas);
  const setGeneratedModel = useWorkspaceStore((state) => state.setGeneratedModel);
  const setGenerationError = useWorkspaceStore((state) => state.setGenerationError);

  const handleGenerate = async () => {
    const sketchDataUrl = canvasRef.current?.toDataURL();
    if (!sketchDataUrl) {
      setGenerationError("Sketch canvas is not ready yet.");
      return;
    }

    setGenerating(true);
    setGenerationError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/sketch-to-3d`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sketch_data_url: sketchDataUrl,
        }),
      });
      const body = (await response.json()) as {
        glb_url?: string;
        source?: string;
        detail?: string;
      };
      if (!response.ok || !body.glb_url) {
        throw new Error(body.detail ?? "Backend returned an unexpected response.");
      }

      setGeneratedModel({
        url: toAbsoluteUrl(body.glb_url),
        source: body.source ?? "unknown",
      });
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Request failed");
    } finally {
      setGenerating(false);
    }
  };

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

          <Scene
            modelUrl={generatedModelUrl}
            modelSource={modelSource}
            generationError={generationError}
          />

          <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">
              Sketchpad
            </h2>
            <Toolbar onClear={requestClearCanvas} />
            <Canvas
              ref={canvasRef}
              predictionEnabled={predictionEnabled}
              clearVersion={clearCanvasVersion}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
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
              <p className="text-xs text-zinc-400">
                Uses `/api/sketch-to-3d` and displays returned GLB (no textures).
              </p>
            </div>
          </section>
        </section>

        <ChatSidebar />
      </div>
    </main>
  );
}
