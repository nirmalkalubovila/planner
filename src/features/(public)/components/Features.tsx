const features = [
  {
    number: "01",
    title: "AI Goal Decomposition",
    subtitle: "1 week → 10 years",
    description:
      "Set any goal from 1 week to 10 years. Our AI breaks it down into weekly milestones with a clear action plan in under 5 minutes. Prefer manual? That's available too.",
    tag: "Goals",
  },
  {
    number: "02",
    title: "Habit Builder",
    subtitle: "Full control, zero guessing",
    description:
      "Create habits with custom days, times, and 30-minute minimum time blocks. Everything from wake-up to deep work — structured the way you actually live.",
    tag: "Habits",
  },
  {
    number: "03",
    title: "Smart Week Planner",
    subtitle: "Real sync with real life",
    description:
      "Your goals and habits auto-sync into your weekly calendar the moment you create them. AI suggests time allocation per task. Set your defaults once — sleep time, planning time, habit blocks — and it builds around you.",
    tag: "Planner",
  },
  {
    number: "04",
    title: "Auto To-Do List",
    subtitle: "No setup needed daily",
    description:
      "Your daily tasks appear automatically based on your week plan. No hunting through your planner every morning. Open the app — see exactly what to do today.",
    tag: "Daily",
  },
  {
    number: "05",
    title: "The Vault",
    subtitle: "Your private notebook",
    description:
      "Capture ideas, notes, and thoughts instantly. Because this will become your most-used app, we made sure your quick notes live right here — no switching apps.",
    tag: "Vault",
  },
  {
    number: "06",
    title: "Performance Tracking",
    subtitle: "Life trajectory score",
    description:
      "See your Goal Progress, Habit Strength, and Week Execution in one score. Know exactly where you are in building your legacy.",
    tag: "Analytics",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-4 bg-zinc-950 border-t border-zinc-900/60">
      <div className="max-w-2xl mx-auto">
        {/* Section header */}
        <div className="mb-16">
          <span className="text-xs font-bold tracking-[0.25em] text-zinc-500 uppercase">
            What's Inside
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-none">
            Everything you need.
            <br />
            <span className="text-zinc-500">Nothing you don't.</span>
          </h2>
        </div>

        {/* Feature list */}
        <div className="space-y-0 divide-y divide-zinc-900">
          {features.map((feature) => (
            <div
              key={feature.number}
              className="py-8 flex gap-6 items-start group transition-all duration-300"
            >
              {/* Number */}
              <span className="text-xs font-mono text-zinc-700 pt-1 min-w-[28px] group-hover:text-zinc-500 transition-colors">
                {feature.number}
              </span>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-base font-bold text-white transition-colors group-hover:text-zinc-200">
                    {feature.title}
                  </h3>
                  <span className="text-[9px] font-bold tracking-wider text-zinc-400 border border-zinc-800 bg-zinc-900/40 px-2 py-0.5 rounded uppercase">
                    {feature.tag}
                  </span>
                </div>
                <p className="text-xs font-semibold text-zinc-500 mb-3">
                  {feature.subtitle}
                </p>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
