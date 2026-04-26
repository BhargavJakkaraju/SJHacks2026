"use client";

type ToolbarProps = {
  onClear: () => void;
};

export default function Toolbar({ onClear }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70">
        Brush: Black Ink
      </div>
      <button
        type="button"
        onClick={onClear}
        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        Clear Canvas
      </button>
    </div>
  );
}
