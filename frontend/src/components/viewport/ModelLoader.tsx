"use client";

import { Suspense, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Center,
  Grid,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";

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

function CheckerPlane() {
  const texture = useMemo(() => {
    const size = 512;
    const tileSize = 32;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const even = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
        const v = even ? 28 : 42;
        const i = (y * size + x) * 4;
        data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 255;
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 10);
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
    </mesh>
  );
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
      camera={{ position: [3, 2.5, 4], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#0d0d0d"]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <pointLight position={[-4, 4, -4]} intensity={0.4} color="#3b82f6" />

      <CheckerPlane />
      <Grid
        position={[0, -0.895, 0]}
        args={[30, 30]}
        cellSize={0.5}
        cellThickness={0.4}
        cellColor="#2a2a2a"
        sectionSize={2}
        sectionThickness={0.8}
        sectionColor="#3a3a3a"
        fadeDistance={18}
        fadeStrength={1.5}
        infiniteGrid
      />

      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.2}>
          <Center>
            <GltfModel key={resolved} url={resolved} />
          </Center>
        </Bounds>
      </Suspense>

      <OrbitControls makeDefault enableDamping />
    </Canvas>
  );
}

function EmptyScene() {
  return (
    <Canvas
      camera={{ position: [3, 2.5, 4], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#0d0d0d"]} />
      <ambientLight intensity={0.35} />
      <CheckerPlane />
      <Grid
        position={[0, -0.895, 0]}
        args={[30, 30]}
        cellSize={0.5}
        cellThickness={0.4}
        cellColor="#2a2a2a"
        sectionSize={2}
        sectionThickness={0.8}
        sectionColor="#3a3a3a"
        fadeDistance={18}
        fadeStrength={1.5}
        infiniteGrid
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
    <div className="relative h-72 overflow-hidden rounded-lg border border-white/10 bg-[#0d0d0d] md:h-96">
      {glbUrl ? <ViewerScene glbUrl={glbUrl} /> : <EmptyScene />}

      {!glbUrl && !isGenerating && (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-5">
          <p className="rounded-full border border-white/10 bg-black/60 px-4 py-1.5 text-xs text-white/40 backdrop-blur">
            Draw a sketch and hit Compile &amp; Generate
          </p>
        </div>
      )}

      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white backdrop-blur-sm">
          Generating model...
        </div>
      )}

      {generationError && (
        <div className="absolute bottom-2 left-2 right-2 rounded-md border border-red-500/30 bg-red-900/40 px-3 py-2 text-xs text-red-300 backdrop-blur">
          {generationError}
        </div>
      )}
    </div>
  );
}
