import Reveal from "./Reveal";
import { useInViewOnce } from "../hooks/use-in-view-once";

// Five milestones along the path (percent from the left). The goal sits at the right end.
const MILESTONES = [10, 30, 50, 70, 90];
const CYCLE_S = 5.6;
// The light travels the full line in this share of the cycle, then the path holds, fades and starts again.
const TRAVEL = 0.55;
const HOLD_UNTIL = 88;

const pct = (n: number) => Number(n.toFixed(2));

/**
 * Keyframes are generated from the milestone positions so each one lights at the moment the light reaches it.
 * Everything uses opacity and transform only, and reduced motion shows the finished path with no animation.
 */
const CSS = `
.llb-sys[data-play="false"] * { animation-play-state: paused; }
.llb-sys-fill { transform-origin: left; animation: llb-sys-fill ${CYCLE_S}s linear infinite; }
.llb-sys-glow { animation: llb-sys-glow ${CYCLE_S}s linear infinite; }
@keyframes llb-sys-fill {
  0% { transform: scaleX(0); opacity: 1; }
  ${pct(TRAVEL * 100)}% { transform: scaleX(1); opacity: 1; }
  ${HOLD_UNTIL}% { transform: scaleX(1); opacity: 1; }
  100% { transform: scaleX(1); opacity: 0; }
}
@keyframes llb-sys-glow {
  0% { transform: translateX(-50%); opacity: 0; }
  3% { opacity: 1; }
  ${pct(TRAVEL * 100)}% { transform: translateX(450%); opacity: 1; }
  ${pct(TRAVEL * 100 + 4)}% { transform: translateX(450%); opacity: 0; }
  100% { transform: translateX(450%); opacity: 0; }
}
${[...MILESTONES, 100]
  .map((p, i) => {
    const at = (p / 100) * TRAVEL * 100;
    return `
.llb-sys-lit-${i} { opacity: 0; animation: llb-sys-lit-${i} ${CYCLE_S}s ease-out infinite; }
@keyframes llb-sys-lit-${i} {
  0%, ${pct(at)}% { opacity: 0; transform: scale(0.5); }
  ${pct(at + 4)}% { opacity: 1; transform: scale(1); }
  ${HOLD_UNTIL}% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1); }
}`;
  })
  .join("")}
@media (prefers-reduced-motion: reduce) {
  .llb-sys-fill, .llb-sys-glow, [class*="llb-sys-lit-"] { animation: none; }
  .llb-sys-fill { transform: none; }
  .llb-sys-glow { display: none; }
  [class*="llb-sys-lit-"] { opacity: 1; }
}
`;

/** The path from today to the goal: a light runs left to right, lighting each milestone, then repeats. */
function Path() {
  const [ref, seen] = useInViewOnce<HTMLDivElement>(0.4);

  return (
    <div
      ref={ref}
      data-play={seen ? "true" : "false"}
      className="llb-sys relative overflow-hidden rounded-2xl border border-[#D2A226]/25 bg-[radial-gradient(ellipse_at_top,rgba(210,162,38,0.10),transparent_65%)] px-5 sm:px-10 py-10 sm:py-14"
      role="img"
      aria-label="A path with five milestones leading from today to your goal"
    >
      <style>{CSS}</style>
      <div className="relative mx-auto h-6 max-w-3xl" aria-hidden>
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-zinc-800" />

        <span className="llb-sys-fill absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-[#8a6415] via-[#D2A226] to-[#e9c468]" />

        {/* The light that leads the fill */}
        <span className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 overflow-hidden">
          <span className="llb-sys-glow absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-transparent via-[#e9c468]/80 to-transparent blur-[2px]" />
        </span>

        <span className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-zinc-400" />

        {MILESTONES.map((left, i) => (
          <span key={left} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${left}%` }}>
            <span className="block h-3 w-3 rounded-full border border-zinc-700 bg-black" />
            <span className={`llb-sys-lit-${i} absolute inset-0 rounded-full border border-[#e9c468] bg-[#D2A226] shadow-[0_0_14px_rgba(210,162,38,0.7)]`} />
          </span>
        ))}

        <span className="absolute right-0 top-1/2 -translate-y-1/2">
          <span className="block h-4 w-4 rounded-full border border-zinc-700 bg-black" />
          <span className={`llb-sys-lit-${MILESTONES.length} absolute inset-0 rounded-full border-2 border-[#e9c468] bg-[#D2A226] shadow-[0_0_20px_rgba(210,162,38,0.8)]`} />
        </span>
      </div>
    </div>
  );
}

export default function SystemsOverGoals() {
  return (
    <section id="systems" className="scroll-mt-28 bg-black py-12 sm:py-16 px-5 sm:px-8">
      <div className="w-full space-y-8 sm:space-y-10">
        <Reveal>
          <span className="text-[10px] font-bold tracking-[0.25em] text-[#D2A226] uppercase">Systems over goals</span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-3xl">
            A goal is where you are going.{" "}
            <span className="text-zinc-500">A system is how you get there.</span>
          </h2>
          <p className="mt-3 text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Motivation fades and plans change. A system keeps you moving anyway.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <Path />
        </Reveal>
      </div>
    </section>
  );
}
