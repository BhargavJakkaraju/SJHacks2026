"use client";

import BloomLogo from "@/components/branding/BloomLogo";

export default function Navbar() {
  return (
    <div className="fixed top-5 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between px-6 h-12 rounded-full border border-white/15 bg-white/5 backdrop-blur-md shadow-lg w-[680px]">
        <div className="flex items-center gap-3">
          <BloomLogo size={28} />
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
