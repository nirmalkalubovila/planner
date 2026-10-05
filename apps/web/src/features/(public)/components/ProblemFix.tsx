import type { CSSProperties, ReactNode } from "react";
import Reveal from "./Reveal";
import { useInViewOnce } from "../hooks/use-in-view-once";

const PAINS = [
  {
    image: "/landing/pain-busy-gold.jpg",
    title: "Always busy, still behind",
    pain: "You work all day, yet the important things slip to tomorrow.",
  },
  {
    image: "/landing/pain-restart-gold.jpg",
    title: "Starting over again",
    pain: "You start strong, miss a few days, quit, then start over.",
  },
  {
    image: "/landing/pain-direction-gold.jpg",
    title: "Months pass, little changes",
    pain: "Big goals feel vague, so nothing moves in a real way.",
  },
];

const WITHOUT = ["Goal", "?????", "Today"];
const WITH = ["Goal", "Milestones", "Week", "Time", "Today", "Execute", "Review"];

// How long each card holds the highlight, and the chip timing of each lane (seconds).
const PICK_STEP = 3;
const LANES = {
  red: { step: 1.1, cycle: 4.5 },
  gold: { step: 0.7, cycle: 6.5 },
} as const;

/** Starts its looping highlights once it is on screen. The loops themselves live in index.css (.llb-loop). */
function Loop({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>(0.25);
  return (
    <div ref={ref} data-play={seen ? "true" : "false"} className={`llb-loop ${className}`}>
      {children}
    </div>
  );
}

/** One centered lane of the flow comparison; chips appear one after another, then light in turn, on a loop. */
function Lane({ steps, tone }: { steps: string[]; tone: "red" | "gold" }) {
  const chip =
    tone === "gold"
      ? "border-[#D2A226]/50 bg-[#D2A226]/10 text-white"
      : "border-red-500/40 bg-red-500/10 text-white";
  const glow =
    tone === "gold"
      ? "border-[#e9c468] bg-[#D2A226]/25 shadow-[0_0_18px_rgba(210,162,38,0.45)]"
      : "border-red-400 bg-red-500/25 shadow-[0_0_18px_rgba(239,68,68,0.4)]";
  const arrow = tone === "gold" ? "text-[#D2A226]/80" : "text-red-400/70";
  const { step, cycle } = LANES[tone];
  return (
    <ol className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 gap-y-2 sm:gap-y-3">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2 sm:gap-3">
          {i > 0 && <span className={`hidden sm:inline text-lg font-bold ${arrow}`} aria-hidden>&rarr;</span>}
          <Reveal delay={i * 110}>
            <span className={`relative inline-block rounded-full border px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-base font-extrabold uppercase tracking-wider ${chip} ${s === "?????" ? "animate-pulse" : ""}`}>
              <span
                aria-hidden
                style={{ "--d": `${(i * step).toFixed(2)}s`, "--t": `${cycle}s` } as CSSProperties}
                className={`llb-chip-lit pointer-events-none absolute inset-0 rounded-full border ${glow}`}
              />
              <span className={`relative sm:hidden mr-1.5 ${arrow}`}>{i + 1}</span>
              <span className="relative">{s}</span>
            </span>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

export default function ProblemFix() {
  return (
    <section id="problem" className="scroll-mt-28 bg-black py-12 sm:py-16 px-5 sm:px-8">
      <div className="w-full space-y-10 sm:space-y-12">
        {/* Header */}
        <Reveal>
          <span className="text-[10px] font-bold tracking-[0.25em] text-[#D2A226] uppercase">The real problem</span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-3xl">
            You don&apos;t have a goal problem.{" "}
            <span className="text-zinc-500">You have an execution gap.</span>
          </h2>
          <p className="mt-3 text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Most goals fail between deciding what you want and knowing what to do today.
          </p>
        </Reveal>

        {/* Pain cards: a gold highlight moves from one to the next, on a loop */}
        <Loop className="grid gap-4 md:grid-cols-3">
          {PAINS.map((p, i) => {
            const delay = { "--d": `${i * PICK_STEP}s` } as CSSProperties;
            return (
              <Reveal key={p.title} delay={i * 120} className="h-full">
                <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950/60">
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <img
                      src={p.image}
                      alt=""
                      loading="lazy"
                      style={delay}
                      className="llb-pick-zoom absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/60 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-white backdrop-blur-sm">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-bold leading-snug text-white">{p.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">{p.pain}</p>
                  </div>

                  <span
                    aria-hidden
                    style={delay}
                    className="llb-pick-ring pointer-events-none absolute inset-0 rounded-2xl border border-[#D2A226]/70 shadow-[inset_0_0_32px_rgba(210,162,38,0.16)]"
                  />
                </article>
              </Reveal>
            );
          })}
        </Loop>

        {/* Flow comparison */}
        <div className="grid gap-4">
          <Reveal>
            <Loop className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] px-4 sm:px-5 py-8 sm:py-14 text-center">
              <p className="text-xs font-bold tracking-[0.3em] text-red-400 uppercase">You decide</p>
              <p className="mt-3 sm:mt-4 text-xl sm:text-4xl font-extrabold text-white tracking-tight">&ldquo;I want this.&rdquo;</p>
              <div className="mt-5 sm:mt-7">
                <Lane steps={WITHOUT} tone="red" />
              </div>
              <p className="mt-6 sm:mt-7 text-base sm:text-2xl font-bold text-white">You know the goal. You don&apos;t know what to do today.</p>
              <p className="mt-2 text-xs sm:text-base text-zinc-400">Every morning: &ldquo;What should I actually do?&rdquo;</p>
            </Loop>
          </Reveal>
          <Reveal delay={150}>
            <Loop className="rounded-2xl border border-[#D2A226]/30 bg-[#D2A226]/[0.05] px-4 sm:px-5 py-8 sm:py-14 text-center">
              <p className="text-xs font-bold tracking-[0.3em] text-[#D2A226] uppercase">Legacy Life Builder</p>
              <p className="mt-3 sm:mt-4 text-xl sm:text-4xl font-extrabold text-white tracking-tight">Every step is decided for you.</p>
              <div className="mt-5 sm:mt-7">
                <Lane steps={WITH} tone="gold" />
              </div>
              <p className="mt-6 sm:mt-7 text-xs sm:text-base text-zinc-300">Down to today&apos;s task. Open the app and start.</p>
            </Loop>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
