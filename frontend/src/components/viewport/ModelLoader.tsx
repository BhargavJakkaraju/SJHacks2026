"use client";

type ModelLoaderProps = {
  modelUrl: string | null;
  source: string | null;
  error: string | null;
};

export default function ModelLoader({ modelUrl, source, error }: ModelLoaderProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-xs text-zinc-400">
      {error ? <p className="text-red-300">Generation failed: {error}</p> : null}
      {modelUrl ? (
        <>
          <p>
            Model ready {source ? `(${source})` : ""}:{" "}
            <a
              href={modelUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-300 underline"
            >
              Open GLB
            </a>
          </p>
          <p className="mt-1 text-zinc-500">{modelUrl}</p>
        </>
      ) : (
        <p>Model loader: waiting for generated `GLB` URL.</p>
      )}
    </div>
  );
}
