import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
      {/* Public Beta Announcement Banner */}
      <div className="w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-center py-2 px-4 border-b border-white/10 shadow-md">
        <p className="text-[11px] sm:text-xs font-semibold tracking-wide text-white flex items-center justify-center gap-1.5 leading-tight">
          <span>
             Public Beta is live — premium AI features are free for early adopters. Won't last.
          </span>
        </p>
      </div>

      {/* Navbar Container */}
      <header className="w-full bg-black/60 backdrop-blur-md border-b border-white/5">
        <div className="w-full px-5 sm:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <img 
              src="/white-logo.svg" 
              alt="Legacy Life Builder Logo" 
              className="h-6 w-auto object-contain shrink-0" 
            />
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs font-mono font-bold tracking-[0.2em] text-white uppercase whitespace-nowrap">
                LEGACY LIFE BUILDER
              </span>
              <span className="inline sm:hidden text-xs font-mono font-bold tracking-[0.15em] text-white uppercase whitespace-nowrap">
                LIFE BUILDER
              </span>
              <span className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/20 uppercase font-mono select-none whitespace-nowrap leading-none">
                Beta
              </span>
            </div>
          </div>

          {/* CTA */}
          <Link
            to="/login"
            className="text-xs font-bold bg-white text-black px-4.5 py-2 rounded-xl hover:bg-zinc-200 hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-lg shadow-white/5"
          >
            Get Started
          </Link>
        </div>
      </header>
    </div>
  );
}
