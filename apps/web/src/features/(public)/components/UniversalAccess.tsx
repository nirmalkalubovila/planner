import { useState, useEffect } from "react";

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
      title: "Open It Anywhere",
      desc: "Tap the link and you're in. No downloads, no setup screens.",
    },
    {
      title: "Your Progress, Instantly Synced",
      desc: "Update on your laptop, check it on your phone minutes later.",
    },
    {
      title: "Works Like the Apps You Already Use",
      desc: "Same instant feel as Twitter/X, Pinterest, Starbucks.",
    },
    {
      title: "Always the Newest Version",
      desc: "No update prompts. You always have today's build.",
    },
  ];

  return (
    <section className="relative w-full flex items-center py-10 md:py-14 px-5 sm:px-8 bg-black overflow-hidden select-none">
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

      <div className="w-full max-w-7xl mx-auto relative z-10 flex flex-col items-center">
        {/* Centered Typography Header */}
        <div className="max-w-4xl text-center space-y-2 mb-8">
          <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase">
            Instant Access
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-[1.15]">
            Your planner,{" "}
            <span className="bg-gradient-to-r from-zinc-400 via-zinc-200 to-white bg-clip-text text-transparent">
              everywhere you are.
            </span>
          </h2>
          <p className="text-xs text-zinc-455 max-w-sm mx-auto leading-relaxed">
            One link. Every device. Always up to date.
          </p>
        </div>

        {/* Packed Grid of Cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {cards.map((card, idx) => {
            return (
              <div
                key={idx}
                className="bg-zinc-950/65 backdrop-blur-md border border-zinc-900/60 rounded-xl p-5 hover:border-zinc-800/80 hover:bg-zinc-950/85 transition duration-300 flex flex-col gap-2 group text-left w-full"
              >
                <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug">
                  {card.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
