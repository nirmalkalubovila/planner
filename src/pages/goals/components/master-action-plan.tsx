import React from 'react';
import { Goal } from '@/types/global-types';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check, Save, X, Edit3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MasterActionPlanProps {
    goal: Goal;
    onUpdate?: (updatedGoal: Goal) => void;
}

export const MasterActionPlan: React.FC<MasterActionPlanProps> = ({ goal, onUpdate }) => {
    const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
    const [editValues, setEditValues] = React.useState<{ title: string; task: string; desc: string }>({ title: '', task: '', desc: '' });

    if (!goal.plans || goal.plans.length === 0) {
        return (
            <div className="p-6 text-center text-sm text-muted-foreground bg-accent/5">
                No plan generated yet. Edit the goal to run the AI planner.
            </div>
        );
    }

    return (
        <div className="bg-background pt-2 p-0 md:p-4 rounded-b-xl">
            <div className="px-4 md:px-1 py-3 border-b md:border-none flex items-center justify-between">
                <h4 className="text-[10px] md:text-xs font-bold uppercase text-muted-foreground tracking-widest">Master Action Plan</h4>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold py-1 px-2 rounded-md bg-accent text-accent-foreground">{goal.plans.length} Slots</span>
                </div>
            </div>

            <div className="md:mt-1 md:border border-border/50 md:rounded-lg overflow-hidden bg-card/50">
                {/* Desktop Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-accent/30 border-b border-border/50 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    <div className="col-span-3">Target Date</div>
                    <div className="col-span-3 border-l pl-2 border-border/50">Core Task</div>
                    <div className="col-span-5 border-l pl-2 border-border/50">Description</div>
                    <div className="col-span-1 border-l pl-2 border-border/50 text-center">Action</div>
                </div>

                {/* Rows */}
                <div className="flex flex-col mb-4 md:mb-0 divide-y divide-border/50">
                    {(() => {
                        const sortedPlans = goal.plans?.slice().sort((a, b) => a.date.localeCompare(b.date)) || [];
                        let nextFound = false;

                        const startEditing = (idx: number, mTitle: string, task: string, desc: string) => {
                            setEditingIndex(idx);
                            setEditValues({ title: mTitle, task, desc });
                        };

                        const handleSave = (date: string) => {
                            if (!onUpdate) return;

                            const newPlans = [...(goal.plans || [])];
                            const originalIdx = goal.plans?.findIndex(p => p.date === date);
                            if (originalIdx !== undefined && originalIdx !== -1) {
                                newPlans[originalIdx] = {
                                    ...newPlans[originalIdx],
                                    dayTask: editValues.task,
                                    description: editValues.desc
                                };
                            }

                            const newMilestones = [...(goal.milestones || [])];
                            const mIdx = newMilestones.findIndex(m => m.targetDate === date);
                            if (mIdx !== -1) {
                                newMilestones[mIdx] = {
                                    ...newMilestones[mIdx],
                                    title: editValues.title
                                };
                            }

                            onUpdate({
                                ...goal,
                                plans: newPlans,
                                milestones: newMilestones
                            });
                            setEditingIndex(null);
                        };

                        return sortedPlans.map((slot, idx) => {
                            const isEditing = editingIndex === idx;
                            const validDate = slot.date && !isNaN(parseISO(slot.date).getTime()) ? format(parseISO(slot.date), 'MMM d, yyyy') : slot.date;
                            const milestone = goal.milestones?.find(m => m.targetDate === slot.date);
                            const isCompleted = milestone?.completed;
                            const isNext = !isCompleted && !nextFound;
                            if (isNext) nextFound = true;

                            return (
                                <div key={idx} className={cn(
                                    "group grid grid-cols-1 md:grid-cols-12 gap-y-3 md:gap-4 px-4 py-4 md:py-3 hover:bg-accent/40 transition-all items-start relative border-l-2",
                                    isCompleted ? "border-emerald-500/50 bg-emerald-500/5" : isNext ? "border-primary bg-primary/5" : "border-transparent",
                                    isEditing && "bg-accent/60 ring-1 ring-primary/20"
                                )}>
                                    {/* Target Date Column */}
                                    <div className="md:col-span-3 flex flex-col items-start justify-center">
                                        <div className="flex flex-wrap items-center gap-2 mb-0.5 w-full">
                                            {isEditing ? (
                                                <div className="w-full">
                                                    <label className="text-[9px] uppercase font-bold text-primary/70 mb-1 block">Phase Title</label>
                                                    <Input
                                                        value={editValues.title}
                                                        onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                                                        className="h-7 text-xs bg-background"
                                                        placeholder="Phase Title"
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    {milestone && <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{milestone.title}</span>}
                                                    {isCompleted && <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center"><Check size={8} className="text-white" /></div>}
                                                    {isNext && <span className="text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-black animate-pulse uppercase">NEXT STEP</span>}
                                                </>
                                            )}
                                        </div>
                                        {!isEditing && <div className="text-xs font-semibold text-primary">{validDate}</div>}
                                    </div>

                                    {/* Task Column */}
                                    <div className="md:col-span-3 md:border-l md:border-border/50 md:pl-2 flex flex-col gap-1">
                                        {isEditing ? (
                                            <>
                                                <label className="text-[9px] uppercase font-bold text-primary/70 mb-1 block md:hidden">Core Task</label>
                                                <Input
                                                    value={editValues.task}
                                                    onChange={(e) => setEditValues({ ...editValues, task: e.target.value })}
                                                    className="h-7 text-xs bg-background"
                                                />
                                            </>
                                        ) : (
                                            <span className="text-sm font-semibold text-foreground tracking-tight leading-tight">{slot.dayTask}</span>
                                        )}
                                    </div>

                                    {/* Description Column */}
                                    <div className="md:col-span-5 md:border-l md:border-border/50 md:pl-2 flex flex-col gap-1">
                                        {isEditing ? (
                                            <>
                                                <label className="text-[9px] uppercase font-bold text-primary/70 mb-1 block md:hidden">Description</label>
                                                <textarea
                                                    value={editValues.desc}
                                                    onChange={(e) => setEditValues({ ...editValues, desc: e.target.value })}
                                                    className="w-full text-xs bg-background border rounded-md p-2 min-h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                                                />
                                            </>
                                        ) : (
                                            <span className="text-xs text-muted-foreground/80 leading-relaxed md:leading-snug">{slot.description}</span>
                                        )}
                                    </div>

                                    {/* Action Box */}
                                    <div className="md:col-span-1 flex items-center justify-end md:justify-center pt-1 md:pt-0">
                                        {isEditing ? (
                                            <div className="flex gap-1">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500 hover:bg-emerald-500/10" onClick={() => handleSave(slot.date)}>
                                                    <Save size={14} />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => setEditingIndex(null)}>
                                                    <X size={14} />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                                                onClick={() => startEditing(idx, milestone?.title || '', slot.dayTask, slot.description)}
                                            >
                                                <Edit3 size={12} />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>
        </div>
    );
};
