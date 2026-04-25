"use client";

import { create } from "zustand";

type WorkspaceState = {
  selectedObject: string | null;
  predictionEnabled: boolean;
  isGenerating: boolean;
  clearCanvasVersion: number;
  glbUrl: string | null;
  glbSource: string | null;
  usedFallback: boolean;
  fallbackReason: string | null;
  generationError: string | null;
  setSelectedObject: (selectedObject: string | null) => void;
  togglePrediction: () => void;
  setGenerating: (isGenerating: boolean) => void;
  requestClearCanvas: () => void;
  setGenerationResult: (result: {
    glbUrl: string;
    source: string;
    usedFallback: boolean;
    fallbackReason: string | null;
  }) => void;
  setGenerationError: (message: string | null) => void;
  resetGeneration: () => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedObject: null,
  predictionEnabled: false,
  isGenerating: false,
  clearCanvasVersion: 0,
  glbUrl: null,
  glbSource: null,
  usedFallback: false,
  fallbackReason: null,
  generationError: null,
  setSelectedObject: (selectedObject) => set({ selectedObject }),
  togglePrediction: () =>
    set((state) => ({ predictionEnabled: !state.predictionEnabled })),
  setGenerating: (isGenerating) => set({ isGenerating }),
  requestClearCanvas: () =>
    set((state) => ({ clearCanvasVersion: state.clearCanvasVersion + 1 })),
  setGenerationResult: ({ glbUrl, source, usedFallback, fallbackReason }) =>
    set({
      glbUrl,
      glbSource: source,
      usedFallback,
      fallbackReason,
      generationError: null,
    }),
  setGenerationError: (generationError) => set({ generationError }),
  resetGeneration: () =>
    set({
      glbUrl: null,
      glbSource: null,
      usedFallback: false,
      fallbackReason: null,
      generationError: null,
    }),
}));
