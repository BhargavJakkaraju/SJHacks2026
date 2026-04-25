"use client";

type PredictionOverlayProps = {
  enabled: boolean;
};

export default function PredictionOverlay({ enabled }: PredictionOverlayProps) {
  if (!enabled) {
    return null;
  }

  return (
    <div className="absolute top-3 left-3 rounded-lg border border-blue-400/40 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
      Looks like a character. Autocomplete suggestion ready.
    </div>
  );
}
