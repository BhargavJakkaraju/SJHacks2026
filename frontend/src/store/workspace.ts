"use client";

import { create } from "zustand";

export type WorkspaceTab = {
  id: string;
  label: string;
  // Drawing tabs let users sketch and generate; combined tabs are read-only
  // composites of two or more drawing tabs.
  kind: "drawing" | "combined";
  // Static, hardcoded asset that "Compile & Generate" reveals for this tab
  // (drawing tabs only).
  predefinedGlbUrl: string;
  predefinedSource: string;
  // Source drawing tabs that produced this combined tab (combined tabs only).
  sourceTabIds?: string[];
  // Snapshots of source drawings shown side-by-side in a combined tab.
  sourcePreviews?: { tabId: string; label: string; dataUrl: string | null }[];
  // Combined tabs can be closed by the user; drawing tabs cannot for the demo.
  isClosable: boolean;
  // Runtime per-tab state
  glbUrl: string | null;
  glbSource: string | null;
  usedFallback: boolean;
  fallbackReason: string | null;
  isGenerating: boolean;
  generationError: string | null;
  // Fabric.js canvas serialization (drawing tabs only)
  canvasState: object | null;
  // PNG snapshot of the canvas (drawing tabs only) used for combined previews
  previewDataUrl: string | null;
};

export const COMBINED_GLB_URL = "/models/santa-basketball.glb";

const INITIAL_TABS: WorkspaceTab[] = [
  {
    id: "tab-1",
    label: "Tab 1",
    kind: "drawing",
    predefinedGlbUrl: "/models/basketball.glb",
    predefinedSource: "tab-1",
    isClosable: false,
    glbUrl: null,
    glbSource: null,
    usedFallback: false,
    fallbackReason: null,
    isGenerating: false,
    generationError: null,
    canvasState: null,
    previewDataUrl: null,
  },
  {
    id: "tab-2",
    label: "Tab 2",
    kind: "drawing",
    predefinedGlbUrl: "/models/santa-hat.glb",
    predefinedSource: "tab-2",
    isClosable: false,
    glbUrl: null,
    glbSource: null,
    usedFallback: false,
    fallbackReason: null,
    isGenerating: false,
    generationError: null,
    canvasState: null,
    previewDataUrl: null,
  },
];

type CombinedTabInput = {
  label: string;
  glbUrl: string;
  source: string;
  sourceTabIds: string[];
  sourcePreviews: { tabId: string; label: string; dataUrl: string | null }[];
};

type WorkspaceState = {
  selectedObject: string | null;
  predictionEnabled: boolean;
  clearCanvasVersion: number;

  tabs: WorkspaceTab[];
  activeTabId: string;
  combinedGlbUrl: string;

  setSelectedObject: (selectedObject: string | null) => void;
  togglePrediction: () => void;
  setPredictionEnabled: (enabled: boolean) => void;
  requestClearCanvas: () => void;

  // Tab management
  setActiveTab: (id: string) => void;
  setTabGenerating: (id: string, isGenerating: boolean) => void;
  setTabGenerationResult: (
    id: string,
    result: {
      glbUrl: string;
      source: string;
      usedFallback: boolean;
      fallbackReason: string | null;
    },
  ) => void;
  setTabGenerationError: (id: string, message: string | null) => void;
  saveTabCanvasState: (
    id: string,
    canvasState: object | null,
    previewDataUrl: string | null,
  ) => void;
  resetTabGeneration: (id: string) => void;

  // Combined tab management
  addCombinedTab: (input: CombinedTabInput) => string;
  closeTab: (id: string) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedObject: null,
  predictionEnabled: false,
  clearCanvasVersion: 0,

  tabs: INITIAL_TABS,
  activeTabId: INITIAL_TABS[0].id,
  combinedGlbUrl: COMBINED_GLB_URL,

  setSelectedObject: (selectedObject) => set({ selectedObject }),
  togglePrediction: () =>
    set((state) => ({ predictionEnabled: !state.predictionEnabled })),
  setPredictionEnabled: (predictionEnabled) => set({ predictionEnabled }),
  requestClearCanvas: () =>
    set((state) => ({ clearCanvasVersion: state.clearCanvasVersion + 1 })),

  setActiveTab: (id) => set({ activeTabId: id }),

  setTabGenerating: (id, isGenerating) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id ? { ...tab, isGenerating } : tab,
      ),
    })),

  setTabGenerationResult: (
    id,
    { glbUrl, source, usedFallback, fallbackReason },
  ) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id
          ? {
              ...tab,
              glbUrl,
              glbSource: source,
              usedFallback,
              fallbackReason,
              generationError: null,
            }
          : tab,
      ),
    })),

  setTabGenerationError: (id, message) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id ? { ...tab, generationError: message } : tab,
      ),
    })),

  saveTabCanvasState: (id, canvasState, previewDataUrl) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id
          ? {
              ...tab,
              canvasState,
              previewDataUrl: previewDataUrl ?? tab.previewDataUrl,
            }
          : tab,
      ),
    })),

  resetTabGeneration: (id) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id
          ? {
              ...tab,
              glbUrl: null,
              glbSource: null,
              usedFallback: false,
              fallbackReason: null,
              generationError: null,
            }
          : tab,
      ),
    })),

  addCombinedTab: ({ label, glbUrl, source, sourceTabIds, sourcePreviews }) => {
    const id = `tab-combined-${Date.now()}`;
    const newTab: WorkspaceTab = {
      id,
      label,
      kind: "combined",
      predefinedGlbUrl: glbUrl,
      predefinedSource: source,
      sourceTabIds,
      sourcePreviews,
      isClosable: true,
      glbUrl,
      glbSource: source,
      usedFallback: false,
      fallbackReason: null,
      isGenerating: false,
      generationError: null,
      canvasState: null,
      previewDataUrl: null,
    };
    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: id,
    }));
    return id;
  },

  closeTab: (id) =>
    set((state) => {
      const target = state.tabs.find((tab) => tab.id === id);
      if (!target || !target.isClosable) return {};
      const remaining = state.tabs.filter((tab) => tab.id !== id);
      let nextActiveId = state.activeTabId;
      if (state.activeTabId === id) {
        nextActiveId = remaining[0]?.id ?? state.activeTabId;
      }
      return { tabs: remaining, activeTabId: nextActiveId };
    }),
}));

export function selectActiveTab(state: WorkspaceState): WorkspaceTab {
  return (
    state.tabs.find((tab) => tab.id === state.activeTabId) ?? state.tabs[0]
  );
}
