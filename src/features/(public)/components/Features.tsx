const features = [
  {
    number: "01",
    title: "AI-Synced Goals",
    subtitle: "Real-life timelines",
    description: "Legacy Life Builder syncs objectives directly to your current, real-life timeline. This moves beyond basic AI goal generation to align milestones with actual calendar dates.",
    tag: "Goals",
  },
  {
    number: "02",
    title: "Seamless Adaptability",
    subtitle: "Fluid adjustments",
    description: "The system provides the flexibility to adjust your weekly plan easily when unexpected events occur. Tasks reschedule dynamically without breaking your overall strategy.",
    tag: "Planner",
  },
  {
    number: "03",
    title: "Set-and-Forget Routines",
    subtitle: "Automatic habit schedules",
    description: "Establish constant sleep schedules and habits once to eliminate the tediousness of manually re-adding them each week. They load automatically into every new planner view.",
    tag: "Routines",
  },
  {
    number: "04",
    title: "Execution Reflection",
    subtitle: "Empirical performance data",
    description: "Monitor your consistency, working capacity, and habit adherence to gain clear data on overall execution. The dashboard weights goals, habits, and daily task completion.",
    tag: "Analytics",
  },
  {
    number: "05",
    title: "Long-Term AI Planning",
    subtitle: "Multi-year roadmaps",
    description: "Legacy Life Builder utilizes AI to help you construct, review, adapt, and execute multi-year plans effortlessly. It fills a major gap left by traditional short-term tracking apps.",
    tag: "Strategy",
  },
  {
    number: "06",
    title: "Decision Fatigue Reduction",
    subtitle: "Dedicated capture space",
    description: "A dedicated capture space stores instant knowledge, tasks, and future ideas for later integration into your planner. This reduces daily brain drain and retains critical insights.",
    tag: "Vault",
  },
  {
    number: "07",
    title: "Zero-Friction Execution",
    subtitle: "Calendar time commitment",
    description: "Spend just one to two hours planning your week on the calendar, freeing the remaining six days purely for execution. This eliminates daily planning overhead and preserves mental energy.",
    tag: "Execution",
  },
  {
    number: "08",
    title: "Hyper-Specific Tasks",
    subtitle: "High task granularity",
    description: "The system provides the capability to define tasks with high granularity. Keeping focus strictly on task execution avoids vague todo items that stall momentum.",
    tag: "Granular",
  },
  {
    number: "09",
    title: "Smart Time Slotting",
    subtitle: "AI calendar allocation",
    description: "When you add a goal, the AI suggests the required hours to hit your weekly target and automatically allocates that time to empty calendar slots in your schedule.",
    tag: "Scheduling",
  },
  {
    number: "10",
    title: "Stress-Free Milestones",
    subtitle: "Deconstructed vision",
    description: "Reduce the overwhelm of massive ten-year goals by automatically breaking them down into actionable weekly sub-goals. Big visions become simple, bite-sized tasks.",
    tag: "Milestones",
  },
  {
    number: "11",
    title: "Strict Time-Boxing",
    subtitle: "Deep work protection",
    description: "Built-in time-boxing enforces a thirty-minute minimum block to ensure deep, uninterrupted work. It secures sufficient duration for deep cognitive focus.",
    tag: "Time-box",
  },
  {
    number: "12",
    title: "Efficient Replanning",
    subtitle: "Three-click rollover",
    description: "Replanning takes significantly less time. Unfinished tasks are saved automatically and can be rolled over into the current week with just three clicks.",
    tag: "Rollover",
  },
  {
    number: "13",
    title: "Precise Reminders",
    subtitle: "Exact time notices",
    description: "Set exact-time reminders for specific tasks at any point in your day. These keep your schedule strictly bounded without requiring manual calendar checking.",
    tag: "Reminders",
  },
  {
    number: "14",
    title: "Deeply Personalized",
    subtitle: "Individual capabilities model",
    description: "The AI constructs your plan based exclusively on your personal focus capacity, task-shifting ability, and learning speed. Your plan matches your psychological profile.",
    tag: "Personalized",
  },
  {
    number: "15",
    title: "No Unrealistic Overlaps",
    subtitle: "Rigid scheduling boundaries",
    description: "The system strictly prevents overlapping tasks. We cannot physically perform two tasks simultaneously, so your schedule maintains realistic, rigid boundaries.",
    tag: "Limits",
  },
  {
    number: "16",
    title: "Seamless Push Notifications",
    subtitle: "Consistent nudge triggers",
    description: "Consistent nudges are designed to keep you on track and ensure you finish your daily workload. Notifications adjust automatically to your active focus state.",
    tag: "Nudges",
  },
  {
    number: "17",
    title: "Zero Hard Copies or Books",
    subtitle: "100% digitized planner",
    description: "This is your entirely digitized personal planner. There is no longer a need for numerous physical books, scattered sheets of paper, or manual progress-checking mechanisms.",
    tag: "Digitized",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-12 px-5 sm:px-8 bg-zinc-950 select-none">
      <div className="w-full">
        {/* Section header */}
        <div className="mb-8">
          <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase">
            Product Ontology
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-[1.1]">
            17 Core Operating System Capabilities.{" "}
            <span className="bg-gradient-to-r from-zinc-500 via-zinc-400 to-zinc-300 bg-clip-text text-transparent">Engineered for execution.</span>
          </h2>
        </div>

        {/* Feature grid — packed and responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {features.map((feature) => (
            <article
              key={feature.number}
              className="p-4 bg-zinc-900/20 hover:bg-zinc-900/40 border border-zinc-900/60 hover:border-zinc-800 rounded-xl flex flex-col group transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-zinc-600">
                  {feature.number}
                </span>
                <span className="text-[8px] font-bold tracking-wider text-zinc-400 border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 rounded uppercase">
                  {feature.tag}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mb-0.5">
                {feature.title}
              </h3>
              <p className="text-[10px] font-semibold text-zinc-500 mb-2">
                {feature.subtitle}
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
