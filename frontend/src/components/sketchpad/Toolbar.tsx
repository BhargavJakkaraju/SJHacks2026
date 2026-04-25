"use client";

type ToolbarProps = {
  onClear: () => void;
};

export default function Toolbar({ onClear }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200">
        Brush: Black Ink
      </div>
      <button
        type="button"
        onClick={onClear}
        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800"
      >
        Clear Canvas
      </button>
    </div>
  );
}
