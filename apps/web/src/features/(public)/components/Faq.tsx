import { useEffect } from "react";
import Reveal from "./Reveal";

// The frustrations people have with planners, answered from what the product really does.
export const FAQ_ITEMS = [
  {
    q: "I have too many tasks. Where do I start?",
    a: "Pick up to three outcomes for the week. Everything else goes into time blocks, so Today only shows what is next.",
  },
  {
    q: "What should I work on today?",
    a: "Open Today. Your list is already built from your week, in time order, under your weekly priorities. Nothing to decide.",
  },
  {
    q: "What happens when I fall behind?",
    a: "Open Reset. It compares your plan with the time you really have, then suggests what to keep, move, shrink or drop. You approve it, and you can undo it.",
  },
  {
    q: "How do I stop planning and start doing?",
    a: "Write the goal and its deadline. AI splits it into years, months, weeks and daily tasks, then places the work in your week.",
  },
  {
    q: "Can it create a realistic plan around my actual life?",
    a: "Yes. It uses your sleep, free hours and energy, and keeps clear of your habits. Life buckets show when rest or people are being left out.",
  },
  {
    q: "What happens to tasks I do not complete?",
    a: "They are never deleted. Work that does not fit moves to your Backlog, and you place it again in any week when you are ready.",
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
      <Reveal className="text-center">
        <span className="text-[10px] font-bold tracking-[0.25em] text-[#D2A226] uppercase">Questions</span>
        <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Answers <span className="text-zinc-500">in plain words.</span>
        </h2>
      </Reveal>

      <div className="mx-auto mt-8 max-w-3xl divide-y divide-zinc-900 rounded-2xl border border-zinc-900 bg-zinc-950/60">
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
