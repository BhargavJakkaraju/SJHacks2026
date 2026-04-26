"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import ChatSidebar from "@/components/chatbot/ChatSidebar";
import Canvas from "@/components/sketchpad/Canvas";
import PredictionPanel from "@/components/sketchpad/PredictionPanel";
import Toolbar from "@/components/sketchpad/Toolbar";
import Scene from "@/components/viewport/Scene";
import TabBar from "@/components/workspace/TabBar";
import { selectActiveTab, useWorkspaceStore } from "@/store/workspace";

const PREDICTION_WARMUP_MS = 10000;
const COMBINE_WARMUP_MS = 10000;
const GENERATE_DURATION_MS = 3000;

const PRESET_COLORS = [
  "#ffffff",
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#f97316",
  "#a855f7",
];

type CanvasApi = {
  getDataURL: () => string | null;
  applyImage: (dataUrl: string) => void;
  undoApplied: () => void;
  getJSON: () => object | null;
  loadJSON: (state: object | null) => Promise<void>;
};

export default function WorkspacePage() {
  // Global workspace state
  const tabs = useWorkspaceStore((state) => state.tabs);
  const activeTabId = useWorkspaceStore((state) => state.activeTabId);
  const activeTab = useWorkspaceStore(selectActiveTab);
  const predictionEnabled = useWorkspaceStore(
    (state) => state.predictionEnabled,
  );
  const clearCanvasVersion = useWorkspaceStore(
    (state) => state.clearCanvasVersion,
  );
  const combineActive = useWorkspaceStore((state) => state.combineActive);

  const setActiveTab = useWorkspaceStore((state) => state.setActiveTab);
  const setTabGenerating = useWorkspaceStore((state) => state.setTabGenerating);
  const setTabGenerationResult = useWorkspaceStore(
    (state) => state.setTabGenerationResult,
  );
  const setTabGenerationError = useWorkspaceStore(
    (state) => state.setTabGenerationError,
  );
  const saveTabCanvasState = useWorkspaceStore(
    (state) => state.saveTabCanvasState,
  );
  const requestClearCanvas = useWorkspaceStore(
    (state) => state.requestClearCanvas,
  );
  const setPredictionEnabled = useWorkspaceStore(
    (state) => state.setPredictionEnabled,
  );
  const setCombineActive = useWorkspaceStore((state) => state.setCombineActive);

  // Local UI state
  const [sketchpadExpanded, setSketchpadExpanded] = useState(false);
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [eraserMode, setEraserMode] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [pendingApplied, setPendingApplied] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [isCombining, setIsCombining] = useState(false);

  const predictionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const combineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasApiRef = useRef<CanvasApi | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);

  // Track which tab the canvas currently shows so we know which tab to save
  // into when the user switches.
  const displayedTabIdRef = useRef<string>(activeTabId);

  useEffect(() => {
    return () => {
      if (predictionTimerRef.current) clearTimeout(predictionTimerRef.current);
      if (combineTimerRef.current) clearTimeout(combineTimerRef.current);
    };
  }, []);

  // Whenever the active tab changes (or the canvas first becomes ready), save
  // the previous tab's drawing into the store and load the new tab's saved
  // drawing into the (single) canvas instance.
  useEffect(() => {
    if (!canvasReady) return;
    const api = canvasApiRef.current;
    if (!api) return;
    const previousTabId = displayedTabIdRef.current;
    if (previousTabId !== activeTabId) {
      const previousState = api.getJSON();
      saveTabCanvasState(previousTabId, previousState);
      displayedTabIdRef.current = activeTabId;
    }
    const incoming = tabs.find((tab) => tab.id === activeTabId);
    void api.loadJSON(incoming?.canvasState ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId, canvasReady]);

  const handleCanvasReady = useCallback((api: CanvasApi) => {
    canvasApiRef.current = api;
    setCanvasReady(true);
  }, []);

  const handleSelectTab = useCallback(
    (id: string) => {
      if (id === activeTabId && !combineActive) return;
      // Selecting a tab also exits combined view.
      if (combineActive) setCombineActive(false);
      setActiveTab(id);
    },
    [activeTabId, combineActive, setActiveTab, setCombineActive],
  );

  const handleColorChange = useCallback((color: string) => {
    setBrushColor(color);
    setEraserMode(false);
    setSelectionMode(false);
  }, []);

  const handleEraserToggle = useCallback(() => {
    setEraserMode((v) => !v);
    setSelectionMode(false);
  }, []);

  const handleSelectionToggle = useCallback(() => {
    setSelectionMode((v) => !v);
    setEraserMode(false);
  }, []);

  const handlePredictionToggle = useCallback(() => {
    if (predictionLoading) {
      if (predictionTimerRef.current) clearTimeout(predictionTimerRef.current);
      predictionTimerRef.current = null;
      setPredictionLoading(false);
      return;
    }
    if (predictionEnabled) {
      setPredictionEnabled(false);
      return;
    }
    setPredictionLoading(true);
    predictionTimerRef.current = setTimeout(() => {
      setPredictionEnabled(true);
      setPredictionLoading(false);
      predictionTimerRef.current = null;
    }, PREDICTION_WARMUP_MS);
  }, [predictionEnabled, predictionLoading, setPredictionEnabled]);

  // Hardcoded demo: skip API, reveal tab's predefined Meshy GLB after 3s.
  const handleGenerate = useCallback(async () => {
    const targetTabId = activeTabId;
    const target = tabs.find((tab) => tab.id === targetTabId);
    if (!target) return;
    setTabGenerationError(targetTabId, null);
    setTabGenerating(targetTabId, true);
    await new Promise((resolve) => setTimeout(resolve, GENERATE_DURATION_MS));
    setTabGenerationResult(targetTabId, {
      glbUrl: target.predefinedGlbUrl,
      source: target.predefinedSource,
      usedFallback: false,
      fallbackReason: null,
    });
    setTabGenerating(targetTabId, false);
  }, [
    activeTabId,
    tabs,
    setTabGenerating,
    setTabGenerationError,
    setTabGenerationResult,
  ]);

  const handleApplyVariation = useCallback((dataUrl: string) => {
    canvasApiRef.current?.applyImage(dataUrl);
    setPendingApplied(true);
  }, []);

  const handleKeepVariation = useCallback(() => {
    setPendingApplied(false);
    setPredictionEnabled(false);
  }, [setPredictionEnabled]);

  const handleUndoVariation = useCallback(() => {
    canvasApiRef.current?.undoApplied();
    setPendingApplied(false);
  }, []);

  const handleCombineClick = useCallback(() => {
    if (isCombining || combineActive) return;
    setIsCombining(true);
    combineTimerRef.current = setTimeout(() => {
      setCombineActive(true);
      setIsCombining(false);
      combineTimerRef.current = null;
    }, COMBINE_WARMUP_MS);
  }, [isCombining, combineActive, setCombineActive]);

  const handleExitCombine = useCallback(() => {
    if (combineTimerRef.current) {
      clearTimeout(combineTimerRef.current);
      combineTimerRef.current = null;
    }
    setIsCombining(false);
    setCombineActive(false);
  }, [setCombineActive]);

  const sketchpadPanel = (
    <section
      className={
        sketchpadExpanded
          ? "flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-950/80 p-4 shadow-[0_0_60px_-30px_rgba(59,130,246,0.45)] backdrop-blur"
          : "flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-950/70 p-4 shadow-[0_0_50px_-30px_rgba(59,130,246,0.4)] backdrop-blur"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold tracking-[0.2em] text-white/80 uppercase">
            Sketchpad
          </h2>
          <span className="text-xs text-white/40">{activeTab.label}</span>
        </div>
        <button
          type="button"
          onClick={() => setSketchpadExpanded((v) => !v)}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10"
        >
          {sketchpadExpanded ? "Collapse" : "Expand"}
        </button>
      </div>
      <Toolbar
        onClear={requestClearCanvas}
        activeColor={brushColor}
        onColorChange={handleColorChange}
        eraserMode={eraserMode}
        onEraserToggle={handleEraserToggle}
        presetColors={PRESET_COLORS}
        selectionMode={selectionMode}
        onSelectionToggle={handleSelectionToggle}
      />

      <div className="relative">
        <Canvas
          predictionEnabled={predictionEnabled}
          clearVersion={clearCanvasVersion}
          onReady={handleCanvasReady}
          fillHeight={sketchpadExpanded}
          brushColor={brushColor}
          eraserMode={eraserMode}
          selectionMode={selectionMode}
        />
        {pendingApplied && (
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
            <button
              type="button"
              onClick={handleKeepVariation}
              className="rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-400"
            >
              Keep
            </button>
            <button
              type="button"
              onClick={handleUndoVariation}
              className="rounded-lg bg-rose-500 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-rose-400"
            >
              Undo
            </button>
          </div>
        )}
      </div>

      {predictionEnabled && <PredictionPanel onApply={handleApplyVariation} />}

      <ChatSidebar />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={activeTab.isGenerating}
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_18px_3px_rgba(59,130,246,0.55)] transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {activeTab.isGenerating
            ? `Generating ${activeTab.label}...`
            : `Compile & Generate`}
        </button>
        <button
          type="button"
          onClick={handlePredictionToggle}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
            predictionLoading
              ? "border-blue-400/40 bg-blue-500/10 text-blue-200"
              : predictionEnabled
                ? "border-blue-500 bg-blue-600 text-white hover:bg-blue-500"
                : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
          }`}
        >
          {predictionLoading && (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-300/40 border-t-blue-300" />
          )}
          {predictionLoading
            ? "Warming up prediction..."
            : predictionEnabled
              ? "Disable Prediction"
              : "Enable Prediction"}
        </button>
      </div>
    </section>
  );

  return (
    <main className="min-h-screen bg-black px-4 py-5 text-zinc-100 md:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 shadow-[0_0_60px_-30px_rgba(59,130,246,0.45)] backdrop-blur">
          <h1 className="text-lg font-semibold text-white">Bloom Workspace</h1>
          <p className="mt-1 text-sm text-white/60">
            Switch tabs to work on multiple drawings, then click{" "}
            <span className="text-violet-300">Combine</span> to merge their 3D
            models into a single scene.
          </p>
        </header>

        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={handleSelectTab}
          combineActive={combineActive}
          isCombining={isCombining}
          onCombineClick={handleCombineClick}
          onExitCombine={handleExitCombine}
        />

        {!sketchpadExpanded && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Scene />
            {sketchpadPanel}
          </div>
        )}
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
