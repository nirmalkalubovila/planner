import React from 'react';
import { Edit2, Trash2, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Habit } from '@/types/global-types';
import { cn } from '@/lib/utils';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_MAP: Record<string, string> = {
    Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
    Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

interface HabitCardProps {
    habit: Habit;
    onEdit: (habit: Habit) => void;
    onDelete: (id: string) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onEdit, onDelete }) => {
    const activeDays = new Set((habit.daysOfWeek || []).map(d => DAY_MAP[d] || d.substring(0, 3)));
    const frequency = activeDays.size;
    const isEveryday = frequency === 7;

    const intensityOpacity = Math.max(0.4, frequency / 7);

    return (
        <div
            className={cn(
                'group relative rounded-2xl border overflow-hidden flex flex-col h-full',
                'bg-card border-border hover:border-primary/40',
                'transition-[border-color,box-shadow] duration-150',
                frequency >= 5 && 'hover:shadow-[0_0_24px_rgba(var(--primary-rgb,99,102,241),0.12)]',
            )}
        >
            {/* Accent bar - intensity scales with frequency */}
            <div
                className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-2xl"
                style={{ opacity: intensityOpacity }}
            />

            {/* Action buttons */}
            <div className="absolute top-2.5 right-2.5 flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-100 z-10">
                <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent"
                    onClick={() => onEdit(habit)}
                >
                    <Edit2 size={13} />
                </Button>
                <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent"
                    onClick={() => onDelete(habit.id!)}
                >
                    <Trash2 size={13} />
                </Button>
            </div>

            <div className="p-4 pl-5 flex flex-col gap-3 flex-1">
                {/* Row 1: Name + everyday badge */}
                <div className="flex items-start gap-2 pr-14">
                    <h3 className="font-bold text-[15px] leading-snug text-foreground tracking-tight">
                        {habit.name}
                    </h3>
                    {isEveryday && (
                        <span className="shrink-0 mt-0.5 text-[8px] font-black uppercase tracking-widest bg-primary/15 text-primary border border-primary/20 px-1.5 py-0.5 rounded">
                            Daily
                        </span>
                    )}
                </div>

                {/* Row 2: Time pill */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-muted border border-border rounded-lg px-2.5 py-1.5">
                        <Clock size={13} className="text-primary/70 shrink-0" />
                        <span className="text-sm font-bold text-foreground font-mono tracking-tight">
                            {habit.startTime}
                        </span>
                        <span className="text-muted-foreground text-xs">→</span>
                        <span className="text-sm font-bold text-foreground font-mono tracking-tight">
                            {habit.endTime}
                        </span>
                    </div>
                </div>

                {/* Row 3: Week frequency dots */}
                <div className="flex items-center gap-1">
                    {ALL_DAYS.map(day => {
                        const active = activeDays.has(day);
                        return (
                            <div key={day} className="flex flex-col items-center gap-1">
                                <div
                                    className={cn(
                                        'w-[26px] h-[6px] rounded-full transition-colors',
                                        active
                                            ? 'bg-primary'
                                            : 'bg-muted'
                                    )}
                                />
                                <span className={cn(
                                    'text-[8px] font-bold uppercase tracking-wide',
                                    active ? 'text-foreground' : 'text-muted-foreground'
                                )}>
                                    {day.charAt(0)}
                                </span>
                            </div>
                        );
                    })}
                    <span className="text-[9px] font-black text-foreground ml-1.5 uppercase tracking-widest">
                        {frequency}/7
                    </span>
                </div>

                {/* Row 4: Purpose */}
                {habit.purpose && (
                    <p className="text-[11px] text-foreground/80 italic leading-relaxed line-clamp-2">
                        "{habit.purpose}"
                    </p>
                )}

                {/* Row 5: Date range footer */}
                {habit.startDate && habit.endDate && (
                    <div className="flex items-center gap-1.5 text-[10px] text-foreground/70 mt-auto pt-1">
                        <CalendarIcon size={10} className="text-foreground/70 shrink-0" />
                        <span>{habit.startDate}</span>
                        <span className="text-muted-foreground/60">→</span>
                        <span>{habit.endDate}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
