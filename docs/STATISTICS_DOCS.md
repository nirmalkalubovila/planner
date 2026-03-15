# Statistics & Analytics — Documentation

## Overview

The statistics dashboard is a two-tab view (Summary / Detailed) that visualizes the user's performance across goals, habits, and weekly execution. All data comes from real Supabase tables — no mock data.

---

## Database Tables Used

| Table | Key Columns | How It's Used |
|---|---|---|
| **goals** | `id`, `user_id`, `name`, `startDate`, `endDate`, `milestones` (JSONB array of `{id, title, targetDate, completed}`) | Each goal's progress = completed milestones / total milestones. Velocity multiplier compares progress against elapsed time. |
| **habits** | `id`, `user_id`, `name`, `daysOfWeek` (string array like `["Monday","Wednesday"]`), `startTime`, `endTime` | Consistency is calculated by checking which scheduled days appear in `completed_tasks` over a 30-day rolling window. |
| **completed_tasks** | `user_id`, `dayStr` (YYYY-MM-DD), `taskIds` (string array) | The central completion log. Each day stores an array of task/habit IDs that were marked done. Used by both habit consistency and the heatmap. |
| **week_plans** | `user_id`, `week` (string key), `state` (JSONB `Record<string, PlanSlot>`) | Each key in `state` is a `"dayIdx-slotIdx"` representing a planned 30-min slot. The count of keys = planned tasks for that week. |
| **user_stats_cache** | `user_id`, `consistency_grade`, `habit_heatmap`, `top_goal`, `bio_sync`, `predictive_burnout_warning` | Optional pre-aggregated row. If it exists, the Summary tab renders instantly from it. If not, stats are computed on-the-fly from the tables above. |

---

## Indicators & Calculations

### 1. Life Trajectory Score (0–100%)

The headline metric. Weighted composite of three dimensions:

```
Total = (Goal Score × 40%) + (Habit Score × 35%) + (Execution Score × 25%)
```

| Component | Weight | Formula |
|---|---|---|
| Goal Score | 40% | Average of all goals' `(completed_milestones / total_milestones) × velocity_multiplier × 100` |
| Habit Score | 35% | Average of all habits' 30-day consistency percentage |
| Execution Score | 25% | Average weekly efficiency `(completed_tasks / planned_slots) × 100` |

### 2. Goal Progress (per goal)

```
progress = (completed_milestones / total_milestones) × 100
```

- **Velocity Multiplier**: How fast you're progressing vs. calendar time.
  ```
  time_ratio  = (now - startDate) / (endDate - startDate)
  progress_ratio = completed_milestones / total_milestones
  velocity = progress_ratio / time_ratio       (capped at 2.0)
  ```
  - `> 1.0` = ahead of schedule
  - `= 1.0` = on track
  - `< 1.0` = behind schedule

### 3. Habit Consistency (per habit)

Over a 30-day rolling window:

```
consistency = (days_completed / days_expected) × 100
```

- `days_expected`: only counts days matching the habit's `daysOfWeek` schedule.
- `days_completed`: days where the habit's `id` (or `habit-{id}`) appears in `completed_tasks.taskIds`.
- **Longest Streak**: consecutive expected days that were completed.
- **Color coding**: Green (>80%), Amber (>50%), Red (<50%).

### 4. Weekly Execution Efficiency (per week)

```
efficiency = (total_completed_task_ids / planned_slot_count) × 100
```

- `planned_slot_count` = number of keys in that week's `GridState`.
- `total_completed_task_ids` = sum of all `taskIds` arrays across that week's days in `completed_tasks`.

### 5. Consistency Grade (from cache or computed)

Based on number of active days (days with >0 completed tasks) in the last 30 days:

| Active Days | Grade |
|---|---|
| > 25 | A+ |
| > 20 | A |
| > 15 | B+ |
| > 10 | B |
| > 5 | C |
| > 0 | D |
| 0 | F |

### 6. Burnout Warning

Triggered when:
- Average sleep duration < 6 hours **AND**
- Average daily completed tasks >= 5

Message: *"Pacing required. High output vs. low sleep detected."*

### 7. Bio-Sync

Displays two values from user metadata:
- **Avg Sleep**: from `user.user_metadata.sleepDuration` (hours)
- **Avg Tasks/Day**: computed as `total_completed_30d / 30`
- **Correlation text**: positive if sleep >= 7h and avg tasks > 2, warning otherwise.

### 8. 30-Day Heatmap

A grid of 30 squares (one per day) colored by task completion count:
- 0 tasks → empty
- 1 → lightest
- 2 → light
- 3 → medium
- 4+ → darkest

---

## Data Flow Architecture

```
┌─────────────┐   Fast path (single row)    ┌──────────────────┐
│ user_stats_  │ ─────────────────────────►  │  useUserStats()  │ → Summary renders instantly
│ cache table  │   (or fallback to raw)      └──────────────────┘
└─────────────┘
                                             ┌──────────────────────┐
┌─────────────┐                              │ useDetailedAnalytics │
│ goals       │ ──┐                          │   (enabled: bool)    │
│ habits      │ ──┤  Parallel fetch ────────►│                      │ → analytics-engine.ts
│ completed_  │ ──┤                          │  Returns:            │    pure math functions
│   tasks     │ ──┤                          │  - GoalAnalysis[]    │
│ week_plans  │ ──┘                          │  - HabitAnalysis[]   │
└─────────────┘                              │  - WeekExecution[]   │
                                             │  - LifeTrajectory    │
                                             └──────────────────────┘
```

- **useUserStats** fires immediately on page load for the fast Bento grid.
- **useDetailedAnalytics** fires shortly after (deferred) and powers the circular progress charts and the Detailed tab.
- Both hooks use TanStack React Query with `staleTime` for caching.

---

## File Map

```
src/
├── utils/analytics-engine.ts          Pure math: scores, averages, streak calc
├── components/ui/
│   ├── circular-progress.tsx          SVG donut chart component
│   └── feedback-loader.tsx            Glassmorphic loading overlay
└── features/statistics/
    ├── statistics-page.tsx            Page shell (Suspense + PageLoader)
    ├── hooks/
    │   ├── use-user-stats.ts          Fast: reads user_stats_cache or computes from raw tables
    │   └── use-detailed-stats.ts      Heavy: fetches all 4 tables, runs analytics-engine
    ├── components/
    │   ├── performance-dashboard.tsx   Tab wrapper + Oracle header
    │   ├── summary-view.tsx           Macro view: trajectory, circles, heatmap, bio-sync
    │   └── detailed-view.tsx          Micro view: habit-by-habit, goal-by-goal, weekly history
    └── STATISTICS_DOCS.md             This file
```
