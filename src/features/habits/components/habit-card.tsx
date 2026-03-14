import React from 'react';
import { Edit2, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Habit } from '@/types/global-types';

interface HabitCardProps {
    habit: Habit;
    onEdit: (habit: Habit) => void;
    onDelete: (id: string) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onEdit, onDelete }) => {
    return (
        <Card className="group hover:border-primary/40 transition-all hover:shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/80"></div>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-bold pr-2 leading-tight">{habit.name}</CardTitle>
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onEdit(habit)}>
                            <Edit2 size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(habit.id!)}>
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </div>
                {(habit.purpose) && (
                    <CardDescription className="line-clamp-2 mt-1 italic text-muted-foreground/80 font-medium">
                        "{habit.purpose}"
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2.5 text-sm text-foreground/80 font-medium">
                    <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="flex flex-col bg-accent/30 p-2 rounded border border-border/50 col-span-2">
                            <span className="text-[10px] uppercase text-muted-foreground tracking-wider mb-0.5">Time Range</span>
                            <span className="font-semibold text-primary">{habit.startTime} - {habit.endTime}</span>
                        </div>
                    </div>

                    {habit.startDate && habit.endDate && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1 bg-background pt-1">
                            <CalendarIcon size={12} className="text-primary/60" />
                            <span>{habit.startDate}</span>
                            <span className="mx-1 font-light">&rarr;</span>
                            <span>{habit.endDate}</span>
                        </div>
                    )}

                    {habit.daysOfWeek && habit.daysOfWeek.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {habit.daysOfWeek.map(day => (
                                <span key={day} className="text-[9px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-1.5 py-0.5 rounded-sm">
                                    {day.substring(0, 3)}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
