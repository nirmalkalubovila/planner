---
name: weekly-review-and-plan
description: Review last week from real completion data and plan next week in Legacy Life Builder. Use for the Sunday planning session, "plan my week", "review my week", or when running as the scheduled weekly routine.
---

# Weekly review and plan

Weeks run Monday to Sunday and times are the user's local clock. Unattended runs make safe choices and report them at the end.

## 1. Read (write nothing yet)
0. `get_overview`: today, the week's outcomes, every goal in brief and what is waiting in the Missed Library.
1. `get_profile`: daily hour budget, sleep, energy peak.
2. `get_goals` and `get_habits`.
3. `get_completions` for last Monday through last Sunday: what was done and missed, per goal and per habit.
4. `get_stats` (28 days): trend, overdue milestones, goals with no plan.
5. `get_missed_tasks`: the Missed Library backlog.
6. `get_week_plan` for next week: what is already scheduled and what is free.
7. `get_weekly_outcomes` for next week. If outcomes already exist, keep them.

## 2. Review
- Done versus missed per goal, and the three habits skipped most.
- Goals behind: overdue milestones, or no work scheduled. Goals with no plan: `set_goal_plan`.
- Do not judge from the schedule. A block is done only if `get_completions` says so.

## 3. Plan next week
1. `set_weekly_outcomes`: 1 to 3 outcomes, in priority order, each tied to a real goal and finishable in a week. The most behind or deadline-critical goal first. Pass `links` so each outcome is linked to its goal or habit, as the app's outcomes dialog does.
   If last week was a good week, `copy_week` can repeat it as a starting point. It skips anything that would clash and reports it.
2. Bring back unfinished work first. For each missed goal block and each Missed Library item that still matters, schedule it with `place_tasks`. Use `restore_missed_task` for library items.
3. Rules for every block:
   - linked to an existing goal with `goalId`, or given a `bucket`;
   - never over sleep or habits, never `allowOverlap`;
   - fill about 70 percent of the free time within the profile's daily budget, lighter on the weekend;
   - keep a week's goal hours at or under weekday target x 5 plus weekend target x 2.
4. Do not invent new goals, habits or next steps. What does not fit goes to the Missed Library with `add_missed_task`, not into a task name.
5. If a milestone cannot realistically be met, re-baseline it with `update_milestone` and say so.

## 4. Final message (short)
- Last week: done vs missed by goal, and the one thing that went best.
- Off track: goals or milestones behind, and why.
- Next week: the outcomes, then the schedule by day (time, task, goal).
- Did not fit: what moved to the Missed Library.
- Changes made: every block placed, milestone moved or library item restored.
