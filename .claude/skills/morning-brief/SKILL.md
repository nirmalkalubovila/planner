---
name: morning-brief
description: A short brief for today in Legacy Life Builder. Use for "brief me", "what's on today", "plan my day", or when running as the daily morning routine.
---

# Morning brief

Keep it short enough to read in thirty seconds. This skill reads and advises; it changes nothing unless the user asks.

## 1. Read
1. `get_overview`: today's blocks with status, the week's outcomes and the goal list in one call. Use `get_day` when you need the full detail (it reports the user's own date as `userToday`).
2. `get_weekly_outcomes` for this week.
3. `get_completions` for yesterday: what was left undone.
4. `get_missed_tasks`: the backlog.

## 2. Brief, in this order
1. **Today's three.** Pick at most three blocks that move this week's outcomes the most, goal work before habits. Name them with their times.
2. **Carried over.** Yesterday's undone goal blocks and any backlog item that matters, one line each.
3. **Watch-outs.** Back-to-back blocks with no break, a block that clashes with a habit, a day over the hour budget, or an empty day. Only mention real ones.
4. **One line** on how it connects to the week's outcomes.

## 3. Offer, do not do
If something was left undone, offer one fix in a single line: move it into a free slot today (`move_task` or `restore_missed_task`) or defer it (`add_missed_task`). Wait for a yes.

No pep talk and no filler. If today is empty, say that and offer to place the top backlog item.
