import Reveal from "./Reveal";

const steps = [
  { title: "Set your goal", description: "Write the goal and deadline. AI builds your roadmap." },
  { title: "Add your habits", description: "Pick days and times. They appear in your planner." },
  { title: "Sync your week", description: "AI shows what to work on and for how long." },
  { title: "Execute daily", description: "Open the app. Today's list is already built." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-28 bg-black py-12 sm:py-16 px-5 sm:px-8">
      <Reveal>
        <span className="text-[10px] font-bold tracking-[0.25em] text-[#D2A226] uppercase">How it works</span>
        <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          From goal to execution <span className="text-zinc-500">in 4 steps.</span>
        </h2>
      </Reveal>

      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <li key={step.title}>
            <Reveal delay={i * 100} className="h-full">
              <div className="h-full rounded-2xl border border-zinc-900 bg-zinc-950/60 p-5 transition-colors duration-300 hover:border-[#D2A226]/30">
                <span className="text-xs font-bold tracking-[0.2em] text-[#D2A226]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{step.description}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
