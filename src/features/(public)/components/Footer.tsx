import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="py-8 px-5 sm:px-8 bg-black border-t border-zinc-900/50">
      <div className="w-full">
        {/* Final CTA */}
        <div className="pt-4 pb-10 sm:pt-6 sm:pb-16 flex flex-col items-center justify-center text-center">
          <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase mb-3">
            Build your legacy.
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 mb-6 font-semibold uppercase tracking-widest">
            Presented by KONIK. Average Is A Choice.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center bg-white text-black text-sm font-bold px-8 py-3.5 rounded-xl hover:bg-zinc-200 transition-all hover:scale-[1.03] active:scale-95 duration-200 shadow-2xl shadow-white/5"
          >
            Start Now - It's Free
          </Link>
        </div>

        {/* 3-Column Footer Grid */}
        <div className="border-t border-zinc-900 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column 1: The Brand & Mission */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <img src="/KONIK NEW - WHITE.png" alt="Konik Logo" className="h-5 w-auto object-contain opacity-90" />
                <span>What is Konik?</span>
              </h4>
              <p className="text-[11px] leading-relaxed text-zinc-500 font-medium">
                Konik is a clothing brand that represents a legacy life, not just apparel. We design for individuals who refuse to be average. As an extension of our mission, we engineer digital tools like the Legacy Life Builder to give you the clinical, execution-first systems needed to actually build that legacy.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Why We Built This</h4>
              <p className="text-[11px] leading-relaxed text-zinc-500 font-medium">
                Society is engineered to keep you trapped in the 40-40-40 scam. We built Konik to provide both the identity and the framework for your escape. You wear the discipline, and you use our offline-ready tools to take control of your wealth and time in your early 20s. Expect more to come.
              </p>
            </div>
          </div>

          {/* Column 2: Products */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Products</h4>
            <ul className="space-y-2 text-[11px] font-semibold text-zinc-500">
              <li className="flex items-center gap-2">
                <img src="/white-logo.svg" alt="Legacy Life Builder Logo" className="h-5.5 w-auto object-contain opacity-90" />
                <Link to="/" className="hover:text-white transition-colors">Legacy Life Builder</Link>
              </li>
              <li className="flex items-center gap-2">
                <span>Legacy Budget Planner</span>
                <span className="text-[8px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-450 px-1.5 py-0.5 rounded uppercase tracking-wider">Soon</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust Architecture */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Want more about Legacy Life Builder?</h4>
            <ul className="space-y-4 text-[11px] text-zinc-500 leading-relaxed font-medium">
              <li>
                <Link to="/refund" className="hover:text-white transition-colors font-bold text-zinc-400">Refund Policies</Link>
                <span className="block text-[10px] text-zinc-500 font-medium mt-0.5">Cancel anytime, no questions asked.</span>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors font-bold text-zinc-400">Privacy Policy</Link>
                <span className="block text-[10px] text-zinc-500 font-medium mt-0.5">Read exactly what we do — and don't do — with your data.</span>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors font-bold text-zinc-400">Terms and Conditions</Link>
                <span className="block text-[10px] text-zinc-500 font-medium mt-0.5">The rules of the Konik ecosystem.</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Logo & Note Bar */}
        <div className="border-t border-zinc-900 pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6 justify-center md:justify-start">
            
            {/* Legacy Life Builder logo */}
            <div className="flex items-center gap-2.5">
              <img 
                src="/white-logo.svg" 
                alt="Legacy Life Builder Logo" 
                className="h-5 w-auto object-contain opacity-95" 
              />
              <div>
                <p className="text-[9px] font-bold tracking-widest text-white font-mono uppercase">
                  LEGACY LIFE BUILDER
                </p>
                <p className="text-[7px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">
                  A KONIK PRODUCT
                </p>
              </div>
            </div>

            {/* KONIK Presentation Brand */}
            <div className="flex flex-col gap-0.5 items-start">
              <img 
                src="/KONIK NEW - WHITE.png" 
                alt="KONIK Brand Logo" 
                className="h-3.5 w-auto object-contain opacity-70" 
              />
              <span className="text-[7px] font-bold tracking-[0.2em] text-zinc-500 font-mono uppercase">
                Average Is A Choice
              </span>
            </div>

          </div>

          <div className="text-center md:text-right">
            <p className="text-[10px] text-zinc-500 font-semibold tracking-wide">
              &copy; {new Date().getFullYear()} Konik Systems. Built for execution, not distraction.
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}
