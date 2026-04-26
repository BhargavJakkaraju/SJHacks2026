"use client";

const PETAL_COUNT = 8;

export default function Flower3D() {
  return (
    <div className="relative w-[480px] h-[480px] flex items-center justify-center">
      {/* blue glow backdrop — 15% more prominent */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.55) 0%, rgba(37,99,235,0.25) 45%, transparent 70%)",
        }}
      />

      <svg
        viewBox="-110 -110 220 220"
        width="340"
        height="340"
        style={{ animation: "breathe 3.6s ease-in-out infinite" }}
      >
        <style>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}</style>

        {/* petals */}
        {Array.from({ length: PETAL_COUNT }).map((_, i) => {
          const angle = (i / PETAL_COUNT) * 360;
          return (
            <ellipse
              key={i}
              cx="0"
              cy="-52"
              rx="18"
              ry="38"
              fill="white"
              opacity="0.92"
              transform={`rotate(${angle})`}
            />
          );
        })}

        {/* center circle */}
        <circle cx="0" cy="0" r="22" fill="white" />
      </svg>
    </div>
  );
}
