import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  extractCustomTasksFromPlans,
  generateWeeklyInsights,
  generateMonthlyInsights,
  generateWeeklyWins,
  generateMonthlyWins,
  generateMilestoneInsightCard,
} from '@/utils/insights-engine';
import { MILESTONE_STAGES } from '@/utils/milestone-engine';
import type { Goal, Habit, CustomTask } from '@/types/global-types';
import type { GridState, PlanSlot } from '@/types/planner';
import type { VaultNote } from '@/types/vault';

// Golden-value tests for the insights engine. The two "generate*" families
// (Weekly/Monthly Insights, Weekly/Monthly Wins) are large orchestration
// functions with many internal branches — rather than hand-asserting every
// field, we snapshot their output for a fixed, realistic input set. Any
// future change to their behavior (intentional or not) will show up as a
// snapshot diff during the @llb/core extraction.

const FIXED_NOW = new Date(2026, 7, 23, 12, 0, 0); // 2026-08-23 (Sunday, week 2026-34)

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});
afterEach(() => {
  vi.useRealTimers();
});

const goals: Goal[] = [
  {
    id: 'g1', title: 'Launch v2', name: 'Launch v2', purpose: 'Ship the redesign',
    startDate: '2026-01-01', endDate: '2026-12-31', goalType: 'Year', bucket: 'income',
    milestones: [
      { id: 'm1', title: 'Design', targetDate: '2026-03-01', completed: true },
      { id: 'm2', title: 'Build', targetDate: '2026-06-01', completed: true },
      { id: 'm3', title: 'Ship', targetDate: '2026-12-01', completed: false },
    ],
  },
];

const habits: Habit[] = [
  { id: 'h1', name: 'Morning Run', startTime: '06:00', endTime: '07:00', bucket: 'recovery', daysOfWeek: ['Monday', 'Wednesday', 'Friday'] },
];

const customTasks: CustomTask[] = [
  { id: 'c1', name: 'Read', startTime: '20:00', endTime: '20:30', daysOfWeek: [], bucket: 'asset' },
];

const weekState: GridState = {
  '0-0': { type: 'goal', name: 'Launch v2', goalId: 'g1' } as PlanSlot,
  '0-1': { type: 'goal', name: 'Launch v2', goalId: 'g1' } as PlanSlot,
  '2-12': { type: 'habit', name: 'Morning Run' } as PlanSlot,
} as GridState;

const weekPlans = [
  { week: '2026-34', state: weekState },
  { week: '2026-33', state: {} as GridState },
];

const completedMap: Record<string, string[]> = {
  '2026-34-1': ['goal-Launch v2-0'],
  '2026-34-3': ['habit-Morning Run-24'],
};

const vaultNotes: VaultNote[] = [
  { id: 'n1', title: 'Idea', content: 'Ship faster', category: 'ideas', tags: [], is_pinned: false, is_draft: false, createdAt: '2026-08-20T00:00:00Z' },
];

describe('extractCustomTasksFromPlans', () => {
  it('picks up grid slots and reminders that carry an explicit bucket', () => {
    // Note: a slot only contributes if it has `bucket` set directly on it —
    // a goal slot that only carries a goalId (bucket lives on the Goal
    // record, resolved elsewhere) is NOT picked up here.
    const planWithReminder: GridState = {
      '5-5': { type: 'custom', name: 'Deep Work', bucket: 'income' } as PlanSlot,
      reminders: [{ name: 'Call the bank', bucket: 'income' }],
    } as GridState;

    const result = extractCustomTasksFromPlans(
      [{ week: '2026-34', state: planWithReminder }],
      customTasks
    );

    const names = result.map((t) => t.name).sort();
    expect(names).toEqual(['Call the bank', 'Deep Work', 'Read']);
  });

  it('ignores grid slots with no explicit bucket, even goal-linked ones', () => {
    const result = extractCustomTasksFromPlans(
      [{ week: '2026-34', state: weekState }],
      customTasks
    );
    const names = result.map((t) => t.name).sort();
    expect(names).toEqual(['Read']); // only the registry task survives
  });

  it('returns just the registry tasks when there are no week plans', () => {
    const result = extractCustomTasksFromPlans([], customTasks);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Read');
  });

  it('returns an empty array for no input at all', () => {
    expect(extractCustomTasksFromPlans([], [])).toEqual([]);
  });
});

describe('generateWeeklyInsights', () => {
  it('matches the golden snapshot for a representative week', () => {
    const cards = generateWeeklyInsights('2026-34', goals, habits, completedMap, weekPlans, vaultNotes, customTasks);
    expect(cards).toMatchSnapshot();
  });
});

describe('generateMonthlyInsights', () => {
  it('matches the golden snapshot for a representative month', () => {
    const cards = generateMonthlyInsights('2026-08', goals, habits, completedMap, weekPlans, vaultNotes, customTasks);
    expect(cards).toMatchSnapshot();
  });
});

describe('generateWeeklyWins', () => {
  it('matches the golden snapshot for a representative week', () => {
    const wins = generateWeeklyWins('2026-34', goals, habits, completedMap, weekPlans, vaultNotes);
    expect(wins).toMatchSnapshot();
  });
});

describe('generateMonthlyWins', () => {
  it('matches the golden snapshot for a representative month', () => {
    const wins = generateMonthlyWins('2026-08', goals, habits, completedMap, weekPlans, vaultNotes);
    expect(wins).toMatchSnapshot();
  });
});

describe('generateMilestoneInsightCard', () => {
  it('builds a milestone card from a stage definition', () => {
    const stage = MILESTONE_STAGES[0];
    const card = generateMilestoneInsightCard(stage, 12, 7);
    expect(card).toEqual({
      type: 'milestone',
      title: `Stage ${stage.stageNumber}: ${stage.title}`,
      subtitle: `${stage.days}-Day Consistent Milestone`,
      highlightText: stage.description,
      milestoneData: {
        stageNumber: stage.stageNumber,
        streakDays: stage.days,
        totalDaysExecuted: 12,
        stageTitle: stage.title,
        stageSubtitle: stage.subtitle,
        stageDescription: stage.description,
      },
      metrics: [
        { label: 'Milestone Streak', value: `${stage.days} Days` },
        { label: 'Current Streak', value: '7 Days' },
        { label: 'Total Executed', value: '12 Days' },
      ],
      quote: {
        text: 'Consistency is the architect of your future self.',
        author: 'Legacy Life Builder',
      },
      icon: stage.iconName,
    });
  });
});
