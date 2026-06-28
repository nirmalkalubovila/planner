const features = [
  {
    number: "01",
    title: "AI Goal Decomposition",
    subtitle: "1 week → 10 year milestones",
    description:
      "Set any goal from 1 week to 10 years. AI generates a weekly milestone roadmap instantly. Includes strategy choice dialog, master action plan editor, manual adjustments, custom date limits, and progress tracking charts.",
    tag: "Goals",
  },
  {
    number: "02",
    title: "Custom Habit Builder",
    subtitle: "Full control, zero guessing",
    description:
      "Create habits with custom active days, specific time slots, and duration blocks. Wake-up schedules auto-inject. Habits auto-sync into the weekly planner grid without any manual placement.",
    tag: "Habits",
  },
  {
    number: "03",
    title: "Smart Week Planner",
    subtitle: "Drag-and-drop calendar grid",
    description:
      "Goals and habits auto-populate into a visual weekly grid. Features edge-to-edge layout, mobile touch scroll support, an explicit hand-move tool to prevent drag conflicts, and a full toolbar with zoom and navigation controls.",
    tag: "Planner",
  },
  {
    number: "04",
    title: "Auto Today Schedule",
    subtitle: "Zero-setup daily to-do",
    description:
      "Open the app and your daily task list is already built from the weekly planner. Toggle completions with one tap. Integrates gamified daily themes that change how tasks are displayed.",
    tag: "Today",
  },
  {
    number: "05",
    title: "8 Gamified Daily Themes",
    subtitle: "Discipline Battery, Boss Fight & more",
    description:
      "Stay motivated with 8 rotating execution themes: Discipline Battery, Daily Boss Fight, Forge System, Combo Chain, Engine Dashboard, Territory Expansion, Heartbeat System, and XP Burst — each with unique progress animations.",
    tag: "Gamified",
  },
  {
    number: "06",
    title: "The Vault — Notes & Capture",
    subtitle: "Categories, tags, reminders",
    description:
      "Capture ideas, tasks, journals, learnings, and quotes instantly. Features category filters, tag search, local draft auto-save backup, note view dialogs, quote cards, and custom repeatable reminders per note.",
    tag: "Vault",
  },
  {
    number: "07",
    title: "Performance & Trajectory Score",
    subtitle: "Weighted analytics dashboard",
    description:
      "A transparent trajectory score (40% Goals, 35% Habits, 25% Execution) with summary view, detailed charts, performance dashboard, and a full calculations guide explaining every formula.",
    tag: "Analytics",
  },
  {
    number: "08",
    title: "Weekly & Monthly Insights",
    subtitle: "Shareable story cards",
    description:
      "Auto-generated insight cards summarizing your weekly and monthly performance. Features themed visual cards, story viewer mode, and share-as-image functionality to post your progress anywhere.",
    tag: "Insights",
  },
  {
    number: "09",
    title: "Profile & Preferences",
    subtitle: "Deep personalization",
    description:
      "Full profile management with personal info, preferences (wake-up time, default durations, planning style), security settings, notification controls, and an integrated feedback system.",
    tag: "Profile",
  },
  {
    number: "10",
    title: "PWA — Install Anywhere",
    subtitle: "Works offline, loads instantly",
    description:
      "Install directly from your browser on any device. Full offline support, home screen icon, no app store needed. Auto-updates silently. Feels exactly like a native app with full-screen experience.",
    tag: "PWA",
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
