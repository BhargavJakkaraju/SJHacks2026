"use client";

const PETAL_COUNT = 8;

type BloomLogoProps = {
  size?: number;
};

export default function BloomLogo({ size = 28 }: BloomLogoProps) {
  return (
    <svg
      viewBox="-36 -36 72 72"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
    >
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
