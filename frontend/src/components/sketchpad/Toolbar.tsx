"use client";

import { useState } from "react";

type ToolbarProps = {
  onClear: () => void;
  brushColor: string;
  onBrushColorChange: (color: string) => void;
  activeTool: "brush" | "picker" | "transform";
  onToolChange: (tool: "brush" | "picker" | "transform") => void;
};

const BRUSH_COLORS = [
  "#000000",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

export default function Toolbar({
  onClear,
  brushColor,
  onBrushColorChange,
  activeTool,
  onToolChange,
}: ToolbarProps) {
  const [showPalette, setShowPalette] = useState(false);

  const handleHexInputChange = (value: string) => {
    const normalized = value.startsWith("#") ? value : `#${value}`;
    if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
      onBrushColorChange(normalized.toLowerCase());
    }
  };

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 lg:w-52 lg:min-w-52 lg:shrink-0">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowPalette((value) => !value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800"
        >
          Colors
        </button>
        <button
          type="button"
          onClick={() => onToolChange("brush")}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            activeTool === "brush"
              ? "border-blue-500 bg-blue-500/20 text-blue-200"
              : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
          }`}
        >
          Brush
        </button>
        <button
          type="button"
          onClick={() => onToolChange("transform")}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            activeTool === "transform"
              ? "border-emerald-500 bg-emerald-500/20 text-emerald-200"
              : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
          }`}
        >
          Transform
        </button>
        {showPalette ? (
          <div className="flex flex-col gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5">
            <label className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-300">
              Wheel
              <input
                type="color"
                value={brushColor}
                onChange={(event) => onBrushColorChange(event.target.value)}
                className="h-6 w-8 cursor-pointer rounded border border-zinc-600 bg-transparent p-0"
              />
            </label>
            <label className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-300">
              Hex
              <input
                type="text"
                value={brushColor}
                onChange={(event) => handleHexInputChange(event.target.value)}
                className="w-24 rounded border border-zinc-600 bg-zinc-900 px-2 py-0.5 font-mono text-xs text-zinc-100 outline-none focus:border-blue-500"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {BRUSH_COLORS.map((color) => {
                const isActive = brushColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Select brush color ${color}`}
                    onClick={() => onBrushColorChange(color)}
                    className={`h-5 w-5 rounded-full border transition ${
                      isActive
                        ? "border-white ring-2 ring-white/70"
                        : "border-zinc-500 hover:border-zinc-200"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                );
              })}
            </div>
          </div>
        ) : null}
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
