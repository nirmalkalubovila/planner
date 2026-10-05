---
name: reset-week
description: Make an overloaded or derailed week realistic again in Legacy Life Builder by deferring what will not fit, never deleting it. Use for "I'm behind", "this week fell apart", "reset my week", or "too much on my plate".
---

# Reset the week

Work is kept, never destroyed. What does not fit goes to the Missed Library and comes back later.

## 1. Read
1. `get_day` for today and `get_week_plan` for this week.
2. `get_completions` from Monday to today.
3. `get_profile`: the daily hour budget and sleep.
4. `get_weekly_outcomes` and `get_goals`.

## 2. Work out what is realistic
- Hours still available from now to Sunday, minus sleep and habits, capped at the daily budget.
- Rank the remaining goal blocks:
  1. blocks that serve this week's outcomes;
  2. blocks on goals with an overdue milestone;
  3. everything else.
- Keep ranked items until the available hours are about 80 percent used. The rest is deferred.

## 3. Propose before changing
Show a short plan: **Keep** (with new times if they moved), **Move** (from, to) and **Defer** (will go to the Missed Library). Ask for a yes. In an unattended run, do only the safe part: defer blocks that have already passed and are not done.

## 4. Apply
- Keep and move: `move_task`.
- Defer: `add_missed_task` first (original date and goal in the description), then `remove_task`. Never remove before the library entry exists.
- Past blocks that were never done: `add_missed_task`, nothing to remove.
- Re-check with `get_week_plan` that nothing overlaps.

## 5. Close
Three short lines: kept, moved, deferred. If this week's outcomes are no longer reachable, offer to reword them with `set_weekly_outcomes`. Do not do it unasked.
