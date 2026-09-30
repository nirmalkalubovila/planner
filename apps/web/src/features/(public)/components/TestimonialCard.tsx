import { BadgeCheck, Star } from 'lucide-react';
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

/** Messages longer than this get a "See more" link (the card clamps the text to 4 lines). */
export const TESTIMONIAL_CLAMP_CHARS = 170;

interface TestimonialCardProps {
  testimonial: PublicTestimonial;
  onSeeMore?: (t: PublicTestimonial) => void;
  className?: string;
}

/**
 * Compact landing-page testimonial card in the Legacy gold (#D2A226). Tagged cards get a stronger gold
 * border. Shared by the public carousel and the admin live preview so both always look identical.
 */
export function TestimonialCard({ testimonial: t, onSeeMore, className }: TestimonialCardProps) {
  const name = t.author_name || 'Anonymous Builder';
  const role = t.author_position || 'Builder';
  const long = t.message.length > TESTIMONIAL_CLAMP_CHARS;
  const featured = !!t.tag;

  return (
    <article
      className={cn(
        'flex flex-col whitespace-normal shrink-0 w-[260px] sm:w-[320px] min-h-[250px] rounded-2xl border p-4 bg-zinc-950/60 transition-[color,border-color,transform]',
        'hover:-translate-y-1 duration-300',
        featured ? 'border-[#D2A226]/50 bg-gradient-to-br from-[#D2A226]/[0.07] to-zinc-950' : 'border-zinc-900 hover:border-[#D2A226]/30',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 min-h-[20px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl leading-none font-serif text-[#D2A226]" aria-hidden>&ldquo;</span>
          {t.tag && (
            <span className="truncate rounded-full border border-[#D2A226]/40 bg-[#D2A226]/10 px-2 py-0.5 text-[9px] font-extrabold tracking-[0.16em] uppercase text-[#D2A226]">
              {t.tag}
            </span>
          )}
        </div>
        {!!t.rating && (
          <div className="flex gap-0.5 shrink-0" aria-label={`${t.rating} out of 5 stars`}>
            {Array.from({ length: Math.min(5, t.rating) }).map((_, i) => (
              <Star key={i} className="h-2.5 w-2.5 fill-[#D2A226] text-[#D2A226]" />
            ))}
          </div>
        )}
      </div>

      <h3 className="mt-2 text-sm font-bold leading-snug text-white line-clamp-2">{t.subject}</h3>

      <p className={cn('mt-1.5 text-xs leading-relaxed text-zinc-400 whitespace-pre-line', long && 'line-clamp-4')}>{t.message}</p>

      {long && onSeeMore && (
        <button
          type="button"
          onClick={() => onSeeMore(t)}
          className="mt-2 w-fit border-b border-[#D2A226] text-xs font-medium text-[#D2A226] cursor-pointer"
        >
          See more
        </button>
      )}

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-2 border-t border-zinc-900 pt-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {t.avatar_url ? (
              <img src={t.avatar_url} alt={name} className="h-7 w-7 shrink-0 rounded-full object-cover border border-zinc-800" />
            ) : (
              <div className="h-7 w-7 shrink-0 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[11px] font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white truncate">{name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{role}</p>
            </div>
          </div>
          {t.is_verified && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#D2A226]/30 bg-[#D2A226]/10 px-2 py-0.5 text-[9px] font-extrabold tracking-[0.14em] uppercase text-[#D2A226]">
              <BadgeCheck className="h-2.5 w-2.5" />
              Verified
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
