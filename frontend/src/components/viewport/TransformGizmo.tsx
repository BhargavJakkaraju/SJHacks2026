"use client";

const controls = ["Move", "Scale", "Rotate"];

export default function TransformGizmo() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/70 p-2">
      {controls.map((control) => (
        <button
          key={control}
          type="button"
          className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 transition hover:bg-zinc-800"
        >
          {control}
        </button>
      ))}
    </div>
  );
}
