import Navbar from "@/components/landing/Navbar";
import Flower3D from "@/components/landing/Flower3D";

export default function Home() {
  return (
    <div className="bg-black min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center pt-14 gap-2">
        <p className="text-white font-semibold text-[120px] tracking-tight">Bloom</p>
        <div className="-mt-4 scale-110">
          <Flower3D />
        </div>
      </main>
      <div className="flex flex-col items-center gap-10 pb-14 -mt-8">
        <p className="text-white/60 text-sm tracking-[0.22em] uppercase">
          An IDE for Artists &nbsp;|&nbsp; Boundless and Accessible Creativity
        </p>
        <a href="/workspace">
          <button className="px-8 py-3 bg-white text-black text-sm font-semibold rounded-full hover:bg-blue-100 transition cursor-pointer">
            Get Started
          </button>
        </a>
      </div>
    </div>
  );
}
