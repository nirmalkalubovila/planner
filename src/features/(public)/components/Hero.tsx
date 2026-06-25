import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Hero() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-4 pt-32 pb-24 bg-black overflow-hidden">
      {/* Background radial glow accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[90%] h-[50%] bg-zinc-900/30 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[50%] -translate-x-1/2 w-[70%] h-[40%] bg-zinc-900/20 rounded-full blur-[160px]" />
      </div>

      <div className="w-full max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center">
        {/* Sub-badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-8 shadow-inner animate-pulse">
          ⚡ REPLACE PLANNING WITH EXECUTION
        </span>

        {/* Big Bold Headline */}
        <h1 className="text-4xl sm:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6 max-w-4xl">
          Stop planning.
          <br />
          <span className="bg-gradient-to-r from-zinc-400 via-zinc-200 to-white bg-clip-text text-transparent">
            Start building your legacy.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-10 max-w-2xl">
          Turn your 1-week to 10-year goals into a clear daily schedule with
          AI doing the heavy lifting in under 5 minutes. No more brain power
          lost on planning. See what's inside.
        </p>

        {/* Primary and Secondary CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto px-4 sm:px-0">
          <Link
            to="/login"
            className="inline-flex items-center justify-center bg-white text-black text-sm font-extrabold px-8 py-4.5 rounded-xl hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-95 duration-200 shadow-xl shadow-white/5"
          >
            Start Building Free - See Inside
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center border border-zinc-800 bg-zinc-950/40 text-zinc-300 text-sm font-semibold px-8 py-4.5 rounded-xl hover:bg-zinc-900 hover:border-zinc-700 transition-all hover:scale-[1.02] active:scale-95 duration-200"
          >
            See How It Works
          </a>
        </div>

        {/* Full-width Responsive Video Container */}
        <div 
          className={`
            w-full bg-zinc-950/80 rounded-2xl shadow-2xl relative group overflow-hidden transition-all duration-500 border border-zinc-800/80
            ${isMobile 
              ? 'max-w-sm aspect-[9/16]' 
              : 'max-w-5xl aspect-[16/10] p-2 sm:p-3'
            }
          `}
        >
          {/* Browser header mockup - hidden in mobile view */}
          {!isMobile && (
            <div className="flex items-center gap-1.5 pb-2.5 px-2 border-b border-zinc-900/60 mb-2 sm:mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
              <div className="ml-3 text-[10px] text-zinc-600 font-mono select-none">
                legacy-life-builder-preview.mp4
              </div>
            </div>
          )}

          {/* Video element */}
          <div 
            className={`
              relative w-full h-full overflow-hidden bg-black
              ${isMobile ? 'rounded-2xl' : 'h-[85%] rounded-lg'}
            `}
          >

            <video
              key={isMobile ? "mobile" : "desktop"}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-300"
            >
              {/* Try user-supplied local preview video first */}
              <source 
                src={isMobile ? "/mobile-preview.mp4" : "/desktop-preview.mp4"} 
                type="video/mp4" 
              />
              {/* Fall back to Cloudinary dog animation if local files don't exist */}
              <source 
                src="https://res.cloudinary.com/demo/video/upload/q_auto,vc_h265/dog.mp4" 
                type="video/mp4" 
              />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
