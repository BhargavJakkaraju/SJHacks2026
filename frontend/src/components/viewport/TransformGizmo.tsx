"use client";

const controls = ["Move", "Scale", "Rotate"];

export default function TransformGizmo() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
      {controls.map((control) => (
        <button
          key={control}
          type="button"
          className="rounded-md border border-white/10 bg-zinc-950/70 px-2.5 py-1 text-xs text-white/80 transition hover:bg-white/10"
        >
          {control}
        </button>
      ))}
    </div>
  );
}
