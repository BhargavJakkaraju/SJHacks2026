"use client";

const controls = ["Move", "Scale", "Rotate"];

export default function TransformGizmo() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50/70 p-2">
      {controls.map((control) => (
        <button
          key={control}
          type="button"
          className="rounded-md border border-sky-300 bg-white px-2.5 py-1 text-xs text-sky-800 transition hover:bg-sky-100"
        >
          {control}
        </button>
      ))}
    </div>
  );
}
