---
name: goal-health-audit
description: Audit every goal in Legacy Life Builder for missing plans, overdue milestones and goals with no work scheduled. Use for "how are my goals", "audit my goals", "what's off track", or a monthly check.
---

# Goal health audit

Find what is broken or drifting, fix what is safe, ask about the rest.

## 1. Read
`get_goals`, `get_stats` (28 days), `get_completions` for the last 14 days, `get_profile`.

## 2. Check each goal
| Check | Signal | Safe fix |
|---|---|---|
| No plan | `hasPlan` false, or the plan outline says "not broken down yet" | `set_goal_plan` |
| Current month has no weeks | outline shows weeks "not planned yet" for this month | `plan_goal_weeks` |
| Missing context | goal has no clear title, or a name full of `&amp;` or label text | `update_goal` with `title`, `currentState`, `ultimateGoal`, `constraints`, `why` (ask the user for facts you do not have) |
| No bucket | bucket shows MISSING | ask, then `update_goal` |
| Overdue milestone | `overdueMilestones` not empty | propose a new date, then `update_milestone` |
| A phase reads wrong | a year, month or week has a vague title or the wrong hours | `update_goal_plan_item` (find it by title or a date inside it) |
| No work scheduled | `plannedHours` is 0 for the period | offer to schedule it (`weekly-review-and-plan`) |
| Low follow-through | `executionRatePercent` under 50 | name the likely cause (too much, wrong time of day) and propose one change |

## 3. Act
- Do the safe fixes (missing plan, missing weeks) without asking.
- Ask before changing any date, title or bucket.
- Never delete a goal. If one looks dead, ask whether to keep, pause or delete it, and only delete on a clear yes.

## 4. Report
A short table: goal, status (healthy / needs attention / broken), what you did, what you need from the user. End with the single most valuable next step.
