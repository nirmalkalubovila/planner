import React, { useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { WeekUtils } from '@/utils/week-utils';
import { GridState } from '@/types/global-types';
import { getGoalColor } from '@/utils/color-utils';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS_PER_DAY = 48;

interface PlannerGridProps {
    currentWeek: string;
    localGridState: GridState;
    setLocalGridState: (state: GridState) => void;
    isSleepSlot: (slotIdx: number) => boolean;
    isHabitSlot: (dayIdx: number, slotIdx: number) => boolean;
    isPlanSlot: (dayIdx: number, slotIdx: number) => boolean;
    getCellContent: (dayIdx: number, slotIdx: number) => any;
    handleCellClick: (dayIdx: number, slotIdx: number) => void;
}

export const PlannerGrid: React.FC<PlannerGridProps> = ({
    currentWeek,
    localGridState,
    setLocalGridState,
    isSleepSlot,
    isHabitSlot,
    isPlanSlot,
    getCellContent,
    handleCellClick
}) => {
    const weekDates = useMemo(() => WeekUtils.getDaysForWeek(currentWeek), [currentWeek]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to morning (first non-sleep slot) on mount or week change
    useEffect(() => {
        if (!scrollRef.current) return;

        // Find the first active slot (usually wake up time)
        let firstActiveSlot = 0;
        for (let i = 0; i < SLOTS_PER_DAY; i++) {
            if (!isSleepSlot(i)) {
                firstActiveSlot = i;
                break;
            }
        }

        // Each slot is h-10 (40px)
        const scrollPosition = Math.max(0, (firstActiveSlot * 40) - 20); // -20 for a bit of breathing room at the top
        scrollRef.current.scrollTop = scrollPosition;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentWeek]); // Only scroll on mount or week change, NOT on every grid click

    return (
        <div className="flex-1 bg-card border rounded-xl shadow-inner overflow-hidden flex flex-col h-full min-h-[400px]">
            <div ref={scrollRef} className="flex-1 overflow-auto">

                {/* FIX 1: Removed 'h-full' so this container grows with the massive time grid */}
                <div className="min-w-[700px]">

                    {/* FIX 2: Changed 'bg-muted/60 backdrop-blur-md' to a solid 'bg-card' (or bg-background) to hide scrolling content */}
                    <div className="grid grid-cols-[75px_repeat(7,minmax(0,1fr))] border-b bg-card z-[60] sticky top-0 shadow-md">

                        {/* Notice: this left corner cell needs the same solid background */}
                        <div className="h-10 border-r border-border bg-card sticky left-0 z-[70]" />

                        {weekDates.map((date, dayIdx) => (
                            <div key={dayIdx} className="h-10 flex flex-col items-center justify-center font-bold text-[9px] md:text-[11px] uppercase tracking-widest border-border relative bg-card">
                                <span className={cn(
                                    "px-2 rounded-full",
                                    date.toDateString() === new Date().toDateString() ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground"
                                )}>
                                    {DAYS[dayIdx]}
                                </span>
                                <span className="text-[9px] text-muted-foreground opacity-80 mt-0.5">
                                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-[75px_repeat(7,minmax(0,1fr))]">
                        {Array.from({ length: SLOTS_PER_DAY }).map((_, slotIdx) => {
                            const hour = Math.floor(slotIdx / 2);
                            const min = (slotIdx % 2) * 30;
                            const nextHour = Math.floor((slotIdx + 1) / 2);
                            const nextMin = ((slotIdx + 1) % 2) * 30;

                            const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} - ${nextHour.toString().padStart(2, '0')}:${nextMin.toString().padStart(2, '0')}`;
                            const isHourStart = min === 0;

                            return (
                                <React.Fragment key={slotIdx}>
                                    <div className={cn(
                                        "h-10 border-r border-border flex flex-col items-center justify-center text-[10px] text-muted-foreground bg-accent/10 sticky left-0 z-40 font-mono shadow-sm",
                                        isHourStart ? "border-b border-border/50" : "border-b border-border/20"
                                    )}>
                                        <span className="font-semibold text-[9px] text-muted-foreground/80">{timeStr}</span>
                                    </div>
                                    {DAYS.map((_, dayIdx) => {
                                        const isToday = weekDates[dayIdx].toDateString() === new Date().toDateString();
                                        const content = getCellContent(dayIdx, slotIdx);
                                        const prevContent = slotIdx > 0 ? getCellContent(dayIdx, slotIdx - 1) : null;
                                        const isSameAsPrev = content && prevContent && content.type === prevContent.type && content.name === prevContent.name;

                                        const isInteractive = content && (content.type === 'goal' || content.type === 'custom' || content.type === 'preview' || content.type === 'preview-free');

                                        return (
                                            <div
                                                key={dayIdx}
                                                draggable={!!isInteractive}
                                                onDragStart={(e) => {
                                                    if (content?.type === 'preview' || content?.type === 'preview-free') {
                                                        e.dataTransfer.setData('sourceNewTask', JSON.stringify({
                                                            type: content.type === 'preview-free' ? 'custom' : 'goal',
                                                            name: content.name,
                                                        }));
                                                    } else if (isInteractive) {
                                                        e.dataTransfer.setData('sourceKey', `${dayIdx}-${slotIdx}`);
                                                    } else {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    if (isSleepSlot(slotIdx) || isHabitSlot(dayIdx, slotIdx) || isPlanSlot(dayIdx, slotIdx)) return;

                                                    const targetKey = `${dayIdx}-${slotIdx}`;
                                                    const newState = { ...localGridState };

                                                    const sourceKey = e.dataTransfer.getData('sourceKey');
                                                    if (sourceKey && sourceKey !== targetKey) {
                                                        newState[targetKey] = newState[sourceKey];
                                                        delete newState[sourceKey];
                                                        setLocalGridState(newState);
                                                        return;
                                                    }

                                                    const sourceNewTaskStr = e.dataTransfer.getData('sourceNewTask');
                                                    if (sourceNewTaskStr) {
                                                        newState[targetKey] = JSON.parse(sourceNewTaskStr);
                                                        setLocalGridState(newState);
                                                    }
                                                }}
                                                className={cn(
                                                    "h-10 border-r border-l transition-colors cursor-crosshair text-[9px] leading-tight flex items-center justify-center overflow-hidden text-center p-0.5 md:p-1 font-semibold group relative",
                                                    isHourStart ? "border-b border-border/50" : "border-b border-border/20",
                                                    isToday && "bg-primary/[0.02]",
                                                    isToday && !content && "hover:bg-primary/10",
                                                    isSameAsPrev && (content?.type === 'sleep' || content?.type === 'habit' || content?.type === 'plan') ? "border-t-0" : "",
                                                    content?.type === 'preview' && "bg-blue-500/10 text-blue-800 border-blue-500 border-dashed border-b-2 cursor-pointer animate-pulse ring-1 ring-inset ring-blue-500/50 rounded-sm m-px",
                                                    content?.type === 'preview-free' && "bg-amber-500/10 text-amber-800 border-amber-500 border-dashed border-b-2 cursor-pointer animate-pulse ring-1 ring-inset ring-amber-500/50 rounded-sm m-px",
                                                    content?.type === 'sleep' && "bg-indigo-950/40 text-indigo-300/80 cursor-not-allowed border-indigo-900/30",
                                                    content?.type === 'habit' && "bg-emerald-950/40 text-emerald-400/90 cursor-not-allowed border-emerald-900/30",
                                                    content?.type === 'plan' && "bg-purple-950/40 text-purple-400/90 cursor-not-allowed border-purple-900/30",
                                                    content?.type === 'goal' && "bg-blue-600/90 text-white cursor-grab active:cursor-grabbing shadow-sm m-px rounded hover:brightness-110 border border-blue-500",
                                                    content?.type === 'custom' && "bg-amber-500/80 text-amber-950 cursor-grab active:cursor-grabbing shadow-sm m-px rounded hover:brightness-110 border border-amber-400",
                                                    !content && !isToday && "hover:bg-accent/30 text-transparent",
                                                    !content && isToday && "text-transparent"
                                                )}
                                                style={
                                                    content?.type === 'goal'
                                                        ? { backgroundColor: getGoalColor(content.goalId || content.name), color: '#fff', borderColor: 'transparent' }
                                                        : content?.type === 'custom' && content.color
                                                            ? { backgroundColor: content.color, color: '#fff', borderColor: 'transparent' }
                                                            : {}
                                                }
                                                onClick={() => handleCellClick(dayIdx, slotIdx)}
                                            >
                                                {isToday && (
                                                    <div className="absolute inset-y-0 left-0 w-[2px] bg-primary/20 pointer-events-none" />
                                                )}
                                                {content ? (
                                                    <span className={cn(
                                                        "truncate w-full block",
                                                        (isSameAsPrev && (content.type === 'sleep' || content.type === 'habit' || content.type === 'plan')) && "opacity-0"
                                                    )}>
                                                        {content.name}
                                                    </span>
                                                ) : (
                                                    <span className="opacity-0 group-hover:opacity-100 text-[8px] text-muted-foreground/30 mt-1 transition-opacity">
                                                        Add
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                    </div>

                </div>
            </div>
        </div>
    );
};
