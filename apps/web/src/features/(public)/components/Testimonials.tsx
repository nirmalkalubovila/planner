import { useState, useEffect, useRef } from 'react';
import { StandardDialog } from '@/components/common/standard-dialog';
import { MessageSquareQuote } from 'lucide-react';
import { TestimonialCard, type PublicTestimonial } from './TestimonialCard';

interface TestimonialsProps {
  curatedFeedbacks?: PublicTestimonial[];
}

// Auto-scroll speed in pixels per second
const SPEED = 40;

export default function Testimonials({ curatedFeedbacks }: TestimonialsProps) {
  // Only show real curated testimonials from the database - no dummy data
  const testimonials = curatedFeedbacks ?? [];

  const containerRef = useRef<HTMLDivElement>(null);
  const [isHeld, setIsHeld] = useState(false);
  const [expanded, setExpanded] = useState<PublicTestimonial | null>(null);

  const paused = isHeld || !!expanded;
  const hasItems = testimonials.length > 0;

  useEffect(() => {
    const container = containerRef.current;
    if (!hasItems || !container || paused) return;

    let frame = 0;
    let last: number | null = null;
    const step = (timestamp: number) => {
      if (last !== null) container.scrollLeft += (SPEED * (timestamp - last)) / 1000;
      last = timestamp;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [paused, hasItems]);

  if (!hasItems) return null;

  // The list is rendered twice so the loop is seamless: jump back by one list-width when passing the end
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const half = container.scrollWidth / 2;
    if (container.scrollLeft >= half) container.scrollLeft -= half;
    else if (container.scrollLeft <= 0) container.scrollLeft += half;
  };

  const loop = [...testimonials, ...testimonials];

  return (
    <section className="py-12 sm:py-16 bg-black overflow-hidden relative select-none">
      <style dangerouslySetInnerHTML={{ __html: '.scrollbar-none::-webkit-scrollbar{display:none}' }} />

      <div className="px-5 sm:px-8 text-center mb-8">
        <span className="text-[10px] sm:text-xs font-bold tracking-[0.3em] text-sky-400 uppercase">Testimonials</span>
        <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">What they say.</h2>
      </div>

      <div className="relative w-full">
        <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-10 sm:w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

        <div
          ref={containerRef}
          onScroll={handleScroll}
          onMouseEnter={() => setIsHeld(true)}
          onMouseLeave={() => setIsHeld(false)}
          onPointerDown={() => setIsHeld(true)}
          onPointerUp={() => setIsHeld(false)}
          onTouchStart={() => setIsHeld(true)}
          onTouchEnd={() => setIsHeld(false)}
          className="flex gap-4 items-stretch overflow-x-auto py-3 px-5 scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loop.map((t, i) => (
            <TestimonialCard key={`${t.id ?? i}-${i}`} testimonial={t} onSeeMore={setExpanded} />
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-zinc-500">Hold to pause and read.</p>

      <StandardDialog
        isOpen={!!expanded}
        onClose={() => setExpanded(null)}
        title={expanded?.subject ?? ''}
        subtitle={[expanded?.author_name, expanded?.author_position].filter(Boolean).join(' | ') || 'Legacy Life Builder'}
        icon={MessageSquareQuote}
        maxWidth="lg"
      >
        <p className="p-5 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{expanded?.message}</p>
      </StandardDialog>
    </section>
  );
}
