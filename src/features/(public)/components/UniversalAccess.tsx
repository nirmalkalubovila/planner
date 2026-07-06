import { useState, useEffect } from "react";
import { Globe, RefreshCw, Zap, Sparkles } from "lucide-react";

interface UniversalAccessProps {
  desktopVideoUrl?: string;
  mobileVideoUrl?: string;
}

export default function UniversalAccess({
  desktopVideoUrl,
  mobileVideoUrl,
}: UniversalAccessProps) {
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

  const cards = [
    {
      icon: Globe,
      iconColor: "text-blue-400",
      title: "Open It Anywhere",
      desc: "Tap the link and you're in. No downloads, no setup screens.",
      badgeText: "Status: Instant load",
      badgeDotClass: "bg-blue-400",
      iconAnimationClass: "group-hover:scale-110",
    },
    {
      icon: RefreshCw,
      iconColor: "text-emerald-450",
      title: "Your Progress, Instantly Synced",
      desc: "Update on your laptop, check it on your phone minutes later.",
      badgeText: "Last Sync: Just now",
      badgeDotClass: "bg-emerald-500 animate-pulse",
      iconAnimationClass: "group-hover:rotate-180 duration-700",
    },
    {
      icon: Zap,
      iconColor: "text-amber-450",
      title: "Works Like the Apps You Already Use",
      desc: "Same instant feel as Twitter/X, Pinterest, Starbucks.",
      badgeText: "Engine: PWA active",
      badgeDotClass: "bg-amber-500",
      iconAnimationClass: "group-hover:scale-110 group-hover:rotate-12",
    },
    {
      icon: Sparkles,
      iconColor: "text-violet-400",
      title: "Always the Newest Version",
      desc: "No update prompts. You always have today's build.",
      badgeText: "Build: Stable v2.4",
      badgeDotClass: "bg-violet-400",
      iconAnimationClass: "group-hover:scale-110 group-hover:rotate-12",
    },
  ];

  return (
    <section className="relative w-full flex items-center py-24 md:py-32 px-5 sm:px-8 bg-black overflow-hidden select-none">
      {/* Background Video */}
      <video
        key={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-20 z-0"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Dark overlay gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black pointer-events-none z-0" />

      {/* Background Watermark */}
      <div className="text-[20vw] font-black text-white opacity-[0.03] absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 tracking-[0.1em] font-mono leading-none">
        LEGACY
      </div>

      {/* Grid Layout Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Side: Typography */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-zinc-500 uppercase">
            Instant Access
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase leading-[1.05]">
            Your Legacy Life Builder, <br />
            <span className="bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-500 bg-clip-text text-transparent">
              Everywhere You Are
            </span>
          </h2>
          <p className="text-xs sm:text-sm font-semibold tracking-wider text-zinc-400 uppercase">
            One link. Every device. Always up to date.
          </p>
        </div>

        {/* Right Side: Showcase Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-zinc-950/65 backdrop-blur-md border border-zinc-900/60 rounded-2xl p-5 hover:border-zinc-800/80 hover:bg-zinc-950/85 transition duration-300 flex flex-col justify-between min-h-[165px] group relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className={`p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/50 w-fit transition-transform duration-500 ${card.iconColor} ${card.iconAnimationClass}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      {card.title}
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>

                {/* Live-feel status footer */}
                <div className="mt-4 pt-3 border-t border-zinc-900/40 flex items-center justify-between text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider select-none">
                  <span className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${card.badgeDotClass}`} />
                    <span>{card.badgeText}</span>
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[8px] text-zinc-650 font-sans normal-case">
                    verified
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
