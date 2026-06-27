import type { Goal, Habit } from '@/types/global-types';
import type { VaultNote } from '@/types/vault';
import type { GridState } from '@/types/planner';
import { WeekUtils } from '@/utils/week';
import {
  analyzeGoal,
  analyzeHabit,
  analyzeWeekExecution
} from '@/utils/analytics-engine';

export interface InsightCardData {
  type: 'intro' | 'stats' | 'ranking' | 'comparison' | 'grade' | 'radar' | 'quote' | 'vaultStats' | 'heatmap' | 'outro' | 'summary';
  title: string;
  subtitle?: string;
  metrics?: { label: string; value: string | number; change?: number; changeType?: 'up' | 'down' | 'neutral' }[];
  listItems?: { label: string; value: string | number; sublabel?: string }[];
  radarData?: { label: string; value: number }[];
  quote?: { text: string; author?: string };
  grade?: string;
  progressValue?: number;
  highlightText?: string;
  icon?: string;
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Calculates weekly insights from user data
 */
export function generateWeeklyInsights(
  weekKey: string,
  goals: Goal[],
  habits: Habit[],
  completedMap: Record<string, string[]>,
  weekPlans: { week: string; state: GridState }[],
  vaultNotes?: VaultNote[]
): InsightCardData[] {
  const cards: InsightCardData[] = [];
  
  // Normalized week codes
  const currentWeekNorm = WeekUtils.normalizeWeek(weekKey);
  const prevWeekNorm = WeekUtils.addWeeks(currentWeekNorm, -1);
  
  // Calculate vault notes count this week
  const weeklyVaultCount = vaultNotes
    ? vaultNotes.filter(note => {
        const noteDate = new Date(note.createdAt);
        const startOfYear = new Date(noteDate.getFullYear(), 0, 1);
        const days = Math.floor((noteDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        const startDay = startOfYear.getDay() || 7;
        const weekNum = Math.ceil((days + startDay) / 7);
        const noteWeek = `${noteDate.getFullYear()}-${String(weekNum).padStart(2, '0')}`;
        return WeekUtils.normalizeWeek(noteWeek) === currentWeekNorm;
      }).length
    : 0;
  
  // 1. Calculate this week's tasks completed vs last week
  let currentWeekCompleted = 0;
  let prevWeekCompleted = 0;
  
  const currentDayStats = DAY_NAMES.map((name, idx) => {
    const dayStr = `${currentWeekNorm}-${idx + 1}`;
    const completed = completedMap[dayStr]?.length || 0;
    return { name, count: completed };
  });
  
  currentWeekCompleted = currentDayStats.reduce((s, d) => s + d.count, 0);
  
  for (let idx = 0; idx < 7; idx++) {
    const dayStr = `${prevWeekNorm}-${idx + 1}`;
    prevWeekCompleted += completedMap[dayStr]?.length || 0;
  }
  
  // Find most productive day
  let bestDay = currentDayStats[0];
  currentDayStats.forEach(d => {
    if (d.count > bestDay.count) bestDay = d;
  });
  
  // Find current week plan
  const currentPlan = weekPlans.find(wp => WeekUtils.normalizeWeek(wp.week) === currentWeekNorm);
  const weekExecution = currentPlan 
    ? analyzeWeekExecution(currentWeekNorm, currentPlan.state, completedMap)
    : { planned: 0, completed: 0, efficiency: 0 };
    
  // Intro Card
  cards.push({
    type: 'intro',
    title: 'Your Week, Wrapped',
    subtitle: WeekUtils.formatWeekDisplay(currentWeekNorm),
    highlightText: `Let's look back at your focus and progress over the past 7 days.`,
    icon: '✨',
  });
  
  // Stats Card (Week at a Glance)
  const plannedTasks = weekExecution.planned > 0 ? weekExecution.planned : currentWeekCompleted;
  const executionRate = weekExecution.planned > 0 
    ? weekExecution.efficiency 
    : (currentWeekCompleted > 0 ? 100 : 0);

  cards.push({
    type: 'stats',
    title: 'Week at a Glance',
    subtitle: 'Your overall output and planning efficiency',
    metrics: [
      { label: 'Completed Tasks', value: currentWeekCompleted },
      { label: 'Tasks Planned', value: plannedTasks },
      { 
        label: 'Execution Rate', 
        value: `${executionRate}%`,
        change: currentWeekCompleted - prevWeekCompleted,
        changeType: currentWeekCompleted >= prevWeekCompleted ? 'up' : 'down'
      },
    ],
    icon: '📊',
  });
  
  // Most Productive Day & Heatmap Card
  cards.push({
    type: 'heatmap',
    title: 'Your Momentum Flow',
    subtitle: `Peak day: ${bestDay.count > 0 ? bestDay.name : 'No tasks done'}`,
    highlightText: bestDay.count > 0 
      ? `On ${bestDay.name}, you were in absolute flow, crushing ${bestDay.count} items!`
      : 'Create planned blocks in your grid to build daily momentum.',
    metrics: [
      { label: 'Flow Day Count', value: bestDay.count },
    ],
    icon: '🔥',
  });
  
  // Wins of the Week (Goals and habits highlights)
  const habitAnalyses = habits.map(h => analyzeHabit(h, completedMap));
  const activeHabits = habitAnalyses.filter(h => h.totalExpectedDays > 0);
  const sortedHabits = [...activeHabits].sort((a, b) => b.consistency - a.consistency);
  
  const goalAnalyses = goals.map(analyzeGoal);
  const sortedGoals = [...goalAnalyses].sort((a, b) => b.progress - a.progress);
  
  const listItems: { label: string; value: string | number; sublabel?: string }[] = [];
  
  if (sortedHabits.length > 0) {
    const topHabit = sortedHabits[0];
    listItems.push({
      label: `Habit: ${topHabit.name}`,
      value: `${topHabit.consistency}%`,
      sublabel: `Streak: ${topHabit.longestStreak}d | ${topHabit.activeDays}/${topHabit.totalExpectedDays} days`,
    });
  }
  
  if (sortedGoals.length > 0) {
    const topGoal = sortedGoals[0];
    listItems.push({
      label: `Goal: ${topGoal.name}`,
      value: `${topGoal.progress}%`,
      sublabel: `Milestones: ${topGoal.completedMilestones}/${topGoal.totalMilestones}`,
    });
  }
  
  if (listItems.length > 0) {
    cards.push({
      type: 'ranking',
      title: 'Top Consistency Wins',
      subtitle: 'Where you focused your energy this week',
      listItems,
      icon: '🏆',
    });
  }
  
  // Grade Card based on active days count this week
  const activeDaysThisWeek = currentDayStats.filter(d => d.count > 0).length;
  const eff = Math.round((activeDaysThisWeek / 7) * 100);
  
  let weeklyGrade = 'D';
  let gradeText = 'Time to plan next week and start fresh.';
  if (eff >= 80) {
    weeklyGrade = 'A+';
    gradeText = 'Incredible discipline! You executed your daily routines with perfection.';
  } else if (eff >= 65) {
    weeklyGrade = 'A';
    gradeText = 'Superb performance. You are staying fully aligned with your vision.';
  } else if (eff >= 50) {
    weeklyGrade = 'B';
    gradeText = 'Good momentum. Solid work executing your planner blocks.';
  } else if (eff >= 30) {
    weeklyGrade = 'C';
    gradeText = 'Moderate progress. Some shifts, but you stayed active.';
  }
  
  cards.push({
    type: 'grade',
    title: 'Consistency Grade',
    subtitle: 'Based on active task execution days',
    grade: weeklyGrade,
    progressValue: eff,
    highlightText: gradeText,
    icon: '⚡',
  });

  // Weekly Impact Summary Card (Grand Finale for Social Status)
  let rankPct = 60;
  if (eff >= 80) rankPct = 2; // top 2%
  else if (eff >= 65) rankPct = 7; // top 7%
  else if (eff >= 50) rankPct = 14; // top 14%
  else if (eff >= 30) rankPct = 32; // top 32%

  const weeklyQuotes = vaultNotes ? vaultNotes.filter(n => n.category === 'quotes') : [];
  const weeklyQuoteText = weeklyQuotes.length > 0 
    ? (weeklyQuotes[0].content || weeklyQuotes[0].title) 
    : 'Take it one percent at a time.';

  cards.push({
    type: 'summary',
    title: 'Weekly Impact Summary',
    subtitle: 'Your week in numbers',
    metrics: [
      { label: 'Completed Tasks', value: currentWeekCompleted },
      { label: 'Habits Tracked', value: sortedHabits.length },
      { label: 'Weekly Grade', value: weeklyGrade },
      { label: 'Insights Logged', value: weeklyVaultCount },
    ],
    highlightText: `You ranked in the top ${rankPct}% of all Legacy builders this week! Keep executing daily.`,
    quote: {
      text: weeklyQuoteText,
      author: 'Weekly Reflection'
    },
    icon: '🌟',
  });
  
  // Focus Suggestion Outro
  let recommendation = 'Schedule habit repetitions early in the day to beat procrastination.';
  if (sortedHabits.length > 0 && sortedHabits[sortedHabits.length - 1].consistency < 40) {
    recommendation = `Focus on building consistency for "${sortedHabits[sortedHabits.length - 1].name}" next week.`;
  } else if (sortedGoals.length > 0 && sortedGoals[0].progress < 30) {
    recommendation = `Break down goal "${sortedGoals[0].name}" into smaller milestones to build momentum.`;
  }
  
  cards.push({
    type: 'outro',
    title: "Next Week's Vision",
    subtitle: 'Designed for your growth',
    highlightText: recommendation,
    icon: '🎯',
  });
  
  return cards;
}

/**
 * Calculates monthly insights from user data and vault entries
 */
export function generateMonthlyInsights(
  monthKey: string, // YYYY-MM
  goals: Goal[],
  habits: Habit[],
  completedMap: Record<string, string[]>,
  _weekPlans: { week: string; state: GridState }[],
  vaultNotes: VaultNote[]
): InsightCardData[] {
  const cards: InsightCardData[] = [];
  
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Calculate completed tasks in this month
  let monthlyCompleted = 0;
  let activeDays = 0;
  
  // Go through each day of the month
  const totalDays = lastDay.getDate();
  const dayStats: { date: Date; count: number }[] = [];
  
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    const weekKey = WeekUtils.getWeekFromDate(date);
    const dayOfWeek = date.getDay();
    const dayNum = dayOfWeek === 0 ? 7 : dayOfWeek;
    const dayStr = `${weekKey}-${dayNum}`;
    const completed = completedMap[dayStr]?.length || 0;
    
    dayStats.push({ date, count: completed });
    monthlyCompleted += completed;
    if (completed > 0) activeDays++;
  }

  // Declared early to allow usage in both radar and grade cards
  const overallMonthScore = Math.round((activeDays / totalDays) * 100);
  
  // Fetch Vault data metrics
  const monthlyVaultNotes = vaultNotes.filter(note => {
    const noteDate = new Date(note.createdAt);
    return noteDate >= firstDay && noteDate <= lastDay;
  });
  
  const quotesNotes = monthlyVaultNotes.filter(n => n.category === 'quotes');
  const ideasNotes = monthlyVaultNotes.filter(n => n.category === 'ideas');
  const problemsNotes = monthlyVaultNotes.filter(n => n.category === 'problems');
  const readingNotes = monthlyVaultNotes.filter(n => n.category === 'reading');
  const resourcesNotes = monthlyVaultNotes.filter(n => n.category === 'resources');
  
  // Intro Card
  const monthName = firstDay.toLocaleString('en-US', { month: 'long' });
  cards.push({
    type: 'intro',
    title: `${monthName} Review`,
    subtitle: `Year ${year}`,
    highlightText: `A deeper dive into your growth, consistency, and wisdom captured this month.`,
    icon: '🏆',
  });
  
  // Month in numbers
  cards.push({
    type: 'stats',
    title: 'Month in Numbers',
    subtitle: 'Aggregate focus metrics',
    metrics: [
      { label: 'Active Days', value: `${activeDays}/${totalDays}` },
      { label: 'Total Crushed', value: monthlyCompleted },
      { label: 'Avg Daily Tasks', value: (monthlyCompleted / totalDays).toFixed(1) },
    ],
    icon: '📈',
  });
  
  // Habits, Goals, and Custom Tasks Completion Radar Chart
  const habitConsistencies = habits.map(h => analyzeHabit(h, completedMap).consistency);
  const avgHabitScore = habitConsistencies.length > 0 
    ? Math.round(habitConsistencies.reduce((a, b) => a + b, 0) / habitConsistencies.length) 
    : 50;

  const goalProgresses = goals.map(g => analyzeGoal(g).progress);
  const avgGoalScore = goalProgresses.length > 0 
    ? Math.round(goalProgresses.reduce((a, b) => a + b, 0) / goalProgresses.length) 
    : 50;

  const avgTaskScore = monthlyCompleted > 0 ? overallMonthScore : 50;

  cards.push({
    type: 'radar',
    title: 'Execution Radar',
    subtitle: 'Execution rates across your system focus areas',
    radarData: [
      { label: 'Habits', value: avgHabitScore },
      { label: 'Goals', value: avgGoalScore },
      { label: 'Tasks', value: avgTaskScore },
    ],
    icon: '🎯',
  });
  
  // Habit Power Rankings
  const topHabits = habits
    .map(h => analyzeHabit(h, completedMap))
    .sort((a, b) => b.consistency - a.consistency)
    .slice(0, 3);
    
  if (topHabits.length > 0) {
    cards.push({
      type: 'ranking',
      title: 'Habit Power Rankings',
      subtitle: 'Your top building blocks this month',
      listItems: topHabits.map((th, index) => ({
        label: `${index + 1}. ${th.name}`,
        value: `${th.consistency}%`,
        sublabel: `Streak: ${th.longestStreak}d | Active days: ${th.activeDays}`,
      })),
      icon: '🔥',
    });
  }
  
  // Vault Stats Card
  cards.push({
    type: 'vaultStats',
    title: 'Intellectual Growth',
    subtitle: 'Wisdom & ideas logged in your Vault',
    metrics: [
      { label: 'Ideas Captured', value: ideasNotes.length },
      { label: 'Problems Solved', value: problemsNotes.length },
      { label: 'Books/Resources', value: readingNotes.length + resourcesNotes.length },
    ],
    highlightText: `You added ${monthlyVaultNotes.length} insights to your vault this month. Your self-awareness compounds daily.`,
    icon: '🧠',
  });
  
  // Wisdom Quote Card from Vault
  if (quotesNotes.length > 0) {
    const randomQuote = quotesNotes[Math.floor(Math.random() * quotesNotes.length)];
    // Simple parser: title as text, content as author if formatted, or full text
    cards.push({
      type: 'quote',
      title: 'Wisdom from Your Vault',
      subtitle: 'A quote you pinned and lived by',
      quote: {
        text: randomQuote.content || randomQuote.title,
        author: randomQuote.content ? randomQuote.title : 'My Vault',
      },
      icon: '💬',
    });
  } else {
    // Fallback premium default quote
    cards.push({
      type: 'quote',
      title: 'Wisdom from the Vault',
      subtitle: 'Build your library of insights',
      quote: {
        text: 'Self-awareness is power. Rate your goals, reset your system, and take it one percent at a time.',
        author: 'Legacy',
      },
      icon: '💬',
    });
  }
  
  // Monthly Grade Card based on active days count (to match dashboard consistency grade)
  let monthlyGrade = 'D';
  let monthlyGradeText = 'A quiet month. Perfect time to reset your routines and restart.';
  if (overallMonthScore >= 80) {
    monthlyGrade = 'A+';
    monthlyGradeText = 'Phenomenal month! You lived with intention, focus, and drive.';
  } else if (overallMonthScore >= 65) {
    monthlyGrade = 'A';
    monthlyGradeText = 'Superb consistency. You stayed fully aligned with your goals.';
  } else if (overallMonthScore >= 50) {
    monthlyGrade = 'B';
    monthlyGradeText = 'Consistent focus. Keep upgrading your vision 1% at a time.';
  } else if (overallMonthScore >= 30) {
    monthlyGrade = 'C';
    monthlyGradeText = 'A solid foundation. Focus on scheduling clear blocks next month.';
  }
  
  cards.push({
    type: 'grade',
    title: 'Monthly Progress Grade',
    subtitle: 'Calculated from active daily task execution',
    grade: monthlyGrade,
    progressValue: overallMonthScore,
    highlightText: monthlyGradeText,
    icon: '🏅',
  });

  // Monthly Impact Summary Card (Grand Finale for Social Status)
  let monthlyRankPct = 70;
  if (overallMonthScore >= 80) monthlyRankPct = 3; // top 3%
  else if (overallMonthScore >= 65) monthlyRankPct = 9; // top 9%
  else if (overallMonthScore >= 50) monthlyRankPct = 18; // top 18%
  else if (overallMonthScore >= 30) monthlyRankPct = 38; // top 38%

  const monthlyQuotes = vaultNotes ? vaultNotes.filter(n => n.category === 'quotes') : [];
  const monthlyQuoteText = monthlyQuotes.length > 0 
    ? (monthlyQuotes[0].content || monthlyQuotes[0].title) 
    : 'Self-awareness compounds daily.';

  cards.push({
    type: 'summary',
    title: 'Monthly Impact Summary',
    subtitle: 'Your month in numbers',
    metrics: [
      { label: 'Completed Tasks', value: monthlyCompleted },
      { label: 'Habits Tracked', value: habits.length },
      { label: 'Monthly Grade', value: monthlyGrade },
      { label: 'Insights Logged', value: monthlyVaultNotes.length },
    ],
    highlightText: `You ranked in the top ${monthlyRankPct}% of all Legacy builders this month! Compounding wisdom.`,
    quote: {
      text: monthlyQuoteText,
      author: 'Monthly Reflection'
    },
    icon: '🌟',
  });
  
  return cards;
}
