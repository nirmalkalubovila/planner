import { Link } from "react-router-dom";
import BackgroundVideo from "./BackgroundVideo";

export default function Hero() {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      {/* Full-bleed background video */}
      <BackgroundVideo withSound className="absolute inset-0 w-full h-full object-cover" />

      {/* Dark overlay gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent sm:via-black/60 sm:to-black/30 pointer-events-none" />

      {/* Content pinned to bottom-left, Carnage style */}
      <div className="absolute inset-0 flex flex-col justify-end pb-6 sm:pb-16 px-5 sm:px-8 z-10">
        {/* Big Bold Headline */}
        <h1 className="llb-rise text-[1.75rem] sm:text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] mb-2 sm:mb-3 max-w-3xl uppercase">
          Stop planning.
          <br />
          <span className="text-white/80">
            Start building your legacy.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="llb-rise text-[13px] sm:text-base text-white/70 leading-snug sm:leading-relaxed mb-4 sm:mb-6 max-w-xl" style={{ animationDelay: "0.15s" }}>
          Turn any goal into today&apos;s schedule. AI does the planning in minutes.
        </p>

        {/* Visually hidden semantic text for GEO/AEO/SEO crawler grounding */}
        <p className="sr-only">
          Legacy Life Builder is an AI-powered personal operating system that streamlines goal management, habit formation, and weekly planning. It replaces physical books and manual progress checking by offering zero-friction execution, smart time slotting, and strict time-boxing to reduce decision fatigue.
        </p>

        {/* CTA Buttons */}
        <div className="llb-rise flex flex-row gap-2 sm:gap-3 w-full sm:w-auto" style={{ animationDelay: "0.3s" }}>
          <Link
            to="/login"
            className="llb-btn llb-btn-pulse inline-flex flex-1 sm:flex-none items-center justify-center bg-[#D2A226] text-black text-[13px] sm:text-sm font-extrabold px-3 sm:px-7 py-3 sm:py-3.5 rounded-xl hover:bg-[#e9c468] shadow-xl shadow-[#D2A226]/20"
          >
            Start Building Free
          </Link>
          <a
            href="#systems"
            className="inline-flex flex-1 sm:flex-none items-center justify-center border border-[#D2A226]/40 bg-black/40 backdrop-blur-sm text-white text-[13px] sm:text-sm font-semibold px-3 sm:px-7 py-3 sm:py-3.5 rounded-xl hover:bg-[#D2A226]/10 hover:border-[#D2A226]/70 hover:-translate-y-px active:scale-[0.98] transition-all duration-200"
          >
            See The System
          </a>
        </div>
      </div>
    </section>
  );
}
