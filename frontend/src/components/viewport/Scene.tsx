"use client";

import { useEffect, useState, type ElementType } from "react";

import ModelLoader from "@/components/viewport/ModelLoader";
import TransformGizmo from "@/components/viewport/TransformGizmo";

type SceneProps = {
  modelUrl: string | null;
  modelSource: string | null;
  generationError: string | null;
};

export default function Scene({ modelUrl, modelSource, generationError }: SceneProps) {
  const [viewerReady, setViewerReady] = useState(false);
  const ModelViewerTag = "model-viewer" as ElementType;

  useEffect(() => {
    let isMounted = true;
    import("@google/model-viewer")
      .then(() => {
        if (isMounted) {
          setViewerReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setViewerReady(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">
          3D Environment
        </h2>
        <TransformGizmo />
      </div>
      <div className="mb-3 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950/40">
        {modelUrl && viewerReady ? (
          <ModelViewerTag
            src={modelUrl}
            camera-controls={true}
            auto-rotate={true}
            shadow-intensity="0.7"
            exposure="1"
            style={{ width: "100%", height: "320px", background: "transparent" }}
          />
        ) : (
          <div className="flex h-60 items-center justify-center text-center text-sm text-zinc-400 md:h-72">
            <p>
              {modelUrl
                ? "Loading 3D viewer..."
                : "Generate a model from the sketchpad to preview it here."}
              <br />
              Meshy model generation is currently configured for no textures.
            </p>
          </div>
        )}
      </div>
      <ModelLoader modelUrl={modelUrl} source={modelSource} error={generationError} />
    </section>
  );
}
