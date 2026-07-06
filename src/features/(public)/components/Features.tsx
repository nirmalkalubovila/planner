const features = [
  {
    number: "01",
    title: "AI Goal Decomposition",
    subtitle: "1 week → 10 year milestones",
    description:
      "Set any goal, 1 week to 10 years — AI builds the roadmap instantly.",
    tag: "Goals",
  },
  {
    number: "02",
    title: "Custom Habit Builder",
    subtitle: "Full control, zero guessing",
    description:
      "Add habits with your own days, times, and durations. Full control.",
    tag: "Habits",
  },
  {
    number: "03",
    title: "Smart Week Planner",
    subtitle: "Drag-and-drop calendar grid",
    description:
      "Goals and habits auto-populate into a visual weekly grid.",
    tag: "Planner",
  },
  {
    number: "04",
    title: "Auto Today Schedule",
    subtitle: "Zero-setup daily to-do",
    description:
      "Open the app — your daily to-do is already built.",
    tag: "Today",
  },
  {
    number: "05",
    title: "8 Gamified Daily Themes",
    subtitle: "Discipline Battery, Boss Fight & more",
    description:
      "Discipline Battery, Boss Fight, and more — execution never feels flat.",
    tag: "Gamified",
  },
  {
    number: "06",
    title: "The Vault",
    subtitle: "Categories, tags, reminders",
    description:
      "Capture ideas, tasks, and quotes instantly. Categorized, searchable.",
    tag: "Vault",
  },
  {
    number: "07",
    title: "Performance & Trajectory Score",
    subtitle: "Weighted analytics dashboard",
    description:
      "One transparent score (40% Goals, 35% Habits, 25% Execution).",
    tag: "Analytics",
  },
  {
    number: "08",
    title: "Weekly & Monthly Insights",
    subtitle: "Shareable story cards",
    description:
      "Auto-generated story cards you can share anywhere.",
    tag: "Insights",
  },
  {
    number: "09",
    title: "Profile & Preferences",
    subtitle: "Deep personalization",
    description:
      "Deep personalization — wake time, planning style, notifications.",
    tag: "Profile",
  },
  {
    number: "10",
    title: "Install Anywhere",
    subtitle: "Works offline, loads instantly",
    description:
      "Works offline, loads instantly, feels like a native app.",
    tag: "Instant",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-6 px-5 sm:px-8 bg-zinc-950 select-none">
      <div className="w-full">
        {/* Section header */}
        <div className="mb-4">
          <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase">
            What's Inside
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-[1.1]">
            Everything you need.{" "}
            <span className="bg-gradient-to-r from-zinc-500 via-zinc-400 to-zinc-300 bg-clip-text text-transparent">Nothing you don't.</span>
          </h2>
        </div>

        {/* Feature grid — packed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
          {features.map((feature) => (
            <div
              key={feature.number}
              className="p-3.5 bg-zinc-900/20 hover:bg-zinc-900/40 border border-zinc-900/60 hover:border-zinc-800 rounded-xl flex flex-col group transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-mono text-zinc-600">
                  {feature.number}
                </span>
                <span className="text-[7px] font-bold tracking-wider text-zinc-400 border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 rounded uppercase">
                  {feature.tag}
                </span>
              </div>
              <h3 className="text-xs font-bold text-white mb-0.5">
                {feature.title}
              </h3>
              <p className="text-[9px] font-semibold text-zinc-500 mb-1.5">
                {feature.subtitle}
              </p>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
