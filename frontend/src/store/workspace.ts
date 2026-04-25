"use client";

import { create } from "zustand";

type WorkspaceState = {
  selectedObject: string | null;
  predictionEnabled: boolean;
  isGenerating: boolean;
  setSelectedObject: (selectedObject: string | null) => void;
  togglePrediction: () => void;
  setGenerating: (isGenerating: boolean) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedObject: null,
  predictionEnabled: false,
  isGenerating: false,
  setSelectedObject: (selectedObject) => set({ selectedObject }),
  togglePrediction: () =>
    set((state) => ({ predictionEnabled: !state.predictionEnabled })),
  setGenerating: (isGenerating) => set({ isGenerating }),
}));
