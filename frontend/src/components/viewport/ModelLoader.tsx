"use client";

import { Component, Suspense, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Center,
  ContactShadows,
  Environment,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";

type ModelLoaderProps = {
  glbUrl: string | null;
  isGenerating: boolean;
  generationError: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function resolveGlbUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  // Local public assets (e.g. /models/basketball.glb) should be served by Next.js
  // directly, not proxied through the backend.
  if (url.startsWith("/models/")) return url;
  if (!API_BASE_URL) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function GltfModel({ url }: { url: string }) {
  const gltf = useGLTF(url);
  useEffect(() => () => useGLTF.clear(url), [url]);
  return <primitive object={gltf.scene} />;
}

function ViewerScene({ glbUrl }: { glbUrl: string }) {
  const resolved = useMemo(() => resolveGlbUrl(glbUrl), [glbUrl]);
  return (
    <Canvas
      shadows
      camera={{ position: [2.5, 2, 3], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#09090b"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.2}>
          <Center>
            <GltfModel key={resolved} url={resolved} />
          </Center>
        </Bounds>
        <Environment preset="city" />
      </Suspense>
      <ContactShadows
        position={[0, -0.9, 0]}
        opacity={0.55}
        scale={8}
        blur={2.4}
        far={4}
      />
      <OrbitControls makeDefault enableDamping />
    </Canvas>
  );
}

type EBState = { hasError: boolean; message: string };
class ViewerErrorBoundary extends Component<
  { children: ReactNode },
  EBState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): EBState {
    const message =
      error instanceof Error ? error.message : "Unknown error loading model.";
    return { hasError: true, message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
          <span className="text-3xl">🏀</span>
          <p className="text-sm font-medium text-white/80">
            3D model could not be loaded.
          </p>
          <p className="text-xs text-white/50">{this.state.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: "" })}
            className="mt-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ModelLoader({
  glbUrl,
  isGenerating,
  generationError,
}: ModelLoaderProps) {
  return (
    <div className="relative h-72 overflow-hidden rounded-lg border border-white/10 bg-zinc-950 md:h-96">
      {glbUrl ? (
        <ViewerErrorBoundary key={glbUrl}>
          <ViewerScene glbUrl={glbUrl} />
        </ViewerErrorBoundary>
      ) : (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-white/60">
          {isGenerating
            ? "Generating model..."
            : "Draw a sketch and hit Compile & Generate to load a 3D model here."}
        </div>
      )}
      {isGenerating && glbUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-white/80">
          Generating new model...
        </div>
      )}
      {generationError && (
        <div className="absolute bottom-2 left-2 right-2 rounded-md border border-red-500/40 bg-red-500/15 px-3 py-2 text-xs text-red-200">
          {generationError}
        </div>
      )}
    </div>
  );
}
