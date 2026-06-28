import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="py-4 px-5 sm:px-8 bg-black">
      <div className="w-full">
        {/* Final CTA */}
        <div className="mb-4">
          <h3 className="text-lg sm:text-xl font-extrabold text-white mb-1.5">
            Build your legacy.
          </h3>
          <p className="text-xs text-zinc-500 mb-4 font-medium">
            Presented by KONIK. Average Is A Choice.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center bg-white text-black text-xs font-bold px-5 py-3 rounded-xl hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-95 duration-200 shadow-xl shadow-white/5"
          >
            Start Now - It's Free
          </Link>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-900 pt-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            
            {/* Legacy Life Builder (White Logo SVG) */}
            <div className="flex items-center gap-2.5">
              <img 
                src="/white-logo.svg" 
                alt="Legacy Life Builder Logo" 
                className="h-5.5 w-auto object-contain opacity-95" 
              />
              <div>
                <p className="text-[10px] font-bold tracking-widest text-white font-mono uppercase">
                  LEGACY LIFE BUILDER
                </p>
                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">
                  A KONIK PRODUCT
                </p>
              </div>
            </div>

            {/* KONIK Presentation Brand */}
            <div className="flex flex-col gap-1 items-start">
              <img 
                src="/KONIK NEW - WHITE.png" 
                alt="KONIK Brand Logo" 
                className="h-4 w-auto object-contain opacity-70" 
              />
              <span className="text-[8px] font-bold tracking-[0.2em] text-zinc-500 font-mono uppercase">
                Average Is A Choice
              </span>
            </div>

            {/* Info Badges & Legal Links */}
            <div className="flex gap-4 text-[10px] text-zinc-500 font-semibold tracking-wide md:pt-1">
              <span>100% Private</span>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/refund" className="hover:text-white transition-colors">Return Policy</Link>
            </div>
          </div>

          <p className="text-[10px] text-zinc-600 mt-3 font-medium tracking-wide">
            &copy; {new Date().getFullYear()} KONIK. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
