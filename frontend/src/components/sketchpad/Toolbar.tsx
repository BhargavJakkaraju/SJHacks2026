"use client";

type ToolbarProps = {
  onClear: () => void;
};

export default function Toolbar({ onClear }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50/70 p-3">
      <div className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-sky-900">
        Brush: Black Ink
      </div>
      <button
        type="button"
        onClick={onClear}
        className="rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium text-sky-800 transition hover:bg-sky-100"
      >
        Clear Canvas
      </button>
    </div>
  );
}
