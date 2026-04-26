"use client";

import { useRef, useState } from "react";

type ToolbarProps = {
  onClear: () => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  eraserMode: boolean;
  onEraserToggle: () => void;
  presetColors: string[];
  selectionMode: boolean;
  onSelectionToggle: () => void;
};

export default function Toolbar({
  onClear,
  activeColor,
  onColorChange,
  eraserMode,
  onEraserToggle,
  presetColors,
  selectionMode,
  onSelectionToggle,
}: ToolbarProps) {
  const colorInputRef = useRef<HTMLInputElement | null>(null);
  const [, setShowWheel] = useState(false);

  const handlePlusClick = () => {
    setShowWheel((v) => !v);
    colorInputRef.current?.click();
  };

  const handleWheelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onColorChange(e.target.value);
    setShowWheel(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
      {/* Color swatches row */}
      <div className="flex items-center gap-2">
        {presetColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onColorChange(color)}
            title={color}
            className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 transition"
            style={{
              backgroundColor: color,
              borderColor:
                !eraserMode && activeColor === color ? "#3b82f6" : "transparent",
              boxShadow:
                !eraserMode && activeColor === color
                  ? "0 0 0 2px #09090b, 0 0 0 4px #3b82f6"
                  : "0 1px 3px rgba(0,0,0,0.6)",
            }}
          />
        ))}

        {/* + circle to open native color wheel */}
        <div className="relative">
          <button
            type="button"
            onClick={handlePlusClick}
            title="Custom color"
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-white/30 bg-transparent text-white/60 text-sm font-bold transition hover:bg-white/10"
          >
            +
          </button>
          {/* Hidden native color input — triggers OS color wheel */}
          <input
            ref={colorInputRef}
            type="color"
            defaultValue="#ffffff"
            onChange={handleWheelChange}
            className="absolute left-0 top-0 h-0 w-0 opacity-0"
            tabIndex={-1}
          />
        </div>

        {/* Eraser */}
        <button
          type="button"
          onClick={onEraserToggle}
          title="Eraser"
          className={`flex h-7 items-center gap-1 rounded-full border-2 px-2.5 text-xs font-medium transition ${
            eraserMode
              ? "border-blue-500 bg-blue-600 text-white"
              : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          <span>⌫</span>
          <span>Eraser</span>
        </button>

        {/* Select / Move / Resize */}
        <button
          type="button"
          onClick={onSelectionToggle}
          title="Select, move & resize objects"
          className={`flex h-7 items-center gap-1 rounded-full border-2 px-2.5 text-xs font-medium transition ${
            selectionMode
              ? "border-violet-500 bg-violet-600 text-white"
              : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          <span>↖</span>
          <span>Select</span>
        </button>
      </div>

      {/* Active color label + clear */}
      <div className="flex items-center gap-2">
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
          {selectionMode
            ? "Select mode"
            : eraserMode
              ? "Eraser active"
              : `Color: ${activeColor}`}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10"
        >
          Clear Canvas
        </button>
      </div>
    </div>
  );
}
