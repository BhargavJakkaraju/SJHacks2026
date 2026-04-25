"use client";

import ModelLoader from "@/components/viewport/ModelLoader";
import TransformGizmo from "@/components/viewport/TransformGizmo";

export default function Scene() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">
          3D Environment
        </h2>
        <TransformGizmo />
      </div>
      <div className="mb-3 flex h-60 items-center justify-center rounded-lg border border-dashed border-zinc-700 text-center text-sm text-zinc-400 md:h-72">
        <p>
          Viewport placeholder.
          <br />
          TODO: mount React Three Fiber scene and load generated models.
        </p>
      </div>
      <ModelLoader />
    </section>
  );
}
