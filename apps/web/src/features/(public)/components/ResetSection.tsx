import Reveal from "./Reveal";

const MOVES = [
  { label: "Keep", text: "Protect the work that matters most." },
  { label: "Move", text: "Shift flexible work to a day that fits." },
  { label: "Reduce", text: "Shorten a block instead of dropping it." },
  { label: "Remove", text: "Take it out of the week. It is saved, not deleted." },
];

export default function ResetSection() {
  return (
    <section id="reset" className="scroll-mt-28 bg-black py-12 sm:py-16 px-5 sm:px-8">
      <Reveal>
        <span className="text-[10px] font-bold tracking-[0.25em] text-[#D2A226] uppercase">Weekly reset</span>
        <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-3xl">
          Life changes. <span className="text-zinc-500">Your plan should too.</span>
        </h2>
        <p className="mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-zinc-400">
          Fell behind? One tap shows what to keep, move, reduce or remove. Nothing changes until you approve it.
        </p>
      </Reveal>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MOVES.map((m, i) => (
          <li key={m.label}>
            <Reveal delay={i * 100} className="h-full">
              <div className="h-full rounded-2xl border border-zinc-900 bg-zinc-950/60 p-5 transition-colors duration-300 hover:border-[#D2A226]/30">
                <span className="text-xs font-bold tracking-[0.2em] text-[#D2A226]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-lg font-bold text-white">{m.label}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{m.text}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
