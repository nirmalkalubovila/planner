import { cn } from '@/lib/utils';

export interface ChipOption<T extends string> {
    value: T;
    label: string;
    hint?: string;
}

interface OptionChipsProps<T extends string> {
    options: ChipOption<T>[];
    value: T | T[] | undefined;
    onChange: (value: T) => void;
    /** Grid column classes; defaults to a responsive 2/4 column grid. */
    className?: string;
}

/**
 * Single- or multi-select pill/card group. Selection styling matches the
 * habit day-chips and BucketSelector so new forms look native.
 */
export function OptionChips<T extends string>({ options, value, onChange, className }: OptionChipsProps<T>) {
    const isSelected = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
    return (
        <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-2', className)}>
            {options.map((opt) => {
                const selected = isSelected(opt.value);
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        aria-pressed={selected}
                        className={cn(
                            'flex flex-col items-start gap-0.5 p-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 text-left cursor-pointer',
                            selected
                                ? 'bg-accent border-foreground/30 text-foreground shadow-sm'
                                : 'bg-card/60 border-border text-muted-foreground hover:text-foreground hover:bg-accent/40'
                        )}
                    >
                        <span className="font-bold tracking-tight">{opt.label}</span>
                        {opt.hint && <span className="text-[10px] font-normal opacity-80 leading-snug">{opt.hint}</span>}
                    </button>
                );
            })}
        </div>
    );
}
