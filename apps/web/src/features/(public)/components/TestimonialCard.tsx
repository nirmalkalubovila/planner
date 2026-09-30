import { BadgeCheck, Hexagon, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PublicTestimonial {
  id?: string;
  subject: string;
  message: string;
  rating?: number | null;
  author_name?: string | null;
  author_position?: string | null;
  tag?: string | null;
  avatar_url?: string | null;
  is_verified?: boolean;
}

/** Messages longer than this get a "See more" link (the card clamps the text to ~6 lines). */
export const TESTIMONIAL_CLAMP_CHARS = 260;

interface TestimonialCardProps {
  testimonial: PublicTestimonial;
  onSeeMore?: (t: PublicTestimonial) => void;
  className?: string;
}

/**
 * Landing-page testimonial card. Cards with a tag use the gold accent, the rest the blue one.
 * Shared by the public carousel and the admin live preview so both always look identical.
 */
export function TestimonialCard({ testimonial: t, onSeeMore, className }: TestimonialCardProps) {
  const gold = !!t.tag;
  const name = t.author_name || 'Anonymous Builder';
  const role = t.author_position || 'Builder';
  const long = t.message.length > TESTIMONIAL_CLAMP_CHARS;

  return (
    <article
      className={cn(
        'flex flex-col whitespace-normal shrink-0 w-[300px] sm:w-[440px] min-h-[380px] rounded-[28px] border p-5 sm:p-6 backdrop-blur-sm transition-colors',
        gold
          ? 'border-amber-500/50 bg-gradient-to-br from-amber-950/40 via-zinc-950 to-zinc-950 shadow-[0_0_40px_-12px_rgba(245,158,11,0.35)]'
          : 'border-zinc-800/80 bg-gradient-to-br from-zinc-900/60 via-zinc-950 to-zinc-950 hover:border-zinc-700',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 min-h-[28px]">
        {t.tag ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.18em] uppercase text-amber-400">
            <Hexagon className="h-3 w-3 fill-amber-400/80" />
            {t.tag}
          </span>
        ) : (
          <span />
        )}
        {!!t.rating && (
          <div className="flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
            {Array.from({ length: Math.min(5, t.rating) }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
        )}
      </div>

      <span className={cn('mt-3 text-3xl leading-none font-serif', gold ? 'text-amber-400' : 'text-sky-400')} aria-hidden>
        &ldquo;
      </span>

      <h3 className="mt-3 text-lg font-extrabold leading-snug text-white">{t.subject}</h3>

      <p className={cn('mt-2 text-[15px] leading-relaxed text-zinc-400 whitespace-pre-line', long && 'line-clamp-6')}>{t.message}</p>

      {long && onSeeMore && (
        <button
          type="button"
          onClick={() => onSeeMore(t)}
          className={cn(
            'mt-3 w-fit border-b text-sm font-medium cursor-pointer',
            gold ? 'text-amber-400 border-amber-400' : 'text-sky-400 border-sky-400'
          )}
        >
          See more
        </button>
      )}

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between gap-3 border-t border-zinc-800/80 pt-4">
          <div className="flex items-center gap-3 min-w-0">
            {t.avatar_url ? (
              <img src={t.avatar_url} alt={name} className="h-9 w-9 shrink-0 rounded-full object-cover border border-zinc-700" />
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{name}</p>
              <p className="text-xs text-zinc-400 truncate">{role}</p>
            </div>
          </div>
          {t.is_verified && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.18em] uppercase text-sky-400">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
