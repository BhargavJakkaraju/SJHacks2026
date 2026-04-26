"use client";

const PETAL_COUNT = 8;

function FlowerIcon() {
  return (
    <svg viewBox="-36 -36 72 72" width="28" height="28">
      {Array.from({ length: PETAL_COUNT }).map((_, i) => {
        const angle = (i / PETAL_COUNT) * 360;
        return (
          <ellipse
            key={i}
            cx="0"
            cy="-17"
            rx="6"
            ry="13"
            fill="white"
            opacity="0.92"
            transform={`rotate(${angle})`}
          />
        );
      })}
      <circle cx="0" cy="0" r="7.5" fill="white" />
    </svg>
  );
}

export default function Navbar() {
  return (
    <div className="fixed top-5 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between px-6 h-12 rounded-full border border-white/15 bg-white/5 backdrop-blur-md shadow-lg w-[680px]">
        <div className="flex items-center gap-3">
          <FlowerIcon />
          <span className="text-white font-semibold text-base tracking-tight">Bloom</span>
        </div>
<a href="/workspace">
          <button
            className="px-5 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-full transition hover:bg-blue-500 cursor-pointer"
            style={{ boxShadow: "0 0 14px 3px rgba(59,130,246,0.6)" }}
          >
            Get Started
          </button>
        </a>
      </nav>
    </div>
  );
}
