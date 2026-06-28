const steps = [
  {
    step: "1",
    title: "Set your goal",
    description:
      'Tell the app your goal and timeline. AI builds your milestone roadmap instantly.',
  },
  {
    step: "2",
    title: "Build your habits",
    description:
      "Add habits with custom days, time slots, and duration. They auto-appear in your planner.",
  },
  {
    step: "3",
    title: "Let the planner sync",
    description:
      "Your week fills up automatically. AI suggests what to work on and how long for each goal.",
  },
  {
    step: "4",
    title: "Execute daily",
    description:
      "Open the app each day. Your to-do list is already built. Just start working.",
  },
];

const screens = [
  { label: "Today's Schedule", sub: "Auto-built daily tasks" },
  { label: "Goal Matrix", sub: "AI milestone roadmap" },
  { label: "Habit Collection", sub: "Custom time blocks" },
  { label: "Week Planner", sub: "Real calendar sync" },
  { label: "The Vault", sub: "Quick notes" },
  { label: "Performance", sub: "Life trajectory score" },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-black">
      {/* Section header */}
      <div className="py-4 px-5 sm:px-8">
        <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase">
          How It Works
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none">
          From goal to execution{" "}
          <span className="text-zinc-500">in 4 steps.</span>
        </h2>
      </div>

      {/* Two-column: Steps left, Full-height image right — vertically synced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px]">
        {/* Left Column — Steps stretched to fill */}
        <div className="flex flex-col justify-between py-6 px-5 sm:px-8 lg:pr-10">
          {steps.map((item, index) => (
            <div key={index} className="flex gap-4 items-start group py-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center">
                {item.step}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column — Full-width, full-height gym image */}
        <div className="relative w-full min-h-[350px] lg:min-h-full overflow-hidden group/img">
          <img
            src="/gym-motivation.png"
            alt="Hard work builds legacy"
            className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover/img:opacity-70 transition-opacity duration-500 select-none pointer-events-none"
          />
          {/* Dark overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent pointer-events-none lg:block hidden" />

          {/* Text overlay at bottom */}
          <div className="absolute bottom-4 left-4 right-4 space-y-1.5 z-10">
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">
              BUILD YOUR LEGACY
            </span>
            <p className="text-base font-extrabold text-white tracking-tight leading-snug">
              "No shortcuts. Just consistent, hard work day after day."
            </p>
            <div className="flex items-center gap-2 pt-1.5 border-t border-zinc-900/60">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                Discipline is the choice
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* App screens row — tight */}
      <div className="px-5 sm:px-8 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {screens.map((screen) => (
            <div
              key={screen.label}
              className="bg-zinc-900/30 hover:bg-zinc-900/50 rounded-xl border border-zinc-900/60 p-3 transition-all duration-200"
            >
              <p className="text-[11px] font-bold text-white">{screen.label}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{screen.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
