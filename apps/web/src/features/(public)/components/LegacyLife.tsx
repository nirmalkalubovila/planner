import Reveal from "./Reveal";
import { legacyLink } from "@/features/insights/legacy-insights";

// Condensed from The Legacy Life (six pillars)
const PILLARS = [
  { title: "Freedom", text: "Control of your time, money and peace of mind." },
  { title: "Ownership", text: "Systems and decisions that are yours, not someone else's." },
  { title: "Purpose", text: "A clear why that gives freedom a direction." },
  { title: "Health", text: "The energy to sustain high performance for decades." },
  { title: "Relationships", text: "Presence for the people who matter most." },
  { title: "Impact", text: "Assets and ideas that keep helping when you step away." },
];

const WHY = [
  { title: "Direction", text: "Goals become milestones, weeks and daily tasks." },
  { title: "Execution", text: "Your week runs in time blocks. Reset fixes it when life changes." },
  { title: "Proof", text: "Streaks and milestones become a record that the system works." },
];

export default function LegacyLife() {
  return (
    <section id="legacy-life" className="scroll-mt-28 bg-black py-12 sm:py-16 px-5 sm:px-8">
      <Reveal>
        <span className="text-[10px] font-bold tracking-[0.25em] text-[#D2A226] uppercase">What is a Legacy Life?</span>
        <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-3xl">
          A life that compounds, <span className="text-zinc-500">not expires.</span>
        </h2>
        <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-zinc-400">
          Freedom, ownership, purpose, health, deep relationships and lasting impact, built on purpose so your best years compound instead of running out.
        </p>
      </Reveal>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PILLARS.map((p, i) => (
          <li key={p.title}>
            <Reveal delay={i * 70} className="h-full">
              <div className="h-full rounded-2xl border border-zinc-900 bg-zinc-950/60 p-4 transition-colors duration-300 hover:border-[#D2A226]/30">
                <span className="text-xs font-bold tracking-[0.2em] text-[#D2A226]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 text-base font-bold text-white">{p.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">{p.text}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>

      <Reveal>
        <div className="mt-12">
          <span className="text-[10px] font-bold tracking-[0.25em] text-[#D2A226] uppercase">Why Legacy Life Builder?</span>
          <h3 className="mt-2 text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight max-w-3xl">
            A Legacy Life is built <span className="text-zinc-500">one week at a time.</span>
          </h3>
        </div>
      </Reveal>

      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {WHY.map((w, i) => (
          <li key={w.title}>
            <Reveal delay={i * 90} className="h-full">
              <div className="h-full rounded-2xl border border-[#D2A226]/25 bg-[#D2A226]/[0.04] p-4">
                <h4 className="text-base font-bold text-white">{w.title}</h4>
                <p className="mt-1 text-sm leading-relaxed text-zinc-300">{w.text}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>

      <Reveal>
        <p className="mt-6 text-sm text-zinc-400">
          The full nine-step roadmap is free.{" "}
          <a
            href={legacyLink("landing")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#D2A226] underline underline-offset-4 hover:text-[#e9c468]"
          >
            Read The Legacy Life
          </a>
        </p>
      </Reveal>
    </section>
  );
}
