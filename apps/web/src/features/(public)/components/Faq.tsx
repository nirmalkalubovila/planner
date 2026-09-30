import { useEffect } from "react";
import Reveal from "./Reveal";

// The questions people actually type into search. Each answer describes what the product really does.
export const FAQ_ITEMS = [
  {
    q: "What is a Legacy Life?",
    a: "A life of freedom, ownership, purpose, health, deep relationships and lasting impact, built on purpose so your best years compound instead of running out. Legacy Life Builder turns it into weekly plans and daily tasks.",
  },
  {
    q: "How do I reset my week when I fall behind?",
    a: "Open Reset in Legacy Life Builder. It compares the time you planned with the time you have, then suggests what to keep, move, reduce or remove. Nothing changes until you approve it.",
  },
  {
    q: "What is time blocking?",
    a: "Time blocking gives every task its own slot in your calendar instead of leaving an open to-do list. Legacy Life Builder places your goals and habits in 30-minute blocks and prevents overlaps.",
  },
  {
    q: "How do I turn a big goal into daily tasks?",
    a: "Write the goal and its deadline. AI splits it into years, months, weeks and daily tasks, then places the work in your week.",
  },
  {
    q: "Does the AI planner know how much free time I have?",
    a: "Yes. It uses the free hours, energy and focus style you share, so the plan fits your real week instead of an ideal one.",
  },
  {
    q: "Can I track habits and goals in one place?",
    a: "Yes. Habits, goals and weekly priorities share one planner, so today's list is already built when you open the app.",
  },
  {
    q: "What happens to tasks I miss?",
    a: "Missed tasks are saved. Roll them into the current week yourself, or let Reset place them for you.",
  },
];

export default function Faq() {
  // FAQ structured data, generated from the same list that is shown on the page so the two never drift apart
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "faq-jsonld";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((i) => ({
        "@type": "Question",
        name: i.q,
        acceptedAnswer: { "@type": "Answer", text: i.a },
      })),
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  return (
    <section id="faq" className="scroll-mt-28 bg-black py-12 sm:py-16 px-5 sm:px-8">
      <Reveal>
        <span className="text-[10px] font-bold tracking-[0.25em] text-[#D2A226] uppercase">Questions</span>
        <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Answers <span className="text-zinc-500">in plain words.</span>
        </h2>
      </Reveal>

      <div className="mt-8 max-w-3xl divide-y divide-zinc-900 rounded-2xl border border-zinc-900 bg-zinc-950/60">
        {FAQ_ITEMS.map((item) => (
          <details key={item.q} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm sm:text-base font-bold text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D2A226] rounded">
              <span>{item.q}</span>
              <span className="shrink-0 text-xs font-semibold text-[#D2A226] group-open:hidden">Show</span>
              <span className="hidden shrink-0 text-xs font-semibold text-[#D2A226] group-open:inline">Hide</span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
