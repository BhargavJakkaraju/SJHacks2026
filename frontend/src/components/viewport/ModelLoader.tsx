"use client";

import { Suspense, useEffect, useMemo } from "react";
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
  if (!API_BASE_URL) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function GltfModel({ url }: { url: string }) {
  const gltf = useGLTF(url);
  // Drop the loaded scene from drei's cache when the URL changes so we don't
  // pile up GPU memory after repeated generations.
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
      <color attach="background" args={["#e0f2fe"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} castShadow />
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
        opacity={0.45}
        scale={8}
        blur={2.4}
        far={4}
      />
      <OrbitControls makeDefault enableDamping />
    </Canvas>
  );
}

export default function ModelLoader({
  glbUrl,
  isGenerating,
  generationError,
}: ModelLoaderProps) {
  return (
    <div className="relative h-72 overflow-hidden rounded-lg border border-sky-200 bg-sky-50 md:h-96">
      {glbUrl ? (
        <ViewerScene glbUrl={glbUrl} />
      ) : (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-sky-700">
          {isGenerating
            ? "Generating model..."
            : "Draw a sketch and hit Compile & Generate to load a 3D model here."}
        </div>
      )}
      {isGenerating && glbUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-100/70 text-sm text-sky-900">
          Generating new model...
        </div>
      )}
      {generationError && (
        <div className="absolute bottom-2 left-2 right-2 rounded-md border border-red-300 bg-red-50/90 px-3 py-2 text-xs text-red-800">
          {generationError}
        </div>
      )}
    </div>
  );
}
