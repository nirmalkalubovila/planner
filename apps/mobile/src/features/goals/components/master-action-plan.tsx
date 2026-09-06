import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  min as minDate,
  parse as dateParse,
  parseISO,
} from 'date-fns';
import { BrainCircuit, Check, ChevronDown, ChevronRight, Clock, Edit3, Play, Save, Trash2, UserCog, X, CalendarDays } from 'lucide-react-native';
import { AILoadingPopup } from '@/components/common/ai-loading-popup';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/typography';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@llb/api';
import { toast, type AIGeneratedPlanSlot, type Goal } from '@llb/core';
import { cn } from '@/lib/cn';
import { callAI } from '../hooks/use-ai-plan-generation';

interface MasterActionPlanProps {
  goal: Goal;
  onUpdate?: (updatedGoal: Goal) => void;
}

/** Port of apps/web/src/features/goals/components/master-action-plan.tsx —
 * including the recursive Year->Months->Weeks AI drill-down (BreakdownSection
 * / SubPlanRow) that an earlier pass deferred. Same date math, same AI
 * prompts, same deepUpdateSubPlans/deepEditSlot path-addressed mutation —
 * div/button swapped for View/Pressable, textarea for multiline TextInput. */

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
  const milestoneIdx = sortedMilestones.findIndex((m) => m.targetDate === slotDate);
  if (milestoneIdx <= 0) return parseISO(goal.startDate);
  return parseISO(sortedMilestones[milestoneIdx - 1].targetDate);
}

function cleanDateString(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.replace(/\s*\(.*?\)\s*/g, '').trim();
}

function tryParseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const cleanStr = cleanDateString(dateStr);
  const iso = parseISO(cleanStr);
  if (!isNaN(iso.getTime())) return iso;
  try {
    const d = dateParse(cleanStr, 'MMMM yyyy', new Date());
    if (!isNaN(d.getTime())) return d;
  } catch {
    /* */
  }
  try {
    const d = dateParse(cleanStr, 'MMM yyyy', new Date());
    if (!isNaN(d.getTime())) return d;
  } catch {
    /* */
  }
  return null;
}

function parseDateRange(dateStr: string): { start: Date; end: Date } | null {
  if (!dateStr) return null;
  const cleanStr = cleanDateString(dateStr);
  const toSep = cleanStr.includes(' to ') ? ' to ' : cleanStr.includes(' - ') ? ' - ' : null;
  if (toSep) {
    const [startRaw, endRaw] = cleanStr.split(toSep).map((s) => s.trim());
    const s = tryParseDate(startRaw);
    const e = tryParseDate(endRaw);
    if (s && e) return { start: s, end: e };
  }
  return null;
}

const deepUpdateSubPlans = (
  plans: AIGeneratedPlanSlot[],
  searchPath: number[],
  newSubPlans?: AIGeneratedPlanSlot[]
): AIGeneratedPlanSlot[] => {
  const clone: AIGeneratedPlanSlot[] = JSON.parse(JSON.stringify(plans));
  let current = clone;
  for (let i = 0; i < searchPath.length - 1; i++) {
    if (!current[searchPath[i]].subPlans) current[searchPath[i]].subPlans = [];
    current = current[searchPath[i]].subPlans!;
  }
  if (newSubPlans === undefined) delete current[searchPath[searchPath.length - 1]].subPlans;
  else current[searchPath[searchPath.length - 1]].subPlans = newSubPlans;
  return clone;
};

const deepEditSlot = (
  plans: AIGeneratedPlanSlot[],
  searchPath: number[],
  edits: { title: string; task: string; desc: string }
): AIGeneratedPlanSlot[] => {
  const clone: AIGeneratedPlanSlot[] = JSON.parse(JSON.stringify(plans));
  let current = clone;
  for (let i = 0; i < searchPath.length - 1; i++) {
    if (!current[searchPath[i]].subPlans) current[searchPath[i]].subPlans = [];
    current = current[searchPath[i]].subPlans!;
  }
  current[searchPath[searchPath.length - 1]].dayTask = edits.task;
  current[searchPath[searchPath.length - 1]].description = edits.desc;
  return clone;
};

function formatDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return !isNaN(d.getTime()) ? format(d, 'MMM d, yyyy') : dateStr;
  } catch {
    return dateStr;
  }
}

function formatDateCompact(dateStr: string): string {
  const toSep = dateStr.includes(' to ') ? ' to ' : dateStr.includes(' - ') ? ' - ' : null;
  if (toSep) {
    const [startRaw, endRaw] = dateStr.split(toSep).map((s) => s.trim());
    const s = tryParseDate(startRaw);
    const e = tryParseDate(endRaw);
    if (s && e) {
      const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
      return sameMonth ? `${format(s, 'MMM d')} – ${format(e, 'd')}` : `${format(s, 'MMM d')} – ${format(e, 'MMM d')}`;
    }
    return dateStr;
  }
  try {
    const d = parseISO(dateStr);
    if (!isNaN(d.getTime())) return format(d, 'MMM d');
  } catch {
    /* fall through */
  }
  const p = tryParseDate(dateStr);
  if (p) return format(p, 'MMM yyyy');
  return dateStr;
}

function buildBreakdownPrompt(
  goal: Goal,
  slot: AIGeneratedPlanSlot,
  dynamicCount: number,
  expansionType: 'Weeks' | 'Months',
  isWeekLevel: boolean,
  dateRangesDescription: string,
  parentLevelTasks: string,
  profile: any,
  user: any
): string {
  return `Generate a detailed hierarchical action plan breakdown for the following phase of the overall goal.
Goal Title: ${goal.title || ''}
Goal Description/Mission: ${goal.name}
Goal Purpose: ${goal.purpose}
Goal Start Date: ${goal.startDate}
Phase Target Task (with parent target count): ${slot.dayTask}
Phase Strategy/Description: ${slot.description}
Phase Timeline Date/Range: ${slot.date}
System Current Date: ${format(new Date(), 'MMMM d, yyyy')}
User Preferences: Focus Ability: ${profile?.focusAbility || user?.user_metadata?.focusAbility || 'normal'}, Task Shifting: ${profile?.taskShiftingAbility || user?.user_metadata?.taskShiftingAbility || 'normal'}
User Persona: Primary Focus: ${profile?.primaryLifeFocus || user?.user_metadata?.primaryLifeFocus || 'Not set'}, Profession: ${profile?.currentProfession || user?.user_metadata?.currentProfession || 'Not set'}, Peak Energy: ${profile?.energyPeakTime || user?.user_metadata?.energyPeakTime || 'Morning'}
Tailor tasks specifically to fit this person's profession, life focus, and energy cycles when possible.
Context - The surrounding sibling phases in the overall plan are: ${parentLevelTasks}. Ensure this new breakdown strictly stays within the current phase's boundaries.

PRAGMATIC STRATEGY RULES (ACT AS AN ELITE PERFORMANCE ARCHITECT):
1. ZERO FLUFF: Do not include motivational quotes, generic encouragement, or vague advice in the title ("dayTask") or details ("description"). Provide only tactical, executable tasks.
2. RESPECT CONSTRAINTS: Rigorously apply the constraints, starting situation, and resource limitations provided by the user. Early phases must focus on bootstrapping, free validation, or skill acquisition if time/money are limited.
3. CURRENCY ALIGNMENT: If a specific currency (e.g., LKR) or metric is provided in the goal parameters, use it for all financial estimations, sub-goal targets, and milestones.
4. METRIC-DRIVEN: Every generated task must have a quantifiable metric or threshold of completion in the title or description that proves the task is complete.

NUMERICAL PROGRESSION & TARGET INTERPOLATION:
If the Goal Title, Description, Purpose, or the Phase Target Task contains a specific numeric target (e.g., "reach 10k followers", "reach 1k followers"), you MUST mathematically interpolate/scale this target across the ${dynamicCount} sequential sub-milestones (representing ${expansionType}).
- Proportionally distribute the numeric target progress over these ${dynamicCount} periods.
- Specify the progressive target numbers clearly in each sub-milestone's title ("dayTask") and details ("description") (e.g. Week 1: Reach 400 followers, Week 2: Reach 600 followers, Week 3: Reach 800 followers, Week 4: Reach 1k followers).

REALISTIC ESTIMATED HOURS:
- The "estimatedHours" MUST be a highly realistic, non-generic estimation of the cumulative hours required to execute that specific sub-milestone task.
- PRACTICAL HOURLY LIMITS: Do not estimate impractical hours. For any individual, the absolute maximum quality work hours they can spend is 5 hours a day (35 hours a week, 140 hours a month).
- Unless user preferences explicitly specify a different time availability, assume a standard average budget of 3 hours a day, which means exactly 21 hours a week (84 hours a month).
- DYNAMIC ALLOCATION (NEVER HARDCODE): Do NOT assign the exact same constant hours (like 84h or 16h) to every month or week. The estimated hours must dynamically expand or contract based on the complexity, scale, and specific tasks of that period (e.g., some lighter weeks might be 5h or 8h, while heavier action weeks might be 15h or 20h, as long as they stay strictly below the weekly budget cap of 21 hours).
- Ensure all estimated hours at the Year, Month, or Week level are mathematically scaled to stay strictly within these bounds (e.g. a 4-week Month phase must not exceed 84 hours total; a Week phase must not exceed 21 hours total).

Please break this specific phase down into EXACTLY ${dynamicCount} sequential sub-milestones (representing ${expansionType}).
TIMELINE SYNC CRITICAL: You must use the "System Current Date" as your reality baseline.
${isWeekLevel ? `CRITICAL: Weekly plan. Use these EXACT date ranges. Include 'estimatedHours' integer field.\nPRE-CALCULATED WEEK RANGES:\n${dateRangesDescription}` : `CRITICAL: Monthly plan. Use these EXACT month labels.\nPRE-CALCULATED MONTH RANGES:\n${dateRangesDescription}`}
Return ONLY a JSON array with exactly ${dynamicCount} objects.
Each object: { "date": "string", "dayTask": "string - short title including progressive target numbers", "description": "string - 1-2 sentences detailing target progress details", "estimatedHours": number }
NO MARKDOWN. RAW JSON ONLY.`;
}

// ─── Sub-plan row ────────────────────────────────────────────────────────────
function SubPlanRow({
  slot,
  path,
  depth,
  goal,
  onUpdateSubPlans,
  onSaveEdit,
  user,
  profile,
}: {
  slot: AIGeneratedPlanSlot;
  path: number[];
  depth: number;
  goal: Goal;
  onUpdateSubPlans: (p: number[], sp: AIGeneratedPlanSlot[] | undefined) => void;
  onSaveEdit: (p: number[], e: { title: string; task: string; desc: string }, d: string) => void;
  user: any;
  profile?: any;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editValues, setEditValues] = useState({ title: '', task: slot.dayTask, desc: slot.description });
  const deeperType = getExpansionType(goal.goalType, depth + 1);

  let nestedPeriodStart: Date | undefined;
  let nestedPeriodEnd: Date | undefined;
  if (deeperType === 'Weeks') {
    const range = parseDateRange(slot.date);
    if (range) {
      nestedPeriodStart = range.start;
      nestedPeriodEnd = range.end;
    }
  }

  return (
    <View>
      {isEditing ? (
        <View className="mx-2 my-1 px-4 py-3 bg-muted/50 rounded-lg gap-2">
          <Input value={editValues.task} onChangeText={(v) => setEditValues((e) => ({ ...e, task: v }))} placeholder="Task name" />
          <TextInput
            value={editValues.desc}
            onChangeText={(v) => setEditValues((e) => ({ ...e, desc: v }))}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#71717a"
            className="w-full text-xs bg-background border border-border rounded-md p-2 min-h-[48px] text-foreground"
            style={{ includeFontPadding: false }}
          />
          <View className="flex-row gap-1 justify-end">
            <Pressable
              onPress={() => {
                onSaveEdit(path, editValues, slot.date);
                setIsEditing(false);
              }}
              className="h-6 w-6 items-center justify-center"
            >
              <Save size={12} color="#34d399" />
            </Pressable>
            <Pressable onPress={() => setIsEditing(false)} className="h-6 w-6 items-center justify-center">
              <X size={12} color="#f87171" />
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setExpanded((v) => !v)} className="px-3 py-2.5">
          <View className="flex-row items-center gap-1.5 flex-wrap mb-1">
            <ChevronRight size={12} color="#a1a1aa" style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }} />
            <View
              className={cn(
                'flex-row items-center gap-1 px-2 py-1 rounded-md',
                depth === 0 ? 'bg-violet-500/10' : 'bg-cyan-500/10'
              )}
            >
              <CalendarDays size={10} color={depth === 0 ? '#a78bfa' : '#22d3ee'} />
              <Text variant="tiny" className="font-semibold">
                {formatDateCompact(slot.date)}
              </Text>
            </View>
            {!!slot.estimatedHours && (
              <View className="flex-row items-center gap-0.5 px-1.5 py-1 rounded-md bg-blue-500/10">
                <Clock size={9} color="#60a5fa" />
                <Text variant="tiny" className="font-bold">
                  {slot.estimatedHours}h
                </Text>
              </View>
            )}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="ml-auto h-7 w-7 items-center justify-center"
            >
              <Edit3 size={12} color="#a1a1aa" />
            </Pressable>
          </View>
          <Text className="text-sm font-semibold text-foreground" numberOfLines={expanded ? undefined : 1}>
            {slot.dayTask}
          </Text>
          {!!slot.description && (
            <Text variant="tiny" className="mt-0.5" numberOfLines={expanded ? undefined : 1}>
              {slot.description}
            </Text>
          )}
        </Pressable>
      )}

      {deeperType && (
        <BreakdownSection
          slot={slot}
          path={path}
          depth={depth + 1}
          goal={goal}
          expansionType={deeperType}
          onUpdateSubPlans={onUpdateSubPlans}
          onSaveEdit={onSaveEdit}
          user={user}
          profile={profile}
          nested
          overridePeriodStart={nestedPeriodStart}
          overridePeriodEnd={nestedPeriodEnd}
        />
      )}
    </View>
  );
}

// ─── Breakdown section ───────────────────────────────────────────────────────
function BreakdownSection({
  slot,
  path,
  depth,
  goal,
  expansionType,
  onUpdateSubPlans,
  onSaveEdit,
  user,
  profile,
  nested,
  overridePeriodStart,
  overridePeriodEnd,
}: {
  slot: AIGeneratedPlanSlot;
  path: number[];
  depth: number;
  goal: Goal;
  expansionType: 'Weeks' | 'Months';
  onUpdateSubPlans: (p: number[], sp: AIGeneratedPlanSlot[] | undefined) => void;
  onSaveEdit: (p: number[], e: { title: string; task: string; desc: string }, d: string) => void;
  user: any;
  profile?: any;
  nested?: boolean;
  overridePeriodStart?: Date;
  overridePeriodEnd?: Date;
}) {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasSubPlans = !!(slot.subPlans && slot.subPlans.length > 0);
  const isWeekLevel = expansionType === 'Weeks';

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const parentLevelTasks = goal.plans?.map((p) => p.dayTask).join(', ') || '';
      const range = parseDateRange(slot.date);
      const periodStart = overridePeriodStart || range?.start || getPeriodStartForSlot(goal, slot.date);
      const periodEnd = overridePeriodEnd || range?.end || parseISO(slot.date);
      let dynamicCount: number;
      let dateRangesDescription: string;

      if (isWeekLevel) {
        const ranges = getWeekRanges(periodStart, periodEnd);
        dynamicCount = ranges.length;
        dateRangesDescription = ranges
          .map((w, i) => `Week ${i + 1}: ${format(w.start, 'yyyy-MM-dd')} to ${format(w.end, 'yyyy-MM-dd')} (${w.label})`)
          .join('\n');
      } else {
        const ranges = getMonthRanges(periodStart, periodEnd);
        dynamicCount = ranges.length;
        dateRangesDescription = ranges.map((m, i) => `Month ${i + 1}: ${format(m.start, 'yyyy-MM-dd')} to ${format(m.end, 'yyyy-MM-dd')} (${m.label})`).join('\n');
      }

      if (dynamicCount === 0) throw new Error('This phase has no room for a breakdown');

      const prompt = buildBreakdownPrompt(goal, slot, dynamicCount, expansionType, isWeekLevel, dateRangesDescription, parentLevelTasks, profile, user);
      const subPlans = await callAI(prompt);
      if (!subPlans || !Array.isArray(subPlans) || subPlans.length === 0) {
        throw new Error('AI returned an empty plan');
      }
      onUpdateSubPlans(path, subPlans);
      setExpanded(true);
      toast.success('Sub-plan generated!');
    } catch {
      toast.error('Our planner is working so much, please try again after a few seconds.');
    } finally {
      setGenerating(false);
    }
  };

  const handleManualGen = () => {
    const range = parseDateRange(slot.date);
    const periodStart = overridePeriodStart || range?.start || getPeriodStartForSlot(goal, slot.date);
    const periodEnd = overridePeriodEnd || range?.end || parseISO(slot.date);
    const ranges = isWeekLevel ? getWeekRanges(periodStart, periodEnd) : getMonthRanges(periodStart, periodEnd);
    const emptySubPlans = ranges.map((r) => ({ date: r.label, dayTask: 'Draft Task', description: 'Edit this sub-milestone manually.' }));
    onUpdateSubPlans(path, emptySubPlans);
    setExpanded(true);
    toast.success('Manual sub-plan template ready.');
  };

  return (
    <View className={cn(nested ? 'ml-4 pl-3 border-l border-dashed border-border my-1' : '')}>
      <Pressable onPress={() => setExpanded((v) => !v)} className="flex-row items-center gap-2 px-3 py-1.5">
        {expanded ? <ChevronDown size={11} color={isWeekLevel ? '#22d3ee' : '#a78bfa'} /> : <ChevronRight size={11} color={isWeekLevel ? '#22d3ee' : '#a78bfa'} />}
        <Text variant="tiny" className={cn('font-bold uppercase', isWeekLevel ? 'text-cyan-400' : 'text-violet-400')}>
          {hasSubPlans ? `${expansionType} (${slot.subPlans!.length})` : expansionType}
        </Text>
      </Pressable>

      {expanded && (
        <View>
          {!hasSubPlans ? (
            <View className="p-4 mx-3 mb-2 rounded-xl border border-dashed border-border bg-muted/30 items-center gap-3">
              <Text variant="small" className="text-center">
                No {expansionType.toLowerCase()} breakdown yet.
              </Text>
              <View className="flex-row flex-wrap items-center justify-center gap-2">
                <Button size="sm" onPress={handleGenerate} loading={generating}>
                  <View className="flex-row items-center gap-1.5">
                    <BrainCircuit size={13} color="#000000" />
                    <Text className="text-primary-foreground text-xs font-medium">AI Generate</Text>
                  </View>
                </Button>
                <Button size="sm" variant="outline" onPress={handleManualGen} disabled={generating}>
                  <View className="flex-row items-center gap-1.5">
                    <UserCog size={13} color="#e4e4e7" />
                    <Text variant="small">Manual</Text>
                  </View>
                </Button>
              </View>
            </View>
          ) : (
            <View className="mx-2 mb-2">
              <Pressable onPress={() => setShowDeleteConfirm(true)} className="self-end h-6 w-6 items-center justify-center mb-1">
                <Trash2 size={12} color="#a1a1aa" />
              </Pressable>
              <View className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                {slot.subPlans!.map((subSlot, idx) => (
                  <SubPlanRow
                    key={idx}
                    slot={subSlot}
                    path={[...path, idx]}
                    depth={depth}
                    goal={goal}
                    onUpdateSubPlans={onUpdateSubPlans}
                    onSaveEdit={onSaveEdit}
                    user={user}
                    profile={profile}
                  />
                ))}
              </View>
              <ConfirmationDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => {
                  onUpdateSubPlans(path, undefined);
                  setShowDeleteConfirm(false);
                }}
                title={`Delete ${expansionType} Breakdown`}
                description={`This will remove the entire ${expansionType.toLowerCase()} breakdown. Cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
              />
            </View>
          )}
        </View>
      )}

      <AILoadingPopup isOpen={generating} />
    </View>
  );
}

// ─── Milestone card ──────────────────────────────────────────────────────────
function MilestoneCard({
  slot,
  path,
  milestoneTitle,
  isNext,
  isCompleted,
  isStart,
  onSaveEdit,
}: {
  slot?: AIGeneratedPlanSlot;
  path?: number[];
  milestoneTitle: string;
  isNext?: boolean;
  isCompleted?: boolean;
  isStart?: boolean;
  onSaveEdit?: (p: number[], e: { title: string; task: string; desc: string }, d: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({ title: milestoneTitle || '', task: slot?.dayTask || '', desc: slot?.description || '' });
  const dateStr = slot?.date || '';

  return (
    <View
      className={cn(
        'rounded-xl border p-4 gap-2',
        isStart || isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' : isNext ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'
      )}
    >
      <View className="flex-row items-center gap-2">
        <View
          className={cn(
            'w-5 h-5 rounded-full border items-center justify-center',
            isStart || isCompleted ? 'border-emerald-500 bg-emerald-500/10' : isNext ? 'border-primary bg-primary/20' : 'border-border bg-muted'
          )}
        >
          {isStart ? (
            <Play size={8} color="#34d399" />
          ) : isCompleted ? (
            <Check size={9} color="#34d399" />
          ) : (
            <Text variant="tiny" className={cn('font-black', isNext && 'text-primary')}>
              {path ? path[0] + 1 : ''}
            </Text>
          )}
        </View>

        <View className="flex-1">
          {isEditing && path && slot ? (
            <Input value={editValues.title} onChangeText={(v) => setEditValues((e) => ({ ...e, title: v }))} placeholder="Phase Title" />
          ) : (
            <Text variant="tiny" className={cn('uppercase font-bold', isStart || isCompleted ? 'text-emerald-400' : isNext ? 'text-primary' : undefined)}>
              {milestoneTitle}
            </Text>
          )}
        </View>

        <Text variant="tiny" className="text-primary/70 font-semibold">
          {formatDate(dateStr)}
        </Text>

        {slot && path && onSaveEdit && !isStart && (
          <View>
            {isEditing ? (
              <View className="flex-row gap-0.5">
                <Pressable
                  onPress={() => {
                    onSaveEdit(path, editValues, slot.date);
                    setIsEditing(false);
                  }}
                  className="h-6 w-6 items-center justify-center"
                >
                  <Save size={11} color="#34d399" />
                </Pressable>
                <Pressable onPress={() => setIsEditing(false)} className="h-6 w-6 items-center justify-center">
                  <X size={11} color="#f87171" />
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setIsEditing(true)} className="h-6 w-6 items-center justify-center">
                <Edit3 size={11} color="#a1a1aa" />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {!!slot?.dayTask && (
        <View className="pl-7">
          {isEditing ? (
            <View className="gap-2">
              <Input value={editValues.task} onChangeText={(v) => setEditValues((e) => ({ ...e, task: v }))} placeholder="Task name" />
              <TextInput
                value={editValues.desc}
                onChangeText={(v) => setEditValues((e) => ({ ...e, desc: v }))}
                multiline
                textAlignVertical="top"
                placeholderTextColor="#71717a"
                className="w-full text-xs bg-background border border-border rounded-md p-2 min-h-[48px] text-foreground"
                style={{ includeFontPadding: false }}
              />
            </View>
          ) : (
            <>
              <Text className="text-sm font-semibold text-foreground">{slot.dayTask}</Text>
              {!!slot.description && (
                <Text variant="small" className="mt-1">
                  {slot.description}
                </Text>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export const MasterActionPlan: React.FC<MasterActionPlanProps> = ({ goal, onUpdate }) => {
  const { user } = useAuth();
  const { profile } = useUserProfile(user);

  if (!goal.plans || goal.plans.length === 0) {
    return (
      <View className="p-5">
        <Text variant="small" className="text-center">
          No plan generated yet. Edit the goal to create one.
        </Text>
      </View>
    );
  }

  const sortedPlans = [...goal.plans].sort((a, b) => a.date.localeCompare(b.date));
  // The first not-yet-completed milestone is the "next" one. Resolved up
  // front instead of with a `let nextFound` flag flipped inside the render
  // map below — mutating a variable across iterations of render is exactly
  // what the React Compiler forbids, and findIndex says the same thing.
  const nextIndex = sortedPlans.findIndex(
    (slot) => !goal.milestones?.find((m) => m.targetDate === slot.date)?.completed
  );

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
      const mIdx = newMilestones.findIndex((m) => m.targetDate === date);
      if (mIdx !== -1) newMilestones[mIdx] = { ...newMilestones[mIdx], title: edits.title };
    }
    onUpdate({ ...goal, plans: newPlans, milestones: newMilestones });
  };

  const expansionType = getExpansionType(goal.goalType, 0);

  return (
    <View className="p-4 gap-3">
      <View className="flex-row items-center justify-between mb-1">
        <Text variant="tiny" className="font-bold uppercase tracking-widest">
          Action Plan
        </Text>
        <View className="bg-muted px-2 py-0.5 rounded">
          <Text variant="tiny" className="font-bold">
            {goal.plans.length} milestones
          </Text>
        </View>
      </View>

      <MilestoneCard milestoneTitle="Starting Point" isStart slot={{ date: goal.startDate, dayTask: '', description: '' }} />

      {sortedPlans.map((slot, idx) => {
        const milestone = goal.milestones?.find((m) => m.targetDate === slot.date);
        const isCompleted = milestone?.completed;
        const isNext = idx === nextIndex;

        return (
          <View key={idx} className="gap-2">
            {expansionType && (
              <BreakdownSection
                slot={slot}
                path={[idx]}
                depth={0}
                goal={goal}
                expansionType={expansionType}
                onUpdateSubPlans={handleUpdateSubPlans}
                onSaveEdit={handleSaveEdit}
                user={user}
                profile={profile}
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
          </View>
        );
      })}
    </View>
  );
};
