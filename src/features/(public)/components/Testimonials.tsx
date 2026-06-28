import { Star } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
}

interface TestimonialsProps {
  curatedFeedbacks?: { 
    id: string; 
    category: string; 
    subject: string; 
    message: string; 
    created_at: string;
    rating?: number;
    author_name?: string | null;
    author_position?: string | null;
  }[];
}

export default function Testimonials({ curatedFeedbacks }: TestimonialsProps) {
  // Only show real curated feedbacks from database — no dummy data
  const testimonials: Testimonial[] = (curatedFeedbacks || []).map((f) => ({
    name: f.author_name || "Anonymous Builder",
    role: f.author_position || (f.category === "About Legacy Life Builder" ? "Builder" : f.category),
    content: f.message,
    rating: f.rating || 5,
  }));

  // Don't render section if no curated feedbacks exist
  if (testimonials.length === 0) return null;

  // Duplicate for seamless infinite looping
  const doubledTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="py-4 bg-black overflow-hidden relative select-none">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
      `}} />

      <div className="px-5 sm:px-8 mb-3 text-left">
        <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase">
          Wall of Love
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-[1.1]">
          Loved by builders{" "}
          <span className="bg-gradient-to-r from-zinc-400 via-zinc-200 to-white bg-clip-text text-transparent">
            choosing greatness.
          </span>
        </h2>
      </div>

      {/* Infinite Scroll Container */}
      <div className="relative w-full flex items-center justify-start overflow-hidden py-2">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

        <div className="flex gap-4 animate-marquee hover:[animation-play-state:paused] whitespace-nowrap">
          {doubledTestimonials.map((t, index) => (
            <div
              key={index}
              className="inline-block whitespace-normal w-[280px] sm:w-[320px] bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 backdrop-blur-sm shadow-xl transition-all duration-300 hover:border-zinc-800 hover:bg-zinc-900/10"
            >
              {/* Star Rating */}
              <div className="flex gap-0.5 mb-3">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-xs text-zinc-300 leading-relaxed font-normal mb-4 italic">
                "{t.content}"
              </p>

              {/* Author */}
              <div className="border-t border-zinc-900 pt-3 flex flex-col">
                <span className="text-[11px] font-bold text-white tracking-wide">
                  {t.name}
                </span>
                <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">
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
