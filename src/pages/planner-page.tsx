import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Eraser, Target, Sparkles, Save, RotateCcw } from 'lucide-react';
import { useGetWeekPlan, useSaveWeekPlan, useClearWeekPlan } from '@/api/services/planner-service';
import { useGetHabits } from '@/api/services/habit-service';
import { useGetGoals } from '@/api/services/goal-service';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { WeekUtils } from '@/utils/week-utils';
import { cn } from '@/lib/utils';
import { GridState, Goal, Habit } from '@/types/global-types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS_PER_DAY = 48; // 30-min slots for 24 hours

export const PlannerPage: React.FC = () => {
    const [currentWeek, setCurrentWeek] = useState(WeekUtils.getCurrentWeek());
    const [selectedTool, setSelectedTool] = useState<'erase' | 'goal' | 'custom'>('erase');
    const [selectedGoalId, setSelectedGoalId] = useState<string>('');
    const [customEventName, setCustomEventName] = useState('');
    const [localGridState, setLocalGridState] = useState<GridState>({});

    const { data: weekPlan } = useGetWeekPlan(currentWeek);
    const { data: habits } = useGetHabits();
    const { data: goals } = useGetGoals();

    const savePlan = useSaveWeekPlan();
    const clearPlan = useClearWeekPlan();

    useEffect(() => {
        if (weekPlan) {
            setLocalGridState(weekPlan);
        }
    }, [weekPlan]);

    const activeGoal = useMemo(() => (goals || []).find((g: Goal) => g.id === selectedGoalId), [goals, selectedGoalId]);

    const goalStats = useMemo(() => {
        if (!activeGoal) return null;
        const weekIndex = WeekUtils.compareWeeks(currentWeek, activeGoal.startWeek);
        if (weekIndex < 0 || weekIndex >= activeGoal.weeks.length) return null;
        const weekData = activeGoal.weeks[weekIndex];

        // Calculate currently allocated slots for this goal
        let allocatedSlots = 0;
        Object.values(localGridState).forEach(slot => {
            if (slot.type === 'goal' && slot.goalId === selectedGoalId) {
                allocatedSlots++;
            }
        });

        return {
            title: activeGoal.title,
            weekNum: weekIndex + 1,
            targetHours: weekData.hours,
            targetSlots: weekData.hours * 2,
            allocatedSlots,
            subGoal: weekData.subGoal
        };
    }, [activeGoal, currentWeek, localGridState, selectedGoalId]);

    const handleCellClick = (dayIdx: number, slotIdx: number) => {
        const key = `${dayIdx}-${slotIdx}`;

        const isHabit = (habits || []).some((h: Habit) => {
            const [hStartH, hStartM] = h.startTime.split(':').map(Number);
            const [hEndH, hEndM] = h.endTime.split(':').map(Number);
            const startSlot = hStartH * 2 + (hStartM >= 30 ? 1 : 0);
            const endSlot = hEndH * 2 + (hEndM >= 30 ? 1 : 0);

            // Check if habit has started by this week
            const hasStarted = WeekUtils.compareWeeks(currentWeek, h.startDay.substring(0, 7)) >= 0;
            return hasStarted && slotIdx >= startSlot && slotIdx < endSlot;
        });

        if (isHabit) return;

        const newState = { ...localGridState };
        if (selectedTool === 'erase') {
            delete newState[key];
        } else if (selectedTool === 'goal') {
            if (!selectedGoalId) {
                alert("Please select a goal first!");
                return;
            }
            newState[key] = { type: 'goal', name: 'Goal Work', goalId: selectedGoalId };
        } else if (selectedTool === 'custom') {
            newState[key] = { type: 'custom', name: customEventName || 'Event' };
        }
        setLocalGridState(newState);
    };

    const getCellContent = (dayIdx: number, slotIdx: number) => {
        // Priority 1: Habit (Static)
        const habit = (habits || []).find((h: Habit) => {
            const [hStartH, hStartM] = h.startTime.split(':').map(Number);
            const [hEndH, hEndM] = h.endTime.split(':').map(Number);
            const startSlot = hStartH * 2 + (hStartM >= 30 ? 1 : 0);
            const endSlot = hEndH * 2 + (hEndM >= 30 ? 1 : 0);
            const hasStarted = WeekUtils.compareWeeks(currentWeek, h.startDay.substring(0, 7)) >= 0;
            return hasStarted && slotIdx >= startSlot && slotIdx < endSlot;
        });
        if (habit) return { type: 'habit', name: habit.name };

        // Priority 2: Planned Session
        return localGridState[`${dayIdx}-${slotIdx}`];
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setCurrentWeek(WeekUtils.addWeeks(currentWeek, -1))}>
                        <ChevronLeft size={20} />
                    </Button>
                    <div className="text-center min-w-[200px]">
                        <h2 className="text-xl font-bold">{WeekUtils.formatWeekDisplay(currentWeek)}</h2>
                        <p className="text-xs text-muted-foreground">{WeekUtils.formatWeekRange(currentWeek)}</p>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setCurrentWeek(WeekUtils.addWeeks(currentWeek, 1))}>
                        <ChevronRight size={20} />
                    </Button>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => clearPlan.mutate(currentWeek)} className="text-destructive">
                        <RotateCcw size={16} className="mr-2" /> Clear All
                    </Button>
                    <Button onClick={() => savePlan.mutate({ week: currentWeek, state: localGridState })}>
                        <Save size={16} className="mr-2" /> Save Plan
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
                {/* Sidebar Controls */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">1. Select Goal</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <select
                                value={selectedGoalId}
                                onChange={(e) => setSelectedGoalId(e.target.value)}
                                className="w-full bg-background border px-3 py-2 rounded-md text-sm"
                            >
                                <option value="">-- Choose Goal --</option>
                                {(goals || []).map((g: Goal) => (
                                    <option key={g.id} value={g.id}>{g.title}</option>
                                ))}
                            </select>

                            {goalStats && (
                                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span>Target: {goalStats.targetHours}h</span>
                                        <span className={cn(
                                            goalStats.allocatedSlots >= goalStats.targetSlots ? "text-green-500" : "text-yellow-500"
                                        )}>
                                            {goalStats.allocatedSlots * 0.5}h / {goalStats.targetHours}h
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-accent rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-500"
                                            style={{ width: `${Math.min(100, (goalStats.allocatedSlots / goalStats.targetSlots) * 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] italic text-muted-foreground">"{goalStats.subGoal}"</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">2. Paint Tool</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-3 gap-2">
                            <Button
                                variant={selectedTool === 'erase' ? 'default' : 'outline'}
                                className="h-auto flex-col py-3 gap-2"
                                onClick={() => setSelectedTool('erase')}
                            >
                                <Eraser size={20} />
                                <span className="text-[10px]">Erase</span>
                            </Button>
                            <Button
                                variant={selectedTool === 'goal' ? 'default' : 'outline'}
                                className="h-auto flex-col py-3 gap-2"
                                onClick={() => setSelectedTool('goal')}
                            >
                                <Target size={20} />
                                <span className="text-[10px]">Goal</span>
                            </Button>
                            <Button
                                variant={selectedTool === 'custom' ? 'default' : 'outline'}
                                className="h-auto flex-col py-3 gap-2"
                                onClick={() => setSelectedTool('custom')}
                            >
                                <Sparkles size={20} />
                                <span className="text-[10px]">Custom</span>
                            </Button>
                        </CardContent>
                        {selectedTool === 'custom' && (
                            <CardContent className="pt-0">
                                <Input
                                    value={customEventName}
                                    onChange={(e) => setCustomEventName(e.target.value)}
                                    placeholder="Event name..."
                                    className="h-8 text-xs"
                                />
                            </CardContent>
                        )}
                    </Card>
                </div>

                {/* Timetable Grid */}
                <div className="lg:col-span-3 bg-card border rounded-xl shadow-inner overflow-hidden flex flex-col">
                    <div className="grid grid-cols-8 border-b bg-accent/20">
                        <div className="h-10 border-r" />
                        {DAYS.map(day => (
                            <div key={day} className="h-10 flex items-center justify-center font-bold text-xs uppercase tracking-widest">{day}</div>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden">
                        <div className="grid grid-cols-8">
                            {Array.from({ length: SLOTS_PER_DAY }).map((_, slotIdx) => {
                                const hour = Math.floor(slotIdx / 2);
                                const min = (slotIdx % 2) * 30;
                                const timeStr = `${hour}:${min.toString().padStart(2, '0')}`;

                                return (
                                    <React.Fragment key={slotIdx}>
                                        <div className="h-10 border-r border-b flex items-center justify-end pr-2 text-[10px] text-muted-foreground bg-accent/5 sticky left-0 z-10">
                                            {min === 0 ? timeStr : ''}
                                        </div>
                                        {DAYS.map((_, dayIdx) => {
                                            const content = getCellContent(dayIdx, slotIdx);
                                            return (
                                                <div
                                                    key={dayIdx}
                                                    className={cn(
                                                        "h-10 border-r border-b transition-colors cursor-crosshair text-[8px] flex items-center justify-center text-center p-1 font-bold",
                                                        content?.type === 'habit' && "bg-muted/50 text-muted-foreground cursor-not-allowed border-muted/20",
                                                        content?.type === 'goal' && "bg-primary text-primary-foreground",
                                                        content?.type === 'custom' && "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
                                                        !content && "hover:bg-accent/50"
                                                    )}
                                                    onClick={() => handleCellClick(dayIdx, slotIdx)}
                                                >
                                                    {content?.name}
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
        </div>
    );
};
