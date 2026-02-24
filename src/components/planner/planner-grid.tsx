import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { WeekUtils } from '@/utils/week-utils';
import { GridState } from '@/types/global-types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS_PER_DAY = 48;

interface PlannerGridProps {
    currentWeek: string;
    localGridState: GridState;
    setLocalGridState: (state: GridState) => void;
    previewPlan: any[] | null;
    setPreviewPlan: (val: any[] | null) => void;
    commitPreviewPlan: () => void;
    isSleepSlot: (slotIdx: number) => boolean;
    isHabitSlot: (dayIdx: number, slotIdx: number) => boolean;
    getCellContent: (dayIdx: number, slotIdx: number) => any;
    handleCellClick: (dayIdx: number, slotIdx: number) => void;
}

export const PlannerGrid: React.FC<PlannerGridProps> = ({
    currentWeek,
    localGridState,
    setLocalGridState,
    previewPlan,
    setPreviewPlan,
    commitPreviewPlan,
    isSleepSlot,
    isHabitSlot,
    getCellContent,
    handleCellClick
}) => {
    const weekDates = useMemo(() => WeekUtils.getDaysForWeek(currentWeek), [currentWeek]);

    return (
        <div className="flex-1 bg-card border rounded-xl shadow-inner overflow-hidden flex flex-col h-[60vh] lg:h-auto min-h-[400px]">
            <div className="flex-1 overflow-auto">
                <div className="min-w-[700px] h-full">

                    {previewPlan && (
                        <div className="bg-blue-500/10 border border-blue-500/50 p-2 m-2 mx-4 rounded-lg flex items-center justify-between sticky left-4 animate-in fade-in z-30 shadow-md">
                            <div>
                                <h3 className="font-bold text-blue-700 text-sm">AI Weekly Plan Generated!</h3>
                                <p className="text-xs text-blue-600/80">Review the dashed blue slots. Keep schedule?</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setPreviewPlan(null)}>Discard</Button>
                                <Button size="sm" onClick={commitPreviewPlan} className="bg-blue-600 hover:bg-blue-700 text-white shadow">Accept Plan</Button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-[75px_repeat(7,minmax(0,1fr))] border-b bg-muted/30 backdrop-blur z-20 sticky top-0 shadow-sm">
                        <div className="h-10 border-r border-border" />
                        {weekDates.map((date, dayIdx) => (
                            <div key={dayIdx} className="h-10 flex flex-col items-center justify-center font-bold text-[9px] md:text-[11px] uppercase tracking-widest border-border">
                                <span className={cn(
                                    "px-2 rounded-full",
                                    date.toDateString() === new Date().toDateString() ? "bg-primary text-primary-foreground" : "text-foreground"
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
                                        "h-10 border-r border-border flex flex-col items-center justify-center text-[10px] text-muted-foreground bg-accent/5 sticky left-0 z-10 font-mono",
                                        isHourStart ? "border-b border-border/50" : "border-b border-border/20"
                                    )}>
                                        <span className="font-semibold text-[9px] text-muted-foreground/80">{timeStr}</span>
                                    </div>
                                    {DAYS.map((_, dayIdx) => {
                                        const content = getCellContent(dayIdx, slotIdx);
                                        const prevContent = slotIdx > 0 ? getCellContent(dayIdx, slotIdx - 1) : null;
                                        const isSameAsPrev = content && prevContent && content.type === prevContent.type && content.name === prevContent.name;

                                        // For goals, we might want to check goalId if available, but checking name is usually enough

                                        const isInteractive = content && (content.type === 'goal' || content.type === 'custom');

                                        return (
                                            <div
                                                key={dayIdx}
                                                draggable={!!isInteractive}
                                                onDragStart={(e) => {
                                                    if (isInteractive) {
                                                        e.dataTransfer.setData('sourceKey', `${dayIdx}-${slotIdx}`);
                                                    } else {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    if (isSleepSlot(slotIdx) || isHabitSlot(dayIdx, slotIdx)) return;

                                                    const targetKey = `${dayIdx}-${slotIdx}`;
                                                    const newState = { ...localGridState };

                                                    const sourceKey = e.dataTransfer.getData('sourceKey');
                                                    if (sourceKey && sourceKey !== targetKey) {
                                                        // Move existing slot
                                                        newState[targetKey] = newState[sourceKey];
                                                        delete newState[sourceKey];
                                                        setLocalGridState(newState);
                                                        return;
                                                    }

                                                    const sourceNewTaskStr = e.dataTransfer.getData('sourceNewTask');
                                                    if (sourceNewTaskStr) {
                                                        // Drop new task from sidebar/toolbar
                                                        newState[targetKey] = JSON.parse(sourceNewTaskStr);
                                                        setLocalGridState(newState);
                                                    }
                                                }}
                                                className={cn(
                                                    "h-10 border-r transition-colors cursor-crosshair text-[9px] leading-tight flex items-center justify-center overflow-hidden text-center p-0.5 md:p-1 font-semibold group",
                                                    isHourStart ? "border-b border-border/50" : "border-b border-border/20",
                                                    isSameAsPrev && content?.type === 'sleep' ? "border-t-0" : "",
                                                    content?.type === 'preview' && "bg-blue-500/10 text-blue-800 border-blue-500 border-dashed border-b-2 cursor-pointer animate-pulse ring-1 ring-inset ring-blue-500/50 rounded-sm m-px",
                                                    content?.type === 'sleep' && "bg-indigo-950/40 text-indigo-300/80 cursor-not-allowed border-indigo-900/30",
                                                    content?.type === 'habit' && "bg-emerald-950/40 text-emerald-400/90 cursor-not-allowed border-emerald-900/30",
                                                    content?.type === 'goal' && "bg-blue-600/90 text-white cursor-grab active:cursor-grabbing shadow-sm m-px rounded hover:brightness-110 border border-blue-500",
                                                    content?.type === 'custom' && "bg-amber-500/80 text-amber-950 cursor-grab active:cursor-grabbing shadow-sm m-px rounded hover:brightness-110 border border-amber-400",
                                                    !content && "hover:bg-accent/30 text-transparent"
                                                )}
                                                onClick={() => handleCellClick(dayIdx, slotIdx)}
                                            >
                                                {content ? (
                                                    <span className={cn(
                                                        "truncate w-full block",
                                                        (isSameAsPrev && (content.type === 'sleep' || content.type === 'habit')) && "opacity-0"
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
