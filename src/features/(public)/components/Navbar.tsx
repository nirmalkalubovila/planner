import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="w-full px-5 sm:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <img 
            src="/white-logo.svg" 
            alt="Legacy Life Builder Logo" 
            className="h-6 w-auto object-contain" 
          />
          <span className="text-xs font-bold tracking-[0.2em] text-white font-mono uppercase">
            LEGACY LIFE BUILDER
          </span>
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
  );
}
