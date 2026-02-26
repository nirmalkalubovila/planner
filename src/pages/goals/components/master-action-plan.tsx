import React, { useState } from 'react';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { Goal, AIGeneratedPlanSlot } from '@/types/global-types';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check, Save, X, Edit3, ChevronRight, ChevronDown, BrainCircuit, Loader2, UserCog, Trash2, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

interface MasterActionPlanProps {
    goal: Goal;
    onUpdate?: (updatedGoal: Goal) => void;
}

function getExpansionInfo(goalType: string, depth: number) {
    if (goalType === 'Year') {
        if (depth === 0) return { type: 'Months', count: 12 };
        if (depth === 1) return { type: 'Weeks', count: 4 };
    }
    if (goalType === 'Month') {
        if (depth === 0) return { type: 'Weeks', count: 4 };
    }
    return null;
}

const deepUpdateSubPlans = (plans: AIGeneratedPlanSlot[], searchPath: number[], newSubPlans?: AIGeneratedPlanSlot[]): AIGeneratedPlanSlot[] => {
    const clone = JSON.parse(JSON.stringify(plans));
    let current = clone;
    for (let i = 0; i < searchPath.length - 1; i++) {
        if (!current[searchPath[i]].subPlans) current[searchPath[i]].subPlans = [];
        current = current[searchPath[i]].subPlans;
    }
    if (newSubPlans === undefined) {
        delete current[searchPath[searchPath.length - 1]].subPlans;
    } else {
        current[searchPath[searchPath.length - 1]].subPlans = newSubPlans;
    }
    return clone;
};

const deepEditSlot = (plans: AIGeneratedPlanSlot[], searchPath: number[], edits: { title: string, task: string, desc: string }): AIGeneratedPlanSlot[] => {
    const clone = JSON.parse(JSON.stringify(plans));
    let current = clone;
    for (let i = 0; i < searchPath.length - 1; i++) {
        if (!current[searchPath[i]].subPlans) current[searchPath[i]].subPlans = [];
        current = current[searchPath[i]].subPlans;
    }
    const idx = searchPath[searchPath.length - 1];
    current[idx].dayTask = edits.task;
    current[idx].description = edits.desc;
    // We only modify the date field if it was a manual stub, but for now we keep dates as is or rely on top level milestones
    return clone;
};

const PlanRow = ({
    slot, path, depth, goal, isNext, isCompleted, milestoneTitle, onUpdateSubPlans, onSaveEdit, user
}: {
    slot: AIGeneratedPlanSlot, path: number[], depth: number, goal: Goal, isNext: boolean, isCompleted: boolean, milestoneTitle?: string,
    onUpdateSubPlans: (path: number[], subPlans: AIGeneratedPlanSlot[] | undefined) => void,
    onSaveEdit: (path: number[], edits: { title: string, task: string, desc: string }, date: string) => void,
    user: any
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({ title: milestoneTitle || '', task: slot.dayTask, desc: slot.description });
    const [expanded, setExpanded] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const expInfo = getExpansionInfo(goal.goalType, depth);
    const hasExpandable = !!expInfo;
    const hasSubPlans = slot.subPlans && slot.subPlans.length > 0;

    const validDate = slot.date && !isNaN(parseISO(slot.date).getTime()) ? format(parseISO(slot.date), 'MMM d, yyyy') : slot.date;

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            if (!expInfo) return;
            const parentLevelTasks = goal.plans?.map(p => p.dayTask).join(', ') || '';

            const isWeekLevel = expInfo.type === 'Weeks';

            const prompt = `
Generate a detailed hierarchical action plan breakdown for the following phase of the overall goal.
Goal Name: ${goal.name}
Goal Purpose: ${goal.purpose}
Goal Start Date: ${goal.startDate}
Phase Target Task: ${slot.dayTask}
Phase Strategy/Description: ${slot.description}
Phase Timeline Date/Range: ${slot.date}
System Current Date: ${format(new Date(), 'MMMM d, yyyy')}

User Preferences: Focus Ability: ${user?.user_metadata?.focusAbility || 'normal'}, Task Shifting: ${user?.user_metadata?.taskShiftingAbility || 'normal'}

Context - The surrounding sibling phases in the overall plan are: ${parentLevelTasks}. Ensure this new breakdown strictly stays within the current phase's boundaries.

Please break this specific phase down into EXACTLY ${expInfo.count} sequential sub-milestones (representing ${expInfo.type}).

TIMELINE SYNC CRITICAL: You must use the "System Current Date" as your reality baseline. 
${isWeekLevel ? "CRITICAL: You are generating a Weekly plan. You MUST include real-world date ranges (e.g., Jan 1 - Jan 7, 2026) for each week based on the goal's start date, this phase's timeline, and the System Current Date. You MUST also include an 'estimatedHours' integer field representing realistic hours to complete that week's core task." : "CRITICAL: You MUST include real-world date ranges or specific month names (e.g., January 2027) based on the goal's start date and this phase, anchored by the System Current Date."}

Return ONLY a JSON array with exactly ${expInfo.count} objects.
Each object must have these exact keys:
{
  "date": "string - real world date range or month (e.g., 'May 1 - May 7' or 'May 2027')",
  "dayTask": "string - short clear title of this sub-milestone",
  "description": "string - 1 to 2 sentences describing the focus and strategy for this specific period."${isWeekLevel ? ',\n  "estimatedHours": number - realistic estimated hours (e.g. 5)' : ''}
}
NO MARKDOWN. RAW JSON ONLY.
`;
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const response = await fetch(`https://openrouter.ai/api/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Legacy Life Builder Planner'
                },
                body: JSON.stringify({
                    model: "arcee-ai/trinity-large-preview:free",
                    messages: [{ role: "user", content: prompt }]
                })
            });

            const rawResult = await response.json();
            if (!response.ok || !rawResult.choices?.[0]?.message?.content) {
                throw new Error(rawResult.error?.message || "AI response error");
            }

            let cleanJson = rawResult.choices[0].message.content.replace(/^```json\n?/gm, '').replace(/```$/gm, '').trim();
            cleanJson = cleanJson.replace(/^```\n?/gm, '').replace(/```$/gm, '').trim();

            const subPlans: AIGeneratedPlanSlot[] = JSON.parse(cleanJson);
            onUpdateSubPlans(path, subPlans);
            setExpanded(true);
            toast.success("Sub-plan generated!");
        } catch (e: any) {
            toast.error("Failed to generate sub-plan: " + e.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleManualGen = () => {
        if (!expInfo) return;
        const emptySubPlans = Array.from({ length: expInfo.count }).map((_, i) => ({
            date: `${expInfo.type.slice(0, -1)} ${i + 1}`,
            dayTask: 'Draft Task',
            description: 'Edit this sub-milestone manually.'
        }));
        onUpdateSubPlans(path, emptySubPlans);
        setExpanded(true);
        toast.success("Manual sub-plan template ready.");
    };

    const handleSave = () => {
        onSaveEdit(path, editValues, slot.date);
        setIsEditing(false);
    };

    return (
        <div className={cn("flex flex-col", depth > 0 && " border-t border-border/30 bg-muted/5")}>
            <div className={cn(
                "group grid grid-cols-1 md:grid-cols-12 gap-y-3 md:gap-4 px-4 py-4 md:py-3 hover:bg-accent/40 transition-all items-start relative border-l-2",
                isCompleted ? "border-emerald-500/50 bg-emerald-500/5" : isNext ? "border-primary bg-primary/5" : "border-transparent",
                isEditing && "bg-accent/60 ring-1 ring-primary/20",
                depth > 0 && "ml-4 md:ml-6 border-l-border/50"
            )}>
                {/* Expand / Date Column */}
                <div className="md:col-span-3 flex flex-col items-start justify-center">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5 w-full">
                        {hasExpandable && (
                            <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-accent transition-colors absolute -left-3.5 bg-background border shadow-sm">
                                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        )}
                        {isEditing ? (
                            <div className="w-full pl-2">
                                {depth === 0 && <label className="text-[9px] uppercase font-bold text-primary/70 mb-1 block">Phase Title</label>}
                                {depth === 0 && (
                                    <Input
                                        value={editValues.title}
                                        onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                                        className="h-7 text-xs bg-background mb-1"
                                        placeholder="Phase Title"
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="pl-2 flex items-center gap-2">
                                {milestoneTitle && <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{milestoneTitle}</span>}
                                {isCompleted && <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center"><Check size={8} className="text-white" /></div>}
                                {isNext && <span className="text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-black animate-pulse uppercase">NEXT STEP</span>}
                            </div>
                        )}
                    </div>
                    {!isEditing && <div className="text-xs font-semibold text-primary pl-2">{validDate}</div>}
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
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-foreground tracking-tight leading-tight">{slot.dayTask}</span>
                            {slot.estimatedHours && (
                                <span className="text-[10px] text-muted-foreground flex items-center font-medium bg-secondary/50 self-start px-1.5 py-0.5 rounded-md">
                                    <Clock size={10} className="mr-1" /> Est: {slot.estimatedHours}h
                                </span>
                            )}
                        </div>
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
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500 hover:bg-emerald-500/10" onClick={handleSave}>
                                <Save size={14} />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => setIsEditing(false)}>
                                <X size={14} />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn("h-7 w-7 transition-opacity text-muted-foreground hover:text-primary", expanded || hasSubPlans ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
                            onClick={() => setIsEditing(true)}
                        >
                            <Edit3 size={12} />
                        </Button>
                    )}
                </div>
            </div>

            {/* Recursion / Expansion Area */}
            {expanded && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                    {!hasSubPlans ? (
                        <div className="p-4 bg-accent/20 border-b flex flex-col items-center justify-center space-y-4 ml-6 mr-4 rounded-xl mb-3 shadow-inner">
                            <p className="text-xs font-semibold text-muted-foreground text-center">Detailed {expInfo?.type} breakdown for this phase hasn't been created yet.</p>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <Button size="sm" onClick={handleGenerate} disabled={generating} className="bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground border-transparent shadow-none">
                                    {generating ? <Loader2 className="animate-spin mr-2" size={14} /> : <BrainCircuit className="mr-2" size={14} />}
                                    Auto Generate with AI
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleManualGen} disabled={generating}>
                                    <UserCog className="mr-2" size={14} />
                                    Draft Manually
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col border-l-2 border-border/50 ml-6 mr-4 mb-2 rounded-bl-lg">
                            <div className="flex justify-end pt-2 pr-2">
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteConfirm(true)}>
                                    <Trash2 size={12} className="mr-1" /> Delete {expInfo?.type} Breakdown
                                </Button>
                            </div>

                            <ConfirmationDialog
                                isOpen={showDeleteConfirm}
                                onClose={() => setShowDeleteConfirm(false)}
                                onConfirm={() => {
                                    onUpdateSubPlans(path, undefined);
                                    setShowDeleteConfirm(false);
                                }}
                                title={`Delete ${expInfo?.type} Breakdown`}
                                description={`Are you sure you want to delete this ${expInfo?.type} breakdown? This action cannot be undone.`}
                                confirmText="Delete Breakdown"
                                variant="destructive"
                            />

                            {slot.subPlans?.map((subSlot, idx) => (
                                <PlanRow
                                    key={idx}
                                    slot={subSlot}
                                    path={[...path, idx]}
                                    depth={depth + 1}
                                    goal={goal}
                                    isNext={false}
                                    isCompleted={false}
                                    onUpdateSubPlans={onUpdateSubPlans}
                                    onSaveEdit={onSaveEdit}
                                    user={user}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const MasterActionPlan: React.FC<MasterActionPlanProps> = ({ goal, onUpdate }) => {
    const { user } = useAuth();

    if (!goal.plans || goal.plans.length === 0) {
        return (
            <div className="p-6 text-center text-sm text-muted-foreground bg-accent/5">
                No plan generated yet. Edit the goal to run the AI planner.
            </div>
        );
    }

    const sortedPlans = goal.plans?.slice().sort((a, b) => a.date.localeCompare(b.date)) || [];
    let nextFound = false;

    const handleUpdateSubPlans = (path: number[], subPlans: AIGeneratedPlanSlot[] | undefined) => {
        if (!onUpdate) return;
        const newPlans = deepUpdateSubPlans(sortedPlans, path, subPlans);
        onUpdate({ ...goal, plans: newPlans });
    };

    const handleSaveEdit = (path: number[], edits: { title: string, task: string, desc: string }, date: string) => {
        if (!onUpdate) return;

        const newPlans = deepEditSlot(sortedPlans, path, edits);
        let newMilestones = goal.milestones;

        if (path.length === 1 && goal.milestones) {
            newMilestones = [...goal.milestones];
            const mIdx = newMilestones.findIndex(m => m.targetDate === date);
            if (mIdx !== -1) {
                newMilestones[mIdx] = { ...newMilestones[mIdx], title: edits.title };
            }
        }

        onUpdate({ ...goal, plans: newPlans, milestones: newMilestones });
    };

    return (
        <div className="bg-background pt-2 p-0 md:p-4 rounded-b-xl">
            <div className="px-4 md:px-1 py-3 border-b md:border-none flex items-center justify-between">
                <h4 className="text-[10px] md:text-xs font-bold uppercase text-muted-foreground tracking-widest">Master Action Plan Hierarchy</h4>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold py-1 px-2 rounded-md bg-accent text-accent-foreground">{goal.plans.length} Target Milestones</span>
                </div>
            </div>

            <div className="md:mt-1 md:border border-border/50 md:rounded-lg overflow-hidden bg-card/50">
                {/* Desktop Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-accent/30 border-b border-border/50 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    <div className="col-span-3">Target Date</div>
                    <div className="col-span-3 border-l pl-2 border-border/50">Core Task & Strategies</div>
                    <div className="col-span-5 border-l pl-2 border-border/50">Detailed Narrative</div>
                    <div className="col-span-1 border-l pl-2 border-border/50 text-center">Action</div>
                </div>

                {/* Recursive Rows */}
                <div className="flex flex-col mb-4 md:mb-0 divide-y divide-border/50">
                    {sortedPlans.map((slot, idx) => {
                        const milestone = goal.milestones?.find(m => m.targetDate === slot.date);
                        const isCompleted = milestone?.completed;
                        const isNext = !isCompleted && !nextFound;
                        if (isNext) nextFound = true;

                        return (
                            <PlanRow
                                key={idx}
                                slot={slot}
                                path={[idx]}
                                depth={0}
                                goal={goal}
                                isNext={isNext!}
                                isCompleted={isCompleted!}
                                milestoneTitle={milestone?.title}
                                onUpdateSubPlans={handleUpdateSubPlans}
                                onSaveEdit={handleSaveEdit}
                                user={user}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

