"use client";

import { create } from "zustand";

type WorkspaceState = {
  selectedObject: string | null;
  predictionEnabled: boolean;
  isGenerating: boolean;
  clearCanvasVersion: number;
  generatedModelUrl: string | null;
  modelSource: string | null;
  generationError: string | null;
  setSelectedObject: (selectedObject: string | null) => void;
  togglePrediction: () => void;
  setGenerating: (isGenerating: boolean) => void;
  requestClearCanvas: () => void;
  setGeneratedModel: (payload: { url: string; source: string }) => void;
  setGenerationError: (message: string | null) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedObject: null,
  predictionEnabled: false,
  isGenerating: false,
  clearCanvasVersion: 0,
  generatedModelUrl: null,
  modelSource: null,
  generationError: null,
  setSelectedObject: (selectedObject) => set({ selectedObject }),
  togglePrediction: () =>
    set((state) => ({ predictionEnabled: !state.predictionEnabled })),
  setGenerating: (isGenerating) => set({ isGenerating }),
  requestClearCanvas: () =>
    set((state) => ({ clearCanvasVersion: state.clearCanvasVersion + 1 })),
  setGeneratedModel: ({ url, source }) =>
    set({
      generatedModelUrl: url,
      modelSource: source,
      generationError: null,
    }),
  setGenerationError: (message) => set({ generationError: message }),
}));
