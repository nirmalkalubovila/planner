import React from 'react';
import { Goal } from '@/types/global-types';
import { format, parseISO } from 'date-fns';

interface MasterActionPlanProps {
    goal: Goal;
}

export const MasterActionPlan: React.FC<MasterActionPlanProps> = ({ goal }) => {
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
                <span className="text-[10px] font-bold py-1 px-2 rounded-md bg-accent text-accent-foreground">{goal.plans.length} Slots</span>
            </div>

            <div className="md:mt-1 md:border border-border/50 md:rounded-lg overflow-hidden bg-card/50">
                {/* Desktop Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-accent/30 border-b border-border/50 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    <div className="col-span-3">Target Date</div>
                    <div className="col-span-3 border-l pl-2 border-border/50">Core Task</div>
                    <div className="col-span-6 border-l pl-2 border-border/50">Description</div>
                </div>

                {/* Rows */}
                <div className="flex flex-col mb-4 md:mb-0 divide-y divide-border/50">
                    {goal.plans.slice().sort((a, b) => a.date.localeCompare(b.date)).map((slot, idx) => {
                        const validDate = slot.date && !isNaN(parseISO(slot.date).getTime()) ? format(parseISO(slot.date), 'MMM d, yyyy') : slot.date;
                        const milestone = goal.milestones?.find(m => m.targetDate === slot.date);

                        return (
                            <div key={idx} className="group grid grid-cols-1 md:grid-cols-12 gap-y-2 md:gap-4 px-4 py-4 md:py-3 hover:bg-accent/40 transition-colors items-start relative">
                                {/* Target Date */}
                                <div className="md:col-span-3 flex flex-col items-start justify-center">
                                    {milestone && <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">{milestone.title}</span>}
                                    <div className="text-xs font-semibold text-primary">{validDate}</div>
                                </div>

                                {/* Task */}
                                <div className="md:col-span-3 md:border-l md:border-border/50 md:pl-2 flex items-center">
                                    <span className="text-sm font-semibold text-foreground tracking-tight leading-tight">{slot.dayTask}</span>
                                </div>

                                {/* Description */}
                                <div className="md:col-span-6 md:border-l md:border-border/50 md:pl-2 flex items-start md:items-center mt-1 md:mt-0">
                                    <span className="text-xs text-muted-foreground/80 leading-relaxed md:leading-snug">{slot.description}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
