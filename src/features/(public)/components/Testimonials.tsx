import { Star } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: "David K.",
    role: "Founder & Tech Lead",
    content: "This app single-handedly replaced my calendar, habit tracker, and complex AI prompts. The daily schedule generation is scary good.",
    rating: 5,
  },
  {
    name: "Sarah M.",
    role: "Software Engineer",
    content: "I've tried every planner out there. Legacy Life Builder is the first one that sticks because it actually schedules the tasks for me.",
    rating: 5,
  },
  {
    name: "Marcus T.",
    role: "Athlete & Creator",
    content: "Average is a choice. This planner helps me choose greatness every single morning. The discipline battery keeps me highly accountable.",
    rating: 5,
  },
  {
    name: "Elena R.",
    role: "Growth Lead",
    content: "The UI is gorgeous, clean, and blazingly fast. Generating week roadmaps and syncing habits took less than 5 minutes.",
    rating: 5,
  },
  {
    name: "James L.",
    role: "Independent Researcher",
    content: "The Vault note-taking integrated right into my daily schedule makes it so easy to capture ideas without losing focus.",
    rating: 5,
  },
  {
    name: "Sophia W.",
    role: "Product Manager",
    content: "Highly recommend this to anyone trying to schedule deep work. The milestone targets scaling makes long-term progress visible.",
    rating: 5,
  },
];

export default function Testimonials() {
  // Duplicate the array to ensure seamless infinite looping
  const doubledTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="py-20 bg-black overflow-hidden relative border-t border-zinc-900/60">
      {/* Custom Keyframe Styles injected directly */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
      `}} />

      <div className="max-w-4xl mx-auto px-4 mb-14 text-center">
        <span className="text-xs font-bold tracking-[0.25em] text-zinc-500 uppercase">
          Wall of Love
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-none">
          Loved by builders
          <br />
          <span className="bg-gradient-to-r from-zinc-400 via-zinc-200 to-white bg-clip-text text-transparent">
            choosing greatness.
          </span>
        </h2>
        <p className="mt-4 text-sm text-zinc-500 font-medium max-w-md mx-auto">
          See how high-performers are building their legacy daily.
        </p>
      </div>

      {/* Infinite Scroll Container */}
      <div className="relative w-full flex items-center justify-start overflow-hidden py-4">
        {/* Left & Right gradient overlays to fade out edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

        <div className="flex gap-6 animate-marquee hover:[animation-play-state:paused] whitespace-nowrap">
          {doubledTestimonials.map((t, index) => (
            <div
              key={index}
              className="inline-block whitespace-normal w-[280px] sm:w-[350px] bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl transition-all duration-300 hover:border-zinc-800 hover:bg-zinc-900/10 hover:scale-[1.01]"
            >
              {/* Star Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-sm text-zinc-300 leading-relaxed font-normal mb-5 italic">
                "{t.content}"
              </p>

              {/* Author */}
              <div className="border-t border-zinc-900 pt-4 flex flex-col">
                <span className="text-xs font-bold text-white tracking-wide">
                  {t.name}
                </span>
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">
                  {t.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
