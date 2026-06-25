import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="py-20 px-4 bg-black border-t border-zinc-900/60">
      <div className="max-w-5xl mx-auto">
        {/* Final CTA */}

        <div className="mb-14">
          <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2.5">
            Build your legacy.
          </h3>
          <p className="text-sm text-zinc-500 mb-6 font-medium">
            Presented by KONIK. Average Is A Choice.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center bg-white text-black text-xs font-bold px-6 py-3.5 rounded-xl hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-95 duration-200 shadow-xl shadow-white/5"
          >
            Start Now - It's Free
          </Link>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-900 pt-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            
            {/* Legacy Life Builder (White Logo SVG) */}
            <div className="flex items-center gap-2.5">
              <img 
                src="/white-logo.svg" 
                alt="Legacy Life Builder Logo" 
                className="h-5.5 w-auto object-contain opacity-95" 
              />
              <div>
                <p className="text-xs font-bold tracking-widest text-white font-mono uppercase">
                  LEGACY LIFE BUILDER
                </p>
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">
                  A KONIK PRODUCT
                </p>
              </div>
            </div>

            {/* KONIK Presentation Brand */}
            <div className="flex flex-col gap-1.5 items-start">
              <img 
                src="/KONIK NEW - WHITE.png" 
                alt="KONIK Brand Logo" 
                className="h-4.5 w-auto object-contain opacity-70" 
              />
              <span className="text-[9px] font-bold tracking-[0.2em] text-zinc-500 font-mono uppercase">
                Average Is A Choice
              </span>
            </div>

            {/* Info Badges & Legal Links */}
            <div className="flex gap-5 text-[11px] text-zinc-500 font-semibold tracking-wide md:pt-1">
              <span>100% Private</span>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/refund" className="hover:text-white transition-colors">Return Policy</Link>
            </div>
          </div>



          <p className="text-[11px] text-zinc-600 mt-6 font-medium tracking-wide">
            &copy; {new Date().getFullYear()} KONIK. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
