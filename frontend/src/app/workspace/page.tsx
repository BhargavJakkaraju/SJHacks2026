"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import BloomLogo from "@/components/branding/BloomLogo";
import ChatSidebar from "@/components/chatbot/ChatSidebar";
import Canvas from "@/components/sketchpad/Canvas";
import CombinedSketchPreview from "@/components/sketchpad/CombinedSketchPreview";
import PredictionPanel from "@/components/sketchpad/PredictionPanel";
import Toolbar from "@/components/sketchpad/Toolbar";
import Scene from "@/components/viewport/Scene";
import CombineModal from "@/components/workspace/CombineModal";
import FileExplorer from "@/components/workspace/FileExplorer";
import {
  COMBINED_GLB_URL,
  selectActiveTab,
  useWorkspaceStore,
} from "@/store/workspace";

const PREDICTION_WARMUP_MS = 10000;
const COMBINE_WARMUP_MS = 20000;
const GENERATE_DURATION_MS = 20000;

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
  const tabs = useWorkspaceStore((state) => state.tabs);
  const activeTabId = useWorkspaceStore((state) => state.activeTabId);
  const activeTab = useWorkspaceStore(selectActiveTab);
  const predictionEnabled = useWorkspaceStore(
    (state) => state.predictionEnabled,
  );
  const clearCanvasVersion = useWorkspaceStore(
    (state) => state.clearCanvasVersion,
  );

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
  const addCombinedTab = useWorkspaceStore((state) => state.addCombinedTab);
  const closeTab = useWorkspaceStore((state) => state.closeTab);
  const renameTab = useWorkspaceStore((state) => state.renameTab);

  const [brushColor, setBrushColor] = useState("#ffffff");
  const [eraserMode, setEraserMode] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [pendingApplied, setPendingApplied] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [isCombining, setIsCombining] = useState(false);
  const [filesCollapsed, setFilesCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [combineModalOpen, setCombineModalOpen] = useState(false);

  const predictionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const combineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasApiRef = useRef<CanvasApi | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);

  const isOnDrawingTab = activeTab.kind === "drawing";

  // Track which drawing tab the canvas currently shows so we know which tab to
  // save into when the user switches.
  const displayedTabIdRef = useRef<string>(
    isOnDrawingTab ? activeTabId : tabs.find((t) => t.kind === "drawing")?.id ?? activeTabId,
  );

  useEffect(() => {
    return () => {
      if (predictionTimerRef.current) clearTimeout(predictionTimerRef.current);
      if (combineTimerRef.current) clearTimeout(combineTimerRef.current);
    };
  }, []);

  // Persist the currently-displayed drawing tab's state + preview, then load
  // the new tab's saved drawing.
  useEffect(() => {
    if (!canvasReady) return;
    const api = canvasApiRef.current;
    if (!api) return;

    const previousTabId = displayedTabIdRef.current;
    const previousTab = tabs.find((t) => t.id === previousTabId);

    if (previousTabId !== activeTabId && previousTab?.kind === "drawing") {
      const previousState = api.getJSON();
      const previousPreview = api.getDataURL();
      saveTabCanvasState(previousTabId, previousState, previousPreview);
    }

    if (activeTab.kind === "drawing") {
      displayedTabIdRef.current = activeTabId;
      void api.loadJSON(activeTab.canvasState ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId, canvasReady]);

  const handleCanvasReady = useCallback((api: CanvasApi) => {
    canvasApiRef.current = api;
    setCanvasReady(true);
  }, []);

  const handleSelectTab = useCallback(
    (id: string) => {
      if (id === activeTabId) return;
      setActiveTab(id);
    },
    [activeTabId, setActiveTab],
  );

  const handleCloseTab = useCallback(
    (id: string) => {
      closeTab(id);
    },
    [closeTab],
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

  // Hardcoded demo: skip API, reveal active tab's predefined GLB after 3s.
  // Tabs without a preloaded GLB simply leave the 3D viewport empty.
  const handleGenerate = useCallback(async () => {
    if (activeTab.kind !== "drawing") return;
    const targetTabId = activeTab.id;
    setTabGenerationError(targetTabId, null);
    setTabGenerating(targetTabId, true);
    await new Promise((resolve) => setTimeout(resolve, GENERATE_DURATION_MS));
    if (activeTab.predefinedGlbUrl) {
      setTabGenerationResult(targetTabId, {
        glbUrl: activeTab.predefinedGlbUrl,
        source: activeTab.predefinedSource,
        usedFallback: false,
        fallbackReason: null,
      });
    }
    setTabGenerating(targetTabId, false);
  }, [
    activeTab,
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

  // Snapshot every drawing tab so the combined preview can show all sources.
  // The currently-active drawing tab is captured live; others are read from
  // their stored previewDataUrl.
  const captureSourcePreviews = useCallback(() => {
    return tabs
      .filter((t) => t.kind === "drawing")
      .map((tab) => {
        if (tab.id === activeTabId) {
          const liveDataUrl = canvasApiRef.current?.getDataURL() ?? null;
          return {
            tabId: tab.id,
            label: tab.label,
            dataUrl: liveDataUrl ?? tab.previewDataUrl,
          };
        }
        return {
          tabId: tab.id,
          label: tab.label,
          dataUrl: tab.previewDataUrl,
        };
      });
  }, [tabs, activeTabId]);

  const drawingTabCount = useMemo(
    () => tabs.filter((t) => t.kind === "drawing").length,
    [tabs],
  );

  const handleCombineClick = useCallback(
    (selectedIds: string[]) => {
      if (isCombining) return;
      if (selectedIds.length < 2) return;

      // Snapshot the active drawing tab into its store entry first so the
      // composited tab can read accurate source previews.
      if (activeTab.kind === "drawing") {
        const json = canvasApiRef.current?.getJSON() ?? null;
        const preview = canvasApiRef.current?.getDataURL() ?? null;
        saveTabCanvasState(activeTabId, json, preview);
      }

      setIsCombining(true);
      combineTimerRef.current = setTimeout(() => {
        const previews = captureSourcePreviews().filter((p) =>
          selectedIds.includes(p.tabId),
        );
        const sourceLabels = previews.map((p) => p.label).join(" + ");
        addCombinedTab({
          label: `Combined: ${sourceLabels}`,
          glbUrl: COMBINED_GLB_URL,
          source: "combined",
          sourceTabIds: previews.map((p) => p.tabId),
          sourcePreviews: previews,
        });
        setIsCombining(false);
        combineTimerRef.current = null;
      }, COMBINE_WARMUP_MS);
    },
    [
      isCombining,
      activeTab,
      activeTabId,
      saveTabCanvasState,
      captureSourcePreviews,
      addCombinedTab,
    ],
  );

  const gridColumns = useMemo(() => {
    const parts: string[] = [];
    if (!filesCollapsed) parts.push("220px");
    parts.push("minmax(0,1fr)");
    if (!chatCollapsed) parts.push("300px");
    return parts.join(" ");
  }, [filesCollapsed, chatCollapsed]);

  const sketchpadHeader = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold tracking-[0.2em] text-white/80 uppercase">
          {activeTab.kind === "combined" ? "Combined Preview" : "Sketchpad"}
        </h2>
        <span
          className={`text-xs ${
            activeTab.kind === "combined"
              ? "text-violet-200/80"
              : "text-white/40"
          }`}
        >
          {activeTab.label}
        </span>
      </div>
    </div>
  );

  // Drawing-tab body: toolbar + canvas + prediction panel + action buttons.
  // The canvas itself stays mounted on combined tabs (just hidden) so the
  // single-instance Fabric setup keeps working — we swap the visible content.
  const sketchpadBody = (
    <>
      {isOnDrawingTab && (
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
      )}

      <div className={`relative flex-1 ${isOnDrawingTab ? "" : "hidden"}`}>
        <Canvas
          predictionEnabled={predictionEnabled}
          clearVersion={clearCanvasVersion}
          onReady={handleCanvasReady}
          fillHeight
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

      {!isOnDrawingTab && (
        <div className="flex flex-1 flex-col">
          <CombinedSketchPreview tab={activeTab} />
        </div>
      )}

      {isOnDrawingTab && predictionEnabled && (
        <PredictionPanel onApply={handleApplyVariation} />
      )}

      {isOnDrawingTab && (
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
      )}
    </>
  );

  return (
    <main className="flex min-h-screen flex-col bg-black p-3 text-zinc-100 md:p-4">
      <header className="mb-3 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-2.5 shadow-[0_0_60px_-30px_rgba(59,130,246,0.45)] backdrop-blur">
        <div className="flex items-center gap-3">
          <BloomLogo size={28} />
          <h1 className="text-lg font-semibold text-white">Bloom Workspace</h1>
          <span className="hidden text-sm text-white/60 sm:inline">·</span>
          <p className="hidden text-sm text-white/60 sm:block">
            An IDE for artists and 3D modeling
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilesCollapsed((v) => !v)}
            aria-pressed={!filesCollapsed}
            title={filesCollapsed ? "Show files" : "Hide files"}
            className={`flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              filesCollapsed
                ? "border-white/10 bg-zinc-900 text-white/60 hover:bg-zinc-800 hover:text-white/80"
                : "border-white/15 bg-zinc-800 text-white hover:bg-zinc-700"
            }`}
          >
            Files
          </button>
          <button
            type="button"
            onClick={() => setChatCollapsed((v) => !v)}
            aria-pressed={!chatCollapsed}
            title={chatCollapsed ? "Show chat" : "Hide chat"}
            className={`flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              chatCollapsed
                ? "border-white/10 bg-zinc-900 text-white/60 hover:bg-zinc-800 hover:text-white/80"
                : "border-white/15 bg-zinc-800 text-white hover:bg-zinc-700"
            }`}
          >
            Chat
          </button>
        </div>
      </header>

      <div
        className="grid flex-1 gap-3"
        style={{ gridTemplateColumns: gridColumns }}
      >
        {!filesCollapsed && (
          <div className="min-h-0">
            <FileExplorer
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
              onCombineClick={() => setCombineModalOpen(true)}
              isCombining={isCombining}
              canCombine={drawingTabCount >= 2}
              onRenameTab={renameTab}
            />
          </div>
        )}

        {/* Center: sketchpad + 3D environment side-by-side */}
        <div className="grid min-h-0 gap-3 xl:grid-cols-2">
          <section className="flex min-h-[640px] flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-950/70 p-4 shadow-[0_0_50px_-30px_rgba(59,130,246,0.4)] backdrop-blur">
            {sketchpadHeader}
            {sketchpadBody}
          </section>
          <div className="flex min-h-[640px] flex-col">
            <Scene />
          </div>
        </div>

        {!chatCollapsed && (
          <div className="min-h-0">
            <aside className="flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-950/70 p-3 shadow-[0_0_50px_-30px_rgba(59,130,246,0.4)] backdrop-blur">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-semibold tracking-[0.25em] text-white/50 uppercase">
                  Context
                </span>
              </div>
              <div className="flex-1">
                <ChatSidebar />
              </div>
            </aside>
          </div>
        )}
      </div>

      {combineModalOpen && (
        <CombineModal
          tabs={tabs.filter((t) => t.kind === "drawing")}
          defaultSelectedIds={["tab-1", "tab-2"]}
          onCancel={() => setCombineModalOpen(false)}
          onConfirm={(selectedIds) => {
            setCombineModalOpen(false);
            handleCombineClick(selectedIds);
          }}
        />
      )}
    </main>
  );
}
