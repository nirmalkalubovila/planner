import { Link } from "react-router-dom";

const NAV_LINKS = [
  { label: "Legacy Life", id: "legacy-life" },
  { label: "The problem", id: "problem" },
  { label: "How it works", id: "how-it-works" },
  { label: "Weekly reset", id: "reset" },
  { label: "Reviews", id: "testimonials" },
  { label: "FAQ", id: "faq" },
];

const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
};

export default function Navbar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
      {/* Public Beta Announcement Banner */}
      <div className="w-full bg-gradient-to-r from-[#8a6415] via-[#D2A226] to-[#e9c468] text-center py-2 px-4 border-b border-black/20 shadow-md">
        <p className="text-[11px] sm:text-xs font-semibold tracking-wide text-black flex items-center justify-center gap-1.5 leading-tight">
          <span>
             Public beta: premium AI features are free for early members.
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
              <span className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#D2A226]/10 text-[#D2A226] border border-[#D2A226]/30 uppercase font-mono select-none whitespace-nowrap leading-none">
                Beta
              </span>
            </div>
          </div>

          {/* Section links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Sections">
            {NAV_LINKS.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={(e) => scrollToSection(e, l.id)}
                className="relative text-xs font-semibold text-zinc-400 hover:text-[#D2A226] transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[#D2A226] after:transition-all after:duration-300 hover:after:w-full"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <Link
            to="/login"
            className="llb-btn llb-btn-auto text-xs font-bold bg-[#D2A226] text-black px-4.5 py-2 rounded-xl hover:bg-[#e9c468] shadow-lg shadow-[#D2A226]/10"
          >
            Get Started
          </Link>
        </div>
      </header>
    </div>
  );
}
