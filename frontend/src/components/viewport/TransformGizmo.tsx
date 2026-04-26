"use client";

const controls = ["Move", "Scale", "Rotate"];

export default function TransformGizmo() {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-1.5 backdrop-blur">
      {controls.map((control) => (
        <button
          key={control}
          type="button"
          className="rounded-md border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-white/60 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          {control}
        </button>
      ))}
    </div>
  );
}
