"use client";

import { useState } from "react";

import ChatSidebar from "@/components/chatbot/ChatSidebar";
import Canvas from "@/components/sketchpad/Canvas";
import Toolbar from "@/components/sketchpad/Toolbar";
import Scene from "@/components/viewport/Scene";
import { useWorkspaceStore } from "@/store/workspace";

export default function WorkspacePage() {
  const predictionEnabled = useWorkspaceStore((state) => state.predictionEnabled);
  const isGenerating = useWorkspaceStore((state) => state.isGenerating);
  const clearCanvasVersion = useWorkspaceStore((state) => state.clearCanvasVersion);
  const togglePrediction = useWorkspaceStore((state) => state.togglePrediction);
  const setGenerating = useWorkspaceStore((state) => state.setGenerating);
  const requestClearCanvas = useWorkspaceStore((state) => state.requestClearCanvas);
  const [brushColor, setBrushColor] = useState("#000000");
  const [activeTool, setActiveTool] = useState<"brush" | "picker" | "transform">("brush");
  const [canvasSize, setCanvasSize] = useState<{ width?: number; height: number }>({
    height: 260,
  });

  const handleGenerate = () => {
    setGenerating(true);
    window.setTimeout(() => setGenerating(false), 1000);
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

          <Scene />

          <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">
              Sketchpad
            </h2>
            <div className="flex w-full flex-col items-start gap-3 lg:flex-row lg:items-start">
              <Toolbar
                onClear={requestClearCanvas}
                brushColor={brushColor}
                onBrushColorChange={setBrushColor}
                activeTool={activeTool}
                onToolChange={setActiveTool}
              />
              <div className="w-full min-w-0 flex-1">
                <Canvas
                  predictionEnabled={predictionEnabled}
                  clearVersion={clearCanvasVersion}
                  brushColor={brushColor}
                  activeTool={activeTool}
                  onBrushColorChange={setBrushColor}
                  canvasHeight={canvasSize.height}
                  canvasWidth={canvasSize.width}
                  onCanvasSizeChange={setCanvasSize}
                />
              </div>
            </div>
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
                TODO: connect to backend generate + predict endpoints.
              </p>
            </div>
          </section>
        </section>

        <ChatSidebar />
      </div>
    </main>
  );
}
