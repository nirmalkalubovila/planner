import Reveal from "./Reveal";

const WHY = [
  { title: "Direction", text: "Goals become milestones, weeks and daily tasks." },
  { title: "Execution", text: "Your week runs in time blocks. Reset fixes it when life changes." },
  { title: "Proof", text: "Streaks and milestones become a record that the system works." },
];

export default function WhyLifeBuilder() {
  return (
    <section id="why" className="scroll-mt-28 bg-black py-12 sm:py-16 px-5 sm:px-8">
      <Reveal>
        <span className="text-[10px] font-bold tracking-[0.25em] text-[#D2A226] uppercase">Why Legacy Life Builder?</span>
        <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-3xl">
          A Legacy Life is built <span className="text-zinc-500">one week at a time.</span>
        </h2>
      </Reveal>

      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {WHY.map((w, i) => (
          <li key={w.title}>
            <Reveal delay={i * 90} className="h-full">
              <div className="h-full rounded-2xl border border-[#D2A226]/25 bg-[#D2A226]/[0.04] p-5">
                <span className="text-xs font-bold tracking-[0.2em] text-[#D2A226]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-lg font-bold text-white">{w.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">{w.text}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
