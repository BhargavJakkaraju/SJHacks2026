"use client";

import { create } from "zustand";

// Hardcoded demo tab configuration. Each tab maps a label to a GLB asset.
export type WorkspaceTab = {
  id: string;
  label: string;
  // Static, hardcoded asset that "Compile & Generate" reveals for this tab.
  predefinedGlbUrl: string;
  predefinedSource: string;
  // Runtime per-tab state
  glbUrl: string | null;
  glbSource: string | null;
  usedFallback: boolean;
  fallbackReason: string | null;
  isGenerating: boolean;
  generationError: string | null;
  // Fabric.js canvas serialization
  canvasState: object | null;
};

export const COMBINED_GLB_URL = "/models/santa-basketball.glb";

const INITIAL_TABS: WorkspaceTab[] = [
  {
    id: "tab-1",
    label: "Tab 1",
    predefinedGlbUrl: "/models/basketball.glb",
    predefinedSource: "tab-1",
    glbUrl: null,
    glbSource: null,
    usedFallback: false,
    fallbackReason: null,
    isGenerating: false,
    generationError: null,
    canvasState: null,
  },
  {
    id: "tab-2",
    label: "Tab 2",
    predefinedGlbUrl: "/models/santa-hat.glb",
    predefinedSource: "tab-2",
    glbUrl: null,
    glbSource: null,
    usedFallback: false,
    fallbackReason: null,
    isGenerating: false,
    generationError: null,
    canvasState: null,
  },
];

type WorkspaceState = {
  selectedObject: string | null;
  predictionEnabled: boolean;
  clearCanvasVersion: number;

  tabs: WorkspaceTab[];
  activeTabId: string;

  // Combined-view state (3D environment swaps to combined model)
  combineActive: boolean;
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
  saveTabCanvasState: (id: string, canvasState: object | null) => void;
  resetTabGeneration: (id: string) => void;

  // Combine
  setCombineActive: (active: boolean) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedObject: null,
  predictionEnabled: false,
  clearCanvasVersion: 0,

  tabs: INITIAL_TABS,
  activeTabId: INITIAL_TABS[0].id,

  combineActive: false,
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

  saveTabCanvasState: (id, canvasState) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id ? { ...tab, canvasState } : tab,
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

  setCombineActive: (combineActive) => set({ combineActive }),
}));

// Selector helper for the currently active tab.
export function selectActiveTab(state: WorkspaceState): WorkspaceTab {
  return (
    state.tabs.find((tab) => tab.id === state.activeTabId) ?? state.tabs[0]
  );
}
