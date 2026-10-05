---
name: month-rollover
description: Plan the weeks of the new month for every Year and Month goal in Legacy Life Builder. Use on the 1st of a month, when a goal's current month shows "not planned yet", or when running as the monthly routine.
---

# Month rollover

Year and Month goals keep only the current month broken into weeks. This fills in the month that just started, using what actually happened last month.

## 1. Read
1. `get_goals`: find goals whose outline shows the current month's weeks as "not planned yet".
2. `get_stats` (60 days) and `get_completions` for last month: real pace per goal.
3. `get_profile`: weekly hour budget.

## 2. For each goal that needs weeks
1. Look at the month's phase: its title and target.
2. Judge last month honestly. If the goal fell behind, carry the unfinished part into the early weeks rather than stacking new work on top.
3. Write one entry per week of the month. The tool reports the exact count if you get it wrong. Each week has:
   - a title with a concrete, measurable result;
   - a one or two sentence description;
   - `estimatedHours` that vary with the week and stay under the weekly budget.
4. If the goal has a numeric target, spread it across the weeks and show the running number in each title.
5. Call `plan_goal_weeks` with `goalId` and any date inside the month. It changes only that month's weeks and leaves the rest of the plan untouched.

## 3. Do not
- Do not call `set_goal_plan` here: it replaces the whole plan.
- Do not plan months other than the current one.
- Do not change dates or milestones. If one is badly off, list it for `goal-health-audit`.

## 4. Report
One line per goal: weeks added, and anything carried over from last month.
