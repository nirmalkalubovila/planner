import { useState, useEffect, useRef } from 'react';
import { Star, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  title?: string;
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
    title: f.subject,
  }));

  // Don't render section if no curated feedbacks exist
  if (testimonials.length === 0) return null;

  // Duplicate for seamless infinite looping
  const doubledTestimonials = [...testimonials, ...testimonials];

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Speed in pixels per second
  const speed = 40; 

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isPlaying || isHovered) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const step = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const elapsed = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Scroll increment based on time elapsed
      const scrollAmount = (speed * elapsed) / 1000;
      container.scrollLeft += scrollAmount;

      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isHovered]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    
    const maxScroll = container.scrollWidth / 2;
    if (container.scrollLeft >= maxScroll) {
      container.scrollLeft -= maxScroll;
    } else if (container.scrollLeft <= 0) {
      container.scrollLeft += maxScroll;
    }
  };

  const handlePrev = () => {
    const container = containerRef.current;
    if (!container) return;
    setIsPlaying(false);
    
    // Smooth scroll left by one card width + gap
    const cardWidth = 300 + 16; 
    container.scrollTo({
      left: container.scrollLeft - cardWidth,
      behavior: 'smooth'
    });
  };

  const handleNext = () => {
    const container = containerRef.current;
    if (!container) return;
    setIsPlaying(false);
    
    // Smooth scroll right by one card width + gap
    const cardWidth = 300 + 16; 
    container.scrollTo({
      left: container.scrollLeft + cardWidth,
      behavior: 'smooth'
    });
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <section className="py-6 bg-black overflow-hidden relative select-none">
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}} />

      <div className="px-5 sm:px-8 mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
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

        {/* Carousel Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            title="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={togglePlay}
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title={isPlaying ? "Pause scroll" : "Play scroll"}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>Play</span>
              </>
            )}
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            title="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Infinite Scroll Container */}
      <div className="relative w-full flex items-center justify-start overflow-hidden py-2">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

        <div 
          ref={containerRef}
          onScroll={handleScroll}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
          className="relative w-full flex gap-4 items-center justify-start overflow-x-auto py-2 select-none scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {doubledTestimonials.map((t, index) => (
            <div
              key={index}
              className="inline-block whitespace-normal w-[280px] sm:w-[320px] bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 backdrop-blur-sm shadow-xl transition-all duration-300 hover:border-zinc-800 hover:bg-zinc-900/10 shrink-0"
            >
              {/* Star Rating */}
              <div className="flex gap-0.5 mb-3">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Review Title */}
              {t.title && (
                <h4 className="text-[11.5px] font-bold text-white mb-1.5 line-clamp-1">
                  {t.title}
                </h4>
              )}

              {/* Review Text */}
              <p className="text-xs text-zinc-350 leading-relaxed font-normal mb-4 italic">
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
