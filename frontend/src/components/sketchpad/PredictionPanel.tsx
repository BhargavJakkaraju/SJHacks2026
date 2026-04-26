"use client";

// 4 hardcoded basketball sketch variations as transparent SVG overlays.
// They use stroke-only designs so they look like sketch guides, not filled blobs.

const BASKETBALL_VARIATIONS: { label: string; svg: string }[] = [
  {
    label: "Side View",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <circle cx="100" cy="100" r="76" fill="rgba(249,115,22,0.12)" stroke="#fb923c" stroke-width="3"/>
      <path d="M100 24 C128 48 128 152 100 176" fill="none" stroke="#fb923c" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M100 24 C72 48 72 152 100 176" fill="none" stroke="#fb923c" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M24 100 C48 72 152 72 176 100" fill="none" stroke="#fb923c" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M24 100 C48 128 152 128 176 100" fill="none" stroke="#fb923c" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    label: "3/4 View",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <ellipse cx="104" cy="100" rx="74" ry="72" fill="rgba(249,115,22,0.12)" stroke="#fb923c" stroke-width="3"/>
      <path d="M118 27 C148 52 148 150 118 174" fill="none" stroke="#fb923c" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M118 27 C92 52 92 150 118 174" fill="none" stroke="#fb923c" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M30 100 C55 76 155 76 178 100" fill="none" stroke="#fb923c" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M30 100 C55 124 155 124 178 100" fill="none" stroke="#fb923c" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    label: "Sketch",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <path d="M100 24 C144 22 177 56 178 100 C179 144 145 178 100 176 C56 178 22 144 22 100 C22 56 56 22 100 24 Z"
        fill="rgba(253,186,116,0.15)" stroke="#fdba74" stroke-width="2" stroke-linejoin="round"/>
      <path d="M100 24 C121 52 121 148 100 176" fill="none" stroke="#fdba74" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 2"/>
      <path d="M100 24 C79 52 79 148 100 176" fill="none" stroke="#fdba74" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 2"/>
      <path d="M22 100 C52 79 148 79 178 100" fill="none" stroke="#fdba74" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 2"/>
      <path d="M22 100 C52 121 148 121 178 100" fill="none" stroke="#fdba74" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 2"/>
    </svg>`,
  },
  {
    label: "Bold",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <circle cx="100" cy="100" r="76" fill="rgba(234,88,12,0.1)" stroke="#f97316" stroke-width="4"/>
      <path d="M100 24 C132 50 132 150 100 176" fill="none" stroke="#f97316" stroke-width="4" stroke-linecap="round"/>
      <path d="M100 24 C68 50 68 150 100 176" fill="none" stroke="#f97316" stroke-width="4" stroke-linecap="round"/>
      <path d="M24 100 C50 68 150 68 176 100" fill="none" stroke="#f97316" stroke-width="4" stroke-linecap="round"/>
      <path d="M24 100 C50 132 150 132 176 100" fill="none" stroke="#f97316" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  },
];

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

type PredictionPanelProps = {
  onApply: (dataUrl: string) => void;
};

export default function PredictionPanel({ onApply }: PredictionPanelProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-md backdrop-blur">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-xs font-semibold tracking-[0.2em] text-white/80 uppercase">
          AI Suggestions
        </h3>
        <span className="text-[10px] text-white/40">
          — click to apply to canvas
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {BASKETBALL_VARIATIONS.map((v) => (
          <button
            key={v.label}
            type="button"
            onClick={() => onApply(svgToDataUrl(v.svg))}
            className="group flex shrink-0 flex-col items-center gap-1 rounded-lg border border-white/10 bg-zinc-950/70 p-2 transition hover:border-blue-500/50 hover:bg-white/5"
          >
            <img
              src={svgToDataUrl(v.svg)}
              alt={v.label}
              className="h-24 w-24 rounded object-contain"
            />
            <span className="text-[10px] font-medium text-white/60 group-hover:text-white">
              {v.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
