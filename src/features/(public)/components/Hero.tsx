import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface HeroProps {
  desktopVideoUrl?: string;
  mobileVideoUrl?: string;
}

export default function Hero({ desktopVideoUrl, mobileVideoUrl }: HeroProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const videoSrc = isMobile
    ? (mobileVideoUrl || "/mobile-preview.mp4")
    : (desktopVideoUrl || "/desktop-preview.mp4");

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      {/* Full-bleed background video */}
      <video
        key={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Dark overlay gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30 pointer-events-none" />

      {/* Content pinned to bottom-left, Carnage style */}
      <div className="absolute inset-0 flex flex-col justify-end pb-12 sm:pb-16 px-5 sm:px-8 z-10">
        {/* Sub-badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-[9px] font-bold tracking-[0.2em] text-white/70 uppercase mb-4 w-fit">
          ⚡ REPLACE PLANNING WITH EXECUTION
        </span>

        {/* Big Bold Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-3 max-w-3xl uppercase">
          Stop planning.
          <br />
          <span className="text-white/80">
            Start building your legacy.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-sm sm:text-base text-white/60 leading-relaxed mb-6 max-w-xl">
          Turn your 1-week to 10-year goals into a clear daily schedule with
          AI doing the heavy lifting in under 5 minutes.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            to="/login"
            className="inline-flex items-center justify-center bg-white text-black text-sm font-extrabold px-7 py-3.5 rounded-xl hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-95 duration-200 shadow-xl"
          >
            Start Building Free
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center border border-white/20 bg-white/5 backdrop-blur-sm text-white text-sm font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all hover:scale-[1.02] active:scale-95 duration-200"
          >
            See How It Works
          </a>
        </div>
      </div>
    </section>
  );
}
