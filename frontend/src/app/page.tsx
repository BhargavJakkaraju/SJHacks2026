import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16 text-zinc-100">
      <section className="w-full max-w-4xl rounded-3xl border border-zinc-800/70 bg-zinc-950/70 p-8 shadow-[0_0_90px_-30px_rgba(37,99,235,0.45)] backdrop-blur md:p-12">
        <p className="mb-5 inline-flex rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-1 text-xs font-semibold tracking-[0.2em] text-blue-200 uppercase">
          ArtForge
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Sketch ideas. Shape worlds. Ship 3D faster.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
          ArtForge is an AI-native workspace where rough sketches become editable
          3D scenes. Build concepts in minutes, then refine with direct controls
          and natural language.
        </p>

        <div className="mt-10">
          <Link
            href="/workspace"
            className="inline-flex items-center rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none"
          >
            Start Creating
          </Link>
        </div>
      </section>
    </main>
  );
}
