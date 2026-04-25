"use client";

import PredictionOverlay from "@/components/sketchpad/PredictionOverlay";

type CanvasProps = {
  predictionEnabled: boolean;
};

export default function Canvas({ predictionEnabled }: CanvasProps) {
  return (
    <div className="relative h-72 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 md:h-80">
      <PredictionOverlay enabled={predictionEnabled} />
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-700 text-center text-sm text-zinc-400">
        <p>
          Sketchpad placeholder.
          <br />
          TODO: mount Fabric.js canvas and export snapshot for AI pipeline.
        </p>
      </div>
    </div>
  );
}
