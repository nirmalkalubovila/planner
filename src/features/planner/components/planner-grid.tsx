import React, { useMemo, useEffect, useRef, useState } from 'react';
import 'drag-drop-touch';
import { cn } from '@/lib/utils';
import { WeekUtils } from '@/utils/week-utils';
import { GridState } from '@/types/global-types';
import { getGoalColor } from '@/utils/color-utils';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReminderItem } from '@/types/global-types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS_PER_DAY = 48;

interface PlannerGridProps {
    currentWeek: string;
    setCurrentWeek: (val: string) => void;
    localGridState: GridState;
    setLocalGridState: (state: GridState) => void;
    isSleepSlot: (slotIdx: number) => boolean;
    getCellContent: (dayIdx: number, slotIdx: number) => any;
    handleCellClick: (dayIdx: number, slotIdx: number) => void;
    selectedTool: string | null;
    onEditReminder?: (reminder: ReminderItem) => void;
}

export const PlannerGrid: React.FC<PlannerGridProps> = ({
    currentWeek,
    setCurrentWeek,
    localGridState,
    setLocalGridState,
    isSleepSlot,
    getCellContent,
    handleCellClick,
    selectedTool,
    onEditReminder
}) => {
    const weekDates = useMemo(() => WeekUtils.getDaysForWeek(currentWeek), [currentWeek]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isTimeColumnVisible, setIsTimeColumnVisible] = useState(true);

    const remindersByCell = useMemo(() => {
        const map = new Map<string, ReminderItem[]>();
        const list = (localGridState.reminders || []) as ReminderItem[];
        list.forEach(r => {
            const [h, m] = r.time.split(':').map(Number);
            const sIdx = h * 2 + (m >= 30 ? 1 : 0);
            const key = `${r.dayIdx}-${sIdx}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(r);
        });
        return map;
    }, [localGridState.reminders]);

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
        <div className="flex-1 bg-card overflow-hidden flex flex-col h-full min-h-[400px]">
            {/* Week Navigation - always visible above the scrollable grid */}
            <div className="flex-none flex items-center justify-center py-1 sm:py-1.5 bg-card border-b border-border/50 z-[65]">
                <div className="flex items-center gap-0.5 sm:gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg hover:bg-muted/50 text-muted-foreground" onClick={() => setCurrentWeek(WeekUtils.addWeeks(currentWeek, -1))}>
                        <ChevronLeft size={16} />
                    </Button>
                    <span className="text-[11px] sm:text-xs font-bold px-2 sm:px-3 min-w-[100px] sm:min-w-[130px] text-center tracking-wider text-foreground/70">
                        {WeekUtils.formatWeekDisplay(currentWeek)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg hover:bg-muted/50 text-muted-foreground" onClick={() => setCurrentWeek(WeekUtils.addWeeks(currentWeek, 1))}>
                        <ChevronRight size={16} />
                    </Button>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-auto custom-scrollbar">

                {/* FIX 1: Removed 'h-full' so this container grows with the massive time grid */}
                <div className="min-w-[700px]">

                    {/* Day header row */}
                    <div className={cn(
                        "grid border-b bg-card z-[60] sticky top-0 shadow-md transition-all duration-300",
                        isTimeColumnVisible ? "grid-cols-[45px_repeat(7,minmax(0,1fr))]" : "grid-cols-[0px_repeat(7,minmax(0,1fr))]"
                    )}>
                        {/* Eye toggle - stays in flow with w-0 when hidden to keep Monday in its correct column */}
                        <div 
                            className={cn(
                                "h-10 sticky left-0 z-[75] flex items-center justify-center cursor-pointer transition-all duration-300 group border-border overflow-visible",
                                isTimeColumnVisible ? "w-[45px] bg-background border-r border-b shadow-lg" : "w-0"
                            )}
                            onClick={() => setIsTimeColumnVisible(!isTimeColumnVisible)}
                            title={isTimeColumnVisible ? "Hide time column" : "Show time column"}
                        >
                            <div className={cn(
                                "flex items-center justify-center transition-all duration-300",
                                !isTimeColumnVisible ? "absolute left-0 w-8 h-10 bg-background/80 backdrop-blur-md rounded-br-lg border-r border-b border-border shadow-2xl" : "w-full h-full"
                            )}>
                                {isTimeColumnVisible ? (
                                    <EyeOff size={10} className="text-muted-foreground group-hover:text-foreground" />
                                ) : (
                                    <Eye size={10} className="text-muted-foreground group-hover:text-foreground" />
                                )}
                            </div>
                        </div>

                        {weekDates.map((date, dayIdx) => (
                            <div key={dayIdx} className="h-10 flex flex-col items-center justify-center font-bold text-[9px] md:text-[11px] uppercase tracking-widest border-r border-border relative bg-card">
                                <span className={cn(
                                    "px-2 rounded-lg",
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

                    <div className={cn(
                        "grid transition-all duration-300",
                        isTimeColumnVisible ? "grid-cols-[45px_repeat(7,minmax(0,1fr))]" : "grid-cols-[0px_repeat(7,minmax(0,1fr))]"
                    )}>
                        {Array.from({ length: SLOTS_PER_DAY }).map((_, slotIdx) => {
                            const hour = Math.floor(slotIdx / 2);
                            const min = (slotIdx % 2) * 30;
                            const nextHour = Math.floor((slotIdx + 1) / 2);
                            const nextMin = ((slotIdx + 1) % 2) * 30;

                            const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                            const isHourStart = min === 0;

                            return (
                                <React.Fragment key={slotIdx}>
                                    <div 
                                        className={cn(
                                            "h-10 flex flex-col items-center justify-center text-[10px] text-muted-foreground transition-all duration-300 select-none z-[50] font-mono",
                                            isTimeColumnVisible ? "w-[45px] bg-background border-r border-border sticky left-0 opacity-100 shadow-lg" : "w-0 opacity-0 pointer-events-none",
                                            isTimeColumnVisible && (isHourStart ? "border-b border-border" : "border-b border-border/50"),
                                        )}
                                    >
                                        <span className={cn(
                                            "font-semibold text-[9px] text-muted-foreground whitespace-nowrap transition-opacity duration-200",
                                            isTimeColumnVisible ? "opacity-100" : "opacity-0"
                                        )}>{timeStr}</span>
                                    </div>
                                    {DAYS.map((_, dayIdx) => {
                                        const isToday = weekDates[dayIdx].toDateString() === new Date().toDateString();
                                        const content = getCellContent(dayIdx, slotIdx);
                                        const prevContent = slotIdx > 0 ? getCellContent(dayIdx, slotIdx - 1) : null;
                                        const isSameAsPrev = content && prevContent && content.type === prevContent.type && content.name === prevContent.name;

                                        const isInteractive = content && (content.type === 'goal' || content.type === 'custom' || content.type === 'habit' || content.type === 'preview' || content.type === 'preview-free');
                                        const cellReminders = remindersByCell.get(`${dayIdx}-${slotIdx}`) || [];

                                        return (
                                            <div
                                                key={dayIdx}
                                                draggable={!!(isInteractive && selectedTool === 'drag')}
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
                                                    if (isSleepSlot(slotIdx)) return;

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
                                                    "h-10 transition-colors cursor-crosshair text-[9px] leading-tight flex items-center justify-center text-center p-0.5 md:p-1 font-semibold group relative border-b border-r border-border",
                                                    isToday && "bg-primary/[0.02]",
                                                    isToday && !content && "hover:bg-primary/10",
                                                    content && !isSameAsPrev && "border-t border-border z-[11]",
                                                    content?.type === 'preview' && "bg-blue-500/10 text-blue-800 border-blue-500 border-dashed border-b-2 cursor-pointer animate-pulse ring-1 ring-inset ring-blue-500/50 rounded-lg m-px z-20",
                                                    content?.type === 'preview-free' && "bg-amber-500/10 text-amber-800 border-amber-500 border-dashed border-b-2 cursor-pointer animate-pulse ring-1 ring-inset ring-amber-500/50 rounded-lg m-px z-20",
                                                    content?.type === 'sleep' && "bg-indigo-950 text-indigo-300/80 cursor-not-allowed z-10",
                                                    content?.type === 'plan' && "bg-sky-950 text-sky-300/90 cursor-not-allowed z-10",
                                                    content?.type === 'goal' && "bg-blue-600 text-white cursor-grab active:cursor-grabbing hover:brightness-110 z-10",
                                                    content?.type === 'custom' && "bg-amber-500 text-amber-950 cursor-grab active:cursor-grabbing hover:brightness-110 z-10",
                                                    content?.type === 'habit' && "bg-emerald-950 text-emerald-400/90 cursor-grab active:cursor-grabbing hover:brightness-110 z-10",
                                                    !content && !isToday && "hover:bg-accent/30 text-transparent",
                                                    !content && isToday && "text-transparent",
                                                    (isInteractive && selectedTool === 'drag') && "touch-action-none"
                                                )}
                                                style={
                                                    content?.type === 'goal'
                                                        ? { backgroundColor: getGoalColor(content.goalId || content.name), color: '#fff' }
                                                        : content?.type === 'custom' && content.color
                                                            ? { backgroundColor: content.color, color: '#fff' }
                                                            : {}
                                                }
                                                onClick={() => handleCellClick(dayIdx, slotIdx)}
                                            >
                                                {isToday && (
                                                    <div className="absolute inset-y-0 left-0 w-[2px] bg-primary/20 pointer-events-none" />
                                                )}
                                                {cellReminders.map(reminder => {
                                                    const [h, m] = reminder.time.split(':').map(Number);
                                                    const slotMins = m % 30;
                                                    const percent = slotMins / 30;
                                                    return (
                                                        <div
                                                            key={reminder.id}
                                                            className="absolute left-0 right-0 z-30 flex items-center group/reminder cursor-pointer pointer-events-auto"
                                                            style={{ top: `calc(${percent * 100}% - 9px)` }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onEditReminder) onEditReminder(reminder);
                                                            }}
                                                        >
                                                            <div className="w-full border-t-2 border-rose-500 relative flex items-center">
                                                                <div className="absolute -left-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform">
                                                                    <Bell size={6} className="animate-bounce" />
                                                                </div>
                                                                <span className="absolute left-3.5 bg-rose-950/90 text-rose-200 border border-rose-500/30 px-1 py-0.5 rounded-[4px] text-[7px] font-black uppercase tracking-wider whitespace-nowrap shadow-lg backdrop-blur-sm pointer-events-none max-w-[80px] truncate z-40 opacity-90 group-hover/reminder:opacity-100 transition-opacity">
                                                                    {reminder.time} - {reminder.name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {content ? (
                                                    <span className={cn(
                                                        "truncate w-full block",
                                                        (isSameAsPrev && content) && "opacity-0"
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
