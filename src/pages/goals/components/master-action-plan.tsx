import React, { useState } from 'react';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { Goal, AIGeneratedPlanSlot } from '@/types/global-types';
import { format, parseISO, addDays, addMonths, differenceInCalendarDays, min as minDate, parse as dateParse } from 'date-fns';
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

function getExpansionType(goalType: string, depth: number): 'Months' | 'Weeks' | null {
    if (goalType === 'Year') {
        if (depth === 0) return 'Months';
        if (depth === 1) return 'Weeks';
    }
    if (goalType === 'Month') {
        if (depth === 0) return 'Weeks';
    }
    return null;
}

function getWeekRanges(periodStart: Date, periodEnd: Date): { start: Date; end: Date; label: string }[] {
    const totalDays = differenceInCalendarDays(periodEnd, periodStart);
    if (totalDays <= 0) return [];
    const weeks: { start: Date; end: Date; label: string }[] = [];
    let cursor = periodStart;
    while (differenceInCalendarDays(periodEnd, cursor) > 0) {
        const weekEnd = minDate([addDays(cursor, 6), addDays(periodEnd, -1)]);
        weeks.push({
            start: cursor,
            end: weekEnd,
            label: `${format(cursor, 'MMMM d')} - ${format(weekEnd, 'MMMM d')}`,
        });
        cursor = addDays(weekEnd, 1);
    }
    return weeks;
}

/**
 * Compute real calendar month ranges that tile perfectly between periodStart and periodEnd.
 * Each month advances by the same day-of-month as the period start.
 */
function getMonthRanges(periodStart: Date, periodEnd: Date): { start: Date; end: Date; label: string }[] {
    const months: { start: Date; end: Date; label: string }[] = [];
    let cursor = new Date(periodStart);
    while (differenceInCalendarDays(periodEnd, cursor) > 0) {
        const nextMonth = addMonths(cursor, 1);
        const monthEnd = minDate([nextMonth, periodEnd]);
        if (differenceInCalendarDays(monthEnd, cursor) > 0) {
            months.push({
                start: new Date(cursor),
                end: new Date(monthEnd),
                label: format(cursor, 'MMMM yyyy'),
            });
        }
        cursor = nextMonth;
    }
    return months;
}


function getPeriodStartForSlot(goal: Goal, slotDate: string): Date {
    const sortedMilestones = (goal.milestones || []).slice().sort((a, b) => a.targetDate.localeCompare(b.targetDate));
    const milestoneIdx = sortedMilestones.findIndex(m => m.targetDate === slotDate);
    if (milestoneIdx <= 0) {
        return parseISO(goal.startDate);
    }
    return parseISO(sortedMilestones[milestoneIdx - 1].targetDate);
}

/**
 * Try to parse a date string in multiple formats:
 * - ISO (YYYY-MM-DD)
 * - Month Year (e.g., "March 2027")
 * - Month Day - Month Day range (returns the start date)
 */
function tryParseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const iso = parseISO(dateStr);
    if (!isNaN(iso.getTime())) return iso;
    try {
        const d = dateParse(dateStr, 'MMMM yyyy', new Date());
        if (!isNaN(d.getTime())) return d;
    } catch { /* ignore */ }
    try {
        const d = dateParse(dateStr, 'MMM yyyy', new Date());
        if (!isNaN(d.getTime())) return d;
    } catch { /* ignore */ }
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
    return clone;
};

// ─── Sub‑plan item row (week / month) ───────────────────────────────────────
const SubPlanRow = ({
    slot, path, depth, goal, onUpdateSubPlans, onSaveEdit, user
}: {
    slot: AIGeneratedPlanSlot; path: number[]; depth: number; goal: Goal;
    onUpdateSubPlans: (p: number[], sp: AIGeneratedPlanSlot[] | undefined) => void;
    onSaveEdit: (p: number[], e: { title: string; task: string; desc: string }, d: string) => void;
    user: any;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({ title: '', task: slot.dayTask, desc: slot.description });
    const validDate = slot.date && !isNaN(parseISO(slot.date).getTime()) ? format(parseISO(slot.date), 'MMM d, yyyy') : slot.date;

    // For Year goals: months (depth 1 sub‑plans) can further expand to weeks
    const deeperType = getExpansionType(goal.goalType, depth + 1);

    // Compute period dates for nested week breakdowns (e.g. weeks inside a month for Year goals)
    let nestedPeriodStart: Date | undefined;
    let nestedPeriodEnd: Date | undefined;
    if (deeperType === 'Weeks') {
        const parsed = tryParseDate(slot.date);
        if (parsed) {
            nestedPeriodStart = parsed;
            nestedPeriodEnd = addMonths(parsed, 1);
        }
    }

    return (
        <div className="flex flex-col">
            <div className={cn(
                "group grid grid-cols-1 md:grid-cols-12 gap-y-2 md:gap-4 px-4 py-3 hover:bg-accent/40 transition-all items-start",
                isEditing && "bg-accent/60 ring-1 ring-primary/20"
            )}>
                <div className="md:col-span-3 flex items-center gap-2 pl-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", depth === 0 ? "bg-violet-500" : "bg-cyan-500")} />
                    <span className={cn("text-xs font-semibold", depth === 0 ? "text-violet-400" : "text-cyan-400")}>{validDate}</span>
                </div>
                <div className="md:col-span-3 md:border-l md:border-border/50 md:pl-2 flex flex-col gap-1">
                    {isEditing ? (
                        <Input value={editValues.task} onChange={e => setEditValues({ ...editValues, task: e.target.value })} className="h-7 text-xs bg-background" />
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
                <div className="md:col-span-5 md:border-l md:border-border/50 md:pl-2">
                    {isEditing ? (
                        <textarea value={editValues.desc} onChange={e => setEditValues({ ...editValues, desc: e.target.value })} className="w-full text-xs bg-background border rounded-md p-2 min-h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
                    ) : (
                        <span className="text-xs text-muted-foreground/80 leading-relaxed">{slot.description}</span>
                    )}
                </div>
                <div className="md:col-span-1 flex items-center justify-end md:justify-center">
                    {isEditing ? (
                        <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500 hover:bg-emerald-500/10" onClick={() => { onSaveEdit(path, editValues, slot.date); setIsEditing(false); }}>
                                <Save size={14} />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => setIsEditing(false)}>
                                <X size={14} />
                            </Button>
                        </div>
                    ) : (
                        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity" onClick={() => setIsEditing(true)}>
                            <Edit3 size={12} />
                        </Button>
                    )}
                </div>
            </div>
            {/* Nested deeper breakdown (e.g. weeks inside a month for Year goals) */}
            {deeperType && (
                <BreakdownSection
                    slot={slot} path={path} depth={depth + 1} goal={goal}
                    expansionType={deeperType}
                    onUpdateSubPlans={onUpdateSubPlans} onSaveEdit={onSaveEdit} user={user}
                    nested
                    overridePeriodStart={nestedPeriodStart}
                    overridePeriodEnd={nestedPeriodEnd}
                />
            )}
        </div>
    );
};

// ─── Breakdown Section (generate / view / delete sub‑plans) ─────────────────
const BreakdownSection = ({
    slot, path, depth, goal, expansionType, onUpdateSubPlans, onSaveEdit, user, nested,
    overridePeriodStart, overridePeriodEnd
}: {
    slot: AIGeneratedPlanSlot; path: number[]; depth: number; goal: Goal;
    expansionType: 'Weeks' | 'Months';
    onUpdateSubPlans: (p: number[], sp: AIGeneratedPlanSlot[] | undefined) => void;
    onSaveEdit: (p: number[], e: { title: string; task: string; desc: string }, d: string) => void;
    user: any; nested?: boolean;
    overridePeriodStart?: Date; overridePeriodEnd?: Date;
}) => {
    const [expanded, setExpanded] = useState(!nested);
    const [generating, setGenerating] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const hasSubPlans = slot.subPlans && slot.subPlans.length > 0;
    const isWeekLevel = expansionType === 'Weeks';

    // ── AI Generation ──
    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const parentLevelTasks = goal.plans?.map(p => p.dayTask).join(', ') || '';
            let dynamicCount: number;
            let dateRangesDescription = '';

            if (isWeekLevel) {
                // Use override dates (for nested months in Year goals) or compute from milestones
                const periodStart = overridePeriodStart || getPeriodStartForSlot(goal, slot.date);
                const periodEnd = overridePeriodEnd || parseISO(slot.date);
                const weekRanges = getWeekRanges(periodStart, periodEnd);
                dynamicCount = weekRanges.length;
                dateRangesDescription = weekRanges.map((w, i) =>
                    `Week ${i + 1}: ${format(w.start, 'yyyy-MM-dd')} to ${format(w.end, 'yyyy-MM-dd')} (${w.label})`
                ).join('\n');
            } else {
                // Month-level breakdown for Year goals — compute actual month ranges
                const periodStart = overridePeriodStart || getPeriodStartForSlot(goal, slot.date);
                const periodEnd = overridePeriodEnd || parseISO(slot.date);
                const monthRanges = getMonthRanges(periodStart, periodEnd);
                dynamicCount = monthRanges.length;
                dateRangesDescription = monthRanges.map((m, i) =>
                    `Month ${i + 1}: ${format(m.start, 'yyyy-MM-dd')} to ${format(m.end, 'yyyy-MM-dd')} (${m.label})`
                ).join('\n');
            }

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
User Persona: Primary Focus: ${user?.user_metadata?.primaryLifeFocus || 'Not set'}, Profession: ${user?.user_metadata?.currentProfession || 'Not set'}, Peak Energy: ${user?.user_metadata?.energyPeakTime || 'Morning'}
Tailor tasks specifically to fit this person's profession, life focus, and energy cycles when possible.

Context - The surrounding sibling phases in the overall plan are: ${parentLevelTasks}. Ensure this new breakdown strictly stays within the current phase's boundaries.

Please break this specific phase down into EXACTLY ${dynamicCount} sequential sub-milestones (representing ${expansionType}).

TIMELINE SYNC CRITICAL: You must use the "System Current Date" as your reality baseline.
${isWeekLevel ? `CRITICAL: You are generating a Weekly plan. The exact week date ranges are pre-calculated below. You MUST use these EXACT date ranges for the "date" field of each week. You MUST also include an 'estimatedHours' integer field representing realistic hours to complete that week's core task.

PRE-CALCULATED WEEK RANGES (use these exactly):
${dateRangesDescription}` : `CRITICAL: You are generating a Monthly plan. The exact month date ranges are pre-calculated below. You MUST use these EXACT month labels for the "date" field of each month.

PRE-CALCULATED MONTH RANGES (use these exactly):
${dateRangesDescription}`}

Return ONLY a JSON array with exactly ${dynamicCount} objects.
Each object must have these exact keys:
{
  "date": "string - ${isWeekLevel ? "use the exact date range from the pre-calculated list above (e.g., 'March 5 - March 11')" : "use the exact month label from the pre-calculated list above (e.g., 'March 2026')"}",
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

    // ── Manual Generation ──
    const handleManualGen = () => {
        let emptySubPlans: AIGeneratedPlanSlot[];
        if (isWeekLevel) {
            // Use override dates (for nested months in Year goals) or compute from milestones
            const periodStart = overridePeriodStart || getPeriodStartForSlot(goal, slot.date);
            const periodEnd = overridePeriodEnd || parseISO(slot.date);
            const weekRanges = getWeekRanges(periodStart, periodEnd);
            emptySubPlans = weekRanges.map(w => ({ date: w.label, dayTask: 'Draft Task', description: 'Edit this sub-milestone manually.' }));
        } else {
            // Month-level breakdown — compute actual month ranges
            const periodStart = overridePeriodStart || getPeriodStartForSlot(goal, slot.date);
            const periodEnd = overridePeriodEnd || parseISO(slot.date);
            const monthRanges = getMonthRanges(periodStart, periodEnd);
            emptySubPlans = monthRanges.map(m => ({
                date: m.label,
                dayTask: 'Draft Task',
                description: 'Edit this sub-milestone manually.'
            }));
        }
        onUpdateSubPlans(path, emptySubPlans);
        setExpanded(true);
        toast.success("Manual sub-plan template ready.");
    };

    return (
        <div className={cn("relative", nested ? "ml-6 pl-4 border-l border-dashed border-border/40 my-1" : "")}>
            {/* Toggle header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "flex items-center gap-2 w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors rounded-md",
                    nested
                        ? (isWeekLevel ? "text-cyan-500/60 hover:text-cyan-400" : "text-violet-500/60 hover:text-violet-400")
                        : (isWeekLevel ? "text-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/5" : "text-violet-500/60 hover:text-violet-400 hover:bg-violet-500/5"),
                )}
            >
                {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {hasSubPlans
                    ? `${expansionType} Breakdown (${slot.subPlans!.length} items)`
                    : `${expansionType} Breakdown`
                }
            </button>

            {expanded && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    {!hasSubPlans ? (
                        <div className="p-4 bg-accent/10 border border-dashed border-border/30 flex flex-col items-center justify-center space-y-3 mx-4 rounded-xl mb-3">
                            <p className="text-xs font-semibold text-muted-foreground text-center">
                                {expansionType} breakdown for this phase hasn't been created yet.
                            </p>
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
                        <div className="flex flex-col mx-2 mb-2">
                            <div className="flex justify-end px-2 mb-1">
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteConfirm(true)}>
                                    <Trash2 size={12} className="mr-1" /> Delete {expansionType} Breakdown
                                </Button>
                            </div>
                            <div className={cn("flex flex-col border-l-2 ml-2 rounded-bl-lg divide-y divide-border/30", isWeekLevel ? "border-cyan-500/30" : "border-violet-500/30")}>
                                {slot.subPlans!.map((subSlot, idx) => (
                                    <SubPlanRow
                                        key={idx} slot={subSlot} path={[...path, idx]}
                                        depth={depth} goal={goal}
                                        onUpdateSubPlans={onUpdateSubPlans}
                                        onSaveEdit={onSaveEdit} user={user}
                                    />
                                ))}
                            </div>
                            <ConfirmationDialog
                                isOpen={showDeleteConfirm}
                                onClose={() => setShowDeleteConfirm(false)}
                                onConfirm={() => { onUpdateSubPlans(path, undefined); setShowDeleteConfirm(false); }}
                                title={`Delete ${expansionType} Breakdown`}
                                description={`Are you sure you want to delete this ${expansionType} breakdown? This action cannot be undone.`}
                                confirmText="Delete Breakdown"
                                variant="destructive"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Milestone Marker Row ───────────────────────────────────────────────────
const MilestoneRow = ({
    slot, path, milestoneTitle, isNext, isCompleted, isStart, onSaveEdit
}: {
    slot?: AIGeneratedPlanSlot; path?: number[]; milestoneTitle: string;
    isNext?: boolean; isCompleted?: boolean; isStart?: boolean;
    onSaveEdit?: (p: number[], e: { title: string; task: string; desc: string }, d: string) => void;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({
        title: milestoneTitle || '',
        task: slot?.dayTask || '',
        desc: slot?.description || ''
    });

    const dateStr = slot?.date || '';
    const validDate = dateStr && !isNaN(parseISO(dateStr).getTime()) ? format(parseISO(dateStr), 'MMM d, yyyy') : dateStr;

    return (
        <div className={cn(
            "relative group",
            isStart ? "" : "border-t border-border/30"
        )}>
            <div className={cn(
                "grid grid-cols-1 md:grid-cols-12 gap-y-2 md:gap-4 px-4 py-4 md:py-3 transition-all items-start border-l-4",
                isStart ? "border-muted-foreground/30 bg-muted/10" :
                    isCompleted ? "border-emerald-500/60 bg-emerald-500/5" :
                        isNext ? "border-primary bg-primary/5" :
                            "border-border/60 bg-accent/10",
                isEditing && "ring-1 ring-primary/20"
            )}>
                {/* Date / Label Column */}
                <div className="md:col-span-3 flex flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Dot */}
                        <div className={cn(
                            "w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center",
                            isStart ? "border-muted-foreground bg-muted-foreground/20" :
                                isCompleted ? "border-emerald-500 bg-emerald-500" :
                                    isNext ? "border-primary bg-primary" :
                                        "border-border bg-background"
                        )}>
                            {isCompleted && <Check size={7} className="text-white" />}
                        </div>
                        {isEditing && path && slot ? (
                            <Input
                                value={editValues.title}
                                onChange={e => setEditValues({ ...editValues, title: e.target.value })}
                                className="h-7 text-xs bg-background flex-1"
                                placeholder="Phase Title"
                            />
                        ) : (
                            <span className={cn(
                                "text-[10px] uppercase font-bold tracking-wider",
                                isStart ? "text-muted-foreground" : "text-muted-foreground"
                            )}>
                                {milestoneTitle}
                            </span>
                        )}
                        {isNext && <span className="text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-black animate-pulse uppercase">NEXT STEP</span>}
                    </div>
                    <div className="text-xs font-semibold text-primary pl-5">{validDate}</div>
                </div>

                {/* Task Column */}
                <div className="md:col-span-3 md:border-l md:border-border/50 md:pl-2 flex flex-col gap-1">
                    {slot && (
                        isEditing ? (
                            <Input value={editValues.task} onChange={e => setEditValues({ ...editValues, task: e.target.value })} className="h-7 text-xs bg-background" />
                        ) : (
                            <span className="text-sm font-semibold text-foreground tracking-tight leading-tight">{slot.dayTask}</span>
                        )
                    )}
                </div>

                {/* Description Column */}
                <div className="md:col-span-5 md:border-l md:border-border/50 md:pl-2">
                    {slot && (
                        isEditing ? (
                            <textarea value={editValues.desc} onChange={e => setEditValues({ ...editValues, desc: e.target.value })} className="w-full text-xs bg-background border rounded-md p-2 min-h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
                        ) : (
                            <span className="text-xs text-muted-foreground/80 leading-relaxed">{slot.description}</span>
                        )
                    )}
                </div>

                {/* Action Column */}
                <div className="md:col-span-1 flex items-center justify-end md:justify-center">
                    {slot && path && onSaveEdit && (
                        isEditing ? (
                            <div className="flex gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500 hover:bg-emerald-500/10" onClick={() => {
                                    onSaveEdit(path, editValues, slot.date);
                                    setIsEditing(false);
                                }}>
                                    <Save size={14} />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => setIsEditing(false)}>
                                    <X size={14} />
                                </Button>
                            </div>
                        ) : (
                            <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity" onClick={() => setIsEditing(true)}>
                                <Edit3 size={12} />
                            </Button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────────
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

    const handleSaveEdit = (path: number[], edits: { title: string; task: string; desc: string }, date: string) => {
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

    const expansionType = getExpansionType(goal.goalType, 0);
    const startDate = goal.startDate && !isNaN(parseISO(goal.startDate).getTime())
        ? format(parseISO(goal.startDate), 'MMM d, yyyy')
        : goal.startDate;

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

                {/* Timeline Flow */}
                <div className="flex flex-col mb-4 md:mb-0">
                    {/* ── Starting Point ── */}
                    <MilestoneRow
                        milestoneTitle="Starting Point"
                        isStart
                        slot={{ date: goal.startDate, dayTask: '', description: '' }}
                    />

                    {/* ── For each milestone: breakdown THEN milestone marker ── */}
                    {sortedPlans.map((slot, idx) => {
                        const milestone = goal.milestones?.find(m => m.targetDate === slot.date);
                        const isCompleted = milestone?.completed;
                        const isNext = !isCompleted && !nextFound;
                        if (isNext) nextFound = true;

                        return (
                            <React.Fragment key={idx}>
                                {/* Sub-plan breakdown (weeks/months) for the period LEADING UP TO this milestone */}
                                {expansionType && (
                                    <BreakdownSection
                                        slot={slot} path={[idx]} depth={0} goal={goal}
                                        expansionType={expansionType}
                                        onUpdateSubPlans={handleUpdateSubPlans}
                                        onSaveEdit={handleSaveEdit} user={user}
                                    />
                                )}

                                {/* The milestone itself */}
                                <MilestoneRow
                                    slot={slot}
                                    path={[idx]}
                                    milestoneTitle={milestone?.title || `Phase ${idx + 1}`}
                                    isNext={isNext!}
                                    isCompleted={isCompleted!}
                                    onSaveEdit={handleSaveEdit}
                                />
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
