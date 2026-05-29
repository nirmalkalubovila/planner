const steps = [
  {
    step: "1",
    title: "Set your goal",
    description:
      'Tell the app your goal and timeline, e.g. "Master Node.js in 2 weeks. Already I have learned basics". AI builds your milestone roadmap instantly.',
  },
  {
    step: "2",
    title: "Build your habits",
    description:
      "Add the habits that support your goal. Set days, time slots, and duration. They auto-appear in your weekly planner.",
  },
  {
    step: "3",
    title: "Let the planner sync",
    description:
      "Your week fills up automatically based on your goals, habits, and personal defaults. AI suggests what to work on and how long in each goal when you add goal's tasks to planner.",
  },
  {
    step: "4",
    title: "Execute daily",
    description:
      "Open the app each day. Your to-do list is already built. No decisions needed, just start working and track your progress.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-black border-t border-zinc-900/60">
      <div className="max-w-2xl mx-auto">
        {/* Section header */}
        <div className="mb-16 text-left">
          <span className="text-xs font-bold tracking-[0.25em] text-zinc-500 uppercase">
            How It Works
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-none">
            From goal to execution
            <br />
            <span className="text-zinc-500">in 4 simple steps.</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-[15px] top-3 bottom-3 w-px bg-zinc-900 hidden sm:block" />

          <div className="space-y-12">
            {steps.map((item, index) => (
              <div key={index} className="flex gap-6 items-start group">
                {/* Step number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center z-10 transition-transform duration-300 group-hover:scale-110">
                  {item.step}
                </div>

                {/* Content */}
                <div className="pb-2">
                  <h3 className="text-base font-bold text-white mb-2 transition-colors duration-200 group-hover:text-zinc-200">
                    {item.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* App screenshots hint */}
        <div className="mt-20 rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 backdrop-blur-sm">
          <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-5">
            What you'll see inside
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              { label: "Today's Schedule", sub: "Auto-built daily tasks" },
              { label: "Goal Matrix", sub: "AI milestone roadmap" },
              { label: "Habit Collection", sub: "Custom time blocks" },
              { label: "Week Planner", sub: "Real calendar sync" },
              { label: "The Vault", sub: "Quick notes" },
              { label: "Performance", sub: "Life trajectory score" },
            ].map((screen) => (
              <div
                key={screen.label}
                className="bg-zinc-900/30 hover:bg-zinc-900/60 rounded-xl border border-zinc-900/80 p-4 transition-all duration-300 hover:scale-[1.01]"
              >
                <p className="text-xs font-bold text-white">
                  {screen.label}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">{screen.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
