---
name: evening-close
description: Close out today in Legacy Life Builder. Use when the user says what they finished or skipped today, "close my day", "check in", or when running as the daily evening routine. Ticks finished blocks and moves leftovers.
---

# Evening close

The user's words decide what is done. Never tick a block they did not say they finished.

## 1. Read
`get_day` for today. Note each block's `status`: done, missed (ended, not ticked) or pending.

## 2. Ask once, in one message
List the goal and habit blocks that are not done and ask which ones were actually finished. If the user already told you, skip the question. Unattended runs make no changes to completion: report only (step 5).

## 3. Tick
For every block the user says they finished, call `complete_task` with the date and either its time or name. If they say a block was ticked by mistake, use `uncomplete_task`.

## 4. Move the rest, one choice per block
For each undone goal block, offer the best of:
- **Tomorrow**: find a free slot with `get_week_plan`, then `move_task`.
- **Later this week**: same, on a lighter day.
- **Backlog**: `add_missed_task` (put the original date and goal in the description), then `remove_task`. Never delete the work and never rename it with a "MISSED" prefix.
Habits that were skipped are not moved. They happen again on their next day.

Apply the user's choice. If they say "you decide", move to tomorrow when it fits within the hour budget, otherwise to the backlog.

## 5. Close
Two lines at most: done versus planned today, and what moved where. If the day went well, say so once. If nothing was planned, say that.
