---
name: capture-to-vault
description: Turn ideas, problems and to-dos from a conversation into Legacy Life Builder Vault notes and reminders. Use for "save this", "remember this", "remind me", "add to my vault", or "brain dump".
---

# Capture to the Vault

Capture fast, keep the user's own words, add structure only where it helps.

## Categories
`ideas`, `problems`, `future`, `nextweek`, `quotes`, `reading`, `resources`.
Notes in `nextweek` appear in the planner Backlog, so use that category for things the user wants to do next week.

## Steps
1. **Split.** One note per thought. A brain dump of five things becomes five notes.
2. **Write each note.**
   - `content`: the user's words, lightly cleaned. Keep numbers, names and links.
   - `title`: a few words, only when it helps scanning.
   - Add `#tags` inside the content for people, projects or goals, for example `#gs-apparel`.
   - `category`: pick the best fit. When unsure, `ideas`.
3. **Save** with `add_vault_note`. Check `get_vault_notes` with a `query` first when it might already exist, and do not create a duplicate.
4. **Reminders.** Only when the user asks to be reminded. Use `set_vault_reminder` with `repeat`: `once` (needs a date), `daily`, `every_2_days`, `weekly`, or `random` for a gentle resurface. Times are the user's local clock.
5. **Edit or tidy.** `update_vault_note` changes a note's wording, category or pin. `get_vault_reminders` lists what will ping, and `delete_vault_reminder` stops one without deleting the note. Delete a note only when asked.
6. **Work for the calendar.** If a note is clearly a task with a time, offer to put it on the week with `place_task` or the Task Library with `create_custom_task`. Do not do it unasked.

## Reply
One line per note saved: category and the first few words. No summary of what they already told you.
