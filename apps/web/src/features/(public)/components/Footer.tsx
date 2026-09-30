import { Link } from "react-router-dom";
import { Mail, Linkedin, Instagram } from "lucide-react";
import { useLatestUpdate } from "@/hooks/use-latest-update";

export default function Footer() {
  const { data: latestUpdate } = useLatestUpdate();
  const version = latestUpdate?.version || "";

  return (
    <footer className="py-12 px-5 sm:px-8 bg-black border-t border-zinc-900/50">
      <div className="w-full">
        {/* Creator + policies */}
        <div className="py-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Creator: name and social links only */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold tracking-[0.2em] text-[#D2A226] uppercase">
                Creator & Developer
              </span>
              <h4 className="text-sm font-bold text-white tracking-tight">Nirmal Kalubovila</h4>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="mailto:nirmalpriyankara.web@gmail.com"
                title="Email Creator"
                className="p-2 rounded-lg bg-zinc-950 border border-zinc-900 text-zinc-500 hover:text-[#D2A226] hover:border-[#D2A226]/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                <Mail size={14} />
              </a>
              <a
                href="https://www.linkedin.com/in/nirmal-kalubovila"
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn Profile"
                className="p-2 rounded-lg bg-zinc-950 border border-zinc-900 text-zinc-500 hover:text-[#D2A226] hover:border-[#D2A226]/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                <Linkedin size={14} />
              </a>
              <a
                href="https://www.instagram.com/the_nirrmal"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram Profile"
                className="p-2 rounded-lg bg-zinc-950 border border-zinc-900 text-zinc-500 hover:text-[#D2A226] hover:border-[#D2A226]/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                <Instagram size={14} />
              </a>
              <a
                href="https://tiktok.com/@nirmal_kalubovila"
                target="_blank"
                rel="noopener noreferrer"
                title="TikTok Profile"
                className="p-2 rounded-lg bg-zinc-950 border border-zinc-900 text-zinc-500 hover:text-[#D2A226] hover:border-[#D2A226]/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.85.97 2 1.69 3.29 2.05v3.9c-1.39-.08-2.74-.63-3.83-1.5-.24-.18-.46-.38-.67-.58v5.52c0 3.26-1.87 6.17-4.8 7.37-2.6 1.07-5.63.76-7.97-.84-2.13-1.46-3.29-3.99-3.02-6.52.27-2.58 2-4.82 4.49-5.63 1.34-.44 2.8-.39 4.1.1v4c-.87-.36-1.85-.38-2.73-.04-1.28.48-2.12 1.8-2.03 3.17.1 1.48 1.33 2.7 2.82 2.69 1.49-.01 2.66-1.21 2.66-2.7V.02h.18z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Policy links */}
          <ul className="flex flex-wrap gap-x-6 gap-y-2.5 text-[11px] text-zinc-500 font-semibold">
            <li><Link to="/refund" className="hover:text-[#D2A226] transition-colors">Refund Policies</Link></li>
            <li><Link to="/privacy" className="hover:text-[#D2A226] transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-[#D2A226] transition-colors">Terms and Conditions</Link></li>
          </ul>
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
              </div>
            </div>

          </div>

          <div className="text-center md:text-right">
            <p className="text-[10px] text-zinc-500 font-semibold tracking-wide">
              &copy; {new Date().getFullYear()} Built for execution, not distraction.{version && ` | ${version}`}
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}
