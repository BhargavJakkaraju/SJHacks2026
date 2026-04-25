"use client";

const toolButtons = ["Brush", "Eraser", "Color", "Line Weight"];

export default function Toolbar() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
      {toolButtons.map((tool) => (
        <button
          key={tool}
          type="button"
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800"
        >
          {tool}
        </button>
      ))}
    </div>
  );
}
