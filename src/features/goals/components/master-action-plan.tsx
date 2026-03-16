import React, { useState } from 'react';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { AILoadingPopup, recordGenTime } from '@/components/common/ai-loading-popup';
import { Goal, AIGeneratedPlanSlot } from '@/types/global-types';
import { format, parseISO, addDays, addMonths, differenceInCalendarDays, min as minDate, parse as dateParse } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check, Save, X, Edit3, ChevronRight, ChevronDown, BrainCircuit, UserCog, Trash2, Clock, Play, CalendarDays } from 'lucide-react';
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
        weeks.push({ start: cursor, end: weekEnd, label: `${format(cursor, 'MMMM d')} - ${format(weekEnd, 'MMMM d')}` });
        cursor = addDays(weekEnd, 1);
    }
    return weeks;
}

function getMonthRanges(periodStart: Date, periodEnd: Date): { start: Date; end: Date; label: string }[] {
    const months: { start: Date; end: Date; label: string }[] = [];
    let cursor = new Date(periodStart);
    while (differenceInCalendarDays(periodEnd, cursor) > 0) {
        const nextMonth = addMonths(cursor, 1);
        const monthEnd = minDate([nextMonth, periodEnd]);
        if (differenceInCalendarDays(monthEnd, cursor) > 0) {
            months.push({ start: new Date(cursor), end: new Date(monthEnd), label: format(cursor, 'MMMM yyyy') });
        }
        cursor = nextMonth;
    }
    return months;
}

function getPeriodStartForSlot(goal: Goal, slotDate: string): Date {
    const sortedMilestones = (goal.milestones || []).slice().sort((a, b) => a.targetDate.localeCompare(b.targetDate));
    const milestoneIdx = sortedMilestones.findIndex(m => m.targetDate === slotDate);
    if (milestoneIdx <= 0) return parseISO(goal.startDate);
    return parseISO(sortedMilestones[milestoneIdx - 1].targetDate);
}

function tryParseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const iso = parseISO(dateStr);
    if (!isNaN(iso.getTime())) return iso;
    try { const d = dateParse(dateStr, 'MMMM yyyy', new Date()); if (!isNaN(d.getTime())) return d; } catch { /* */ }
    try { const d = dateParse(dateStr, 'MMM yyyy', new Date()); if (!isNaN(d.getTime())) return d; } catch { /* */ }
    return null;
}

const deepUpdateSubPlans = (plans: AIGeneratedPlanSlot[], searchPath: number[], newSubPlans?: AIGeneratedPlanSlot[]): AIGeneratedPlanSlot[] => {
    const clone = JSON.parse(JSON.stringify(plans));
    let current = clone;
    for (let i = 0; i < searchPath.length - 1; i++) {
        if (!current[searchPath[i]].subPlans) current[searchPath[i]].subPlans = [];
        current = current[searchPath[i]].subPlans;
    }
    if (newSubPlans === undefined) delete current[searchPath[searchPath.length - 1]].subPlans;
    else current[searchPath[searchPath.length - 1]].subPlans = newSubPlans;
    return clone;
};

const deepEditSlot = (plans: AIGeneratedPlanSlot[], searchPath: number[], edits: { title: string, task: string, desc: string }): AIGeneratedPlanSlot[] => {
    const clone = JSON.parse(JSON.stringify(plans));
    let current = clone;
    for (let i = 0; i < searchPath.length - 1; i++) {
        if (!current[searchPath[i]].subPlans) current[searchPath[i]].subPlans = [];
        current = current[searchPath[i]].subPlans;
    }
    current[searchPath[searchPath.length - 1]].dayTask = edits.task;
    current[searchPath[searchPath.length - 1]].description = edits.desc;
    return clone;
};

function formatDate(dateStr: string): string {
    try {
        const d = parseISO(dateStr);
        return !isNaN(d.getTime()) ? format(d, 'MMM d, yyyy') : dateStr;
    } catch { return dateStr; }
}

function formatDateCompact(dateStr: string): string {
    // Handle range strings: "March 16 - March 22", "2026-03-16 to 2026-03-22", etc.
    const toSep = dateStr.includes(' to ') ? ' to ' : dateStr.includes(' - ') ? ' - ' : null;
    if (toSep) {
        const [startRaw, endRaw] = dateStr.split(toSep).map(s => s.trim());
        const s = tryParseDate(startRaw);
        const e = tryParseDate(endRaw);
        if (s && e) {
            const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
            return sameMonth
                ? `${format(s, 'MMM d')} – ${format(e, 'd')}`
                : `${format(s, 'MMM d')} – ${format(e, 'MMM d')}`;
        }
        return dateStr;
    }
    try {
        const d = parseISO(dateStr);
        if (!isNaN(d.getTime())) return format(d, 'MMM d');
    } catch { /* fall through */ }
    const p = tryParseDate(dateStr);
    if (p) return format(p, 'MMM yyyy');
    return dateStr;
}

// ─── Sub-plan row ────────────────────────────────────────────────────────────
const SubPlanRow = ({
    slot, path, depth, goal, onUpdateSubPlans, onSaveEdit, user
}: {
    slot: AIGeneratedPlanSlot; path: number[]; depth: number; goal: Goal;
    onUpdateSubPlans: (p: number[], sp: AIGeneratedPlanSlot[] | undefined) => void;
    onSaveEdit: (p: number[], e: { title: string; task: string; desc: string }, d: string) => void;
    user: any;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [editValues, setEditValues] = useState({ title: '', task: slot.dayTask, desc: slot.description });
    const deeperType = getExpansionType(goal.goalType, depth + 1);

    let nestedPeriodStart: Date | undefined;
    let nestedPeriodEnd: Date | undefined;
    if (deeperType === 'Weeks') {
        const parsed = tryParseDate(slot.date);
        if (parsed) { nestedPeriodStart = parsed; nestedPeriodEnd = addMonths(parsed, 1); }
    }

    return (
        <div className="flex flex-col">
            {isEditing ? (
                <div className="mx-2 my-1 px-4 py-3 bg-muted/50 ring-1 ring-primary/20 rounded-lg space-y-2">
                    <Input value={editValues.task} onChange={e => setEditValues({ ...editValues, task: e.target.value })} className="h-7 text-xs bg-background" placeholder="Task name" />
                    <textarea value={editValues.desc} onChange={e => setEditValues({ ...editValues, desc: e.target.value })} className="w-full text-xs bg-background border rounded-md p-2 min-h-[48px] resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
                    <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-intent-goal hover:bg-intent-goal-muted" onClick={() => { onSaveEdit(path, editValues, slot.date); setIsEditing(false); }}>
                            <Save size={12} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => setIsEditing(false)}>
                            <X size={12} />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="group select-text">
                    <div
                        className={cn(
                            "relative px-3 sm:px-4 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer",
                            "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
                        )}
                        onClick={() => setExpanded(prev => !prev)}
                    >
                        {/* 1) Badges — date + duration. Mobile: row 1 with edit on right */}
                        <div className="flex items-center justify-between sm:justify-start gap-1.5 shrink-0 w-full sm:w-auto">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                <ChevronRight size={12} className={cn(
                                    "shrink-0 text-muted-foreground transition-transform duration-150 sm:hidden",
                                    expanded && "rotate-90"
                                )} />
                                <span className={cn(
                                    "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md whitespace-nowrap",
                                    depth === 0 ? "bg-violet-500/10 text-violet-400/80" : "bg-cyan-500/10 text-cyan-400/80"
                                )}>
                                    <CalendarDays size={10} />
                                    {formatDateCompact(slot.date)}
                                </span>
                                {slot.estimatedHours && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-1 rounded-md bg-blue-500/10 text-blue-400/80 whitespace-nowrap">
                                        <Clock size={9} /> {slot.estimatedHours}h
                                    </span>
                                )}
                            </div>
                            <Button
                                size="icon" variant="ghost"
                                className={cn(
                                    "h-7 w-7 shrink-0 sm:absolute sm:right-2 text-muted-foreground hover:text-intent-goal hover:bg-intent-goal-muted transition-all",
                                    expanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}
                                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                            >
                                <Edit3 size={12} />
                            </Button>
                        </div>

                        {/* 2) Task + description. Mobile: row 2 */}
                        <div className="flex-1 min-w-0">
                            <p className={cn(
                                "text-sm font-semibold text-foreground leading-tight",
                                !expanded && "truncate"
                            )}>{slot.dayTask}</p>
                            {slot.description && (
                                <p className={cn(
                                    "text-[11px] text-muted-foreground mt-0.5 leading-snug",
                                    !expanded && "line-clamp-1"
                                )}>{slot.description}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {deeperType && (
                <BreakdownSection
                    slot={slot} path={path} depth={depth + 1} goal={goal}
                    expansionType={deeperType}
                    onUpdateSubPlans={onUpdateSubPlans} onSaveEdit={onSaveEdit} user={user}
                    nested overridePeriodStart={nestedPeriodStart} overridePeriodEnd={nestedPeriodEnd}
                />
            )}
        </div>
    );
};

// ─── Breakdown Section ───────────────────────────────────────────────────────
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
    const [expanded, setExpanded] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const hasSubPlans = slot.subPlans && slot.subPlans.length > 0;
    const isWeekLevel = expansionType === 'Weeks';

    const handleGenerate = async () => {
        setGenerating(true);
        const genStart = Date.now();
        try {
            const parentLevelTasks = goal.plans?.map(p => p.dayTask).join(', ') || '';
            const periodStart = overridePeriodStart || getPeriodStartForSlot(goal, slot.date);
            const periodEnd = overridePeriodEnd || parseISO(slot.date);
            let dynamicCount: number;
            let dateRangesDescription: string;

            if (isWeekLevel) {
                const ranges = getWeekRanges(periodStart, periodEnd);
                dynamicCount = ranges.length;
                dateRangesDescription = ranges.map((w, i) => `Week ${i + 1}: ${format(w.start, 'yyyy-MM-dd')} to ${format(w.end, 'yyyy-MM-dd')} (${w.label})`).join('\n');
            } else {
                const ranges = getMonthRanges(periodStart, periodEnd);
                dynamicCount = ranges.length;
                dateRangesDescription = ranges.map((m, i) => `Month ${i + 1}: ${format(m.start, 'yyyy-MM-dd')} to ${format(m.end, 'yyyy-MM-dd')} (${m.label})`).join('\n');
            }

            const prompt = `Generate a detailed hierarchical action plan breakdown for the following phase of the overall goal.
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
${isWeekLevel ? `CRITICAL: Weekly plan. Use these EXACT date ranges. Include 'estimatedHours' integer field.\nPRE-CALCULATED WEEK RANGES:\n${dateRangesDescription}` : `CRITICAL: Monthly plan. Use these EXACT month labels.\nPRE-CALCULATED MONTH RANGES:\n${dateRangesDescription}`}
Return ONLY a JSON array with exactly ${dynamicCount} objects.
Each object: { "date": "string", "dayTask": "string - short title", "description": "string - 1-2 sentences", "estimatedHours": number }
NO MARKDOWN. RAW JSON ONLY.`;

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': window.location.origin, 'X-Title': 'Legacy Life Builder Planner' },
                body: JSON.stringify({ model: "arcee-ai/trinity-large-preview:free", messages: [{ role: "user", content: prompt }] })
            });

            const rawResult = await response.json();
            if (!response.ok || !rawResult.choices?.[0]?.message?.content) throw new Error(rawResult.error?.message || "AI response error");

            let cleanJson = rawResult.choices[0].message.content.replace(/^```json\n?/gm, '').replace(/```$/gm, '').replace(/^```\n?/gm, '').trim();
            const subPlans: AIGeneratedPlanSlot[] = JSON.parse(cleanJson);
            recordGenTime(Date.now() - genStart);
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
        const periodStart = overridePeriodStart || getPeriodStartForSlot(goal, slot.date);
        const periodEnd = overridePeriodEnd || parseISO(slot.date);
        const ranges = isWeekLevel ? getWeekRanges(periodStart, periodEnd) : getMonthRanges(periodStart, periodEnd);
        const emptySubPlans = ranges.map(r => ({ date: r.label, dayTask: 'Draft Task', description: 'Edit this sub-milestone manually.' }));
        onUpdateSubPlans(path, emptySubPlans);
        setExpanded(true);
        toast.success("Manual sub-plan template ready.");
    };

    return (
        <div className={cn("relative", nested ? "ml-4 pl-3 border-l border-dashed border-border my-1" : "")}>
            <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "flex items-center gap-2 w-full text-left px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors rounded",
                    isWeekLevel ? "text-cyan-400/50 hover:text-cyan-400 hover:bg-cyan-500/5" : "text-violet-400/50 hover:text-violet-400 hover:bg-violet-500/5",
                )}
            >
                {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                {hasSubPlans ? `${expansionType} (${slot.subPlans!.length})` : expansionType}
            </button>

            {expanded && (
                <div className="animate-in fade-in duration-150">
                    {!hasSubPlans ? (
                        <div className="p-4 mx-3 mb-2 rounded-xl border border-dashed border-border bg-muted/30 flex flex-col items-center gap-3">
                            <p className="text-[11px] text-muted-foreground text-center">No {expansionType.toLowerCase()} breakdown yet.</p>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <Button size="sm" onClick={handleGenerate} disabled={generating} className="bg-primary/15 text-primary hover:bg-primary hover:text-primary-foreground border-transparent shadow-none text-xs h-7">
                                    <BrainCircuit size={13} className="mr-1.5" /> AI Generate
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleManualGen} disabled={generating} className="text-xs h-7 border-border">
                                    <UserCog size={13} className="mr-1.5" /> Manual
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="mx-2 mb-2">
                            <div className="flex justify-end px-1 mb-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" onClick={() => setShowDeleteConfirm(true)}>
                                    <Trash2 size={12} />
                                </Button>
                            </div>
                            <div className="flex flex-col rounded-lg border border-border overflow-hidden divide-y divide-border">
                                {slot.subPlans!.map((subSlot, idx) => (
                                    <SubPlanRow key={idx} slot={subSlot} path={[...path, idx]} depth={depth} goal={goal} onUpdateSubPlans={onUpdateSubPlans} onSaveEdit={onSaveEdit} user={user} />
                                ))}
                            </div>
                            <ConfirmationDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={() => { onUpdateSubPlans(path, undefined); setShowDeleteConfirm(false); }} title={`Delete ${expansionType} Breakdown`} description={`This will remove the entire ${expansionType.toLowerCase()} breakdown. Cannot be undone.`} confirmText="Delete" variant="destructive" />
                        </div>
                    )}
                </div>
            )}

            <AILoadingPopup isOpen={generating} title="Generating Sub-Plan..." subtitle="Breaking down your milestone" message="AI is creating a detailed breakdown..." />
        </div>
    );
};

// ─── Milestone Card ──────────────────────────────────────────────────────────
const MilestoneCard = ({
    slot, path, milestoneTitle, isNext, isCompleted, isStart, onSaveEdit
}: {
    slot?: AIGeneratedPlanSlot; path?: number[]; milestoneTitle: string;
    isNext?: boolean; isCompleted?: boolean; isStart?: boolean;
    onSaveEdit?: (p: number[], e: { title: string; task: string; desc: string }, d: string) => void;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({ title: milestoneTitle || '', task: slot?.dayTask || '', desc: slot?.description || '' });
    const dateStr = slot?.date || '';

    return (
        <div className={cn(
            "group relative rounded-xl border p-3 sm:p-4 transition-all duration-100",
            isStart ? "bg-intent-goal-muted border-intent-goal/20" :
                isCompleted ? "bg-intent-goal-muted border-intent-goal/20" :
                    "bg-card border-border",
        )}>
            {/* Header row */}
            <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                    "w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0",
                    isStart ? "border-intent-goal bg-intent-goal-muted" :
                        isCompleted ? "border-intent-goal bg-intent-goal-muted" :
                            "border-border bg-muted"
                )}>
                    {isStart ? <Play size={8} className="text-intent-goal ml-0.5" /> :
                        isCompleted ? <Check size={9} strokeWidth={3} className="text-intent-goal" /> :
                            <span className="text-[7px] font-black text-muted-foreground">{path ? path[0] + 1 : ''}</span>
                    }
                </div>

                <div className="flex-1 min-w-0">
                    {isEditing && path && slot ? (
                        <Input value={editValues.title} onChange={e => setEditValues({ ...editValues, title: e.target.value })} className="h-6 text-xs" placeholder="Phase Title" />
                    ) : (
                        <span className={cn(
                            "text-[11px] uppercase font-bold tracking-wider",
                            isStart ? "text-intent-goal" :
                                isCompleted ? "text-intent-goal" : "text-muted-foreground"
                        )}>
                            {milestoneTitle}
                        </span>
                    )}
                </div>

                <span className="text-[10px] font-semibold text-primary/60 shrink-0">{formatDate(dateStr)}</span>

                {slot && path && onSaveEdit && !isStart && (
                    <div className="shrink-0">
                        {isEditing ? (
                            <div className="flex gap-0.5">
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-intent-goal hover:bg-intent-goal-muted" onClick={() => { onSaveEdit(path, editValues, slot.date); setIsEditing(false); }}>
                                    <Save size={11} />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => setIsEditing(false)}>
                                    <X size={11} />
                                </Button>
                            </div>
                        ) : (
                            <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity" onClick={() => setIsEditing(true)}>
                                <Edit3 size={11} />
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            {slot && slot.dayTask && (
                <div className="pl-7">
                    {isEditing ? (
                        <div className="space-y-2">
                            <Input value={editValues.task} onChange={e => setEditValues({ ...editValues, task: e.target.value })} className="h-7 text-xs" placeholder="Task name" />
                            <textarea value={editValues.desc} onChange={e => setEditValues({ ...editValues, desc: e.target.value })} className="w-full text-xs bg-background border rounded-md p-2 min-h-[48px] resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                    ) : (
                        <>
                            <span className="text-sm font-semibold text-foreground leading-tight">{slot.dayTask}</span>
                            {slot.description && (
                                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{slot.description}</p>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const MasterActionPlan: React.FC<MasterActionPlanProps> = ({ goal, onUpdate }) => {
    const { user } = useAuth();

    if (!goal.plans || goal.plans.length === 0) {
        return (
            <div className="p-6 text-center text-[11px] text-muted-foreground">
                No plan generated yet. Edit the goal to create one.
            </div>
        );
    }

    const sortedPlans = goal.plans.slice().sort((a, b) => a.date.localeCompare(b.date));
    let nextFound = false;

    const handleUpdateSubPlans = (path: number[], subPlans: AIGeneratedPlanSlot[] | undefined) => {
        if (!onUpdate) return;
        onUpdate({ ...goal, plans: deepUpdateSubPlans(sortedPlans, path, subPlans) });
    };

    const handleSaveEdit = (path: number[], edits: { title: string; task: string; desc: string }, date: string) => {
        if (!onUpdate) return;
        const newPlans = deepEditSlot(sortedPlans, path, edits);
        let newMilestones = goal.milestones;
        if (path.length === 1 && goal.milestones) {
            newMilestones = [...goal.milestones];
            const mIdx = newMilestones.findIndex(m => m.targetDate === date);
            if (mIdx !== -1) newMilestones[mIdx] = { ...newMilestones[mIdx], title: edits.title };
        }
        onUpdate({ ...goal, plans: newPlans, milestones: newMilestones });
    };

    const expansionType = getExpansionType(goal.goalType, 0);

    return (
        <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] md:text-xs font-bold uppercase text-muted-foreground tracking-widest">Action Plan</h4>
                <span className="text-[9px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {goal.plans.length} milestones
                </span>
            </div>

            <div className="flex flex-col gap-2">
                {/* Starting Point */}
                <MilestoneCard
                    milestoneTitle="Starting Point"
                    isStart
                    slot={{ date: goal.startDate, dayTask: '', description: '' }}
                />

                {sortedPlans.map((slot, idx) => {
                    const milestone = goal.milestones?.find(m => m.targetDate === slot.date);
                    const isCompleted = milestone?.completed;
                    const isNext = !isCompleted && !nextFound;
                    if (isNext) nextFound = true;

                    return (
                        <React.Fragment key={idx}>
                            {expansionType && (
                                <BreakdownSection
                                    slot={slot} path={[idx]} depth={0} goal={goal}
                                    expansionType={expansionType}
                                    onUpdateSubPlans={handleUpdateSubPlans}
                                    onSaveEdit={handleSaveEdit} user={user}
                                />
                            )}

                            <MilestoneCard
                                slot={slot}
                                path={[idx]}
                                milestoneTitle={milestone?.title || `Phase ${idx + 1}`}
                                isNext={isNext}
                                isCompleted={isCompleted}
                                onSaveEdit={handleSaveEdit}
                            />
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};
