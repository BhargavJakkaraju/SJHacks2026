"use client";

import { create } from "zustand";

type WorkspaceState = {
  selectedObject: string | null;
  predictionEnabled: boolean;
  isGenerating: boolean;
  clearCanvasVersion: number;
  setSelectedObject: (selectedObject: string | null) => void;
  togglePrediction: () => void;
  setGenerating: (isGenerating: boolean) => void;
  requestClearCanvas: () => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedObject: null,
  predictionEnabled: false,
  isGenerating: false,
  clearCanvasVersion: 0,
  setSelectedObject: (selectedObject) => set({ selectedObject }),
  togglePrediction: () =>
    set((state) => ({ predictionEnabled: !state.predictionEnabled })),
  setGenerating: (isGenerating) => set({ isGenerating }),
  requestClearCanvas: () =>
    set((state) => ({ clearCanvasVersion: state.clearCanvasVersion + 1 })),
}));
